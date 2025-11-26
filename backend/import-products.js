const XLSX = require('xlsx');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const EXCEL_FILE = '/Users/thierrycyrillefrancillette/Downloads/fichier en csv/ARTICLES BAZAR.xlsx';
const API_URL = process.env.API_URL || 'https://neoserv-platform.onrender.com/api';
const TOKEN = process.env.ACCESS_TOKEN; // Pass via environment variable

// Mapping des colonnes
const COLUMN_MAPPING = {
  'IMAGE': 'images',
  'REF ARTICLE': 'sku',
  'CODE BARRE': 'barcode',
  'PRODUITS': 'name',
  'QUANTITÉ': 'stock',
  'PRIX DE': 'costPrice',
  'PRIX': 'price',
  'FOURNISSEUR': 'supplier',
  'CATÉGORIE': 'category',
  'SOUS CATÉGORIE': 'subcategory',
};

async function importProducts() {
  try {
    console.log('📖 Lecture du fichier Excel...');
    const workbook = XLSX.readFile(EXCEL_FILE);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    console.log(`✅ Fichier lu avec succès: ${data.length} lignes trouvées`);

    if (data.length === 0) {
      console.error('❌ Aucune donnée trouvée dans le fichier');
      return;
    }

    // Afficher les colonnes disponibles
    const columns = Object.keys(data[0]);
    console.log('\n📋 Colonnes trouvées:', columns);

    // Créer le mapping inversé pour l'API
    const apiMapping = {};
    for (const [excelCol, fieldKey] of Object.entries(COLUMN_MAPPING)) {
      // Trouver la colonne correspondante (insensible à la casse)
      const matchingColumn = columns.find(col =>
        col.trim().toLowerCase() === excelCol.toLowerCase()
      );
      if (matchingColumn) {
        apiMapping[fieldKey] = matchingColumn;
        console.log(`✓ ${excelCol} -> ${fieldKey}`);
      } else {
        console.log(`⚠️  Colonne "${excelCol}" non trouvée`);
      }
    }

    // Appliquer la majoration de 13% sur le prix de vente
    console.log('\n💰 Application de la majoration de 13% sur les prix de vente...');
    const processedData = data.map(row => {
      const newRow = { ...row };
      const priceColumn = apiMapping.price;
      if (priceColumn && row[priceColumn]) {
        const originalPrice = parseFloat(row[priceColumn]);
        if (!isNaN(originalPrice)) {
          newRow[priceColumn] = (originalPrice * 1.13).toFixed(2);
        }
      }
      return newRow;
    });

    // Diviser en batches de 100 pour éviter les timeouts
    const BATCH_SIZE = 100;
    const batches = [];
    for (let i = 0; i < processedData.length; i += BATCH_SIZE) {
      batches.push(processedData.slice(i, i + BATCH_SIZE));
    }

    console.log(`\n📦 Import en ${batches.length} batches de ${BATCH_SIZE} produits maximum`);

    if (!TOKEN) {
      console.error('❌ TOKEN non fourni. Utilisez: ACCESS_TOKEN=your_token node import-products.js');
      return;
    }

    let totalSuccess = 0;
    let totalErrors = 0;
    let totalWarnings = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`\n🚀 Import du batch ${i + 1}/${batches.length} (${batch.length} produits)...`);

      try {
        const response = await axios.post(
          `${API_URL}/import/products`,
          {
            data: batch,
            mapping: apiMapping,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${TOKEN}`,
            },
            timeout: 120000, // 2 minutes
          }
        );

        if (response.data.success) {
          const results = response.data.results;
          totalSuccess += results.success;
          totalErrors += results.errors.length;
          totalWarnings += results.warnings.length;

          console.log(`✅ Batch ${i + 1}: ${results.success} succès, ${results.errors.length} erreurs, ${results.warnings.length} avertissements`);

          // Afficher les premières erreurs si présentes
          if (results.errors.length > 0) {
            console.log('\n❌ Erreurs:');
            results.errors.slice(0, 5).forEach(err => {
              console.log(`  Ligne ${err.line}: ${err.error}`);
            });
            if (results.errors.length > 5) {
              console.log(`  ... et ${results.errors.length - 5} autres erreurs`);
            }
          }

          // Afficher les premiers avertissements si présents
          if (results.warnings.length > 0) {
            console.log('\n⚠️  Avertissements:');
            results.warnings.slice(0, 5).forEach(warn => {
              console.log(`  Ligne ${warn.line}: ${warn.message}`);
            });
            if (results.warnings.length > 5) {
              console.log(`  ... et ${results.warnings.length - 5} autres avertissements`);
            }
          }
        } else {
          console.error(`❌ Batch ${i + 1} échoué:`, response.data.message);
        }

        // Pause de 2 secondes entre les batches pour ne pas surcharger le serveur
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`❌ Erreur lors de l'import du batch ${i + 1}:`, error.message);
        if (error.response) {
          console.error('Réponse du serveur:', error.response.data);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSULTAT FINAL');
    console.log('='.repeat(60));
    console.log(`✅ Succès: ${totalSuccess}`);
    console.log(`❌ Erreurs: ${totalErrors}`);
    console.log(`⚠️  Avertissements: ${totalWarnings}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    console.error(error.stack);
  }
}

// Exécuter l'import
importProducts();
