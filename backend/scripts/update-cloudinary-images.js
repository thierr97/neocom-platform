/**
 * Script pour améliorer les images Cloudinary des produits
 * - Suppression du fond (background removal)
 * - Amélioration de la qualité
 * - Mise à jour des URLs en base de données
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configuration Cloudinary
const CLOUD_NAME = 'dcckh4zyh';
const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/`;

/**
 * Transforme une URL Cloudinary pour ajouter :
 * - e_background_removal : suppression du fond
 * - q_auto:best : qualité optimale
 * - f_auto : format automatique (WebP pour les navigateurs compatibles)
 * - w_1000,c_limit : largeur max 1000px
 */
function transformCloudinaryUrl(originalUrl) {
  if (!originalUrl || !originalUrl.includes('cloudinary.com')) {
    return originalUrl;
  }

  // Extraire le public_id de l'URL
  const match = originalUrl.match(/upload\/(?:v\d+\/)?(.+)$/);
  if (!match) return originalUrl;

  const publicId = match[1];

  // Construire la nouvelle URL avec transformations
  const transformations = [
    'e_background_removal',  // Suppression du fond
    'q_auto:best',          // Qualité optimale
    'f_auto',               // Format automatique
    'w_1000',               // Largeur max 1000px
    'c_limit'               // Conserver proportions
  ].join(',');

  return `${BASE_URL}${transformations}/${publicId}`;
}

/**
 * Mettre à jour tous les produits avec les nouvelles URLs
 */
async function updateProductImages() {
  try {
    console.log('🔄 Récupération des produits...');

    // Récupérer tous les produits avec des images
    const products = await prisma.product.findMany({
      where: {
        images: {
          isEmpty: false
        }
      }
    });

    console.log(`📦 ${products.length} produits trouvés avec des images`);

    let updatedCount = 0;

    for (const product of products) {
      const updates = {};

      // Transformer le thumbnail
      if (product.thumbnail && product.thumbnail.includes('cloudinary.com')) {
        updates.thumbnail = transformCloudinaryUrl(product.thumbnail);
      }

      // Transformer les images
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        const hasCloudinaryImages = product.images.some(img =>
          typeof img === 'string' && img.includes('cloudinary.com')
        );

        if (hasCloudinaryImages) {
          updates.images = product.images.map(img => {
            if (typeof img === 'string' && img.includes('cloudinary.com')) {
              return transformCloudinaryUrl(img);
            }
            return img;
          });
          console.log(`\n📸 Produit: ${product.name}`);
          console.log(`   ${product.images.length} image(s) transformée(s)`);
          if (updates.thumbnail) {
            console.log(`   ✓ Thumbnail transformé`);
          }
        }
      }

      // Mettre à jour le produit si nécessaire
      if (Object.keys(updates).length > 0) {
        await prisma.product.update({
          where: { id: product.id },
          data: updates
        });
        updatedCount++;
      }
    }

    console.log(`\n✅ ${updatedCount} produits mis à jour avec succès !`);
    console.log(`\n📋 Transformations appliquées :`);
    console.log(`   ✓ Suppression du fond`);
    console.log(`   ✓ Qualité optimale (q_auto:best)`);
    console.log(`   ✓ Format automatique (WebP/AVIF)`);
    console.log(`   ✓ Redimensionnement intelligent (max 1000px)`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Mode test : afficher les transformations sans les appliquer
 */
async function previewTransformations() {
  try {
    console.log('👀 APERÇU DES TRANSFORMATIONS (mode test)\n');

    const products = await prisma.product.findMany({
      where: {
        images: {
          isEmpty: false
        }
      },
      take: 5 // Limiter à 5 pour l'aperçu
    });

    for (const product of products) {
      console.log(`\n📦 ${product.name}`);

      if (product.thumbnail && product.thumbnail.includes('cloudinary.com')) {
        const newUrl = transformCloudinaryUrl(product.thumbnail);
        console.log(`   🖼️  Thumbnail:`);
        console.log(`      Avant: ${product.thumbnail}`);
        console.log(`      Après: ${newUrl}`);
      }

      if (product.images && Array.isArray(product.images)) {
        const cloudinaryImages = product.images.filter(img =>
          typeof img === 'string' && img.includes('cloudinary.com')
        );
        if (cloudinaryImages.length > 0) {
          console.log(`   📷 ${cloudinaryImages.length} image(s) seront transformée(s)`);
          cloudinaryImages.slice(0, 2).forEach((img, idx) => {
            console.log(`      Image ${idx + 1}:`);
            console.log(`        Avant: ${img}`);
            console.log(`        Après: ${transformCloudinaryUrl(img)}`);
          });
          if (cloudinaryImages.length > 2) {
            console.log(`      ... et ${cloudinaryImages.length - 2} autre(s)`);
          }
        }
      }
    }

    console.log(`\n\n💡 Pour appliquer les transformations, exécutez:`);
    console.log(`   node scripts/update-cloudinary-images.js apply`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
const args = process.argv.slice(2);
const command = args[0];

if (command === 'apply') {
  console.log('🚀 APPLICATION DES TRANSFORMATIONS\n');
  updateProductImages()
    .then(() => {
      console.log('\n✅ Terminé !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erreur:', error);
      process.exit(1);
    });
} else {
  previewTransformations()
    .then(() => {
      console.log('\n✅ Aperçu terminé !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erreur:', error);
      process.exit(1);
    });
}
