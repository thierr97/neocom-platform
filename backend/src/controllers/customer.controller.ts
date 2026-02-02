import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const { status, type, search } = req.query;

    const where: any = {};

    // Admin voir tous, commercial voir seulement les siens
    if (req.user!.role === 'COMMERCIAL') {
      where.userId = req.user!.userId;
    }

    if (status) where.status = status;
    if (type) where.type = type;

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { companyName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const customers = await prisma.customer.findMany({
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
        _count: {
          select: {
            orders: true,
            quotes: true,
            invoices: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      customers,
    });
  } catch (error: any) {
    console.error('Error in getCustomers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des clients',
      error: error.message,
    });
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        quotes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé',
      });
    }

    // Check access
    if (req.user!.role === 'COMMERCIAL' && customer.userId !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    res.json({
      success: true,
      customer,
    });
  } catch (error: any) {
    console.error('Error in getCustomerById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du client',
      error: error.message,
    });
  }
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;

    // Map zipCode → postalCode (frontend compatibility)
    if (data.zipCode) {
      data.postalCode = data.zipCode;
      delete data.zipCode;
    }

    // Assigner le userId de l'utilisateur connecté (commercial ou admin)
    if (!data.userId) {
      data.userId = req.user!.userId;
    }

    // Gestion des remises commerciales
    if (data.discountRate !== undefined && data.discountRate !== null) {
      // Valider le taux de remise
      if (data.discountType === 'PERCENTAGE' && (data.discountRate < 0 || data.discountRate > 100)) {
        return res.status(400).json({
          success: false,
          message: 'Le taux de remise doit être entre 0 et 100 pour une remise en pourcentage',
        });
      }

      if (data.discountRate < 0) {
        return res.status(400).json({
          success: false,
          message: 'Le taux de remise ne peut pas être négatif',
        });
      }

      // Valider les dates de validité
      if (data.discountValidFrom && data.discountValidTo) {
        const validFrom = new Date(data.discountValidFrom);
        const validTo = new Date(data.discountValidTo);

        if (validFrom >= validTo) {
          return res.status(400).json({
            success: false,
            message: 'La date de début de validité doit être antérieure à la date de fin',
          });
        }
      }

      // Enregistrer automatiquement qui a appliqué la remise
      data.discountAppliedBy = req.user!.userId;
    }

    const customer = await prisma.customer.create({
      data,
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
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'CUSTOMER_CREATED',
        description: `Nouveau client créé: ${customer.companyName || `${customer.firstName} ${customer.lastName}`}`,
        userId: req.user!.userId,
        customerId: customer.id,
      },
    });

    // Log de la remise si applicable
    if (customer.discountRate && customer.discountRate > 0) {
      await prisma.activity.create({
        data: {
          type: 'CUSTOMER_UPDATED',
          description: `Remise de ${customer.discountRate}${customer.discountType === 'PERCENTAGE' ? '%' : '€'} appliquée${customer.discountReason ? ` - Raison: ${customer.discountReason}` : ''}`,
          userId: req.user!.userId,
          customerId: customer.id,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Client créé avec succès',
      customer,
    });
  } catch (error: any) {
    console.error('Error in createCustomer:', error);

    // Gestion des erreurs Prisma spécifiques
    if (error.code === 'P2002') {
      // Contrainte unique violée
      const field = error.meta?.target?.[0] || 'champ';
      return res.status(400).json({
        success: false,
        message: `Un client avec cet ${field} existe déjà`,
        error: error.message,
      });
    }

    if (error.code === 'P2003') {
      // Contrainte de clé étrangère violée
      return res.status(400).json({
        success: false,
        message: 'Référence invalide (userId)',
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du client',
      error: error.message,
    });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Map zipCode → postalCode (frontend compatibility)
    if (data.zipCode) {
      data.postalCode = data.zipCode;
      delete data.zipCode;
    }

    // Gestion des remises commerciales
    if (data.discountRate !== undefined && data.discountRate !== null) {
      // Valider le taux de remise
      if (data.discountType === 'PERCENTAGE' && (data.discountRate < 0 || data.discountRate > 100)) {
        return res.status(400).json({
          success: false,
          message: 'Le taux de remise doit être entre 0 et 100 pour une remise en pourcentage',
        });
      }

      if (data.discountRate < 0) {
        return res.status(400).json({
          success: false,
          message: 'Le taux de remise ne peut pas être négatif',
        });
      }

      // Valider les dates de validité
      if (data.discountValidFrom && data.discountValidTo) {
        const validFrom = new Date(data.discountValidFrom);
        const validTo = new Date(data.discountValidTo);

        if (validFrom >= validTo) {
          return res.status(400).json({
            success: false,
            message: 'La date de début de validité doit être antérieure à la date de fin',
          });
        }
      }

      // Enregistrer automatiquement qui a appliqué/modifié la remise
      data.discountAppliedBy = req.user!.userId;
    }

    // Check if customer exists and access
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé',
      });
    }

    if (req.user!.role === 'COMMERCIAL' && existing.userId !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data,
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
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'CUSTOMER_UPDATED',
        description: `Client mis à jour: ${customer.companyName || `${customer.firstName} ${customer.lastName}`}`,
        userId: req.user!.userId,
        customerId: customer.id,
      },
    });

    // Log spécifique pour les modifications de remise
    if (data.discountRate !== undefined && (existing.discountRate !== customer.discountRate || existing.discountType !== customer.discountType)) {
      const discountDescription = customer.discountRate && customer.discountRate > 0
        ? `Remise ${existing.discountRate ? 'modifiée' : 'appliquée'}: ${customer.discountRate}${customer.discountType === 'PERCENTAGE' ? '%' : '€'}${customer.discountReason ? ` - Raison: ${customer.discountReason}` : ''}`
        : 'Remise supprimée';

      await prisma.activity.create({
        data: {
          type: 'CUSTOMER_UPDATED',
          description: discountDescription,
          userId: req.user!.userId,
          customerId: customer.id,
        },
      });
    }

    res.json({
      success: true,
      message: 'Client mis à jour',
      customer,
    });
  } catch (error: any) {
    console.error('Error in updateCustomer:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du client',
      error: error.message,
    });
  }
};

