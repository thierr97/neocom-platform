import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Ship order from France (inbound logistics)
export const shipInbound = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // order ID
    const { userId, role } = req.user!;
    const { carrier, trackingNumber, notes } = req.body;

    // Only ADMIN, SUB_ADMIN, and STAFF_PREPA can ship inbound
    if (role !== 'ADMIN' && role !== 'SUB_ADMIN' && role !== 'STAFF_PREPA') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    if (!carrier || !trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Transporteur et numéro de suivi requis'
      });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { customer: true }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Check if order has INBOUND_THEN_LAST_MILE flow
    if (order.fulfillmentFlow !== 'INBOUND_THEN_LAST_MILE') {
      return res.status(400).json({
        success: false,
        message: 'Cette commande n\'utilise pas le flux logistique avec réception'
      });
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        inboundCarrier: carrier,
        inboundTrackingNumber: trackingNumber,
        inboundStatus: 'SHIPPED',
        inboundShippedAt: new Date(),
        inboundNotes: notes,
        status: 'SHIPPED' // Update main order status
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'ORDER_SHIPPED',
        description: `Commande ${order.number} expédiée depuis France via ${carrier} (${trackingNumber})`,
        userId
      }
    });

    return res.json({
      success: true,
      message: 'Commande expédiée depuis France',
      order: updatedOrder
    });
  } catch (error: any) {
    console.error('Error shipping inbound:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'expédition',
      error: error.message
    });
  }
};

// Receive inbound shipment (mark as received in Guadeloupe)
export const receiveInbound = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // order ID
    const { userId, role } = req.user!;
    const { proofUrl, notes } = req.body;

    // Only ADMIN, SUB_ADMIN, and STAFF_PREPA can receive
    if (role !== 'ADMIN' && role !== 'SUB_ADMIN' && role !== 'STAFF_PREPA') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { customer: true }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Check if order has been shipped
    if (order.inboundStatus !== 'SHIPPED' && order.inboundStatus !== 'IN_TRANSIT') {
      return res.status(400).json({
        success: false,
        message: 'Cette commande n\'a pas encore été expédiée'
      });
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        inboundStatus: 'RECEIVED',
        inboundReceivedAt: new Date(),
        inboundProofUrl: proofUrl,
        inboundNotes: notes ? `${order.inboundNotes || ''}\n${notes}` : order.inboundNotes,
        status: 'PROCESSING' // Order is now being processed for last mile
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Auto-create reception task
    await prisma.task.create({
      data: {
        orderId: id,
        type: 'RECEPTION_INBOUND',
        status: 'DONE',
        title: `Réception commande ${order.number}`,
        description: 'Marchandise réceptionnée depuis France',
        notes,
        assignedToId: userId,
        assignedById: userId,
        assignedAt: new Date(),
        startedAt: new Date(),
        completedAt: new Date()
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'ORDER_DELIVERED',
        description: `Commande ${order.number} réceptionnée en Guadeloupe`,
        userId
      }
    });

    return res.json({
      success: true,
      message: 'Commande réceptionnée avec succès',
      order: updatedOrder
    });
  } catch (error: any) {
    console.error('Error receiving inbound:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la réception',
      error: error.message
    });
  }
};

