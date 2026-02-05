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
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import api from '../src/services/api';

interface Product {
  productId: string;
  productName: string;
  productSku: string;
  totalQuantity: number;
  totalAmount: number;
  occurrences: number;
  inQuotes: number;
  inOrders: number;
  inInvoices: number;
  lastOrderDate: string;
}

interface Quote {
  id: string;
  number: string;
  status: string;
  total: number;
  createdAt: string;
}

interface Order {
  id: string;
  number: string;
  status: string;
  total: number;
  createdAt: string;
}

interface Invoice {
  id: string;
  number: string;
  status: string;
  total: number;
  paidAmount: number;
  issueDate: string;
}

interface Customer {
  id: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email: string;
  phone?: string;
  type: string;
  quotes?: Quote[];
  orders?: Order[];
  invoices?: Invoice[];
}

export default function CustomerDetailScreen({ route, navigation }: any) {
  const { customerId } = route.params;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [productHistory, setProductHistory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'quotes' | 'orders' | 'invoices'>('products');

  useEffect(() => {
    loadData();
  }, [customerId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [customerResponse, historyResponse] = await Promise.all([
        api.get(`/customers/${customerId}`),
        api.get(`/customers/${customerId}/product-history`),
      ]);

      if (customerResponse.data.success) {
        setCustomer(customerResponse.data.customer);
      }

      if (historyResponse.data.success) {
        setProductHistory(historyResponse.data.products);
      }
    } catch (error: any) {
      console.error('Error loading customer data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données du client');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleShareDocument = async (type: 'quote' | 'invoice' | 'order', docId: string, docNumber: string) => {
    try {
      const endpoint = type === 'quote' ? 'quotes' : type === 'invoice' ? 'invoices' : 'orders';
      const response = await api.get(`/${endpoint}/${docId}/pdf`, { responseType: 'arraybuffer' });

      const filename = `${type === 'quote' ? 'Devis' : type === 'invoice' ? 'Facture' : 'Commande'}-${docNumber}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, response.data as string, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Erreur', 'Le partage n\'est pas disponible sur cet appareil');
      }
    } catch (error: any) {
      console.error('Error sharing document:', error);
      Alert.alert('Erreur', 'Impossible de partager le document');
    }
  };

  const handleCollectPayment = (invoice: Invoice) => {
    navigation.navigate('Payment', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      totalAmount: invoice.total,
      paidAmount: invoice.paidAmount || 0,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getCustomerName = () => {
    if (customer?.type === 'COMPANY') {
      return customer.companyName || 'Entreprise';
    }
    return `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() || 'Client';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      DRAFT: '#6B7280',
      PENDING: '#F59E0B',
      SENT: '#3B82F6',
      ACCEPTED: '#10B981',
      CONFIRMED: '#10B981',
      PAID: '#10B981',
      REJECTED: '#EF4444',
      CANCELLED: '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Client non trouvé</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{getCustomerName()}</Text>
          <Text style={styles.headerSubtitle}>{customer.email}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'products' && styles.activeTab]}
          onPress={() => setActiveTab('products')}
        >
          <Ionicons
            name="cube-outline"
            size={20}
            color={activeTab === 'products' ? '#2563EB' : '#6B7280'}
          />
          <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
            Produits
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'quotes' && styles.activeTab]}
          onPress={() => setActiveTab('quotes')}
        >
          <Ionicons
            name="document-text-outline"
            size={20}
            color={activeTab === 'quotes' ? '#2563EB' : '#6B7280'}
          />
          <Text style={[styles.tabText, activeTab === 'quotes' && styles.activeTabText]}>
            Devis ({customer.quotes?.length || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
          onPress={() => setActiveTab('orders')}
        >
          <Ionicons
            name="cart-outline"
            size={20}
            color={activeTab === 'orders' ? '#2563EB' : '#6B7280'}
          />
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
            Commandes ({customer.orders?.length || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'invoices' && styles.activeTab]}
          onPress={() => setActiveTab('invoices')}
        >
          <Ionicons
            name="receipt-outline"
            size={20}
            color={activeTab === 'invoices' ? '#2563EB' : '#6B7280'}
          />
          <Text style={[styles.tabText, activeTab === 'invoices' && styles.activeTabText]}>
            Factures ({customer.invoices?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Products Tab */}
        {activeTab === 'products' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Historique des produits</Text>
            {productHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>Aucun produit commandé</Text>
              </View>
            ) : (
              productHistory.map((product, index) => (
                <View key={index} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.productName}>{product.productName}</Text>
                    <Text style={styles.productAmount}>{formatCurrency(product.totalAmount)}</Text>
                  </View>
                  <Text style={styles.productSku}>SKU: {product.productSku}</Text>
                  <View style={styles.productStats}>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Qté totale</Text>
                      <Text style={styles.statValue}>{product.totalQuantity}</Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Commandes</Text>
                      <Text style={styles.statValue}>{product.occurrences}x</Text>
                    </View>
                  </View>
                  <View style={styles.badges}>
                    {product.inQuotes > 0 && (
                      <View style={[styles.badge, styles.quoteBadge]}>
                        <Text style={styles.badgeText}>{product.inQuotes} Devis</Text>
                      </View>
                    )}
                    {product.inOrders > 0 && (
                      <View style={[styles.badge, styles.orderBadge]}>
                        <Text style={styles.badgeText}>{product.inOrders} Commandes</Text>
                      </View>
                    )}
                    {product.inInvoices > 0 && (
                      <View style={[styles.badge, styles.invoiceBadge]}>
                        <Text style={styles.badgeText}>{product.inInvoices} Factures</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.lastOrder}>
                    Dernière commande: {formatDate(product.lastOrderDate)}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Quotes Tab */}
        {activeTab === 'quotes' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Devis récents</Text>
            {!customer.quotes || customer.quotes.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>Aucun devis</Text>
              </View>
            ) : (
              customer.quotes.map((quote) => (
                <View key={quote.id} style={styles.card}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('QuoteDetail', { quoteId: quote.id })}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={styles.docNumber}>{quote.number}</Text>
                      <Text style={styles.docAmount}>{formatCurrency(quote.total)}</Text>
                    </View>
                    <View style={styles.docInfo}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(quote.status) }]}>
                        <Text style={styles.statusText}>{quote.status}</Text>
                      </View>
                      <Text style={styles.docDate}>{formatDate(quote.createdAt)}</Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.shareButton}
                      onPress={() => handleShareDocument('quote', quote.id, quote.number)}
                    >
                      <Ionicons name="share-outline" size={20} color="#2563EB" />
                      <Text style={styles.shareButtonText}>Partager</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Commandes récentes</Text>
            {!customer.orders || customer.orders.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cart-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>Aucune commande</Text>
              </View>
            ) : (
              customer.orders.map((order) => (
                <View key={order.id} style={styles.card}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={styles.docNumber}>{order.number}</Text>
                      <Text style={styles.docAmount}>{formatCurrency(order.total)}</Text>
                    </View>
                    <View style={styles.docInfo}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                        <Text style={styles.statusText}>{order.status}</Text>
                      </View>
                      <Text style={styles.docDate}>{formatDate(order.createdAt)}</Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.shareButton}
                      onPress={() => handleShareDocument('order', order.id, order.number)}
                    >
                      <Ionicons name="share-outline" size={20} color="#2563EB" />
                      <Text style={styles.shareButtonText}>Partager</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Factures récentes</Text>
            {!customer.invoices || customer.invoices.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>Aucune facture</Text>
              </View>
            ) : (
              customer.invoices.map((invoice) => {
                const paidAmount = invoice.paidAmount || 0;
                const isPaid = paidAmount >= invoice.total;
                const remaining = invoice.total - paidAmount;

                return (
                  <View key={invoice.id} style={styles.card}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: invoice.id })}
                    >
                      <View style={styles.cardHeader}>
                        <Text style={styles.docNumber}>{invoice.number}</Text>
                        <Text style={styles.docAmount}>{formatCurrency(invoice.total)}</Text>
                      </View>
                      <View style={styles.docInfo}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) }]}>
                          <Text style={styles.statusText}>{invoice.status}</Text>
                        </View>
                        <View style={[styles.paymentBadge, { backgroundColor: isPaid ? '#D1FAE5' : '#FEE2E2' }]}>
                          <Text style={[styles.paymentText, { color: isPaid ? '#059669' : '#DC2626' }]}>
                            {isPaid ? 'Payée' : 'Non payée'}
                          </Text>
                        </View>
                        <Text style={styles.docDate}>{formatDate(invoice.issueDate)}</Text>
                      </View>
                      {!isPaid && (
                        <View style={styles.paymentInfo}>
                          <Text style={styles.paymentLabel}>
                            Payé: {formatCurrency(paidAmount)} / {formatCurrency(invoice.total)}
                          </Text>
                          <Text style={styles.remainingAmount}>Reste: {formatCurrency(remaining)}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.shareButton}
                        onPress={() => handleShareDocument('invoice', invoice.id, invoice.number)}
                      >
                        <Ionicons name="share-outline" size={20} color="#2563EB" />
                        <Text style={styles.shareButtonText}>Partager</Text>
                      </TouchableOpacity>
                      {!isPaid && (
                        <TouchableOpacity
                          style={styles.collectButton}
                          onPress={() => handleCollectPayment(invoice)}
                        >
                          <Ionicons name="cash-outline" size={20} color="#fff" />
                          <Text style={styles.collectButtonText}>Encaisser</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 12,
    fontSize: 18,
    color: '#EF4444',
    fontWeight: '600',
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#2563EB',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#DBEAFE',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  productAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  productSku: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  productStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  quoteBadge: {
    backgroundColor: '#FEF3C7',
  },
  orderBadge: {
    backgroundColor: '#DBEAFE',
  },
  invoiceBadge: {
    backgroundColor: '#D1FAE5',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#111827',
  },
  lastOrder: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  docNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563EB',
  },
  docAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  docInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  docDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  paymentText: {
    fontSize: 11,
    fontWeight: '600',
  },
  paymentInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  remainingAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    marginLeft: 6,
  },
  collectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  collectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
});
