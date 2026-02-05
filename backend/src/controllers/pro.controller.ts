import { Request, Response } from 'express';
import prisma from '../config/database';
import { calculateB2BPrice, calculateCartB2BPrices } from '../services/b2bPricing.service';

/**
 * Dashboard PRO - KPIs et statistiques
 */
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const customer = (req as any).customer;
    const proProfile = (req as any).proProfile;

    // Récupérer les KPIs
    const [
      totalOrders,
      pendingOrders,
      deliveredOrders,
      unpaidInvoices,
      totalSpent,
      recentOrders,
    ] = await Promise.all([
      // Nombre total de commandes
      prisma.order.count({
        where: { customerId: customer.id, isB2B: true },
      }),
      // Commandes en attente
      prisma.order.count({
        where: {
          customerId: customer.id,
          isB2B: true,
          status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] },
        },
      }),
      // Commandes livrées
      prisma.order.count({
        where: {
          customerId: customer.id,
          isB2B: true,
          status: 'DELIVERED',
        },
      }),
      // Factures impayées
      prisma.invoice.count({
        where: {
          order: { customerId: customer.id },
          status: { not: 'PAID' },
        },
      }),
      // Montant total dépensé
      prisma.order.aggregate({
        where: {
          customerId: customer.id,
          isB2B: true,
          status: { not: 'CANCELLED' },
        },
        _sum: { totalPrice: true },
      }),
      // Commandes récentes
      prisma.order.findMany({
        where: { customerId: customer.id, isB2B: true },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalPrice: true,
          createdAt: true,
        },
      }),
    ]);

    // Suggestions de réapprovisionnement (produits commandés fréquemment)
    const frequentProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          customerId: customer.id,
          isB2B: true,
          status: { not: 'CANCELLED' },
        },
      },
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const reorderSuggestions = await Promise.all(
      frequentProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            stock: true,
          },
        });

        if (!product) return null;

        // Calculer le prix B2B pour ce client
        const pricing = await calculateB2BPrice({
          productId: product.id,
          quantity: 1,
          customerId: customer.id,
          basePrice: product.price,
        });

        return {
          product,
          orderCount: item._count.id,
          totalQuantity: item._sum.quantity,
          unitPriceHT: pricing.unitPriceHT,
          discountPercent: pricing.discountPercent,
        };
      })
    );

    res.json({
      success: true,
      data: {
        profile: {
          companyName: customer.companyName,
          status: proProfile.status,
          paymentTerms: proProfile.paymentTerms,
          creditLimit: proProfile.creditLimit,
          defaultDiscount: proProfile.defaultDiscount,
        },
        kpis: {
          totalOrders,
          pendingOrders,
          deliveredOrders,
          unpaidInvoices,
          totalSpent: totalSpent._sum.totalPrice || 0,
        },
        recentOrders,
        reorderSuggestions: reorderSuggestions.filter((s) => s !== null),
        commercial: customer.assignedCommercial,
      },
    });
  } catch (error) {
    console.error('Error in getDashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du dashboard',
    });
  }
};

