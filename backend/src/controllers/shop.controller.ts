import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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
      where.categoryId = category;
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

    // Ensuite, pour chaque catégorie parente, additionner les produits de ses sous-catégories
    categories.forEach(cat => {
      if (!cat.parentId) {
        // C'est une catégorie parente
        let totalProducts = 0;

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
      const itemTax = itemTotal * (item.taxRate || 20) / 100;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        taxRate: item.taxRate || 20,
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
