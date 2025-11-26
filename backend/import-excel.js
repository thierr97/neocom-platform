const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

// Utiliser l'URL de production si fournie
const databaseUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

// Configuration
const EXCEL_FILE = '/Users/thierrycyrillefrancillette/Downloads/fichier en csv/ARTICLES BAZAR.xlsx';
const MARKUP_PERCENTAGE = 13; // Majoration de 13%

// Mapping des colonnes Excel vers les champs de la base de données
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

    console.log(`✅ Fichier lu avec succès: ${data.length} lignes trouvées\n`);

    if (data.length === 0) {
      console.error('❌ Aucune donnée trouvée dans le fichier');
      return;
    }

    // Afficher les colonnes disponibles
    const columns = Object.keys(data[0]);
    console.log('📋 Colonnes trouvées:', columns.join(', '));
    console.log('');

    // Trouver l'utilisateur admin pour l'associer aux activités
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      console.error('❌ Aucun utilisateur admin trouvé');
      return;
    }

    console.log(`👤 Import par: ${adminUser.email}\n`);

    let successCount = 0;
    let errorCount = 0;
    let warningCount = 0;
    const errors = [];
    const warnings = [];

    // Traiter chaque ligne
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const lineNumber = i + 2; // +2 pour header et index 0

      try {
        // Extraire les données
        const sku = row['REF ARTICLE']?.toString().trim();
        const name = row['PRODUITS']?.toString().trim();
        const barcode = row['CODE BARRE']?.toString().trim();
        const stockQty = parseInt(row['QUANTITÉ']) || 0;
        const costPriceValue = parseFloat(row['PRIX DE REVIENT']) || 0;
        const priceValue = parseFloat(row['PRIX UNITAIRE']) || 0;
        const supplierName = row['FOURNISSEUR']?.toString().trim();
        const categoryName = row['CATÉGORIE']?.toString().trim();
        const subcategoryName = row['SOUS CATÉGORIE']?.toString().trim();
        const imageUrl = '';

        // Validation des champs requis
        if (!sku) {
          errors.push({ line: lineNumber, error: 'SKU requis', data: row });
          errorCount++;
          continue;
        }

        if (!name) {
          errors.push({ line: lineNumber, error: 'Nom requis', data: row });
          errorCount++;
          continue;
        }

        if (!priceValue || priceValue <= 0) {
          errors.push({ line: lineNumber, error: 'Prix invalide', data: row });
          errorCount++;
          continue;
        }

        // Appliquer la majoration de 13%
        const finalPrice = priceValue * (1 + MARKUP_PERCENTAGE / 100);

        // Vérifier si le produit existe déjà
        const existingProduct = await prisma.product.findFirst({
          where: { sku },
        });

        if (existingProduct) {
          warnings.push({
            line: lineNumber,
            message: `Produit avec SKU ${sku} existe déjà - ignoré`,
          });
          warningCount++;
          continue;
        }

        // Gérer la catégorie
        let categoryId = null;
        if (categoryName) {
          let category = await prisma.category.findFirst({
            where: { name: categoryName },
          });

          if (!category) {
            const slug = categoryName
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '');

            category = await prisma.category.create({
              data: {
                name: categoryName,
                slug,
              },
            });
            console.log(`  ✓ Catégorie créée: ${categoryName}`);
          }
          categoryId = category.id;
        }

        // Gérer le fournisseur
        let supplierId = null;
        if (supplierName) {
          const supplier = await prisma.supplier.findFirst({
            where: { companyName: supplierName },
          });

          if (supplier) {
            supplierId = supplier.id;
          } else {
            warnings.push({
              line: lineNumber,
              message: `Fournisseur "${supplierName}" non trouvé - ignoré`,
            });
          }
        }

        // Générer un slug unique à partir du nom et du SKU
        const slug = `${name}-${sku}`
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        // Créer le produit
        const productData = {
          sku,
          name,
          slug,
          description: subcategoryName || '',
          price: parseFloat(finalPrice.toFixed(2)),
          costPrice: costPriceValue > 0 ? costPriceValue : undefined,
          stock: stockQty,
          status: stockQty > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
          isVisible: true,
          isFeatured: false,
          barcode: barcode || undefined,
          categoryId,
          supplierId,
          images: imageUrl ? [imageUrl] : [],
          tags: [],
        };

        await prisma.product.create({ data: productData });

        // Logger l'activité
        await prisma.activity.create({
          data: {
            type: 'OTHER',
            description: `Produit importé: ${name} (SKU: ${sku})`,
            userId: adminUser.id,
          },
        });

        successCount++;

        // Afficher la progression tous les 100 produits
        if ((i + 1) % 100 === 0) {
          console.log(`  📦 Traité ${i + 1}/${data.length} lignes...`);
        }
      } catch (error) {
        errors.push({
          line: lineNumber,
          error: error.message,
          data: row,
        });
        errorCount++;
      }
    }

    // Sauvegarder l'historique d'import
    await prisma.importHistory.create({
      data: {
        type: 'PRODUCTS',
        totalRows: data.length,
        successCount,
        errorCount,
        warningCount,
        userId: adminUser.id,
        errors: JSON.stringify(errors),
        warnings: JSON.stringify(warnings),
      },
    });

    // Afficher le résumé
    console.log('\n' + '='.repeat(70));
    console.log('📊 RÉSULTAT FINAL DE L\'IMPORT');
    console.log('='.repeat(70));
    console.log(`✅ Produits importés avec succès: ${successCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`⚠️  Avertissements: ${warningCount}`);
    console.log(`💰 Majoration appliquée: +${MARKUP_PERCENTAGE}%`);
    console.log('='.repeat(70));

    // Afficher quelques erreurs si présentes
    if (errors.length > 0) {
      console.log('\n❌ Premières erreurs:');
      errors.slice(0, 10).forEach(err => {
        console.log(`  Ligne ${err.line}: ${err.error}`);
      });
      if (errors.length > 10) {
        console.log(`  ... et ${errors.length - 10} autres erreurs`);
      }
    }

    // Afficher quelques avertissements si présents
    if (warnings.length > 0) {
      console.log('\n⚠️  Premiers avertissements:');
      warnings.slice(0, 10).forEach(warn => {
        console.log(`  Ligne ${warn.line}: ${warn.message}`);
      });
      if (warnings.length > 10) {
        console.log(`  ... et ${warnings.length - 10} autres avertissements`);
      }
    }

    console.log('\n✅ Import terminé!');

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter l'import
console.log('🚀 Démarrage de l\'import des produits...');
console.log('🔗 Base de données:', databaseUrl ? databaseUrl.split('@')[1]?.split('/')[0] : 'localhost');
console.log('');
importProducts();
