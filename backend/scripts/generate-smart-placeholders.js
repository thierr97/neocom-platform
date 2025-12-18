/**
 * Script de génération d'images placeholder intelligentes pour les produits
 *
 * Ce script lit les produits depuis la base de données, génère 3 images placeholder
 * différentes et personnalisées pour chaque produit en fonction de sa catégorie
 * et de son nom, puis les stocke en Base64 dans la base de données.
 *
 * Usage:
 * node scripts/generate-smart-placeholders.js [options]
 *
 * Options:
 *   --dry-run    Simule l'opération sans modifier la base de données
 *   --limit N    Traite uniquement les N premiers produits (pour tester)
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

// Mapping des catégories vers des couleurs et icônes
const CATEGORY_THEMES = {
  'Électronique': { colors: ['#3B82F6', '#1D4ED8', '#60A5FA'], icon: '💻' },
  'Électroménager': { colors: ['#10B981', '#059669', '#34D399'], icon: '🏠' },
  'Informatique': { colors: ['#8B5CF6', '#6D28D9', '#A78BFA'], icon: '💾' },
  'Téléphonie': { colors: ['#EF4444', '#DC2626', '#F87171'], icon: '📱' },
  'Audio/Vidéo': { colors: ['#F59E0B', '#D97706', '#FBBF24'], icon: '🎧' },
  'Accessoires': { colors: ['#EC4899', '#DB2777', '#F472B6'], icon: '🎯' },
  'Gaming': { colors: ['#14B8A6', '#0D9488', '#2DD4BF'], icon: '🎮' },
  'Mobilier': { colors: ['#8B4513', '#A0522D', '#CD853F'], icon: '🪑' },
  'Décoration': { colors: ['#FF69B4', '#FF1493', '#FFB6C1'], icon: '🎨' },
  'Jardin': { colors: ['#22C55E', '#16A34A', '#4ADE80'], icon: '🌿' },
  'Bricolage': { colors: ['#FF8C00', '#FFA500', '#FFB84D'], icon: '🔧' },
  'Sport': { colors: ['#0EA5E9', '#0284C7', '#38BDF8'], icon: '⚽' },
  'default': { colors: ['#6B7280', '#4B5563', '#9CA3AF'], icon: '📦' }
};

/**
 * Obtient le thème (couleurs + icône) pour une catégorie donnée
 */
function getCategoryTheme(category) {
  // Si category est null/undefined ou n'a pas de name
  if (!category || typeof category !== 'string') {
    return CATEGORY_THEMES['default'];
  }

  // Chercher une correspondance exacte
  if (CATEGORY_THEMES[category]) {
    return CATEGORY_THEMES[category];
  }

  // Chercher une correspondance partielle
  const categoryLower = category.toLowerCase();
  for (const [key, value] of Object.entries(CATEGORY_THEMES)) {
    if (categoryLower.includes(key.toLowerCase()) || key.toLowerCase().includes(categoryLower)) {
      return value;
    }
  }

  return CATEGORY_THEMES['default'];
}

/**
 * Génère une image SVG avec un style personnalisé
 */
function generateSVGPlaceholder(productName, category, colorIndex = 0) {
  const theme = getCategoryTheme(category);
  const color = theme.colors[colorIndex % theme.colors.length];
  const icon = theme.icon;

  // Prendre les 3 premières lettres du nom du produit
  const initials = productName
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  // Variation du design selon l'index (3 styles différents)
  const styles = [
    // Style 1: Gradient diagonal avec icône
    `<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${theme.colors[(colorIndex + 1) % 3]};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="800" height="800" fill="url(#grad1)"/>
      <text x="400" y="350" font-family="Arial, sans-serif" font-size="200" fill="white" text-anchor="middle" opacity="0.9">${icon}</text>
      <text x="400" y="520" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="white" text-anchor="middle" opacity="0.8">${initials}</text>
      <text x="400" y="620" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle" opacity="0.7">${category || 'Produit'}</text>
    </svg>`,

    // Style 2: Cercle central avec motif
    `<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="800" fill="${theme.colors[(colorIndex + 2) % 3]}"/>
      <circle cx="400" cy="400" r="300" fill="${color}" opacity="0.9"/>
      <circle cx="400" cy="400" r="200" fill="white" opacity="0.2"/>
      <text x="400" y="370" font-family="Arial, sans-serif" font-size="180" fill="white" text-anchor="middle">${icon}</text>
      <text x="400" y="500" font-family="Arial, sans-serif" font-size="100" font-weight="bold" fill="white" text-anchor="middle">${initials}</text>
    </svg>`,

    // Style 3: Design moderne avec bandes
    `<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="800" fill="white"/>
      <rect width="800" height="200" y="0" fill="${color}" opacity="0.9"/>
      <rect width="800" height="200" y="300" fill="${theme.colors[(colorIndex + 1) % 3]}" opacity="0.8"/>
      <rect width="800" height="200" y="600" fill="${theme.colors[(colorIndex + 2) % 3]}" opacity="0.9"/>
      <text x="400" y="450" font-family="Arial, sans-serif" font-size="240" fill="${color}" text-anchor="middle">${icon}</text>
      <text x="400" y="580" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="${color}" text-anchor="middle">${initials}</text>
      <rect width="800" height="100" y="0" fill="${color}"/>
      <text x="400" y="65" font-family="Arial, sans-serif" font-size="36" fill="white" text-anchor="middle">${category || 'Produit'}</text>
    </svg>`
  ];

  return styles[colorIndex % 3];
}

