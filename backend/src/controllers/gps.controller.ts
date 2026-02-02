import { Request, Response } from 'express';
import { PrismaClient, TripStatus } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Configuration multer pour l'upload de photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/visits');
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'visit-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|heic/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

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

// Create customer visit
export const createVisit = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { customerId, visitDate, title, notes, latitude, longitude } = req.body;

    console.log('📋 Création de visite:', { userId, customerId, title });

    // Validate required fields
    if (!customerId || !title || !notes) {
      return res.status(400).json({
        success: false,
        message: 'Client, titre et description requis',
      });
    }

    // Trouver le trip actif de l'utilisateur
    const activeTrip = await prisma.trip.findFirst({
      where: {
        userId,
        status: TripStatus.IN_PROGRESS,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    if (!activeTrip) {
      return res.status(400).json({
        success: false,
        message: 'Aucun trajet actif trouvé. Veuillez démarrer un trajet avant d\'enregistrer une visite.',
      });
    }

    // Gérer la photo si elle est fournie
    let photoUrl: string | undefined;
    if (req.file) {
      // URL relative pour accéder à la photo
      photoUrl = `/uploads/visits/${req.file.filename}`;
      console.log('📸 Photo sauvegardée:', photoUrl);
    }

    // Créer la visite
    const visit = await prisma.visit.create({
      data: {
        tripId: activeTrip.id,
        customerId,
        title,
        summary: notes,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        checkInAt: visitDate ? new Date(visitDate) : new Date(),
        status: 'COMPLETED',
        photos: photoUrl ? [photoUrl] : [],
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Log activity
    const customerName = visit.customer?.companyName ||
                        `${visit.customer?.firstName} ${visit.customer?.lastName}` ||
                        'Client inconnu';

    await prisma.activity.create({
      data: {
        type: 'OTHER',
        description: `Visite client enregistrée: ${title} chez ${customerName}`,
        userId,
        customerId,
      },
    });

    console.log('✅ Visite créée:', visit.id);

    return res.status(201).json({
      success: true,
      message: 'Visite enregistrée avec succès',
      data: visit,
    });
  } catch (error: any) {
    console.error('❌ Error creating visit:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement de la visite',
      error: error.message,
    });
  }
};

// Get visits for a trip
export const getVisitsByTrip = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;

    const visits = await prisma.visit.findMany({
      where: { tripId },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { checkInAt: 'asc' },
    });

    return res.json({
      success: true,
      data: visits,
      count: visits.length,
    });
  } catch (error: any) {
    console.error('Error fetching visits:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des visites',
      error: error.message,
    });
  }
};

// Get all visits with filters
export const getAllVisits = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const { tripId, customerId, startDate, endDate } = req.query;

    const where: any = {};

    // Filter by trip
    if (tripId) {
      where.tripId = tripId as string;
    } else {
      // If no tripId specified, filter by user's trips
      if (userRole === 'COMMERCIAL') {
        where.trip = {
          userId,
        };
      }
    }

    // Filter by customer
    if (customerId) {
      where.customerId = customerId as string;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.checkInAt = {};
      if (startDate) {
        where.checkInAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.checkInAt.lte = new Date(endDate as string);
      }
    }

    const visits = await prisma.visit.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            phone: true,
          },
        },
        trip: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
          },
        },
      },
      orderBy: { checkInAt: 'desc' },
    });

    return res.json({
      success: true,
      data: visits,
      count: visits.length,
    });
  } catch (error: any) {
    console.error('Error fetching visits:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des visites',
      error: error.message,
    });
  }
};