// Transform to last-mile delivery
export const transformToLastMile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // order ID
    const { userId, role } = req.user!;
    const { type, courierId, carrier, trackingNumber, notes } = req.body;

    // Only ADMIN and SUB_ADMIN can transform
    if (role !== 'ADMIN' && role !== 'SUB_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les administrateurs peuvent transformer en livraison locale'
      });
    }

    if (!type || (type !== 'INTERNAL_DRIVER' && type !== 'EXTERNAL_CARRIER')) {
      return res.status(400).json({
        success: false,
        message: 'Type de livraison requis (INTERNAL_DRIVER ou EXTERNAL_CARRIER)'
      });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { customer: true }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Check if order has been received
    if (order.inboundStatus !== 'RECEIVED') {
      return res.status(400).json({
        success: false,
        message: 'La commande doit d\'abord être réceptionnée'
      });
    }

    // Prevent duplicate transformation
    if (order.lastMileType) {
      return res.status(400).json({
        success: false,
        message: 'Cette commande a déjà été transformée en livraison locale'
      });
    }

    // Validation based on type
    if (type === 'INTERNAL_DRIVER') {
      if (!courierId) {
        return res.status(400).json({
          success: false,
          message: 'ID du livreur requis pour livraison interne'
        });
      }

      // Verify courier exists and has DELIVERY role
      const courier = await prisma.user.findUnique({
        where: { id: courierId }
      });

      if (!courier || courier.role !== 'DELIVERY') {
        return res.status(400).json({
          success: false,
          message: 'Livreur invalide'
        });
      }

      // Create delivery in existing delivery system
      const delivery = await prisma.delivery.create({
        data: {
          orderId: id,
          customerId: order.customerId,
          salesUserId: order.userId,
          courierId,
          status: 'CREATED',
          pickupAddress: 'Entrepôt Guadeloupe', // TODO: Get from settings
          deliveryAddress: order.shippingAddress || '',
          deliveryContactName: `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim(),
          deliveryContactPhone: order.customer.phone || '',
          packageDescription: `Commande ${order.number}`,
          specialInstructions: notes
        }
      });

      // Update order
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          lastMileType: type,
          lastMileNotes: notes,
          status: 'PROCESSING'
        }
      });

      // Create task for delivery
      await prisma.task.create({
        data: {
          orderId: id,
          type: 'DELIVERY_LAST_MILE',
          status: 'TODO',
          title: `Livraison locale commande ${order.number}`,
          description: 'Livraison client final en Guadeloupe',
          assignedToId: courierId,
          assignedById: userId,
          assignedAt: new Date(),
          locationAddress: order.shippingAddress,
          locationLatitude: order.gpsLatitude,
          locationLongitude: order.gpsLongitude
        }
      });

      // Log activity
      await prisma.activity.create({
        data: {
          type: 'OTHER',
          description: `Commande ${order.number} assignée au livreur ${courier.firstName} ${courier.lastName}`,
          userId
        }
      });

      return res.json({
        success: true,
        message: 'Commande assignée au livreur interne',
        order: updatedOrder,
        delivery
      });

    } else if (type === 'EXTERNAL_CARRIER') {
      if (!carrier || !trackingNumber) {
        return res.status(400).json({
          success: false,
          message: 'Transporteur et numéro de suivi requis pour transporteur externe'
        });
      }

      // Update order
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          lastMileType: type,
          lastMileCarrier: carrier,
          lastMileTrackingNumber: trackingNumber,
          lastMileNotes: notes,
          status: 'SHIPPED'
        }
      });

      // Create task for shipping
      await prisma.task.create({
        data: {
          orderId: id,
          type: 'SHIP_LAST_MILE',
          status: 'DONE',
          title: `Expédition locale commande ${order.number}`,
          description: `Expédié via ${carrier} - ${trackingNumber}`,
          assignedById: userId,
          assignedAt: new Date(),
          completedAt: new Date()
        }
      });

      // Log activity
      await prisma.activity.create({
        data: {
          type: 'ORDER_SHIPPED',
          description: `Commande ${order.number} expédiée via transporteur local ${carrier}`,
          userId
        }
      });

      return res.json({
        success: true,
        message: 'Commande expédiée via transporteur externe',
        order: updatedOrder
      });
    }

  } catch (error: any) {
    console.error('Error transforming to last mile:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la transformation',
      error: error.message
    });
  }
};

// Get order logistics status
export const getOrderLogistics = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // order ID

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            assignedTo: {
              select: {
                firstName: true,
                lastName: true,
                role: true
              }
            },
            proofs: true,
            reviews: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        deliveries: {
          include: {
            courier: {
              select: {
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Build logistics timeline
    const timeline = [];

    // Inbound logistics
    if (order.fulfillmentFlow === 'INBOUND_THEN_LAST_MILE') {
      timeline.push({
        phase: 'INBOUND',
        status: order.inboundStatus,
        carrier: order.inboundCarrier,
        trackingNumber: order.inboundTrackingNumber,
        shippedAt: order.inboundShippedAt,
        receivedAt: order.inboundReceivedAt,
        proofUrl: order.inboundProofUrl,
        notes: order.inboundNotes
      });
    }

    // Last mile logistics
    if (order.lastMileType) {
      timeline.push({
        phase: 'LAST_MILE',
        type: order.lastMileType,
        carrier: order.lastMileCarrier,
        trackingNumber: order.lastMileTrackingNumber,
        notes: order.lastMileNotes,
        delivery: order.deliveries[0] || null
      });
    }

    return res.json({
      success: true,
      logistics: {
        fulfillmentFlow: order.fulfillmentFlow,
        timeline,
        tasks: order.tasks,
        canTransformToLastMile:
          order.fulfillmentFlow === 'INBOUND_THEN_LAST_MILE' &&
          order.inboundStatus === 'RECEIVED' &&
          !order.lastMileType
      }
    });
  } catch (error: any) {
    console.error('Error fetching order logistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations logistiques',
      error: error.message
    });
  }
};
