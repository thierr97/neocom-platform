import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

/**
 * POST /api/courier/apply
 * Candidature pour devenir coursier (route publique)
 *
 * Body:
 * - firstName, lastName, email, phone (string)
 * - vehicleType (VehicleType enum)
 * - licenseNumber (string, optionnel)
 * - bio (string, optionnel)
 */
export const applyCourier = async (req: AuthRequest, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      vehicleType,
      licenseNumber,
      bio,
    } = req.body;

    // Validation des champs requis
    if (!firstName || !lastName || !email || !phone || !vehicleType) {
      return res.status(400).json({
        success: false,
        message: 'Champs requis manquants: firstName, lastName, email, phone, vehicleType',
      });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Un compte existe déjà avec cet email',
      });
    }

    // Créer l'utilisateur avec le rôle DELIVERY et status PENDING
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        role: 'DELIVERY',
        password: '', // Sera défini lors de l'activation du compte
      },
    });

    // Créer le profil coursier associé
    const courierProfile = await prisma.courierProfile.create({
      data: {
        userId: newUser.id,
        vehicleType,
        licenseNumber,
        bio,
        status: 'PENDING', // En attente de validation KYC
        isAvailable: false,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Candidature envoyée avec succès. Vous recevrez un email une fois votre compte validé.',
      data: {
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
        },
        profile: courierProfile,
      },
    });
  } catch (error: any) {
    console.error('Error in applyCourier:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de la candidature',
      error: error.message,
    });
  }
};

/**
 * GET /api/courier/profile
 * Récupère le profil complet du coursier connecté
 * RBAC: DELIVERY uniquement
 */
export const getCourierProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    // Récupérer le profil avec les documents et statistiques
    const profile = await prisma.courierProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
          },
        },
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
        deliveriesAssigned: {
          where: {
            status: {
              in: ['OFFERED', 'ACCEPTED', 'TO_PICKUP', 'AT_PICKUP', 'PICKED_UP', 'TO_DROPOFF', 'AT_DROPOFF'],
            },
          },
          include: {
            customer: true,
            order: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profil coursier non trouvé',
      });
    }

    // Calculer les statistiques
    const stats = await prisma.delivery.groupBy({
      by: ['status'],
      where: {
        courierId: userId,
      },
      _count: true,
    });

    const totalDeliveries = await prisma.delivery.count({
      where: {
        courierId: userId,
        status: 'COMPLETED',
      },
    });

    const totalEarnings = await prisma.delivery.aggregate({
      where: {
        courierId: userId,
        status: 'COMPLETED',
      },
      _sum: {
        courierEarnings: true,
      },
    });

    return res.json({
      success: true,
      data: {
        profile,
        statistics: {
          totalDeliveries,
          totalEarnings: totalEarnings._sum.courierEarnings || 0,
          statusBreakdown: stats,
        },
      },
    });
  } catch (error: any) {
    console.error('Error in getCourierProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message,
    });
  }
};

/**
 * PATCH /api/courier/profile
 * Met à jour le profil du coursier connecté
 * RBAC: DELIVERY uniquement
 */
export const updateCourierProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const {
      vehicleType,
      licenseNumber,
      bio,
      isAvailable,
      bankAccountNumber,
      bankAccountHolder,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    // Vérifier que le profil existe
    const existingProfile = await prisma.courierProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      return res.status(404).json({
        success: false,
        message: 'Profil coursier non trouvé',
      });
    }

    // Construire l'objet de mise à jour
    const updateData: any = {};
    if (vehicleType !== undefined) updateData.vehicleType = vehicleType;
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
    if (bio !== undefined) updateData.bio = bio;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber;
    if (bankAccountHolder !== undefined) updateData.bankAccountHolder = bankAccountHolder;

    // Mettre à jour le profil
    const updatedProfile = await prisma.courierProfile.update({
      where: { userId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: updatedProfile,
    });
  } catch (error: any) {
    console.error('Error in updateCourierProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
      error: error.message,
    });
  }
};

/**
 * POST /api/courier/documents
 * Upload d'un document KYC pour le coursier connecté
 * RBAC: DELIVERY uniquement
 *
 * Requires multipart/form-data with file upload
 * - file (File - image or PDF, max 5MB)
 * - type (DocumentType enum: ID_CARD, DRIVER_LICENSE, VEHICLE_REGISTRATION, INSURANCE, CRIMINAL_RECORD)
 * - expiresAt (DateTime, optionnel)
 */
