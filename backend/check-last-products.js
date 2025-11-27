const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neoserv:assRxjUUAKXl6YMcubLnc8dlH2lNWYXM@dpg-d4iv1bre5dus73eh5iug-a.frankfurt-postgres.render.com/neoserv_0q8o"
    }
  }
});

async function checkLastProducts() {
  try {
    console.log('🔍 Recherche des derniers produits traités...\n');

    // Récupérer les produits qui ont des images Unsplash (contenant "unsplash" dans l'URL)
    const products = await prisma.product.findMany({
      where: {
        images: {
          isEmpty: false
        }
      },
      select: {
        id: true,
        sku: true,
        name: true,
        images: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });

    console.log(`📦 ${products.length} produits récents avec images:\n`);

    for (const product of products) {
      const unsplashImages = product.images.filter(img => img.includes('unsplash'));

      if (unsplashImages.length > 0) {
        console.log(`✅ ${product.name}`);
        console.log(`   SKU: ${product.sku}`);
        console.log(`   Total images: ${product.images.length}`);
        console.log(`   Images Unsplash: ${unsplashImages.length}`);
        console.log(`   Dernière mise à jour: ${product.updatedAt.toLocaleString('fr-FR')}`);
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkLastProducts();