/**
 * Récupérer le profil de l'entreprise
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const customer = (req as any).customer;
    const proProfile = (req as any).proProfile;

    // Récupérer les documents
    const documents = await prisma.proDocument.findMany({
      where: { profileId: proProfile.id },
      orderBy: { uploadedAt: 'desc' },
    });

    // Récupérer les adresses de livraison
    const shippingAddresses = await prisma.shippingAddress.findMany({
      where: { profileId: proProfile.id },
      orderBy: { isDefault: 'desc' },
    });

    res.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          email: customer.email,
          companyName: customer.companyName,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          postalCode: customer.postalCode,
        },
        proProfile: {
          id: proProfile.id,
          status: proProfile.status,
          statusNote: proProfile.statusNote,
          approvedAt: proProfile.approvedAt,
          paymentTerms: proProfile.paymentTerms,
          creditLimit: proProfile.creditLimit,
          defaultDiscount: proProfile.defaultDiscount,
          accountingEmail: proProfile.accountingEmail,
          accountingPhone: proProfile.accountingPhone,
          accountingContact: proProfile.accountingContact,
        },
        documents,
        shippingAddresses,
        commercial: customer.assignedCommercial,
      },
    });
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
    });
  }
};

/**
 * Mettre à jour les informations de l'entreprise
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const customer = (req as any).customer;
    const proProfile = (req as any).proProfile;
    const {
      phone,
      address,
      city,
      postalCode,
      accountingEmail,
      accountingPhone,
      accountingContact,
    } = req.body;

    // Mettre à jour les informations du customer
    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        phone: phone || customer.phone,
        address: address || customer.address,
        city: city || customer.city,
        postalCode: postalCode || customer.postalCode,
      },
    });

    // Mettre à jour les informations du profil PRO
    const updatedProfile = await prisma.proCustomerProfile.update({
      where: { id: proProfile.id },
      data: {
        accountingEmail: accountingEmail || proProfile.accountingEmail,
        accountingPhone: accountingPhone || proProfile.accountingPhone,
        accountingContact: accountingContact || proProfile.accountingContact,
      },
    });

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: {
        customer: updatedCustomer,
        proProfile: updatedProfile,
      },
    });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
    });
  }
};

/**
 * Ajouter une adresse de livraison
 */
export const addShippingAddress = async (req: Request, res: Response) => {
  try {
    const proProfile = (req as any).proProfile;
    const { name, address, city, postalCode, country, phone, isDefault } = req.body;

    // Si c'est l'adresse par défaut, désactiver les autres
    if (isDefault) {
      await prisma.shippingAddress.updateMany({
        where: { profileId: proProfile.id },
        data: { isDefault: false },
      });
    }

    const shippingAddress = await prisma.shippingAddress.create({
      data: {
        profileId: proProfile.id,
        name,
        address,
        city,
        postalCode,
        country: country || 'France',
        phone,
        isDefault: isDefault || false,
      },
    });

    res.json({
      success: true,
      message: 'Adresse de livraison ajoutée',
      data: shippingAddress,
    });
  } catch (error) {
    console.error('Error in addShippingAddress:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de l\'adresse',
    });
  }
};

/**
 * Catalogue produits avec prix B2B
 */
