/**
 * Script pour associer les images Cloudinary existantes aux produits
 * Utilisation simple : modifier le mapping ci-dessous avec vos URLs
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * CONFIGURATION : Associez vos produits aux images Cloudinary
 *
 * Format: 'SKU_ou_NOM_du_produit': 'URL_Cloudinary'
 */
const PRODUCT_IMAGES = {
  // Exemple avec vos produits actuels :
  'CG-001': 'https://res.cloudinary.com/dcckh4zyh/image/upload/e_background_removal,q_auto:best,f_auto,w_1000,c_limit/neoserv/products/chaise-gamer',

  // Ajoutez vos mappings ici :
  // 'SKU-123': 'https://res.cloudinary.com/dcckh4zyh/image/upload/e_background_removal/...',
  // 'Nom du produit': 'https://res.cloudinary.com/dcckh4zyh/image/upload/e_background_removal/...',
};

/**
 * Mettre à jour un produit avec son image Cloudinary
 */
async function updateProductImage(productIdentifier, cloudinaryUrl) {
  try {
    // Chercher le produit par SKU ou nom
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: productIdentifier },
          { name: { contains: productIdentifier, mode: 'insensitive' } }
        ]
      }
    });

    if (!product) {
      console.log(`⚠️  Produit non trouvé: ${productIdentifier}`);
      return false;
    }

    // Mettre à jour avec l'image Cloudinary
    await prisma.product.update({
      where: { id: product.id },
      data: {
        images: [cloudinaryUrl], // Remplace toutes les images
        thumbnail: cloudinaryUrl
      }
    });

    console.log(`✅ ${product.name} → Image mise à jour`);
    return true;

  } catch (error) {
    console.error(`❌ Erreur pour ${productIdentifier}:`, error.message);
    return false;
  }
}

/**
 * Mettre à jour tous les produits du mapping
 */
async function updateAllProducts() {
  try {
    console.log('🚀 MISE À JOUR DES IMAGES PRODUITS\n');

    const entries = Object.entries(PRODUCT_IMAGES);
    if (entries.length === 0) {
      console.log('⚠️  Aucun mapping défini dans PRODUCT_IMAGES');
      console.log('\n💡 Éditez le fichier et ajoutez vos mappings :');
      console.log(`   'SKU': 'https://res.cloudinary.com/...',\n`);
      return;
    }

    let successCount = 0;

    for (const [productId, imageUrl] of entries) {
      const success = await updateProductImage(productId, imageUrl);
      if (success) successCount++;
    }

    console.log(`\n📊 Résultat: ${successCount}/${entries.length} produit(s) mis à jour`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Lister tous les produits pour faciliter le mapping
 */
async function listProducts() {
  try {
    console.log('📋 LISTE DES PRODUITS\n');

    const products = await prisma.product.findMany({
      select: {
        sku: true,
        name: true,
        images: true
      }
    });

    products.forEach((product, index) => {
      console.log(`${index + 1}. SKU: ${product.sku}`);
      console.log(`   Nom: ${product.name}`);
      console.log(`   Images actuelles: ${product.images.length > 0 ? product.images[0].substring(0, 60) + '...' : 'Aucune'}`);
      console.log('');
    });

    console.log(`\nTotal: ${products.length} produit(s)`);
    console.log(`\n💡 Copiez les SKU ou noms pour les utiliser dans PRODUCT_IMAGES`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Ajouter une image à un produit (en mode interactif)
 */
async function addImageToProduct(sku, cloudinaryUrl) {
  try {
    const product = await prisma.product.findUnique({
      where: { sku }
    });

    if (!product) {
      console.log(`❌ Produit ${sku} non trouvé`);
      return;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        images: [cloudinaryUrl],
        thumbnail: cloudinaryUrl
      }
    });

    console.log(`✅ Image ajoutée au produit: ${product.name}`);
    console.log(`   URL: ${cloudinaryUrl}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ==================== EXÉCUTION ====================

const args = process.argv.slice(2);
const command = args[0];

if (command === 'list') {
  listProducts()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));

} else if (command === 'add') {
  const sku = args[1];
  const url = args[2];

  if (!sku || !url) {
    console.log('❌ Usage: node scripts/link-cloudinary-to-products.js add SKU URL');
    process.exit(1);
  }

  addImageToProduct(sku, url)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));

} else if (command === 'update') {
  updateAllProducts()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));

} else {
  console.log(`
🖼️  ASSOCIER LES IMAGES CLOUDINARY AUX PRODUITS

Commandes disponibles:

1. Lister tous les produits:
   node scripts/link-cloudinary-to-products.js list

2. Ajouter une image à un produit:
   node scripts/link-cloudinary-to-products.js add SKU-123 https://res.cloudinary.com/...

3. Mettre à jour tous les produits (selon PRODUCT_IMAGES):
   node scripts/link-cloudinary-to-products.js update

📝 Mode manuel recommandé:
   1. Listez vos produits: npm run script list
   2. Éditez ce fichier et remplissez PRODUCT_IMAGES
   3. Exécutez la mise à jour: npm run script update

  `);
  process.exit(0);
}
