import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import aiManagerService from '../services/ai-manager.service';

// Fonction pour normaliser le texte de recherche
function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .replace(/[^a-z0-9\s]/g, ' ') // Garder seulement lettres et chiffres
    .replace(/\s+/g, ' ')
    .trim();
}

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { status, category, categoryId, search, isVisible, isFeatured } = req.query;

    const where: any = {};

    if (status) where.status = status;
    if (category || categoryId) where.categoryId = category || categoryId;
    if (isVisible !== undefined) where.isVisible = isVisible === 'true';
    if (isFeatured !== undefined) where.isFeatured = isFeatured === 'true';

    if (search) {
      // Normaliser le terme de recherche
      const normalizedSearch = normalizeSearchText(search as string);
      const searchWords = normalizedSearch.split(' ').filter(w => w.length > 2);

      where.OR = [
        // Recherche classique dans le nom, SKU et barcode
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
        { barcode: { contains: search as string, mode: 'insensitive' } },
        // Recherche intelligente dans les termes lexicaux
        ...searchWords.map(word => ({
          searchTerms: {
            hasSome: [word]
          }
        }))
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        supplier: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      products,
    });
  } catch (error: any) {
    console.error('Error in getProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits',
      error: error.message,
    });
  }
};

export const getProductById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
        orderItems: {
          include: {
            order: {
              select: {
                id: true,
                number: true,
                status: true,
                createdAt: true,
                customer: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    companyName: true,
                    type: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        quoteItems: {
          include: {
            quote: {
              select: {
                id: true,
                number: true,
                status: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé',
      });
    }

    // Calculate statistics
    const totalSold = await prisma.orderItem.aggregate({
      where: {
        productId: id,
        order: {
          status: {
            in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
          },
        },
      },
      _sum: {
        quantity: true,
      },
    });

    const totalRevenue = await prisma.orderItem.aggregate({
      where: {
        productId: id,
        order: {
          status: {
            in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
          },
        },
      },
      _sum: {
        total: true,
      },
    });

    res.json({
      success: true,
      product,
      stats: {
        totalSold: totalSold._sum.quantity || 0,
        totalRevenue: totalRevenue._sum.total || 0,
        totalOrders: product.orderItems.length,
      },
    });
  } catch (error: any) {
    console.error('Error in getProductById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du produit',
      error: error.message,
    });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;

    const product = await prisma.product.create({
      data,
      include: {
        category: true,
        supplier: true,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'PRODUCT_CREATED',
        description: `Nouveau produit créé: ${product.name}`,
        userId: req.user!.userId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès',
      product,
    });
  } catch (error: any) {
    console.error('Error in createProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du produit',
      error: error.message,
    });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const product = await prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
        supplier: true,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'PRODUCT_UPDATED',
        description: `Produit mis à jour: ${product.name}`,
        userId: req.user!.userId,
      },
    });

    res.json({
      success: true,
      message: 'Produit mis à jour',
      product,
    });
  } catch (error: any) {
    console.error('Error in updateProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du produit',
      error: error.message,
    });
  }
};

export const patchProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Vérifier que le produit existe
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé',
      });
    }

    // Mise à jour partielle
    const product = await prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
        supplier: true,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'PRODUCT_UPDATED',
        description: `Produit mis à jour (PATCH): ${product.name}`,
        userId: req.user!.userId,
      },
    });

    res.json({
      success: true,
      message: 'Produit mis à jour',
      product,
    });
  } catch (error: any) {
    console.error('Error in patchProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du produit',
      error: error.message,
    });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Produit supprimé',
    });
  } catch (error: any) {
    console.error('Error in deleteProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du produit',
      error: error.message,
    });
  }
};

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      categories,
    });
  } catch (error: any) {
    console.error('Error in getCategories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories',
      error: error.message,
    });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;

    const category = await prisma.category.create({
      data,
    });

    res.status(201).json({
      success: true,
      message: 'Catégorie créée avec succès',
      category,
    });
  } catch (error: any) {
    console.error('Error in createCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la catégorie',
      error: error.message,
    });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const category = await prisma.category.update({
      where: { id },
      data,
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Catégorie modifiée avec succès',
      category,
    });
  } catch (error: any) {
    console.error('Error in updateCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de la catégorie',
      error: error.message,
    });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Vérifier si la catégorie a des produits liés
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée',
      });
    }

    if (category._count.products > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer cette catégorie car ${category._count.products} produit(s) y sont associés`,
      });
    }

    if (category._count.children > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer cette catégorie car elle contient ${category._count.children} sous-catégorie(s)`,
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Catégorie supprimée avec succès',
    });
  } catch (error: any) {
    console.error('Error in deleteCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la catégorie',
      error: error.message,
    });
  }
};

export const toggleProductVisibility = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get current product
    const currentProduct = await prisma.product.findUnique({
      where: { id },
      select: { isVisible: true, name: true },
    });

    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé',
      });
    }

    // Toggle visibility
    const product = await prisma.product.update({
      where: { id },
      data: {
        isVisible: !currentProduct.isVisible,
      },
      include: {
        category: true,
        supplier: true,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'PRODUCT_UPDATED',
        description: `Produit ${product.isVisible ? 'rendu visible' : 'masqué'}: ${product.name}`,
        userId: req.user!.userId,
      },
    });

    res.json({
      success: true,
      message: `Produit ${product.isVisible ? 'rendu visible' : 'masqué'} avec succès`,
      product,
    });
  } catch (error: any) {
    console.error('Error in toggleProductVisibility:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de visibilité',
      error: error.message,
    });
  }
};

/**
 * Generate AI description for a single product
 */
export const generateProductDescription = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé',
      });
    }

    // Generate description using AI
    const description = await aiManagerService.generateProductDescription(id);

    // Get updated product
    const updatedProduct = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    res.json({
      success: true,
      message: 'Description générée avec succès',
      description,
      product: updatedProduct,
    });
  } catch (error: any) {
    console.error('Error generating product description:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la génération de la description',
      error: error.message,
    });
  }
};

/**
 * Generate AI descriptions for multiple products (bulk)
 */
export const generateBulkDescriptions = async (req: AuthRequest, res: Response) => {
  try {
    const { productIds, onlyEmpty } = req.body;

    let productsToProcess: string[] = [];

    if (productIds && Array.isArray(productIds)) {
      // Use provided product IDs
      productsToProcess = productIds;
    } else if (onlyEmpty) {
      // Find products without descriptions
      const products = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { description: null },
            { description: { equals: '' } },
          ],
        },
        select: { id: true },
        take: 20, // Limit to 20 products at a time
      });
      productsToProcess = products.map(p => p.id);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir productIds ou onlyEmpty=true',
      });
    }

    if (productsToProcess.length === 0) {
      return res.json({
        success: true,
        message: 'Aucun produit à traiter',
        results: [],
      });
    }

    // Generate descriptions for each product
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const productId of productsToProcess) {
      try {
        const description = await aiManagerService.generateProductDescription(productId);
        results.push({
          productId,
          success: true,
          description: description.substring(0, 100) + '...',
        });
        successCount++;

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        results.push({
          productId,
          success: false,
          error: error.message,
        });
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: `Descriptions générées: ${successCount} succès, ${errorCount} erreurs`,
      results,
      summary: {
        total: productsToProcess.length,
        success: successCount,
        error: errorCount,
      },
    });
  } catch (error: any) {
    console.error('Error generating bulk descriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération en masse',
      error: error.message,
    });
  }
};
