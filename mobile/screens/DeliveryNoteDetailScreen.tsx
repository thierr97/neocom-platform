import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DeliveryNoteDetailScreen({ route, navigation }: any) {
  const { deliveryNote } = route.params;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'delivered':
        return '#34C759';
      default:
        return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'delivered':
        return 'Livré';
      default:
        return status;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.deliveryNoteNumber}>
            {deliveryNote.deliveryNoteNumber || deliveryNote.number}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(deliveryNote.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusLabel(deliveryNote.status)}</Text>
          </View>
        </View>
      </View>

      {/* Customer Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client</Text>
        <View style={styles.card}>
          <Text style={styles.customerName}>
            {deliveryNote.customerName ||
             deliveryNote.customer?.companyName ||
             `${deliveryNote.customer?.firstName} ${deliveryNote.customer?.lastName}`}
          </Text>
          {deliveryNote.customer?.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={16} color="#666" />
              <Text style={styles.infoText}>{deliveryNote.customer.email}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Articles</Text>
        {deliveryNote.items?.map((item: any, index: number) => (
          <View key={item.id || index} style={styles.card}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>
                {item.product?.name || item.description}
              </Text>
              <Text style={styles.itemQuantity}>x{item.quantity}</Text>
            </View>
            {item.product?.sku && (
              <Text style={styles.itemSku}>SKU: {item.product.sku}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Delivery Info */}
      <View style={styles.section}>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              Date de livraison: {new Date(deliveryNote.deliveryDate).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          {deliveryNote.deliveredAt && (
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#34C759" />
              <Text style={styles.infoText}>
                Livré le: {new Date(deliveryNote.deliveredAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Actions */}
      {deliveryNote.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Marquer comme livré</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryNoteNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  itemQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  itemSku: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  actions: {
    padding: 16,
    paddingBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#FF9500',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
