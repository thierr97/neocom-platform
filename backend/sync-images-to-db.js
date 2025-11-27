const fs = require('fs');
const path = require('path');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0MWFlNjQxZS0wMWRkLTRiYjMtYTdhMy1iMzc1OTQ5YjdlOWYiLCJlbWFpbCI6ImFkbWluQG5lb3NlcnYuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzY0MjAyMjY3LCJleHAiOjE3NjQyMDMxNjd9.nIJQzBZFssqxZTO1dP0XDCRpc6u8dpXYUM78Dyz2ITc';
const API_URL = 'https://neocom-backend.onrender.com/api/cloudinary/sync-product-images';
const MAPPING_FILE = path.join(__dirname, 'optimized-urls-mapping.json');
const BATCH_SIZE = 100; // Envoyer 100 SKUs à la fois

async function syncBatch(batchMapping) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({ mapping: batchMapping })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erreur réseau:', error.message);
    return { success: false, error: error.message };
  }
}

async function syncImages() {
  console.log('📁 Chargement du fichier de mapping...');

  const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'));
  const allSKUs = Object.keys(mapping);
  const totalSKUs = allSKUs.length;

  console.log(`📦 ${totalSKUs} SKUs à synchroniser`);
  console.log(`📦 Taille de lot: ${BATCH_SIZE} SKUs\n`);

  const totalBatches = Math.ceil(totalSKUs / BATCH_SIZE);
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalNotFound = [];
  let totalErrors = [];

  console.log(`🚀 Envoi de ${totalBatches} lots...\n`);

  for (let i = 0; i < totalBatches; i++) {
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, totalSKUs);
    const batchSKUs = allSKUs.slice(start, end);

    // Créer un mapping pour ce lot
    const batchMapping = {};
    for (const sku of batchSKUs) {
      batchMapping[sku] = mapping[sku];
    }

    console.log(`📤 Lot ${i + 1}/${totalBatches} (SKUs ${start + 1}-${end})...`);

    const result = await syncBatch(batchMapping);

    if (result.success && result.data) {
      totalSuccess += result.data.success || 0;
      totalFailed += result.data.failed || 0;
      if (result.data.notFound) totalNotFound.push(...result.data.notFound);
      if (result.data.errors) totalErrors.push(...result.data.errors);
      console.log(`   ✓ ${result.data.success} succès, ✗ ${result.data.failed} échecs`);

      // Log first error if any
      if (i === 0 && result.data.errors && result.data.errors.length > 0) {
        console.log(`   📝 Première erreur: ${result.data.errors[0].error.substring(0, 150)}`);
      }
    } else {
      console.log(`   ❌ Erreur: ${result.message || result.error}`);
      totalFailed += batchSKUs.length;
    }

    // Petite pause entre les lots pour ne pas surcharger l'API
    if (i < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n======================================================================');
  console.log('✅ SYNCHRONISATION TERMINÉE');
  console.log('======================================================================');
  console.log(`📊 Total SKUs: ${totalSKUs}`);
  console.log(`✓ Succès: ${totalSuccess}`);
  console.log(`✗ Échecs: ${totalFailed}`);

  if (totalNotFound.length > 0) {
    console.log(`\n⚠️  SKUs non trouvés en base: ${totalNotFound.length}`);
    console.log('   Premiers SKUs:', totalNotFound.slice(0, 10).join(', '));
  }

  if (totalErrors.length > 0) {
    console.log(`\n❌ Erreurs: ${totalErrors.length}`);
    console.log('   Premières erreurs:', JSON.stringify(totalErrors.slice(0, 3), null, 2));
  }
  console.log('======================================================================\n');
}

// Lancer la synchronisation
syncImages();
