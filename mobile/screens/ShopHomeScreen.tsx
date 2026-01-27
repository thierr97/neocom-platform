/**
 * Écran d'accueil de la boutique - Identique au web
 * Bannières, catégories populaires, meilleures ventes, flash deals
 */
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
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import shopAPI, { ShopCategory, ShopProduct } from '../src/services/shopAPI';
import bannerAPI, { Banner } from '../src/services/bannerAPI';
import ShopBanner from '../components/ShopBanner';
import { getCategoryStyle } from '../src/config/categoryConfig';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function ShopHomeScreen({ navigation }: any) {
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bestSellers, setBestSellers] = useState<ShopProduct[]>([]);
  const [flashDeals, setFlashDeals] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, bannersRes, bestSellersRes, flashDealsRes] = await Promise.all([
        shopAPI.categories.getAll(),
        bannerAPI.getActive(),
        shopAPI.products.getFeatured(),
        shopAPI.products.getFeatured(), // On utilisera les mêmes pour l'instant
      ]);

      if (categoriesRes.success) {
        // Top 4 catégories avec produits
        const topCategories = categoriesRes.data
          .filter(c => !c.parentId && c._count.products > 0)
          .sort((a, b) => b._count.products - a._count.products)
          .slice(0, 4);
        setCategories(topCategories);
      }

      if (bannersRes.success) {
        setBanners(bannersRes.data);
      }

      if (bestSellersRes.success) {
        setBestSellers(bestSellersRes.data.slice(0, 6));
      }

      if (flashDealsRes.success) {
        setFlashDeals(flashDealsRes.data.slice(6, 12));
      }
    } catch (error) {
      console.error('Error loading shop data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
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
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loadingText}>Chargement de la boutique...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Boutique NeoServ</Text>
        <Text style={styles.headerSubtitle}>Découvrez nos offres exceptionnelles</Text>
      </View>

      {/* Bannières Top */}
      {(banners || []).filter(b => b.placement === 'top').map(banner => (
        <ShopBanner
          key={banner.id}
          banner={banner}
          onPress={() => {
            if (banner.ctaLink) {
              // Navigation vers la page liée
              console.log('Navigate to:', banner.ctaLink);
            }
          }}
        />
      ))}

      {/* Catégories populaires */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Catégories populaires</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ShopAllProducts')}>
            <Text style={styles.seeAllText}>Voir tout →</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Bannières Middle */}
      {(banners || []).filter(b => b.placement === 'middle').map(banner => (
        <ShopBanner
          key={banner.id}
          banner={banner}
          onPress={() => {
            if (banner.ctaLink) {
              console.log('Navigate to:', banner.ctaLink);
            }
          }}
        />
      ))}

      {/* Meilleures ventes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>⭐ Meilleures ventes</Text>
            <Text style={styles.sectionSubtitle}>Les produits les plus populaires</Text>
          </View>
        </View>
        <FlatList
          data={bestSellers}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.productsList}
        />
      </View>

      {/* Flash Deals */}
      <View style={styles.section}>
        <View style={styles.flashDealsHeader}>
          <LinearGradient
            colors={['#ef4444', '#dc2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.flashDealsGradient}
          >
            <Text style={styles.flashDealsTitle}>⚡ Flash Deals</Text>
            <Text style={styles.flashDealsSubtitle}>Offres limitées</Text>
          </LinearGradient>
        </View>
        <FlatList
          data={flashDeals}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.productsList}
        />
      </View>

      {/* Bannières Bottom */}
      {(banners || []).filter(b => b.placement === 'bottom').map(banner => (
        <ShopBanner
          key={banner.id}
          banner={banner}
          onPress={() => {
            if (banner.ctaLink) {
              console.log('Navigate to:', banner.ctaLink);
            }
          }}
        />
      ))}

      <View style={{ height: 40 }} />
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
    backgroundColor: '#a855f7',
    padding: 24,
    paddingTop: 60,
    marginBottom: 16,
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
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: '#a855f7',
    fontWeight: '600',
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryCardWrapper: {
    marginRight: 12,
  },
  categoryCard: {
    width: 160,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  categoryEmoji: {
    fontSize: 40,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  flashDealsHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  flashDealsGradient: {
    padding: 16,
    borderRadius: 12,
  },
  flashDealsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  flashDealsSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
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
    color: '#a855f7',
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
