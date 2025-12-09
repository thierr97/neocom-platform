import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtenir tous les avoirs
export const getCreditNotes = async (req: Request, res: Response) => {
  try {
    const creditNotes = await prisma.creditNote.findMany({
      include: {
        invoice: {
          include: {
            customer: true,
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
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ success: true, data: creditNotes });
  } catch (error: any) {
    console.error('Error fetching credit notes:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtenir un avoir par ID
export const getCreditNoteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const creditNote = await prisma.creditNote.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            customer: true,
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
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!creditNote) {
      return res.status(404).json({ success: false, message: 'Avoir introuvable' });
    }

    res.json({ success: true, data: creditNote });
  } catch (error: any) {
    console.error('Error fetching credit note:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Créer un avoir
export const createCreditNote = async (req: Request, res: Response) => {
  try {
    const { invoiceId, type, reason, items } = req.body;
    const userId = (req as any).user.id;

    // Vérifier que la facture existe
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Facture introuvable' });
    }

    // Générer le numéro d'avoir
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await prisma.creditNote.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-${month}-01`),
          lt: new Date(year, Number(month), 1),
        },
      },
    });
    const number = `AV${year.toString().slice(-2)}${month}-${String(count + 1).padStart(4, '0')}`;

    // Calculer les totaux
    let subtotal = 0;
    let taxAmount = 0;

    if (type === 'TOTAL') {
      // Avoir total : reprendre tous les montants de la facture
      subtotal = invoice.subtotal;
      taxAmount = invoice.taxAmount;
    } else {
      // Avoir partiel : calculer selon les items sélectionnés
      for (const item of items) {
        const total = item.quantity * item.unitPrice;
        subtotal += total;
        taxAmount += total * (item.taxRate / 100);
      }
    }

    const total = subtotal + taxAmount;

    // Créer l'avoir
    const creditNote = await prisma.creditNote.create({
      data: {
        number,
        type,
        reason,
        invoiceId,
        userId,
        subtotal,
        taxAmount,
        total,
        items: type === 'PARTIAL' ? {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate || 8.5,
            discount: item.discount || 0,
            total: item.quantity * item.unitPrice,
          })),
        } : undefined,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        invoice: {
          include: {
            customer: true,
          },
        },
      },
    });

    res.status(201).json({ success: true, data: creditNote });
  } catch (error: any) {
    console.error('Error creating credit note:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Supprimer un avoir
export const deleteCreditNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Vérifier que l'avoir existe
    const creditNote = await prisma.creditNote.findUnique({
      where: { id },
    });

    if (!creditNote) {
      return res.status(404).json({ success: false, message: 'Avoir introuvable' });
    }

    // Supprimer l'avoir (les items seront supprimés en cascade)
    await prisma.creditNote.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Avoir supprimé avec succès' });
  } catch (error: any) {
    console.error('Error deleting credit note:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Télécharger le PDF d'un avoir
export const downloadCreditNotePDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const creditNote = await prisma.creditNote.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            customer: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!creditNote) {
      return res.status(404).json({ success: false, message: 'Avoir introuvable' });
    }

    // TODO: Générer le PDF avec PDFService
    // const { PDFService } = require('../services/pdf.service');
    // PDFService.generateCreditNotePDF(creditNote, res);

    res.json({ success: true, message: 'PDF generation à implémenter' });
  } catch (error: any) {
    console.error('Error downloading credit note PDF:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
