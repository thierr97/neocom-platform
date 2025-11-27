const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const FOLDER = 'neoserv/products';
const OUTPUT_FILE = path.join(__dirname, 'optimized-urls-mapping.json');

// Transformations pro pour les images produits
const PRO_TRANSFORMATIONS = {
  // Transformation pour la vignette principale (carrée)
  thumbnail: [
    { width: 800, height: 800, crop: 'pad', background: 'white' }, // Fond blanc, image centrée
    { quality: 'auto:best' },
    { fetch_format: 'auto' },
    { dpr: '2.0' }, // Retina display
    { effect: 'sharpen:80' }, // Améliorer la netteté
    { effect: 'improve' } // Optimisation automatique
  ],

  // Transformation pour l'affichage détaillé
  detail: [
    { width: 1200, height: 1200, crop: 'pad', background: 'white' },
    { quality: 'auto:best' },
    { fetch_format: 'auto' },
    { dpr: '2.0' },
    { effect: 'sharpen:80' },
    { effect: 'improve' }
  ],

  // Transformation pour la liste/grille
  grid: [
    { width: 400, height: 400, crop: 'pad', background: 'white' },
    { quality: 'auto:good' },
    { fetch_format: 'auto' },
    { effect: 'sharpen:60' }
  ]
};

function buildCloudinaryUrl(publicId, transformation = 'thumbnail') {
  const transforms = PRO_TRANSFORMATIONS[transformation];

  // Mapping des noms vers les raccourcis Cloudinary
  const cloudinaryParams = {
    'width': 'w',
    'height': 'h',
    'crop': 'c',
    'background': 'b',
    'quality': 'q',
    'fetch_format': 'f',
    'dpr': 'dpr',
    'effect': 'e'
  };

  // Construire l'URL avec les transformations
  let transformString = transforms.map(t => {
    return Object.entries(t)
      .map(([key, value]) => `${cloudinaryParams[key] || key}_${value}`)
      .join(',');
  }).join('/');

  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${transformString}/${publicId}`;
}

async function generateOptimizedMapping() {
  console.log('🎨 Génération des URLs optimisées...');
  console.log(`📁 Dossier: ${FOLDER}`);

  const mapping = {};
  let totalImages = 0;
  let nextCursor = null;

  try {
    do {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: FOLDER,
        max_results: 500,
        next_cursor: nextCursor
      });

      console.log(`📦 Récupéré ${result.resources.length} images`);

      for (const resource of result.resources) {
        totalImages++;
        const publicId = resource.public_id;
        const skuMatch = publicId.match(/neoserv\/products\/(.+?)(?:_\d+)?$/);

        if (skuMatch) {
          const sku = skuMatch[1];

          if (!mapping[sku]) {
            mapping[sku] = {
              thumbnail: [],
              detail: [],
              grid: []
            };
          }

          // Générer les URLs pour chaque type de transformation
          mapping[sku].thumbnail.push(buildCloudinaryUrl(publicId, 'thumbnail'));
          mapping[sku].detail.push(buildCloudinaryUrl(publicId, 'detail'));
          mapping[sku].grid.push(buildCloudinaryUrl(publicId, 'grid'));
        }
      }

      nextCursor = result.next_cursor;
    } while (nextCursor);

    // Simplifier le mapping pour n'utiliser que les transformations "detail"
    const simplifiedMapping = {};
    for (const sku in mapping) {
      simplifiedMapping[sku] = mapping[sku].detail;
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(simplifiedMapping, null, 2));

    console.log('\n======================================================================');
    console.log('✅ URLS OPTIMISÉES GÉNÉRÉES');
    console.log('======================================================================');
    console.log(`📊 Total images: ${totalImages}`);
    console.log(`📦 Total SKUs: ${Object.keys(simplifiedMapping).length}`);
    console.log(`💾 Fichier: ${OUTPUT_FILE}`);
    console.log('======================================================================\n');

    // Afficher un exemple
    const exampleSku = Object.keys(simplifiedMapping)[0];
    console.log('🔍 Exemple d\'URL optimisée:');
    console.log(`   SKU: ${exampleSku}`);
    console.log(`   URL: ${simplifiedMapping[exampleSku][0].substring(0, 120)}...`);
    console.log('\n💡 Transformations appliquées:');
    console.log('   - Dimensions: 1200x1200px');
    console.log('   - Fond blanc uniforme');
    console.log('   - Qualité: auto:best');
    console.log('   - Retina ready (2x DPI)');
    console.log('   - Amélioration automatique');
    console.log('   - Netteté augmentée');
    console.log('   - Format auto (WebP sur navigateurs compatibles)');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

generateOptimizedMapping();
