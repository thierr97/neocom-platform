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
const IMAGES_DIR = process.env.IMAGES_DIR || '/Users/thierrycyrillefrancillette/Downloads/images_produits';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 10;
const FOLDER = 'neoserv/products';
const PROGRESS_FILE = path.join(__dirname, 'upload-progress.json');
const DRY_RUN = process.env.DRY_RUN === 'true';

// Charger la progression sauvegardée
function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
      console.log(`📁 Progression précédente trouvée: ${data.processed}/${data.total} images`);
      return data;
    }
  } catch (error) {
    console.log('⚠️  Erreur lors du chargement de la progression:', error.message);
  }
  return { processed: 0, total: 0, uploadedSKUs: {}, errors: [] };
}

// Sauvegarder la progression
function saveProgress(data) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de la progression:', error.message);
  }
}

// Fonction pour uploader une image
async function uploadImage(filePath, sku, variant = null) {
  try {
    const publicId = variant ? `${sku}_${variant}` : sku;

    if (DRY_RUN) {
      console.log(`[DRY RUN] Simuler l'upload de: ${publicId}`);
      return {
        success: true,
        sku: sku,
        variant: variant,
        url: `https://res.cloudinary.com/demo/image/upload/${FOLDER}/${publicId}.jpg`,
        cloudinaryId: `${FOLDER}/${publicId}`
      };
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder: FOLDER,
      public_id: publicId,
      resource_type: 'image',
      overwrite: false,
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto:best' },
        { fetch_format: 'auto' }
      ]
    });

    return {
      success: true,
      sku: sku,
      variant: variant,
      url: result.secure_url,
      cloudinaryId: result.public_id
    };
  } catch (error) {
    // Si l'image existe déjà, récupérer son URL
    if (error.message && error.message.includes('already exists')) {
      try {
        const publicId = variant ? `${sku}_${variant}` : sku;
        const existing = await cloudinary.api.resource(`${FOLDER}/${publicId}`);
        return {
          success: true,
          sku: sku,
          variant: variant,
          url: existing.secure_url,
          cloudinaryId: existing.public_id,
          existed: true
        };
      } catch (fetchError) {
        return {
          success: false,
          sku: sku,
          variant: variant,
          error: fetchError.message
        };
      }
    }

    return {
      success: false,
      sku: sku,
      variant: variant,
      error: error.message
    };
  }
}

// Traiter les images par batch
async function uploadBatch(images) {
  const promises = images.map(({ filePath, sku, variant }) =>
    uploadImage(filePath, sku, variant)
  );
  return await Promise.all(promises);
}

// Mettre à jour un produit avec ses URLs d'images
async function updateProductImages(sku, imageUrls) {
  if (DRY_RUN) {
    console.log(`[DRY RUN] Simuler mise à jour du produit ${sku} avec ${imageUrls.length} images`);
    return { success: true, sku };
  }

  try {
    const product = await prisma.product.findFirst({
      where: { sku: sku }
    });

    if (!product) {
      return { success: false, sku, error: 'Produit non trouvé' };
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        images: imageUrls,
        thumbnail: imageUrls[0] || null
      }
    });

    return { success: true, sku, count: imageUrls.length };
  } catch (error) {
    return { success: false, sku, error: error.message };
  }
}

