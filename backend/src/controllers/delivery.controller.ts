import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { withAuditContext } from '../middleware/delivery-audit.middleware';

/**
 * Controller pour la gestion des livraisons
 *
 * Gestion RBAC:
 * - ADMIN: Accès complet à toutes les livraisons
 * - COMMERCIAL: Peut créer et voir ses propres livraisons
 * - DELIVERY (coursiers): Peut voir et mettre à jour les livraisons assignées
 * - CLIENT: Peut voir ses propres livraisons
 */

/**
 * GET /api/deliveries
 * Récupère toutes les livraisons en fonction du rôle utilisateur
 */
export const getAllDeliveries = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    // Construire le filtre selon le rôle
    let whereClause: any = {};

    switch (userRole) {
      case 'ADMIN':
        // Admin voit tout
        break;

      case 'COMMERCIAL':
        // Commercial voit uniquement ses livraisons
        whereClause.salesUserId = userId;
        break;

      case 'DELIVERY':
        // Coursier voit uniquement ses livraisons assignées
        whereClause.courierId = userId;
        break;

      case 'CLIENT':
        // Client voit ses livraisons (via customer)
        const customer = await prisma.customer.findFirst({
          where: { userId },
        });

        if (customer) {
          whereClause.customerId = customer.id;
        } else {
          whereClause.id = 'impossible'; // Aucun résultat
        }
        break;

      default:
        return res.status(403).json({
          success: false,
          message: 'Rôle non autorisé',
        });
    }

    // Filtres supplémentaires depuis query params
    const { status, courierId, customerId } = req.query;

    if (status) {
      whereClause.status = status;
    }

    // Admin peut filtrer par courierId ou customerId
    if (userRole === 'ADMIN') {
      if (courierId) whereClause.courierId = courierId;
      if (customerId) whereClause.customerId = customerId;
    }

    const deliveries = await prisma.delivery.findMany({
      where: whereClause,
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
        order: {
          select: {
            id: true,
            number: true,
            total: true,
          },
        },
        salesUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        courier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json({
      success: true,
      data: deliveries,
      count: deliveries.length,
    });
  } catch (error: any) {
    console.error('Error in getAllDeliveries:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des livraisons',
      error: error.message,
    });
  }
};

/**
 * GET /api/deliveries/:id
 * Récupère les détails d'une livraison avec son historique complet
 */
export const getDeliveryById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        customer: true,
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        salesUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        courier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        events: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
        },
        courierLocations: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 50, // Dernières 50 positions
        },
      },
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Livraison non trouvée',
      });
    }

    // Vérifier les permissions
    const hasAccess =
      userRole === 'ADMIN' ||
      (userRole === 'COMMERCIAL' && delivery.salesUserId === userId) ||
      (userRole === 'DELIVERY' && delivery.courierId === userId) ||
      (userRole === 'CLIENT' && delivery.customer?.userId === userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette livraison',
      });
    }

    return res.json({
      success: true,
      data: delivery,
    });
  } catch (error: any) {
    console.error('Error in getDeliveryById:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la livraison',
      error: error.message,
    });
  }
};

/**
 * POST /api/deliveries
 * Crée une nouvelle livraison (ADMIN ou COMMERCIAL uniquement)
 */
export const createDelivery = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    // Seuls ADMIN et COMMERCIAL peuvent créer des livraisons
    if (!['ADMIN', 'COMMERCIAL'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à créer des livraisons',
      });
    }

    const {
      orderId,
      customerId,
      pickupAddress,
      pickupLatitude,
      pickupLongitude,
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      scheduledPickupAt,
      scheduledDeliveryAt,
      instructions,
      deliveryFee,
    } = req.body;

    // Validation
    if (!pickupAddress || !deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: 'Adresse de collecte et de livraison requises',
      });
    }

    // Créer la livraison
    const delivery = await prisma.delivery.create({
      data: {
        orderId: orderId || null,
        customerId: customerId || null,
        salesUserId: userId,
        pickupAddress,
        pickupLatitude: pickupLatitude || null,
        pickupLongitude: pickupLongitude || null,
        deliveryAddress,
        deliveryLatitude: deliveryLatitude || null,
        deliveryLongitude: deliveryLongitude || null,
        scheduledPickupAt: scheduledPickupAt ? new Date(scheduledPickupAt) : null,
        scheduledDeliveryAt: scheduledDeliveryAt ? new Date(scheduledDeliveryAt) : null,
        specialInstructions: instructions || null,
        deliveryFee: deliveryFee || null,
        status: 'CREATED',
      },
      include: {
        customer: true,
        order: true,
        salesUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Créer l'événement initial
    await prisma.deliveryEvent.create({
      data: {
        deliveryId: delivery.id,
        type: 'STATUS_CHANGE',
        description: 'Livraison créée',
        newStatus: 'CREATED',
        userId,
        actorRole: userRole as any,
        timestamp: new Date(),
      },
    });

    return res.status(201).json({
      success: true,
      data: delivery,
      message: 'Livraison créée avec succès',
    });
  } catch (error: any) {
    console.error('Error in createDelivery:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la livraison',
      error: error.message,
    });
  }
};

