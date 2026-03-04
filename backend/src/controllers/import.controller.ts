import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import csv from 'csv-parser';
import fs from 'fs';
import { Readable } from 'stream';

const prisma = new PrismaClient();

interface ImportResult {
  success: number;
  errors: Array<{ line: number; data: any; error: string }>;
  warnings: Array<{ line: number; message: string }>;
}

// Import clients from CSV
export const importCustomers = async (req: Request, res: Response) => {
  try {
    const { data, mapping } = req.body; // data = CSV parsed data, mapping = column mapping

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        message: 'Données CSV invalides',
      });
    }

    const results: ImportResult = {
      success: 0,
      errors: [],
      warnings: [],
    };

    const userId = (req as any).user.userId;

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      try {
        // Map columns
        const customerData: any = {
          type: row[mapping.type] || 'INDIVIDUAL',
          email: row[mapping.email],
          phone: row[mapping.phone],
          status: row[mapping.status] || 'PROSPECT',
        };

        // Handle company fields
        if (customerData.type === 'COMPANY') {
          customerData.companyName = row[mapping.companyName];
          customerData.siret = row[mapping.siret];
          customerData.vatNumber = row[mapping.vatNumber];
        } else {
          customerData.firstName = row[mapping.firstName];
          customerData.lastName = row[mapping.lastName];
        }

        // Address fields
        customerData.address = row[mapping.address];
        customerData.addressLine2 = row[mapping.addressLine2];
        customerData.city = row[mapping.city];
        customerData.postalCode = row[mapping.postalCode];
        customerData.country = row[mapping.country] || 'France';

        // Optional fields
        customerData.mobile = row[mapping.mobile];
        customerData.notes = row[mapping.notes];
        customerData.tags = row[mapping.tags] ? row[mapping.tags].split(';') : [];

        // GPS coordinates
        if (row[mapping.gpsLatitude] && row[mapping.gpsLongitude]) {
          customerData.gpsLatitude = parseFloat(row[mapping.gpsLatitude]);
          customerData.gpsLongitude = parseFloat(row[mapping.gpsLongitude]);
        }

        // Validate required fields
        if (!customerData.email) {
          results.errors.push({
            line: i + 2, // +2 because of header and 0-index
            data: row,
            error: 'Email requis',
          });
          continue;
        }

        if (customerData.type === 'COMPANY' && !customerData.companyName) {
          results.errors.push({
            line: i + 2,
            data: row,
            error: 'Nom de société requis pour type COMPANY',
          });
          continue;
        }

        if (customerData.type === 'INDIVIDUAL' && (!customerData.firstName || !customerData.lastName)) {
          results.errors.push({
            line: i + 2,
            data: row,
            error: 'Prénom et nom requis pour type INDIVIDUAL',
          });
          continue;
        }

        // Check if customer already exists
        const existing = await prisma.customer.findFirst({
          where: { email: customerData.email },
        });

        if (existing) {
          results.warnings.push({
            line: i + 2,
            message: `Client avec email ${customerData.email} existe déjà - ignoré`,
          });
          continue;
        }

        // Create customer
        await prisma.customer.create({
          data: customerData,
        });

        results.success++;

        // Log activity
        await prisma.activity.create({
          data: {
            type: 'OTHER',
            description: `Client importé: ${customerData.email}`,
            userId,
          },
        });
      } catch (error: any) {
        results.errors.push({
          line: i + 2,
          data: row,
          error: error.message,
        });
      }
    }

    // Save import history
    await prisma.importHistory.create({
      data: {
        type: 'CUSTOMERS',
        totalRows: data.length,
        successCount: results.success,
        errorCount: results.errors.length,
        warningCount: results.warnings.length,
        userId,
        errors: JSON.stringify(results.errors),
        warnings: JSON.stringify(results.warnings),
      },
    });

    return res.json({
      success: true,
      message: `Import terminé: ${results.success} succès, ${results.errors.length} erreurs, ${results.warnings.length} avertissements`,
      results,
    });
  } catch (error: any) {
    console.error('Error importing customers:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'import',
      error: error.message,
    });
  }
};

