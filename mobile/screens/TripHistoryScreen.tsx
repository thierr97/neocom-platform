/**
 * Écran d'historique des trajets avec carte GPS et rapports de visites
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/services/api';
import { getMyTrips, Trip } from '../src/services/trip.service';

interface Visit {
  id: string;
  customerId: string;
  visitDate: string;
  title: string;
  notes: string;
  latitude: number;
  longitude: number;
  photoUrl?: string;
  customer: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
  };
}

interface TripWithCheckpoints extends Trip {
  checkpoints: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
  }>;
  visits?: Visit[];
}

export default function TripHistoryScreen({ navigation }: any) {
  const [trips, setTrips] = useState<TripWithCheckpoints[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripWithCheckpoints | null>(null);
  const [filter, setFilter] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    loadTrips();
  }, [filter]);

  const loadTrips = async () => {
    try {
      setLoading(true);

      // Calculer les dates en fonction du filtre
      const now = new Date();
      let startDate = new Date();

      switch (filter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      // Charger les trajets
      const tripsData = await getMyTrips({
        status: 'COMPLETED',
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      });

      // Vérifier que tripsData est un tableau valide
      if (!tripsData || !Array.isArray(tripsData)) {
        console.log('⚠️ Aucun trajet trouvé ou format invalide');
        setTrips([]);
        return;
      }

      // Charger les checkpoints et visites pour chaque trajet
      const tripsWithDetails = await Promise.all(
        tripsData.map(async (trip) => {
          try {
            // Charger les checkpoints
            const checkpointsResponse = await api.get(`/trips/${trip.id}/checkpoints`);
            const checkpoints = checkpointsResponse.data.checkpoints || [];

            // Charger les visites
            const visitsResponse = await api.get(`/gps/visits`, {
              params: {
                tripId: trip.id,
              },
            });
            const visits = visitsResponse.data.visits || visitsResponse.data.data || [];

            return {
              ...trip,
              checkpoints,
              visits,
            };
          } catch (error) {
            console.error(`Error loading details for trip ${trip.id}:`, error);
            return {
              ...trip,
              checkpoints: [],
              visits: [],
            };
          }
        })
      );

      setTrips(tripsWithDetails);

      // Sélectionner le premier trajet par défaut
      if (tripsWithDetails.length > 0 && !selectedTrip) {
        setSelectedTrip(tripsWithDetails[0]);
      }
    } catch (error: any) {
      console.error('Error loading trips:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'historique des trajets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTrips();
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '0 min';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTripCard = (trip: TripWithCheckpoints) => {
    const isSelected = selectedTrip?.id === trip.id;
    const customerDisplayName = trip.visits && trip.visits.length > 0
      ? trip.visits.map(v =>
          v.customer.firstName && v.customer.lastName
            ? `${v.customer.firstName} ${v.customer.lastName}`
            : v.customer.companyName || 'Client'
        ).join(', ')
      : 'Pas de visite';

    return (
      <TouchableOpacity
        key={trip.id}
        style={[styles.tripCard, isSelected && styles.tripCardSelected]}
        onPress={() => setSelectedTrip(trip)}
      >
        <View style={styles.tripCardHeader}>
          <View style={styles.tripCardIcon}>
            <Ionicons name="car" size={24} color="#007AFF" />
          </View>
          <View style={styles.tripCardInfo}>
            <Text style={styles.tripCardDate}>{formatDate(trip.startTime)}</Text>
            <Text style={styles.tripCardCustomer} numberOfLines={1}>
              {customerDisplayName}
            </Text>
          </View>
        </View>

        <View style={styles.tripCardStats}>
          <View style={styles.tripCardStat}>
            <Ionicons name="navigate" size={16} color="#666" />
            <Text style={styles.tripCardStatText}>
              {trip.distanceKm ? `${trip.distanceKm.toFixed(1)} km` : '0 km'}
            </Text>
          </View>
          <View style={styles.tripCardStat}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={styles.tripCardStatText}>
              {formatDuration(trip.durationMinutes)}
            </Text>
          </View>
          <View style={styles.tripCardStat}>
            <Ionicons name="people" size={16} color="#666" />
            <Text style={styles.tripCardStatText}>
              {trip.visits?.length || 0} visite(s)
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMap = () => {
    if (!selectedTrip || selectedTrip.checkpoints.length === 0) {
      return (
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={48} color="#ccc" />
          <Text style={styles.mapPlaceholderText}>Aucune trace GPS disponible</Text>
        </View>
      );
    }

    const coordinates = selectedTrip.checkpoints.map(cp => ({
      latitude: cp.latitude,
      longitude: cp.longitude,
    }));

    // Calculer la région initiale
    const latitudes = coordinates.map(c => c.latitude);
    const longitudes = coordinates.map(c => c.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const region = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) * 1.5 || 0.01,
      longitudeDelta: (maxLng - minLng) * 1.5 || 0.01,
    };

    return (
      <MapView
        style={styles.map}
        initialRegion={region}
      >
        {/* Trace GPS */}
        <Polyline
          coordinates={coordinates}
          strokeColor="#007AFF"
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
        />

        {/* Marqueur de départ */}
        <Marker
          coordinate={coordinates[0]}
          title="Départ"
          pinColor="green"
        />

        {/* Marqueur d'arrivée */}
        <Marker
          coordinate={coordinates[coordinates.length - 1]}
          title="Arrivée"
          pinColor="red"
        />

        {/* Marqueurs des visites */}
        {selectedTrip.visits?.map((visit) => (
          <Marker
            key={visit.id}
            coordinate={{
              latitude: visit.latitude,
              longitude: visit.longitude,
            }}
            title={visit.title}
            description={`${visit.customer.firstName || ''} ${visit.customer.lastName || visit.customer.companyName || ''}`}
            pinColor="purple"
          >
            <View style={styles.customMarker}>
              <Ionicons name="business" size={24} color="#fff" />
            </View>
          </Marker>
        ))}
      </MapView>
    );
  };

  const renderVisits = () => {
    if (!selectedTrip || !selectedTrip.visits || selectedTrip.visits.length === 0) {
      return (
        <View style={styles.noVisits}>
          <Ionicons name="information-circle-outline" size={32} color="#999" />
          <Text style={styles.noVisitsText}>Aucune visite enregistrée</Text>
        </View>
      );
    }

    return selectedTrip.visits.map((visit) => (
      <View key={visit.id} style={styles.visitCard}>
        <View style={styles.visitHeader}>
          <Ionicons name="business" size={24} color="#007AFF" />
          <View style={styles.visitInfo}>
            <Text style={styles.visitTitle}>{visit.title}</Text>
            <Text style={styles.visitCustomer}>
              {visit.customer.firstName && visit.customer.lastName
                ? `${visit.customer.firstName} ${visit.customer.lastName}`
                : visit.customer.companyName || 'Client'}
            </Text>
          </View>
        </View>
        <Text style={styles.visitNotes}>{visit.notes}</Text>
        <Text style={styles.visitDate}>{formatDate(visit.visitDate)}</Text>
      </View>
    ));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement de l'historique...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historique des trajets</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Filtres */}
      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'today' && styles.filterButtonActive]}
          onPress={() => setFilter('today')}
        >
          <Text style={[styles.filterText, filter === 'today' && styles.filterTextActive]}>
            Aujourd'hui
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'week' && styles.filterButtonActive]}
          onPress={() => setFilter('week')}
        >
          <Text style={[styles.filterText, filter === 'week' && styles.filterTextActive]}>
            7 jours
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'month' && styles.filterButtonActive]}
          onPress={() => setFilter('month')}
        >
          <Text style={[styles.filterText, filter === 'month' && styles.filterTextActive]}>
            30 jours
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Liste des trajets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Trajets ({trips.length})
          </Text>
          {trips.length === 0 ? (
            <View style={styles.noTrips}>
              <Ionicons name="car-outline" size={48} color="#ccc" />
              <Text style={styles.noTripsText}>Aucun trajet pour cette période</Text>
            </View>
          ) : (
            trips.map(renderTripCard)
          )}
        </View>

        {/* Carte */}
        {selectedTrip && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tracé GPS</Text>
            <View style={styles.mapContainer}>
              {renderMap()}
            </View>
          </View>
        )}

        {/* Visites */}
        {selectedTrip && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Visites ({selectedTrip.visits?.length || 0})
            </Text>
            {renderVisits()}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#007AFF',
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  filters: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tripCardSelected: {
    borderColor: '#007AFF',
  },
  tripCardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tripCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tripCardInfo: {
    flex: 1,
  },
  tripCardDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  tripCardCustomer: {
    fontSize: 14,
    color: '#6b7280',
  },
  tripCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tripCardStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripCardStatText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9333ea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  visitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  visitHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  visitInfo: {
    flex: 1,
    marginLeft: 12,
  },
  visitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  visitCustomer: {
    fontSize: 14,
    color: '#007AFF',
  },
  visitNotes: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  visitDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  noTrips: {
    padding: 40,
    alignItems: 'center',
  },
  noTripsText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
  noVisits: {
    padding: 40,
    alignItems: 'center',
  },
  noVisitsText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
});
