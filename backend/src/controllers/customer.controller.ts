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

    // Si commercial, assigner à lui-même
    if (req.user!.role === 'COMMERCIAL') {
      data.userId = req.user!.userId;
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

    res.status(201).json({
      success: true,
      message: 'Client créé avec succès',
      customer,
    });
  } catch (error: any) {
    console.error('Error in createCustomer:', error);
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