// Import products from CSV
export const importProducts = async (req: Request, res: Response) => {
  try {
    const { data, mapping } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        message: 'Données CSV invalides',
      });
    }

    const results: ImportResult = {
      success: 0,
      errors: [],
      warnings: [],
    };

    const userId = (req as any).user.userId;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      try {
        const productData: any = {
          sku: row[mapping.sku],
          name: row[mapping.name],
          description: row[mapping.description] || '',
          price: parseFloat(row[mapping.price]),
          costPrice: row[mapping.costPrice] ? parseFloat(row[mapping.costPrice]) : undefined,
          compareAtPrice: row[mapping.compareAtPrice] ? parseFloat(row[mapping.compareAtPrice]) : undefined,
          stock: row[mapping.stock] ? parseInt(row[mapping.stock]) : 0,
          minStock: row[mapping.minStock] ? parseInt(row[mapping.minStock]) : undefined,
          maxStock: row[mapping.maxStock] ? parseInt(row[mapping.maxStock]) : undefined,
          status: row[mapping.status] || 'AVAILABLE',
          isVisible: row[mapping.isVisible] ? (row[mapping.isVisible] === 'true' || row[mapping.isVisible] === '1') : true,
          isFeatured: row[mapping.isFeatured] === 'true' || row[mapping.isFeatured] === '1',
          barcode: row[mapping.barcode],
          weight: row[mapping.weight] ? parseFloat(row[mapping.weight]) : undefined,
          width: row[mapping.width] ? parseFloat(row[mapping.width]) : undefined,
          height: row[mapping.height] ? parseFloat(row[mapping.height]) : undefined,
          length: row[mapping.length] ? parseFloat(row[mapping.length]) : undefined,
          tags: row[mapping.tags] ? row[mapping.tags].split(';') : [],
          images: row[mapping.images] ? row[mapping.images].split(';').filter((img: string) => img.trim()) : [],
        };

        // Handle category
        if (row[mapping.category]) {
          const category = await prisma.category.findFirst({
            where: { name: row[mapping.category] },
          });

          if (category) {
            productData.categoryId = category.id;
          } else {
            // Create category if it doesn't exist
            const categoryName = row[mapping.category];
            const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const newCategory = await prisma.category.create({
              data: {
                name: categoryName,
                slug: slug
              },
            });
            productData.categoryId = newCategory.id;
          }
        }

        // Handle supplier
        if (row[mapping.supplier]) {
          const supplier = await prisma.supplier.findFirst({
            where: { companyName: row[mapping.supplier] },
          });

          if (supplier) {
            productData.supplierId = supplier.id;
          } else {
            results.warnings.push({
              line: i + 2,
              message: `Fournisseur "${row[mapping.supplier]}" non trouvé - ignoré`,
            });
          }
        }

        // Validate required fields
        if (!productData.sku) {
          results.errors.push({
            line: i + 2,
            data: row,
            error: 'SKU requis',
          });
          continue;
        }

        if (!productData.name) {
          results.errors.push({
            line: i + 2,
            data: row,
            error: 'Nom requis',
          });
          continue;
        }

        if (isNaN(productData.price)) {
          results.errors.push({
            line: i + 2,
            data: row,
            error: 'Prix invalide',
          });
          continue;
        }

        // Check if product already exists
        const existing = await prisma.product.findFirst({
          where: { sku: productData.sku },
        });

        if (existing) {
          results.warnings.push({
            line: i + 2,
            message: `Produit avec SKU ${productData.sku} existe déjà - ignoré`,
          });
          continue;
        }

        // Create product
        await prisma.product.create({
          data: productData,
        });

        results.success++;

        // Log activity
        await prisma.activity.create({
          data: {
            type: 'OTHER',
            description: `Produit importé: ${productData.name}`,
            userId,
          },
        });
      } catch (error: any) {
        results.errors.push({
          line: i + 2,
          data: row,
          error: error.message,
        });
      }
    }

    // Save import history
    await prisma.importHistory.create({
      data: {
        type: 'PRODUCTS',
        totalRows: data.length,
        successCount: results.success,
        errorCount: results.errors.length,
        warningCount: results.warnings.length,
        userId,
        errors: JSON.stringify(results.errors),
        warnings: JSON.stringify(results.warnings),
      },
    });

    return res.json({
      success: true,
      message: `Import terminé: ${results.success} succès, ${results.errors.length} erreurs, ${results.warnings.length} avertissements`,
      results,
    });
  } catch (error: any) {
    console.error('Error importing products:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'import',
      error: error.message,
    });
  }
};

