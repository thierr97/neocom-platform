import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import {
  StartTripRequest,
  EndTripRequest,
  UpdateTripRequest,
  CreateVisitRequest,
  CheckInVisitRequest,
  CheckOutVisitRequest,
  UpdateVisitRequest,
  AddCheckpointRequest,
  ValidateTripRequest,
  ReimburseTripRequest,
  TripFilters,
  VisitFilters,
} from '../types/trip.types';
import { TripStatus, VisitStatus } from '@prisma/client';

// ========================================
// TRIP MANAGEMENT
// ========================================

/**
 * Démarrer un nouveau trajet (check-in)
 */
export const startTrip = async (req: AuthRequest, res: Response) => {
  try {
    const data: StartTripRequest = req.body;
    const userId = req.user!.userId;

    // Vérifier qu'il n'y a pas déjà un trajet en cours
    const activeTrip = await prisma.trip.findFirst({
      where: {
        userId,
        status: 'IN_PROGRESS',
      },
    });

    if (activeTrip) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà un trajet en cours. Terminez-le avant d\'en commencer un nouveau.',
        activeTrip,
      });
    }

    const trip = await prisma.trip.create({
      data: {
        userId,
        purpose: data.purpose,
        objective: data.objective,
        vehicleType: data.vehicleType,
        vehicleRegistration: data.vehicleRegistration,
        estimatedKm: data.estimatedKm,
        startLatitude: data.latitude,
        startLongitude: data.longitude,
        startAddress: data.address,
        status: 'IN_PROGRESS',
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

    res.status(201).json({
      success: true,
      message: 'Trajet démarré avec succès',
      trip,
    });
  } catch (error: any) {
    console.error('Error in startTrip:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du démarrage du trajet',
      error: error.message,
    });
  }
};

/**
 * Terminer un trajet (check-out)
 */
export const endTrip = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data: EndTripRequest = req.body;
    const userId = req.user!.userId;

    const trip = await prisma.trip.findUnique({ where: { id } });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trajet non trouvé',
      });
    }

    if (trip.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    if (trip.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: 'Ce trajet est déjà terminé',
      });
    }

    // Calculer la durée
    const startTime = new Date(trip.startTime);
    const endTime = new Date();
    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);

    // Calculer la distance (si on a des checkpoints, on peut calculer la distance totale)
    // Pour l'instant, on utilise la distance estimée ou 0
    const distanceKm = trip.estimatedKm || 0;
    const mileageRate = trip.mileageRate || 0.50;
    const totalCost = distanceKm * mileageRate;

    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: {
        endLatitude: data.latitude,
        endLongitude: data.longitude,
        endAddress: data.address,
        endTime,
        status: 'COMPLETED',
        durationMinutes,
        distanceKm,
        totalCost,
        notes: data.notes,
        photos: data.photos || [],
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
        checkpoints: {
          orderBy: { timestamp: 'asc' },
        },
        visits: {
          include: {
            customer: {
              select: {
                id: true,
                companyName: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Trajet terminé avec succès',
      trip: updatedTrip,
    });
  } catch (error: any) {
    console.error('Error in endTrip:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la fin du trajet',
      error: error.message,
    });
  }
};

/**
 * Récupérer tous les trajets (avec filtres)
 */
export const getTrips = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const {
      status,
      purpose,
      startDate,
      endDate,
      isValidated,
      isReimbursed,
    } = req.query as any;

    const where: any = {};

    // Admin voit tous les trajets, commercial voit seulement les siens
    if (role === 'COMMERCIAL') {
      where.userId = userId;
    } else if (req.query.userId) {
      where.userId = req.query.userId as string;
    }

    if (status) where.status = status as TripStatus;
    if (purpose) where.purpose = purpose;
    if (isValidated !== undefined) where.isValidated = isValidated === 'true';
    if (isReimbursed !== undefined) where.isReimbursed = isReimbursed === 'true';

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate as string);
      if (endDate) where.startTime.lte = new Date(endDate as string);
    }

    const trips = await prisma.trip.findMany({
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
            checkpoints: true,
            visits: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    res.json({
      success: true,
      trips,
    });
  } catch (error: any) {
    console.error('Error in getTrips:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des trajets',
      error: error.message,
    });
  }
};

