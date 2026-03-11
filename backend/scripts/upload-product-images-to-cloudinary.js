/**
 * Script pour uploader les images des produits vers Cloudinary
 * et mettre à jour la base de données avec les nouvelles URLs
 */

const { PrismaClient } = require('@prisma/client');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Configuration Cloudinary - Charger depuis .env
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dcckh4zyh',
  api_key: process.env.CLOUDINARY_API_KEY || '938475499917565',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'PLa3OTcmIHROKnevaZwWaAfwRX4'
});

/**
 * Upload une image locale vers Cloudinary avec optimisations
 */
async function uploadToCloudinary(imagePath, productSku) {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'neoserv/products',
      public_id: `${productSku}_${Date.now()}`,
      transformation: [
        {
          quality: 'auto:best',
          fetch_format: 'auto',
          width: 1000,
          crop: 'limit'
        }
      ],
      // Activer la suppression automatique du fond (nécessite un addon payant)
      // background_removal: 'cloudinary_ai'
    });

    // Construire l'URL avec suppression du fond et optimisations
    const optimizedUrl = cloudinary.url(result.public_id, {
      effect: 'background_removal',
      quality: 'auto:best',
      fetch_format: 'auto',
      width: 1000,
      crop: 'limit'
    });

    console.log(`✅ Upload réussi: ${optimizedUrl}`);
    return optimizedUrl;

  } catch (error) {
    console.error(`❌ Erreur upload:`, error.message);
    throw error;
  }
}

/**
 * Scanner un dossier d'images et les uploader
 */
async function uploadImagesFromFolder(folderPath) {
  try {
    console.log(`\n📁 Scan du dossier: ${folderPath}`);

    if (!fs.existsSync(folderPath)) {
      console.error(`❌ Le dossier n'existe pas: ${folderPath}`);
      return;
    }

    const files = fs.readdirSync(folderPath);
    const imageFiles = files.filter(file =>
      /\.(jpg|jpeg|png|webp|gif)$/i.test(file)
    );

    console.log(`📸 ${imageFiles.length} image(s) trouvée(s)`);

    for (const file of imageFiles) {
      const filePath = path.join(folderPath, file);
      const fileName = path.basename(file, path.extname(file));

      console.log(`\n⬆️  Upload: ${file}`);

      // Essayer de trouver le produit correspondant par SKU ou nom
      const product = await prisma.product.findFirst({
        where: {
          OR: [
            { sku: { contains: fileName, mode: 'insensitive' } },
            { name: { contains: fileName, mode: 'insensitive' } }
          ]
        }
      });

      if (!product) {
        console.log(`⚠️  Aucun produit trouvé pour: ${fileName}`);
        continue;
      }

      try {
        const cloudinaryUrl = await uploadToCloudinary(filePath, product.sku);

        // Mettre à jour le produit
        await prisma.product.update({
          where: { id: product.id },
          data: {
            images: {
              push: cloudinaryUrl
            },
            thumbnail: cloudinaryUrl // Utiliser comme thumbnail si pas déjà défini
          }
        });

        console.log(`✅ Produit mis à jour: ${product.name}`);

      } catch (uploadError) {
        console.error(`❌ Erreur pour ${file}:`, uploadError.message);
      }
    }

    console.log(`\n✅ Upload terminé !`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Associer manuellement une URL Cloudinary existante à un produit
 */
async function linkCloudinaryImageToProduct(productId, cloudinaryUrl) {
  try {
    console.log(`\n🔗 Liaison image au produit ${productId}`);

    // Ajouter les transformations à l'URL
    const optimizedUrl = cloudinaryUrl.replace(
      '/upload/',
      '/upload/e_background_removal,q_auto:best,f_auto,w_1000,c_limit/'
    );

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        images: {
          push: optimizedUrl
        },
        thumbnail: optimizedUrl
      }
    });

    console.log(`✅ Image liée au produit: ${product.name}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Lister toutes les images sur Cloudinary
 */
async function listCloudinaryImages() {
  try {
    console.log('\n📋 Images disponibles sur Cloudinary:\n');

    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'neoserv/products',
      max_results: 500
    });

    result.resources.forEach((resource, index) => {
      console.log(`${index + 1}. ${resource.public_id}`);
      console.log(`   URL: ${resource.secure_url}`);
      console.log(`   Taille: ${resource.width}x${resource.height}`);
      console.log('');
    });

    console.log(`\nTotal: ${result.resources.length} image(s)`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

// Exécution
const args = process.argv.slice(2);
const command = args[0];
const param = args[1];

if (command === 'upload' && param) {
  console.log('🚀 UPLOAD DES IMAGES VERS CLOUDINARY\n');
  uploadImagesFromFolder(param)
    .then(() => {
      console.log('\n✅ Terminé !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erreur:', error);
      process.exit(1);
    });

} else if (command === 'link' && param) {
  const [productId, cloudinaryUrl] = param.split(',');
  linkCloudinaryImageToProduct(productId, cloudinaryUrl)
    .then(() => {
      console.log('\n✅ Terminé !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erreur:', error);
      process.exit(1);
    });

} else if (command === 'list') {
  listCloudinaryImages()
    .then(() => {
      console.log('\n✅ Terminé !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erreur:', error);
      process.exit(1);
    });

} else {
  console.log(`
📸 GESTION DES IMAGES CLOUDINARY

Commandes disponibles:

1. Lister les images sur Cloudinary:
   node scripts/upload-product-images-to-cloudinary.js list

2. Upload depuis un dossier local:
   node scripts/upload-product-images-to-cloudinary.js upload /path/to/images

3. Lier une image Cloudinary existante à un produit:
   node scripts/upload-product-images-to-cloudinary.js link productId,https://res.cloudinary.com/...

💡 Astuce: Vos images sur Cloudinary seront automatiquement:
   ✓ Converties au format optimal (WebP/AVIF)
   ✓ Compressées avec qualité maximale
   ✓ Redimensionnées (max 1000px)
   ✓ Fond supprimé (si addon activé)
  `);
  process.exit(0);
}
