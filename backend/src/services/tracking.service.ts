import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import prisma from '../config/database';

/**
 * Service de suivi GPS en temps réel
 * Gère les WebSocket connections pour:
 * - Le tracking live des commerciaux (trips)
 * - Le tracking live des coursiers (deliveries)
 */

// ==========================================
// Interfaces pour le tracking des trips (commerciaux)
// ==========================================
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

// ==========================================
// Interfaces pour le tracking des deliveries (coursiers)
// ==========================================
interface DeliveryPosition {
  courierId: string;
  deliveryId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  timestamp: Date;
}

interface ConnectedCourier {
  courierId: string;
  socketId: string;
  deliveryId?: string;
  lastPosition?: DeliveryPosition;
}

// Map to store active users and their positions
const activeUsers = new Map<string, ConnectedUser>();

// Map to store active couriers and their positions
const activeCouriers = new Map<string, ConnectedCourier>();

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

      // Find and remove disconnected courier
      for (const [courierId, courier] of activeCouriers.entries()) {
        if (courier.socketId === socket.id) {
          activeCouriers.delete(courierId);

          // Notify delivery watchers
          if (courier.deliveryId) {
            io.to(`delivery:${courier.deliveryId}`).emit('courier-disconnected', {
              courierId,
              deliveryId: courier.deliveryId,
              timestamp: new Date(),
            });
          }

          console.log(`Courier ${courierId} removed from active tracking`);
          break;
        }
      }
    });

    // ==========================================
    // DELIVERY TRACKING EVENTS (Coursiers)
    // ==========================================

    /**
     * Courier joins delivery tracking
     * Creates rooms: courier:${courierId}, delivery:${deliveryId}, admin-tracking
     */
    socket.on('join-delivery-tracking', async (data: { courierId: string; deliveryId?: string }) => {
      try {
        const { courierId, deliveryId } = data;

        // Store connected courier
        activeCouriers.set(courierId, {
          courierId,
          socketId: socket.id,
          deliveryId,
        });

        // Join courier-specific room
        socket.join(`courier:${courierId}`);

        // Join delivery-specific room if applicable
        if (deliveryId) {
          socket.join(`delivery:${deliveryId}`);
        }

        // Join admin room (for managers/admins to see all couriers)
        socket.join('admin-tracking');

        console.log(`✅ Courier ${courierId} joined delivery tracking${deliveryId ? ` for delivery ${deliveryId}` : ''}`);

        // Send current active couriers to the newly connected courier
        const activeCouriersList = Array.from(activeCouriers.values()).map((courier) => ({
          courierId: courier.courierId,
          deliveryId: courier.deliveryId,
          lastPosition: courier.lastPosition,
        }));

        socket.emit('active-couriers', activeCouriersList);

        // Notify all admins and delivery watchers about new courier
        const notification = {
          courierId,
          deliveryId,
          timestamp: new Date(),
        };
        io.to('admin-tracking').emit('courier-connected', notification);
        if (deliveryId) {
          io.to(`delivery:${deliveryId}`).emit('courier-connected', notification);
        }
      } catch (error) {
        console.error('Error joining delivery tracking:', error);
        socket.emit('error', { message: 'Failed to join delivery tracking' });
      }
    });

    /**
     * Receive position update from courier during delivery
     * Broadcasts to:
     * - Admin tracking room (all admins)
     * - Delivery room (customers tracking their delivery)
     */
    socket.on('delivery-position-update', async (data: DeliveryPosition) => {
      try {
        const { courierId, deliveryId, latitude, longitude, accuracy, speed, heading, altitude } = data;

        // Update courier's last position in memory
        const courier = activeCouriers.get(courierId);
        if (courier) {
          courier.lastPosition = {
            courierId,
            deliveryId,
            latitude,
            longitude,
            accuracy,
            speed,
            heading,
            altitude,
            timestamp: new Date(),
          };
          activeCouriers.set(courierId, courier);
        }

        // Broadcast position to admins
        io.to('admin-tracking').emit('delivery-position-update', {
          courierId,
          deliveryId,
          latitude,
          longitude,
          accuracy,
          speed,
          heading,
          altitude,
          timestamp: new Date(),
        });

        // Broadcast position to customers watching this delivery
        io.to(`delivery:${deliveryId}`).emit('delivery-position-update', {
          courierId,
          deliveryId,
          latitude,
          longitude,
          accuracy,
          speed,
          heading,
          altitude,
          timestamp: new Date(),
        });

        // Save courier location to database
        if (deliveryId) {
          await prisma.courierLocation.create({
            data: {
              courierId,
              deliveryId,
              latitude,
              longitude,
              accuracy,
              speed,
              heading,
              altitude,
              timestamp: new Date(),
            },
          });
        }

        console.log(`📍 Delivery position update from courier ${courierId}: ${latitude}, ${longitude}`);
      } catch (error) {
        console.error('Error processing delivery position update:', error);
        socket.emit('error', { message: 'Failed to process delivery position update' });
      }
    });

    /**
     * Courier leaves delivery tracking
     */
    socket.on('leave-delivery-tracking', (data: { courierId: string }) => {
      try {
        const { courierId } = data;

        // Get delivery ID before removing
        const courier = activeCouriers.get(courierId);
        const deliveryId = courier?.deliveryId;

        // Remove from active couriers
        activeCouriers.delete(courierId);

        // Leave all rooms
        socket.leave(`courier:${courierId}`);
        if (deliveryId) {
          socket.leave(`delivery:${deliveryId}`);
        }
        socket.leave('admin-tracking');

        console.log(`👋 Courier ${courierId} left delivery tracking`);

        // Notify all admins and delivery watchers
        const notification = {
          courierId,
          deliveryId,
          timestamp: new Date(),
        };
        io.to('admin-tracking').emit('courier-disconnected', notification);
        if (deliveryId) {
          io.to(`delivery:${deliveryId}`).emit('courier-disconnected', notification);
        }
      } catch (error) {
        console.error('Error leaving delivery tracking:', error);
      }
    });

    /**
     * Customer joins to track their delivery
     * Allows customers to watch courier's real-time position
     */
    socket.on('watch-delivery', async (data: { customerId: string; deliveryId: string }) => {
      try {
        const { customerId, deliveryId } = data;

        // Join delivery-specific room
        socket.join(`delivery:${deliveryId}`);

        console.log(`👁️  Customer ${customerId} watching delivery ${deliveryId}`);

        // Send current courier position if available
        for (const [courierId, courier] of activeCouriers.entries()) {
          if (courier.deliveryId === deliveryId && courier.lastPosition) {
            socket.emit('delivery-position-update', {
              courierId,
              deliveryId,
              ...courier.lastPosition,
            });
            break;
          }
        }
      } catch (error) {
        console.error('Error watching delivery:', error);
        socket.emit('error', { message: 'Failed to watch delivery' });
      }
    });

    /**
     * Customer stops watching delivery
     */
    socket.on('unwatch-delivery', (data: { customerId: string; deliveryId: string }) => {
      try {
        const { customerId, deliveryId } = data;

        socket.leave(`delivery:${deliveryId}`);

        console.log(`👁️  Customer ${customerId} stopped watching delivery ${deliveryId}`);
      } catch (error) {
        console.error('Error unwatching delivery:', error);
      }
    });
  });

  console.log('🔌 WebSocket server initialized');
  return io;
};

