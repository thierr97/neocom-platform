import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  stock: number;
  description?: string;
  category?: {
    name: string;
  };
}

export default function ScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [torch, setTorch] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('userToken');

      // Search for product by barcode
      const response = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { barcode: data },
      });

      if (response.data.success && response.data.data.length > 0) {
        setProduct(response.data.data[0]);
        setModalVisible(true);
      } else {
        Alert.alert(
          'Produit non trouvé',
          `Aucun produit trouvé avec le code-barres: ${data}`,
          [
            {
              text: 'Scanner à nouveau',
              onPress: () => {
                setScanned(false);
                setLoading(false);
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error searching product:', error);
      Alert.alert(
        'Erreur',
        'Impossible de rechercher le produit',
        [
          {
            text: 'Réessayer',
            onPress: () => {
              setScanned(false);
              setLoading(false);
            },
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setProduct(null);
    setScanned(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return { label: 'Rupture de stock', color: '#ef4444' };
    } else if (stock < 10) {
      return { label: 'Stock faible', color: '#f59e0b' };
    } else {
      return { label: 'En stock', color: '#10b981' };
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.infoText}>Demande d'accès à la caméra...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>📷</Text>
        <Text style={styles.errorTitle}>Accès à la caméra refusé</Text>
        <Text style={styles.errorMessage}>
          Veuillez autoriser l'accès à la caméra dans les paramètres de votre appareil.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestCameraPermission}
        >
          <Text style={styles.permissionButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
            'code39',
            'code128',
            'qr',
          ],
        }}
      >
        <View style={styles.overlay}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Text style={styles.instructionText}>
              Positionnez le code-barres dans le cadre
            </Text>
            <TouchableOpacity
              style={styles.torchButton}
              onPress={() => setTorch(!torch)}
            >
              <Text style={styles.torchIcon}>{torch ? '🔦' : '💡'}</Text>
            </TouchableOpacity>
          </View>

          {/* Scanning Frame */}
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>Recherche...</Text>
              </View>
            )}
          </View>

          {/* Bottom Bar */}
          <View style={styles.bottomBar}>
            {scanned && !loading && (
              <TouchableOpacity
                style={styles.rescanButton}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.rescanButtonText}>Scanner à nouveau</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </CameraView>

      {/* Product Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              {product && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Produit trouvé</Text>
                    <TouchableOpacity onPress={closeModal}>
                      <Text style={styles.closeButton}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>

                    <View style={styles.productMeta}>
                      <Text style={styles.productSku}>SKU: {product.sku}</Text>
                      {product.barcode && (
                        <Text style={styles.productBarcode}>
                          Code-barres: {product.barcode}
                        </Text>
                      )}
                    </View>

                    {product.category && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{product.category.name}</Text>
                      </View>
                    )}

                    <View style={styles.priceStock}>
                      <View>
                        <Text style={styles.priceLabel}>Prix</Text>
                        <Text style={styles.priceValue}>
                          {formatPrice(product.price)}
                        </Text>
                      </View>
                      <View style={styles.stockInfo}>
                        <Text style={styles.stockLabel}>Stock</Text>
                        <Text style={styles.stockValue}>{product.stock} unités</Text>
                        <View
                          style={[
                            styles.stockBadge,
                            { backgroundColor: getStockStatus(product.stock).color },
                          ]}
                        >
                          <Text style={styles.stockBadgeText}>
                            {getStockStatus(product.stock).label}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {product.description && (
                      <View style={styles.descriptionSection}>
                        <Text style={styles.descriptionLabel}>Description</Text>
                        <Text style={styles.descriptionText}>
                          {product.description}
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.scanAgainButton}
                    onPress={closeModal}
                  >
                    <Text style={styles.scanAgainButtonText}>Scanner un autre produit</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 20,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  instructionText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  torchButton: {
    padding: 10,
  },
  torchIcon: {
    fontSize: 24,
  },
  scanFrame: {
    width: 300,
    height: 300,
    alignSelf: 'center',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#fff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  loadingOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  bottomBar: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rescanButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    fontSize: 28,
    color: '#6b7280',
    fontWeight: '300',
  },
  productInfo: {
    padding: 20,
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  productMeta: {
    marginBottom: 15,
  },
  productSku: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  productBarcode: {
    fontSize: 14,
    color: '#6b7280',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  categoryText: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '600',
  },
  priceStock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 5,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  stockInfo: {
    alignItems: 'flex-end',
  },
  stockLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 5,
  },
  stockValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 20,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  scanAgainButton: {
    backgroundColor: '#2563eb',
    margin: 20,
    marginTop: 10,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanAgainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
