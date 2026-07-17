import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { enqueueImport, enqueueBulk, approveJob, rejectJob } from '../services/sourcing.service';
import { getConnector, platformFromUrl, PlatformKey } from '../services/connectors';
import { runSyncOnce, getSyncStatus } from '../services/dropship-sync.service';
import { runFulfillmentOnce, getFulfillmentStatus } from '../services/supplier-order.service';
import { startCleanup, getCleanupStatus, requestStop } from '../services/catalog-cleanup.service';

/**
 * Back-office "Sourcing & Imports" — endpoints admin du module dropshipping.
 */

// ===== ÉTAT DES CONNECTEURS =====

// GET /api/sourcing/connectors
export const getConnectors = async (_req: AuthRequest, res: Response) => {
  try {
    const platforms: PlatformKey[] = ['ALIEXPRESS', 'CJDROPSHIPPING', 'TEMU', 'SHEIN', 'AUTRE'];
    const connectors = platforms.map((p) => {
      const c = getConnector(p);
      return {
        platform: p,
        configured: c.isConfigured(),
        autoOrder: c.supportsAutoOrder(),
        note: p === 'TEMU'
          ? "Pas d'API publique — import par URL uniquement, commandes fournisseur manuelles, emballage Temu"
          : p === 'SHEIN'
            ? "Aucun programme officiel — import par URL, photos à remplacer (droit d'auteur), commandes manuelles"
            : p === 'AUTRE'
              ? 'Extraction générique depuis une URL produit'
              : 'API officielle',
      };
    });
    res.json({ success: true, connectors, mockMode: process.env.SOURCING_MOCK === '1' });
  } catch (e: any) {
    console.error('[sourcing] connectors:', e.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la lecture des connecteurs' });
  }
};

// ===== IMPORTS =====

// POST /api/sourcing/import  body: { url?, platform?, externalId?, rawText? }
export const createImport = async (req: AuthRequest, res: Response) => {
  try {
    const { url, platform, externalId, rawText } = req.body || {};
    if (!url && !externalId && !rawText) {
      return res.status(400).json({ success: false, message: 'Fournissez une URL produit, un identifiant plateforme ou une description' });
    }
    const job = await enqueueImport({
      url, platform, externalId, rawText,
      createdById: req.user?.userId || null,
    });
    res.status(202).json({
      success: true,
      message: 'Import lancé — le produit apparaîtra en brouillon dans la file de validation',
      job: { id: job.id, platform: job.platform, status: job.status },
    });
  } catch (e: any) {
    console.error('[sourcing] import:', e.message);
    res.status(500).json({ success: false, message: e.message || "Impossible de lancer l'import" });
  }
};

// POST /api/sourcing/import/bulk  body: { urls: string[] }
export const createBulkImport = async (req: AuthRequest, res: Response) => {
  try {
    const urls: string[] = Array.isArray(req.body?.urls)
      ? req.body.urls.filter((u: any) => typeof u === 'string' && /^https?:\/\//.test(u))
      : [];
    if (!urls.length) {
      return res.status(400).json({ success: false, message: 'Fournissez un tableau "urls" (max 100)' });
    }
    const jobs = await enqueueBulk(urls, req.user?.userId || null);
    res.status(202).json({
      success: true,
      message: `${jobs.length} import(s) lancé(s) — traitement en arrière-plan`,
      jobIds: jobs.map((j) => j.id),
    });
  } catch (e: any) {
    console.error('[sourcing] bulk:', e.message);
    res.status(500).json({ success: false, message: "Impossible de lancer l'import en masse" });
  }
};

// GET /api/sourcing/jobs?status=DRAFT&page=1&limit=20
export const getJobs = async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const where: any = {};
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.platform) where.platform = String(req.query.platform);

    const [jobs, total] = await Promise.all([
      prisma.importJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.importJob.count({ where }),
    ]);
    res.json({ success: true, jobs, total, page, pages: Math.ceil(total / limit) });
  } catch (e: any) {
    console.error('[sourcing] jobs:', e.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la lecture de la file' });
  }
};

