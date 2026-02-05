/**
 * Écran de tracking GPS en temps réel avec visite client intégrée
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
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import VisitReportModal from './VisitReportModal';
import api from '../src/services/api';
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
import { getAuthToken, getCurrentUser } from '../src/services/auth.service';
import {
  startTrip as startTripAPI,
  endTrip as endTripAPI,
  addCheckpoint as addCheckpointAPI,
  getActiveTrip,
  Trip,
} from '../src/services/trip.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TrackingStats {
  distance: number; // en mètres
  duration: number; // en secondes
  checkpoints: number;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
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
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);

  // Client selection states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Visit report modal
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Function to show client selection/creation options
  const showClientActions = () => {
    Alert.alert(
      'Arrêt chez un client',
      'Quel type de client ?',
      [
        {
          text: '👤 Client existant',
          onPress: () => setShowCustomerModal(true),
        },
        {
          text: '✨ Nouveau client',
          onPress: () => {
            navigation.navigate('CreateCustomer');
          },
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  // Function to show actions once customer is selected
  const showActionsForSelectedCustomer = (customer?: Customer) => {
    const targetCustomer = customer || selectedCustomer;
    if (!targetCustomer) return;

    const customerDisplayName = targetCustomer.firstName && targetCustomer.lastName
      ? `${targetCustomer.firstName} ${targetCustomer.lastName}`
      : targetCustomer.companyName || 'ce client';

    Alert.alert(
      'Action chez le client',
      `Que souhaitez-vous faire chez ${customerDisplayName} ?`,
      [
        {
          text: '📝 Rapport de visite',
          onPress: () => setShowVisitModal(true),
        },
        {
          text: '📄 Créer un devis',
          onPress: () => {
            // Naviguer vers la sélection de produits d'abord
            navigation.navigate('ProductSelection', {
              documentType: 'quote',
              customerId: targetCustomer?.id,
              customerName: customerDisplayName,
              customer: targetCustomer,
            });
          },
        },
        {
          text: '🧾 Créer une facture',
          onPress: () => {
            // Naviguer vers la sélection de produits d'abord
            navigation.navigate('ProductSelection', {
              documentType: 'invoice',
              customerId: targetCustomer?.id,
              customerName: customerDisplayName,
              customer: targetCustomer,
            });
          },
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  const mapRef = useRef<MapView>(null);
  const subscriptionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(Date.now());
  const checkpointCounterRef = useRef<number>(0);
  const currentTripRef = useRef<Trip | null>(null); // Ref pour éviter problème de closure
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null); // Ref pour le timer

  useEffect(() => {
    initializeTracking();
    loadCustomers();

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

  useEffect(() => {
    filterCustomers();
  }, [searchQuery, customers]);

  // Recharger les clients quand le modal s'ouvre
  useEffect(() => {
    if (showCustomerModal) {
      console.log('📋 Modal client ouvert - Rechargement des clients...');
      loadCustomers();
    }
  }, [showCustomerModal]);

  const initializeTracking = async () => {
    try {
      // Demander permission GPS
      await requestLocationPermission();

      // Obtenir position initiale
      const initialLocation = await getCurrentLocation();
      setCurrentPosition(initialLocation.coords);
      setTrail([initialLocation.coords]);

      // Vérifier s'il y a un trajet actif
      const activeTrip = await getActiveTrip();
      if (activeTrip) {
        console.log('🚗 Trajet actif trouvé:', activeTrip.id);
        setCurrentTrip(activeTrip);
        currentTripRef.current = activeTrip;

        // Proposer de continuer ou de terminer
        Alert.alert(
          'Trajet en cours',
          'Vous avez un trajet en cours. Que souhaitez-vous faire ?',
          [
            {
              text: 'Continuer le trajet',
              onPress: async () => {
                // Relancer le tracking avec le trajet existant
                setIsTracking(true);
                startTimeRef.current = new Date(activeTrip.startTime).getTime();

                // Connecter WebSocket
                const token = await getAuthToken();
                const user = await getCurrentUser();
                if (token && user) {
                  connectSocket(user.id, token);
                  joinTracking();
                }

                // Démarrer le suivi de position
                subscriptionRef.current = await watchPosition(
                  (location: LocationData) => {
                    handleLocationUpdate(location);
                  },
                  (error: any) => {
                    console.error('Erreur watchPosition:', error);
                  }
                );
              },
            },
            {
              text: 'Terminer le trajet',
              style: 'destructive',
              onPress: async () => {
                try {
                  await endTripAPI(activeTrip.id, {
                    latitude: initialLocation.coords.latitude,
                    longitude: initialLocation.coords.longitude,
                    address: 'Position actuelle',
                  });
                  setCurrentTrip(null);
                  currentTripRef.current = null;
                  Alert.alert('Succès', 'Le trajet précédent a été terminé.');
                } catch (error: any) {
                  console.error('Error ending trip:', error);
                  Alert.alert('Erreur', 'Impossible de terminer le trajet précédent.');
                }
              },
            },
          ]
        );
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Erreur d\'initialisation GPS:', error);
      Alert.alert('Erreur GPS', error.message || 'Impossible d\'accéder à votre position');
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      console.log('🔄 Chargement des clients...');
      const response = await api.get('/customers');

      // L'API retourne customers dans response.data.customers, pas response.data.data
      const customersList = response.data.customers || response.data.data || [];

      if (response.data.success && Array.isArray(customersList)) {
        console.log(`✅ ${customersList.length} clients chargés`);
        setCustomers(customersList);
      } else {
        console.warn('⚠️ Réponse invalide:', response.data);
        setCustomers([]);
      }
    } catch (error: any) {
      console.error('❌ Erreur chargement clients:', error);
      Alert.alert('Erreur', 'Impossible de charger les clients. Vérifiez votre connexion.');
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const filterCustomers = () => {
    if (!customers || !Array.isArray(customers)) {
      console.log('⚠️ Pas de clients à filtrer');
      setFilteredCustomers([]);
      return;
    }

    if (!searchQuery) {
      const result = customers.slice(0, 50);
      console.log(`🔍 Affichage de ${result.length} clients (pas de recherche)`);
      setFilteredCustomers(result);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = customers.filter(
      customer =>
        customer?.firstName?.toLowerCase().includes(query) ||
        customer?.lastName?.toLowerCase().includes(query) ||
        customer?.companyName?.toLowerCase().includes(query) ||
        customer?.email?.toLowerCase().includes(query)
    );

    console.log(`🔍 ${filtered.length} clients correspondent à "${searchQuery}"`);
    setFilteredCustomers(filtered.slice(0, 50));
  };

  // Handler pour les mises à jour de position
  const handleLocationUpdate = (location: LocationData) => {
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

    // Envoyer position via WebSocket (temps réel)
    sendPositionUpdate(location);

    // Sauvegarder checkpoint dans la DB toutes les 2 positions
    checkpointCounterRef.current += 1;
    const trip = currentTripRef.current;
    console.log(`🔢 Position #${checkpointCounterRef.current}, currentTrip: ${trip ? trip.id : 'NULL'}`);

    if (trip && checkpointCounterRef.current % 2 === 0) {
      console.log(`📍 Sauvegarde checkpoint #${checkpointCounterRef.current}...`);
      addCheckpointAPI({
        tripId: trip.id,
        latitude: newPosition.latitude,
        longitude: newPosition.longitude,
        accuracy: newPosition.accuracy,
        speed: location.coords.speed || undefined,
        heading: location.coords.heading || undefined,
      }).then(() => {
        console.log('✅ Checkpoint sauvegardé dans DB');
      }).catch((error) => {
        console.error('❌ Erreur sauvegarde checkpoint:', error.message || error);
      });
    }
  };

  const startTracking = async () => {
    try {
      if (!currentPosition) {
        Alert.alert('Erreur', 'Position GPS non disponible');
        return;
      }

      // 1. Créer le trajet dans la base de données
      const trip = await startTripAPI({
        purpose: 'CLIENT_VISIT',
        objective: 'Visite de prospection',
        vehicleType: 'CAR',
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude,
        address: 'Position de départ',
        estimatedKm: 0,
      });

      setCurrentTrip(trip);
      currentTripRef.current = trip; // Stocker dans la ref pour accès dans callback
      console.log('✅ Trajet créé dans la DB:', trip.id);

      // 2. Connecter au WebSocket avec le vrai userId
      const token = await getAuthToken();
      const user = await getCurrentUser();

      if (token && user) {
        console.log('🔌 Connexion WebSocket pour user:', user.id);
        connectSocket(user.id, token);
        joinTracking();
      } else {
        console.warn('⚠️ Impossible de connecter WebSocket: token ou user manquant');
      }

      // 3. Réinitialiser le compteur de checkpoints
      checkpointCounterRef.current = 0;

      // 4. Démarrer le suivi de position
      subscriptionRef.current = await watchPosition(
        handleLocationUpdate,
        (error) => {
          console.error('Erreur de suivi GPS:', error);
        }
      );

      setIsTracking(true);
      startTimeRef.current = Date.now();

      // Mettre à jour la durée toutes les secondes
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setStats((prevStats) => ({
          ...prevStats,
          duration: elapsed,
        }));
      }, 1000);
    } catch (error: any) {
      console.error('Erreur de démarrage du trajet:', error);
      Alert.alert('Erreur', 'Impossible de démarrer le trajet');
    }
  };

  const stopTracking = async () => {
    try {
      if (subscriptionRef.current) {
        stopWatchingPosition(subscriptionRef.current);
        subscriptionRef.current = null;
      }

      // Arrêter le timer de durée
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      disconnectSocket();
      setIsTracking(false);

      // Terminer le trajet dans la DB
      const trip = currentTripRef.current;
      if (trip && currentPosition) {
        await endTripAPI(trip.id, {
          latitude: currentPosition.latitude,
          longitude: currentPosition.longitude,
          address: 'Position finale',
          notes: `Distance: ${(stats.distance / 1000).toFixed(2)} km - Durée: ${formatDuration(stats.duration)}`,
        });

        console.log('✅ Trajet terminé dans la DB');
        setCurrentTrip(null);
        currentTripRef.current = null;
      }

      Alert.alert(
        'Trajet terminé',
        `Distance: ${(stats.distance / 1000).toFixed(2)} km\nDurée: ${formatDuration(
          stats.duration
        )}\nCheckpoints: ${stats.checkpoints}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Erreur lors de l\'arrêt du tracking:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'arrêt du trajet');
    }
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
      {/* History Button - Top right */}
      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => navigation.navigate('TripHistory')}
      >
        <Ionicons name="time-outline" size={24} color="#007AFF" />
      </TouchableOpacity>

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

        {/* Client Actions Button - Only shown during tracking */}
        {isTracking && currentPosition && (
          <TouchableOpacity
            style={styles.visitButton}
            onPress={showClientActions}
          >
            <Ionicons name="business" size={24} color="#fff" />
            <Text style={styles.visitButtonText}>Arrêt client</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.trackButton, isTracking && styles.trackButtonActive]}
          onPress={isTracking ? stopTracking : startTracking}
        >
          <Ionicons name={isTracking ? 'stop' : 'play'} size={32} color="#fff" />
          <Text style={styles.trackButtonText}>
            {isTracking ? 'Arrêter' : 'Démarrer'} le trajet
          </Text>
        </TouchableOpacity>
      </View>

      {/* Customer Selection Modal */}
      <Modal
        visible={showCustomerModal}
        animationType="slide"
        onRequestClose={() => setShowCustomerModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
              <Ionicons name="close" size={28} color="#1f2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sélectionner un client</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un client..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {!loadingCustomers && (
            <Text style={styles.clientCount}>
              {filteredCustomers.length} client{filteredCustomers.length > 1 ? 's' : ''} trouvé{filteredCustomers.length > 1 ? 's' : ''}
            </Text>
          )}

          <ScrollView style={styles.customerList}>
            {loadingCustomers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Chargement des clients...</Text>
              </View>
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <TouchableOpacity
                  key={customer.id}
                  style={styles.customerItem}
                  onPress={() => {
                    setSelectedCustomer(customer);
                    setSearchQuery('');
                    setShowCustomerModal(false);
                    // Show actions menu after selection
                    setTimeout(() => {
                      showActionsForSelectedCustomer(customer);
                    }, 300);
                  }}
                >
                  <View style={styles.customerItemContent}>
                    <Text style={styles.customerItemName}>
                      {customer.firstName && customer.lastName
                        ? `${customer.firstName} ${customer.lastName}`
                        : customer.companyName || 'Client sans nom'}
                    </Text>
                    {customer.companyName && customer.firstName && (
                      <Text style={styles.customerItemCompany}>
                        {customer.companyName}
                      </Text>
                    )}
                    <Text style={styles.customerItemEmail}>{customer.email}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noResults}>Aucun client trouvé</Text>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Visit Report Modal */}
      {selectedCustomer && currentPosition && (
        <VisitReportModal
          visible={showVisitModal}
          onClose={() => setShowVisitModal(false)}
          customerId={selectedCustomer.id}
          customerName={
            selectedCustomer.firstName && selectedCustomer.lastName
              ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
              : selectedCustomer.companyName || 'Client'
          }
          latitude={currentPosition.latitude}
          longitude={currentPosition.longitude}
          onSuccess={() => {
            // Increment checkpoints counter
            setStats(prev => ({ ...prev, checkpoints: prev.checkpoints + 1 }));
          }}
        />
      )}
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
  historyButton: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
  visitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  visitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
  },
  clientCount: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  customerList: {
    flex: 1,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  customerItemContent: {
    flex: 1,
  },
  customerItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  customerItemCompany: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
    marginBottom: 4,
  },
  customerItemEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  noResults: {
    padding: 40,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
  },
});

export default GPSTrackingScreen;
