import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import api from '../src/services/api';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
    companyName?: string;
  };
}

export default function OrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchQuery, statusFilter, orders]);

  const loadOrders = async () => {
    try {
      const response = await api.get('/orders');

      if (response?.data?.success && Array.isArray(response.data.data)) {
        setOrders(response.data.data);
      } else {
        setOrders([]);
      }
    } catch (error: any) {
      console.error('Error loading orders:', error);
      setOrders([]);
      Alert.alert('Erreur', 'Impossible de charger les commandes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterOrders = () => {
    if (!orders || !Array.isArray(orders)) {
      setFilteredOrders([]);
      return;
    }

    let filtered = [...orders];

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(order => order?.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        order =>
          order?.orderNumber?.toLowerCase().includes(query) ||
          order?.customer?.firstName?.toLowerCase().includes(query) ||
          order?.customer?.lastName?.toLowerCase().includes(query) ||
          order?.customer?.companyName?.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return '#6b7280';
      case 'PENDING':
        return '#f59e0b';
      case 'CONFIRMED':
        return '#3b82f6';
      case 'PROCESSING':
        return '#8b5cf6';
      case 'SHIPPED':
        return '#06b6d4';
      case 'DELIVERED':
        return '#10b981';
      case 'CANCELLED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      DRAFT: 'Brouillon',
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      PROCESSING: 'En préparation',
      SHIPPED: 'Expédiée',
      DELIVERED: 'Livrée',
      CANCELLED: 'Annulée',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    if (!item || !item.id) return null;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>{item.orderNumber || 'N/A'}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status || 'DRAFT') },
            ]}
          >
            <Text style={styles.statusText}>{getStatusLabel(item.status || 'DRAFT')}</Text>
          </View>
        </View>

        <View style={styles.orderInfo}>
          <Text style={styles.customerName}>
            {item.customer?.companyName || `${item.customer?.firstName || ''} ${item.customer?.lastName || ''}` || 'Client'}
          </Text>
          <Text style={styles.orderDate}>{item.createdAt ? formatDate(item.createdAt) : ''}</Text>
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.orderAmount}>{formatAmount(item.totalAmount || 0)}</Text>
          <Text style={styles.viewDetails}>Voir détails ›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const StatusFilterButton = ({ status, label }: { status: string; label: string }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        statusFilter === status && styles.filterButtonActive,
      ]}
      onPress={() => setStatusFilter(status)}
    >
      <Text
        style={[
          styles.filterButtonText,
          statusFilter === status && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une commande..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Status Filters */}
      <View style={styles.filtersContainer}>
        <StatusFilterButton status="ALL" label="Toutes" />
        <StatusFilterButton status="PENDING" label="En attente" />
        <StatusFilterButton status="CONFIRMED" label="Confirmées" />
        <StatusFilterButton status="DELIVERED" label="Livrées" />
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune commande trouvée</Text>
          </View>
        }
      />
    </View>
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
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 15,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderInfo: {
    marginBottom: 10,
  },
  customerName: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
    color: '#6b7280',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  viewDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