export const deleteCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé',
      });
    }

    if (req.user!.role === 'COMMERCIAL' && existing.userId !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    await prisma.customer.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Client supprimé',
    });
  } catch (error: any) {
    console.error('Error in deleteCustomer:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du client',
      error: error.message,
    });
  }
};

// Get customer product history
export const getCustomerProductHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get all quotes, orders and invoices items for this customer
    const [quoteItems, orderItems, invoiceItems] = await Promise.all([
      prisma.quoteItem.findMany({
        where: {
          quote: {
            customerId: id,
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
            },
          },
          quote: {
            select: {
              number: true,
              createdAt: true,
              status: true,
            },
          },
        },
      }),
      prisma.orderItem.findMany({
        where: {
          order: {
            customerId: id,
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
            },
          },
          order: {
            select: {
              number: true,
              createdAt: true,
              status: true,
            },
          },
        },
      }),
      prisma.invoiceItem.findMany({
        where: {
          invoice: {
            customerId: id,
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
            },
          },
          invoice: {
            select: {
              number: true,
              issueDate: true,
              status: true,
            },
          },
        },
      }),
    ]);

    // Aggregate products
    const productMap = new Map<string, {
      productId: string;
      productName: string;
      productSku: string;
      totalQuantity: number;
      totalAmount: number;
      occurrences: number;
      inQuotes: number;
      inOrders: number;
      inInvoices: number;
      lastOrderDate: Date;
    }>();

    // Process quote items
    quoteItems.forEach((item) => {
      const key = item.productId;
      const existing = productMap.get(key);

      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.totalAmount += item.total;
        existing.occurrences += 1;
        existing.inQuotes += 1;
        if (item.quote.createdAt > existing.lastOrderDate) {
          existing.lastOrderDate = item.quote.createdAt;
        }
      } else {
        productMap.set(key, {
          productId: item.productId,
          productName: item.product.name,
          productSku: item.product.sku,
          totalQuantity: item.quantity,
          totalAmount: item.total,
          occurrences: 1,
          inQuotes: 1,
          inOrders: 0,
          inInvoices: 0,
          lastOrderDate: item.quote.createdAt,
        });
      }
    });

    // Process order items
    orderItems.forEach((item) => {
      const key = item.productId;
      const existing = productMap.get(key);

      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.totalAmount += item.total;
        existing.occurrences += 1;
        existing.inOrders += 1;
        if (item.order.createdAt > existing.lastOrderDate) {
          existing.lastOrderDate = item.order.createdAt;
        }
      } else {
        productMap.set(key, {
          productId: item.productId,
          productName: item.product.name,
          productSku: item.product.sku,
          totalQuantity: item.quantity,
          totalAmount: item.total,
          occurrences: 1,
          inQuotes: 0,
          inOrders: 1,
          inInvoices: 0,
          lastOrderDate: item.order.createdAt,
        });
      }
    });

    // Process invoice items
    invoiceItems.forEach((item) => {
      const key = item.productId;
      const existing = productMap.get(key);

      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.totalAmount += item.total;
        existing.occurrences += 1;
        existing.inInvoices += 1;
        if (item.invoice.issueDate > existing.lastOrderDate) {
          existing.lastOrderDate = item.invoice.issueDate;
        }
      } else {
        productMap.set(key, {
          productId: item.productId,
          productName: item.product.name,
          productSku: item.product.sku,
          totalQuantity: item.quantity,
          totalAmount: item.total,
          occurrences: 1,
          inQuotes: 0,
          inOrders: 0,
          inInvoices: 1,
          lastOrderDate: item.invoice.issueDate,
        });
      }
    });

    // Convert to array and sort by total amount
    const products = Array.from(productMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount
    );

    res.json({
      success: true,
      products,
    });
  } catch (error: any) {
    console.error('Error in getCustomerProductHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique produits',
      error: error.message,
    });
  }
};
