import prisma from '../config/database';
import cloudinary from '../config/cloudinary';
import { getConnector, platformFromUrl, PlatformKey, NormalizedSupplierProduct } from './connectors';
import { analyzeWithAI, ExtractedSource, ProductProposal } from './ai-import.service';
import { computeSalePrice } from './dropship-pricing.service';
import { guessCategory, FALLBACK_CATEGORY } from './category-guess';

/**
 * Orchestrateur du pipeline d'import IA :
 *   1. Acquisition   — connecteur plateforme (API ou extraction URL)
 *   2. Enrichissement— IA (titre FR, description HTML, SEO, catégorie, tags)
 *   3. Prix          — moteur de règles de marge + arrondi psychologique
 *   4. Brouillon     — produit créé MASQUÉ (status DRAFT) + lien DropshipSource
 *   5. Validation    — un admin approuve (publication) ou rejette depuis le back-office
 *
 * Chaque import est tracé dans ImportJob (file d'attente + audit).
 */

const CONCURRENCY_DELAY_MS = 500; // espacement des jobs en traitement de masse

/** Catégorie de repli = « Bazar » (catégorie réelle), plus jamais « À catégoriser ». */
async function fallbackCategoryId(): Promise<string> {
  const id = await ensureCategoryFromName(FALLBACK_CATEGORY);
  return id!;
}

