import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import prisma from '../config/database';

/**
 * Service de suivi GPS en temps réel
 * Gère les WebSocket connections pour le tracking live des commerciaux
 */

interface UserPosition {
  userId: string;
  tripId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
}

interface ConnectedUser {
  userId: string;
  socketId: string;
  tripId?: string;
  lastPosition?: UserPosition;
}

// Map to store active users and their positions
const activeUsers = new Map<string, ConnectedUser>();

let io: SocketIOServer;

/**
 * Initialize WebSocket server
 */
export const initializeWebSocket = (httpServer: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigins = [
          process.env.FRONTEND_URL || 'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002',
          'http://localhost:3003',
        ];

        // Allow Vercel preview deployments
        if (origin && (origin.endsWith('.vercel.app') || origin.endsWith('neoserv.fr'))) {
          callback(null, true);
        } else if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`📡 Nouvelle connexion WebSocket: ${socket.id}`);

    // User joins tracking
    socket.on('join-tracking', async (data: { userId: string; tripId?: string }) => {
      try {
        const { userId, tripId } = data;

        // Store connected user
        activeUsers.set(userId, {
          userId,
          socketId: socket.id,
          tripId,
        });

        // Join user-specific room
        socket.join(`user:${userId}`);

        // Join trip-specific room if applicable
        if (tripId) {
          socket.join(`trip:${tripId}`);
        }

        // Join admin room (for managers/admins to see all users)
        socket.join('admin-tracking');

        console.log(`✅ User ${userId} joined tracking${tripId ? ` for trip ${tripId}` : ''}`);

        // Send current active users to the newly connected user
        const activeUsersList = Array.from(activeUsers.values()).map((user) => ({
          userId: user.userId,
          tripId: user.tripId,
          lastPosition: user.lastPosition,
        }));

        socket.emit('active-users', activeUsersList);

        // Notify all admins about new user
        io.to('admin-tracking').emit('user-connected', {
          userId,
          tripId,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Error joining tracking:', error);
        socket.emit('error', { message: 'Failed to join tracking' });
      }
    });

    // Receive position update from user
    socket.on('position-update', async (data: UserPosition) => {
      try {
        const { userId, tripId, latitude, longitude, accuracy, speed, heading } = data;

        // Update user's last position in memory
        const user = activeUsers.get(userId);
        if (user) {
          user.lastPosition = {
            userId,
            tripId,
            latitude,
            longitude,
            accuracy,
            speed,
            heading,
            timestamp: new Date(),
          };
          activeUsers.set(userId, user);
        }

        // Broadcast position to all clients watching this user
        io.to('admin-tracking').emit('position-update', {
          userId,
          tripId,
          latitude,
          longitude,
          accuracy,
          speed,
          heading,
          timestamp: new Date(),
        });

        // Save checkpoint to database every position update
        if (tripId) {
          await prisma.tripCheckpoint.create({
            data: {
              tripId,
              latitude,
              longitude,
              accuracy,
              speed,
              heading,
              timestamp: new Date(),
            },
          });
        }

        console.log(`📍 Position update from user ${userId}: ${latitude}, ${longitude}`);
      } catch (error) {
        console.error('Error processing position update:', error);
        socket.emit('error', { message: 'Failed to process position update' });
      }
    });

    // User leaves tracking
    socket.on('leave-tracking', (data: { userId: string }) => {
      try {
        const { userId } = data;

        // Remove from active users
        activeUsers.delete(userId);

        // Leave all rooms
        socket.leave(`user:${userId}`);
        socket.leave('admin-tracking');

        console.log(`👋 User ${userId} left tracking`);

        // Notify all admins
        io.to('admin-tracking').emit('user-disconnected', {
          userId,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Error leaving tracking:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ Déconnexion WebSocket: ${socket.id}`);

      // Find and remove disconnected user
      for (const [userId, user] of activeUsers.entries()) {
        if (user.socketId === socket.id) {
          activeUsers.delete(userId);

          // Notify all admins
          io.to('admin-tracking').emit('user-disconnected', {
            userId,
            timestamp: new Date(),
          });

          console.log(`User ${userId} removed from active tracking`);
          break;
        }
      }
    });
  });

  console.log('🔌 WebSocket server initialized');
  return io;
};

/**
 * Get all currently active users
 */
export const getActiveUsers = (): ConnectedUser[] => {
  return Array.from(activeUsers.values());
};

/**
 * Get position of a specific user
 */
export const getUserPosition = (userId: string): UserPosition | undefined => {
  const user = activeUsers.get(userId);
  return user?.lastPosition;
};

/**
 * Send message to specific user
 */
export const sendToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

/**
 * Broadcast message to all connected admins
 */
export const broadcastToAdmins = (event: string, data: any) => {
  if (io) {
    io.to('admin-tracking').emit(event, data);
  }
};

export default {
  initializeWebSocket,
  getActiveUsers,
  getUserPosition,
  sendToUser,
  broadcastToAdmins,
};
