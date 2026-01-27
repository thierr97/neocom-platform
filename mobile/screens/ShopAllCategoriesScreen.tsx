/**
 * Écran affichant toutes les catégories de la boutique
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import shopAPI, { ShopCategory } from '../src/services/shopAPI';
import { getCategoryStyle } from '../src/config/categoryConfig';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function ShopAllCategoriesScreen({ navigation }: any) {
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await shopAPI.categories.getAll();
      if (response.success) {
        // Toutes les catégories principales avec produits
        const allCategories = response.data
          .filter(c => !c.parentId && c._count.products > 0)
          .sort((a, b) => b._count.products - a._count.products);
        setCategories(allCategories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCategory = ({ item }: { item: ShopCategory }) => {
    const style = getCategoryStyle(item.slug);

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ShopCategory', { category: item })}
        style={styles.categoryCardWrapper}
      >
        <LinearGradient
          colors={style.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.categoryCard}
        >
          <Text style={styles.categoryEmoji}>{style.icon}</Text>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.categoryCount}>{item._count.products} produits</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loadingText}>Chargement des catégories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Toutes les catégories</Text>
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.categoriesList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="albums-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Aucune catégorie disponible</Text>
          </View>
        }
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
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#a855f7',
    padding: 24,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  categoriesList: {
    padding: 16,
  },
  categoryCardWrapper: {
    width: CARD_WIDTH,
    marginBottom: 16,
    marginRight: 16,
  },
  categoryCard: {
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  categoryEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  categoryInfo: {
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
  },
});
