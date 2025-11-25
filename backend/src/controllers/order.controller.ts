import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { generateOrderNumber } from '../utils/generateNumber';
import { PDFService } from '../services/pdf.service';

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { status, customerId } = req.query;

    const where: any = {};

    // Commercial voir seulement ses commandes
    if (req.user!.role === 'COMMERCIAL') {
      where.userId = req.user!.userId;
    }

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
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
        _count: {
          select: {
            items: true,
            payments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      orders,
    });
  } catch (error: any) {
    console.error('Error in getOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes',
      error: error.message,
    });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
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
        payments: true,
        invoice: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée',
      });
    }

    // Check access
    if (req.user!.role === 'COMMERCIAL' && order.userId !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error('Error in getOrderById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la commande',
      error: error.message,
    });
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, items, shippingAddress, shippingCity, shippingPostalCode, shippingCountry, notes, gpsLatitude, gpsLongitude, gpsAddress } = req.body;

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    const itemsData = await Promise.all(
      items.map(async (item: any) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Produit ${item.productId} non trouvé`);
        }

        const itemSubtotal = product.price * item.quantity;
        const itemTax = itemSubtotal * (item.taxRate || 20) / 100;
        const itemTotal = itemSubtotal + itemTax;

        subtotal += itemSubtotal;
        taxAmount += itemTax;

        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price,
          taxRate: item.taxRate || 20,
          discount: item.discount || 0,
          total: itemTotal,
        };
      })
    );

    const total = subtotal + taxAmount;

    // Generate order number
    const orderNumber = await generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        number: orderNumber,
        customerId,
        userId: req.user!.userId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        subtotal,
        taxAmount,
        total,
        shippingAddress,
        shippingCity,
        shippingPostalCode,
        shippingCountry,
        notes,
        gpsLatitude,
        gpsLongitude,
        gpsAddress,
        items: {
          create: itemsData,
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

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'ORDER_CREATED',
        description: `Nouvelle commande créée: ${orderNumber}`,
        userId: req.user!.userId,
        customerId,
      },
    });

    // Update product stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      order,
    });
  } catch (error: any) {
    console.error('Error in createOrder:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la commande',
      error: error.message,
    });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée',
      });
    }

    const updateData: any = { status };

    if (status === 'CONFIRMED') {
      updateData.confirmedAt = new Date();
    } else if (status === 'SHIPPED') {
      updateData.shippedAt = new Date();
    } else if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    const updatedOrder = await prisma.order.update({
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

    // Log activity
    await prisma.activity.create({
      data: {
        type: status === 'CONFIRMED' ? 'ORDER_CONFIRMED' : status === 'SHIPPED' ? 'ORDER_SHIPPED' : 'ORDER_DELIVERED',
        description: `Commande ${updatedOrder.number} - Statut: ${status}`,
        userId: req.user!.userId,
        customerId: updatedOrder.customerId,
      },
    });

    res.json({
      success: true,
      message: 'Statut mis à jour',
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Error in updateOrderStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message,
    });
  }
};

export const generateDeliveryNotePDF = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
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

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée',
      });
    }

    // Check access
    if (req.user!.role === 'COMMERCIAL' && order.userId !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    // Generate PDF
    PDFService.generateDeliveryNotePDF(order, res);
  } catch (error: any) {
    console.error('Error in generateDeliveryNotePDF:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du bon de livraison',
      error: error.message,
    });
  }
};
