import Replicate from 'replicate';
import fetch from 'node-fetch';
import cloudinary from 'cloudinary';
import prisma from './src/config/database';
import fs from 'fs';
import path from 'path';

// Configuration
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || '';
const DRY_RUN = process.env.DRY_RUN === 'true';
const MAX_PRODUCTS = parseInt(process.env.MAX_PRODUCTS || '10');

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Initialize Replicate
const replicate = new Replicate({
  auth: REPLICATE_API_TOKEN,
});

// Angles de vue pour images e-commerce
const PRODUCT_ANGLES = [
  {
    name: 'front',
    prompt: 'front view, centered, professional product photography'
  },
  {
    name: 'angle',
    prompt: '45 degree angle view, professional product photography'
  },
  {
    name: 'lifestyle',
    prompt: 'lifestyle shot, product in use, professional photography'
  }
];

/**
 * Génère un prompt optimisé pour l'image d'un produit
 */
function generateProductPrompt(productName: string, description: string, angle: string): string {
  // Nettoyer et extraire les mots-clés
  const cleanName = productName.toLowerCase();

  // Prompt de base pour e-commerce
  let basePrompt = `Professional product photography, ${cleanName}, ${angle}, `;
  basePrompt += 'white background, studio lighting, high quality, 4k resolution, ';
  basePrompt += 'sharp focus, commercial photography style, ';

  // Ajouter des détails si c'est un type de produit connu
  if (cleanName.includes('valise') || cleanName.includes('bagage')) {
    basePrompt += 'luggage, suitcase, travel bag, modern design, ';
  } else if (cleanName.includes('tapis')) {
    basePrompt += 'floor mat, carpet, home decor, ';
  } else if (cleanName.includes('cadenas') || cleanName.includes('serrure')) {
    basePrompt += 'lock, security device, metal finish, ';
  } else if (cleanName.includes('balance')) {
    basePrompt += 'scale, measuring device, digital display, ';
  }

  basePrompt += 'professional lighting, e-commerce style, clean background';

  return basePrompt;
}

/**
 * Génère une image avec Stable Diffusion XL
 */
async function generateImage(prompt: string): Promise<string | null> {
  try {
    console.log(`   🎨 Génération avec prompt: "${prompt.substring(0, 100)}..."`);

    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: prompt,
          negative_prompt: "low quality, blurry, distorted, watermark, text, logo, signature, cartoon, drawing, illustration",
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 50,
          width: 1024,
          height: 1024
        }
      }
    ) as string[];

    if (output && output.length > 0) {
      return output[0];
    }

    return null;
  } catch (error) {
    console.error('   ❌ Erreur génération:', error.message);
    return null;
  }
}

/**
 * Upload une image vers Cloudinary
 */
async function uploadToCloudinary(imageUrl: string, publicId: string): Promise<string | null> {
  try {
    const result = await cloudinary.v2.uploader.upload(imageUrl, {
      public_id: publicId,
      folder: 'neoserv/products/ai-generated',
      overwrite: true,
      transformation: [
        { width: 1200, height: 1200, crop: 'pad', background: 'white' },
        { quality: 'auto:best' },
        { fetch_format: 'auto' }
      ]
    });

    return result.secure_url;
  } catch (error) {
    console.error('   ❌ Erreur upload Cloudinary:', error.message);
    return null;
  }
}

/**
 * Génère des images IA pour un produit
 */
async function generateProductImages(product: any): Promise<string[]> {
  const generatedUrls: string[] = [];

  console.log(`\n📦 Traitement: ${product.name}`);
  console.log(`   SKU: ${product.sku}`);

  if (DRY_RUN) {
    console.log('   ⚠️  DRY RUN - Pas de génération réelle');
    return [];
  }

  // Générer une image pour chaque angle
  for (const angle of PRODUCT_ANGLES) {
    const prompt = generateProductPrompt(product.name, product.description || '', angle.prompt);

    // Générer l'image
    const imageUrl = await generateImage(prompt);

    if (imageUrl) {
      console.log(`   ✓ Image générée: ${angle.name}`);

      // Upload vers Cloudinary
      const publicId = `${product.sku}_ai_${angle.name}`;
      const cloudinaryUrl = await uploadToCloudinary(imageUrl, publicId);

      if (cloudinaryUrl) {
        console.log(`   ✓ Uploadé vers Cloudinary`);
        generatedUrls.push(cloudinaryUrl);
      }
    }

    // Pause entre les générations pour éviter le rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return generatedUrls;
}

/**
 * Met à jour les images d'un produit
 */
async function updateProductImages(productId: string, newImages: string[]): Promise<void> {
  if (newImages.length === 0) return;

  try {
    await prisma.$executeRaw`
      UPDATE products
      SET images = ${newImages}::text[],
          thumbnail = ${newImages[0]}
      WHERE id = ${productId}
    `;
    console.log(`   ✓ Base de données mise à jour`);
  } catch (error) {
    console.error(`   ❌ Erreur mise à jour DB:`, error.message);
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🎨 GÉNÉRATION D\'IMAGES IA POUR PRODUITS E-COMMERCE\n');
  console.log('======================================================================');

  if (!REPLICATE_API_TOKEN) {
    console.error('❌ REPLICATE_API_TOKEN manquant dans .env');
    console.log('\n💡 Pour obtenir une clé API:');
    console.log('   1. Créez un compte sur https://replicate.com');
    console.log('   2. Allez dans Account → API Tokens');
    console.log('   3. Copiez votre token et ajoutez-le dans .env');
    console.log('   4. REPLICATE_API_TOKEN=r8_xxx...');
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log('⚠️  MODE DRY RUN - Aucune image ne sera générée');
    console.log('   Pour générer réellement, enlevez DRY_RUN=true de .env\n');
  }

  console.log(`📊 Configuration:`);
  console.log(`   - Max produits: ${MAX_PRODUCTS}`);
  console.log(`   - Images par produit: ${PRODUCT_ANGLES.length}`);
  console.log(`   - Mode: ${DRY_RUN ? 'DRY RUN' : 'PRODUCTION'}`);
  console.log('======================================================================\n');

  try {
    // Récupérer les produits sans images ou avec peu d'images
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { images: { isEmpty: true } },
          { thumbnail: null }
        ]
      },
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

    for (const product of products) {
      processed++;

      const generatedImages = await generateProductImages(product);

      if (generatedImages.length > 0) {
        await updateProductImages(product.id, generatedImages);
        success++;
      } else {
        failed++;
      }

      console.log(`   Progression: ${processed}/${products.length}\n`);
    }

    console.log('\n======================================================================');
    console.log('✅ GÉNÉRATION TERMINÉE');
    console.log('======================================================================');
    console.log(`📊 Produits traités: ${processed}`);
    console.log(`✓ Succès: ${success}`);
    console.log(`✗ Échecs: ${failed}`);
    console.log(`🎨 Total images générées: ${success * PRODUCT_ANGLES.length}`);
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
