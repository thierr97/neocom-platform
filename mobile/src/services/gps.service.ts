/**
 * Service de géolocalisation GPS
 */
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK_NAME = 'background-location-task';

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

export interface LocationData {
  coords: Coordinates;
  timestamp: number;
}

/**
 * Demander la permission d'accès à la localisation
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

    if (foregroundStatus !== 'granted') {
      throw new Error('Permission de localisation refusée');
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la demande de permission GPS:', error);
    throw error;
  }
};

/**
 * Demander la permission d'accès à la localisation en arrière-plan
 */
export const requestBackgroundLocationPermission = async (): Promise<boolean> => {
  try {
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

    if (backgroundStatus !== 'granted') {
      throw new Error('Permission de localisation en arrière-plan refusée');
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la demande de permission GPS en arrière-plan:', error);
    throw error;
  }
};

/**
 * Obtenir la position actuelle de l'utilisateur
 */
export const getCurrentLocation = async (): Promise<LocationData> => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      coords: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        altitude: location.coords.altitude,
        altitudeAccuracy: location.coords.altitudeAccuracy,
        heading: location.coords.heading,
        speed: location.coords.speed,
      },
      timestamp: location.timestamp,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération de la position:', error);
    throw new Error('Impossible de récupérer votre position');
  }
};

/**
 * Surveiller la position en temps réel (premier plan)
 */
export const watchPosition = async (
  callback: (location: LocationData) => void,
  errorCallback?: (error: Error) => void
): Promise<Location.LocationSubscription> => {
  try {
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // 5 secondes
        distanceInterval: 10, // 10 mètres
      },
      (location) => {
        callback({
          coords: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined,
            altitude: location.coords.altitude,
            altitudeAccuracy: location.coords.altitudeAccuracy,
            heading: location.coords.heading,
            speed: location.coords.speed,
          },
          timestamp: location.timestamp,
        });
      }
    );

    return subscription;
  } catch (error: any) {
    console.error('Erreur lors de la surveillance de la position:', error);
    if (errorCallback) {
      errorCallback(error);
    }
    throw error;
  }
};

/**
 * Arrêter la surveillance de la position
 */
export const stopWatchingPosition = (subscription: Location.LocationSubscription): void => {
  if (subscription) {
    subscription.remove();
  }
};

/**
 * Définir la tâche de tracking en arrière-plan
 */
export const defineBackgroundLocationTask = (
  callback: (locations: LocationData[]) => void
): void => {
  TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }: any) => {
    if (error) {
      console.error('Erreur de tracking en arrière-plan:', error);
      return;
    }

    if (data) {
      const { locations } = data;
      const formattedLocations: LocationData[] = locations.map((loc: any) => ({
        coords: {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy || undefined,
          altitude: loc.coords.altitude,
          altitudeAccuracy: loc.coords.altitudeAccuracy,
          heading: loc.coords.heading,
          speed: loc.coords.speed,
        },
        timestamp: loc.timestamp,
      }));

      callback(formattedLocations);
    }
  });
};

/**
 * Démarrer le tracking GPS en arrière-plan
 */
export const startBackgroundLocationTracking = async (): Promise<void> => {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);

    if (hasStarted) {
      console.log('Le tracking GPS est déjà actif');
      return;
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 10000, // 10 secondes
      distanceInterval: 10, // 10 mètres
      foregroundService: {
        notificationTitle: 'NEOSERV - Trajet en cours',
        notificationBody: 'Suivi de votre position en cours',
      },
    });

    console.log('Tracking GPS en arrière-plan démarré');
  } catch (error) {
    console.error('Erreur lors du démarrage du tracking en arrière-plan:', error);
    throw new Error('Impossible de démarrer le tracking GPS');
  }
};

/**
 * Arrêter le tracking GPS en arrière-plan
 */
export const stopBackgroundLocationTracking = async (): Promise<void> => {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);

    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      console.log('Tracking GPS en arrière-plan arrêté');
    }
  } catch (error) {
    console.error('Erreur lors de l\'arrêt du tracking en arrière-plan:', error);
    throw error;
  }
};

/**
 * Calculer la distance entre deux points GPS (en mètres)
 * Utilise la formule de Haversine
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance en mètres
};