/**
 * PATCH /api/deliveries/:id/status
 * Met à jour le statut d'une livraison (ADMIN, COMMERCIAL, DELIVERY)
 * Déclenche automatiquement la création d'un DeliveryEvent via le middleware
 */
export const updateDeliveryStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Statut requis',
      });
    }

    // Récupérer la livraison
    const delivery = await prisma.delivery.findUnique({
      where: { id },
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Livraison non trouvée',
      });
    }

    // Vérifier les permissions
    const canUpdate =
      userRole === 'ADMIN' ||
      (userRole === 'COMMERCIAL' && delivery.salesUserId === userId) ||
      (userRole === 'DELIVERY' && delivery.courierId === userId);

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier cette livraison',
      });
    }

    // Mettre à jour le statut avec le contexte d'audit
    // Le middleware delivery-audit.middleware créera automatiquement l'événement
    const updatedDelivery = await prisma.delivery.update({
      where: { id },
      data: withAuditContext(
        {
          status,
          statusChangedAt: new Date(),
          previousStatus: delivery.status,
        },
        {
          userId,
          userRole,
        }
      ),
      include: {
        customer: true,
        order: true,
        salesUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        courier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Si il y a des notes, créer un événement NOTE_ADDED
    if (notes) {
      await prisma.deliveryEvent.create({
        data: {
          deliveryId: id,
          type: 'NOTE_ADDED',
          description: notes,
          userId,
          actorRole: userRole,
          timestamp: new Date(),
        },
      });
    }

    return res.json({
      success: true,
      data: updatedDelivery,
      message: 'Statut mis à jour avec succès',
    });
  } catch (error: any) {
    console.error('Error in updateDeliveryStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message,
    });
  }
};

/**
 * PATCH /api/deliveries/:id/assign
 * Assigne un coursier à une livraison (ADMIN uniquement)
 */
export const assignCourier = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { courierId } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les administrateurs peuvent assigner des coursiers',
      });
    }

    if (!courierId) {
      return res.status(400).json({
        success: false,
        message: 'ID du coursier requis',
      });
    }

    // Vérifier que le coursier existe et a le rôle DELIVERY
    const courier = await prisma.user.findUnique({
      where: { id: courierId },
    });

    if (!courier || courier.role !== 'DELIVERY') {
      return res.status(400).json({
        success: false,
        message: 'Coursier invalide',
      });
    }

    // Récupérer l'ancienne livraison
    const oldDelivery = await prisma.delivery.findUnique({
      where: { id },
    });

    if (!oldDelivery) {
      return res.status(404).json({
        success: false,
        message: 'Livraison non trouvée',
      });
    }

    // Assigner le coursier
    const updatedDelivery = await prisma.delivery.update({
      where: { id },
      data: withAuditContext(
        {
          courierId,
          status: 'ACCEPTED',
          statusChangedAt: new Date(),
          previousStatus: oldDelivery.status,
        },
        {
          userId,
          userRole,
        }
      ),
      include: {
        customer: true,
        order: true,
        salesUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        courier: {
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

    // Créer un événement REASSIGNED
    await prisma.deliveryEvent.create({
      data: {
        deliveryId: id,
        type: 'REASSIGNED',
        description: `Coursier assigné: ${courier.firstName} ${courier.lastName}`,
        userId,
        actorRole: userRole,
        timestamp: new Date(),
        metadata: {
          newCourierId: courierId,
          oldCourierId: oldDelivery.courierId,
        },
      },
    });

    return res.json({
      success: true,
      data: updatedDelivery,
      message: 'Coursier assigné avec succès',
    });
  } catch (error: any) {
    console.error('Error in assignCourier:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'assignation du coursier',
      error: error.message,
    });
  }
};

/**
 * PATCH /api/deliveries/:id/location
 * Met à jour la position GPS du coursier (DELIVERY uniquement)
 */
export const updateLocation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, heading, speed, altitude, accuracy } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    if (userRole !== 'DELIVERY') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les coursiers peuvent mettre à jour leur position',
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude et longitude requises',
      });
    }

    // Vérifier que la livraison existe et est assignée au coursier
    const delivery = await prisma.delivery.findUnique({
      where: { id },
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Livraison non trouvée',
      });
    }

    if (delivery.courierId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Cette livraison ne vous est pas assignée',
      });
    }

    // Créer l'enregistrement de position
    const location = await prisma.courierLocation.create({
      data: {
        courierId: userId,
        deliveryId: id,
        latitude,
        longitude,
        heading: heading || null,
        speed: speed || null,
        altitude: altitude || null,
        accuracy: accuracy || null,
        timestamp: new Date(),
      },
    });

    // Créer un événement LOCATION_UPDATE
    await prisma.deliveryEvent.create({
      data: {
        deliveryId: id,
        type: 'LOCATION_UPDATE',
        description: 'Position mise à jour',
        userId,
        actorRole: userRole,
        timestamp: new Date(),
        metadata: {
          latitude,
          longitude,
          accuracy,
        },
      },
    });

    return res.json({
      success: true,
      data: location,
      message: 'Position mise à jour avec succès',
    });
  } catch (error: any) {
    console.error('Error in updateLocation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la position',
      error: error.message,
    });
  }
};

