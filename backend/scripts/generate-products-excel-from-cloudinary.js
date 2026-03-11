/**
 * Script pour générer un fichier Excel avec toutes les images Cloudinary
 * Permet d'importer facilement les produits avec leurs images optimisées
 */

const { v2: cloudinary } = require('cloudinary');
const XLSX = require('xlsx');
require('dotenv').config();

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dcckh4zyh',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Construire l'URL optimisée avec suppression de fond
 */
function buildOptimizedUrl(publicId) {
  return cloudinary.url(publicId, {
    effect: 'background_removal',  // Suppression du fond
    quality: 'auto:best',          // Qualité optimale
    fetch_format: 'auto',          // Format automatique (WebP/AVIF)
    width: 1000,                   // Largeur max
    crop: 'limit',                 // Conserver proportions
    secure: true                   // HTTPS
  });
}

/**
 * Extraire le code produit d'un public_id
 */
function extractProductCode(publicId) {
  // Ex: "neoserv/products/000009" → "000009"
  // Ex: "neoserv/products/000009_1" → "000009"
  const match = publicId.match(/\/([^\/]+?)(?:_\d+)?$/);
  return match ? match[1] : null;
}

/**
 * Récupérer toutes les images Cloudinary
 */
async function getAllCloudinaryImages() {
  try {
    console.log('📥 Récupération des images Cloudinary...');
    const allImages = [];
    let nextCursor = null;
    let pageCount = 0;

    do {
      pageCount++;
      process.stdout.write(`\r   Page ${pageCount}... (${allImages.length} images)`);

      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'neoserv/products',
        max_results: 500,
        next_cursor: nextCursor
      });

      allImages.push(...result.resources);
      nextCursor = result.next_cursor;

    } while (nextCursor);

    console.log(`\n✅ ${allImages.length} images récupérées\n`);
    return allImages;

  } catch (error) {
    console.error('\n❌ Erreur Cloudinary:', error.message);
    throw error;
  }
}

/**
 * Grouper les images par code produit
 */
function groupImagesByProduct(images) {
  console.log('📋 Groupement des images par code produit...');

  const grouped = {};

  for (const image of images) {
    const productCode = extractProductCode(image.public_id);
    if (!productCode) continue;

    if (!grouped[productCode]) {
      grouped[productCode] = {
        code: productCode,
        images: []
      };
    }

    grouped[productCode].images.push({
      url: image.secure_url,
      optimizedUrl: buildOptimizedUrl(image.public_id),
      width: image.width,
      height: image.height
    });
  }

  console.log(`✅ ${Object.keys(grouped).length} codes produits uniques\n`);
  return grouped;
}

/**
 * Générer le fichier Excel
 */
function generateExcel(groupedImages) {
  console.log('📊 Génération du fichier Excel...');

  const rows = [];

  // En-têtes
  rows.push([
    'Code Produit',
    'Nom Produit (à remplir)',
    'Description (à remplir)',
    'Prix HT (à remplir)',
    'Stock (à remplir)',
    'Catégorie (à remplir)',
    'Image 1 (optimisée)',
    'Image 2 (optimisée)',
    'Image 3 (optimisée)',
    'Image 4 (optimisée)',
    'Image 5 (optimisée)',
    'Nombre d\'images',
    'Taille Image 1'
  ]);

  // Données
  for (const [code, data] of Object.entries(groupedImages)) {
    const row = [
      code,                                    // Code produit
      '',                                      // Nom (à remplir)
      '',                                      // Description (à remplir)
      '',                                      // Prix (à remplir)
      '',                                      // Stock (à remplir)
      '',                                      // Catégorie (à remplir)
      data.images[0]?.optimizedUrl || '',     // Image 1
      data.images[1]?.optimizedUrl || '',     // Image 2
      data.images[2]?.optimizedUrl || '',     // Image 3
      data.images[3]?.optimizedUrl || '',     // Image 4
      data.images[4]?.optimizedUrl || '',     // Image 5
      data.images.length,                      // Nombre d'images
      data.images[0] ? `${data.images[0].width}x${data.images[0].height}` : ''
    ];

    rows.push(row);
  }

  // Créer le workbook
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Ajuster la largeur des colonnes
  ws['!cols'] = [
    { wch: 15 },  // Code Produit
    { wch: 40 },  // Nom Produit
    { wch: 50 },  // Description
    { wch: 10 },  // Prix
    { wch: 10 },  // Stock
    { wch: 20 },  // Catégorie
    { wch: 80 },  // Image 1
    { wch: 80 },  // Image 2
    { wch: 80 },  // Image 3
    { wch: 80 },  // Image 4
    { wch: 80 },  // Image 5
    { wch: 12 },  // Nombre d'images
    { wch: 15 }   // Taille
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Produits Cloudinary');

  // Sauvegarder
  const filename = `produits-cloudinary-${Date.now()}.xlsx`;
  XLSX.writeFile(wb, filename);

  console.log(`✅ Fichier généré: ${filename}\n`);
  return filename;
}

/**
 * Script principal
 */
async function main() {
  try {
    console.log('🚀 GÉNÉRATION FICHIER EXCEL DEPUIS CLOUDINARY\n');

    // 1. Récupérer les images
    const images = await getAllCloudinaryImages();

    // 2. Grouper par produit
    const groupedImages = groupImagesByProduct(images);

    // 3. Générer Excel
    const filename = generateExcel(groupedImages);

    // 4. Résumé
    console.log('📋 RÉSUMÉ:');
    console.log(`   📸 Images totales: ${images.length}`);
    console.log(`   📦 Codes produits: ${Object.keys(groupedImages).length}`);
    console.log(`   📄 Fichier Excel: ${filename}`);
    console.log('');
    console.log('💡 PROCHAINES ÉTAPES:');
    console.log('   1. Ouvrez le fichier Excel');
    console.log('   2. Remplissez les colonnes: Nom, Description, Prix, Stock, Catégorie');
    console.log('   3. Les URLs d\'images sont déjà optimisées avec:');
    console.log('      ✓ Fond supprimé');
    console.log('      ✓ Qualité optimale');
    console.log('      ✓ Format WebP/AVIF automatique');
    console.log('   4. Importez le fichier dans votre application');

  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  }
}

main();
