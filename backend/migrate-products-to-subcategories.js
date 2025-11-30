/**
 * Script de migration : Déplacer les produits des catégories parentes vers les sous-catégories
 *
 * Ce script :
 * 1. Trouve tous les produits dans des catégories parentes
 * 2. Détermine la meilleure sous-catégorie pour chaque produit
 * 3. Déplace automatiquement les produits
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Règles de mapping basées sur des mots-clés dans le nom du produit
const MAPPING_RULES = {
  // Informatique
  'Ordinateurs Portables': ['laptop', 'portable', 'notebook', 'macbook', 'thinkpad'],
  'Ordinateurs de Bureau': ['desktop', 'tour', 'pc fixe', 'unité centrale', 'workstation'],
  'Composants PC': ['processeur', 'cpu', 'gpu', 'carte graphique', 'ram', 'mémoire', 'carte mère', 'motherboard'],
  'Périphériques': ['clavier', 'souris', 'casque', 'webcam', 'micro', 'enceinte', 'imprimante', 'scanner'],
  'Stockage': ['disque dur', 'ssd', 'hdd', 'nas', 'stockage', 'clé usb'],

  // Électronique
  'Smartphones': ['smartphone', 'téléphone', 'iphone', 'samsung', 'xiaomi', 'huawei'],
  'Tablettes': ['tablette', 'ipad', 'galaxy tab'],
  'Audio': ['écouteurs', 'casque audio', 'enceinte', 'bluetooth', 'hifi', 'ampli'],
  'Photo & Vidéo': ['appareil photo', 'caméra', 'reflex', 'objectif', 'trépied', 'gopro'],
  'Accessoires Électroniques': ['câble', 'chargeur', 'adaptateur', 'housse', 'protection', 'batterie externe'],

  // Mobilier
  'Bureaux': ['bureau', 'desk', 'table de travail'],
  'Chaises': ['chaise', 'fauteuil', 'siège'],
  'Rangements': ['rangement', 'armoire', 'étagère', 'meuble', 'caisson'],
  'Tables': ['table', 'table basse', 'table à manger'],
  'Canapés': ['canapé', 'sofa', 'divan']
};

// Mapping par défaut si aucune règle ne correspond
const DEFAULT_SUBCATEGORIES = {
  'Informatique': 'Périphériques',
  'Électronique': 'Accessoires Électroniques',
  'Mobilier': 'Rangements'
};

async function findBestSubcategory(product, parentCategory, subcategories) {
  const productName = product.name.toLowerCase();
  const productDesc = (product.description || '').toLowerCase();
  const searchText = `${productName} ${productDesc}`;

  // Chercher une correspondance basée sur les mots-clés
  for (const subcategory of subcategories) {
    const rules = MAPPING_RULES[subcategory.name];
    if (rules) {
      for (const keyword of rules) {
        if (searchText.includes(keyword.toLowerCase())) {
          return subcategory;
        }
      }
    }
  }

  // Si aucune règle ne correspond, utiliser la sous-catégorie par défaut
  const defaultSubcategoryName = DEFAULT_SUBCATEGORIES[parentCategory.name];
  const defaultSubcategory = subcategories.find(sub => sub.name === defaultSubcategoryName);

  return defaultSubcategory || subcategories[0]; // Prendre la première si pas de défaut
}

async function migrateProducts(dryRun = true) {
  console.log('🔄 Migration des produits vers les sous-catégories');
  console.log('================================================');
  console.log(dryRun ? '🧪 MODE TEST (aucune modification)' : '⚠️  MODE PRODUCTION (modifications réelles)');
  console.log('');

  try {
    // 1. Récupérer toutes les catégories
    const allCategories = await prisma.category.findMany();
    const parentCategories = allCategories.filter(cat => !cat.parentId);

    console.log(`📁 ${parentCategories.length} catégories parentes trouvées`);
    console.log('');

    let totalMigrated = 0;
    const migrations = [];

    // 2. Pour chaque catégorie parente
    for (const parentCategory of parentCategories) {
      // Récupérer les sous-catégories
      const subcategories = allCategories.filter(cat => cat.parentId === parentCategory.id);

      if (subcategories.length === 0) {
        console.log(`⚠️  ${parentCategory.name} : Aucune sous-catégorie disponible, produits ignorés`);
        continue;
      }

      // Récupérer les produits dans cette catégorie parente
      const productsInParent = await prisma.product.findMany({
        where: {
          categoryId: parentCategory.id,
        },
        select: {
          id: true,
          sku: true,
          name: true,
          description: true,
        }
      });

      if (productsInParent.length === 0) {
        console.log(`✅ ${parentCategory.name} : Aucun produit à migrer`);
        continue;
      }

      console.log(`📦 ${parentCategory.name} : ${productsInParent.length} produits à migrer`);
      console.log(`   Sous-catégories disponibles : ${subcategories.map(s => s.name).join(', ')}`);
      console.log('');

      // 3. Pour chaque produit, trouver la meilleure sous-catégorie
      for (const product of productsInParent) {
        const bestSubcategory = await findBestSubcategory(product, parentCategory, subcategories);

        migrations.push({
          product,
          from: parentCategory.name,
          to: bestSubcategory.name,
          toId: bestSubcategory.id
        });

        console.log(`   ${product.sku} - ${product.name}`);
        console.log(`   └─> ${parentCategory.name} ➜ ${bestSubcategory.name}`);

        // 4. Effectuer la migration si pas en mode test
        if (!dryRun) {
          await prisma.product.update({
            where: { id: product.id },
            data: { categoryId: bestSubcategory.id }
          });
        }

        totalMigrated++;
      }

      console.log('');
    }

    // Résumé
    console.log('');
    console.log('📊 RÉSUMÉ');
    console.log('=========');
    console.log(`Total de produits migrés : ${totalMigrated}`);
    console.log('');

    if (migrations.length > 0) {
      console.log('Détail par catégorie de destination :');
      const byDestination = {};
      migrations.forEach(m => {
        byDestination[m.to] = (byDestination[m.to] || 0) + 1;
      });
      Object.entries(byDestination).forEach(([dest, count]) => {
        console.log(`  - ${dest} : ${count} produits`);
      });
    }

    if (dryRun) {
      console.log('');
      console.log('💡 Pour appliquer réellement ces changements, exécutez :');
      console.log('   node migrate-products-to-subcategories.js --execute');
      console.log('');
      console.log('   Ou pour la production :');
      console.log('   DATABASE_URL="..." node migrate-products-to-subcategories.js --execute');
    } else {
      console.log('');
      console.log('✅ Migration terminée avec succès !');
      console.log(`   ${totalMigrated} produits ont été déplacés vers des sous-catégories`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Vérifier les arguments de la ligne de commande
const args = process.argv.slice(2);
const executeMode = args.includes('--execute');

migrateProducts(!executeMode)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
