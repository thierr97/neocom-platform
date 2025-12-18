import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DocumentsScreen({ navigation }: any) {
  const documentTypes = [
    {
      title: 'Devis',
      icon: 'document-text-outline',
      color: '#007AFF',
      description: 'Créer et gérer vos devis',
      screen: 'Quotes',
    },
    {
      title: 'Factures',
      icon: 'receipt-outline',
      color: '#34C759',
      description: 'Créer et gérer vos factures',
      screen: 'Invoices',
    },
    {
      title: 'Bons de livraison',
      icon: 'cube-outline',
      color: '#FF9500',
      description: 'Créer et gérer vos bons de livraison',
      screen: 'DeliveryNotes',
    },
    {
      title: 'Avoirs',
      icon: 'arrow-undo-outline',
      color: '#FF3B30',
      description: 'Créer et gérer vos avoirs',
      screen: 'CreditNotes',
    },
    {
      title: 'Produits',
      icon: 'pricetags-outline',
      color: '#5856D6',
      description: 'Parcourir le catalogue de produits',
      screen: 'Products',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Documents commerciaux</Text>
        <Text style={styles.headerSubtitle}>
          Gérez vos documents et commandes
        </Text>
      </View>

      <View style={styles.grid}>
        {documentTypes.map((doc, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { borderLeftColor: doc.color }]}
            onPress={() => navigation.navigate(doc.screen)}
          >
            <View style={[styles.iconContainer, { backgroundColor: doc.color }]}>
              <Ionicons name={doc.icon as any} size={32} color="#fff" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{doc.title}</Text>
              <Text style={styles.cardDescription}>{doc.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Créez facilement des documents commerciaux depuis votre mobile
        </Text>
      </View>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  grid: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
