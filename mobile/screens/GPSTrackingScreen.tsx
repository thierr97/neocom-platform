/**
 * Écran de tracking GPS en temps réel
 * Style Uber Eats - position en direct sur carte
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import {
  getCurrentLocation,
  watchPosition,
  stopWatchingPosition,
  requestLocationPermission,
  LocationData,
  Coordinates,
} from '../src/services/gps.service';
import {
  connectSocket,
  disconnectSocket,
  sendPositionUpdate,
  joinTracking,
} from '../src/services/socket.service';
import { getAuthToken } from '../src/services/auth.service';

interface TrackingStats {
  distance: number; // en mètres
  duration: number; // en secondes
  checkpoints: number;
}

const GPSTrackingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<Coordinates | null>(null);
  const [trail, setTrail] = useState<Coordinates[]>([]);
  const [stats, setStats] = useState<TrackingStats>({
    distance: 0,
    duration: 0,
    checkpoints: 0,
  });
  const [loading, setLoading] = useState(true);

  const mapRef = useRef<MapView>(null);
  const subscriptionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    initializeTracking();

    return () => {
      cleanupTracking();
    };
  }, []);

  useEffect(() => {
    if (isTracking && currentPosition) {
      // Mettre à jour la caméra de la carte
      mapRef.current?.animateCamera({
        center: {
          latitude: currentPosition.latitude,
          longitude: currentPosition.longitude,
        },
        zoom: 16,
      });
    }
  }, [currentPosition, isTracking]);

  const initializeTracking = async () => {
    try {
      // Demander permission GPS
      await requestLocationPermission();

      // Obtenir position initiale
      const initialLocation = await getCurrentLocation();
      setCurrentPosition(initialLocation.coords);
      setTrail([initialLocation.coords]);
      setLoading(false);
    } catch (error: any) {
      console.error('Erreur d\'initialisation GPS:', error);
      Alert.alert('Erreur GPS', error.message || 'Impossible d\'accéder à votre position');
      setLoading(false);
    }
  };

  const startTracking = async () => {
    try {
      // Connecter au WebSocket
      const token = await getAuthToken();
      if (token) {
        const userId = 'user-id'; // À remplacer par le vrai user ID
        connectSocket(userId, token);
        joinTracking();
      }

      // Démarrer le suivi de position
      subscriptionRef.current = await watchPosition(
        (location: LocationData) => {
          const newPosition = location.coords;
          setCurrentPosition(newPosition);

          // Ajouter au trail
          setTrail((prevTrail) => {
            const updatedTrail = [...prevTrail, newPosition];

            // Calculer distance
            if (prevTrail.length > 0) {
              const lastPos = prevTrail[prevTrail.length - 1];
              const distance = calculateDistance(
                lastPos.latitude,
                lastPos.longitude,
                newPosition.latitude,
                newPosition.longitude
              );

              setStats((prevStats) => ({
                ...prevStats,
                distance: prevStats.distance + distance,
                checkpoints: prevStats.checkpoints + 1,
              }));
            }

            return updatedTrail;
          });

          // Envoyer position via WebSocket
          sendPositionUpdate(location);
        },
        (error) => {
          console.error('Erreur de suivi GPS:', error);
        }
      );

      setIsTracking(true);
      startTimeRef.current = Date.now();

      // Mettre à jour la durée toutes les secondes
      const durationInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setStats((prevStats) => ({
          ...prevStats,
          duration: elapsed,
        }));
      }, 1000);

      return () => clearInterval(durationInterval);
    } catch (error: any) {
      console.error('Erreur de démarrage du tracking:', error);
      Alert.alert('Erreur', 'Impossible de démarrer le tracking');
    }
  };

  const stopTracking = () => {
    if (subscriptionRef.current) {
      stopWatchingPosition(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    disconnectSocket();
    setIsTracking(false);

    Alert.alert(
      'Tracking terminé',
      `Distance: ${(stats.distance / 1000).toFixed(2)} km\nDurée: ${formatDuration(
        stats.duration
      )}\nCheckpoints: ${stats.checkpoints}`,
      [{ text: 'OK' }]
    );
  };

  const cleanupTracking = () => {
    if (subscriptionRef.current) {
      stopWatchingPosition(subscriptionRef.current);
    }
    disconnectSocket();
  };

  const centerOnUser = () => {
    if (currentPosition && mapRef.current) {
      mapRef.current.animateCamera({
        center: {
          latitude: currentPosition.latitude,
          longitude: currentPosition.longitude,
        },
        zoom: 16,
      });
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initialisation du GPS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      {currentPosition && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: currentPosition.latitude,
            longitude: currentPosition.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
        >
          {/* Trail (trajet) */}
          {trail.length > 1 && (
            <Polyline
              coordinates={trail}
              strokeColor="#007AFF"
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Position actuelle */}
          <Marker
            coordinate={{
              latitude: currentPosition.latitude,
              longitude: currentPosition.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.markerContainer}>
              <View style={styles.markerDot} />
              <Circle
                center={{
                  latitude: currentPosition.latitude,
                  longitude: currentPosition.longitude,
                }}
                radius={currentPosition.accuracy || 50}
                strokeColor="rgba(0, 122, 255, 0.3)"
                fillColor="rgba(0, 122, 255, 0.1)"
              />
            </View>
          </Marker>
        </MapView>
      )}

      {/* Stats Panel */}
      <View style={styles.statsPanel}>
        <View style={styles.statItem}>
          <Ionicons name="navigate" size={24} color="#007AFF" />
          <Text style={styles.statValue}>{(stats.distance / 1000).toFixed(2)} km</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="time" size={24} color="#007AFF" />
          <Text style={styles.statValue}>{formatDuration(stats.duration)}</Text>
          <Text style={styles.statLabel}>Durée</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="location" size={24} color="#007AFF" />
          <Text style={styles.statValue}>{stats.checkpoints}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.centerButton} onPress={centerOnUser}>
          <Ionicons name="locate" size={24} color="#007AFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.trackButton, isTracking && styles.trackButtonActive]}
          onPress={isTracking ? stopTracking : startTracking}
        >
          <Ionicons name={isTracking ? 'stop' : 'play'} size={32} color="#fff" />
          <Text style={styles.trackButtonText}>
            {isTracking ? 'Arrêter' : 'Démarrer'} le tracking
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  statsPanel: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginHorizontal: 8,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  centerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  trackButtonActive: {
    backgroundColor: '#FF3B30',
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default GPSTrackingScreen;
