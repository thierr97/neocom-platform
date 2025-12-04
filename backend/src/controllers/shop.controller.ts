import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getDefaultTaxRate } from '../config/tax.config';

const prisma = new PrismaClient();

// Get all public products (no auth required)
export const getPublicProducts = async (req: Request, res: Response) => {
  try {
    const {
      category,
      search,
      sort = 'createdAt',
      order = 'desc',
      featured,
      page = '1',
      limit = '12'
    } = req.query;

    const where: any = {
      isVisible: true,
      status: 'ACTIVE',
    };

    // Filter by category
    if (category) {
      // Vérifier si c'est une catégorie parente
      const selectedCategory = await prisma.category.findUnique({
        where: { id: category as string },
        include: {
          children: true, // Récupérer les sous-catégories
        },
      });

      if (selectedCategory) {
        if (selectedCategory.children && selectedCategory.children.length > 0) {
          // C'est une catégorie parente : inclure tous les produits de la catégorie parente ET des sous-catégories
          const childrenIds = selectedCategory.children.map(child => child.id);
          where.categoryId = {
            in: [category as string, ...childrenIds],
          };
        } else {
          // C'est une sous-catégorie : filtrer normalement
          where.categoryId = category;
        }
      }
    }

    // Filter featured products
    if (featured === 'true') {
      where.isFeatured = true;
    }

    // Search
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { tags: { has: search as string } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { [sort as string]: order },
      skip,
      take: limitNum,
    });

    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching public products:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits',
      error: error.message,
    });
  }
};

// Get single product details (no auth required)
export const getPublicProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        supplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    if (!product || !product.isVisible || product.status !== 'ACTIVE') {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé',
      });
    }

    return res.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du produit',
      error: error.message,
    });
  }
};

// Get all public categories (no auth required)
export const getPublicCategories = async (req: Request, res: Response) => {
  try {
    // Récupérer toutes les catégories avec le compte de leurs produits directs
    const categories = await prisma.category.findMany({
      where: {
        isVisible: true, // Only visible categories
      },
      include: {
        _count: {
          select: {
            products: {
              where: {
                isVisible: true,
                status: 'ACTIVE',
              },
            },
          },
        },
      },
    });

    // Créer une map pour calculer le nombre total de produits (incluant sous-catégories)
    const categoryProductCounts = new Map<string, number>();

    // D'abord, compter les produits directs de chaque catégorie
    categories.forEach(cat => {
      categoryProductCounts.set(cat.id, cat._count.products);
    });

    // Ensuite, pour chaque catégorie parente, additionner les produits de ses sous-catégories + ses propres produits
    categories.forEach(cat => {
      if (!cat.parentId) {
        // C'est une catégorie parente
        let totalProducts = categoryProductCounts.get(cat.id) || 0; // Commencer avec ses propres produits

        // Trouver toutes les sous-catégories
        const children = categories.filter(c => c.parentId === cat.id);

        // Additionner les produits de toutes les sous-catégories
        children.forEach(child => {
          totalProducts += categoryProductCounts.get(child.id) || 0;
        });

        // Mettre à jour le compte pour la catégorie parente
        categoryProductCounts.set(cat.id, totalProducts);
      }
    });

    // Construire la réponse avec les comptes mis à jour
    const categoriesWithCounts = categories.map(cat => ({
      ...cat,
      _count: {
        products: categoryProductCounts.get(cat.id) || 0,
      },
    }));

    return res.json({
      success: true,
      data: categoriesWithCounts,
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories',
      error: error.message,
    });
  }
};

// Create public order (no auth required - for guest checkout)
export const createPublicOrder = async (req: Request, res: Response) => {
  try {
    const {
      items,
      customer,
      shippingAddress,
      notes,
    } = req.body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Articles requis',
      });
    }

    // Validate customer info
    if (!customer || !customer.email) {
      return res.status(400).json({
        success: false,
        message: 'Email client requis',
      });
    }

    // Check if customer exists or create new one
    let existingCustomer = await prisma.customer.findUnique({
      where: { email: customer.email },
    });

    if (!existingCustomer) {
      // Create new customer
      // Find or create a default user for public orders
      let publicUser = await prisma.user.findFirst({
        where: { email: 'public@neoserv.com' },
      });

      if (!publicUser) {
        // Create public user if doesn't exist
        publicUser = await prisma.user.create({
          data: {
            email: 'public@neoserv.com',
            password: 'public', // Will be hashed, not used for login
            role: 'CLIENT',
            firstName: 'Public',
            lastName: 'Orders',
          },
        });
      }

      existingCustomer = await prisma.customer.create({
        data: {
          type: customer.companyName ? 'COMPANY' : 'INDIVIDUAL',
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          companyName: customer.companyName,
          phone: customer.phone,
          mobile: customer.mobile,
          address: shippingAddress.address,
          addressLine2: shippingAddress.addressLine2,
          city: shippingAddress.city,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country || 'France',
          status: 'ACTIVE',
          userId: publicUser.id,
        },
      });
    }

    // Calculate order totals
    let subtotal = 0;
    let taxAmount = 0;

    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Produit ${item.productId} non trouvé`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuffisant pour ${product.name}`,
        });
      }

      const itemTotal = product.price * item.quantity;
      const taxRate = item.taxRate || getDefaultTaxRate();
      const itemTax = itemTotal * taxRate / 100;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        taxRate: taxRate,
        discount: 0,
        total: itemTotal,
      });

      subtotal += itemTotal;
      taxAmount += itemTax;
    }

    const total = subtotal + taxAmount;

    // Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `CMD-${Date.now()}-${orderCount + 1}`;

    // Get public user for the order
    const publicUser = await prisma.user.findFirst({
      where: { email: 'public@neoserv.com' },
    });

    // Create order
    const order = await prisma.order.create({
      data: {
        number: orderNumber,
        customerId: existingCustomer.id,
        userId: publicUser!.id,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        subtotal,
        taxAmount,
        shippingCost: 0,
        discount: 0,
        total,
        shippingAddress: shippingAddress.address,
        shippingCity: shippingAddress.city,
        shippingPostalCode: shippingAddress.postalCode,
        shippingCountry: shippingAddress.country || 'France',
        notes,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });

    // Update product stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      // Create stock movement
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      await prisma.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'SALE',
          quantity: -item.quantity,
          stockBefore: product!.stock + item.quantity,
          stockAfter: product!.stock,
          orderId: order.id,
          referenceNumber: order.number,
        },
      });
    }

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'ORDER_CREATED',
        description: `Commande publique créée: ${order.number} - ${customer.email}`,
        userId: publicUser!.id,
        customerId: existingCustomer.id,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: order,
    });
  } catch (error: any) {
    console.error('Error creating public order:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la commande',
      error: error.message,
    });
  }
};

