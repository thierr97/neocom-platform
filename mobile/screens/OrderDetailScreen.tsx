import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalPrice: number;
  product: {
    name: string;
    sku: string;
    image?: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  taxAmount: number;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    companyName?: string;
  };
  shippingAddress?: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  items: OrderItem[];
}

export default function OrderDetailScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetail();
  }, [orderId]);

  const loadOrderDetail = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setOrder(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading order:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la commande');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.patch(
        `${API_URL}/orders/${orderId}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setOrder(response.data.data);
        Alert.alert('Succès', 'Statut de la commande mis à jour');
      }
    } catch (error: any) {
      console.error('Error updating order:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  const handleStatusChange = () => {
    const statusOptions = [
      { label: 'Brouillon', value: 'DRAFT' },
      { label: 'En attente', value: 'PENDING' },
      { label: 'Confirmée', value: 'CONFIRMED' },
      { label: 'En préparation', value: 'PROCESSING' },
      { label: 'Expédiée', value: 'SHIPPED' },
      { label: 'Livrée', value: 'DELIVERED' },
      { label: 'Annulée', value: 'CANCELLED' },
    ];

    Alert.alert(
      'Changer le statut',
      'Sélectionnez le nouveau statut',
      statusOptions.map(option => ({
        text: option.label,
        onPress: () => updateOrderStatus(option.value),
      })).concat([
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ])
    );
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text>Commande introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Order Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <TouchableOpacity onPress={handleStatusChange}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(order.status) },
              ]}
            >
              <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
            </View>
          </TouchableOpacity>
        </View>
        <Text style={styles.orderDate}>Créée le {formatDate(order.createdAt)}</Text>
        {order.updatedAt !== order.createdAt && (
          <Text style={styles.orderDate}>Modifiée le {formatDate(order.updatedAt)}</Text>
        )}
      </View>

      {/* Customer Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Nom</Text>
          <Text style={styles.infoValue}>
            {order.customer.companyName ||
              `${order.customer.firstName} ${order.customer.lastName}`}
          </Text>

          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{order.customer.email}</Text>

          {order.customer.phone && (
            <>
              <Text style={styles.infoLabel}>Téléphone</Text>
              <Text style={styles.infoValue}>{order.customer.phone}</Text>
            </>
          )}
        </View>
      </View>

      {/* Shipping Address */}
      {order.shippingAddress && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adresse de livraison</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoValue}>{order.shippingAddress.address}</Text>
            <Text style={styles.infoValue}>
              {order.shippingAddress.postalCode} {order.shippingAddress.city}
            </Text>
            <Text style={styles.infoValue}>{order.shippingAddress.country}</Text>
          </View>
        </View>
      )}

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Articles ({order.items.length})</Text>
        {order.items.map(item => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text style={styles.itemPrice}>{formatAmount(item.totalPrice)}</Text>
            </View>
            <Text style={styles.itemSku}>SKU: {item.product.sku}</Text>
            <View style={styles.itemDetails}>
              <Text style={styles.itemDetailText}>
                Quantité: {item.quantity}
              </Text>
              <Text style={styles.itemDetailText}>
                Prix unitaire: {formatAmount(item.unitPrice)}
              </Text>
              <Text style={styles.itemDetailText}>
                TVA: {item.taxRate}%
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Order Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Résumé</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sous-total HT</Text>
            <Text style={styles.summaryValue}>{formatAmount(order.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>TVA</Text>
            <Text style={styles.summaryValue}>{formatAmount(order.taxAmount)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total TTC</Text>
            <Text style={styles.summaryTotalValue}>
              {formatAmount(order.totalAmount)}
            </Text>
          </View>
        </View>
      </View>

      {/* Notes */}
      {order.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoValue}>{order.notes}</Text>
          </View>
        </View>
      )}

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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    marginTop: 15,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 10,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#1f2937',
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginLeft: 10,
  },
  itemSku: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  itemDetailText: {
    fontSize: 13,
    color: '#374151',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
  summaryTotal: {
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
    paddingTop: 15,
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  bottomSpacing: {
    height: 30,
  },
});
