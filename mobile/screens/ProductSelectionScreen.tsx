/**
 * Écran de sélection de produits pour la création de documents
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import productsAPI, { Product } from '../src/services/productsAPI';
import api from '../src/services/api';

interface SelectedProduct extends Product {
  quantity: number;
  discount: number;
}

interface Category {
  id: string;
  name: string;
  children?: Category[];
}

interface Props {
  navigation: any;
  route: any;
}

const ProductSelectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Récupérer les paramètres de navigation
  const { documentType, customerId, customerName, customer } = route.params || {};

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategoryId]);

  useEffect(() => {
    if (customerId) {
      loadCustomerHistory();
    }
  }, [customerId]);

  const loadData = async () => {
    await Promise.all([loadCategories(), loadProducts()]);
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/shop/categories');

      // Handle different response structures
      let categoriesData = null;

      if (response.data) {
        // Check if it's wrapped in a success/data structure
        if (response.data.data && Array.isArray(response.data.data)) {
          categoriesData = response.data.data;
        }
        // Or if it's a direct array
        else if (Array.isArray(response.data)) {
          categoriesData = response.data;
        }
      }

      if (categoriesData) {
        setCategories(categoriesData);
      } else {
        // Set empty array if no valid data
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Set empty array on error to prevent crashes
      setCategories([]);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des produits...');
      const params: any = { limit: 100 };

      if (selectedCategoryId) {
        params.category = selectedCategoryId;
        console.log('📁 Filtre catégorie:', selectedCategoryId);
      }

      const response = await productsAPI.getAll(params);
      console.log('📦 Réponse API produits:', response);

      if (response.success && Array.isArray(response.data)) {
        console.log(`✅ ${response.data.length} produits chargés`);
        setProducts(response.data);
      } else {
        console.warn('⚠️ Format de réponse invalide:', response);
        setProducts([]);
      }
    } catch (error: any) {
      console.error('❌ Erreur chargement produits:', error);
      console.error('Détails:', error.response?.data || error.message);
      Alert.alert('Erreur', 'Impossible de charger les produits');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerHistory = async () => {
    if (!customerId) return;

    try {
      console.log('📊 Chargement historique client:', customerId);
      const response = await api.get(`/customers/${customerId}/purchase-history`);
      console.log('📦 Réponse historique:', response.data);

      if (response.data.success && Array.isArray(response.data.products)) {
        setCustomerHistory(response.data.products);
        console.log(`✅ ${response.data.products.length} produits dans l'historique`);
      } else if (Array.isArray(response.data)) {
        setCustomerHistory(response.data);
        console.log(`✅ ${response.data.length} produits dans l'historique`);
      } else {
        setCustomerHistory([]);
      }
    } catch (error: any) {
      console.error('❌ Erreur chargement historique client:', error);
      // Ne pas afficher d'alerte, l'historique est optionnel
      setCustomerHistory([]);
    }
  };

  const handleProductPress = (product: Product) => {
    const existingIndex = selectedProducts.findIndex(p => p.id === product.id);

    if (existingIndex >= 0) {
      // Produit déjà sélectionné, augmenter la quantité
      const updated = [...selectedProducts];
      updated[existingIndex].quantity += 1;
      setSelectedProducts(updated);
    } else {
      // Nouveau produit
      setSelectedProducts([
        ...selectedProducts,
        { ...product, quantity: 1, discount: 0 },
      ]);
    }
  };

  const handleHistoryProductPress = (historyItem: any) => {
    // Trouver le produit complet dans la liste
    const product = products.find(p => p.id === historyItem.productId || p.id === historyItem.id);

    if (product) {
      handleProductPress(product);
    } else {
      // Si le produit n'est pas dans la liste actuelle, utiliser les données de l'historique
      const productData = historyItem.product || historyItem;
      handleProductPress(productData);
    }
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      // Retirer le produit
      setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
    } else {
      // Mettre à jour la quantité
      setSelectedProducts(
        selectedProducts.map(p =>
          p.id === productId ? { ...p, quantity } : p
        )
      );
    }
  };

  const handleDiscountChange = (productId: string, discount: number) => {
    setSelectedProducts(
      selectedProducts.map(p =>
        p.id === productId ? { ...p, discount: Math.max(0, Math.min(100, discount)) } : p
      )
    );
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((total, product) => {
      const subtotal = product.price * product.quantity;
      const discountAmount = (subtotal * product.discount) / 100;
      return total + (subtotal - discountAmount);
    }, 0);
  };

  const handleValidate = () => {
    if (selectedProducts.length === 0) {
      Alert.alert('Attention', 'Veuillez sélectionner au moins un produit');
      return;
    }

    // Retourner les produits sélectionnés à l'écran de création
    navigation.navigate(getCreateScreenName(), {
      selectedProducts,
      customerId,
      customerName,
      customer,
    });
  };

  const getCreateScreenName = () => {
    switch (documentType) {
      case 'quote':
        return 'CreateQuote';
      case 'invoice':
        return 'CreateInvoice';
      case 'delivery':
        return 'DeliveryNotes';
      default:
        return 'CreateQuote';
    }
  };

  const getDocumentTypeLabel = () => {
    switch (documentType) {
      case 'quote':
        return 'Devis';
      case 'invoice':
        return 'Facture';
      case 'delivery':
        return 'Bon de livraison';
      default:
        return 'Document';
    }
  };

  // Aplatir les catégories pour inclure les sous-catégories
  const flattenCategories = (cats: Category[]): Category[] => {
    // Safety check: return empty array if cats is not a valid array
    if (!cats || !Array.isArray(cats)) {
      return [];
    }

    const result: Category[] = [];
    cats.forEach(cat => {
      result.push(cat);
      if (cat.children && cat.children.length > 0) {
        result.push(...flattenCategories(cat.children));
      }
    });
    return result;
  };

  const allCategories = flattenCategories(categories);

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setShowCategories(false);
  };

  const selectedCategory = allCategories.find(c => c.id === selectedCategoryId);

  // Recherche intelligente dans plusieurs champs
  const filteredProducts = products.filter(product => {
    if (!searchQuery.trim()) return true; // Pas de recherche, tout afficher

    const query = searchQuery.toLowerCase().trim();
    const searchTerms = query.split(' ').filter(term => term.length > 0);

    // Champs à rechercher
    const searchFields = [
      product.name?.toLowerCase() || '',
      product.sku?.toLowerCase() || '',
      product.description?.toLowerCase() || '',
      product.barcode?.toLowerCase() || '',
    ].join(' ');

    // Tous les termes de recherche doivent être trouvés (recherche ET)
    return searchTerms.every(term => searchFields.includes(term));
  });

  const renderSelectedProduct = ({ item }: { item: SelectedProduct }) => (
    <View style={styles.selectedProductCard}>
      <View style={styles.selectedProductInfo}>
        <Text style={styles.selectedProductName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.selectedProductPrice}>{item.price.toFixed(2)} €</Text>
      </View>

      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
        >
          <Ionicons name="remove" size={20} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.quantityText}>{item.quantity}</Text>

        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.discountContainer}>
        <TextInput
          style={styles.discountInput}
          keyboardType="numeric"
          placeholder="Remise %"
          value={item.discount > 0 ? item.discount.toString() : ''}
          onChangeText={(text) => handleDiscountChange(item.id, parseFloat(text) || 0)}
        />
      </View>

      <Text style={styles.selectedProductTotal}>
        {((item.price * item.quantity) * (1 - item.discount / 100)).toFixed(2)} €
      </Text>
    </View>
  );

  const renderProduct = ({ item }: { item: Product }) => {
    const isSelected = selectedProducts.some(p => p.id === item.id);
    const imageUri = item.imageUrl || item.thumbnail || item.images?.[0];

    return (
      <TouchableOpacity
        style={[styles.productCard, isSelected && styles.productCardSelected]}
        onPress={() => handleProductPress(item)}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.productImage} />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="image-outline" size={30} color="#ccc" />
          </View>
        )}

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.sku && <Text style={styles.productSKU}>Réf: {item.sku}</Text>}
          <Text style={styles.productPrice}>{item.price.toFixed(2)} €</Text>
        </View>

        {isSelected && (
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHistoryItem = ({ item }: { item: any }) => {
    const product = item.product || item;
    const isSelected = selectedProducts.some(p => p.id === (item.productId || item.id));
    const imageUri = product.imageUrl || product.thumbnail || product.images?.[0];

    return (
      <TouchableOpacity
        style={[styles.historyCard, isSelected && styles.historyCardSelected]}
        onPress={() => handleHistoryProductPress(item)}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.historyImage} />
        ) : (
          <View style={styles.historyImagePlaceholder}>
            <Ionicons name="time-outline" size={24} color="#999" />
          </View>
        )}
        <View style={styles.historyInfo}>
          <Text style={styles.historyProductName} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.historyDetails}>
            Qté totale: {item.totalQuantity || 1}
          </Text>
          {item.lastOrderDate && (
            <Text style={styles.historyDate}>
              Dernier achat: {new Date(item.lastOrderDate).toLocaleDateString('fr-FR')}
            </Text>
          )}
        </View>
        <View style={styles.historyAction}>
          <Ionicons name="add-circle" size={32} color="#007AFF" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement des produits...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Sélection produits - {getDocumentTypeLabel()}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Customer Info */}
      {customerName && (
        <View style={styles.customerInfo}>
          <Ionicons name="person" size={20} color="#666" />
          <Text style={styles.customerName}>{customerName}</Text>
        </View>
      )}

      {/* Customer Purchase History */}
      {customerHistory.length > 0 && (
        <View style={styles.historySection}>
          <TouchableOpacity
            style={styles.historyHeader}
            onPress={() => setShowHistory(!showHistory)}
          >
            <View style={styles.historyHeaderLeft}>
              <Ionicons name="time" size={20} color="#FF9500" />
              <Text style={styles.historyTitle}>
                Achats précédents ({customerHistory.length})
              </Text>
            </View>
            <Ionicons
              name={showHistory ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#FF9500"
            />
          </TouchableOpacity>

          {showHistory && (
            <FlatList
              data={customerHistory}
              renderItem={renderHistoryItem}
              keyExtractor={(item, index) => item.id || item.productId || `history-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.historyList}
            />
          )}
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un produit..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Results Count */}
      {searchQuery.length > 0 && (
        <View style={styles.searchResults}>
          <Text style={styles.searchResultsText}>
            {filteredProducts.length} résultat{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Category Filter */}
      {categories.length > 0 && (
        <View style={styles.categorySection}>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => setShowCategories(!showCategories)}
          >
            <Ionicons name="list" size={20} color="#007AFF" />
            <Text style={styles.categoryButtonText}>
              {selectedCategory ? selectedCategory.name : 'Toutes les catégories'}
            </Text>
            <Ionicons
              name={showCategories ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#007AFF"
            />
          </TouchableOpacity>

          {showCategories && (
            <ScrollView style={styles.categoriesDropdown} nestedScrollEnabled>
              <TouchableOpacity
                style={[
                  styles.categoryItem,
                  !selectedCategoryId && styles.categoryItemSelected,
                ]}
                onPress={() => handleCategorySelect(null)}
              >
                <Text
                  style={[
                    styles.categoryItemText,
                    !selectedCategoryId && styles.categoryItemTextSelected,
                  ]}
                >
                  Toutes les catégories
                </Text>
              </TouchableOpacity>

              {allCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    selectedCategoryId === category.id && styles.categoryItemSelected,
                  ]}
                  onPress={() => handleCategorySelect(category.id)}
                >
                  <Text
                    style={[
                      styles.categoryItemText,
                      selectedCategoryId === category.id &&
                        styles.categoryItemTextSelected,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Selected Products Summary */}
      {selectedProducts.length > 0 && (
        <View style={styles.selectedSection}>
          <Text style={styles.selectedTitle}>
            Produits sélectionnés ({selectedProducts.length})
          </Text>
          <FlatList
            data={selectedProducts}
            renderItem={renderSelectedProduct}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedList}
          />
        </View>
      )}

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Aucun produit trouvé</Text>
          </View>
        }
      />

      {/* Footer with Total and Validate */}
      {selectedProducts.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total HT</Text>
            <Text style={styles.totalValue}>{calculateTotal().toFixed(2)} €</Text>
          </View>
          <TouchableOpacity style={styles.validateButton} onPress={handleValidate}>
            <Text style={styles.validateButtonText}>Valider la sélection</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

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
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    gap: 8,
  },
  customerName: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  searchResults: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  searchResultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedSection: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  selectedList: {
    paddingHorizontal: 12,
  },
  selectedProductCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    width: 280,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedProductInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  selectedProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  selectedProductPrice: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  quantityButton: {
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    minWidth: 40,
    textAlign: 'center',
  },
  discountContainer: {
    marginVertical: 8,
  },
  discountInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  selectedProductTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'right',
    marginTop: 4,
  },
  productsList: {
    padding: 12,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productCardSelected: {
    borderColor: '#34C759',
    borderWidth: 2,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productSKU: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  selectedBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  validateButton: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  validateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  categorySection: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  categoryButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
  },
  categoriesDropdown: {
    maxHeight: 300,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  categoryItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  categoryItemText: {
    fontSize: 15,
    color: '#333',
  },
  categoryItemTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  historySection: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FFF9E6',
  },
  historyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF9500',
  },
  historyList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  historyCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginRight: 12,
    width: 200,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyCardSelected: {
    borderColor: '#34C759',
    borderWidth: 2,
    backgroundColor: '#E8F5E9',
  },
  historyImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  historyImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyInfo: {
    flex: 1,
    marginLeft: 10,
  },
  historyProductName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  historyDetails: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  historyAction: {
    marginLeft: 8,
  },
});

export default ProductSelectionScreen;
