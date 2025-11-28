import { Router } from 'express';
import prisma from '../config/database';
import fetch from 'node-fetch';
import cloudinary from 'cloudinary';

const router = Router();

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Route pour mettre à jour les emails @neocom vers @neoserv
router.post('/update-emails-to-neoserv', async (req, res) => {
  try {
    // Vérifier un secret pour la sécurité
    const { secret } = req.body;
    const MIGRATION_SECRET = process.env.MIGRATION_SECRET || 'neoserv-migration-2024';

    if (secret !== MIGRATION_SECRET) {
      return res.status(401).json({
        error: 'Secret invalide',
        message: 'Envoyez le secret dans le body: { "secret": "neoserv-migration-2024" }'
      });
    }

    console.log('🔄 Mise à jour des emails NEOCOM → NEOSERV...');

    const emailMappings = [
      { old: 'admin@neocom.com', new: 'admin@neoserv.com' },
      { old: 'commercial@neocom.com', new: 'commercial@neoserv.com' },
      { old: 'comptable@neocom.com', new: 'comptable@neoserv.com' },
      { old: 'livreur@neocom.com', new: 'livreur@neoserv.com' },
      { old: 'delivery@neocom.com', new: 'delivery@neoserv.com' },
      { old: 'accountant@neocom.com', new: 'accountant@neoserv.com' },
      { old: 'client@neocom.com', new: 'client@neoserv.com' },
      { old: 'contact@neocom.com', new: 'contact@neoserv.com' },
      { old: 'public@neocom.com', new: 'public@neoserv.com' },
    ];

    const updates = [];
    let updatedCount = 0;

    // Mettre à jour chaque email
    for (const mapping of emailMappings) {
      const result = await prisma.user.updateMany({
        where: { email: mapping.old },
        data: { email: mapping.new },
      });

      if (result.count > 0) {
        updates.push({
          from: mapping.old,
          to: mapping.new,
          count: result.count
        });
        updatedCount += result.count;
      }
    }

    // Récupérer tous les utilisateurs après mise à jour
    const users = await prisma.user.findMany({
      select: { email: true, firstName: true, lastName: true, role: true },
      orderBy: { email: 'asc' },
    });

    res.json({
      success: true,
      message: `✅ ${updatedCount} utilisateur(s) mis à jour`,
      updates,
      totalUsers: users.length,
      users: users.map(u => ({
        email: u.email,
        name: `${u.firstName} ${u.lastName}`,
        role: u.role
      }))
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour',
      details: error.message
    });
  }
});