export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { type, expiresAt, legalStatus } = req.body;
    const file = req.file;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    // Validation
    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Le champ "type" est requis',
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier n\'a été uploadé',
      });
    }

    // Vérifier que le profil coursier existe
    const courierProfile = await prisma.courierProfile.findUnique({
      where: { userId },
    });

    if (!courierProfile) {
      return res.status(404).json({
        success: false,
        message: 'Profil coursier non trouvé',
      });
    }

    // Construire le chemin relatif du fichier pour le stockage
    const fileUrl = `/uploads/courier-documents/${file.filename}`;

    // Mettre à jour le statut juridique si fourni
    if (legalStatus) {
      await prisma.courierProfile.update({
        where: { userId },
        data: { legalStatus },
      });
    }

    // Créer le document
    const document = await prisma.courierDocument.create({
      data: {
        courierProfileId: courierProfile.id,
        type,
        fileUrl,
        status: 'PENDING', // En attente de validation par l'admin
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploadé avec succès. Il sera validé par un administrateur.',
      data: document,
    });
  } catch (error: any) {
    console.error('Error in uploadDocument:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload du document',
      error: error.message,
    });
  }
};

/**
 * GET /api/courier/documents
 * Liste tous les documents du coursier connecté
 * RBAC: DELIVERY uniquement
 */
export const getMyDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    // Récupérer le profil
    const courierProfile = await prisma.courierProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!courierProfile) {
      return res.status(404).json({
        success: false,
        message: 'Profil coursier non trouvé',
      });
    }

    // Récupérer les documents
    const documents = await prisma.courierDocument.findMany({
      where: {
        courierProfileId: courierProfile.id,
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return res.json({
      success: true,
      data: documents,
    });
  } catch (error: any) {
    console.error('Error in getMyDocuments:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des documents',
      error: error.message,
    });
  }
};

/**
 * PATCH /api/courier/documents/:id/status
 * Valide ou rejette un document (ADMIN uniquement)
 * RBAC: ADMIN uniquement
 *
 * Body:
 * - status (DocumentStatus: APPROVED, REJECTED)
 * - rejectionReason (string, optionnel - requis si REJECTED)
 */
export const validateDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const userRole = req.user?.role;

    // Vérification RBAC
    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Réservé aux administrateurs.',
      });
    }

    // Validation
    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide. Doit être APPROVED ou REJECTED.',
      });
    }

    if (status === 'REJECTED' && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Le champ rejectionReason est requis pour un rejet.',
      });
    }

    // Récupérer le document
    const document = await prisma.courierDocument.findUnique({
      where: { id },
      include: {
        courierProfile: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé',
      });
    }

    // Mettre à jour le statut
    const updatedDocument = await prisma.courierDocument.update({
      where: { id },
      data: {
        status,
        validatedAt: status === 'APPROVED' ? new Date() : null,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      },
    });

    // Si tous les documents requis sont approuvés, activer le profil coursier
    if (status === 'APPROVED') {
      const allDocuments = await prisma.courierDocument.findMany({
        where: {
          courierProfileId: document.courierProfileId,
        },
      });

      // Vérifier si au moins ID_CARD et DRIVER_LICENSE sont approuvés
      const hasIdCard = allDocuments.some(
        (doc) => doc.type === 'ID_CARD' && doc.status === 'APPROVED'
      );
      const hasDriverLicense = allDocuments.some(
        (doc) => doc.type === 'DRIVER_LICENSE' && doc.status === 'APPROVED'
      );

      if (hasIdCard && hasDriverLicense) {
        await prisma.courierProfile.update({
          where: { id: document.courierProfileId },
          data: {
            status: 'ACTIVE',
            isAvailable: true,
          },
        });
      }
    }

    return res.json({
      success: true,
      message: status === 'APPROVED'
        ? 'Document approuvé avec succès'
        : 'Document rejeté',
      data: updatedDocument,
    });
  } catch (error: any) {
    console.error('Error in validateDocument:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du document',
      error: error.message,
    });
  }
};

/**
 * GET /api/courier/admin/pending
 * Liste tous les coursiers en attente de validation KYC (ADMIN uniquement)
 * RBAC: ADMIN uniquement
 */
export const getPendingCouriers = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;

    // Vérification RBAC
    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Réservé aux administrateurs.',
      });
    }

    const pendingCouriers = await prisma.courierProfile.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({
      success: true,
      data: pendingCouriers,
    });
  } catch (error: any) {
    console.error('Error in getPendingCouriers:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des coursiers en attente',
      error: error.message,
    });
  }
};

/**
 * GET /api/courier/admin/all
 * Liste tous les coursiers avec filtres (ADMIN uniquement)
 * RBAC: ADMIN uniquement
 *
 * Query params:
 * - status (CourierStatus: PENDING, ACTIVE, INACTIVE, SUSPENDED)
 * - isAvailable (boolean)
 */
export const getAllCouriers = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const { status, isAvailable } = req.query;

    // Vérification RBAC
    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Réservé aux administrateurs.',
      });
    }

    // Construire les filtres
    const where: any = {};
    if (status) where.status = status;
    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';

    const couriers = await prisma.courierProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        documents: {
          select: {
            id: true,
            type: true,
            status: true,
            validatedAt: true,
            expiresAt: true,
          },
        },
        _count: {
          select: {
            deliveriesAssigned: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: couriers,
    });
  } catch (error: any) {
    console.error('Error in getAllCouriers:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des coursiers',
      error: error.message,
    });
  }
};
