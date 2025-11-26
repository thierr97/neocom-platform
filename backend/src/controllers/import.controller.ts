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
