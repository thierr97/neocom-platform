import { Request, Response } from 'express';
import prisma from '../config/database';
import { previewPrice } from '../services/b2bPricing.service';

/**
 * ============================================
 * GESTION DES CLIENTS PRO
 * ============================================
 */

/**
 * Liste des clients PRO (tous statuts)
 */
export const getProCustomers = async (req: Request, res: Response) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const where: any = {};

    if (status) {
      where.status = status as string;
    }

    if (search) {
      where.customer = {
        OR: [
          { companyName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ],
      };
    }

    const [profiles, total] = await Promise.all([
      prisma.proCustomerProfile.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              companyName: true,
              phone: true,
              address: true,
              city: true,
              postalCode: true,
              createdAt: true,
            },
          },
          documents: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.proCustomerProfile.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        profiles,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error in getProCustomers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des clients PRO',
    });
  }
};

/**
 * Détail d'un client PRO
 */
export const getProCustomerDetail = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    const profile = await prisma.proCustomerProfile.findFirst({
      where: { customerId },
      include: {
        customer: true,
        documents: true,
        shippingAddresses: true,
      },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Client PRO non trouvé',
      });
    }

    // Statistiques du client
    const [totalOrders, totalSpent, unpaidInvoices] = await Promise.all([
      prisma.order.count({
        where: { customerId, isB2B: true },
      }),
      prisma.order.aggregate({
        where: {
          customerId,
          isB2B: true,
          status: { not: 'CANCELLED' },
        },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: {
          order: { customerId },
          status: { not: 'PAID' },
        },
        _sum: { total: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        profile,
        stats: {
          totalOrders,
          totalSpent: totalSpent._sum.total || 0,
          unpaidAmount: unpaidInvoices._sum.total || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error in getProCustomerDetail:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du client PRO',
    });
  }
};

/**
 * Approuver un client PRO
 */
export const approveProCustomer = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const user = (req as any).user;
    const { paymentTerms, creditLimit, defaultDiscount, statusNote } = req.body;

    const profile = await prisma.proCustomerProfile.update({
      where: { customerId },
      data: {
        status: 'APPROVED',
        statusNote,
        approvedAt: new Date(),
        approvedBy: user.userId,
        paymentTerms: paymentTerms || 'NET30',
        creditLimit: creditLimit || 0,
        defaultDiscount: defaultDiscount || 0,
      },
      include: {
        customer: true,
      },
    });

    // TODO: Envoyer email de confirmation au client

    res.json({
      success: true,
      message: 'Client PRO approuvé avec succès',
      data: profile,
    });
  } catch (error) {
    console.error('Error in approveProCustomer:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'approbation du client PRO',
    });
  }
};

/**
 * Rejeter un client PRO
 */
export const rejectProCustomer = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { rejectedReason } = req.body;

    if (!rejectedReason) {
      return res.status(400).json({
        success: false,
        message: 'La raison du rejet est requise',
      });
    }

    const profile = await prisma.proCustomerProfile.update({
      where: { customerId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedReason,
      },
      include: {
        customer: true,
      },
    });

    // TODO: Envoyer email de rejet au client

    res.json({
      success: true,
      message: 'Client PRO rejeté',
      data: profile,
    });
  } catch (error) {
    console.error('Error in rejectProCustomer:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du rejet du client PRO',
    });
  }
};

/**
 * Suspendre un client PRO
 */
export const suspendProCustomer = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { statusNote } = req.body;

    const profile = await prisma.proCustomerProfile.update({
      where: { customerId },
      data: {
        status: 'SUSPENDED',
        statusNote,
      },
    });

    res.json({
      success: true,
      message: 'Client PRO suspendu',
      data: profile,
    });
  } catch (error) {
    console.error('Error in suspendProCustomer:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suspension du client PRO',
    });
  }
};

/**
 * Mettre à jour les conditions commerciales d'un client PRO
 */
export const updateProCustomerTerms = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { paymentTerms, creditLimit, defaultDiscount } = req.body;

    const profile = await prisma.proCustomerProfile.update({
      where: { customerId },
      data: {
        paymentTerms,
        creditLimit,
        defaultDiscount,
      },
    });

    res.json({
      success: true,
      message: 'Conditions commerciales mises à jour',
      data: profile,
    });
  } catch (error) {
    console.error('Error in updateProCustomerTerms:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des conditions',
    });
  }
};

/**
 * ============================================
 * GESTION DES DOCUMENTS PRO
 * ============================================
 */

/**
 * Liste des documents en attente de validation
 */
