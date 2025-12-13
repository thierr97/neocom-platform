import { getDefaultTaxRate } from '../config/tax.config';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateInvoiceNumber } from '../utils/generateNumber';
import { PDFService } from '../services/pdf.service';
import { generateSaleInvoiceEntry, generatePaymentReceivedEntry } from '../services/auto-accounting.service';
import { getCompanySettings, getBankInfo } from '../utils/getCompanySettings';

const prisma = new PrismaClient();

// Get all invoices
export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    // Get userId from JWT token (set by auth middleware)
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    const invoices = await prisma.invoice.findMany({
      where: { userId },
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
      data: invoices,
    });
  } catch (error: any) {
    console.error('Error getting invoices:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des factures',
    });
  }
};

// Get invoice by ID
export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
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

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée',
      });
    }

    return res.json({
      success: true,
      data: invoice,
    });
  } catch (error: any) {
    console.error('Error getting invoice:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la facture',
    });
  }
};

// Create invoice
export const createInvoice = async (req: Request, res: Response) => {
  try {
    const { customerId, items, notes, dueDate } = req.body;
    const userId = (req as any).user.userId;

    // Calculate amounts
    let subtotal = 0;
    items.forEach((item: any) => {
      subtotal += item.quantity * item.unitPrice;
    });

    const taxAmount = subtotal * (getDefaultTaxRate() / 100); // 8.5% TVA Guadeloupe
    const total = subtotal + taxAmount;

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        customerId,
        userId,
        status: 'DRAFT',
        subtotal,
        taxAmount,
        total,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        notes,
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

    // Générer automatiquement l'écriture comptable (désactivé temporairement)
    // Les comptes comptables doivent être configurés d'abord
    // try {
    //   await generateSaleInvoiceEntry(invoice.id);
    //   console.log(`✅ Écriture comptable générée pour la facture ${invoice.number}`);
    // } catch (error) {
    //   console.error('⚠️  Erreur génération écriture comptable:', error);
    //   // Ne pas bloquer la création de la facture si l'écriture échoue
    // }

    return res.status(201).json({
      success: true,
      message: 'Facture créée avec succès',
      data: invoice,
    });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la facture',
    });
  }
};

// Update invoice status
export const updateInvoiceStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === 'SENT') {
        updateData.sentAt = new Date();
      }
    }

    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      if (paymentStatus === 'PAID') {
        updateData.paidAt = new Date();
      }
    }

    const invoice = await prisma.invoice.update({
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
      message: 'Statut de la facture mis à jour',
      data: invoice,
    });
  } catch (error: any) {
    console.error('Error updating invoice status:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
    });
  }
};

// Delete invoice
export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.invoice.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Facture supprimée avec succès',
    });
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la facture',
    });
  }
};

// Create invoice from order
export const createInvoiceFromOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const userId = (req as any).user.userId;

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée',
      });
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        customerId: order.customerId,
        userId,
        status: 'DRAFT',
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        discount: order.discount,
        total: order.total,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: `Facture de la commande ${order.number}`,
        items: {
          create: order.items.map((item) => ({
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

    return res.status(201).json({
      success: true,
      message: 'Facture créée depuis la commande avec succès',
      data: invoice,
    });
  } catch (error: any) {
    console.error('Error creating invoice from order:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la facture',
    });
  }
};

// Generate invoice PDF
export const generateInvoicePDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
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

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée',
      });
    }

    // Charger les paramètres de l'entreprise depuis la base de données
    const companySettings = await getCompanySettings();
    const bankInfo = await getBankInfo();

    // Generate PDF avec les settings dynamiques
    PDFService.generateInvoicePDF(invoice, companySettings, bankInfo, res);
  } catch (error: any) {
    console.error('Error generating invoice PDF:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du PDF',
    });
  }
};

// Create invoice from cart (B2B)
export const createInvoiceFromCart = async (req: Request, res: Response) => {
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
    const invoiceItems = [];

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

      invoiceItems.push({
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

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        customerId,
        userId,
        status: 'DRAFT',
        subtotal,
        taxAmount,
        total,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        items: {
          create: invoiceItems,
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

    // Générer automatiquement l'écriture comptable (désactivé temporairement)
    // Les comptes comptables doivent être configurés d'abord
    // try {
    //   await generateSaleInvoiceEntry(invoice.id);
    //   console.log(`✅ Écriture comptable générée pour la facture ${invoice.number}`);
    // } catch (error) {
    //   console.error('⚠️  Erreur génération écriture comptable:', error);
    //   // Ne pas bloquer la création de la facture si l'écriture échoue
    // }

    return res.status(201).json({
      success: true,
      message: 'Facture créée depuis le panier avec succès',
      data: invoice,
    });
  } catch (error: any) {
    console.error('Error creating invoice from cart:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la facture',
      error: error.message,
    });
  }
};
