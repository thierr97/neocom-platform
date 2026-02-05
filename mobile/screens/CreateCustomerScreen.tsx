/**
 * Écran de création de client
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createCustomer, CustomerType } from '../src/services/customers.service';

interface Props {
  navigation: any;
  route: any;
}

const CreateCustomerScreen: React.FC<Props> = ({ navigation, route }) => {
  const { documentType } = route.params || {};

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<CustomerType>('COMPANY');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [siret, setSiret] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateCustomer = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom est obligatoire');
      return;
    }

    if (email && !isValidEmail(email)) {
      Alert.alert('Erreur', 'Email invalide');
      return;
    }

    if (type === 'COMPANY' && siret && siret.length !== 14) {
      Alert.alert('Erreur', 'Le SIRET doit contenir 14 chiffres');
      return;
    }

    try {
      setLoading(true);

      const customerData: any = {
        type,
      };

      // Handle name field based on customer type
      if (type === 'INDIVIDUAL') {
        // Split name into firstName and lastName
        const nameParts = name.trim().split(' ');
        customerData.firstName = nameParts[0];
        customerData.lastName = nameParts.slice(1).join(' ') || nameParts[0];
      } else {
        // For COMPANY, use companyName
        customerData.companyName = name.trim();
      }

      if (email.trim()) customerData.email = email.trim();
      if (phone.trim()) customerData.phone = phone.trim();
      if (address.trim()) customerData.address = address.trim();
      if (city.trim()) customerData.city = city.trim();
      if (zipCode.trim()) customerData.zipCode = zipCode.trim();
      if (type === 'COMPANY' && siret.trim()) customerData.siret = siret.trim();

      const newCustomer = await createCustomer(customerData);

      Alert.alert(
        'Succès',
        'Le client a été créé avec succès',
        [
          {
            text: 'OK',
            onPress: () => {
              if (documentType) {
                // Si on vient d'un flux de création de document, naviguer vers ProductSelection
                navigation.navigate('ProductSelection', {
                  documentType,
                  customer: newCustomer,
                  customerId: newCustomer.id,
                  customerName: newCustomer.name,
                });
              } else {
                // Sinon, retourner à la liste des clients
                navigation.goBack();
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ ERREUR CRÉATION CLIENT (Screen):', error);
      console.error('Response:', error.response);
      console.error('Data:', error.response?.data);

      let errorMessage = 'Impossible de créer le client. Veuillez réessayer.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert(
        'Erreur de création',
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau client</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Type de client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type de client *</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'COMPANY' && styles.typeButtonActive,
              ]}
              onPress={() => setType('COMPANY')}
            >
              <Ionicons
                name="business"
                size={24}
                color={type === 'COMPANY' ? '#007AFF' : '#666'}
              />
              <Text
                style={[
                  styles.typeText,
                  type === 'COMPANY' && styles.typeTextActive,
                ]}
              >
                Entreprise
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'INDIVIDUAL' && styles.typeButtonActive,
              ]}
              onPress={() => setType('INDIVIDUAL')}
            >
              <Ionicons
                name="person"
                size={24}
                color={type === 'INDIVIDUAL' ? '#007AFF' : '#666'}
              />
              <Text
                style={[
                  styles.typeText,
                  type === 'INDIVIDUAL' && styles.typeTextActive,
                ]}
              >
                Particulier
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Informations principales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations principales</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Nom {type === 'COMPANY' ? 'de l\'entreprise' : 'complet'} *
            </Text>
            <TextInput
              style={styles.input}
              placeholder={type === 'COMPANY' ? 'ACME Corp' : 'Jean Dupont'}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="contact@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Téléphone</Text>
            <TextInput
              style={styles.input}
              placeholder="06 12 34 56 78"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {type === 'COMPANY' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SIRET</Text>
              <TextInput
                style={styles.input}
                placeholder="12345678901234"
                value={siret}
                onChangeText={setSiret}
                keyboardType="numeric"
                maxLength={14}
              />
              <Text style={styles.inputHint}>14 chiffres</Text>
            </View>
          )}
        </View>

        {/* Adresse */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adresse</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Rue</Text>
            <TextInput
              style={styles.input}
              placeholder="123 Rue de la République"
              value={address}
              onChangeText={setAddress}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.inputLabel}>Code postal</Text>
              <TextInput
                style={styles.input}
                placeholder="75001"
                value={zipCode}
                onChangeText={setZipCode}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>

            <View style={[styles.inputGroup, styles.flex2]}>
              <Text style={styles.inputLabel}>Ville</Text>
              <TextInput
                style={styles.input}
                placeholder="Paris"
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
              />
            </View>
          </View>
        </View>

        <View style={styles.requiredNote}>
          <Text style={styles.requiredNoteText}>* Champs obligatoires</Text>
        </View>
      </ScrollView>

      {/* Footer avec bouton de création */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateCustomer}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Créer le client</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#E8F4FF',
    borderColor: '#007AFF',
  },
  typeText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  typeTextActive: {
    color: '#007AFF',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  requiredNote: {
    padding: 16,
    alignItems: 'center',
  },
  requiredNoteText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
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

export default CreateCustomerScreen;
