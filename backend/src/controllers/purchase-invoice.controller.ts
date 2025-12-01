import { getDefaultTaxRate } from '../config/tax.config';
import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { generatePurchaseInvoiceEntry } from '../services/auto-accounting.service';

// Get all purchase invoices
export const getPurchaseInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const { status, supplierId, startDate, endDate } = req.query;

    const where: any = {};

    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;

    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = new Date(startDate as string);
      if (endDate) where.invoiceDate.lte = new Date(endDate as string);
    }

    const purchaseInvoices = await prisma.purchaseInvoice.findMany({
      where,
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: purchaseInvoices,
    });
  } catch (error: any) {
    console.error('Error in getPurchaseInvoices:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des factures d\'achat',
      error: error.message,
    });
  }
};

// Get purchase invoice by ID
export const getPurchaseInvoiceById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const purchaseInvoice = await prisma.purchaseInvoice.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!purchaseInvoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture d\'achat non trouvée',
      });
    }

    res.json({
      success: true,
      data: purchaseInvoice,
    });
  } catch (error: any) {
    console.error('Error in getPurchaseInvoiceById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la facture',
      error: error.message,
    });
  }
};

// Create purchase invoice
export const createPurchaseInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { number, supplierId, items, invoiceDate, dueDate, notes, reference, discount } = req.body;

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    const processedItems = items.map((item: any) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = item.discount || 0;
      const itemTaxRate = item.taxRate || getDefaultTaxRate();
      const itemTax = (itemSubtotal - itemDiscount) * (itemTaxRate / 100);
      const itemTotal = itemSubtotal - itemDiscount + itemTax;

      subtotal += itemSubtotal;
      taxAmount += itemTax;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: itemTaxRate,
        discount: itemDiscount,
        total: itemTotal,
      };
    });

    const total = subtotal - (discount || 0) + taxAmount;

    const purchaseInvoice = await prisma.purchaseInvoice.create({
      data: {
        number,
        supplierId,
        date: invoiceDate ? new Date(invoiceDate) : new Date(),
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        reference,
        subtotal,
        tax: taxAmount,
        taxAmount,
        discount: discount || 0,
        total,
        items: {
          create: processedItems,
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Générer automatiquement l'écriture comptable
    try {
      await generatePurchaseInvoiceEntry(purchaseInvoice.id);
      console.log(`✅ Écriture comptable générée pour la facture d'achat ${purchaseInvoice.number}`);
    } catch (error) {
      console.error('⚠️  Erreur génération écriture comptable:', error);
      // Ne pas bloquer la création de la facture si l'écriture échoue
    }

    res.status(201).json({
      success: true,
      message: 'Facture d\'achat créée avec succès',
      data: purchaseInvoice,
    });
  } catch (error: any) {
    console.error('Error in createPurchaseInvoice:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la facture',
      error: error.message,
    });
  }
};

// Update purchase invoice
export const updatePurchaseInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { number, supplierId, items, invoiceDate, dueDate, notes, reference, discount } = req.body;

    // Check if invoice exists and is still draft
    const existing = await prisma.purchaseInvoice.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Facture d\'achat non trouvée',
      });
    }

    if (existing.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de modifier une facture validée ou payée',
      });
    }

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    const processedItems = items.map((item: any) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = item.discount || 0;
      const itemTaxRate = item.taxRate || getDefaultTaxRate();
      const itemTax = (itemSubtotal - itemDiscount) * (itemTaxRate / 100);
      const itemTotal = itemSubtotal - itemDiscount + itemTax;

      subtotal += itemSubtotal;
      taxAmount += itemTax;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: itemTaxRate,
        discount: itemDiscount,
        total: itemTotal,
      };
    });

    const total = subtotal - (discount || 0) + taxAmount;

    // Delete existing items and create new ones
    await prisma.purchaseInvoiceItem.deleteMany({
      where: { purchaseInvoiceId: id },
    });

    const purchaseInvoice = await prisma.purchaseInvoice.update({
      where: { id },
      data: {
        number,
        supplierId,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        reference,
        subtotal,
        taxAmount,
        discount: discount || 0,
        total,
        items: {
          create: processedItems,
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Facture d\'achat mise à jour avec succès',
      data: purchaseInvoice,
    });
  } catch (error: any) {
    console.error('Error in updatePurchaseInvoice:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la facture',
      error: error.message,
    });
  }
};

// Validate purchase invoice (increments stock)
export const validatePurchaseInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const purchaseInvoice = await prisma.purchaseInvoice.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!purchaseInvoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture d\'achat non trouvée',
      });
    }

    if (purchaseInvoice.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Cette facture est déjà validée',
      });
    }

    // Update stock for each item and create stock movements
    for (const item of purchaseInvoice.items) {
      const product = item.product;
      const newStock = product.stock + item.quantity;

      // Update product stock
      await prisma.product.update({
        where: { id: product.id },
        data: { stock: newStock },
      });

      // Create stock movement
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: 'PURCHASE',
          quantity: item.quantity,
          stockBefore: product.stock,
          stockAfter: newStock,
          purchaseInvoiceId: purchaseInvoice.id,
          referenceNumber: purchaseInvoice.number,
          userId: req.user?.userId,
          notes: `Achat - Facture ${purchaseInvoice.number}`,
        },
      });
    }

    // Update invoice status
    const updatedInvoice = await prisma.purchaseInvoice.update({
      where: { id },
      data: { status: 'VALIDATED' },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Facture validée et stock mis à jour avec succès',
      data: updatedInvoice,
    });
  } catch (error: any) {
    console.error('Error in validatePurchaseInvoice:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation de la facture',
      error: error.message,
    });
  }
};

// Mark purchase invoice as paid
export const markAsPaid = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const purchaseInvoice = await prisma.purchaseInvoice.findUnique({
      where: { id },
    });

    if (!purchaseInvoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture d\'achat non trouvée',
      });
    }

    if (purchaseInvoice.status === 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Vous devez d\'abord valider la facture',
      });
    }

    if (purchaseInvoice.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Cette facture est déjà payée',
      });
    }

    const updatedInvoice = await prisma.purchaseInvoice.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Facture marquée comme payée',
      data: updatedInvoice,
    });
  } catch (error: any) {
    console.error('Error in markAsPaid:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du paiement de la facture',
      error: error.message,
    });
  }
};

// Delete purchase invoice
export const deletePurchaseInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const purchaseInvoice = await prisma.purchaseInvoice.findUnique({
      where: { id },
    });

    if (!purchaseInvoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture d\'achat non trouvée',
      });
    }

    if (purchaseInvoice.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer une facture validée ou payée',
      });
    }

    await prisma.purchaseInvoice.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Facture d\'achat supprimée avec succès',
    });
  } catch (error: any) {
    console.error('Error in deletePurchaseInvoice:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la facture',
      error: error.message,
    });
  }
};

// Get stock movements
export const getStockMovements = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, type, startDate, endDate } = req.query;

    const where: any = {};

    if (productId) where.productId = productId;
    if (type) where.type = type;

    if (startDate || endDate) {
      where.movementDate = {};
      if (startDate) where.movementDate.gte = new Date(startDate as string);
      if (endDate) where.movementDate.lte = new Date(endDate as string);
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: true,
      },
      orderBy: { movementDate: 'desc' },
    });

    res.json({
      success: true,
      data: movements,
    });
  } catch (error: any) {
    console.error('Error in getStockMovements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des mouvements de stock',
      error: error.message,
    });
  }
};
