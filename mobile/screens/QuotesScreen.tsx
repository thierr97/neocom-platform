import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import documentsAPI, { Quote } from '../src/services/documentsAPI';

export default function QuotesScreen({ navigation }: any) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  // Load quotes on initial mount
  useEffect(() => {
    loadQuotes();
  }, []);

  // Reload quotes when screen comes into focus (e.g., after creating a new quote)
  useFocusEffect(
    useCallback(() => {
      loadQuotes();
    }, [])
  );

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const response = await documentsAPI.quotes.getAll();

      if (response.success) {
        setQuotes(response.data);
      }
    } catch (error: any) {
      console.error('Error loading quotes:', error);
      // Ne pas afficher d'alerte si c'est juste un problème de permissions ou endpoint manquant
      // L'utilisateur verra simplement une liste vide avec un message approprié
      if (error.response?.status !== 403 && error.response?.status !== 404) {
        Alert.alert('Erreur', 'Impossible de charger les devis');
      }
    } finally {
      setLoading(false);
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

  const renderQuote = ({ item }: { item: Quote }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('QuoteDetail', { quote: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.quoteNumber}>{item.quoteNumber}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      <Text style={styles.customerName}>{item.customerName}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.total}>{item.total.toFixed(2)} €</Text>
        <Text style={styles.date}>
          Valable jusqu'au:{' '}
          {new Date(item.validUntil).toLocaleDateString('fr-FR')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement des devis...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Devis</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() =>
            navigation.navigate('CustomerSelection', {
              documentType: 'quote',
            })
          }
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.createButtonText}>Nouveau</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={quotes}
        renderItem={renderQuote}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Aucun devis</Text>
            <Text style={styles.emptySubtext}>
              Créez votre premier devis en appuyant sur "Nouveau"
            </Text>
          </View>
        }
        refreshing={loading}
        onRefresh={loadQuotes}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quoteNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
});
