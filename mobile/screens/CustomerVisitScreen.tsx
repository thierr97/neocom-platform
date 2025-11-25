import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
}

export default function CustomerVisitScreen({ navigation }: any) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCustomers();
    requestLocationPermission();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchQuery, customers]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');

      if (status === 'granted') {
        getCurrentLocation();
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert('Erreur', 'Impossible d\'obtenir la permission de localisation');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Erreur', 'Impossible d\'obtenir votre position');
    }
  };

  const loadCustomers = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setCustomers(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading customers:', error);
      Alert.alert('Erreur', 'Impossible de charger les clients');
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    if (!searchQuery) {
      setFilteredCustomers(customers.slice(0, 50)); // Limit to 50 for performance
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = customers.filter(
      customer =>
        customer.firstName.toLowerCase().includes(query) ||
        customer.lastName.toLowerCase().includes(query) ||
        customer.companyName?.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query)
    );

    setFilteredCustomers(filtered.slice(0, 50));
  };

  const handleSubmitVisit = async () => {
    if (!selectedCustomer) {
      Alert.alert('Erreur', 'Veuillez sélectionner un client');
      return;
    }

    if (!location && locationPermission) {
      Alert.alert('Erreur', 'Veuillez attendre que votre position soit obtenue');
      return;
    }

    setSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');

      const visitData = {
        customerId: selectedCustomer.id,
        userId: userId,
        visitDate: new Date().toISOString(),
        notes: notes || undefined,
        latitude: location?.coords.latitude,
        longitude: location?.coords.longitude,
        accuracy: location?.coords.accuracy,
      };

      const response = await axios.post(`${API_URL}/gps/visits`, visitData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        Alert.alert(
          'Succès',
          'Visite enregistrée avec succès',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setSelectedCustomer(null);
                setNotes('');
                setSearchQuery('');
                navigation.goBack();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error submitting visit:', error);
      Alert.alert(
        'Erreur',
        error.response?.data?.message || 'Impossible d\'enregistrer la visite'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderCustomerItem = (customer: Customer) => (
    <TouchableOpacity
      key={customer.id}
      style={[
        styles.customerItem,
        selectedCustomer?.id === customer.id && styles.customerItemSelected,
      ]}
      onPress={() => {
        setSelectedCustomer(customer);
        setSearchQuery('');
      }}
    >
      <Text style={styles.customerName}>
        {customer.companyName || `${customer.firstName} ${customer.lastName}`}
      </Text>
      <Text style={styles.customerEmail}>{customer.email}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Location Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Localisation</Text>
        <View style={styles.locationCard}>
          {locationPermission === false ? (
            <>
              <Text style={styles.locationError}>
                Permission de localisation refusée
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={requestLocationPermission}
              >
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </>
          ) : location ? (
            <>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Latitude</Text>
                <Text style={styles.locationValue}>
                  {location.coords.latitude.toFixed(6)}
                </Text>
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Longitude</Text>
                <Text style={styles.locationValue}>
                  {location.coords.longitude.toFixed(6)}
                </Text>
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Précision</Text>
                <Text style={styles.locationValue}>
                  ±{Math.round(location.coords.accuracy)}m
                </Text>
              </View>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={getCurrentLocation}
              >
                <Text style={styles.refreshButtonText}>🔄 Actualiser</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.locationLoading}>
              <ActivityIndicator color="#2563eb" />
              <Text style={styles.locationLoadingText}>
                Obtention de votre position...
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Customer Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Client</Text>

        {selectedCustomer ? (
          <View style={styles.selectedCustomerCard}>
            <View style={styles.selectedCustomerInfo}>
              <Text style={styles.selectedCustomerName}>
                {selectedCustomer.companyName ||
                  `${selectedCustomer.firstName} ${selectedCustomer.lastName}`}
              </Text>
              <Text style={styles.selectedCustomerEmail}>
                {selectedCustomer.email}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
              <Text style={styles.deselectButton}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un client..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
            />

            {searchQuery && (
              <View style={styles.customerList}>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map(renderCustomerItem)
                ) : (
                  <Text style={styles.noResults}>Aucun client trouvé</Text>
                )}
              </View>
            )}
          </>
        )}
      </View>

      {/* Visit Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Notes de visite</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Ajoutez des notes sur cette visite..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Submit Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedCustomer || submitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitVisit}
          disabled={!selectedCustomer || submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Enregistrement...' : '✓ Enregistrer la visite'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationError: {
    color: '#ef4444',
    fontSize: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  locationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  locationLabel: {
    fontSize: 15,
    color: '#6b7280',
  },
  locationValue: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '600',
  },
  refreshButton: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  locationLoadingText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#6b7280',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  customerList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 10,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customerItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  customerItemSelected: {
    backgroundColor: '#e0e7ff',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  noResults: {
    padding: 20,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 15,
  },
  selectedCustomerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCustomerInfo: {
    flex: 1,
  },
  selectedCustomerName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  selectedCustomerEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  deselectButton: {
    fontSize: 24,
    color: '#6b7280',
    padding: 5,
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButton: {
    backgroundColor: '#10b981',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 30,
  },
});