/**
 * Récupérer un trajet par ID (avec tous les détails)
 */
export const getTripById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const role = req.user!.role;

    const trip = await prisma.trip.findUnique({
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
        checkpoints: {
          orderBy: { timestamp: 'asc' },
        },
        visits: {
          include: {
            customer: {
              select: {
                id: true,
                companyName: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                address: true,
                city: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trajet non trouvé',
      });
    }

    // Check access
    if (role === 'COMMERCIAL' && trip.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    res.json({
      success: true,
      trip,
    });
  } catch (error: any) {
    console.error('Error in getTripById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du trajet',
      error: error.message,
    });
  }
};

/**
 * Mettre à jour un trajet
 */
export const updateTrip = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data: UpdateTripRequest = req.body;
    const userId = req.user!.userId;

    const trip = await prisma.trip.findUnique({ where: { id } });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trajet non trouvé',
      });
    }

    if (trip.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    const updatedTrip = await prisma.trip.update({
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

    res.json({
      success: true,
      message: 'Trajet mis à jour',
      trip: updatedTrip,
    });
  } catch (error: any) {
    console.error('Error in updateTrip:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du trajet',
      error: error.message,
    });
  }
};

/**
 * Récupérer le trajet actif de l'utilisateur
 */
export const getActiveTrip = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const trip = await prisma.trip.findFirst({
      where: {
        userId,
        status: 'IN_PROGRESS',
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
        checkpoints: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
        visits: {
          include: {
            customer: {
              select: {
                id: true,
                companyName: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!trip) {
      return res.json({
        success: true,
        trip: null,
      });
    }

    res.json({
      success: true,
      trip,
    });
  } catch (error: any) {
    console.error('Error in getActiveTrip:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du trajet actif',
      error: error.message,
    });
  }
};

// ========================================
// CHECKPOINTS (Points GPS)
// ========================================

/**
 * Ajouter un checkpoint GPS
 */
export const addCheckpoint = async (req: AuthRequest, res: Response) => {
  try {
    const data: AddCheckpointRequest = req.body;
    const userId = req.user!.userId;

    // Vérifier que le trajet appartient à l'utilisateur
    const trip = await prisma.trip.findUnique({
      where: { id: data.tripId },
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trajet non trouvé',
      });
    }

    if (trip.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    if (trip.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: 'Le trajet doit être en cours',
      });
    }

    const checkpoint = await prisma.tripCheckpoint.create({
      data: {
        tripId: data.tripId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        address: data.address,
        speed: data.speed,
        heading: data.heading,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Point GPS ajouté',
      checkpoint,
    });
  } catch (error: any) {
    console.error('Error in addCheckpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du point GPS',
      error: error.message,
    });
  }
};

// ========================================
// VISITS (Visites clients)
// ========================================

/**
 * Créer une nouvelle visite
 */
export const createVisit = async (req: AuthRequest, res: Response) => {
  try {
    const data: CreateVisitRequest = req.body;
    const userId = req.user!.userId;

    // Vérifier que le trajet appartient à l'utilisateur
    const trip = await prisma.trip.findUnique({
      where: { id: data.tripId },
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trajet non trouvé',
      });
    }

    if (trip.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    const visit = await prisma.visit.create({
      data: {
        tripId: data.tripId,
        customerId: data.customerId,
        purpose: data.purpose,
        scheduledAt: data.scheduledAt,
        objective: data.objective,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        status: 'PLANNED',
      },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Visite créée avec succès',
      visit,
    });
  } catch (error: any) {
    console.error('Error in createVisit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la visite',
      error: error.message,
    });
  }
};

/**
 * Check-in visite (arrivée chez le client)
 */
export const checkInVisit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data: CheckInVisitRequest = req.body;
    const userId = req.user!.userId;

    const visit = await prisma.visit.findUnique({
      where: { id },
      include: { trip: true },
    });

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visite non trouvée',
      });
    }

    if (visit.trip.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    const updatedVisit = await prisma.visit.update({
      where: { id },
      data: {
        checkInAt: new Date(),
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        status: 'IN_PROGRESS',
      },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Check-in effectué',
      visit: updatedVisit,
    });
  } catch (error: any) {
    console.error('Error in checkInVisit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du check-in',
      error: error.message,
    });
  }
};