// Route GET pour vérifier l'état actuel
router.get('/check-emails', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { email: true, firstName: true, lastName: true, role: true },
      orderBy: { email: 'asc' },
    });

    const neocomEmails = users.filter(u => u.email.includes('@neocom.com'));
    const neoservEmails = users.filter(u => u.email.includes('@neoserv.com'));

    res.json({
      totalUsers: users.length,
      neocomEmails: neocomEmails.length,
      neoservEmails: neoservEmails.length,
      neocomUsers: neocomEmails.map(u => u.email),
      neoservUsers: neoservEmails.map(u => u.email),
      allUsers: users.map(u => ({
        email: u.email,
        name: `${u.firstName} ${u.lastName}`,
        role: u.role
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour ajouter la colonne availabilityStatus
router.post('/add-availability-status', async (req, res) => {
  try {
    const { secret } = req.body;
    const MIGRATION_SECRET = process.env.MIGRATION_SECRET || 'neoserv-migration-2024';

    if (secret !== MIGRATION_SECRET) {
      return res.status(401).json({
        error: 'Secret invalide',
        message: 'Envoyez le secret dans le body: { "secret": "neoserv-migration-2024" }'
      });
    }

    console.log('🔄 Ajout de la colonne availabilityStatus...');

    // Créer le type ENUM s'il n'existe pas
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'OUT_OF_STOCK', 'COMING_SOON', 'DISCONTINUED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // Ajouter la colonne avec une valeur par défaut
    await prisma.$executeRaw`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS "availabilityStatus" "AvailabilityStatus" DEFAULT 'AVAILABLE';
    `;

    // Compter les produits
    const result: any = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM products`;

    res.json({
      success: true,
      message: '✅ Colonne availabilityStatus ajoutée avec succès',
      productCount: result[0]?.count || 0
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de la migration',
      details: error.message
    });
  }
});

// Route pour ajouter le champ searchTerms et générer les termes
router.post('/add-search-terms', async (req, res) => {
  try {
    const { secret } = req.body;
    const MIGRATION_SECRET = process.env.MIGRATION_SECRET || 'neoserv-migration-2024';

    if (secret !== MIGRATION_SECRET) {
      return res.status(401).json({
        error: 'Secret invalide',
        message: 'Envoyez le secret dans le body: { "secret": "neoserv-migration-2024" }'
      });
    }

    console.log('🔄 Ajout de la colonne searchTerms...');

    // Ajouter la colonne searchTerms
    await prisma.$executeRaw`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS "searchTerms" text[] DEFAULT ARRAY[]::text[];
    `;

    const result: any = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM products`;

    res.json({
      success: true,
      message: '✅ Colonne searchTerms ajoutée avec succès',
      productCount: result[0]?.count || 0,
      note: 'Exécutez maintenant: npx ts-node generate-search-terms.ts pour générer les termes'
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de la migration',
      details: error.message
    });
  }
});

// Route pour générer les termes de recherche
router.post('/generate-search-terms', async (req, res) => {
  try {
    const { secret } = req.body;
    const MIGRATION_SECRET = process.env.MIGRATION_SECRET || 'neoserv-migration-2024';

    if (secret !== MIGRATION_SECRET) {
      return res.status(401).json({
        error: 'Secret invalide',
        message: 'Envoyez le secret dans le body: { "secret": "neoserv-migration-2024" }'
      });
    }

    console.log('🔍 Génération des termes de recherche...');

    // Dictionnaire de synonymes (version simplifié)
    const synonyms: Record<string, string[]> = {
      'valise': ['bagage', 'sac', 'bagagerie', 'trolley'],
      'bagage': ['valise', 'sac'],
      'cadenas': ['serrure', 'securite'],
      'balance': ['pese', 'mesure'],
      'tapis': ['paillasson'],
      'noir': ['black', 'fonce'],
      'blanc': ['white', 'clair'],
      'bleu': ['blue']
    };

    // Fonction pour normaliser
    const normalize = (text: string) => text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim();

    // Récupérer les produits
    const products = await prisma.product.findMany({
      select: { id: true, name: true, sku: true, description: true, tags: true }
    });

    let updated = 0;

    for (const product of products) {
      const terms = new Set<string>();

      // Mots du nom
      const nameWords = normalize(product.name).split(' ').filter(w => w.length > 2);
      nameWords.forEach(word => {
        terms.add(word);
        if (synonyms[word]) {
          synonyms[word].forEach(syn => terms.add(syn));
        }
      });

      // Mots de la description
      if (product.description) {
        const descWords = normalize(product.description).split(' ').filter(w => w.length > 2);
        descWords.slice(0, 10).forEach(word => terms.add(word));
      }

      // SKU
      if (product.sku) {
        terms.add(normalize(product.sku));
      }

      // Tags
      if (product.tags && product.tags.length > 0) {
        product.tags.forEach((tag: string) => terms.add(normalize(tag)));
      }

      const searchTerms = Array.from(terms).filter(t => t.length > 2);

      await prisma.$executeRaw`
        UPDATE products
        SET "searchTerms" = ${searchTerms}::text[]
        WHERE id = ${product.id}
      `;

      updated++;

      if (updated % 100 === 0) {
        console.log(`✓ ${updated}/${products.length} produits traités...`);
      }
    }

    res.json({
      success: true,
      message: `✅ ${updated} produits mis à jour avec leurs termes de recherche`,
      productCount: updated
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de la génération des termes',
      details: error.message
    });
  }
});

// ==================== HELPER FUNCTIONS FOR FREE STOCK IMAGES ====================

/**
 * Extrait les mots-clés de recherche depuis le nom du produit
 */
function extractSearchKeywords(productName: string): string {
  let text = productName.toLowerCase();

  // Enlever les références, codes, etc.
  text = text.replace(/\d+/g, ''); // Enlever les chiffres
  text = text.replace(/[^a-zA-Z\s]/g, ' '); // Garder seulement les lettres

  const keywords: string[] = [];

  // Extraire les mots importants
  if (text.includes('valise') || text.includes('bagage')) {
    keywords.push('suitcase', 'luggage', 'travel bag');
  }
  if (text.includes('tapis')) {
    keywords.push('floor mat', 'rug', 'carpet');
  }
  if (text.includes('cadenas') || text.includes('serrure')) {
    keywords.push('padlock', 'lock', 'security');
  }
  if (text.includes('balance')) {
    keywords.push('scale', 'luggage scale');
  }
  if (text.includes('chariot')) {
    keywords.push('trolley', 'cart');
  }
  if (text.includes('corde')) {
    keywords.push('strap', 'rope', 'cord');
  }
  if (text.includes('etiquette')) {
    keywords.push('tag', 'label', 'luggage tag');
  }
  if (text.includes('protection')) {
    keywords.push('cover', 'protective cover');
  }

  // Si pas de mots-clés spécifiques, utiliser les premiers mots
  if (keywords.length === 0) {
    const words = text.split(' ').filter(w => w.length > 3);
    keywords.push(...words.slice(0, 2));
  }

  return keywords.join(' ');
}

/**
 * Cherche des images sur Unsplash
 */
async function searchUnsplash(query: string, perPage: number = 3): Promise<any[]> {
  const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
  if (!UNSPLASH_ACCESS_KEY) return [];

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=squarish`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });

    const data: any = await response.json();

    if (data.results && data.results.length > 0) {
      return data.results.map((img: any) => ({
        source: 'Unsplash',
        url: img.urls.regular,
        photographer: img.user.name,
        download_url: `${img.links.download_location}?client_id=${UNSPLASH_ACCESS_KEY}`
      }));
    }
  } catch (error) {
    console.error('   Erreur Unsplash:', error.message);
  }

  return [];
}

/**
 * Upload une image vers Cloudinary
 */
async function uploadToCloudinary(imageUrl: string, publicId: string, attribution: string): Promise<string | null> {
  try {
    const result = await cloudinary.v2.uploader.upload(imageUrl, {
      public_id: publicId,
      folder: 'neoserv/products/free-stock',
      overwrite: true,
      context: `caption=${attribution}`,
      transformation: [
        { width: 1200, height: 1200, crop: 'pad', background: 'white' },
        { quality: 'auto:best' },
        { fetch_format: 'auto' }
      ]
    });

    return result.secure_url;
  } catch (error) {
    console.error('   Erreur upload Cloudinary:', error.message);
    return null;
  }
}

/**
 * Notifie Unsplash d'un téléchargement (requis par leurs conditions)
 */
async function notifyUnsplashDownload(downloadUrl: string): Promise<void> {
  try {
    await fetch(downloadUrl);
  } catch (error) {
    // Ignore les erreurs
  }
}

// ==================== ENDPOINT ====================

/**
 * Route pour ajouter des images gratuites depuis Unsplash
 */
router.post('/add-free-stock-images', async (req, res) => {
  try {
    const { secret, maxProducts = 10, imagesPerProduct = 3 } = req.body;
    const MIGRATION_SECRET = process.env.MIGRATION_SECRET || 'neoserv-migration-2024';

    if (secret !== MIGRATION_SECRET) {
      return res.status(401).json({
        error: 'Secret invalide',
        message: 'Envoyez le secret dans le body: { "secret": "neoserv-migration-2024" }'
      });
    }

    console.log('🖼️  Recherche d\'images gratuites Unsplash...');

    // Vérifier la clé API
    if (!process.env.UNSPLASH_ACCESS_KEY) {
      return res.status(500).json({
        error: 'UNSPLASH_ACCESS_KEY manquant',
        message: 'Ajoutez UNSPLASH_ACCESS_KEY dans les variables d\'environnement'
      });
    }

    // Récupérer les produits
    const products = await prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        name: true,
        images: true
      },
      take: maxProducts,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📦 ${products.length} produits à traiter`);

    let success = 0;
    let failed = 0;
    let totalImagesAdded = 0;

    for (const product of products) {
      console.log(`\n📦 ${product.name} (${product.sku})`);

      // Extraire les mots-clés
      const searchQuery = extractSearchKeywords(product.name);
      console.log(`   🔍 Recherche: "${searchQuery}"`);

      // Chercher des images
      const images = await searchUnsplash(searchQuery, imagesPerProduct);

      if (images.length === 0) {
        console.log('   ❌ Aucune image trouvée');
        failed++;
        continue;
      }

      console.log(`   ✓ ${images.length} images trouvées`);

      // Upload chaque image
      const uploadedUrls: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const publicId = `${product.sku}_unsplash_${i + 1}_${Date.now()}`;
        const attribution = `Photo by ${img.photographer} (Unsplash)`;

        console.log(`   📤 Upload ${i + 1}/${images.length}...`);

        // Notifier Unsplash
        if (img.download_url) {
          await notifyUnsplashDownload(img.download_url);
        }

        const cloudinaryUrl = await uploadToCloudinary(img.url, publicId, attribution);

        if (cloudinaryUrl) {
          uploadedUrls.push(cloudinaryUrl);
          console.log(`   ✓ Uploadé`);
        }

        // Pause entre uploads
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (uploadedUrls.length > 0) {
        // Combiner avec images existantes
        const allImages = [...(product.images || []), ...uploadedUrls];

        await prisma.$executeRaw`
          UPDATE products
          SET images = ${allImages}::text[],
              thumbnail = COALESCE(thumbnail, ${allImages[0]})
          WHERE id = ${product.id}
        `;

        console.log(`   ✓ ${uploadedUrls.length} nouvelles images ajoutées (total: ${allImages.length})`);
        success++;
        totalImagesAdded += uploadedUrls.length;
      } else {
        failed++;
      }

      // Pause entre produits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    res.json({
      success: true,
      message: `✅ Traitement terminé`,
      stats: {
        productsProcessed: products.length,
        success,
        failed,
        totalImagesAdded
      }
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'ajout des images',
      details: error.message
    });
  }
});

/**
 * Route pour initialiser les informations de l'entreprise SARL NEOSERV
 */
router.post('/init-company-settings', async (req, res) => {
  try {
    const { secret } = req.body;
    const MIGRATION_SECRET = process.env.MIGRATION_SECRET || 'neoserv-migration-2024';

    if (secret !== MIGRATION_SECRET) {
      return res.status(401).json({
        error: 'Secret invalide',
        message: 'Envoyez le secret dans le body: { "secret": "neoserv-migration-2024" }'
      });
    }

    console.log('🏢 Initialisation des informations de l\'entreprise...');

    const companyData = {
      name: 'SARL NEOSERV',
      legalForm: 'SARL',
      siret: 'À COMPLÉTER',
      vatNumber: 'À COMPLÉTER',
      address: 'À COMPLÉTER',
      addressLine2: '',
      postalCode: '97100',
      city: 'À COMPLÉTER',
      country: 'France',
      region: 'Guadeloupe',
      phone: 'À COMPLÉTER',
      mobile: '',
      email: 'contact@neoserv.com',
      website: 'https://neoserv.fr',
      capital: 'À COMPLÉTER',
      rcs: 'À COMPLÉTER',
      description: 'Commerce de produits de bagagerie et accessoires de voyage'
    };

    let created = 0;
    let updated = 0;

    for (const [key, value] of Object.entries(companyData)) {
      const existing = await prisma.settings.findUnique({
        where: { key: `company_${key}` }
      });

      if (existing) {
        await prisma.settings.update({
          where: { key: `company_${key}` },
          data: { value: String(value) }
        });
        updated++;
      } else {
        await prisma.settings.create({
          data: {
            key: `company_${key}`,
            value: String(value),
            type: 'string'
          }
        });
        created++;
      }
    }

    res.json({
      success: true,
      message: `✅ Informations de l'entreprise initialisées`,
      stats: {
        created,
        updated,
        total: created + updated
      }
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'initialisation',
      details: error.message
    });
  }
});

/**
 * Route pour voir les derniers produits traités avec images Unsplash
 */
router.get('/check-last-products', async (req, res) => {
  try {
    // Récupérer les 10 produits récemment mis à jour avec images
    const products = await prisma.product.findMany({
      where: {
        images: {
          isEmpty: false
        }
      },
      select: {
        id: true,
        sku: true,
        name: true,
        images: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });

    // Filtrer ceux qui ont des images Unsplash
    const productsWithUnsplash = products
      .map(p => ({
        sku: p.sku,
        name: p.name,
        totalImages: p.images.length,
        unsplashImages: p.images.filter(img => img.includes('unsplash')).length,
        updatedAt: p.updatedAt
      }))
      .filter(p => p.unsplashImages > 0);

    res.json({
      success: true,
      productsCount: productsWithUnsplash.length,
      products: productsWithUnsplash
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des produits',
      details: error.message
    });
  }
});

export default router;