export const getCatalog = async (req: Request, res: Response) => {
  try {
    const customer = (req as any).customer;
    const { categoryId, search, page = 1, limit = 20 } = req.query;

    const where: any = {
      status: 'PUBLISHED',
      stock: { gt: 0 },
    };

    if (categoryId) {
      where.categoryId = categoryId as string;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculer les prix B2B pour chaque produit
    const productsWithPricing = await Promise.all(
      products.map(async (product) => {
        // Prix pour quantités multiples (paliers)
        const quantities = [1, 10, 50, 100];
        const pricingTiers = await Promise.all(
          quantities.map(async (qty) => {
            const pricing = await calculateB2BPrice({
              productId: product.id,
              quantity: qty,
              customerId: customer.id,
              categoryId: product.categoryId,
              basePrice: product.price,
            });
            return {
              quantity: qty,
              unitPriceHT: pricing.unitPriceHT,
              totalHT: pricing.totalHT,
              discount: pricing.discountPercent,
              tier: pricing.tier,
            };
          })
        );

        return {
          ...product,
          b2bPricing: pricingTiers,
        };
      })
    );

    res.json({
      success: true,
      data: {
        products: productsWithPricing,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error in getCatalog:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du catalogue',
    });
  }
};

/**
 * Liste des commandes B2B
 */
export const getOrders = async (req: Request, res: Response) => {
  try {
    const customer = (req as any).customer;
    const { status, page = 1, limit = 20 } = req.query;

    const where: any = {
      customerId: customer.id,
      isB2B: true,
    };

    if (status) {
      where.status = status as string;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
          delivery: {
            select: {
              id: true,
              trackingNumber: true,
              status: true,
              deliveredAt: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
              paidAmount: true,
              dueDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error in getOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes',
    });
  }
};

/**
 * Détail d'une commande
 */
export const getOrderDetail = async (req: Request, res: Response) => {
  try {
    const customer = (req as any).customer;
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: customer.id,
        isB2B: true,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        delivery: {
          include: {
            deliveryProof: true,
          },
        },
        invoice: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error in getOrderDetail:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la commande',
    });
  }
};

/**
 * Créer une nouvelle commande (panier → commande)
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const customer = (req as any).customer;
    const proProfile = (req as any).proProfile;
    const { items, shippingAddressId, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le panier est vide',
      });
    }

    // Calculer les prix B2B pour tous les produits
    const cartPricing = await calculateCartB2BPrices(items, customer.id);

    // Créer la commande
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        orderNumber: `ORD-${Date.now()}`,
        status: 'PENDING',
        totalPrice: cartPricing.totalTTC,
        isB2B: true,
        paymentTerms: proProfile.paymentTerms,
        proPricesSnapshot: cartPricing,
        notes,
        items: {
          create: items.map((item: any, index: number) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: cartPricing.items[index].unitPriceHT,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Commande créée avec succès',
      data: order,
    });
  } catch (error) {
    console.error('Error in createOrder:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la commande',
    });
  }
};

/**
 * Liste des livraisons
 */
export const getDeliveries = async (req: Request, res: Response) => {
  try {
    const customer = (req as any).customer;
    const { status, page = 1, limit = 20 } = req.query;

    const where: any = {
      order: {
        customerId: customer.id,
        isB2B: true,
      },
    };

    if (status) {
      where.status = status as string;
    }

    const [deliveries, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              totalPrice: true,
            },
          },
          deliveryProof: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.delivery.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        deliveries,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error in getDeliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des livraisons',
    });
  }
};

/**
 * Liste des factures
 */
export const getInvoices = async (req: Request, res: Response) => {
  try {
    const customer = (req as any).customer;
    const { status, page = 1, limit = 20 } = req.query;

    const where: any = {
      order: {
        customerId: customer.id,
        isB2B: true,
      },
    };

    if (status) {
      where.status = status as string;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              totalPrice: true,
            },
          },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error in getInvoices:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des factures',
    });
  }
};

/**
 * Détail d'une facture
 */
export const getInvoiceDetail = async (req: Request, res: Response) => {
  try {
    const customer = (req as any).customer;
    const { invoiceId } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        order: {
          customerId: customer.id,
          isB2B: true,
        },
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée',
      });
    }

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error('Error in getInvoiceDetail:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la facture',
    });
  }
};

/**
 * Déclarer un paiement de facture
 */
export const declarePayment = async (req: Request, res: Response) => {
  try {
    const customer = (req as any).customer;
    const { invoiceId } = req.params;
    const { amount, paymentMethod, reference, notes } = req.body;

    // Vérifier que la facture existe et appartient au client
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        order: {
          customerId: customer.id,
          isB2B: true,
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée',
      });
    }

    // Vérifier que le montant est valide
    const remainingAmount = invoice.amount - (invoice.paidAmount || 0);
    if (amount > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: 'Le montant dépasse le montant restant dû',
      });
    }

    // Créer le paiement
    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount,
        paymentMethod,
        reference,
        notes,
        paidBy: customer.companyName,
        status: 'PENDING', // En attente de validation admin
      },
    });

    // Mettre à jour le montant payé de la facture
    const newPaidAmount = (invoice.paidAmount || 0) + amount;
    const newStatus = newPaidAmount >= invoice.amount ? 'PAID' : 'PARTIAL';

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

    res.json({
      success: true,
      message: 'Paiement déclaré avec succès',
      data: payment,
    });
  } catch (error) {
    console.error('Error in declarePayment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déclaration du paiement',
    });
  }
};