// Fonction principale
async function uploadAllImages() {
  const startTime = Date.now();
  console.log('🚀 Début de l\'upload des images vers Cloudinary...\n');
  console.log(`📁 Dossier source: ${IMAGES_DIR}`);
  console.log(`☁️  Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`📦 Dossier Cloudinary: ${FOLDER}`);
  console.log(`🔄 Mode: ${DRY_RUN ? 'DRY RUN (simulation)' : 'PRODUCTION'}`);
  console.log(`⚡ Batch size: ${BATCH_SIZE}\n`);

  try {
    // Charger la progression précédente
    const progress = loadProgress();

    // Lire tous les fichiers du dossier
    const files = fs.readdirSync(IMAGES_DIR);
    const imageFiles = files.filter(file => /\.(png|jpg|jpeg|gif|webp)$/i.test(file));

    console.log(`✅ ${imageFiles.length} images trouvées\n`);
    progress.total = imageFiles.length;

    // Grouper les images par SKU
    const imagesBySKU = {};
    imageFiles.forEach(file => {
      const filename = path.basename(file, path.extname(file));
      const parts = filename.split('_');
      const sku = parts[0];
      const variant = parts[1] || null;

      if (!imagesBySKU[sku]) {
        imagesBySKU[sku] = [];
      }

      imagesBySKU[sku].push({
        filePath: path.join(IMAGES_DIR, file),
        sku: sku,
        variant: variant,
        filename: file
      });
    });

    console.log(`📊 ${Object.keys(imagesBySKU).length} SKUs uniques trouvés\n`);

    // Préparer les images à uploader (exclure celles déjà traitées)
    const imagesToUpload = [];
    for (const sku in imagesBySKU) {
      if (!progress.uploadedSKUs[sku]) {
        imagesToUpload.push(...imagesBySKU[sku]);
      }
    }

    console.log(`🔄 ${imagesToUpload.length} images restantes à uploader\n`);

    let successCount = progress.processed;
    let errorCount = progress.errors.length;
    let updateCount = Object.keys(progress.uploadedSKUs).length;
    const skippedCount = imageFiles.length - imagesToUpload.length;

    if (skippedCount > 0) {
      console.log(`⏭️  ${skippedCount} images déjà uploadées (ignorées)\n`);
    }

    console.log('📤 Début de l\'upload...\n');

    // Upload par batch
    for (let i = 0; i < imagesToUpload.length; i += BATCH_SIZE) {
      const batch = imagesToUpload.slice(i, i + BATCH_SIZE);
      const results = await uploadBatch(batch);

      // Grouper les résultats par SKU
      const resultsBySKU = {};
      for (const result of results) {
        if (!resultsBySKU[result.sku]) {
          resultsBySKU[result.sku] = [];
        }
        resultsBySKU[result.sku].push(result);
      }

      // Traiter les résultats par SKU
      for (const sku in resultsBySKU) {
        const skuResults = resultsBySKU[sku];
        const allSuccess = skuResults.every(r => r.success);

        if (allSuccess) {
          const urls = skuResults.map(r => r.url);

          // Mettre à jour le produit
          const updateResult = await updateProductImages(sku, urls);
          if (updateResult.success) {
            progress.uploadedSKUs[sku] = urls;
            updateCount++;
            console.log(`  ✓ SKU ${sku}: ${urls.length} image(s) uploadée(s) et produit mis à jour`);
          } else {
            console.log(`  ⚠️  SKU ${sku}: Images uploadées mais mise à jour échouée: ${updateResult.error}`);
          }

          successCount += skuResults.length;
        } else {
          // Au moins une erreur pour ce SKU
          const failedResults = skuResults.filter(r => !r.success);
          failedResults.forEach(result => {
            errorCount++;
            progress.errors.push(result);
            console.log(`  ✗ ${result.sku}${result.variant ? '_' + result.variant : ''} - Erreur: ${result.error}`);
          });
        }
      }

      progress.processed = successCount;

      // Sauvegarder la progression toutes les 100 images
      if ((i + BATCH_SIZE) % 100 === 0) {
        saveProgress(progress);
        const current = Math.min(i + BATCH_SIZE, imagesToUpload.length);
        const percent = Math.round((successCount / imageFiles.length) * 100);
        const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
        console.log(`\n  📊 Progression: ${successCount}/${imageFiles.length} (${percent}%) | Temps écoulé: ${elapsed} min\n`);
      }

      // Petite pause pour ne pas surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Sauvegarder la progression finale
    saveProgress(progress);

    // Sauvegarder le mapping SKU -> URLs
    const mappingPath = path.join(__dirname, 'sku-to-cloudinary-urls.json');
    fs.writeFileSync(mappingPath, JSON.stringify(progress.uploadedSKUs, null, 2));

    // Résumé final
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log('\n' + '='.repeat(70));
    console.log('📊 RÉSULTAT FINAL');
    console.log('='.repeat(70));
    console.log(`✅ Images uploadées: ${successCount}`);
    console.log(`🔄 Produits mis à jour: ${updateCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`⏭️  Images ignorées (déjà uploadées): ${skippedCount}`);
    console.log(`⏱️  Temps total: ${totalTime} minutes`);
    console.log(`💾 Mapping sauvegardé: ${mappingPath}`);
    console.log('='.repeat(70));

    // Afficher quelques erreurs si présentes
    if (progress.errors.length > 0) {
      console.log('\n❌ Premières erreurs:');
      progress.errors.slice(0, 10).forEach(err => {
        const variant = err.variant ? `_${err.variant}` : '';
        console.log(`  SKU ${err.sku}${variant}: ${err.error}`);
      });
      if (progress.errors.length > 10) {
        console.log(`  ... et ${progress.errors.length - 10} autres erreurs`);
      }
    }

    console.log('\n✅ Upload terminé!');

    // Supprimer le fichier de progression si tout est réussi
    if (errorCount === 0 && successCount === imageFiles.length) {
      fs.unlinkSync(PROGRESS_FILE);
      console.log('🗑️  Fichier de progression supprimé (tout est terminé)');
    }

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
uploadAllImages();
