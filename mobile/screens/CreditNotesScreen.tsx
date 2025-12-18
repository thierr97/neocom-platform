import React, { useState, useEffect } from 'react';
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
import documentsAPI, { CreditNote } from '../src/services/documentsAPI';

export default function CreditNotesScreen({ navigation }: any) {
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCreditNotes();
  }, []);

  const loadCreditNotes = async () => {
    try {
      setLoading(true);
      const response = await documentsAPI.creditNotes.getAll();

      if (response.success) {
        setCreditNotes(response.data);
      }
    } catch (error: any) {
      console.error('Error loading credit notes:', error);
      // Ne pas afficher d'alerte si c'est juste un problème de permissions ou endpoint manquant
      // L'utilisateur verra simplement une liste vide avec un message approprié
      if (error.response?.status !== 403 && error.response?.status !== 404) {
        Alert.alert('Erreur', 'Impossible de charger les avoirs');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderCreditNote = ({ item }: { item: CreditNote }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CreditNoteDetail', { creditNote: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.creditNoteNumber}>{item.creditNoteNumber}</Text>
        <View style={styles.totalBadge}>
          <Text style={styles.totalText}>-{item.total.toFixed(2)} €</Text>
        </View>
      </View>

      <Text style={styles.customerName}>{item.customerName}</Text>

      {item.reason && (
        <View style={styles.reasonContainer}>
          <Ionicons name="information-circle" size={16} color="#666" />
          <Text style={styles.reasonText} numberOfLines={2}>
            {item.reason}
          </Text>
        </View>
      )}

      <Text style={styles.date}>
        Créé le: {new Date(item.createdAt).toLocaleDateString('fr-FR')}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF3B30" />
        <Text style={styles.loadingText}>Chargement des avoirs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Avoirs</Text>
      </View>

      <FlatList
        data={creditNotes}
        renderItem={renderCreditNote}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="arrow-undo-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Aucun avoir</Text>
            <Text style={styles.emptySubtext}>
              Créez votre premier avoir en appuyant sur "Nouveau"
            </Text>
          </View>
        }
        refreshing={loading}
        onRefresh={loadCreditNotes}
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
    backgroundColor: '#FF3B30',
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
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  creditNoteNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalBadge: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  totalText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
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