/**
 * Convertit un SVG en Base64 data URL
 */
function svgToBase64(svgString) {
  const base64 = Buffer.from(svgString).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Génère 3 images placeholder pour un produit
 */
function generateProductImages(productName, category) {
  const images = [];

  for (let i = 0; i < 3; i++) {
    const svg = generateSVGPlaceholder(productName, category, i);
    const base64Image = svgToBase64(svg);
    images.push(base64Image);
  }

  return images;
}

/**
 * Traite un produit : génère ses images et met à jour la BDD
 */
async function processProduct(product, dryRun = false) {
  try {
    console.log(`\n🔄 Traitement: ${product.sku} - ${product.name}`);
    console.log(`  📁 Catégorie: ${product.category || 'Non définie'}`);

    // Générer 3 images placeholder
    const images = generateProductImages(product.name, product.category);

    console.log(`  ✅ ${images.length} images générées`);

    // Mettre à jour la base de données
    if (!dryRun) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          images: images,
          thumbnail: images[0], // La première image devient la miniature
        },
      });
      console.log(`  💾 Produit mis à jour dans la base de données`);
      return { success: true, imagesCount: images.length };
    } else {
      console.log(`  🔍 [DRY RUN] Aurait mis à jour avec ${images.length} image(s)`);
      return { success: true, imagesCount: images.length, dryRun: true };
    }
  } catch (error) {
    console.error(`  ❌ Erreur: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Fonction principale
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null;

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   Génération de placeholders intelligents           ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  if (dryRun) {
    console.log('⚠️  MODE DRY RUN : Aucune modification ne sera faite\n');
  }

  try {
    // Récupérer tous les produits depuis la base de données
    console.log('📖 Récupération des produits depuis la base de données...');

    const products = await prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        name: true,
        category: true,  // category est juste une string dans le schéma
        images: true,
      },
      take: limit || undefined,
    });

    console.log(`✅ ${products.length} produit(s) trouvé(s)\n`);

    if (limit) {
      console.log(`ℹ️  Limitation à ${limit} produit(s)\n`);
    }

    // Statistiques
    const stats = {
      total: products.length,
      success: 0,
      failed: 0,
      skipped: 0,
    };

    // Traiter chaque produit
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`\n[${i + 1}/${products.length}]`);

      // Vérifier si le produit a déjà des images
      if (product.images && product.images.length > 0) {
        console.log(`  ⏭️  Produit ${product.sku} a déjà des images, ignoré`);
        stats.skipped++;
        continue;
      }

      const result = await processProduct(product, dryRun);

      if (result.success) {
        stats.success++;
      } else {
        stats.failed++;
      }

      // Petite pause entre chaque produit pour ne pas surcharger
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Afficher les statistiques finales
    console.log('\n\n╔══════════════════════════════════════════════════════╗');
    console.log('║                  RÉSUMÉ FINAL                        ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');
    console.log(`Total traité:           ${stats.total}`);
    console.log(`✅ Succès:              ${stats.success}`);
    console.log(`⏭️  Ignorés (ont déjà des images): ${stats.skipped}`);
    console.log(`❌ Échecs:              ${stats.failed}`);

    console.log('\n✅ Génération terminée!\n');

    if (!dryRun && stats.success > 0) {
      console.log('💡 Les images sont maintenant disponibles sur :');
      console.log('   - Website: https://neoserv.fr/shop/products');
      console.log('   - Mobile App: Rechargez l\'application\n');
    }

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
  console.error('❌ Erreur non gérée:', error);
  process.exit(1);
});

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { generateProductImages, getCategoryTheme };
