import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import shopAPI, { ShopCategory, ShopProduct } from '../src/services/shopAPI';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function ShopHomeScreen({ navigation }: any) {
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, productsRes] = await Promise.all([
        shopAPI.categories.getAll(),
        shopAPI.products.getFeatured(),
      ]);

      if (categoriesRes.success) {
        const topCategories = categoriesRes.data
          .filter(c => !c.parentId && c._count.products > 0)
          .slice(0, 8);
        setCategories(topCategories);
      }

      if (productsRes.success) {
        setFeaturedProducts(productsRes.data);
      }
    } catch (error) {
      console.error('Error loading shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCategory = ({ item }: { item: ShopCategory }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => navigation.navigate('ShopCategory', { category: item })}
    >
      <View style={styles.categoryIcon}>
        <Ionicons name="grid-outline" size={32} color="#007AFF" />
      </View>
      <Text style={styles.categoryName} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.categoryCount}>{item._count.products} produits</Text>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }: { item: ShopProduct }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ShopProductDetail', { productId: item.id })}
    >
      <Image
        source={{ uri: item.thumbnail }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.productPrice}>{item.price.toFixed(2)} €</Text>
        {item.stock > 0 ? (
          <View style={styles.stockBadge}>
            <Text style={styles.stockText}>En stock</Text>
          </View>
        ) : (
          <View style={[styles.stockBadge, styles.outOfStockBadge]}>
            <Text style={styles.outOfStockText}>Rupture</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement de la boutique...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Boutique NeoServ</Text>
        <Text style={styles.headerSubtitle}>Découvrez nos produits</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Catégories</Text>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Produits vedettes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ShopAllProducts')}>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={featuredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.productsList}
        />
      </View>
    </ScrollView>
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
    backgroundColor: '#007AFF',
    padding: 24,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryCard: {
    width: 120,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,122,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: '#999',
  },
  productsList: {
    paddingHorizontal: 16,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    height: 40,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(52,199,89,0.1)',
    alignSelf: 'flex-start',
  },
  stockText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  outOfStockBadge: {
    backgroundColor: 'rgba(255,59,48,0.1)',
  },
  outOfStockText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
  },
});
