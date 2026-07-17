import prisma from '../config/database';
import cloudinary from '../config/cloudinary';
import { getConnector, platformFromUrl, PlatformKey, NormalizedSupplierProduct } from './connectors';
import { analyzeWithAI, ExtractedSource, ProductProposal } from './ai-import.service';
import { computeSalePrice } from './dropship-pricing.service';

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

/** Catégorie par défaut pour les brouillons sans catégorie IA. */
async function fallbackCategoryId(): Promise<string> {
  const existing = await prisma.category.findFirst({
    where: { OR: [{ slug: 'a-categoriser' }, { name: { contains: 'catégoriser', mode: 'insensitive' } }] },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.category.create({
    data: { name: 'À CATÉGORISER', slug: 'a-categoriser', isVisible: false },
  });
  return created.id;
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
    // 1. Acquisition
    const connector = getConnector(job.platform as PlatformKey);
    const supplierProduct = await connector.fetchProduct({
      externalId: job.externalId,
      url: job.sourceUrl,
    });

    // 2. Enrichissement IA (avec repli sans IA si clé absente)
    const categories = await prisma.category.findMany({
      select: { id: true, name: true }, orderBy: { name: 'asc' },
    });
    let proposal: ProductProposal;
    if (process.env.ANTHROPIC_API_KEY) {
      proposal = await analyzeWithAI({
        url: job.sourceUrl || '',
        source: toExtractedSource(supplierProduct),
        rawText: job.rawText || undefined,
        marginPct: Number(process.env.DROPSHIP_DEFAULT_MARGIN_PCT) || 120,
        categories,
      });
      if (proposal.costPrice === null) proposal.costPrice = supplierProduct.costPrice;
    } else {
      proposal = fallbackProposal(supplierProduct);
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
    const categoryId = proposal.categoryId || (await fallbackCategoryId());
    const { sku, slug } = makeSkuSlug(proposal.name, job.platform);

    const product = await prisma.product.create({
      data: {
        sku,
        slug,
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

    const confidence = confidenceScore(proposal, finalPrice ?? null);

    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'DRAFT',
        productId: product.id,
        confidence,
        proposal: {
          ...(proposal as any),
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

  // Import des images distantes vers Cloudinary (best effort)
  const images: string[] = [];
  for (const imgUrl of sourceImages) {
    try {
      const up = await cloudinary.uploader.upload(imgUrl, {
        folder: 'neoserv/products/dropshipping',
        resource_type: 'image',
        timeout: 30000,
      });
      images.push(up.secure_url);
    } catch {
      console.warn('[sourcing] image ignorée (upload échoué):', String(imgUrl).slice(0, 80));
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
