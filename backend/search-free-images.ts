import fetch from 'node-fetch';
import cloudinary from 'cloudinary';
import prisma from './src/config/database';
import fs from 'fs';
import path from 'path';

// Configuration des APIs (toutes GRATUITES)
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY || '';

const DRY_RUN = process.env.DRY_RUN === 'true';
const MAX_PRODUCTS = parseInt(process.env.MAX_PRODUCTS || '10');
const IMAGES_PER_PRODUCT = parseInt(process.env.IMAGES_PER_PRODUCT || '3');

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Nettoie et extrait les mots-clés pour la recherche
 */
function extractSearchKeywords(productName: string, description?: string): string {
  let text = productName.toLowerCase();

  // Enlever les références, codes, etc.
  text = text.replace(/\d+/g, ''); // Enlever les chiffres
  text = text.replace(/[^a-zA-Z\s]/g, ' '); // Garder seulement les lettres

  // Mots-clés principaux
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
    keywords.push('scale', 'luggage scale', 'weighing scale');
  }
  if (text.includes('chariot')) {
    keywords.push('trolley', 'cart', 'luggage cart');
  }
  if (text.includes('corde')) {
    keywords.push('strap', 'rope', 'cord');
  }
  if (text.includes('etiquette')) {
    keywords.push('tag', 'label', 'luggage tag');
  }
  if (text.includes('protection')) {
    keywords.push('cover', 'protective cover', 'case');
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
        thumbnail: img.urls.thumb,
        photographer: img.user.name,
        photographer_url: img.user.links.html,
        download_url: `${img.links.download_location}?client_id=${UNSPLASH_ACCESS_KEY}`
      }));
    }
  } catch (error) {
    console.error('   Erreur Unsplash:', error.message);
  }

  return [];
}

/**
 * Cherche des images sur Pexels
 */
async function searchPexels(query: string, perPage: number = 3): Promise<any[]> {
  if (!PEXELS_API_KEY) return [];

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=square`;
    const response = await fetch(url, {
      headers: {
        'Authorization': PEXELS_API_KEY
      }
    });

    const data: any = await response.json();

    if (data.photos && data.photos.length > 0) {
      return data.photos.map((img: any) => ({
        source: 'Pexels',
        url: img.src.large,
        thumbnail: img.src.medium,
        photographer: img.photographer,
        photographer_url: img.photographer_url
      }));
    }
  } catch (error) {
    console.error('   Erreur Pexels:', error.message);
  }

  return [];
}

/**
 * Cherche des images sur Pixabay
 */
async function searchPixabay(query: string, perPage: number = 3): Promise<any[]> {
  if (!PIXABAY_API_KEY) return [];

  try {
    const url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&per_page=${perPage}&image_type=photo&orientation=horizontal`;
    const response = await fetch(url);
    const data: any = await response.json();

    if (data.hits && data.hits.length > 0) {
      return data.hits.map((img: any) => ({
        source: 'Pixabay',
        url: img.largeImageURL,
        thumbnail: img.previewURL,
        photographer: img.user,
        photographer_url: `https://pixabay.com/users/${img.user}-${img.user_id}/`
      }));
    }
  } catch (error) {
    console.error('   Erreur Pixabay:', error.message);
  }

  return [];
}

/**
 * Cherche des images sur toutes les plateformes
 */
async function searchAllPlatforms(query: string, count: number): Promise<any[]> {
  const imagesPerPlatform = Math.ceil(count / 3);

  const [unsplashImages, pexelsImages, pixabayImages] = await Promise.all([
    searchUnsplash(query, imagesPerPlatform),
    searchPexels(query, imagesPerPlatform),
    searchPixabay(query, imagesPerPlatform)
  ]);

  // Mélanger les résultats des 3 plateformes
  const allImages = [
    ...unsplashImages,
    ...pexelsImages,
    ...pixabayImages
  ];

  // Retourner le nombre demandé
  return allImages.slice(0, count);
}

/**
 * Télécharge une image et l'upload vers Cloudinary
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

/**
 * Trouve et upload des images pour un produit
 */
async function findImagesForProduct(product: any): Promise<string[]> {
  const uploadedUrls: string[] = [];

  console.log(`\n📦 Recherche pour: ${product.name}`);
  console.log(`   SKU: ${product.sku}`);

  // Extraire les mots-clés de recherche
  const searchQuery = extractSearchKeywords(product.name, product.description);
  console.log(`   🔍 Requête: "${searchQuery}"`);

  if (DRY_RUN) {
    console.log('   ⚠️  DRY RUN - Pas de téléchargement réel');
    return [];
  }

  // Chercher des images
  const images = await searchAllPlatforms(searchQuery, IMAGES_PER_PRODUCT);

  if (images.length === 0) {
    console.log('   ❌ Aucune image trouvée');
    return [];
  }

  console.log(`   ✓ ${images.length} images trouvées`);

  // Upload chaque image
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const publicId = `${product.sku}_${img.source.toLowerCase()}_${i + 1}`;
    const attribution = `Photo by ${img.photographer} (${img.source})`;

    console.log(`   📤 Upload ${i + 1}/${images.length} de ${img.source}...`);

    // Notifier Unsplash si nécessaire
    if (img.source === 'Unsplash' && img.download_url) {
      await notifyUnsplashDownload(img.download_url);
    }

    const cloudinaryUrl = await uploadToCloudinary(img.url, publicId, attribution);

    if (cloudinaryUrl) {
      uploadedUrls.push(cloudinaryUrl);
      console.log(`   ✓ Uploadé: ${attribution}`);
    }

    // Pause entre les uploads
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return uploadedUrls;
}

