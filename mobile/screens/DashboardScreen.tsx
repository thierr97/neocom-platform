import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import statsAPI, { DashboardStats } from '../src/services/statsAPI';
import documentsAPI, { Quote, Invoice, DeliveryNote } from '../src/services/documentsAPI';

export default function DashboardScreen({ navigation }: any) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentQuotes, setRecentQuotes] = useState<Quote[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [recentDeliveryNotes, setRecentDeliveryNotes] = useState<DeliveryNote[]>([]);

  // Load dashboard on initial mount
  useEffect(() => {
    loadDashboard();
  }, []);

  // Reload dashboard when screen comes into focus (e.g., after creating documents)
  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  const loadDashboard = async () => {
    try {
      // Load user info from storage
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        const userData = JSON.parse(userString);
        setUser(userData);
      }

      // Load dashboard stats and recent documents in parallel
      const [statsResponse, quotesResponse, invoicesResponse, deliveryNotesResponse] = await Promise.all([
        statsAPI.getDashboardStats(),
        documentsAPI.quotes.getAll().catch(() => ({ success: false, data: [] })),
        documentsAPI.invoices.getAll().catch(() => ({ success: false, data: [] })),
        documentsAPI.deliveryNotes.getAll().catch(() => ({ success: false, data: [] })),
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      // Load only the 3 most recent documents of each type
      if (quotesResponse.success) {
        setRecentQuotes(quotesResponse.data.slice(0, 3));
      }
      if (invoicesResponse.success) {
        setRecentInvoices(invoicesResponse.data.slice(0, 3));
      }
      if (deliveryNotesResponse.success) {
        setRecentDeliveryNotes(deliveryNotesResponse.data.slice(0, 3));
      }
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      // Ne pas afficher d'alerte si c'est juste que le backend n'est pas disponible
      // Les stats seront rechargées au prochain refresh
      if (error.response?.status !== 404) {
        console.log('Stats non disponibles, affichage des données par défaut');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user', 'userId', 'userRole']);
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const getQuoteStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#666';
      case 'sent': return '#007AFF';
      case 'accepted': return '#34C759';
      case 'rejected': return '#FF3B30';
      default: return '#666';
    }
  };

  const getQuoteStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'sent': return 'Envoyé';
      case 'accepted': return 'Accepté';
      case 'rejected': return 'Refusé';
      default: return status;
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#666';
      case 'sent': return '#007AFF';
      case 'paid': return '#34C759';
      case 'overdue': return '#FF3B30';
      default: return '#666';
    }
  };

  const getInvoiceStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'sent': return 'Envoyée';
      case 'paid': return 'Payée';
      case 'overdue': return 'En retard';
      default: return status;
    }
  };

  const getDeliveryNoteStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'delivered': return '#34C759';
      default: return '#666';
    }
  };

  const getDeliveryNoteStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'delivered': return 'Livré';
      default: return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* User Info */}
      <View style={styles.header}>
        <Text style={styles.welcome}>Bonjour,</Text>
        <Text style={styles.userName}>
          {user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'}
        </Text>
        {user && (
          <Text style={styles.userRole}>{user.role}</Text>
        )}
      </View>

      {/* Stats Cards */}
      {stats ? (
        <>
          {/* Première ligne - Clients, Factures, Devis */}
          <View style={styles.statsContainer}>
            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: '#10b981' }]}
              onPress={() => navigation.navigate('CustomersTab')}
            >
              <Ionicons name="people" size={24} color="#fff" />
              <Text style={styles.statValue}>{stats?.customers?.total ?? 0}</Text>
              <Text style={styles.statLabel}>Clients</Text>
              <Text style={styles.statSubLabel}>{stats?.customers?.active ?? 0} actifs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: '#3b82f6' }]}
              onPress={() => navigation.navigate('Invoices')}
            >
              <Ionicons name="document-text" size={24} color="#fff" />
              <Text style={styles.statValue}>{stats?.invoices?.total ?? 0}</Text>
              <Text style={styles.statLabel}>Factures</Text>
              <Text style={styles.statSubLabel}>{stats?.invoices?.paid ?? 0} payées</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: '#8b5cf6' }]}
              onPress={() => navigation.navigate('Quotes')}
            >
              <Ionicons name="document" size={24} color="#fff" />
              <Text style={styles.statValue}>{stats?.quotes?.total ?? 0}</Text>
              <Text style={styles.statLabel}>Devis</Text>
              <Text style={styles.statSubLabel}>{stats?.quotes?.accepted ?? 0} acceptés</Text>
            </TouchableOpacity>
          </View>

          {/* Deuxième ligne - Commandes, Avoirs, Produits */}
          <View style={styles.statsContainer}>
            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: '#f59e0b' }]}
              onPress={() => navigation.navigate('OrdersTab')}
            >
              <Ionicons name="cart" size={24} color="#fff" />
              <Text style={styles.statValue}>{stats?.orders?.total ?? 0}</Text>
              <Text style={styles.statLabel}>Commandes</Text>
              <Text style={styles.statSubLabel}>{stats?.orders?.pending ?? 0} en cours</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: '#ef4444' }]}
              onPress={() => navigation.navigate('CreditNotes')}
            >
              <Ionicons name="return-down-back" size={24} color="#fff" />
              <Text style={styles.statValue}>{stats?.creditNotes?.total ?? 0}</Text>
              <Text style={styles.statLabel}>Avoirs</Text>
              <Text style={styles.statSubLabel}>
                {((stats?.creditNotes?.totalAmount ?? 0) / 1000).toFixed(1)}k €
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: '#06b6d4' }]}
              onPress={() => navigation.navigate('Products')}
            >
              <Ionicons name="cube" size={24} color="#fff" />
              <Text style={styles.statValue}>{stats?.products?.total ?? 0}</Text>
              <Text style={styles.statLabel}>Produits</Text>
              <Text style={styles.statSubLabel}>{stats?.products?.lowStock ?? 0} stock faible</Text>
            </TouchableOpacity>
          </View>

          {/* Montants */}
          <View style={styles.amountsContainer}>
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>CA Factures</Text>
              <Text style={styles.amountValue}>
                {((stats?.invoices?.totalAmount ?? 0) / 1000).toFixed(1)}k €
              </Text>
            </View>
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>CA Devis</Text>
              <Text style={styles.amountValue}>
                {((stats?.quotes?.totalAmount ?? 0) / 1000).toFixed(1)}k €
              </Text>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.noStatsContainer}>
          <Ionicons name="analytics-outline" size={64} color="#ccc" />
          <Text style={styles.noStatsText}>Statistiques non disponibles</Text>
          <Text style={styles.noStatsSubtext}>Tirez pour actualiser</Text>
        </View>
      )}

      {/* Recent Documents */}
      {(recentQuotes.length > 0 || recentInvoices.length > 0 || recentDeliveryNotes.length > 0) && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Documents récents</Text>
          </View>

          {/* Recent Quotes */}
          {recentQuotes.length > 0 && (
            <View style={styles.documentTypeSection}>
              <View style={styles.documentTypeHeader}>
                <Ionicons name="document" size={20} color="#007AFF" />
                <Text style={styles.documentTypeTitle}>Devis</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Quotes')}
                  style={styles.viewAllButton}
                >
                  <Text style={styles.viewAllText}>Voir tout</Text>
                  <Ionicons name="chevron-forward" size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>
              {recentQuotes.map((quote) => (
                <TouchableOpacity
                  key={quote.id}
                  style={styles.documentCard}
                  onPress={() => navigation.navigate('QuoteDetail', { quote })}
                >
                  <View style={styles.documentCardHeader}>
                    <Text style={styles.documentNumber}>{quote.quoteNumber}</Text>
                    <View
                      style={[
                        styles.documentStatusBadge,
                        { backgroundColor: getQuoteStatusColor(quote.status) },
                      ]}
                    >
                      <Text style={styles.documentStatusText}>
                        {getQuoteStatusLabel(quote.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.documentCustomer}>{quote.customerName}</Text>
                  <View style={styles.documentFooter}>
                    <Text style={styles.documentAmount}>{quote.total.toFixed(2)} €</Text>
                    <Text style={styles.documentDate}>
                      {new Date(quote.validUntil).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Recent Invoices */}
          {recentInvoices.length > 0 && (
            <View style={styles.documentTypeSection}>
              <View style={styles.documentTypeHeader}>
                <Ionicons name="document-text" size={20} color="#34C759" />
                <Text style={styles.documentTypeTitle}>Factures</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Invoices')}
                  style={styles.viewAllButton}
                >
                  <Text style={styles.viewAllText}>Voir tout</Text>
                  <Ionicons name="chevron-forward" size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>
              {recentInvoices.map((invoice) => (
                <TouchableOpacity
                  key={invoice.id}
                  style={styles.documentCard}
                  onPress={() => navigation.navigate('InvoiceDetail', { invoice })}
                >
                  <View style={styles.documentCardHeader}>
                    <Text style={styles.documentNumber}>{invoice.invoiceNumber}</Text>
                    <View
                      style={[
                        styles.documentStatusBadge,
                        { backgroundColor: getInvoiceStatusColor(invoice.status) },
                      ]}
                    >
                      <Text style={styles.documentStatusText}>
                        {getInvoiceStatusLabel(invoice.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.documentCustomer}>{invoice.customerName}</Text>
                  <View style={styles.documentFooter}>
                    <Text style={styles.documentAmount}>{invoice.total.toFixed(2)} €</Text>
                    <Text style={styles.documentDate}>
                      {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Recent Delivery Notes */}
          {recentDeliveryNotes.length > 0 && (
            <View style={styles.documentTypeSection}>
              <View style={styles.documentTypeHeader}>
                <Ionicons name="cube" size={20} color="#FF9500" />
                <Text style={styles.documentTypeTitle}>Bons de livraison</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('DeliveryNotes')}
                  style={styles.viewAllButton}
                >
                  <Text style={styles.viewAllText}>Voir tout</Text>
                  <Ionicons name="chevron-forward" size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>
              {recentDeliveryNotes.map((deliveryNote) => (
                <TouchableOpacity
                  key={deliveryNote.id}
                  style={styles.documentCard}
                  onPress={() => navigation.navigate('DeliveryNoteDetail', { deliveryNote })}
                >
                  <View style={styles.documentCardHeader}>
                    <Text style={styles.documentNumber}>{deliveryNote.deliveryNoteNumber}</Text>
                    <View
                      style={[
                        styles.documentStatusBadge,
                        { backgroundColor: getDeliveryNoteStatusColor(deliveryNote.status) },
                      ]}
                    >
                      <Text style={styles.documentStatusText}>
                        {getDeliveryNoteStatusLabel(deliveryNote.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.documentCustomer}>{deliveryNote.customerName}</Text>
                  <View style={styles.documentFooter}>
                    <Text style={styles.documentInfo}>
                      {deliveryNote.items.length} article{deliveryNote.items.length > 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.documentDate}>
                      {new Date(deliveryNote.deliveryDate).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Orders')}
        >
          <Text style={styles.actionIcon}>📦</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Mes commandes</Text>
            <Text style={styles.actionSubtitle}>Voir toutes les commandes</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Scanner')}
        >
          <Text style={styles.actionIcon}>📷</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Scanner code-barres</Text>
            <Text style={styles.actionSubtitle}>Scanner un produit</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('CustomerVisit')}
        >
          <Text style={styles.actionIcon}>📍</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Visite client</Text>
            <Text style={styles.actionSubtitle}>Enregistrer une visite</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.actionIcon}>🚪</Text>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, styles.logoutText]}>
              Déconnexion
            </Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </View>
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
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 20,
    paddingTop: 10,
  },
  welcome: {
    fontSize: 16,
    color: '#e0e7ff',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  userRole: {
    fontSize: 14,
    color: '#e0e7ff',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    paddingTop: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#fff',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  statSubLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    textAlign: 'center',
  },
  amountsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 10,
    gap: 10,
  },
  amountCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  amountLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  noStatsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noStatsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  noStatsSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 32,
    color: '#d1d5db',
  },
  logoutButton: {
    borderColor: '#ef4444',
    borderWidth: 1,
    backgroundColor: '#fef2f2',
  },
  logoutText: {
    color: '#ef4444',
  },
  sectionHeader: {
    marginBottom: 10,
  },
  documentTypeSection: {
    marginBottom: 20,
  },
  documentTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  documentTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    marginRight: 2,
  },
  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  documentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  documentNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  documentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  documentStatusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  documentCustomer: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  documentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#10b981',
  },
  documentInfo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  documentDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
});
