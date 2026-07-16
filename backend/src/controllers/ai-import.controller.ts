import { Response } from 'express';
import prisma from '../config/database';
import cloudinary from '../config/cloudinary';
import { AuthRequest } from '../middleware/auth';
import {
  fetchProductPage,
  extractFromHtml,
  analyzeWithAI,
  detectPlatform,
} from '../services/ai-import.service';

/**
 * POST /api/ai-import/analyze
 * body: { url?: string, rawText?: string, marginPct?: number }
 * → Analyse la page fournisseur + IA → proposition de fiche produit (rien n'est créé).
 */
export const analyzeSource = async (req: AuthRequest, res: Response) => {
  try {
    const { url, rawText, marginPct } = req.body || {};
    if (!url && !rawText) {
      return res.status(400).json({ success: false, message: 'Fournissez une URL produit ou collez la description' });
    }
    const marge = Number.isFinite(Number(marginPct)) && Number(marginPct) > 0 ? Number(marginPct) : 120;

    const html = url ? await fetchProductPage(url) : null;
    const source = extractFromHtml(url || '', html);

    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    const proposal = await analyzeWithAI({ url: url || '', source, rawText, marginPct: marge, categories });

    return res.json({
      success: true,
      proposal,
      source: {
        platform: url ? detectPlatform(url) : 'texte',
        fetched: source.fetched,
        imagesFound: source.images.length,
      },
      categories,
      marginPct: marge,
    });
  } catch (e: any) {
    console.error('[ai-import] analyze:', e.message);
    const msg = /ANTHROPIC_API_KEY/.test(e.message)
      ? e.message
      : "Analyse impossible — réessayez ou collez la description du produit manuellement";
    return res.status(500).json({ success: false, message: msg });
  }
};

/**
 * POST /api/ai-import/create
 * body: fiche validée par l'admin (name, price, categoryId, images[], …)
 * → Importe les images sur Cloudinary puis crée le produit (masqué par défaut).
 */
export const createFromProposal = async (req: AuthRequest, res: Response) => {
  try {
    const b = req.body || {};
    if (!b.name || !b.categoryId || !Number.isFinite(Number(b.price))) {
      return res.status(400).json({ success: false, message: 'name, categoryId et price sont requis' });
    }

    // 1. Import des images distantes vers Cloudinary (best effort, max 6)
    const sourceImages: string[] = Array.isArray(b.images) ? b.images.slice(0, 6) : [];
    const images: string[] = [];
    for (const imgUrl of sourceImages) {
      try {
        const up = await cloudinary.uploader.upload(imgUrl, {
          folder: 'neoserv/products/dropshipping',
          resource_type: 'image',
          timeout: 30000,
        });
        images.push(up.secure_url);
      } catch (err: any) {
        console.warn('[ai-import] image ignorée (upload échoué):', imgUrl.slice(0, 80));
      }
    }

    // 2. SKU + slug uniques
    const sku = `DS-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
    const base = `${b.name}-${sku}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const slug = `${base}-${Math.random().toString(36).substring(2, 7)}`;

    // 3. Création (masqué par défaut : l'admin publie depuis la fiche produit)
    const produit = await prisma.product.create({
      data: {
        sku,
        slug,
        name: String(b.name).slice(0, 120),
        description: String(b.descriptionHtml || b.description || ''),
        shortDescription: String(b.shortDescription || '').slice(0, 200) || null,
        price: Number(b.price),
        costPrice: Number.isFinite(Number(b.costPrice)) ? Number(b.costPrice) : null,
        stock: Number.isFinite(Number(b.stock)) ? Number(b.stock) : 999,
        minStock: 0,
        status: 'ACTIVE',
        isVisible: Boolean(b.publishNow) === true,
        images,
        thumbnail: images[0] || null,
        categoryId: String(b.categoryId),
        tags: [
          'dropshipping',
          ...(b.sourceUrl ? [detectPlatform(String(b.sourceUrl))] : []),
          ...(Array.isArray(b.tags) ? b.tags.slice(0, 8).map(String) : []),
        ],
        searchTerms: Array.isArray(b.searchTerms) ? b.searchTerms.slice(0, 20).map(String) : [],
        metaTitle: String(b.metaTitle || b.name).slice(0, 70),
        metaDescription: String(b.metaDescription || '').slice(0, 160) || null,
        metaKeywords: [],
      },
      include: { category: { select: { name: true } } },
    });

    return res.status(201).json({
      success: true,
      message: `Produit créé (${images.length} image(s) importée(s)) — ${produit.isVisible ? 'PUBLIÉ' : 'masqué, à publier'}`,
      product: produit,
    });
  } catch (e: any) {
    console.error('[ai-import] create:', e.message);
    return res.status(500).json({ success: false, message: 'Création du produit impossible' });
  }
};