/**
 * Met à jour les images d'un produit (AJOUTE aux images existantes)
 */
async function updateProductImages(productId: string, newImages: string[], existingImages: string[]): Promise<void> {
  if (newImages.length === 0) return;

  try {
    // Combiner images existantes + nouvelles images
    const allImages = [...existingImages, ...newImages];

    // Utiliser la première image comme thumbnail si pas de thumbnail existant
    await prisma.$executeRaw`
      UPDATE products
      SET images = ${allImages}::text[],
          thumbnail = COALESCE(thumbnail, ${allImages[0]})
      WHERE id = ${productId}
    `;
    console.log(`   ✓ Base de données mise à jour (${newImages.length} nouvelles images, total: ${allImages.length})`);
  } catch (error) {
    console.error(`   ❌ Erreur mise à jour DB:`, error.message);
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🖼️  RECHERCHE D\'IMAGES GRATUITES HAUTE QUALITÉ\n');
  console.log('======================================================================');

  // Vérifier les clés API
  const apis: string[] = [];
  if (UNSPLASH_ACCESS_KEY) apis.push('Unsplash');
  if (PEXELS_API_KEY) apis.push('Pexels');
  if (PIXABAY_API_KEY) apis.push('Pixabay');

  if (apis.length === 0) {
    console.error('❌ Aucune clé API configurée!');
    console.log('\n💡 Pour obtenir vos clés API GRATUITES:');
    console.log('\n📸 Unsplash (Recommandé - Meilleure qualité):');
    console.log('   1. https://unsplash.com/developers');
    console.log('   2. "Register as a developer"');
    console.log('   3. Créez une app → Copiez "Access Key"');
    console.log('   4. Ajoutez dans .env: UNSPLASH_ACCESS_KEY=xxx');
    console.log('\n📸 Pexels:');
    console.log('   1. https://www.pexels.com/api/');
    console.log('   2. "Get Started"');
    console.log('   3. Copiez votre API Key');
    console.log('   4. Ajoutez dans .env: PEXELS_API_KEY=xxx');
    console.log('\n📸 Pixabay:');
    console.log('   1. https://pixabay.com/api/docs/');
    console.log('   2. Créez un compte → API Key dans votre profil');
    console.log('   3. Ajoutez dans .env: PIXABAY_API_KEY=xxx\n');
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log('⚠️  MODE DRY RUN - Aucune image ne sera téléchargée');
    console.log('   Pour télécharger réellement, enlevez DRY_RUN=true\n');
  }

  console.log(`📊 Configuration:`);
  console.log(`   - APIs actives: ${apis.join(', ')}`);
  console.log(`   - Max produits: ${MAX_PRODUCTS}`);
  console.log(`   - Images par produit: ${IMAGES_PER_PRODUCT}`);
  console.log(`   - Mode: ${DRY_RUN ? 'DRY RUN' : 'PRODUCTION'}`);
  console.log('======================================================================\n');

  try {
    // Récupérer TOUS les produits (on va ajouter des images aux produits existants)
    const products = await prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        name: true,
        description: true,
        images: true
      },
      take: MAX_PRODUCTS,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📦 ${products.length} produits à traiter\n`);

    let processed = 0;
    let success = 0;
    let failed = 0;
    let totalImages = 0;

    for (const product of products) {
      processed++;

      const foundImages = await findImagesForProduct(product);

      if (foundImages.length > 0) {
        // Passer les images existantes pour les conserver
        await updateProductImages(product.id, foundImages, product.images || []);
        success++;
        totalImages += foundImages.length;
      } else {
        failed++;
      }

      console.log(`   Progression: ${processed}/${products.length}\n`);

      // Pause entre les produits pour respecter les rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n======================================================================');
    console.log('✅ RECHERCHE ET TÉLÉCHARGEMENT TERMINÉS');
    console.log('======================================================================');
    console.log(`📊 Produits traités: ${processed}`);
    console.log(`✓ Succès: ${success}`);
    console.log(`✗ Échecs: ${failed}`);
    console.log(`🖼️  Total images téléchargées: ${totalImages}`);
    console.log(`💰 Coût: GRATUIT (images libres de droits)`);
    console.log('======================================================================');
    console.log('\n📝 Attribution:');
    console.log('   Les crédits des photographes sont enregistrés dans Cloudinary');
    console.log('   (metadata de chaque image)');
    console.log('======================================================================\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Lancer le script
main();
