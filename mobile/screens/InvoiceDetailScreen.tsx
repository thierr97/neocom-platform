import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function InvoiceDetailScreen({ route, navigation }: any) {
  const { invoice } = route.params;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return '#666';
      case 'sent':
        return '#007AFF';
      case 'paid':
        return '#34C759';
      case 'overdue':
        return '#FF3B30';
      default:
        return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'sent':
        return 'Envoyée';
      case 'paid':
        return 'Payée';
      case 'overdue':
        return 'En retard';
      default:
        return status;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.invoiceNumber}>{invoice.number || invoice.invoiceNumber}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(invoice.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusLabel(invoice.status)}</Text>
          </View>
        </View>
      </View>

      {/* Customer Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client</Text>
        <View style={styles.card}>
          <Text style={styles.customerName}>
            {invoice.customer?.companyName || `${invoice.customer?.firstName} ${invoice.customer?.lastName}`}
          </Text>
          {invoice.customer?.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={16} color="#666" />
              <Text style={styles.infoText}>{invoice.customer.email}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Articles</Text>
        {invoice.items?.map((item: any, index: number) => (
          <View key={item.id || index} style={styles.card}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>
                {item.product?.name || item.description}
              </Text>
              <Text style={styles.itemPrice}>{item.unitPrice.toFixed(2)} €</Text>
            </View>
            <View style={styles.itemFooter}>
              <Text style={styles.itemQuantity}>Quantité: {item.quantity}</Text>
              <Text style={styles.itemTotal}>{item.total.toFixed(2)} €</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.section}>
        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total</Text>
            <Text style={styles.totalValue}>{invoice.subtotal.toFixed(2)} €</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA</Text>
            <Text style={styles.totalValue}>{invoice.taxAmount.toFixed(2)} €</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{invoice.total.toFixed(2)} €</Text>
          </View>
          {invoice.paidAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Déjà payé</Text>
              <Text style={[styles.totalValue, { color: '#34C759' }]}>
                {invoice.paidAmount.toFixed(2)} €
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Dates */}
      <View style={styles.section}>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              Date d'émission: {new Date(invoice.issueDate).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              Date d'échéance: {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          {invoice.paidAt && (
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#34C759" />
              <Text style={styles.infoText}>
                Payée le: {new Date(invoice.paidAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Actions */}
      {invoice.status === 'draft' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Envoyer la facture</Text>
          </TouchableOpacity>
        </View>
      )}
      {invoice.status === 'sent' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Marquer comme payée</Text>
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
  invoiceNumber: {
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34C759',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
    paddingTop: 12,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34C759',
  },
  actions: {
    padding: 16,
    paddingBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#34C759',
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
