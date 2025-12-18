import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import shopAPI, { ShopProduct } from '../src/services/shopAPI';

const { width } = Dimensions.get('window');

export default function ShopProductDetailScreen({ route, navigation }: any) {
  const { productId } = route.params;
  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const response = await shopAPI.products.getById(productId);
      if (response.success) {
        setProduct(response.data);
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      await shopAPI.cart.add(productId, quantity);
      alert('Produit ajouté au panier !');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Erreur lors de l\'ajout au panier');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Produit introuvable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Image principale */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.images[selectedImage] || product.thumbnail }}
            style={styles.mainImage}
            resizeMode="contain"
          />
        </View>

        {/* Miniatures */}
        {product.images.length > 1 && (
          <ScrollView horizontal style={styles.thumbnailsContainer} showsHorizontalScrollIndicator={false}>
            {product.images.map((image, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedImage(index)}
                style={[
                  styles.thumbnailWrapper,
                  selectedImage === index && styles.thumbnailSelected,
                ]}
              >
                <Image
                  source={{ uri: image }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Informations produit */}
        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.sku}>Réf: {product.sku}</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>{product.price.toFixed(2)} €</Text>
            {product.compareAtPrice && (
              <Text style={styles.comparePrice}>{product.compareAtPrice.toFixed(2)} €</Text>
            )}
          </View>

          {/* Stock */}
          <View style={styles.stockContainer}>
            {product.stock > 0 ? (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                <Text style={styles.stockText}>En stock ({product.stock} disponibles)</Text>
              </>
            ) : (
              <>
                <Ionicons name="close-circle" size={20} color="#FF3B30" />
                <Text style={styles.outOfStockText}>Rupture de stock</Text>
              </>
            )}
          </View>

          {/* Description */}
          {product.shortDescription && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description courte</Text>
              <Text style={styles.description}>{product.shortDescription}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description complète</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          {/* Catégorie */}
          {product.category && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Catégorie</Text>
              <TouchableOpacity
                style={styles.categoryChip}
                onPress={() => navigation.navigate('ShopCategory', { category: product.category })}
              >
                <Text style={styles.categoryText}>{product.category.name}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Dimensions */}
          {(product.weight || product.width || product.height || product.length) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Caractéristiques</Text>
              {product.weight && (
                <Text style={styles.characteristic}>Poids: {product.weight} kg</Text>
              )}
              {product.width && product.height && product.length && (
                <Text style={styles.characteristic}>
                  Dimensions: {product.width} x {product.height} x {product.length} cm
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer avec quantité et ajout au panier */}
      {product.stock > 0 && (
        <View style={styles.footer}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Ionicons name="remove" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
            >
              <Ionicons name="add" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
            <Ionicons name="cart" size={24} color="#fff" />
            <Text style={styles.addToCartText}>Ajouter au panier</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  imageContainer: {
    width: width,
    height: width,
    backgroundColor: '#f5f5f5',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailSelected: {
    borderColor: '#007AFF',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sku: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 12,
  },
  comparePrice: {
    fontSize: 20,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  stockText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#34C759',
    fontWeight: '600',
  },
  outOfStockText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,122,255,0.1)',
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  characteristic: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    marginRight: 12,
  },
  quantityButton: {
    padding: 12,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 40,
    textAlign: 'center',
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
