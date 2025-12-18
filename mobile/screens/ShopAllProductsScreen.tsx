import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import shopAPI, { ShopProduct } from '../src/services/shopAPI';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function ShopAllProductsScreen({ navigation }: any) {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProducts();
  }, [searchQuery]);

  const loadProducts = async () => {
    try {
      const response = await shopAPI.products.getAll({
        search: searchQuery || undefined,
        page: page,
        limit: 20,
      });

      if (response.success) {
        setProducts(prevProducts =>
          page === 1 ? response.data : [...prevProducts, ...response.data]
        );
        setHasMore(response.pagination.hasNext);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(page + 1);
      loadProducts();
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setPage(1);
    setProducts([]);
    setLoading(true);
  };

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

  if (loading && page === 1) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement des produits...</Text>
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
        <Text style={styles.headerTitle}>Tous les produits</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un produit..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productsList}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && page > 1 ? (
            <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Aucun produit trouvé'
                : 'Aucun produit disponible'}
            </Text>
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
    backgroundColor: '#007AFF',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  productsList: {
    padding: 16,
    paddingTop: 0,
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
  loader: {
    marginVertical: 20,
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