// Get featured products (no auth required)
export const getFeaturedProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isFeatured: true,
        isVisible: true,
        status: 'ACTIVE',
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    console.error('Error fetching featured products:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits en vedette',
      error: error.message,
    });
  }
};

// Search products (no auth required)
export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Terme de recherche requis',
      });
    }

    const products = await prisma.product.findMany({
      where: {
        isVisible: true,
        status: 'ACTIVE',
        OR: [
          { name: { contains: q as string, mode: 'insensitive' } },
          { description: { contains: q as string, mode: 'insensitive' } },
          { sku: { contains: q as string, mode: 'insensitive' } },
        ],
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      take: 20,
    });

    return res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error: any) {
    console.error('Error searching products:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche',
      error: error.message,
    });
  }
};

// Add default subcategory to categories without any (admin only)
export const addMissingSubcategories = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Recherche des catégories sans sous-catégories...');

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

    console.log(`📊 Total de catégories principales: ${mainCategories.length}`);

    const categoriesWithoutSubcats = mainCategories.filter(cat => cat._count.children === 0);

    console.log(`⚠️  Catégories SANS sous-catégories: ${categoriesWithoutSubcats.length}`);

    if (categoriesWithoutSubcats.length === 0) {
      return res.json({
        success: true,
        message: 'Toutes les catégories ont déjà des sous-catégories',
        categoriesProcessed: 0,
        details: []
      });
    }

    const created = [];

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
        created.push({
          parent: category.name,
          subcategory: subcategory.name,
          id: subcategory.id
        });
      } catch (error: any) {
        console.error(`❌ Erreur pour "${category.name}":`, error);
        created.push({
          parent: category.name,
          error: error.message
        });
      }
    }

    return res.json({
      success: true,
      message: `${created.length} sous-catégorie(s) "Général" ajoutée(s) avec succès`,
      categoriesProcessed: created.length,
      details: created
    });
  } catch (error: any) {
    console.error('Error adding missing subcategories:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout des sous-catégories',
      error: error.message,
    });
  }
};

// ========================================
// VISIBILITY MANAGEMENT (ADMIN ONLY)
// ========================================

// Toggle product visibility (single or multiple)
export const toggleProductVisibility = async (req: Request, res: Response) => {
  try {
    const { productIds, isVisible } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'productIds doit être un tableau non vide',
      });
    }

    if (typeof isVisible !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isVisible doit être un booléen',
      });
    }

    // Update all products at once
    const result = await prisma.product.updateMany({
      where: {
        id: { in: productIds },
      },
      data: {
        isVisible,
      },
    });

    return res.json({
      success: true,
      message: `${result.count} produit(s) ${isVisible ? 'affiché(s)' : 'masqué(s)'}`,
      updatedCount: result.count,
    });
  } catch (error: any) {
    console.error('Error toggling product visibility:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la visibilité',
      error: error.message,
    });
  }
};

// Toggle category visibility (single or multiple)
export const toggleCategoryVisibility = async (req: Request, res: Response) => {
  try {
    const { categoryIds, isVisible } = req.body;

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'categoryIds doit être un tableau non vide',
      });
    }

    if (typeof isVisible !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isVisible doit être un booléen',
      });
    }

    // Update all categories at once
    const result = await prisma.category.updateMany({
      where: {
        id: { in: categoryIds },
      },
      data: {
        isVisible,
      },
    });

    return res.json({
      success: true,
      message: `${result.count} catégorie(s) ${isVisible ? 'affichée(s)' : 'masquée(s)'}`,
      updatedCount: result.count,
    });
  } catch (error: any) {
    console.error('Error toggling category visibility:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la visibilité',
      error: error.message,
    });
  }
};
