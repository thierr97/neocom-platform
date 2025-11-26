const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const FOLDER = 'neoserv/products';
const OUTPUT_FILE = path.join(__dirname, 'sku-to-cloudinary-urls.json');

async function generateMapping() {
  console.log('🔍 Récupération de toutes les images depuis Cloudinary...');
  console.log(`📁 Dossier: ${FOLDER}`);

  const mapping = {};
  let totalImages = 0;
  let nextCursor = null;

  try {
    do {
      // Récupérer les ressources avec pagination
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: FOLDER,
        max_results: 500, // Max par requête
        next_cursor: nextCursor
      });

      console.log(`📦 Récupéré ${result.resources.length} images (total: ${totalImages + result.resources.length})`);

      // Traiter chaque image
      for (const resource of result.resources) {
        totalImages++;

        // Extraire le SKU du public_id
        // Format: neoserv/products/SKU ou neoserv/products/SKU_1
        const publicId = resource.public_id;
        const skuMatch = publicId.match(/neoserv\/products\/(.+?)(?:_\d+)?$/);

        if (skuMatch) {
          const sku = skuMatch[1];
          const url = resource.secure_url;

          // Initialiser le tableau si nécessaire
          if (!mapping[sku]) {
            mapping[sku] = [];
          }

          // Ajouter l'URL
          mapping[sku].push(url);
        } else {
          console.warn(`⚠️  Format SKU non reconnu: ${publicId}`);
        }
      }

      // Préparer la prochaine itération
      nextCursor = result.next_cursor;

      if (nextCursor) {
        console.log('📄 Page suivante disponible...');
      }

    } while (nextCursor);

    // Trier les images pour chaque SKU (images principales en premier)
    for (const sku in mapping) {
      mapping[sku].sort((a, b) => {
        const aHasIndex = /_\d+/.test(a);
        const bHasIndex = /_\d+/.test(b);
        if (!aHasIndex && bHasIndex) return -1;
        if (aHasIndex && !bHasIndex) return 1;
        return a.localeCompare(b);
      });
    }

    // Sauvegarder le mapping
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mapping, null, 2));

    console.log('\n======================================================================');
    console.log('✅ MAPPING GÉNÉRÉ AVEC SUCCÈS');
    console.log('======================================================================');
    console.log(`📊 Total images: ${totalImages}`);
    console.log(`📦 Total SKUs: ${Object.keys(mapping).length}`);
    console.log(`💾 Fichier sauvegardé: ${OUTPUT_FILE}`);
    console.log('======================================================================\n');

    // Afficher quelques exemples
    console.log('🔍 Exemples de mapping:');
    const skuExamples = Object.keys(mapping).slice(0, 5);
    for (const sku of skuExamples) {
      console.log(`   ${sku}: ${mapping[sku].length} image(s)`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la génération du mapping:', error);
    process.exit(1);
  }
}

// Lancer le script
generateMapping();