// GET /api/sourcing/jobs/:id
export const getJob = async (req: AuthRequest, res: Response) => {
  try {
    const job = await prisma.importJob.findUnique({ where: { id: req.params.id } });
    if (!job) return res.status(404).json({ success: false, message: 'Job introuvable' });

    const product = job.productId
      ? await prisma.product.findUnique({
          where: { id: job.productId },
          include: { category: { select: { id: true, name: true } }, dropshipSource: true },
        })
      : null;
    res.json({ success: true, job, product });
  } catch (e: any) {
    console.error('[sourcing] job:', e.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la lecture du job' });
  }
};

// POST /api/sourcing/jobs/:id/approve  body: { publishNow?, name?, price?, categoryId?, description? }
export const approve = async (req: AuthRequest, res: Response) => {
  try {
    const { publishNow, name, price, categoryId, description } = req.body || {};
    const result = await approveJob({
      jobId: req.params.id,
      reviewedBy: req.user?.userId || 'admin',
      publishNow: publishNow === true,
      overrides: { name, price, categoryId, description },
    });
    res.json({
      success: true,
      message: `Produit validé (${result.imagesImported} image(s) importée(s)) — ${result.product.isVisible ? 'PUBLIÉ sur la boutique' : 'actif mais masqué'}`,
      product: result.product,
    });
  } catch (e: any) {
    console.error('[sourcing] approve:', e.message);
    res.status(400).json({ success: false, message: e.message || 'Validation impossible' });
  }
};

// POST /api/sourcing/jobs/:id/reject  body: { reason? }
export const reject = async (req: AuthRequest, res: Response) => {
  try {
    await rejectJob(req.params.id, req.user?.userId || 'admin', req.body?.reason);
    res.json({ success: true, message: 'Import rejeté, brouillon supprimé' });
  } catch (e: any) {
    console.error('[sourcing] reject:', e.message);
    res.status(400).json({ success: false, message: e.message || 'Rejet impossible' });
  }
};

// ===== SOURCES (produits liés) =====

// GET /api/sourcing/sources?platform=&syncEnabled=
export const getSources = async (req: AuthRequest, res: Response) => {
  try {
    const where: any = {};
    if (req.query.platform) where.platform = String(req.query.platform);
    if (req.query.syncEnabled !== undefined) where.syncEnabled = req.query.syncEnabled === 'true';
    if (req.query.hasError === 'true') where.syncError = { not: null };

    const sources = await prisma.dropshipSource.findMany({
      where,
      include: { product: { select: { id: true, name: true, price: true, stock: true, isVisible: true, availabilityStatus: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
    res.json({ success: true, sources });
  } catch (e: any) {
    console.error('[sourcing] sources:', e.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la lecture des sources' });
  }
};

// PATCH /api/sourcing/sources/:id  body: { syncEnabled?, costPrice?, variantKey? }
export const updateSource = async (req: AuthRequest, res: Response) => {
  try {
    const { syncEnabled, costPrice, variantKey } = req.body || {};
    const source = await prisma.dropshipSource.update({
      where: { id: req.params.id },
      data: {
        ...(syncEnabled !== undefined ? { syncEnabled: Boolean(syncEnabled) } : {}),
        ...(Number.isFinite(Number(costPrice)) ? { costPrice: Number(costPrice) } : {}),
        ...(variantKey !== undefined ? { variantKey: variantKey || null } : {}),
      },
    });
    res.json({ success: true, source });
  } catch (e: any) {
    console.error('[sourcing] updateSource:', e.message);
    res.status(400).json({ success: false, message: 'Mise à jour impossible' });
  }
};

// ===== RÈGLES DE PRIX =====

export const getPricingRules = async (_req: AuthRequest, res: Response) => {
  try {
    const rules = await prisma.dropshipPricingRule.findMany({ orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }] });
    res.json({ success: true, rules });
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la lecture des règles' });
  }
};

export const createPricingRule = async (req: AuthRequest, res: Response) => {
  try {
    const b = req.body || {};
    if (!b.name) return res.status(400).json({ success: false, message: 'name est requis' });
    const rule = await prisma.dropshipPricingRule.create({
      data: {
        name: String(b.name),
        platform: b.platform || null,
        categoryId: b.categoryId || null,
        marginPct: Number(b.marginPct) || 120,
        fixedFee: Number(b.fixedFee) || 0,
        shippingEstimate: Number(b.shippingEstimate) || 0,
        roundEnding: Number.isFinite(Number(b.roundEnding)) ? Number(b.roundEnding) : 0.9,
        minPrice: Number.isFinite(Number(b.minPrice)) ? Number(b.minPrice) : null,
        minMarginPct: Number(b.minMarginPct) || 30,
        priority: Number(b.priority) || 0,
        isActive: b.isActive !== false,
      },
    });
    res.status(201).json({ success: true, rule });
  } catch (e: any) {
    console.error('[sourcing] createRule:', e.message);
    res.status(400).json({ success: false, message: 'Création de la règle impossible' });
  }
};

export const updatePricingRule = async (req: AuthRequest, res: Response) => {
  try {
    const b = req.body || {};
    const rule = await prisma.dropshipPricingRule.update({
      where: { id: req.params.id },
      data: {
        ...(b.name ? { name: String(b.name) } : {}),
        ...(b.platform !== undefined ? { platform: b.platform || null } : {}),
        ...(b.categoryId !== undefined ? { categoryId: b.categoryId || null } : {}),
        ...(b.marginPct !== undefined ? { marginPct: Number(b.marginPct) } : {}),
        ...(b.fixedFee !== undefined ? { fixedFee: Number(b.fixedFee) } : {}),
        ...(b.shippingEstimate !== undefined ? { shippingEstimate: Number(b.shippingEstimate) } : {}),
        ...(b.roundEnding !== undefined ? { roundEnding: Number(b.roundEnding) } : {}),
        ...(b.minPrice !== undefined ? { minPrice: Number.isFinite(Number(b.minPrice)) ? Number(b.minPrice) : null } : {}),
        ...(b.minMarginPct !== undefined ? { minMarginPct: Number(b.minMarginPct) } : {}),
        ...(b.priority !== undefined ? { priority: Number(b.priority) } : {}),
        ...(b.isActive !== undefined ? { isActive: Boolean(b.isActive) } : {}),
      },
    });
    res.json({ success: true, rule });
  } catch (e: any) {
    res.status(400).json({ success: false, message: 'Mise à jour de la règle impossible' });
  }
};

export const deletePricingRule = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.dropshipPricingRule.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Règle supprimée' });
  } catch (e: any) {
    res.status(400).json({ success: false, message: 'Suppression impossible' });
  }
};

// ===== SYNCHRONISATION =====

export const syncStatus = async (_req: AuthRequest, res: Response) => {
  res.json({ success: true, sync: getSyncStatus(), fulfillment: getFulfillmentStatus() });
};

export const syncRun = async (_req: AuthRequest, res: Response) => {
  try {
    setImmediate(() => runSyncOnce().catch((e) => console.error('[dropship-sync]', e.message)));
    res.status(202).json({ success: true, message: 'Synchronisation lancée en arrière-plan' });
  } catch (e: any) {
    res.status(409).json({ success: false, message: e.message });
  }
};

// ===== COMMANDES FOURNISSEURS =====

// GET /api/sourcing/supplier-orders?status=
export const getSupplierOrders = async (req: AuthRequest, res: Response) => {
  try {
    const where: any = {};
    if (req.query.status) where.status = String(req.query.status);
    const orders = await prisma.supplierOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // Enrichit avec les infos commande client + produit
    const enriched = await Promise.all(orders.map(async (so) => {
      const item = await prisma.orderItem.findUnique({
        where: { id: so.orderItemId },
        select: {
          quantity: true,
          product: { select: { name: true, dropshipSource: { select: { sourceUrl: true } } } },
          order: { select: { number: true } },
        },
      }).catch(() => null);
      return {
        ...so,
        orderNumber: item?.order?.number || null,
        productName: item?.product?.name || null,
        quantity: item?.quantity || null,
        sourceUrl: item?.product?.dropshipSource?.sourceUrl || null,
      };
    }));
    res.json({ success: true, supplierOrders: enriched });
  } catch (e: any) {
    console.error('[sourcing] supplierOrders:', e.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la lecture des commandes fournisseurs' });
  }
};

// PATCH /api/sourcing/supplier-orders/:id — saisie manuelle (Temu/Shein) ou correction
export const updateSupplierOrder = async (req: AuthRequest, res: Response) => {
  try {
    const b = req.body || {};
    const so = await prisma.supplierOrder.update({
      where: { id: req.params.id },
      data: {
        ...(b.externalOrderId !== undefined ? { externalOrderId: b.externalOrderId || null } : {}),
        ...(b.trackingNumber !== undefined ? { trackingNumber: b.trackingNumber || null } : {}),
        ...(b.trackingUrl !== undefined ? { trackingUrl: b.trackingUrl || null } : {}),
        ...(b.carrier !== undefined ? { carrier: b.carrier || null } : {}),
        ...(b.status ? { status: b.status } : {}),
        ...(b.notes !== undefined ? { notes: b.notes || null } : {}),
        ...(b.status === 'PLACED' ? { placedAt: new Date() } : {}),
        ...(b.status === 'SHIPPED' ? { shippedAt: new Date() } : {}),
      },
    });
    res.json({ success: true, supplierOrder: so });
  } catch (e: any) {
    res.status(400).json({ success: false, message: 'Mise à jour impossible' });
  }
};

// POST /api/sourcing/fulfillment/run
export const fulfillmentRun = async (_req: AuthRequest, res: Response) => {
  try {
    const result = await runFulfillmentOnce();
    res.json({ success: true, result });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ===== ASSAINISSEMENT CATALOGUE =====

// POST /api/sourcing/cleanup/start  body: { dryRun?, maxProducts? }
export const cleanupStart = async (req: AuthRequest, res: Response) => {
  try {
    const run = await startCleanup({
      dryRun: req.body?.dryRun !== false,
      maxProducts: Math.min(10000, Number(req.body?.maxProducts) || 100),
      startedById: req.user?.userId || null,
    });
    res.status(202).json({
      success: true,
      message: `Assainissement lancé (${run.dryRun ? 'DRY-RUN, aucune écriture' : 'écriture réelle'})`,
      run,
    });
  } catch (e: any) {
    res.status(409).json({ success: false, message: e.message });
  }
};

export const cleanupStatus = async (_req: AuthRequest, res: Response) => {
  try {
    const run = await getCleanupStatus();
    res.json({ success: true, run });
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Erreur' });
  }
};

export const cleanupStop = async (_req: AuthRequest, res: Response) => {
  requestStop();
  res.json({ success: true, message: "Arrêt demandé — l'assainissement se met en pause après le lot en cours" });
};
