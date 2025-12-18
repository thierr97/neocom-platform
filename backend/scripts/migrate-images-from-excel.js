/**
 * Script de migration des images depuis un fichier Excel
 *
 * Ce script lit un fichier Excel contenant les produits avec leurs URLs d'images,
 * télécharge les images, les encode en Base64, et met à jour la base de données.
 *
 * Format Excel attendu :
 * - Colonne "sku" : Le SKU du produit
 * - Colonne "images" : URLs des images séparées par des virgules
 *
 * Usage:
 * node scripts/migrate-images-from-excel.js chemin/vers/fichier.xlsx
 */

const XLSX = require('xlsx');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

/**
 * Télécharge une image depuis une URL et la convertit en Base64
 */
async function downloadImageAsBase64(imageUrl) {
  try {
    console.log(`  📥 Téléchargement: ${imageUrl}`);

    // Télécharger l'image
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 secondes timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NeoservImageMigration/1.0)',
      },
    });

    // Détecter le type MIME depuis les headers ou l'extension
    let mimeType = response.headers['content-type'];
    if (!mimeType) {
      const ext = path.extname(imageUrl).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
      };
      mimeType = mimeTypes[ext] || 'image/jpeg';
    }

    // Convertir en Base64
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    console.log(`  ✅ Converti en Base64 (${(base64Image.length / 1024).toFixed(1)} KB)`);
    return dataUrl;
  } catch (error) {
    console.error(`  ❌ Erreur téléchargement: ${error.message}`);
    throw error;
  }
}

/**
 * Lit le fichier Excel et retourne un tableau de produits
 */
function readExcelFile(filePath) {
  try {
    console.log(`📖 Lecture du fichier Excel: ${filePath}`);

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convertir en JSON
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`✅ ${data.length} lignes trouvées dans le fichier\n`);
    return data;
  } catch (error) {
    console.error(`❌ Erreur lecture Excel: ${error.message}`);
    throw error;
  }
}

/**
 * Traite un produit : télécharge ses images et met à jour la BDD
 */
async function processProduct(row, dryRun = false) {
  // Support pour les colonnes "REF ARTICLE" et "IMAGE" du fichier Excel
  const sku = row['REF ARTICLE'] || row.sku || row.SKU || row.Sku;
  const imagesString = row.IMAGE || row.images || row.Images || row.IMAGES || '';

  if (!sku) {
    console.log('⚠️  Ligne sans SKU, ignorée');
    return { success: false, reason: 'no_sku' };
  }

  console.log(`\n🔄 Traitement: ${sku}`);

  // Vérifier si le produit existe
  const product = await prisma.product.findUnique({
    where: { sku: sku.toString() },
  });

  if (!product) {
    console.log(`  ⚠️  Produit non trouvé: ${sku}`);
    return { success: false, reason: 'not_found' };
  }

  // Si pas d'images dans l'Excel, ignorer
  if (!imagesString || imagesString.trim() === '') {
    console.log(`  ℹ️  Pas d'images pour ce produit`);
    return { success: false, reason: 'no_images' };
  }

  // Séparer les URLs (peut être séparées par virgule, point-virgule, ou espace)
  const imageUrls = imagesString
    .split(/[,;\s]+/)
    .map(url => url.trim())
    .filter(url => url.length > 0 && (url.startsWith('http://') || url.startsWith('https://')));

  if (imageUrls.length === 0) {
    console.log(`  ⚠️  Aucune URL valide trouvée`);
    return { success: false, reason: 'invalid_urls' };
  }

  console.log(`  📷 ${imageUrls.length} image(s) à traiter`);

  // Télécharger et convertir chaque image
  const base64Images = [];
  for (const imageUrl of imageUrls) {
    try {
      const base64Image = await downloadImageAsBase64(imageUrl);
      base64Images.push(base64Image);
    } catch (error) {
      console.log(`  ⚠️  Impossible de télécharger: ${imageUrl}`);
      // Continuer avec les autres images
    }
  }

  if (base64Images.length === 0) {
    console.log(`  ❌ Aucune image n'a pu être téléchargée`);
    return { success: false, reason: 'download_failed' };
  }

  // Mettre à jour la base de données
  if (!dryRun) {
    try {
      await prisma.product.update({
        where: { sku: sku.toString() },
        data: {
          images: base64Images,
          thumbnail: base64Images[0], // La première image devient la miniature
        },
      });
      console.log(`  ✅ Produit mis à jour avec ${base64Images.length} image(s)`);
      return { success: true, imagesCount: base64Images.length };
    } catch (error) {
      console.error(`  ❌ Erreur mise à jour BDD: ${error.message}`);
      return { success: false, reason: 'db_error' };
    }
  } else {
    console.log(`  🔍 [DRY RUN] Aurait mis à jour avec ${base64Images.length} image(s)`);
    return { success: true, imagesCount: base64Images.length, dryRun: true };
  }
}

