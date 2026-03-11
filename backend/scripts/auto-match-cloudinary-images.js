/**
 * Script pour associer automatiquement les images Cloudinary aux produits
 * en utilisant les noms de fichiers (SKU/codes produits)
 */

const { PrismaClient } = require('@prisma/client');
const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();

const prisma = new PrismaClient();

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dcckh4zyh',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Nettoyer et normaliser un code produit pour la comparaison
 */
function normalizeCode(code) {
  return code
    .toString()
    .replace(/[^a-zA-Z0-9]/g, '') // Supprimer caractères spéciaux
    .toUpperCase()
    .replace(/^0+/, ''); // Supprimer zéros en début
}

/**
 * Construire l'URL optimisée Cloudinary avec toutes les transformations
 */
function buildOptimizedUrl(publicId) {
  return cloudinary.url(publicId, {
    effect: 'background_removal',  // Suppression du fond
    quality: 'auto:best',          // Qualité optimale
    fetch_format: 'auto',          // Format automatique
    width: 1000,                   // Largeur max
    crop: 'limit',                 // Conserver proportions
    secure: true                   // HTTPS
  });
}

/**
 * Récupérer toutes les images Cloudinary
 */
async function getAllCloudinaryImages() {
  try {
    const allImages = [];
    let nextCursor = null;

    do {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'neoserv/products',
        max_results: 500,
        next_cursor: nextCursor
      });

      allImages.push(...result.resources);
      nextCursor = result.next_cursor;

    } while (nextCursor);

    return allImages;

  } catch (error) {
    console.error('❌ Erreur récupération Cloudinary:', error.message);
    throw error;
  }
}

/**
 * Extraire le code produit d'un public_id Cloudinary
 * Ex: "neoserv/products/000009" → "000009"
 * Ex: "neoserv/products/000009_1" → "000009"
 */
function extractProductCode(publicId) {
  const match = publicId.match(/\/([^\/]+?)(?:_\d+)?$/);
  return match ? match[1] : null;
}

/**
 * Grouper les images par code produit
 */
function groupImagesByProduct(cloudinaryImages) {
  const grouped = {};

  for (const image of cloudinaryImages) {
    const productCode = extractProductCode(image.public_id);
    if (!productCode) continue;

    if (!grouped[productCode]) {
      grouped[productCode] = [];
    }

    grouped[productCode].push({
      publicId: image.public_id,
      url: image.secure_url,
      optimizedUrl: buildOptimizedUrl(image.public_id)
    });
  }

  return grouped;
}

/**
 * Trouver un produit par son code (SKU, barcode, ou recherche flexible)
 */
async function findProductByCode(code) {
  const normalizedCode = normalizeCode(code);

  // Essayer les correspondances exactes d'abord
  let product = await prisma.product.findFirst({
    where: {
      OR: [
        { sku: code },
        { barcode: code },
        { sku: normalizedCode },
        { barcode: normalizedCode }
      ]
    }
  });

  // Si pas trouvé, essayer une recherche flexible
  if (!product) {
    product = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: { contains: code, mode: 'insensitive' } },
          { barcode: { contains: code, mode: 'insensitive' } },
          { sku: { contains: normalizedCode, mode: 'insensitive' } },
          { barcode: { contains: normalizedCode, mode: 'insensitive' } }
        ]
      }
    });
  }

  return product;
}

/**
 * Associer automatiquement toutes les images aux produits
 */
async function autoMatchImages(dryRun = true) {
  try {
    console.log('🚀 ASSOCIATION AUTOMATIQUE DES IMAGES CLOUDINARY\n');
    console.log(dryRun ? '👀 Mode APERÇU (aucun changement)\n' : '✏️  Mode ÉCRITURE (modifications en cours)\n');

    // 1. Récupérer les images Cloudinary
    console.log('📥 Récupération des images Cloudinary...');
    const cloudinaryImages = await getAllCloudinaryImages();
    console.log(`✅ ${cloudinaryImages.length} images trouvées\n`);

    // 2. Grouper par code produit
    console.log('📋 Groupement par code produit...');
    const groupedImages = groupImagesByProduct(cloudinaryImages);
    console.log(`✅ ${Object.keys(groupedImages).length} codes produits uniques\n`);

    // 3. Matcher avec les produits en base
    console.log('🔍 Association avec les produits...\n');

    let matched = 0;
    let notFound = 0;
    const updates = [];

    for (const [code, images] of Object.entries(groupedImages)) {
      const product = await findProductByCode(code);

      if (product) {
        matched++;
        const imageUrls = images.map(img => img.optimizedUrl);

        console.log(`✅ ${code} → ${product.name}`);
        console.log(`   SKU: ${product.sku}`);
        console.log(`   ${images.length} image(s)`);
        console.log('');

        updates.push({
          product,
          images: imageUrls
        });

      } else {
        notFound++;
        if (notFound <= 10) { // Afficher seulement les 10 premiers non trouvés
          console.log(`⚠️  ${code} → Produit non trouvé`);
        }
      }
    }

    if (notFound > 10) {
      console.log(`   ... et ${notFound - 10} autre(s) non trouvé(s)\n`);
    }

    // 4. Appliquer les mises à jour
    if (!dryRun && updates.length > 0) {
      console.log(`\n💾 Application des mises à jour...`);

      for (const { product, images } of updates) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            images: images,
            thumbnail: images[0] // Première image comme thumbnail
          }
        });
      }
    }

    // 5. Résumé
    console.log('\n📊 RÉSUMÉ:');
    console.log(`   ✅ Produits trouvés: ${matched}`);
    console.log(`   ⚠️  Codes non matchés: ${notFound}`);
    console.log(`   📸 Total images: ${cloudinaryImages.length}`);

    if (dryRun) {
      console.log(`\n💡 Pour appliquer les changements:`);
      console.log(`   node scripts/auto-match-cloudinary-images.js apply`);
    } else {
      console.log(`\n✅ Mise à jour terminée !`);
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
const args = process.argv.slice(2);
const command = args[0];

if (command === 'apply') {
  autoMatchImages(false) // Mode écriture
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else {
  autoMatchImages(true) // Mode aperçu
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
