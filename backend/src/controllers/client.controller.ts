import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Client login with email
export const clientLogin = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis',
      });
    }

    // Find customer by email
    const customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé',
      });
    }

    // Generate a simple token (in production, use proper authentication)
    const token = jwt.sign(
      { customerId: customer.id, email: customer.email, type: 'customer' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        companyName: customer.companyName,
      },
    });
  } catch (error: any) {
    console.error('Error in client login:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message,
    });
  }
};

// Get client orders
export const getClientOrders = async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customer.customerId;

    const orders = await prisma.order.findMany({
      where: { customerId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    console.error('Error fetching client orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes',
      error: error.message,
    });
  }
};

// Get client order by ID
export const getClientOrder = async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customer.customerId;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id,
        customerId,
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

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée',
      });
    }

    return res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    console.error('Error fetching client order:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la commande',
      error: error.message,
    });
  }
};

// Get client invoices
export const getClientInvoices = async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customer.customerId;

    const invoices = await prisma.invoice.findMany({
      where: { customerId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        order: {
          select: {
            number: true,
          },
        },
      },
      orderBy: { issueDate: 'desc' },
    });

    return res.json({
      success: true,
      data: invoices,
    });
  } catch (error: any) {
    console.error('Error fetching client invoices:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des factures',
      error: error.message,
    });
  }
};

// Get client invoice by ID
export const getClientInvoice = async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customer.customerId;
    const { id } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        customerId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        order: {
          select: {
            number: true,
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
    console.error('Error fetching client invoice:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la facture',
      error: error.message,
    });
  }
};

// Get client quotes
export const getClientQuotes = async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customer.customerId;

    const quotes = await prisma.quote.findMany({
      where: { customerId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: quotes,
    });
  } catch (error: any) {
    console.error('Error fetching client quotes:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des devis',
      error: error.message,
    });
  }
};

// Get client profile
export const getClientProfile = async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customer.customerId;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé',
      });
    }

    return res.json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    console.error('Error fetching client profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message,
    });
  }
};

// Update client profile
export const updateClientProfile = async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customer.customerId;
    const {
      firstName,
      lastName,
      companyName,
      phone,
      mobile,
      address,
      addressLine2,
      city,
      postalCode,
      country,
    } = req.body;

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        firstName,
        lastName,
        companyName,
        phone,
        mobile,
        address,
        addressLine2,
        city,
        postalCode,
        country,
      },
    });

    return res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: customer,
    });
  } catch (error: any) {
    console.error('Error updating client profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
      error: error.message,
    });
  }
};

// Get client statistics
export const getClientStatistics = async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customer.customerId;

    const [orders, invoices, quotes] = await Promise.all([
      prisma.order.findMany({ where: { customerId } }),
      prisma.invoice.findMany({ where: { customerId } }),
      prisma.quote.findMany({ where: { customerId } }),
    ]);

    const totalSpent = orders
      .filter(o => o.paymentStatus === 'PAID')
      .reduce((sum, order) => sum + order.total, 0);

    const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
    const completedOrders = orders.filter(o => o.status === 'DELIVERED').length;

    const stats = {
      totalOrders: orders.length,
      pendingOrders,
      completedOrders,
      totalSpent,
      totalInvoices: invoices.length,
      unpaidInvoices: invoices.filter(i => i.status !== 'PAID').length,
      totalQuotes: quotes.length,
      pendingQuotes: quotes.filter(q => q.status === 'SENT').length,
    };

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error fetching client statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message,
    });
  }
};