// ==========================================
// Export functions for trip tracking (commerciaux)
// ==========================================

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

// ==========================================
// Export functions for delivery tracking (coursiers)
// ==========================================

/**
 * Get all currently active couriers
 */
export const getActiveCouriers = (): ConnectedCourier[] => {
  return Array.from(activeCouriers.values());
};

/**
 * Get position of a specific courier
 */
export const getCourierPosition = (courierId: string): DeliveryPosition | undefined => {
  const courier = activeCouriers.get(courierId);
  return courier?.lastPosition;
};

/**
 * Send message to specific courier
 */
export const sendToCourier = (courierId: string, event: string, data: any) => {
  if (io) {
    io.to(`courier:${courierId}`).emit(event, data);
  }
};

/**
 * Broadcast message to all watchers of a specific delivery
 * (customers + admins tracking this delivery)
 */
export const broadcastToDeliveryWatchers = (deliveryId: string, event: string, data: any) => {
  if (io) {
    io.to(`delivery:${deliveryId}`).emit(event, data);
  }
};

/**
 * Notify customer about delivery status change
 */
export const notifyCustomerDeliveryUpdate = (deliveryId: string, status: string, message: string) => {
  if (io) {
    io.to(`delivery:${deliveryId}`).emit('delivery-status-update', {
      deliveryId,
      status,
      message,
      timestamp: new Date(),
    });
  }
};

export default {
  // Trip tracking (existing)
  initializeWebSocket,
  getActiveUsers,
  getUserPosition,
  sendToUser,
  broadcastToAdmins,

  // Delivery tracking (new)
  getActiveCouriers,
  getCourierPosition,
  sendToCourier,
  broadcastToDeliveryWatchers,
  notifyCustomerDeliveryUpdate,
};
