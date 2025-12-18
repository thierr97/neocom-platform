/**
 * Écran de liste des clients
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCustomers, Customer, CustomerFilters } from '../src/services/customers.service';
import { getCurrentLocation } from '../src/services/gps.service';

interface Props {
  navigation: any;
}

const CustomersScreen: React.FC<Props> = ({ navigation }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | 'INDIVIDUAL' | 'COMPANY'>('ALL');

  useEffect(() => {
    loadCustomers();
  }, [selectedType]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const filters: CustomerFilters = {};

      if (searchQuery) {
        filters.search = searchQuery;
      }

      if (selectedType !== 'ALL') {
        filters.type = selectedType;
      }

      const data = await getCustomers(filters);
      setCustomers(data);
    } catch (error: any) {
      console.error('Erreur de chargement des clients:', error);
      // Ne pas afficher d'alerte si c'est juste un problème de permissions ou endpoint manquant
      // L'utilisateur verra simplement une liste vide avec un message approprié
      if (error.response?.status !== 403 && error.response?.status !== 404) {
        alert(error.message || 'Erreur de chargement');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCustomers();
  };

  const handleSearch = () => {
    loadCustomers();
  };

  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity
      style={styles.customerCard}
      onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })}
    >
      <View style={styles.customerHeader}>
        <Ionicons
          name={item.type === 'COMPANY' ? 'business' : 'person'}
          size={24}
          color="#007AFF"
        />
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          <Text style={styles.customerType}>
            {item.type === 'COMPANY' ? 'Entreprise' : 'Particulier'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#999" />
      </View>

      <View style={styles.customerDetails}>
        {item.email && (
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.email}</Text>
          </View>
        )}
        {item.phone && (
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
        )}
        {item.city && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {item.city} {item.zipCode}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes Clients</Text>
        {/* TODO: Ajouter l'écran CreateCustomer
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateCustomer')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
        */}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un client..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Type Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, selectedType === 'ALL' && styles.filterButtonActive]}
          onPress={() => setSelectedType('ALL')}
        >
          <Text style={[styles.filterText, selectedType === 'ALL' && styles.filterTextActive]}>
            Tous
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedType === 'INDIVIDUAL' && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedType('INDIVIDUAL')}
        >
          <Text
            style={[
              styles.filterText,
              selectedType === 'INDIVIDUAL' && styles.filterTextActive,
            ]}
          >
            Particuliers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedType === 'COMPANY' && styles.filterButtonActive]}
          onPress={() => setSelectedType('COMPANY')}
        >
          <Text
            style={[styles.filterText, selectedType === 'COMPANY' && styles.filterTextActive]}
          >
            Entreprises
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des clients...</Text>
        </View>
      ) : (
        <FlatList
          data={customers}
          renderItem={renderCustomerItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Aucun client trouvé</Text>
              <Text style={styles.emptySubtext}>
                Commencez par ajouter vos premiers clients
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  customerType: {
    fontSize: 14,
    color: '#666',
  },
  customerDetails: {
    marginLeft: 36,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
  },
});

export default CustomersScreen;
