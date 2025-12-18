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
import documentsAPI, { DeliveryNote } from '../src/services/documentsAPI';

export default function DeliveryNotesScreen({ navigation }: any) {
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Load delivery notes on initial mount
  useEffect(() => {
    loadDeliveryNotes();
  }, []);

  // Reload delivery notes when screen comes into focus (e.g., after creating a new delivery note)
  useFocusEffect(
    useCallback(() => {
      loadDeliveryNotes();
    }, [])
  );

  const loadDeliveryNotes = async () => {
    try {
      setLoading(true);
      const response = await documentsAPI.deliveryNotes.getAll();

      if (response.success) {
        setDeliveryNotes(response.data);
      }
    } catch (error: any) {
      console.error('Error loading delivery notes:', error);
      // Ne pas afficher d'alerte si c'est juste un problème de permissions ou endpoint manquant
      // L'utilisateur verra simplement une liste vide avec un message approprié
      if (error.response?.status !== 403 && error.response?.status !== 404) {
        Alert.alert('Erreur', 'Impossible de charger les bons de livraison');
      }
    } finally {
      setLoading(false);
    }
  };

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

  const renderDeliveryNote = ({ item }: { item: DeliveryNote }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('DeliveryNoteDetail', { deliveryNote: item })
      }
    >
      <View style={styles.cardHeader}>
        <Text style={styles.deliveryNoteNumber}>
          {item.deliveryNoteNumber}
        </Text>
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
        <Text style={styles.itemCount}>
          {item.items.length} article{item.items.length > 1 ? 's' : ''}
        </Text>
        <Text style={styles.date}>
          Livraison:{' '}
          {new Date(item.deliveryDate).toLocaleDateString('fr-FR')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF9500" />
        <Text style={styles.loadingText}>
          Chargement des bons de livraison...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Bons de livraison</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() =>
            navigation.navigate('ProductSelection', {
              documentType: 'delivery',
              customerId: null,
              customerName: null,
            })
          }
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.createButtonText}>Nouveau</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={deliveryNotes}
        renderItem={renderDeliveryNote}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Aucun bon de livraison</Text>
            <Text style={styles.emptySubtext}>
              Créez votre premier bon de livraison en appuyant sur "Nouveau"
            </Text>
          </View>
        }
        refreshing={loading}
        onRefresh={loadDeliveryNotes}
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
    backgroundColor: '#FF9500',
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
  deliveryNoteNumber: {
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
  itemCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
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