/**
 * POST /api/deliveries/:id/proof
 * Ajoute une preuve de livraison (photo ou signature) (DELIVERY uniquement)
 */
export const addDeliveryProof = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { photoUrl, signatureUrl, recipientName } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    if (userRole !== 'DELIVERY') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les coursiers peuvent ajouter des preuves de livraison',
      });
    }

    // Vérifier que la livraison existe et est assignée au coursier
    const delivery = await prisma.delivery.findUnique({
      where: { id },
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Livraison non trouvée',
      });
    }

    if (delivery.courierId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Cette livraison ne vous est pas assignée',
      });
    }

    // Préparer les mises à jour
    const updateData: any = {};

    if (photoUrl) {
      updateData.deliveryPhotos = {
        push: photoUrl,
      };
    }

    if (signatureUrl) {
      updateData.deliverySignature = signatureUrl;
    }

    if (recipientName) {
      updateData.recipientName = recipientName;
    }

    // Mettre à jour la livraison
    const updatedDelivery = await prisma.delivery.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        order: true,
        courier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Créer les événements appropriés
    if (photoUrl) {
      await prisma.deliveryEvent.create({
        data: {
          deliveryId: id,
          type: 'PHOTO_ADDED',
          description: 'Photo de livraison ajoutée',
          userId,
          actorRole: userRole,
          timestamp: new Date(),
          metadata: { photoUrl },
        },
      });
    }

    if (signatureUrl) {
      await prisma.deliveryEvent.create({
        data: {
          deliveryId: id,
          type: 'SIGNATURE_ADDED',
          description: 'Signature du destinataire ajoutée',
          userId,
          actorRole: userRole,
          timestamp: new Date(),
          metadata: { recipientName },
        },
      });
    }

    return res.json({
      success: true,
      data: updatedDelivery,
      message: 'Preuve de livraison ajoutée avec succès',
    });
  } catch (error: any) {
    console.error('Error in addDeliveryProof:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la preuve de livraison',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/deliveries/:id
 * Annule une livraison (ADMIN ou COMMERCIAL propriétaire uniquement)
 */
export const cancelDelivery = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id },
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Livraison non trouvée',
      });
    }

    // Vérifier les permissions
    const canCancel =
      userRole === 'ADMIN' ||
      (userRole === 'COMMERCIAL' && delivery.salesUserId === userId);

    if (!canCancel) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à annuler cette livraison',
      });
    }

    // Ne peut annuler que si pas encore livrée
    if (['DELIVERED', 'COMPLETED', 'CANCELED'].includes(delivery.status)) {
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'annuler une livraison déjà terminée ou annulée',
      });
    }

    // Mettre à jour le statut à CANCELED
    const updatedDelivery = await prisma.delivery.update({
      where: { id },
      data: withAuditContext(
        {
          status: 'CANCELED',
          statusChangedAt: new Date(),
          previousStatus: delivery.status,
        },
        {
          userId,
          userRole,
        }
      ),
      include: {
        customer: true,
        order: true,
        salesUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        courier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Créer un événement avec la raison
    if (reason) {
      await prisma.deliveryEvent.create({
        data: {
          deliveryId: id,
          type: 'NOTE_ADDED',
          description: `Livraison annulée: ${reason}`,
          userId,
          actorRole: userRole,
          timestamp: new Date(),
        },
      });
    }

    return res.json({
      success: true,
      data: updatedDelivery,
      message: 'Livraison annulée avec succès',
    });
  } catch (error: any) {
    console.error('Error in cancelDelivery:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation de la livraison',
      error: error.message,
    });
  }
};
