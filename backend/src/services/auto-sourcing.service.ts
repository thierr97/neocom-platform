import cron from 'node-cron';
import prisma from '../config/database';
import { searchAliExpressProducts } from './connectors/aliexpress.connector';
import { processJob, approveJob } from './sourcing.service';

/**
 * Auto-sourcing : le catalogue se remplit tout seul.
 *
 * Plusieurs fois par jour, ce service :
 *   1. cherche des produits populaires sur AliExpress (ds.text.search) en
 *      faisant tourner un pool de mots-clés couvrant les niches de la boutique ;
 *   2. écarte les doublons (produits déjà importés ou déjà tentés) ;
 *   3. passe chaque produit dans le pipeline d'import IA existant
 *      (fiche FR, prix par règles de marge, catégorie auto-créée si besoin) ;
 *   4. auto-publie les fiches dont le score qualité atteint le seuil —
 *      les autres restent en file de validation manuelle (admin/import-ia).
 *
 * Configuration persistée dans la table settings (clé auto_sourcing_config),
 * modifiable via l'API admin /api/sourcing/auto. Coupe-circuit d'urgence :
 * AUTO_SOURCING_ENABLED=0 dans l'environnement.
 */

const SETTINGS_KEY = 'auto_sourcing_config';
const REVIEWER = 'AUTO_SOURCING';

/** Pool de mots-clés par défaut — électronique, maison, mode, beauté/bien-être. */
const DEFAULT_KEYWORDS = [
  // Électronique & accessoires
  'coque iphone', 'chargeur sans fil', 'ecouteurs bluetooth', 'montre connectee',
  'support telephone voiture', 'cable usb c', 'mini projecteur', 'clavier gamer',
  'lampe led usb', 'batterie externe', 'camera surveillance wifi', 'enceinte bluetooth',
  // Maison & déco
  'organisateur cuisine', 'lampe chevet tactile', 'rangement salle de bain', 'tapis antiderapant',
  'guirlande lumineuse', 'diffuseur huiles essentielles', 'etagere murale', 'boite rangement pliable',
  'accessoire cuisine gadget', 'rideau lumineux', 'horloge murale design', 'plaid doux',
  // Mode & bijoux
  'collier femme acier', 'bracelet homme cuir', 'montre femme elegante', 'sac bandouliere femme',
  'lunettes soleil polarisees', 'boucles oreilles argent', 'casquette baseball', 'portefeuille homme cuir',
  'echarpe femme hiver', 'ceinture homme automatique',
  // Beauté & bien-être
  'rouleau jade visage', 'brosse nettoyante visage', 'accessoire manucure', 'masseur cervical',
  'pistolet massage musculaire', 'elastique fitness', 'bouteille sport infuseur', 'lampe luminotherapie',
  'organisateur maquillage', 'huile essentielle aromatherapie',
  // Élargissement (plus de couverture = plus de produits uniques)
  'coque samsung', 'coque xiaomi', 'protection ecran verre trempe', 'anneau maintien telephone',
  'trepied telephone', 'micro cravate', 'stabilisateur telephone', 'lampe annulaire selfie',
  'hub usb c', 'adaptateur hdmi', 'ventilateur usb portable', 'humidificateur air',
  'veilleuse enfant', 'reveil numerique', 'balance cuisine', 'thermometre cuisine',
  'set couteaux cuisine', 'planche decouper', 'gourde isotherme', 'sac isotherme',
  'tapis yoga', 'corde a sauter', 'gants musculation', 'brassard telephone sport',
  'porte cle cuir', 'chaussettes homme', 'bonnet hiver', 'gants tactiles',
  'trousse maquillage', 'miroir grossissant led', 'tondeuse nez', 'lime electrique',
  'jouet chien', 'gamelle chat', 'harnais chien', 'brosse poil animaux',
  'outil multifonction', 'lampe torche led', 'metre laser', 'organiseur voiture',
  'support tablette', 'stylet tablette', 'coque airpods', 'chargeur induction',
  'guirlande solaire jardin', 'arrosoir automatique', 'gants jardinage', 'sac rangement sous vide',
];

export interface AutoSourcingConfig {
  enabled: boolean;
  dailyLimit: number;       // nouveaux produits max par jour
  batchSize: number;        // max importés par exécution du cron
  minConfidence: number;    // score ≥ → auto-publication
  minItemScore: number;     // note AliExpress minimale (étoiles)
  minPriceEur: number;      // écarte les produits gadgets < 1 €
  maxPriceEur: number;      // écarte les produits trop chers pour la cible
  keywords: string[];
  cursor: number;           // rotation dans le pool de mots-clés
  page: number;             // page de recherche courante (avance à chaque tour complet)
}

const DEFAULTS: AutoSourcingConfig = {
  enabled: true,
  dailyLimit: 1000,   // remplissage rapide du catalogue (images en mode source = gratuit)
  batchSize: 60,      // par exécution du cron
  minConfidence: 70,
  minItemScore: 4.3,
  minPriceEur: 1.5,
  maxPriceEur: 120,
  keywords: DEFAULT_KEYWORDS,
  cursor: 0,
  page: 1,
};

let running = false;
let lastRun: { at: Date; searched: number; imported: number; published: number; errors: number } | null = null;

export async function getAutoSourcingConfig(): Promise<AutoSourcingConfig> {
  try {
    const row = await prisma.settings.findUnique({ where: { key: SETTINGS_KEY } });
    if (row) return { ...DEFAULTS, ...(JSON.parse(row.value) as Partial<AutoSourcingConfig>) };
  } catch (e: any) {
    console.error('[auto-sourcing] lecture config:', e.message);
  }
  return { ...DEFAULTS };
}

