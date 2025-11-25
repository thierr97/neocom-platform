import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create GPS tracking point
export const createGpsTracking = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const {
      actionType,
      latitude,
      longitude,
      accuracy,
      address,
      customerId,
      orderId,
      quoteId,
      notes,
    } = req.body;

    // Validate required fields
    if (!actionType || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Type d\'action, latitude et longitude requis',
      });
    }

    const gpsTracking = await prisma.gpsTracking.create({
      data: {
        userId,
        actionType,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy ? parseFloat(accuracy) : undefined,
        address,
        customerId,
        orderId,
        quoteId,
        notes,
      },
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
        type: 'OTHER',
        description: `Point GPS enregistré: ${actionType} à ${address || `${latitude}, ${longitude}`}`,
        userId,
        customerId,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Point GPS enregistré avec succès',
      data: gpsTracking,
    });
  } catch (error: any) {
    console.error('Error creating GPS tracking:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement du point GPS',
      error: error.message,
    });
  }
};

// Get all GPS tracking points
export const getAllGpsTracking = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const { actionType, startDate, endDate, userId: filterUserId } = req.query;

    const where: any = {};

    // Commercial users only see their own tracking
    if (userRole === 'COMMERCIAL') {
      where.userId = userId;
    } else if (filterUserId) {
      // Admin can filter by user
      where.userId = filterUserId;
    }

    // Filter by action type
    if (actionType) {
      where.actionType = actionType;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate as string);
      }
    }

    const trackingPoints = await prisma.gpsTracking.findMany({
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
      },
      orderBy: { timestamp: 'desc' },
    });

    return res.json({
      success: true,
      data: trackingPoints,
      count: trackingPoints.length,
    });
  } catch (error: any) {
    console.error('Error fetching GPS tracking:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des points GPS',
      error: error.message,
    });
  }
};

// Get GPS tracking by ID
export const getGpsTrackingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const tracking = await prisma.gpsTracking.findUnique({
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
      },
    });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'Point GPS non trouvé',
      });
    }

    return res.json({
      success: true,
      data: tracking,
    });
  } catch (error: any) {
    console.error('Error fetching GPS tracking:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du point GPS',
      error: error.message,
    });
  }
};

// Get GPS tracking for a specific customer
export const getCustomerGpsTracking = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    const trackingPoints = await prisma.gpsTracking.findMany({
      where: { customerId },
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
      orderBy: { timestamp: 'desc' },
    });

    return res.json({
      success: true,
      data: trackingPoints,
      count: trackingPoints.length,
    });
  } catch (error: any) {
    console.error('Error fetching customer GPS tracking:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des points GPS du client',
      error: error.message,
    });
  }
};

// Get GPS tracking for current user (today)
export const getTodayTracking = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const trackingPoints = await prisma.gpsTracking.findMany({
      where: {
        userId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    return res.json({
      success: true,
      data: trackingPoints,
      count: trackingPoints.length,
    });
  } catch (error: any) {
    console.error('Error fetching today\'s tracking:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des points GPS du jour',
      error: error.message,
    });
  }
};

// Get GPS tracking statistics
export const getGpsStatistics = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const { startDate, endDate, userId: filterUserId } = req.query;

    const where: any = {};

    // Commercial users only see their own stats
    if (userRole === 'COMMERCIAL') {
      where.userId = userId;
    } else if (filterUserId) {
      where.userId = filterUserId;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate as string);
      }
    }

    // Count by action type
    const trackingPoints = await prisma.gpsTracking.findMany({ where });

    const stats = {
      total: trackingPoints.length,
      byActionType: {} as Record<string, number>,
      uniqueCustomers: new Set(trackingPoints.filter(t => t.customerId).map(t => t.customerId)).size,
      uniqueOrders: new Set(trackingPoints.filter(t => t.orderId).map(t => t.orderId)).size,
      uniqueQuotes: new Set(trackingPoints.filter(t => t.quoteId).map(t => t.quoteId)).size,
    };

    trackingPoints.forEach(point => {
      stats.byActionType[point.actionType] = (stats.byActionType[point.actionType] || 0) + 1;
    });

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error fetching GPS statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques GPS',
      error: error.message,
    });
  }
};

// Delete GPS tracking
export const deleteGpsTracking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = (req as any).user.role;

    // Only admins can delete GPS tracking
    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Action non autorisée',
      });
    }

    await prisma.gpsTracking.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Point GPS supprimé avec succès',
    });
  } catch (error: any) {
    console.error('Error deleting GPS tracking:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du point GPS',
      error: error.message,
    });
  }
};

// Batch create GPS tracking (for mobile sync)
export const batchCreateGpsTracking = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { trackingPoints } = req.body;

    if (!Array.isArray(trackingPoints) || trackingPoints.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Liste de points GPS requise',
      });
    }

    const createdPoints = [];
    const errors = [];

    for (let i = 0; i < trackingPoints.length; i++) {
      const point = trackingPoints[i];

      try {
        const gpsTracking = await prisma.gpsTracking.create({
          data: {
            userId,
            actionType: point.actionType,
            latitude: parseFloat(point.latitude),
            longitude: parseFloat(point.longitude),
            accuracy: point.accuracy ? parseFloat(point.accuracy) : undefined,
            address: point.address,
            customerId: point.customerId,
            orderId: point.orderId,
            quoteId: point.quoteId,
            notes: point.notes,
            timestamp: point.timestamp ? new Date(point.timestamp) : new Date(),
          },
        });

        createdPoints.push(gpsTracking);
      } catch (error: any) {
        errors.push({
          index: i,
          error: error.message,
          data: point,
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: `${createdPoints.length} points GPS enregistrés`,
      data: createdPoints,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error batch creating GPS tracking:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement en lot',
      error: error.message,
    });
  }
};
