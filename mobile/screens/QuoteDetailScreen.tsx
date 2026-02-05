import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import documentsAPI from '../src/services/documentsAPI';

export default function QuoteDetailScreen({ route, navigation }: any) {
  const { quote } = route.params || {};
  const [sharing, setSharing] = useState(false);

  if (!quote) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Devis introuvable</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleSharePDF = async () => {
    try {
      setSharing(true);
      const quoteNumber = quote.number || quote.quoteNumber;
      await documentsAPI.quotes.sharePDF(quote.id, quoteNumber);
    } catch (error: any) {
      console.error('Error sharing PDF:', error);
      Alert.alert('Erreur', error.message || 'Impossible de partager le PDF');
    } finally {
      setSharing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return '#666';
      case 'sent':
        return '#007AFF';
      case 'accepted':
        return '#34C759';
      case 'rejected':
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
        return 'Envoyé';
      case 'accepted':
        return 'Accepté';
      case 'rejected':
        return 'Refusé';
      default:
        return status;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.quoteNumber}>{quote.number || quote.quoteNumber}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(quote.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusLabel(quote.status)}</Text>
          </View>
        </View>
      </View>

      {/* Customer Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client</Text>
        <View style={styles.card}>
          <Text style={styles.customerName}>
            {quote.customer?.companyName || `${quote.customer?.firstName} ${quote.customer?.lastName}`}
          </Text>
          {quote.customer?.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={16} color="#666" />
              <Text style={styles.infoText}>{quote.customer.email}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Articles</Text>
        {quote.items?.map((item: any, index: number) => (
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
            <Text style={styles.totalValue}>{quote.subtotal.toFixed(2)} €</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA</Text>
            <Text style={styles.totalValue}>{quote.taxAmount.toFixed(2)} €</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{quote.total.toFixed(2)} €</Text>
          </View>
        </View>
      </View>

      {/* Dates */}
      <View style={styles.section}>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              Valable jusqu'au: {new Date(quote.validUntil).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          {quote.sentAt && (
            <View style={styles.infoRow}>
              <Ionicons name="send-outline" size={16} color="#666" />
              <Text style={styles.infoText}>
                Envoyé le: {new Date(quote.sentAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          )}
          {quote.acceptedAt && (
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#34C759" />
              <Text style={styles.infoText}>
                Accepté le: {new Date(quote.acceptedAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* PDF Actions */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.pdfButton, styles.shareButton]}
          onPress={handleSharePDF}
          disabled={sharing}
        >
          {sharing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="share-outline" size={24} color="#fff" />
              <Text style={styles.pdfButtonText}>Partager PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Actions */}
      {quote.status === 'draft' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Envoyer le devis</Text>
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
  quoteNumber: {
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
    color: '#007AFF',
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
    color: '#007AFF',
  },
  actions: {
    padding: 16,
    paddingBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
  },
  shareButton: {
    backgroundColor: '#34C759',
  },
  pdfButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
