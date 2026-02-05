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
    // Get userId and role from JWT token (set by auth middleware)
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    // Admin voir tous, commercial voir seulement les siennes
    const where: any = {};
    if (userRole === 'COMMERCIAL') {
      where.userId = userId;
    }

    const invoices = await prisma.invoice.findMany({
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
        payments: {
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
          orderBy: {
            paidAt: 'desc',
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

    // Check access - commercial peut voir seulement ses factures
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?.userId;

    if (userRole === 'COMMERCIAL' && invoice.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
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

// Add payment to invoice
export const addPaymentToInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const { amount, method, cardLastFourDigits, checkNumber, bankName, reference, notes, paidAt } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    // Validate payment amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Montant de paiement invalide',
      });
    }

    // Validate payment method
    const validMethods = ['CREDIT_CARD', 'CASH', 'CHECK', 'BANK_TRANSFER', 'STRIPE', 'PAYPAL', 'PAYLIB'];
    if (!method || !validMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Méthode de paiement invalide',
      });
    }

    // Get invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        payments: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée',
      });
    }

    // Calculate total paid amount
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + amount;

    if (totalPaid > invoice.total) {
      return res.status(400).json({
        success: false,
        message: 'Le montant total des paiements dépasse le montant de la facture',
      });
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        invoiceId: id,
        amount,
        method,
        status: 'COMPLETED',
        cardLastFourDigits,
        checkNumber,
        bankName,
        reference,
        notes,
        paidBy: userId,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
      },
    });

    // Update invoice paidAmount and status
    const newPaidAmount = totalPaid;
    const newStatus = newPaidAmount >= invoice.total ? 'PAID' : invoice.status;

    await prisma.invoice.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
        paidAt: newStatus === 'PAID' ? new Date() : null,
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'PAYMENT_RECEIVED',
        description: `Paiement de ${amount}€ enregistré pour la facture ${invoice.number} (${method})`,
        userId,
        customerId: invoice.customerId,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Paiement enregistré avec succès',
      data: payment,
    });
  } catch (error: any) {
    console.error('Error adding payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement du paiement',
      error: error.message,
    });
  }
};

// Get invoice payments
export const getInvoicePayments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const payments = await prisma.payment.findMany({
      where: { invoiceId: id },
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
      orderBy: {
        paidAt: 'desc',
      },
    });

    return res.json({
      success: true,
      data: payments,
    });
  } catch (error: any) {
    console.error('Error getting payments:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paiements',
    });
  }
};
