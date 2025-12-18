/**
 * Écran de création de devis - étape finale
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import documentsAPI from '../src/services/documentsAPI';

interface SelectedProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  discount: number;
}

interface Props {
  navigation: any;
  route: any;
}

const CreateQuoteScreen: React.FC<Props> = ({ navigation, route }) => {
  const { selectedProducts, customerId, customerName, customer } = route.params || {};

  const [products, setProducts] = useState<SelectedProduct[]>(selectedProducts || []);
  const [validUntil, setValidUntil] = useState<Date>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 jours
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');

  const TAX_RATE = 0.20; // TVA 20%

  const calculateSubtotal = () => {
    return products.reduce((total, product) => {
      const subtotal = product.price * product.quantity;
      const discountAmount = (subtotal * product.discount) / 100;
      return total + (subtotal - discountAmount);
    }, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * TAX_RATE;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setProducts(products.filter((p) => p.id !== productId));
    } else {
      setProducts(
        products.map((p) => (p.id === productId ? { ...p, quantity } : p))
      );
    }
  };

  const handleDiscountChange = (productId: string, discount: number) => {
    setProducts(
      products.map((p) =>
        p.id === productId
          ? { ...p, discount: Math.max(0, Math.min(100, discount)) }
          : p
      )
    );
  };

  const handleCreateQuote = async () => {
    if (products.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins un produit');
      return;
    }

    if (!customerId) {
      Alert.alert('Erreur', 'Aucun client sélectionné');
      return;
    }

    try {
      setLoading(true);

      // Préparer les données pour l'API
      const items = products.map((product) => ({
        productId: product.id,
        quantity: product.quantity,
        unitPrice: product.price * (1 - product.discount / 100), // Prix avec remise appliquée
      }));

      const quoteData = {
        customerId,
        items,
        validUntil: validUntil.toISOString(),
      };

      const response = await documentsAPI.quotes.create(quoteData);

      if (response.success) {
        Alert.alert(
          'Succès',
          'Le devis a été créé avec succès',
          [
            {
              text: 'OK',
              onPress: () => {
                // Retourner à l'écran de liste des devis
                navigation.navigate('Main', {
                  screen: 'DocumentsTab',
                });
                // Puis naviguer vers l'écran Quotes
                navigation.navigate('Quotes');
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Erreur lors de la création du devis:', error);
      Alert.alert(
        'Erreur',
        error.response?.data?.message ||
          'Impossible de créer le devis. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderProductItem = (product: SelectedProduct, index: number) => {
    const subtotal = product.price * product.quantity;
    const discountAmount = (subtotal * product.discount) / 100;
    const totalWithDiscount = subtotal - discountAmount;

    return (
      <View key={product.id} style={styles.productItem}>
        <View style={styles.productHeader}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>
          <TouchableOpacity
            onPress={() => handleQuantityChange(product.id, 0)}
            style={styles.removeButton}
          >
            <Ionicons name="close-circle" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        <View style={styles.productDetails}>
          <Text style={styles.productPrice}>{product.price.toFixed(2)} €</Text>

          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() =>
                handleQuantityChange(product.id, product.quantity - 1)
              }
            >
              <Ionicons name="remove" size={16} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.quantityText}>{product.quantity}</Text>

            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() =>
                handleQuantityChange(product.id, product.quantity + 1)
              }
            >
              <Ionicons name="add" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.discountContainer}>
            <TextInput
              style={styles.discountInput}
              keyboardType="numeric"
              placeholder="0"
              value={product.discount > 0 ? product.discount.toString() : ''}
              onChangeText={(text) =>
                handleDiscountChange(product.id, parseFloat(text) || 0)
              }
            />
            <Text style={styles.discountLabel}>%</Text>
          </View>

          <Text style={styles.productTotal}>
            {totalWithDiscount.toFixed(2)} €
          </Text>
        </View>

        {product.discount > 0 && (
          <Text style={styles.discountInfo}>
            Remise: -{discountAmount.toFixed(2)} € ({product.discount}%)
          </Text>
        )}
      </View>
    );
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setValidUntil(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Créer un devis</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Informations client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client</Text>
          <View style={styles.customerCard}>
            <Ionicons name="person" size={20} color="#007AFF" />
            <Text style={styles.customerName}>{customerName || customer?.name}</Text>
          </View>
        </View>

        {/* Date de validité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date de validité</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#007AFF" />
            <Text style={styles.dateText}>
              {validUntil.toLocaleDateString('fr-FR')}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={validUntil}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Liste des produits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Produits ({products.length})
          </Text>
          {products.map((product, index) => renderProductItem(product, index))}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (optionnel)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Ajouter des notes ou commentaires..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Totaux */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Récapitulatif</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sous-total HT</Text>
              <Text style={styles.summaryValue}>
                {calculateSubtotal().toFixed(2)} €
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>TVA (20%)</Text>
              <Text style={styles.summaryValue}>
                {calculateTax().toFixed(2)} €
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowTotal]}>
              <Text style={styles.summaryLabelTotal}>Total TTC</Text>
              <Text style={styles.summaryValueTotal}>
                {calculateTotal().toFixed(2)} €
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer avec bouton de création */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateQuote}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Créer le devis</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    gap: 12,
  },
  customerName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    gap: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  productItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  removeButton: {
    marginLeft: 8,
  },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
    minWidth: 60,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    backgroundColor: '#007AFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  discountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    textAlign: 'center',
    width: 50,
    backgroundColor: '#fff',
  },
  discountLabel: {
    fontSize: 14,
    color: '#666',
  },
  productTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    minWidth: 80,
    textAlign: 'right',
  },
  discountInfo: {
    fontSize: 12,
    color: '#34C759',
    marginTop: 4,
    textAlign: 'right',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fff',
    minHeight: 100,
  },
  summaryCard: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryRowTotal: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  summaryLabelTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryValueTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  createButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#999',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateQuoteScreen;