export const getPendingDocuments = async (req: Request, res: Response) => {
  try {
    const documents = await prisma.proDocument.findMany({
      where: { status: 'PENDING' },
      include: {
        profile: {
          include: {
            customer: {
              select: {
                id: true,
                companyName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { uploadedAt: 'asc' },
    });

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error('Error in getPendingDocuments:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des documents',
    });
  }
};

/**
 * Approuver un document
 */
export const approveDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const user = (req as any).user;

    const document = await prisma.proDocument.update({
      where: { id: documentId },
      data: {
        status: 'APPROVED',
        validatedAt: new Date(),
        validatedBy: user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Document approuvé',
      data: document,
    });
  } catch (error) {
    console.error('Error in approveDocument:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'approbation du document',
    });
  }
};

/**
 * Rejeter un document
 */
export const rejectDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const user = (req as any).user;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'La raison du rejet est requise',
      });
    }

    const document = await prisma.proDocument.update({
      where: { id: documentId },
      data: {
        status: 'REJECTED',
        validatedAt: new Date(),
        validatedBy: user.userId,
        rejectionReason,
      },
    });

    res.json({
      success: true,
      message: 'Document rejeté',
      data: document,
    });
  } catch (error) {
    console.error('Error in rejectDocument:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du rejet du document',
    });
  }
};

/**
 * ============================================
 * GESTION DES RÈGLES DE PRICING B2B
 * ============================================
 */

/**
 * Liste des règles de pricing
 */
export const getPricingRules = async (req: Request, res: Response) => {
  try {
    const { scope, isActive, page = 1, limit = 50 } = req.query;

    const where: any = {};

    if (scope) {
      where.scope = scope as string;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [rules, total] = await Promise.all([
      prisma.b2BPricingRule.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.b2BPricingRule.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        rules,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error in getPricingRules:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des règles',
    });
  }
};

/**
 * Créer une règle de pricing
 */
export const createPricingRule = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      name,
      description,
      scope,
      targetId,
      customerId,
      priceType,
      basePrice,
      value,
      tiersJson,
      minimumQuantity,
      priority,
      validFrom,
      validTo,
      isActive,
    } = req.body;

    // Validation
    if (!name || !scope || !priceType) {
      return res.status(400).json({
        success: false,
        message: 'Nom, scope et type de prix sont requis',
      });
    }

    const rule = await prisma.b2BPricingRule.create({
      data: {
        name,
        description,
        scope,
        targetId,
        customerId,
        priceType,
        basePrice: basePrice || 'CURRENT_PRICE',
        value,
        tiersJson,
        minimumQuantity: minimumQuantity || 1,
        priority: priority || 0,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        isActive: isActive !== false,
        createdBy: user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Règle de pricing créée',
      data: rule,
    });
  } catch (error) {
    console.error('Error in createPricingRule:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la règle',
    });
  }
};

/**
 * Mettre à jour une règle de pricing
 */
export const updatePricingRule = async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;
    const updateData = req.body;

    // Convertir les dates si présentes
    if (updateData.validFrom) {
      updateData.validFrom = new Date(updateData.validFrom);
    }
    if (updateData.validTo) {
      updateData.validTo = new Date(updateData.validTo);
    }

    const rule = await prisma.b2BPricingRule.update({
      where: { id: ruleId },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Règle de pricing mise à jour',
      data: rule,
    });
  } catch (error) {
    console.error('Error in updatePricingRule:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la règle',
    });
  }
};

/**
 * Supprimer une règle de pricing
 */
export const deletePricingRule = async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;

    await prisma.b2BPricingRule.delete({
      where: { id: ruleId },
    });

    res.json({
      success: true,
      message: 'Règle de pricing supprimée',
    });
  } catch (error) {
    console.error('Error in deletePricingRule:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la règle',
    });
  }
};

/**
 * Prévisualiser le prix pour un produit/client avec les règles actuelles
 */
export const previewPricing = async (req: Request, res: Response) => {
  try {
    const { productId, customerId, quantity } = req.query;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'productId est requis',
      });
    }

    const preview = await previewPrice(
      productId as string,
      customerId as string | undefined,
      quantity ? Number(quantity) : 1
    );

    res.json({
      success: true,
      data: preview,
    });
  } catch (error) {
    console.error('Error in previewPricing:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la prévisualisation des prix',
    });
  }
};

/**
 * ============================================
 * GESTION DES COMMANDES B2B
 * ============================================
 */

/**
 * Liste des commandes B2B
 */
export const getB2BOrders = async (req: Request, res: Response) => {
  try {
    const { status, customerId, page = 1, limit = 20 } = req.query;

    const where: any = {
      isB2B: true,
    };

    if (status) {
      where.status = status as string;
    }

    if (customerId) {
      where.customerId = customerId as string;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          customer: {
            select: {
              id: true,
              companyName: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
          deliveries: true,
          invoice: true,
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
    console.error('Error in getB2BOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes',
    });
  }
};

/**
 * Mettre à jour le statut d'une commande B2B
 */
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        notes: notes || undefined,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // TODO: Envoyer notification au client

    res.json({
      success: true,
      message: 'Statut de commande mis à jour',
      data: order,
    });
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
    });
  }
};

/**
 * Créer une livraison pour une commande
 */
