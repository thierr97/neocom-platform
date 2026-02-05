import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/services/api';

interface VisitReportModalProps {
  visible: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  latitude: number;
  longitude: number;
  onSuccess: () => void;
}

export default function VisitReportModal({
  visible,
  onClose,
  customerId,
  customerName,
  latitude,
  longitude,
  onSuccess,
}: VisitReportModalProps) {
  const [visitTitle, setVisitTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de la permission d\'accéder à la caméra');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de la permission d\'accéder à la galerie');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Ajouter une photo',
      'Choisissez une option',
      [
        {
          text: 'Prendre une photo',
          onPress: takePhoto,
        },
        {
          text: 'Choisir depuis la galerie',
          onPress: pickImageFromGallery,
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!visitTitle.trim()) {
      Alert.alert('Erreur', 'Veuillez ajouter un titre à votre visite');
      return;
    }

    if (!notes.trim()) {
      Alert.alert('Erreur', 'Veuillez ajouter une description de votre visite');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('customerId', customerId);
      formData.append('visitDate', new Date().toISOString());
      formData.append('title', visitTitle);
      formData.append('notes', notes);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());

      if (photo) {
        const filename = photo.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('photo', {
          uri: photo,
          name: filename || 'photo.jpg',
          type,
        } as any);
      }

      const response = await api.post('/gps/visits', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        Alert.alert('Succès', 'Visite enregistrée avec succès');
        setVisitTitle('');
        setNotes('');
        setPhoto(null);
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Error submitting visit:', error);
      Alert.alert(
        'Erreur',
        error.response?.data?.message || 'Impossible d\'enregistrer la visite'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (visitTitle || notes || photo) {
      Alert.alert(
        'Annuler',
        'Voulez-vous vraiment annuler ? Les données seront perdues.',
        [
          { text: 'Non', style: 'cancel' },
          {
            text: 'Oui',
            style: 'destructive',
            onPress: () => {
              setVisitTitle('');
              setNotes('');
              setPhoto(null);
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rapport de visite</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Client Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Client</Text>
            <View style={styles.clientCard}>
              <Text style={styles.clientName}>{customerName}</Text>
            </View>
          </View>

          {/* Visit Title */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Titre de la visite *</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Ex: Prospection, Suivi commande, Livraison..."
              value={visitTitle}
              onChangeText={setVisitTitle}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Photo Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📷 Photo de la visite</Text>

            {photo ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => setPhoto(null)}
                >
                  <Ionicons name="close-circle" size={32} color="#ef4444" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.changePhotoButton}
                  onPress={showPhotoOptions}
                >
                  <Ionicons name="camera" size={20} color="#fff" />
                  <Text style={styles.changePhotoText}>Changer la photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addPhotoButton} onPress={showPhotoOptions}>
                <Ionicons name="camera-outline" size={48} color="#2563eb" />
                <Text style={styles.addPhotoText}>Ajouter une photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Visit Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Description de la visite *</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Décrivez ce que vous avez fait chez le client..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.submitButtonText}>Enregistrer la visite</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: 50,
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  placeholder: {
    width: 38,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  clientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clientName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  titleInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoPreview: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  changePhotoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addPhotoButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  addPhotoText: {
    marginTop: 12,
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButton: {
    backgroundColor: '#10b981',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 30,
  },
});