// Fonction pour créer un slug à partir d'un nom
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// Import products from Excel (HJK DISTRIBUTION)
export const importProductsFromExcel = async (req: Request, res: Response) => {
  console.log('🚀 Démarrage de l\'import des produits...\n');

  try {
    // Charger les produits catégorisés
    const products = req.body.products || [];

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun produit à importer',
      });
    }

    // Catégories à créer
    const categoriesToCreate = [
      {
        name: 'Nouveaux Produits',
        slug: 'nouveaux-produits',
        description: 'Découvrez nos dernières nouveautés',
        image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
        isVisible: true
      },
      {
        name: 'Cuisine & Maison',
        slug: 'cuisine-maison',
        description: 'Tout pour votre cuisine et votre maison',
        image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400',
        isVisible: true
      },
      {
        name: 'Fleurs & Plantes Artificielles',
        slug: 'fleurs-plantes-artificielles',
        description: 'Décorez votre intérieur avec nos fleurs artificielles',
        image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400',
        isVisible: true
      },
      {
        name: 'Fête & Anniversaire',
        slug: 'fete-anniversaire',
        description: 'Tout pour réussir vos fêtes et anniversaires',
        image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400',
        isVisible: true
      },
      {
        name: 'Décorations de Noël',
        slug: 'decorations-noel',
        description: 'Illuminez vos fêtes de fin d\'année',
        image: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=400',
        isVisible: true
      },
      {
        name: 'Jouets',
        slug: 'jouets',
        description: 'Des jouets pour petits et grands',
        image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400',
        isVisible: true
      },
      {
        name: 'Décoration',
        slug: 'decoration',
        description: 'Objets déco pour embellir votre intérieur',
        image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400',
        isVisible: true
      }
    ];

    // Étape 1: Créer ou récupérer les catégories
    console.log('📦 Création des catégories...');
    const categoryMap: { [key: string]: string } = {};

    for (const cat of categoriesToCreate) {
      const category = await prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat
      });
      categoryMap[cat.name] = category.id;
      console.log(`  ✅ ${cat.name} (ID: ${category.id})`);
    }

    console.log(`\n✅ ${Object.keys(categoryMap).length} catégories créées/mises à jour\n`);

    // Étape 2: Trouver ou créer le fournisseur HJK DISTRIBUTION
    console.log('🏪 Recherche du fournisseur HJK DISTRIBUTION...');
    let supplier = await prisma.supplier.findFirst({
      where: {
        companyName: {
          contains: 'HJK',
          mode: 'insensitive'
        }
      }
    });

    if (!supplier) {
      console.log('  ⚠️  Fournisseur non trouvé, création...');
      supplier = await prisma.supplier.create({
        data: {
          companyName: 'HJK DISTRIBUTION',
          email: 'contact@hjk-distribution.fr',
          status: 'ACTIVE',
          paymentTerms: 'NET_30'
        }
      });
      console.log(`  ✅ Fournisseur créé (ID: ${supplier.id})`);
    } else {
      console.log(`  ✅ Fournisseur trouvé (ID: ${supplier.id})`);
    }

    // Étape 3: Importer les produits
    console.log(`\n📥 Import de ${products.length} produits...\n`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const errorList: string[] = [];

    for (const product of products) {
      try {
        const categoryId = categoryMap[product.category];

        if (!categoryId) {
          console.log(`  ⚠️  Catégorie "${product.category}" non trouvée pour ${product.name}`);
          skipped++;
          continue;
        }

        // Vérifier si le produit existe déjà (par SKU ou barcode)
        const existing = await prisma.product.findFirst({
          where: {
            OR: [
              { sku: product.sku },
              ...(product.barcode ? [{ barcode: product.barcode }] : [])
            ]
          }
        });

        if (existing) {
          console.log(`  ⏭️  ${product.name} (SKU: ${product.sku}) existe déjà`);
          skipped++;
          continue;
        }

        // Créer le slug unique
        let slug = slugify(product.name);
        let slugCounter = 1;
        while (await prisma.product.findUnique({ where: { slug } })) {
          slug = `${slugify(product.name)}-${slugCounter}`;
          slugCounter++;
        }

        // Image placeholder basée sur la catégorie
        const placeholderImages: { [key: string]: string } = {
          'Nouveaux Produits': 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600',
          'Cuisine & Maison': 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600',
          'Fleurs & Plantes Artificielles': 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600',
          'Fête & Anniversaire': 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600',
          'Décorations de Noël': 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=600',
          'Jouets': 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600',
          'Décoration': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600'
        };

        const thumbnail = placeholderImages[product.category] || placeholderImages['Nouveaux Produits'];

        // IMPORTANT: product.stock représente la quantité de conditionnement, pas le stock réel!
        // Ex: 12 = vendu par conditionnement de 12 unités
        const packagingQty = product.stock || 1;
        const unitPrice = packagingQty > 1 ? parseFloat((product.price / packagingQty).toFixed(2)) : product.price;

        // Stock réel disponible (en nombre d'unités, pas de conditionnements)
        const actualStock = 100; // Stock par défaut: 100 unités disponibles

        // Créer le produit
        await prisma.product.create({
          data: {
            sku: product.sku,
            barcode: product.barcode || null,
            name: product.name,
            slug: slug,
            description: `${product.name} - Référence ${product.sku}`,
            shortDescription: product.name,
            price: product.price, // Prix du conditionnement complet
            costPrice: product.costPrice,
            compareAtPrice: null,
            stock: actualStock, // Stock réel en unités
            minStock: packagingQty * 2, // Stock minimum = 2 conditionnements
            status: 'ACTIVE',
            availabilityStatus: 'AVAILABLE',
            isVisible: true,
            isFeatured: product.category === 'Nouveaux Produits', // Mettre en avant les nouveaux produits
            images: [thumbnail],
            thumbnail: thumbnail,
            categoryId: categoryId,
            supplierId: supplier.id,
            weight: null,
            width: null,
            height: null,
            length: null,
            // Champs de conditionnement
            packagingQuantity: packagingQty,
            sellByUnit: true, // Permettre vente à l'unité
            sellByPackage: true, // Permettre vente par conditionnement
            unitPrice: unitPrice // Prix à l'unité calculé
          }
        });

        console.log(`  ✅ ${product.name} (${product.category})`);
        imported++;

      } catch (error: any) {
        console.error(`  ❌ Erreur pour ${product.name}:`, error.message);
        errors++;
        errorList.push(`${product.name}: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DE L\'IMPORT');
    console.log('='.repeat(60));
    console.log(`✅ Produits importés: ${imported}`);
    console.log(`⏭️  Produits ignorés (déjà existants): ${skipped}`);
    console.log(`❌ Erreurs: ${errors}`);
    console.log(`📦 Total traité: ${products.length}`);
    console.log('='.repeat(60));

    // Statistiques par catégorie
    console.log('\n📊 PRODUITS PAR CATÉGORIE:');
    const categoryStats: { [key: string]: number } = {};
    for (const [categoryName, categoryId] of Object.entries(categoryMap)) {
      const count = await prisma.product.count({
        where: { categoryId }
      });
      categoryStats[categoryName] = count;
      console.log(`  ${categoryName}: ${count} produits`);
    }

    return res.json({
      success: true,
      message: `Import terminé: ${imported} produits importés, ${skipped} ignorés, ${errors} erreurs`,
      data: {
        imported,
        skipped,
        errors,
        errorList,
        totalProcessed: products.length,
        categoryStats
      }
    });

  } catch (error: any) {
    console.error('\n❌ Erreur fatale:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'import',
      error: error.message,
    });
  }
};

// Get import history
export const getImportHistory = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const userId = (req as any).user.userId;

    const where: any = {};

    // Admin/super admin can see all imports, others only their own
    if ((req as any).user.role === 'COMMERCIAL') {
      where.userId = userId;
    }

    if (type) {
      where.type = type;
    }

    const history = await prisma.importHistory.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error('Error fetching import history:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique',
    });
  }
};
