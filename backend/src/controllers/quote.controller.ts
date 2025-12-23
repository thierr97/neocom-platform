import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateQuoteNumber } from '../utils/generateNumber';
import { PDFService } from '../services/pdf.service';
import { getDefaultTaxRate } from '../config/tax.config';
import { getCompanySettings, getBankInfo } from '../utils/getCompanySettings';

const prisma = new PrismaClient();

// Get all quotes
export const getAllQuotes = async (req: Request, res: Response) => {
  try {
    // Get userId and role from JWT token (set by auth middleware)
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    // Admin voir tous, commercial voir seulement les siens
    const where: any = {};
    if (userRole === 'COMMERCIAL') {
      where.userId = userId;
    }

    const quotes = await prisma.quote.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
                sku: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json({
      success: true,
      data: quotes,
    });
  } catch (error: any) {
    console.error('Error getting quotes:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des devis',
    });
  }
};

// Get quote by ID
export const getQuoteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
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

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    // Check access - commercial peut voir seulement ses devis
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?.userId;

    if (userRole === 'COMMERCIAL' && quote.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    return res.json({
      success: true,
      data: quote,
    });
  } catch (error: any) {
    console.error('Error getting quote:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du devis',
    });
  }
};

// Create quote
export const createQuote = async (req: Request, res: Response) => {
  try {
    const { customerId, items, notes, termsConditions, validUntil } = req.body;
    const userId = (req as any).user.userId;

    // Calculate amounts
    let subtotal = 0;
    items.forEach((item: any) => {
      subtotal += item.quantity * item.unitPrice;
    });

    const taxAmount = subtotal * (getDefaultTaxRate() / 100); // TVA Guadeloupe
    const total = subtotal + taxAmount;

    // Generate quote number
    const quoteNumber = await generateQuoteNumber();

    // Create quote
    const quote = await prisma.quote.create({
      data: {
        number: quoteNumber,
        customerId,
        userId,
        status: 'DRAFT',
        subtotal,
        taxAmount,
        total,
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        notes,
        termsConditions,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: getDefaultTaxRate(),
            discount: item.discount || 0,
            total: item.quantity * item.unitPrice,
          })),
        },
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

    return res.status(201).json({
      success: true,
      message: 'Devis créé avec succès',
      data: quote,
    });
  } catch (error: any) {
    console.error('Error creating quote:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du devis',
    });
  }
};

// Update quote status
export const updateQuoteStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updateData: any = { status };

    if (status === 'SENT') {
      updateData.sentAt = new Date();
    } else if (status === 'ACCEPTED') {
      updateData.acceptedAt = new Date();
    }

    const quote = await prisma.quote.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      message: 'Statut du devis mis à jour',
      data: quote,
    });
  } catch (error: any) {
    console.error('Error updating quote status:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
    });
  }
};

// Convert quote to order
export const convertQuoteToOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    // Get quote
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    if (quote.status !== 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        message: 'Le devis doit être accepté pour être converti',
      });
    }

    // Generate order number
    const { generateOrderNumber } = require('../utils/generateNumber');
    const orderNumber = await generateOrderNumber();

    // Create order
    const order = await prisma.order.create({
      data: {
        number: orderNumber,
        customerId: quote.customerId,
        userId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        subtotal: quote.subtotal,
        taxAmount: quote.taxAmount,
        discount: quote.discount,
        total: quote.total,
        notes: quote.notes || `Converti du devis ${quote.number}`,
        items: {
          create: quote.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
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

    // Update product stock
    for (const item of quote.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    return res.json({
      success: true,
      message: 'Devis converti en commande avec succès',
      data: order,
    });
  } catch (error: any) {
    console.error('Error converting quote to order:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la conversion du devis',
    });
  }
};

// Delete quote
export const deleteQuote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.quote.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Devis supprimé avec succès',
    });
  } catch (error: any) {
    console.error('Error deleting quote:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du devis',
    });
  }
};

// Generate quote PDF
export const generateQuotePDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    // Charger les paramètres de l'entreprise depuis la base de données
    const companySettings = await getCompanySettings();
    const bankInfo = await getBankInfo();

    // Generate PDF avec les settings dynamiques
    PDFService.generateQuotePDF(quote, companySettings, bankInfo, res);
  } catch (error: any) {
    console.error('Error generating quote PDF:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du PDF',
    });
  }
};

// Create quote from cart (B2B)
export const createQuoteFromCart = async (req: Request, res: Response) => {
  try {
    const { customerId, items } = req.body;
    const userId = (req as any).user.userId;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Client requis',
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le panier est vide',
      });
    }

    // Load products and calculate amounts
    let subtotal = 0;
    const quoteItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Produit ${item.productId} non trouvé`,
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      quoteItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        taxRate: getDefaultTaxRate(),
        discount: 0,
        total: itemTotal,
      });
    }

    const taxAmount = subtotal * (getDefaultTaxRate() / 100);
    const total = subtotal + taxAmount;

    // Generate quote number
    const quoteNumber = await generateQuoteNumber();

    // Create quote
    const quote = await prisma.quote.create({
      data: {
        number: quoteNumber,
        customerId,
        userId,
        status: 'DRAFT',
        subtotal,
        taxAmount,
        total,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        items: {
          create: quoteItems,
        },
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

    return res.status(201).json({
      success: true,
      message: 'Devis créé depuis le panier avec succès',
      data: quote,
    });
  } catch (error: any) {
    console.error('Error creating quote from cart:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du devis',
      error: error.message,
    });
  }
};
