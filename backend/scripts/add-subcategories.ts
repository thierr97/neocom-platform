import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSubcategoriesToAll() {
  console.log('🔍 Recherche des catégories sans sous-catégories...\n');

  // Récupérer toutes les catégories principales (sans parent)
  const mainCategories = await prisma.category.findMany({
    where: {
      parentId: null
    },
    include: {
      children: true,
      _count: {
        select: {
          children: true
        }
      }
    }
  });

  console.log(`📊 Total de catégories principales: ${mainCategories.length}\n`);

  const categoriesWithoutSubcats = mainCategories.filter(cat => cat._count.children === 0);

  console.log(`⚠️  Catégories SANS sous-catégories: ${categoriesWithoutSubcats.length}`);
  categoriesWithoutSubcats.forEach(cat => {
    console.log(`   - ${cat.name}`);
  });
  console.log('');

  if (categoriesWithoutSubcats.length === 0) {
    console.log('✅ Toutes les catégories ont déjà des sous-catégories!');
    return;
  }

  console.log('➕ Ajout des sous-catégories "Général"...\n');

  // Ajouter une sous-catégorie "Général" pour chaque catégorie qui n'en a pas
  for (const category of categoriesWithoutSubcats) {
    try {
      const subcategory = await prisma.category.create({
        data: {
          name: 'Général',
          slug: `${category.slug}-general`,
          parentId: category.id
        }
      });

      console.log(`✅ Sous-catégorie créée pour "${category.name}" (ID: ${subcategory.id})`);
    } catch (error) {
      console.error(`❌ Erreur pour "${category.name}":`, error);
    }
  }

  console.log('\n🎉 Terminé! Vérification finale...\n');

  // Vérification finale
  const updatedCategories = await prisma.category.findMany({
    where: {
      parentId: null
    },
    include: {
      _count: {
        select: {
          children: true
        }
      }
    }
  });

  const stillWithoutSubcats = updatedCategories.filter(cat => cat._count.children === 0);

  if (stillWithoutSubcats.length === 0) {
    console.log('✅ Succès! TOUTES les catégories ont maintenant des sous-catégories!');
  } else {
    console.log(`⚠️  Il reste ${stillWithoutSubcats.length} catégorie(s) sans sous-catégories:`);
    stillWithoutSubcats.forEach(cat => {
      console.log(`   - ${cat.name}`);
    });
  }
}

addSubcategoriesToAll()
  .then(() => {
    console.log('\n✅ Script terminé avec succès!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