/**
 * Check-out visite (départ du client)
 */
export const checkOutVisit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data: CheckOutVisitRequest = req.body;
    const userId = req.user!.userId;

    const visit = await prisma.visit.findUnique({
      where: { id },
      include: { trip: true },
    });

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visite non trouvée',
      });
    }

    if (visit.trip.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    if (!visit.checkInAt) {
      return res.status(400).json({
        success: false,
        message: 'Vous devez d\'abord faire le check-in',
      });
    }

    // Calculer la durée
    const checkInTime = new Date(visit.checkInAt);
    const checkOutTime = new Date();
    const duration = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / 60000);

    const updatedVisit = await prisma.visit.update({
      where: { id },
      data: {
        checkOutAt: checkOutTime,
        duration,
        latitude: data.latitude || visit.latitude,
        longitude: data.longitude || visit.longitude,
        address: data.address || visit.address,
        summary: data.summary,
        outcome: data.outcome,
        photos: data.photos || [],
        documents: data.documents || [],
        signature: data.signature,
        satisfactionScore: data.satisfactionScore,
        nextVisitDate: data.nextVisitDate,
        followUpNotes: data.followUpNotes,
        status: 'COMPLETED',
      },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Check-out effectué',
      visit: updatedVisit,
    });
  } catch (error: any) {
    console.error('Error in checkOutVisit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du check-out',
      error: error.message,
    });
  }
};

/**
 * Récupérer toutes les visites
 */
export const getVisits = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const { tripId, customerId, status } = req.query as any;

    const where: any = {};

    // Admin voit toutes les visites, commercial voit seulement les siennes
    if (role === 'COMMERCIAL') {
      where.trip = { userId };
    }

    if (tripId) where.tripId = tripId;
    if (customerId) where.customerId = customerId;
    if (status) where.status = status as VisitStatus;

    const visits = await prisma.visit.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            firstName: true,
            lastName: true,
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
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      visits,
    });
  } catch (error: any) {
    console.error('Error in getVisits:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des visites',
      error: error.message,
    });
  }
};

// ========================================
// VALIDATION & REMBOURSEMENT (Admin only)
// ========================================

/**
 * Valider un trajet (admin/manager)
 */
export const validateTrip = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data: ValidateTripRequest = req.body;
    const role = req.user!.role;
    const userId = req.user!.userId;

    if (role !== 'ADMIN' && role !== 'ACCOUNTANT') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    const trip = await prisma.trip.findUnique({ where: { id } });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trajet non trouvé',
      });
    }

    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: {
        isValidated: data.approved,
        validatedAt: new Date(),
        validatedBy: userId,
        distanceKm: data.adjustedDistance || trip.distanceKm,
        totalCost: data.adjustedCost || trip.totalCost,
      },
    });

    res.json({
      success: true,
      message: data.approved ? 'Trajet validé' : 'Trajet refusé',
      trip: updatedTrip,
    });
  } catch (error: any) {
    console.error('Error in validateTrip:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du trajet',
      error: error.message,
    });
  }
};

/**
 * Rembourser un trajet (admin/manager)
 */
export const reimburseTrip = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data: ReimburseTripRequest = req.body;
    const role = req.user!.role;

    if (role !== 'ADMIN' && role !== 'ACCOUNTANT') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    const trip = await prisma.trip.findUnique({ where: { id } });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trajet non trouvé',
      });
    }

    if (!trip.isValidated) {
      return res.status(400).json({
        success: false,
        message: 'Le trajet doit être validé avant d\'être remboursé',
      });
    }

    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: {
        isReimbursed: true,
        reimbursedAt: new Date(),
        reimbursementAmount: data.amount,
      },
    });

    res.json({
      success: true,
      message: 'Trajet remboursé',
      trip: updatedTrip,
    });
  } catch (error: any) {
    console.error('Error in reimburseTrip:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du remboursement du trajet',
      error: error.message,
    });
  }
};
