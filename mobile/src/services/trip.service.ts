/**
 * Service pour la gestion des trajets (trips) et checkpoints GPS
 */
import api from './api';

export interface StartTripData {
  purpose: 'CLIENT_VISIT' | 'DELIVERY' | 'PROSPECTING' | 'OTHER';
  objective?: string;
  vehicleType?: 'CAR' | 'MOTORCYCLE' | 'TRUCK' | 'VAN' | 'BICYCLE' | 'FOOT';
  vehicleRegistration?: string;
  estimatedKm?: number;
  latitude: number;
  longitude: number;
  address?: string;
}

export interface EndTripData {
  latitude: number;
  longitude: number;
  address?: string;
  notes?: string;
}

export interface CheckpointData {
  tripId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  speed?: number;
  heading?: number;
}

export interface Trip {
  id: string;
  userId: string;
  status: string;
  purpose: string;
  objective?: string;
  startTime: string;
  endTime?: string;
  startLatitude: number;
  startLongitude: number;
  startAddress?: string;
  endLatitude?: number;
  endLongitude?: number;
  endAddress?: string;
  distanceKm?: number;
  estimatedKm?: number;
  durationMinutes?: number;
  vehicleType?: string;
  vehicleRegistration?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

/**
 * Démarrer un nouveau trajet
 */
export const startTrip = async (data: StartTripData): Promise<Trip> => {
  try {
    const response = await api.post('/trips/start', data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Erreur lors du démarrage du trajet');
    }

    return response.data.trip;
  } catch (error: any) {
    console.error('Error starting trip:', error);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Impossible de démarrer le trajet'
    );
  }
};

/**
 * Terminer un trajet
 */
export const endTrip = async (tripId: string, data: EndTripData): Promise<Trip> => {
  try {
    const response = await api.post(`/trips/${tripId}/end`, data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Erreur lors de la fin du trajet');
    }

    return response.data.trip;
  } catch (error: any) {
    console.error('Error ending trip:', error);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Impossible de terminer le trajet'
    );
  }
};

/**
 * Ajouter un checkpoint GPS au trajet
 */
export const addCheckpoint = async (data: CheckpointData): Promise<void> => {
  try {
    const response = await api.post('/trips/checkpoints', data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Erreur lors de l\'ajout du checkpoint');
    }
  } catch (error: any) {
    // Ne pas throw pour ne pas bloquer le tracking si un checkpoint échoue
    console.error('Error adding checkpoint:', error);
  }
};

/**
 * Récupérer le trajet actif de l'utilisateur
 */
export const getActiveTrip = async (): Promise<Trip | null> => {
  try {
    const response = await api.get('/trips/active');

    if (!response.data.success) {
      return null;
    }

    return response.data.trip;
  } catch (error: any) {
    console.error('Error getting active trip:', error);
    return null;
  }
};

/**
 * Récupérer tous les trajets de l'utilisateur
 */
export const getMyTrips = async (filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Trip[]> => {
  try {
    const response = await api.get('/trips', { params: filters });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Erreur lors de la récupération des trajets');
    }

    return response.data.data;
  } catch (error: any) {
    console.error('Error getting trips:', error);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Impossible de récupérer les trajets'
    );
  }
};

export default {
  startTrip,
  endTrip,
  addCheckpoint,
  getActiveTrip,
  getMyTrips,
};
