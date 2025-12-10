import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getActiveUsers, getUserPosition } from '../services/tracking.service';
import prisma from '../config/database';

/**
 * Get all active users with real-time tracking
 * Returns list of users currently being tracked (with active trips)
 */
export const getActiveTracking = async (req: AuthRequest, res: Response) => {
  try {
    const activeUsers = getActiveUsers();

    // Enrich with user data from database
    const enrichedUsers = await Promise.all(
      activeUsers.map(async (user) => {
        const userData = await prisma.user.findUnique({
          where: { id: user.userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        });

        let tripData = null;
        if (user.tripId) {
          tripData = await prisma.trip.findUnique({
            where: { id: user.tripId },
            select: {
              id: true,
              purpose: true,
              startTime: true,
              startAddress: true,
              vehicleType: true,
              vehicleRegistration: true,
            },
          });
        }

        return {
          ...user,
          user: userData,
          trip: tripData,
        };
      })
    );

    res.json({
      success: true,
      count: enrichedUsers.length,
      data: enrichedUsers,
    });
  } catch (error) {
    console.error('Error getting active tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du suivi en temps réel',
    });
  }
};

/**
 * Get current position of a specific user
 */
export const getUserCurrentPosition = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const position = getUserPosition(userId);

    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé ou pas de position disponible',
      });
    }

    // Get user data
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    res.json({
      success: true,
      data: {
        position,
        user: userData,
      },
    });
  } catch (error) {
    console.error('Error getting user position:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la position',
    });
  }
};

/**
 * Get all active trips with their latest positions
 */
export const getActiveTripsWithPositions = async (req: AuthRequest, res: Response) => {
  try {
    // Get all trips that are currently in progress
    const activeTrips = await prisma.trip.findMany({
      where: {
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
          orderBy: {
            timestamp: 'desc',
          },
          take: 1, // Get only the latest checkpoint
        },
      },
    });

    // Enrich with real-time positions from tracking service
    const activeUsers = getActiveUsers();
    const enrichedTrips = activeTrips.map((trip) => {
      const trackingUser = activeUsers.find((u) => u.tripId === trip.id);

      return {
        ...trip,
        isTracked: !!trackingUser,
        lastPosition: trackingUser?.lastPosition || trip.checkpoints[0] || null,
      };
    });

    res.json({
      success: true,
      count: enrichedTrips.length,
      data: enrichedTrips,
    });
  } catch (error) {
    console.error('Error getting active trips with positions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des trajets actifs',
    });
  }
};

export default {
  getActiveTracking,
  getUserCurrentPosition,
  getActiveTripsWithPositions,
};
