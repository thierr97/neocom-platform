/**
 * Service WebSocket pour communication temps réel
 */
import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';
import { LocationData } from './gps.service';

// URL du serveur WebSocket (enlever /api pour Socket.IO)
const SOCKET_URL = API_URL.replace('/api', '');

let socket: Socket | null = null;

export interface TrackingUser {
  userId: string;
  name: string;
  lastPosition: LocationData;
  updatedAt: string;
}

/**
 * Se connecter au serveur WebSocket
 */
export const connectSocket = (userId: string, authToken: string): Socket => {
  if (socket?.connected) {
    console.log('Socket déjà connecté');
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token: authToken,
      userId,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
  });

  socket.on('connect', () => {
    console.log('Socket connecté:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket déconnecté:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Erreur de connexion Socket:', error.message);
  });

  return socket;
};

/**
 * Se déconnecter du serveur WebSocket
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket déconnecté manuellement');
  }
};

/**
 * Rejoindre la salle de tracking (pour recevoir les positions de tous les utilisateurs)
 */
export const joinTracking = (): void => {
  if (socket) {
    socket.emit('join-tracking');
    console.log('Rejoint la salle de tracking');
  }
};

/**
 * Quitter la salle de tracking
 */
export const leaveTracking = (): void => {
  if (socket) {
    socket.emit('leave-tracking');
    console.log('Quitté la salle de tracking');
  }
};

/**
 * Envoyer une mise à jour de position
 */
export const sendPositionUpdate = (location: LocationData): void => {
  if (socket?.connected) {
    socket.emit('position-update', {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      speed: location.coords.speed,
      heading: location.coords.heading,
      timestamp: location.timestamp,
    });
  } else {
    console.warn('Socket non connecté - impossible d\'envoyer la position');
  }
};

/**
 * Écouter les mises à jour de position des autres utilisateurs
 */
export const onPositionUpdate = (
  callback: (data: { userId: string; position: LocationData }) => void
): void => {
  if (socket) {
    socket.on('position-update', callback);
  }
};

/**
 * Écouter la liste des utilisateurs actifs avec tracking
 */
export const onActiveUsers = (callback: (users: TrackingUser[]) => void): void => {
  if (socket) {
    socket.on('active-users', callback);
  }
};

/**
 * Écouter quand un utilisateur se connecte
 */
export const onUserConnected = (callback: (user: TrackingUser) => void): void => {
  if (socket) {
    socket.on('user-connected', callback);
  }
};

/**
 * Écouter quand un utilisateur se déconnecte
 */
export const onUserDisconnected = (callback: (userId: string) => void): void => {
  if (socket) {
    socket.on('user-disconnected', callback);
  }
};

/**
 * Retirer un écouteur d'événement
 */
export const offEvent = (eventName: string, callback?: (...args: any[]) => void): void => {
  if (socket) {
    if (callback) {
      socket.off(eventName, callback);
    } else {
      socket.off(eventName);
    }
  }
};

/**
 * Vérifier si le socket est connecté
 */
export const isSocketConnected = (): boolean => {
  return socket?.connected || false;
};

/**
 * Obtenir l'instance du socket (pour usage avancé)
 */
export const getSocket = (): Socket | null => {
  return socket;
};
