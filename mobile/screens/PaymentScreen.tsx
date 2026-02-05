/**
 * Écran d'encaissement de paiement
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/services/api';

interface Props {
  route: {
    params: {
      invoiceId: string;
      invoiceNumber: string;
      totalAmount: number;
      paidAmount: number;
    };
  };
  navigation: any;
}

type PaymentMethod = 'CREDIT_CARD' | 'CASH' | 'CHECK' | 'BANK_TRANSFER' | 'PAYLIB';

const PaymentScreen: React.FC<Props> = ({ route, navigation }) => {
  const { invoiceId, invoiceNumber, totalAmount, paidAmount } = route.params;
  const remainingAmount = totalAmount - paidAmount;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CASH');
  const [amount, setAmount] = useState(remainingAmount.toFixed(2));
  const [cardLastFourDigits, setCardLastFourDigits] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const paymentMethods: { id: PaymentMethod; label: string; icon: string }[] = [
    { id: 'CREDIT_CARD', label: 'Carte Bancaire', icon: 'card' },
    { id: 'CASH', label: 'Espèces', icon: 'cash' },
    { id: 'CHECK', label: 'Chèque', icon: 'document-text' },
    { id: 'BANK_TRANSFER', label: 'Virement', icon: 'swap-horizontal' },
    { id: 'PAYLIB', label: 'Paylib', icon: 'phone-portrait' },
  ];

  const handleSubmit = async () => {
    // Validation
    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      Alert.alert('Erreur', 'Montant invalide');
      return;
    }

    if (amountFloat > remainingAmount) {
      Alert.alert('Erreur', `Le montant ne peut pas dépasser ${remainingAmount.toFixed(2)}€`);
      return;
    }

    // Validation par méthode
    if (selectedMethod === 'CREDIT_CARD' && !cardLastFourDigits) {
      Alert.alert('Erreur', 'Veuillez saisir les 4 derniers chiffres de la carte');
      return;
    }

    if (selectedMethod === 'CHECK') {
      if (!checkNumber) {
        Alert.alert('Erreur', 'Veuillez saisir le numéro de chèque');
        return;
      }
      if (!bankName) {
        Alert.alert('Erreur', 'Veuillez saisir le nom de la banque');
        return;
      }
    }

    if (selectedMethod === 'BANK_TRANSFER' && !reference) {
      Alert.alert('Erreur', 'Veuillez saisir la référence du virement');
      return;
    }

    try {
      setLoading(true);

      const paymentData: any = {
        amount: amountFloat,
        method: selectedMethod,
        notes,
        paidAt: new Date().toISOString(),
      };

      // Ajouter les champs spécifiques selon la méthode
      if (selectedMethod === 'CREDIT_CARD') {
        paymentData.cardLastFourDigits = cardLastFourDigits;
      } else if (selectedMethod === 'CHECK') {
        paymentData.checkNumber = checkNumber;
        paymentData.bankName = bankName;
      } else if (selectedMethod === 'BANK_TRANSFER') {
        paymentData.reference = reference;
        paymentData.bankName = bankName;
      } else if (selectedMethod === 'PAYLIB') {
        paymentData.reference = reference;
      }

      const response = await api.post(`/invoices/${invoiceId}/payments`, paymentData);

      if (response.data.success) {
        Alert.alert(
          'Succès',
          `Paiement de ${amountFloat.toFixed(2)}€ enregistré avec succès`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Erreur', response.data.message || 'Erreur lors de l\'enregistrement du paiement');
      }
    } catch (error: any) {
      console.error('Error recording payment:', error);
      Alert.alert(
        'Erreur',
        error.response?.data?.message || 'Erreur lors de l\'enregistrement du paiement'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Encaisser le paiement</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Invoice Info */}
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceNumber}>Facture {invoiceNumber}</Text>
          <View style={styles.amountRow}>
            <Text style={styles.label}>Montant total:</Text>
            <Text style={styles.value}>{totalAmount.toFixed(2)}€</Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.label}>Déjà payé:</Text>
            <Text style={styles.valuePaid}>{paidAmount.toFixed(2)}€</Text>
          </View>
          <View style={[styles.amountRow, styles.remainingRow]}>
            <Text style={styles.labelBold}>Reste à payer:</Text>
            <Text style={styles.valueRemaining}>{remainingAmount.toFixed(2)}€</Text>
          </View>
        </View>

        {/* Payment Method Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mode de règlement</Text>
          <View style={styles.methodsGrid}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodCard,
                  selectedMethod === method.id && styles.methodCardActive,
                ]}
                onPress={() => setSelectedMethod(method.id)}
              >
                <Ionicons
                  name={method.icon as any}
                  size={32}
                  color={selectedMethod === method.id ? '#2563EB' : '#666'}
                />
                <Text
                  style={[
                    styles.methodLabel,
                    selectedMethod === method.id && styles.methodLabelActive,
                  ]}
                >
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Montant à encaisser</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
            <Text style={styles.inputSuffix}>€</Text>
          </View>
          <TouchableOpacity
            style={styles.fillButton}
            onPress={() => setAmount(remainingAmount.toFixed(2))}
          >
            <Text style={styles.fillButtonText}>Montant complet</Text>
          </TouchableOpacity>
        </View>

        {/* Method-specific fields */}
        {selectedMethod === 'CREDIT_CARD' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations carte</Text>
            <TextInput
              style={styles.textInput}
              value={cardLastFourDigits}
              onChangeText={setCardLastFourDigits}
              placeholder="4 derniers chiffres"
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>
        )}

        {selectedMethod === 'CHECK' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations chèque</Text>
            <TextInput
              style={styles.textInput}
              value={checkNumber}
              onChangeText={setCheckNumber}
              placeholder="Numéro de chèque"
              keyboardType="number-pad"
            />
            <TextInput
              style={[styles.textInput, styles.inputMargin]}
              value={bankName}
              onChangeText={setBankName}
              placeholder="Banque"
            />
          </View>
        )}

        {selectedMethod === 'BANK_TRANSFER' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations virement</Text>
            <TextInput
              style={styles.textInput}
              value={reference}
              onChangeText={setReference}
              placeholder="Référence du virement"
            />
            <TextInput
              style={[styles.textInput, styles.inputMargin]}
              value={bankName}
              onChangeText={setBankName}
              placeholder="Banque (optionnel)"
            />
          </View>
        )}

        {selectedMethod === 'PAYLIB' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations Paylib</Text>
            <TextInput
              style={styles.textInput}
              value={reference}
              onChangeText={setReference}
              placeholder="Numéro de transaction"
            />
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (optionnel)</Text>
          <TextInput
            style={[styles.textInput, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Ajouter une note..."
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.submitButtonText}>Enregistrer le paiement</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    backgroundColor: '#2563EB',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  invoiceInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  remainingRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  labelBold: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  value: {
    fontSize: 14,
    color: '#000',
  },
  valuePaid: {
    fontSize: 14,
    color: '#10B981',
  },
  valueRemaining: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  methodCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 6,
  },
  methodCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  methodLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  methodLabelActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  inputSuffix: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
  },
  fillButton: {
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    alignItems: 'center',
  },
  fillButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  textInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  inputMargin: {
    marginTop: 12,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default PaymentScreen;