/**
 * Fonction principale
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage: node scripts/migrate-images-from-excel.js <fichier.xlsx> [options]

Options:
  --dry-run    Simule l'opération sans modifier la base de données
  --limit N    Traite uniquement les N premiers produits (pour tester)

Exemple:
  node scripts/migrate-images-from-excel.js produits.xlsx --dry-run
  node scripts/migrate-images-from-excel.js produits.xlsx --limit 5
    `);
    process.exit(1);
  }

  const filePath = args[0];
  const dryRun = args.includes('--dry-run');
  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null;

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  Migration des images depuis Excel → Base64         ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  if (dryRun) {
    console.log('⚠️  MODE DRY RUN : Aucune modification ne sera faite\n');
  }

  try {
    // Lire le fichier Excel
    const rows = readExcelFile(filePath);

    // Limiter si nécessaire
    const rowsToProcess = limit ? rows.slice(0, limit) : rows;

    if (limit) {
      console.log(`ℹ️  Limitation à ${limit} produit(s)\n`);
    }

    // Statistiques
    const stats = {
      total: rowsToProcess.length,
      success: 0,
      failed: 0,
      noSku: 0,
      notFound: 0,
      noImages: 0,
      invalidUrls: 0,
      downloadFailed: 0,
      dbError: 0,
    };

    // Traiter chaque produit
    for (let i = 0; i < rowsToProcess.length; i++) {
      const row = rowsToProcess[i];
      console.log(`\n[${ i + 1}/${rowsToProcess.length}]`);

      const result = await processProduct(row, dryRun);

      if (result.success) {
        stats.success++;
      } else {
        stats.failed++;

        // Comptabiliser la raison de l'échec
        switch (result.reason) {
          case 'no_sku':
            stats.noSku++;
            break;
          case 'not_found':
            stats.notFound++;
            break;
          case 'no_images':
            stats.noImages++;
            break;
          case 'invalid_urls':
            stats.invalidUrls++;
            break;
          case 'download_failed':
            stats.downloadFailed++;
            break;
          case 'db_error':
            stats.dbError++;
            break;
        }
      }

      // Petite pause entre chaque produit pour ne pas surcharger
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Afficher les statistiques finales
    console.log('\n\n╔══════════════════════════════════════════════════════╗');
    console.log('║                  RÉSUMÉ FINAL                        ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');
    console.log(`Total traité:           ${stats.total}`);
    console.log(`✅ Succès:              ${stats.success}`);
    console.log(`❌ Échecs:              ${stats.failed}`);

    if (stats.failed > 0) {
      console.log('\nDétail des échecs:');
      if (stats.noSku > 0) console.log(`  - Pas de SKU:         ${stats.noSku}`);
      if (stats.notFound > 0) console.log(`  - Produit non trouvé: ${stats.notFound}`);
      if (stats.noImages > 0) console.log(`  - Pas d'images:       ${stats.noImages}`);
      if (stats.invalidUrls > 0) console.log(`  - URLs invalides:     ${stats.invalidUrls}`);
      if (stats.downloadFailed > 0) console.log(`  - Téléchargement KO:  ${stats.downloadFailed}`);
      if (stats.dbError > 0) console.log(`  - Erreur BDD:         ${stats.dbError}`);
    }

    console.log('\n✅ Migration terminée!\n');

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
main();
