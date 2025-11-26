const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration
const IMAGES_DIR = '/Users/thierrycyrillefrancillette/Downloads/images_produits';
const BATCH_SIZE = 10; // Upload 10 images en parallèle
const FOLDER = 'neoserv/products'; // Dossier dans Cloudinary

// Fonction pour uploader une image
async function uploadImage(filePath, sku) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: FOLDER,
      public_id: sku,
      resource_type: 'image',
      overwrite: false, // Ne pas écraser si existe déjà
    });

    return {
      success: true,
      sku: sku,
      url: result.secure_url,
      cloudinaryId: result.public_id
    };
  } catch (error) {
    return {
      success: false,
      sku: sku,
      error: error.message
    };
  }
}

// Fonction pour traiter les images par batch
async function uploadBatch(images) {
  const promises = images.map(({ filePath, sku }) => uploadImage(filePath, sku));
  return await Promise.all(promises);
}

// Fonction pour mettre à jour un produit avec son URL d'image
async function updateProductImage(sku, imageUrl) {
  try {
    // Trouver le produit par SKU
    const product = await prisma.product.findFirst({
      where: { sku: sku }
    });

    if (!product) {
      return { success: false, sku, error: 'Produit non trouvé' };
    }

    // Mettre à jour les images du produit
    const existingImages = product.images || [];
    const updatedImages = [...existingImages, imageUrl];

    await prisma.product.update({
      where: { id: product.id },
      data: { images: updatedImages }
    });

    return { success: true, sku };
  } catch (error) {
    return { success: false, sku, error: error.message };
  }
}

// Fonction principale
async function uploadAllImages() {
  console.log('🚀 Début de l\'upload des images vers Cloudinary...\n');
  console.log(`📁 Dossier source: ${IMAGES_DIR}`);
  console.log(`☁️  Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`📦 Dossier Cloudinary: ${FOLDER}\n`);

  try {
    // Lire tous les fichiers du dossier
    const files = fs.readdirSync(IMAGES_DIR);
    const imageFiles = files.filter(file => /\.(png|jpg|jpeg|gif|webp)$/i.test(file));

    console.log(`✅ ${imageFiles.length} images trouvées\n`);

    // Préparer les images à uploader
    const imagesToUpload = imageFiles.map(file => {
      const filePath = path.join(IMAGES_DIR, file);
      // Extraire le SKU du nom de fichier (sans l'extension)
      const sku = path.basename(file, path.extname(file));
      return { filePath, sku, filename: file };
    });

    // Upload par batch
    let successCount = 0;
    let errorCount = 0;
    let updateCount = 0;
    const errors = [];
    const skuToUrl = {}; // Mapping SKU -> URL

    console.log('📤 Début de l\'upload...\n');

    for (let i = 0; i < imagesToUpload.length; i += BATCH_SIZE) {
      const batch = imagesToUpload.slice(i, i + BATCH_SIZE);
      const results = await uploadBatch(batch);

      // Traiter les résultats
      for (const result of results) {
        if (result.success) {
          successCount++;
          skuToUrl[result.sku] = result.url;
          console.log(`  ✓ [${successCount}/${imageFiles.length}] ${result.sku} uploadé`);

          // Mettre à jour le produit dans la base de données
          const updateResult = await updateProductImage(result.sku, result.url);
          if (updateResult.success) {
            updateCount++;
          }
        } else {
          errorCount++;
          errors.push(result);
          console.log(`  ✗ [${successCount + errorCount}/${imageFiles.length}] ${result.sku} - Erreur: ${result.error}`);
        }
      }

      // Afficher la progression
      if ((i + BATCH_SIZE) % 100 === 0 || i + BATCH_SIZE >= imagesToUpload.length) {
        const progress = Math.min(i + BATCH_SIZE, imagesToUpload.length);
        console.log(`\n  📊 Progression: ${progress}/${imagesToUpload.length} (${Math.round(progress / imagesToUpload.length * 100)}%)\n`);
      }

      // Petite pause pour ne pas surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Sauvegarder le mapping dans un fichier JSON
    const mappingPath = path.join(__dirname, 'sku-to-cloudinary-url.json');
    fs.writeFileSync(mappingPath, JSON.stringify(skuToUrl, null, 2));

    // Résumé final
    console.log('\n' + '='.repeat(70));
    console.log('📊 RÉSULTAT FINAL');
    console.log('='.repeat(70));
    console.log(`✅ Images uploadées avec succès: ${successCount}`);
    console.log(`🔄 Produits mis à jour: ${updateCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`💾 Mapping sauvegardé: ${mappingPath}`);
    console.log('='.repeat(70));

    // Afficher quelques erreurs si présentes
    if (errors.length > 0) {
      console.log('\n❌ Premières erreurs:');
      errors.slice(0, 10).forEach(err => {
        console.log(`  SKU ${err.sku}: ${err.error}`);
      });
      if (errors.length > 10) {
        console.log(`  ... et ${errors.length - 10} autres erreurs`);
      }
    }

    console.log('\n✅ Upload terminé!');

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
uploadAllImages();
