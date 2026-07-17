import axios from 'axios';
import prisma from '../config/database';

/**
 * Assainissement IA du catalogue existant (~7 500 fiches) :
 *   - réécriture des titres (casse, abréviations type "F/ noir reutil av couver")
 *   - description courte + description HTML vendeuse
 *   - SEO (metaTitle, metaDescription, searchTerms)
 *   - re-catégorisation dans l'arborescence existante
 *
 * Fonctionne par lots, reprend où il s'est arrêté (lastProductId), supporte le
 * dry-run (aperçu sans écriture) et un plafond de produits par exécution.
 * Traçé dans CatalogCleanupRun (progression visible au back-office).
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = () => process.env.CLEANUP_MODEL || process.env.AI_IMPORT_MODEL || 'claude-haiku-4-5-20251001';
const BATCH_SIZE = 5; // produits par appel IA (économie de tokens)

let stopRequested = false;

export function requestStop() { stopRequested = true; }

function extraireJson(texte: string): any {
  const debut = texte.indexOf('[') !== -1 && texte.indexOf('[') < (texte.indexOf('{') === -1 ? Infinity : texte.indexOf('{'))
    ? texte.indexOf('[') : texte.indexOf('{');
  if (debut === -1) throw new Error('Réponse IA sans JSON');
  const open = texte[debut];
  const close = open === '[' ? ']' : '}';
  let profondeur = 0;
  for (let i = debut; i < texte.length; i++) {
    if (texte[i] === open) profondeur++;
    if (texte[i] === close) profondeur--;
    if (profondeur === 0) return JSON.parse(texte.slice(debut, i + 1));
  }
  throw new Error('JSON IA incomplet');
}

async function cleanBatch(products: any[], categories: { id: string; name: string }[]) {
  const categoriesTxt = categories.map((c) => `${c.id} :: ${c.name}`).join('\n');
  const produitsTxt = products.map((p, i) =>
    `${i + 1}. id=${p.id}\n   nom actuel: ${p.name}\n   description actuelle: ${(p.description || '').replace(/<[^>]+>/g, ' ').slice(0, 300) || 'aucune'}\n   catégorie actuelle: ${p.category?.name || 'aucune'}\n   prix: ${p.price} €`
  ).join('\n');

  const prompt = `Tu es le responsable catalogue de NeoServ, boutique en ligne en Guadeloupe.
Voici ${products.length} fiches produit existantes à ASSAINIR (titres abrégés, casse incohérente, pas de SEO).

## Catégories disponibles (id :: nom)
${categoriesTxt}

## Fiches à assainir
${produitsTxt}

## Règles STRICTES
1. N'invente AUCUNE caractéristique : reformule uniquement ce qui est présent.
2. name : titre commercial français propre, max 70 caractères, casse normale (pas de MAJUSCULES intégrales), abréviations développées si évidentes ("F/" → "fond", "av couver" → "avec couvercle"), sinon conservées.
3. shortDescription : 1 phrase de vente honnête (max 150 caractères).
4. descriptionHtml : 40-100 mots en HTML simple (<p>, <ul>, <li>). Si les données sont trop pauvres, décris sobrement sans broder.
5. categoryId : l'id le PLUS pertinent de la liste (garde la catégorie actuelle si aucune n'est meilleure).
6. searchTerms : 6-12 termes de recherche (synonymes, fautes courantes, créole si pertinent).
7. metaTitle (max 65 car.) et metaDescription (max 155 car.).

Réponds UNIQUEMENT avec un tableau JSON :
[{"id":"","name":"","shortDescription":"","descriptionHtml":"","categoryId":"","searchTerms":[],"metaTitle":"","metaDescription":""}]`;

  const r = await axios.post(ANTHROPIC_URL, {
    model: MODEL(),
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  }, {
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    timeout: 90000,
  });

  const texte = r.data?.content?.[0]?.text || '';
  const arr = extraireJson(texte);
  return Array.isArray(arr) ? arr : [];
}

export async function getCleanupStatus() {
  const run = await prisma.catalogCleanupRun.findFirst({ orderBy: { createdAt: 'desc' } });
  return run;
}

/**
 * Lance (ou reprend) l'assainissement.
 * @param dryRun true → n'écrit rien, stocke juste la progression d'analyse
 * @param maxProducts plafond pour cette exécution (contrôle du budget IA)
 */
export async function startCleanup(params: { dryRun: boolean; maxProducts: number; startedById?: string | null }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY manquante — l'assainissement IA nécessite la clé API");
  }
  const active = await prisma.catalogCleanupRun.findFirst({ where: { status: 'RUNNING' } });
  if (active) throw new Error('Un assainissement est déjà en cours');

  stopRequested = false;
  const totalProducts = await prisma.product.count({ where: { status: { not: 'DRAFT' } } });

  const run = await prisma.catalogCleanupRun.create({
    data: {
      dryRun: params.dryRun,
      totalProducts: Math.min(totalProducts, params.maxProducts),
      startedById: params.startedById || null,
    },
  });

  // Traitement en arrière-plan
  setImmediate(() => executeCleanup(run.id, params).catch(async (e) => {
    await prisma.catalogCleanupRun.update({
      where: { id: run.id },
      data: { status: 'FAILED', error: String(e.message || e).slice(0, 900), finishedAt: new Date() },
    }).catch(() => undefined);
  }));

  return run;
}

async function executeCleanup(runId: string, params: { dryRun: boolean; maxProducts: number }) {
  const categories = await prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
  const catIds = new Set(categories.map((c) => c.id));

  let processed = 0, updated = 0, failed = 0;
  let cursor: string | undefined;

  while (processed < params.maxProducts && !stopRequested) {
    const batch = await prisma.product.findMany({
      where: { status: { not: 'DRAFT' } },
      include: { category: { select: { name: true } } },
      orderBy: { id: 'asc' },
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (!batch.length) break;
    cursor = batch[batch.length - 1].id;

    try {
      const results = await cleanBatch(batch, categories);
      for (const r of results) {
        const original = batch.find((p) => p.id === r.id);
        if (!original) continue;
        processed++;

        if (!params.dryRun) {
          try {
            await prisma.product.update({
              where: { id: r.id },
              data: {
                name: String(r.name || original.name).slice(0, 120),
                shortDescription: String(r.shortDescription || '').slice(0, 200) || original.shortDescription,
                description: String(r.descriptionHtml || original.description || ''),
                ...(r.categoryId && catIds.has(r.categoryId) ? { categoryId: r.categoryId } : {}),
                searchTerms: Array.isArray(r.searchTerms) ? r.searchTerms.slice(0, 15).map(String) : original.searchTerms,
                metaTitle: String(r.metaTitle || r.name || '').slice(0, 70),
                metaDescription: String(r.metaDescription || '').slice(0, 160) || original.metaDescription,
              },
            });
            updated++;
          } catch { failed++; }
        }
      }
      // Comptabilise aussi les produits du lot sans résultat IA
      processed += Math.max(0, batch.length - results.length);
    } catch (e: any) {
      failed += batch.length;
      processed += batch.length;
      console.error('[cleanup] lot en échec:', e.message);
    }

    await prisma.catalogCleanupRun.update({
      where: { id: runId },
      data: { processed, updated, failed, lastProductId: cursor },
    });

    await new Promise((r) => setTimeout(r, 800)); // anti rate-limit
  }

  await prisma.catalogCleanupRun.update({
    where: { id: runId },
    data: { status: stopRequested ? 'PAUSED' : 'DONE', finishedAt: new Date() },
  });
}