export async function saveAutoSourcingConfig(patch: Partial<AutoSourcingConfig>): Promise<AutoSourcingConfig> {
  const merged = { ...(await getAutoSourcingConfig()), ...patch };
  await prisma.settings.upsert({
    where: { key: SETTINGS_KEY },
    update: { value: JSON.stringify(merged), type: 'json' },
    create: { key: SETTINGS_KEY, value: JSON.stringify(merged), type: 'json' },
  });
  return merged;
}

export function autoSourcingStatus() {
  return { running, lastRun };
}

/** Nombre de produits auto-importés depuis minuit (limite journalière). */
async function importedToday(): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return prisma.importJob.count({
    where: { createdById: REVIEWER, createdAt: { gte: startOfDay } },
  });
}

/** Le produit a-t-il déjà été importé ou tenté ? */
async function alreadyKnown(externalId: string): Promise<boolean> {
  const [source, job] = await Promise.all([
    prisma.dropshipSource.findFirst({ where: { platform: 'ALIEXPRESS', externalId }, select: { id: true } }),
    prisma.importJob.findFirst({ where: { platform: 'ALIEXPRESS', externalId }, select: { id: true } }),
  ]);
  return Boolean(source || job);
}

/** Une exécution : découverte → import IA → auto-publication. */
export async function runAutoSourcingOnce(): Promise<{ searched: number; imported: number; published: number; errors: number }> {
  const result = { searched: 0, imported: 0, published: 0, errors: 0 };
  if (running) return result;
  running = true;

  try {
    const config = await getAutoSourcingConfig();
    if (!config.enabled || process.env.AUTO_SOURCING_ENABLED === '0') {
      console.log('[auto-sourcing] désactivé (config ou AUTO_SOURCING_ENABLED=0)');
      return result;
    }

    const already = await importedToday();
    const budget = Math.min(config.batchSize, Math.max(0, config.dailyLimit - already));
    if (budget <= 0) {
      console.log(`[auto-sourcing] limite journalière atteinte (${already}/${config.dailyLimit})`);
      return result;
    }

    let cursor = config.cursor;
    let page = config.page;
    const keywords = config.keywords.length ? config.keywords : DEFAULT_KEYWORDS;

    // Parcourt les mots-clés jusqu'à consommer le budget du lot
    for (let tried = 0; tried < keywords.length && result.imported < budget; tried++) {
      const keyword = keywords[cursor % keywords.length];
      cursor++;
      if (cursor % keywords.length === 0) page = page >= 20 ? 1 : page + 1; // tour complet → page suivante (jusqu'à 20 pages de profondeur)

      let items;
      try {
        items = await searchAliExpressProducts(keyword, page, 20);
        result.searched += items.length;
      } catch (e: any) {
        console.error(`[auto-sourcing] recherche "${keyword}":`, e.message);
        result.errors++;
        continue;
      }

      const candidates = items.filter((i) =>
        (i.score === null || i.score >= config.minItemScore)
        && (i.salePriceEur === null || (i.salePriceEur >= config.minPriceEur && i.salePriceEur <= config.maxPriceEur)),
      );

      for (const item of candidates) {
        if (result.imported >= budget) break;
        if (await alreadyKnown(item.itemId)) continue;

        try {
          const job = await prisma.importJob.create({
            data: {
              platform: 'ALIEXPRESS',
              externalId: item.itemId,
              sourceUrl: `https://www.aliexpress.com/item/${item.itemId}.html`,
              createdById: REVIEWER,
            },
          });
          await processJob(job.id);
          result.imported++;

          const done = await prisma.importJob.findUnique({ where: { id: job.id } });
          if (done?.status === 'DRAFT' && (done.confidence ?? 0) >= config.minConfidence) {
            const approved = await approveJob({ jobId: job.id, reviewedBy: REVIEWER, publishNow: true });
            if (approved.imagesImported === 0) {
              // Jamais de produit visible sans photo : retour en validation manuelle
              await prisma.product.update({
                where: { id: approved.product.id },
                data: { isVisible: false, status: 'DRAFT' },
              });
              await prisma.importJob.update({ where: { id: job.id }, data: { status: 'DRAFT' } });
              console.warn(`[auto-sourcing] ${item.itemId} : aucune image importée → laissé en brouillon`);
            } else {
              result.published++;
            }
          }
        } catch (e: any) {
          console.error(`[auto-sourcing] import ${item.itemId}:`, e.message);
          result.errors++;
        }
        await new Promise((r) => setTimeout(r, 700)); // espacement API IA + AliExpress
      }
    }

    await saveAutoSourcingConfig({ cursor: cursor % keywords.length, page });
    console.log(`[auto-sourcing] terminé : ${result.searched} trouvés, ${result.imported} importés, ${result.published} publiés, ${result.errors} erreurs`);
  } finally {
    running = false;
    lastRun = { at: new Date(), ...result };
  }
  return result;
}

/** À appeler au démarrage du serveur. */
export function scheduleAutoSourcing() {
  if (process.env.AUTO_SOURCING_ENABLED === '0') {
    console.log('[auto-sourcing] planification désactivée (AUTO_SOURCING_ENABLED=0)');
    return;
  }
  // 4 lots par jour → ~50 produits/jour avec batchSize 15 et limite journalière 50
  const expr = process.env.AUTO_SOURCING_CRON || '40 2,8,14,20 * * *';
  cron.schedule(expr, () => {
    runAutoSourcingOnce().catch((e) => console.error('[auto-sourcing]', e.message));
  });
  console.log(`[auto-sourcing] planifié : ${expr}`);
}
