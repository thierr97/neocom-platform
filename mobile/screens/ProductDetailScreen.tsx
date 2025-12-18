import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }: any) {
  const { product } = route.params;

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>Produit introuvable</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStockStatusColor = () => {
    if (product.stock <= 0) return '#FF3B30';
    if (product.stock <= product.minStock) return '#FF9500';
    return '#34C759';
  };

  const getStockStatusText = () => {
    if (product.stock <= 0) return 'Rupture de stock';
    if (product.stock <= product.minStock) return 'Stock faible';
    return 'En stock';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Image principale */}
      {product.thumbnail || product.images?.[0] ? (
        <Image
          source={{ uri: product.thumbnail || product.images[0] }}
          style={styles.mainImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={80} color="#ccc" />
        </View>
      )}

      {/* Galerie d'images */}
      {product.images && product.images.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imageGallery}
        >
          {product.images.map((img: string, index: number) => (
            <Image
              key={index}
              source={{ uri: img }}
              style={styles.galleryImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}

      <View style={styles.content}>
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.productName}>{product.name}</Text>
            {product.sku && (
              <Text style={styles.productSKU}>Réf: {product.sku}</Text>
            )}
          </View>
          <Text style={styles.productPrice}>{product.price.toFixed(2)} €</Text>
        </View>

        {/* Catégorie */}
        {product.category && (
          <View style={styles.categoryBadge}>
            <Ionicons name="pricetag-outline" size={16} color="#007AFF" />
            <Text style={styles.categoryText}>{product.category.name}</Text>
          </View>
        )}

        {/* Stock */}
        <View
          style={[
            styles.stockContainer,
            { backgroundColor: `${getStockStatusColor()}15` },
          ]}
        >
          <View style={styles.stockRow}>
            <Ionicons
              name="cube-outline"
              size={20}
              color={getStockStatusColor()}
            />
            <Text
              style={[styles.stockText, { color: getStockStatusColor() }]}
            >
              {getStockStatusText()}
            </Text>
          </View>
          <Text
            style={[styles.stockQuantity, { color: getStockStatusColor() }]}
          >
            {product.stock} unités disponibles
          </Text>
        </View>

        {/* Description */}
        {product.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        )}

        {/* Informations détaillées */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>

          {product.barcode && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Code-barres:</Text>
              <Text style={styles.infoValue}>{product.barcode}</Text>
            </View>
          )}

          {product.costPrice && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Prix de revient:</Text>
              <Text style={styles.infoValue}>
                {product.costPrice.toFixed(2)} €
              </Text>
            </View>
          )}

          {product.compareAtPrice && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Prix comparé:</Text>
              <Text style={styles.infoValue}>
                {product.compareAtPrice.toFixed(2)} €
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Stock minimum:</Text>
            <Text style={styles.infoValue}>{product.minStock || 'N/A'}</Text>
          </View>

          {product.weight && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Poids:</Text>
              <Text style={styles.infoValue}>{product.weight} kg</Text>
            </View>
          )}

          {(product.width || product.height || product.length) && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dimensions:</Text>
              <Text style={styles.infoValue}>
                {product.width} x {product.height} x {product.length} cm
              </Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {product.tags.map((tag: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Statuts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statut</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    product.status === 'ACTIVE' ? '#e8f5e9' : '#ffebee',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: product.status === 'ACTIVE' ? '#34C759' : '#FF3B30',
                  },
                ]}
              >
                {product.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
              </Text>
            </View>

            {product.isFeatured && (
              <View style={[styles.statusBadge, styles.featuredBadge]}>
                <Ionicons name="star" size={14} color="#FF9500" />
                <Text style={styles.featuredText}>En vedette</Text>
              </View>
            )}
          </View>
        </View>

        {/* Dates */}
        <View style={styles.section}>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Créé le:</Text>
            <Text style={styles.dateValue}>
              {new Date(product.createdAt).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Mis à jour le:</Text>
            <Text style={styles.dateValue}>
              {new Date(product.updatedAt).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mainImage: {
    width: width,
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholder: {
    width: width,
    height: 300,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGallery: {
    backgroundColor: '#fff',
    paddingVertical: 8,
  },
  galleryImage: {
    width: 80,
    height: 80,
    marginLeft: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  content: {
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTop: {
    marginBottom: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productSKU: {
    fontSize: 14,
    color: '#666',
  },
  productPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  categoryText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  stockContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stockText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  stockQuantity: {
    fontSize: 14,
    marginLeft: 28,
  },
  section: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 13,
    color: '#666',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
  },
  featuredText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dateLabel: {
    fontSize: 14,
    color: '#999',
  },
  dateValue: {
    fontSize: 14,
    color: '#666',
  },
});