export const createDelivery = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { pickupAddress, deliveryAddress, estimatedDeliveryAt, specialInstructions, courierId, priority } = req.body;

    // Vérifier que la commande existe et n'a pas déjà de livraison
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { deliveries: true, customer: true },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée',
      });
    }

    if (order.deliveries && order.deliveries.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cette commande a déjà une livraison',
      });
    }

    const delivery = await prisma.delivery.create({
      data: {
        orderId,
        customerId: order.customerId,
        pickupAddress: pickupAddress || 'Adresse d\'enlèvement par défaut',
        deliveryAddress: deliveryAddress || order.shippingAddress || 'Adresse de livraison',
        status: 'CREATED',
        estimatedDeliveryAt: estimatedDeliveryAt ? new Date(estimatedDeliveryAt) : null,
        specialInstructions: specialInstructions || order.notes,
        courierId: courierId || null,
        priority: priority || 0,
      },
    });

    // Mettre à jour le statut de la commande
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'SHIPPED' },
    });

    res.json({
      success: true,
      message: 'Livraison créée',
      data: delivery,
    });
  } catch (error) {
    console.error('Error in createDelivery:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la livraison',
    });
  }
};

/**
 * ============================================
 * GESTION DES LIVRAISONS ET SIGNATURES
 * ============================================
 */

/**
 * Enregistrer une preuve de livraison avec signature
 */
export const recordDeliveryProof = async (req: Request, res: Response) => {
  try {
    const { deliveryId } = req.params;
    const { signedBy, signatureImage, signatureVector, photos, notes } = req.body;

    // Vérifier que la livraison existe
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { deliveryProof: true },
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Livraison non trouvée',
      });
    }

    // Créer ou mettre à jour la preuve de livraison
    const proof = await prisma.deliveryProof.upsert({
      where: { deliveryId },
      create: {
        deliveryId,
        signedBy,
        signatureImage,
        signatureVector,
        photos: photos || [],
        notes,
      },
      update: {
        signedBy,
        signatureImage,
        signatureVector,
        photos: photos || [],
        notes,
      },
    });

    // Mettre à jour le statut de la livraison
    await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: 'DELIVERED',
        actualDeliveryAt: new Date(),
      },
    });

    // Mettre à jour le statut de la commande
    await prisma.order.update({
      where: { id: delivery.orderId },
      data: { status: 'DELIVERED' },
    });

    // TODO: Générer le PDF de la preuve de livraison
    // TODO: Envoyer email au client et à la compta

    res.json({
      success: true,
      message: 'Preuve de livraison enregistrée',
      data: proof,
    });
  } catch (error) {
    console.error('Error in recordDeliveryProof:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement de la preuve',
    });
  }
};

/**
 * ============================================
 * GESTION DE LA FACTURATION B2B
 * ============================================
 */

/**
 * Générer une facture pour une commande
 */
export const generateInvoice = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { dueDate, notes } = req.body;

    // Vérifier que la commande existe et n'a pas déjà de facture
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        invoice: true,
        customer: {
          include: {
            proProfile: true,
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

    if (order.invoice) {
      return res.status(400).json({
        success: false,
        message: 'Cette commande a déjà une facture',
      });
    }

    // Calculer la date d'échéance selon les conditions de paiement
    const paymentTerms = order.customer.proProfile?.paymentTerms || 'NET30';
    const calculatedDueDate = dueDate
      ? new Date(dueDate)
      : calculateDueDate(paymentTerms);

    const invoice = await prisma.invoice.create({
      data: {
        orderId,
        number: `INV-${Date.now()}`,
        total: order.total,
        paidAmount: 0,
        status: 'DRAFT',
        dueDate: calculatedDueDate,
        notes,
      },
    });

    // TODO: Générer le PDF de la facture

    res.json({
      success: true,
      message: 'Facture générée',
      data: invoice,
    });
  } catch (error) {
    console.error('Error in generateInvoice:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération de la facture',
    });
  }
};

/**
 * Valider un paiement déclaré par le client
 */
export const validatePayment = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { status, notes } = req.body;

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        notes,
      },
      include: {
        invoice: true,
      },
    });

    res.json({
      success: true,
      message: 'Paiement validé',
      data: payment,
    });
  } catch (error) {
    console.error('Error in validatePayment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du paiement',
    });
  }
};

/**
 * Exporter les données comptables
 */
export const exportAccounting = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {};

    if (startDate) {
      where.createdAt = { gte: new Date(startDate as string) };
    }

    if (endDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(endDate as string),
      };
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        order: {
          include: {
            customer: {
              select: {
                companyName: true,
                email: true,
              },
            },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // TODO: Formater les données pour export CSV ou Excel

    res.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    console.error('Error in exportAccounting:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export comptable',
    });
  }
};

/**
 * Calculer la date d'échéance selon les conditions de paiement
 */
function calculateDueDate(paymentTerms: string): Date {
  const today = new Date();
  const days = {
    IMMEDIATE: 0,
    NET15: 15,
    NET30: 30,
    NET45: 45,
    NET60: 60,
    NET90: 90,
  };

  const daysToAdd = days[paymentTerms as keyof typeof days] || 30;
  today.setDate(today.getDate() + daysToAdd);
  return today;
}
