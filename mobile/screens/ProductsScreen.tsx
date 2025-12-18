import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import productsAPI, { Product } from '../src/services/productsAPI';
import categoriesAPI, { Category } from '../src/services/categoriesAPI';

export default function ProductsScreen({ navigation }: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  useEffect(() => {
    // Recharger les produits quand la catégorie change
    loadProducts();
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await categoriesAPI.getAll();

      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Ne pas afficher d'alerte pour les catégories, ce n'est pas critique
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadProducts = async (resetPage: boolean = false) => {
    try {
      setLoading(true);
      const currentPage = resetPage ? 1 : page;

      const response = await productsAPI.getAll({
        page: currentPage,
        limit: 20,
        category: selectedCategory || undefined,
      });

      if (response.success) {
        // Si on reset, on remplace les produits, sinon on les ajoute
        if (resetPage) {
          setProducts(response.data);
          setPage(1);
        } else {
          setProducts(response.data);
        }

        setHasMore(
          response.pagination ? currentPage < response.pagination.totalPages : false
        );
      }
    } catch (error: any) {
      console.error('Error loading products:', error);
      Alert.alert('Erreur', 'Impossible de charger les produits');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreProducts = async () => {
    // Ne pas charger si déjà en cours de chargement ou s'il n'y a plus de produits
    if (loadingMore || !hasMore || loading) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;

      const response = await productsAPI.getAll({
        page: nextPage,
        limit: 20,
        category: selectedCategory || undefined,
      });

      if (response.success) {
        // Ajouter les nouveaux produits à la liste existante
        setProducts((prevProducts) => [...prevProducts, ...response.data]);
        setPage(nextPage);
        setHasMore(
          response.pagination ? nextPage < response.pagination.totalPages : false
        );
      }
    } catch (error: any) {
      console.error('Error loading more products:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadProducts();
      return;
    }

    try {
      setLoading(true);
      const response = await productsAPI.search(searchQuery);

      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      Alert.alert('Erreur', 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setSearchQuery(''); // Réinitialiser la recherche
    setPage(1);
    setShowCategoryDropdown(false); // Fermer le dropdown
  };

  const getSelectedCategoryName = () => {
    if (!selectedCategory) return 'Toutes les catégories';
    const category = categories.find((cat) => cat.id === selectedCategory);
    return category ? category.name : 'Toutes les catégories';
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { product });
  };

  const getProductImage = (product: Product) => {
    return product.imageUrl || product.thumbnail || product.images?.[0] || null;
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const imageUri = getProductImage(item);

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleProductPress(item)}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="image-outline" size={40} color="#ccc" />
          </View>
        )}

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>

        {item.sku && <Text style={styles.productSKU}>Réf: {item.sku}</Text>}

        {item.description && (
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>{item.price.toFixed(2)} €</Text>
          <View
            style={[
              styles.stockBadge,
              item.stock > 0 ? styles.stockAvailable : styles.stockUnavailable,
            ]}
          >
            <Text style={styles.stockText}>
              {item.stock > 0 ? `Stock: ${item.stock}` : 'Rupture'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
    );
  };

  if (loading && products.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement des produits...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Barre de recherche */}
      <View style={styles.searchBar}>
        <Ionicons
          name="search"
          size={20}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un produit..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              loadProducts();
            }}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Menu déroulant de catégories */}
      {!loadingCategories && categories.length > 0 && (
        <View style={styles.categoryDropdownContainer}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowCategoryDropdown(true)}
          >
            <Ionicons name="filter" size={20} color="#666" />
            <Text style={styles.dropdownButtonText}>
              {getSelectedCategoryName()}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      )}

      {/* Modal du dropdown de catégories */}
      <Modal
        visible={showCategoryDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Sélectionner une catégorie</Text>
              <TouchableOpacity onPress={() => setShowCategoryDropdown(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={[{ id: null, name: 'Toutes les catégories' }, ...categories]}
              keyExtractor={(item) => item.id || 'all'}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    selectedCategory === item.id && styles.categoryItemSelected,
                  ]}
                  onPress={() => handleCategoryPress(item.id)}
                >
                  <Text
                    style={[
                      styles.categoryItemText,
                      selectedCategory === item.id && styles.categoryItemTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {selectedCategory === item.id && (
                    <Ionicons name="checkmark" size={24} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Liste des produits */}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Aucun produit trouvé</Text>
            {selectedCategory && (
              <Text style={styles.emptySubtext}>
                Essayez de sélectionner une autre catégorie
              </Text>
            )}
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.footerText}>Chargement...</Text>
            </View>
          ) : null
        }
        onEndReached={loadMoreProducts}
        onEndReachedThreshold={0.5}
        refreshing={loading}
        onRefresh={loadProducts}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  categoryDropdownContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropdownButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '85%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#333',
  },
  categoryItemTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  listContainer: {
    padding: 10,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImage: {
    width: '100%',
    height: 150,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productSKU: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  stockAvailable: {
    backgroundColor: '#e8f5e9',
  },
  stockUnavailable: {
    backgroundColor: '#ffebee',
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});