function slugifyCategory(name: string): string {
  return name.toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

/**
 * Trouve ou crée une catégorie visible à partir du nom proposé par l'IA.
 * Permet aux catégories de s'auto-inscrire quand l'IA propose une catégorie
 * qui n'existe pas encore dans la boutique.
 */
export async function ensureCategoryFromName(name?: string | null): Promise<string | null> {
  const clean = (name || '').trim();
  if (clean.length < 3 || clean.length > 60) return null;
  const slug = slugifyCategory(clean);
  if (!slug) return null;
  const existing = await prisma.category.findFirst({
    where: { OR: [{ slug }, { name: { equals: clean, mode: 'insensitive' } }] },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.category.create({
    data: { name: clean, slug, isVisible: true },
  });
  console.log(`[sourcing] catégorie auto-créée : "${clean}" (${slug})`);
  return created.id;
}

/** Devine une catégorie française (module partagé category-guess). */
function guessCategoryName(title: string): string | null {
  return guessCategory(title); // retourne toujours un nom réel (repli « Bazar »)
}

/** Extrait une marque exploitable des attributs (sinon null si générique/absente). */
export function extractBrand(attributes: Record<string, string>): string | null {
  const keys = ['Nom de marque', 'Marque', 'Brand Name', 'Brand', 'brand'];
  for (const k of keys) {
    const raw = (attributes[k] || '').trim();
    if (!raw) continue;
    if (/^(none|no brand|sans marque|oem|generic|n\/?a|aucun|other|others|no|yes)$/i.test(raw)) continue;
    if (/noenname|noname|no.?name|null|factory/i.test(raw) || /^\d+$/.test(raw)) continue; // marques poubelle
    if (raw.length < 2 || raw.length > 40) continue;
    // Titre propre : Majuscule initiale conservée telle quelle
    return raw;
  }
  return null;
}

/**
 * Génère une fiche produit COMPLÈTE sans IA (coût zéro), à partir des données
 * déjà traduites en français par l'API AliExpress (titre + caractéristiques +
 * variantes). Description HTML structurée, catégorie devinée, tags et SEO.
 * C'est le mode par défaut : pas d'appel Anthropic, donc gratuit.
 */
export function templateProposal(p: NormalizedSupplierProduct): ProductProposal {
  const title = (p.title || 'Produit importé').trim();
  const shortName = title.length > 118 ? title.slice(0, 115) + '…' : title;

  // Regroupe les caractéristiques (ex: plusieurs "Caractéristiques" → une liste)
  const grouped = new Map<string, string[]>();
  for (const [k, v] of Object.entries(p.attributes)) {
    if (!k || !v) continue;
    if (/origine|preoccup|chimique/i.test(k)) continue; // bruit
    const arr = grouped.get(k) || [];
    if (!arr.includes(String(v))) arr.push(String(v));
    grouped.set(k, arr);
  }
  const specItems: string[] = [];
  for (const [k, vals] of grouped) specItems.push(`<li><strong>${k} :</strong> ${vals.join(', ')}</li>`);

  const colors = p.variants.map((v) => v.label).filter(Boolean).slice(0, 12);
  const deliv = p.deliveryDaysMin && p.deliveryDaysMax ? `<p>Livraison estimée : ${p.deliveryDaysMin} à ${p.deliveryDaysMax} jours.</p>` : '';

  const descriptionHtml = [
    `<p>${shortName}.</p>`,
    specItems.length ? `<h3>Caractéristiques</h3><ul>${specItems.join('')}</ul>` : '',
    colors.length ? `<p><strong>Modèles / coloris disponibles :</strong> ${colors.join(', ')}.</p>` : '',
    deliv,
  ].filter(Boolean).join('\n');

  const words = title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const tags = Array.from(new Set(words)).slice(0, 6);

  return {
    name: shortName,
    shortDescription: shortName.slice(0, 160),
    descriptionHtml,
    categoryId: null,
    categoryName: guessCategoryName(title),
    tags: ['dropshipping', p.platform.toLowerCase(), ...tags].slice(0, 8),
    searchTerms: Array.from(new Set(words)).slice(0, 15),
    metaTitle: shortName.slice(0, 70),
    metaDescription: shortName.slice(0, 160),
    costPrice: p.costPrice,
    suggestedPrice: null,
    images: p.images,
    notes: 'Fiche générée automatiquement (sans IA) depuis les données AliExpress',
  };
}

/** Convertit un produit fournisseur normalisé vers le format attendu par l'IA. */
function toExtractedSource(p: NormalizedSupplierProduct): ExtractedSource {
  const attrText = Object.entries(p.attributes).map(([k, v]) => `${k}: ${v}`).join(' | ');
  const variantText = p.variants.map((v) => `${v.label} (${v.price ?? '?'} ${p.currency})`).join(', ');
  return {
    platform: p.platform.toLowerCase() as any,
    fetched: true,
    title: p.title,
    description: p.description,
    images: p.images,
    priceHints: p.costPrice !== null ? [String(p.costPrice)] : [],
    jsonLd: [],
    textExcerpt: [p.description, attrText, variantText && `Variantes: ${variantText}`, p.rawText]
      .filter(Boolean).join('\n').slice(0, 5000),
  };
}

/** Proposition de secours quand ANTHROPIC_API_KEY est absente (pipeline dégradé mais fonctionnel). */
function fallbackProposal(p: NormalizedSupplierProduct): ProductProposal {
  return {
    name: (p.title || 'Produit importé sans titre').slice(0, 120),
    shortDescription: (p.description || '').slice(0, 160),
    descriptionHtml: p.description ? `<p>${p.description.slice(0, 800)}</p>` : '',
    categoryId: null,
    categoryName: null,
    tags: ['dropshipping', p.platform.toLowerCase()],
    searchTerms: (p.title || '').toLowerCase().split(/\s+/).filter((w) => w.length > 2).slice(0, 10),
    metaTitle: (p.title || '').slice(0, 70),
    metaDescription: (p.description || '').slice(0, 160),
    costPrice: p.costPrice,
    suggestedPrice: null,
    images: p.images,
    notes: "IA désactivée (ANTHROPIC_API_KEY absente) — fiche brute à retravailler manuellement",
  };
}

/** Score qualité 0-100 de la proposition (pilote l'auto-publication éventuelle). */
function confidenceScore(prop: ProductProposal, price: number | null): number {
  let s = 0;
  if (prop.name && prop.name.length > 10 && !/sans nom|sans titre/i.test(prop.name)) s += 20;
  if (prop.descriptionHtml && prop.descriptionHtml.length > 120) s += 20;
  if (prop.images.length > 0) s += 15;
  if (prop.images.length >= 3) s += 5;
  if (prop.costPrice !== null) s += 15;
  if (price !== null) s += 10;
  if (prop.categoryId) s += 10;
  if (prop.searchTerms.length >= 5) s += 5;
  return Math.min(100, s);
}

function makeSkuSlug(name: string, platform: string): { sku: string; slug: string } {
  const prefix = { ALIEXPRESS: 'AE', CJDROPSHIPPING: 'CJ', TEMU: 'TM', SHEIN: 'SH', AUTRE: 'DS' }[platform] || 'DS';
  const sku = `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
  const base = `${name}-${sku}`.toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return { sku, slug: `${base}-${Math.random().toString(36).substring(2, 7)}` };
}

/** Crée un job d'import et lance son traitement en arrière-plan. */
export async function enqueueImport(params: {
  url?: string | null;
  platform?: PlatformKey | null;
  externalId?: string | null;
  rawText?: string | null;
  createdById?: string | null;
}) {
  const platform: PlatformKey = params.platform
    || (params.url ? platformFromUrl(params.url) : 'AUTRE');

  const job = await prisma.importJob.create({
    data: {
      platform,
      sourceUrl: params.url || null,
      externalId: params.externalId || null,
      rawText: params.rawText || null,
      createdById: params.createdById || null,
    },
  });

  // Traitement asynchrone (la réponse HTTP n'attend pas l'IA)
  setImmediate(() => {
    processJob(job.id).catch((e) => console.error(`[sourcing] job ${job.id}:`, e.message));
  });

  return job;
}

/** Traite un job : acquisition → IA → prix → produit brouillon. */
export async function processJob(jobId: string): Promise<void> {
  const job = await prisma.importJob.findUnique({ where: { id: jobId } });
  if (!job || job.status !== 'QUEUED') return;

  await prisma.importJob.update({ where: { id: jobId }, data: { status: 'ANALYZING' } });

  try {
    // 1. Acquisition — avec replis pour le mode réel sans clés API :
    //    connecteur officiel → extraction de la page (URL) → description collée.
    const connector = getConnector(job.platform as PlatformKey);
    let supplierProduct: NormalizedSupplierProduct;
    try {
      supplierProduct = await connector.fetchProduct({
        externalId: job.externalId,
        url: job.sourceUrl,
      });
    } catch (acquisitionError: any) {
      if (job.sourceUrl && !connector.isConfigured()) {
        // Clés API absentes (AliExpress/CJ) : extraction générique de la page
        try {
          supplierProduct = await getConnector('AUTRE').fetchProduct({ url: job.sourceUrl });
          supplierProduct.platform = job.platform as PlatformKey;
        } catch {
          if (!job.rawText) throw acquisitionError;
          supplierProduct = {
            platform: job.platform as PlatformKey,
            externalId: job.externalId,
            sourceUrl: job.sourceUrl,
            title: null,
            description: null,
            images: [],
            costPrice: null,
            shippingCost: null,
            currency: 'EUR',
            stockQty: null,
            deliveryDaysMin: null,
            deliveryDaysMax: null,
            attributes: {},
            variants: [],
            rawText: job.rawText,
          };
        }
      } else if (job.rawText) {
        // Dernier recours : l'admin a collé la description, l'IA travaille dessus
        supplierProduct = {
          platform: job.platform as PlatformKey,
          externalId: job.externalId,
          sourceUrl: job.sourceUrl,
          title: null,
          description: null,
          images: [],
          costPrice: null,
          shippingCost: null,
          currency: 'EUR',
          stockQty: null,
          deliveryDaysMin: null,
          deliveryDaysMax: null,
          attributes: {},
          variants: [],
          rawText: job.rawText,
        };
      } else {
        throw acquisitionError;
      }
    }

    // 2. Enrichissement IA (avec repli sans IA si clé absente)
    const categories = await prisma.category.findMany({
      select: { id: true, name: true }, orderBy: { name: 'asc' },
    });
    // Mode par défaut : GRATUIT (fiche générée depuis les données AliExpress
    // déjà traduites en FR, aucun appel Anthropic). L'IA n'est utilisée que si
    // AI_IMPORT_ENABLED=1 (rédaction marketing plus soignée, mais payante).
    let proposal: ProductProposal;
    let aiFailed = false;
    if (process.env.AI_IMPORT_ENABLED === '1' && process.env.ANTHROPIC_API_KEY) {
      try {
        proposal = await analyzeWithAI({
          url: job.sourceUrl || '',
          source: toExtractedSource(supplierProduct),
          rawText: job.rawText || undefined,
          marginPct: Number(process.env.DROPSHIP_DEFAULT_MARGIN_PCT) || 120,
          categories,
        });
        if (proposal.costPrice === null) proposal.costPrice = supplierProduct.costPrice;
      } catch (aiError: any) {
        // L'IA a échoué (crédit épuisé, rate limit) : repli sur la fiche gratuite.
        proposal = templateProposal(supplierProduct);
        proposal.notes = `IA indisponible (${String(aiError.response?.data?.error?.message || aiError.message).slice(0, 100)}) — fiche générée sans IA`;
        console.warn(`[sourcing] job ${jobId} : IA échouée, repli fiche gratuite`);
      }
    } else {
      // Fiche gratuite : titre + specs FR + variantes, description structurée réelle.
      proposal = templateProposal(supplierProduct);
    }
    // La catégorie devinée (gratuite) est créée si elle n'existe pas encore.
    if (!proposal.categoryId && proposal.categoryName) {
      proposal.categoryId = await ensureCategoryFromName(proposal.categoryName);
    }

    // 3. Prix (le moteur de règles a priorité sur la suggestion IA)
    const pricing = await computeSalePrice({
      platform: job.platform,
      categoryId: proposal.categoryId,
      costPrice: proposal.costPrice ?? supplierProduct.costPrice,
      shippingCost: supplierProduct.shippingCost,
    });
    const finalPrice = pricing.price ?? proposal.suggestedPrice;

    // 4. Produit brouillon (masqué) + source dropshipping
    // Catégorie : existante choisie par l'IA → sinon auto-création depuis son
    // nom proposé → sinon « À CATÉGORISER ».
    const categoryId = proposal.categoryId
      || (await ensureCategoryFromName(proposal.categoryName))
      || (await fallbackCategoryId());
    const { sku, slug } = makeSkuSlug(proposal.name, job.platform);
    const brand = extractBrand(supplierProduct.attributes);

    const product = await prisma.product.create({
      data: {
        sku,
        slug,
        brand,
        name: proposal.name,
        description: proposal.descriptionHtml,
        shortDescription: proposal.shortDescription || null,
        price: finalPrice ?? 0,
        costPrice: proposal.costPrice ?? supplierProduct.costPrice,
        stock: supplierProduct.stockQty ?? 999,
        minStock: 0,
        status: 'DRAFT',
        isVisible: false,
        images: [], // les images sont importées sur Cloudinary à l'approbation
        thumbnail: null,
        categoryId,
        tags: ['dropshipping', job.platform.toLowerCase(), ...proposal.tags.slice(0, 8)],
        searchTerms: proposal.searchTerms.slice(0, 20),
        metaTitle: proposal.metaTitle || proposal.name.slice(0, 70),
        metaDescription: proposal.metaDescription || null,
        metaKeywords: [],
        dropshipSource: {
          create: {
            platform: job.platform,
            externalId: supplierProduct.externalId,
            sourceUrl: job.sourceUrl || supplierProduct.sourceUrl,
            costPrice: proposal.costPrice ?? supplierProduct.costPrice,
            shippingCost: supplierProduct.shippingCost,
            currency: supplierProduct.currency,
            stockQty: supplierProduct.stockQty,
            deliveryDaysMin: supplierProduct.deliveryDaysMin,
            deliveryDaysMax: supplierProduct.deliveryDaysMax,
            lastSyncAt: new Date(),
          },
        },
      },
    });

    // Sans IA, la fiche est brute : on force un score faible pour qu'elle
    // reste en validation manuelle (jamais auto-publiée par l'auto-sourcing).
    const confidence = aiFailed ? Math.min(40, confidenceScore(proposal, finalPrice ?? null)) : confidenceScore(proposal, finalPrice ?? null);

    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'DRAFT',
        productId: product.id,
        confidence,
        proposal: {
          ...(proposal as any),
          aiFailed,
          finalPrice,
          pricing: { rule: pricing.ruleName, details: pricing.details, belowMinMargin: pricing.belowMinMargin },
          sourceImages: proposal.images.length ? proposal.images : supplierProduct.images,
          mock: supplierProduct.mock === true,
        } as any,
      },
    });
  } catch (e: any) {
    await prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', error: String(e.message || e).slice(0, 900) },
    });
  }
}

/** Import en masse : une liste d'URLs → un job par URL, traités séquentiellement. */
export async function enqueueBulk(urls: string[], createdById?: string | null) {
  const jobs = [] as { id: string }[];
  for (const url of urls.slice(0, 100)) {
    const platform = platformFromUrl(url);
    const job = await prisma.importJob.create({
      data: { platform, sourceUrl: url, createdById: createdById || null },
    });
    jobs.push({ id: job.id });
  }
  // Traitement séquentiel en arrière-plan (évite de saturer l'API IA)
  setImmediate(async () => {
    for (const j of jobs) {
      await processJob(j.id).catch((e) => console.error(`[sourcing] bulk job ${j.id}:`, e.message));
      await new Promise((r) => setTimeout(r, CONCURRENCY_DELAY_MS));
    }
  });
  return jobs;
}

/** Approbation admin : import des images Cloudinary + publication (ou pas). */
export async function approveJob(params: {
  jobId: string;
  reviewedBy: string;
  publishNow: boolean;
  overrides?: { name?: string; price?: number; categoryId?: string; description?: string };
}) {
  const job = await prisma.importJob.findUnique({ where: { id: params.jobId } });
  if (!job) throw new Error('Job introuvable');
  if (job.status !== 'DRAFT') throw new Error(`Job non validable (statut ${job.status})`);
  if (!job.productId) throw new Error('Job sans produit brouillon');

  const proposal: any = job.proposal || {};
  const sourceImages: string[] = Array.isArray(proposal.sourceImages) ? proposal.sourceImages.slice(0, 6) : [];

  // Deux modes pour les images :
  //   - 'source' (défaut) : on garde les URLs AliExpress directement → gratuit,
  //     illimité, instantané (pas de quota Cloudinary). Idéal import massif.
  //   - 'cloudinary' : recopie sur Cloudinary (héberge chez nous, plus robuste
  //     mais quota/coût). Activer avec DROPSHIP_IMAGES_MODE=cloudinary.
  const images: string[] = [];
  if (process.env.DROPSHIP_IMAGES_MODE === 'cloudinary') {
    for (const imgUrl of sourceImages) {
      try {
        const up = await cloudinary.uploader.upload(imgUrl, {
          folder: 'neoserv/products/dropshipping', resource_type: 'image', timeout: 30000,
        });
        images.push(up.secure_url);
      } catch {
        console.warn('[sourcing] image ignorée (upload échoué):', String(imgUrl).slice(0, 80));
      }
    }
  } else {
    // Mode source : on garde les URLs valides telles quelles.
    for (const imgUrl of sourceImages) {
      if (typeof imgUrl === 'string' && /^https?:\/\//.test(imgUrl)) images.push(imgUrl);
    }
  }

  const o = params.overrides || {};
  const product = await prisma.product.update({
    where: { id: job.productId },
    data: {
      ...(o.name ? { name: o.name } : {}),
      ...(Number.isFinite(Number(o.price)) && Number(o.price) > 0 ? { price: Number(o.price) } : {}),
      ...(o.categoryId ? { categoryId: o.categoryId } : {}),
      ...(o.description ? { description: o.description } : {}),
      ...(images.length ? { images, thumbnail: images[0] } : {}),
      status: 'ACTIVE',
      isVisible: params.publishNow,
      reviewedAt: new Date(),
      reviewedBy: params.reviewedBy,
    },
  });

  await prisma.importJob.update({
    where: { id: params.jobId },
    data: { status: 'APPROVED', reviewedBy: params.reviewedBy },
  });

  return { product, imagesImported: images.length };
}

export async function rejectJob(jobId: string, reviewedBy: string, reason?: string) {
  const job = await prisma.importJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error('Job introuvable');

  // Supprime le brouillon associé (cascade sur DropshipSource)
  if (job.productId) {
    await prisma.product.delete({ where: { id: job.productId } }).catch(() => undefined);
  }
  return prisma.importJob.update({
    where: { id: jobId },
    data: { status: 'REJECTED', reviewedBy, error: reason || null, productId: null },
  });
}
