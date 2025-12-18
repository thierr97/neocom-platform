/**
 * Service API pour la gestion des documents (devis, factures, avoirs, bons de livraison)
 */
import api from './api';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import { getAuthToken } from './auth.service';

/**
 * Fonction pour réveiller le backend Render s'il est en sommeil
 * Cela évite les timeouts lors du téléchargement de PDF
 */
async function wakeUpBackend(): Promise<void> {
  try {
    const baseURL = api.defaults.baseURL?.replace('/api', '') || 'https://neocom-backend.onrender.com';

    console.log('🔄 Réveil du backend...');

    // Faire plusieurs tentatives de ping pour s'assurer que le backend se réveille
    for (let i = 0; i < 3; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes de timeout

        await fetch(`${baseURL}/health`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log(`✅ Ping ${i + 1}/3 réussi`);
      } catch (pingError) {
        console.log(`⏳ Ping ${i + 1}/3 (backend en cours de réveil...)`);
      }

      // Attendre entre chaque ping
      if (i < 2) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Attendre 8 secondes supplémentaires pour être sûr que le backend est complètement réveillé
    console.log('⏳ Attente de stabilisation du backend...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    console.log('✅ Backend prêt');
  } catch (error) {
    console.log('⚠️  Erreur wake-up (on continue quand même):', error);
    // On ne throw pas l'erreur car on veut quand même essayer le téléchargement
  }
}

export interface DocumentItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  items: DocumentItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  validUntil: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  items: DocumentItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
}

export interface DeliveryNote {
  id: string;
  deliveryNoteNumber: string;
  customerId: string;
  customerName: string;
  items: DocumentItem[];
  deliveryDate: string;
  status: 'pending' | 'delivered';
  createdAt: string;
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  customerId: string;
  customerName: string;
  items: DocumentItem[];
  subtotal: number;
  tax: number;
  total: number;
  reason: string;
  createdAt: string;
}

const documentsAPI = {
  // ============ DEVIS (Quotes) ============
  quotes: {
    async getAll(): Promise<{ success: boolean; data: Quote[] }> {
      const response = await api.get('/quotes');
      return response.data;
    },

    async create(data: {
      customerId: string;
      items: { productId: string; quantity: number; unitPrice: number }[];
      validUntil: string;
    }): Promise<{ success: boolean; data: Quote }> {
      const response = await api.post('/quotes', data);
      return response.data;
    },

    async getById(id: string): Promise<{ success: boolean; data: Quote }> {
      const response = await api.get(`/quotes/${id}`);
      return response.data;
    },

    async downloadPDF(id: string, quoteNumber: string): Promise<string> {
      try {
        // Réveiller le backend avant de télécharger le PDF
        console.log('🔄 Réveil du backend avant téléchargement PDF...');
        await wakeUpBackend();

        const token = await getAuthToken();
        const fileName = `Devis_${quoteNumber}.pdf`;

        // Sur iOS/Android, utiliser le dossier de cache accessible
        const fileUri = FileSystem.cacheDirectory + fileName;

        console.log('📥 Téléchargement du PDF...');
        const downloadResult = await FileSystem.downloadAsync(
          `${api.defaults.baseURL}/quotes/${id}/pdf`,
          fileUri,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log('✅ PDF téléchargé:', downloadResult.uri);
        return downloadResult.uri;
      } catch (error) {
        console.error('Error downloading quote PDF:', error);
        throw new Error('Erreur lors du téléchargement du PDF');
      }
    },

    async sharePDF(id: string, quoteNumber: string): Promise<void> {
      try {
        const fileUri = await this.downloadPDF(id, quoteNumber);
        const canShare = await Sharing.isAvailableAsync();

        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: `Partager le devis ${quoteNumber}`,
          });
        } else {
          throw new Error('Le partage n\'est pas disponible sur cet appareil');
        }
      } catch (error) {
        console.error('Error sharing quote PDF:', error);
        throw error;
      }
    },
  },

  // ============ FACTURES (Invoices) ============
  invoices: {
    async getAll(): Promise<{ success: boolean; data: Invoice[] }> {
      const response = await api.get('/invoices');
      return response.data;
    },

    async create(data: {
      customerId: string;
      items: { productId: string; quantity: number; unitPrice: number }[];
      dueDate: string;
    }): Promise<{ success: boolean; data: Invoice }> {
      const response = await api.post('/invoices', data);
      return response.data;
    },

    async getById(id: string): Promise<{ success: boolean; data: Invoice }> {
      const response = await api.get(`/invoices/${id}`);
      return response.data;
    },

    async downloadPDF(id: string, invoiceNumber: string): Promise<string> {
      try {
        // Réveiller le backend avant de télécharger le PDF
        console.log('🔄 Réveil du backend avant téléchargement PDF...');
        await wakeUpBackend();

        const token = await getAuthToken();
        const fileName = `Facture_${invoiceNumber}.pdf`;

        // Sur iOS/Android, utiliser le dossier de cache accessible
        const fileUri = FileSystem.cacheDirectory + fileName;

        console.log('📥 Téléchargement du PDF...');
        const downloadResult = await FileSystem.downloadAsync(
          `${api.defaults.baseURL}/invoices/${id}/pdf`,
          fileUri,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log('✅ PDF téléchargé:', downloadResult.uri);
        return downloadResult.uri;
      } catch (error) {
        console.error('Error downloading invoice PDF:', error);
        throw new Error('Erreur lors du téléchargement du PDF');
      }
    },

    async sharePDF(id: string, invoiceNumber: string): Promise<void> {
      try {
        const fileUri = await this.downloadPDF(id, invoiceNumber);
        const canShare = await Sharing.isAvailableAsync();

        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: `Partager la facture ${invoiceNumber}`,
          });
        } else {
          throw new Error('Le partage n\'est pas disponible sur cet appareil');
        }
      } catch (error) {
        console.error('Error sharing invoice PDF:', error);
        throw error;
      }
    },
  },

  // ============ BONS DE LIVRAISON (Delivery Notes) ============
  deliveryNotes: {
    async getAll(): Promise<{ success: boolean; data: DeliveryNote[] }> {
      const response = await api.get('/delivery-notes');
      return response.data;
    },

    async create(data: {
      customerId: string;
      items: { productId: string; quantity: number }[];
      deliveryDate: string;
    }): Promise<{ success: boolean; data: DeliveryNote }> {
      const response = await api.post('/delivery-notes', data);
      return response.data;
    },

    async getById(
      id: string
    ): Promise<{ success: boolean; data: DeliveryNote }> {
      const response = await api.get(`/delivery-notes/${id}`);
      return response.data;
    },

    async downloadPDF(id: string, deliveryNoteNumber: string): Promise<string> {
      try {
        // Réveiller le backend avant de télécharger le PDF
        console.log('🔄 Réveil du backend avant téléchargement PDF...');
        await wakeUpBackend();

        const token = await getAuthToken();
        const fileName = `BonLivraison_${deliveryNoteNumber}.pdf`;

        // Sur iOS/Android, utiliser le dossier de cache accessible
        const fileUri = FileSystem.cacheDirectory + fileName;

        console.log('📥 Téléchargement du PDF...');
        const downloadResult = await FileSystem.downloadAsync(
          `${api.defaults.baseURL}/delivery-notes/${id}/pdf`,
          fileUri,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log('✅ PDF téléchargé:', downloadResult.uri);
        return downloadResult.uri;
      } catch (error) {
        console.error('Error downloading delivery note PDF:', error);
        throw new Error('Erreur lors du téléchargement du PDF');
      }
    },

    async sharePDF(id: string, deliveryNoteNumber: string): Promise<void> {
      try {
        const fileUri = await this.downloadPDF(id, deliveryNoteNumber);
        const canShare = await Sharing.isAvailableAsync();

        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: `Partager le bon de livraison ${deliveryNoteNumber}`,
          });
        } else {
          throw new Error('Le partage n\'est pas disponible sur cet appareil');
        }
      } catch (error) {
        console.error('Error sharing delivery note PDF:', error);
        throw error;
      }
    },
  },

  // ============ AVOIRS (Credit Notes) ============
  creditNotes: {
    async getAll(): Promise<{ success: boolean; data: CreditNote[] }> {
      const response = await api.get('/credit-notes');
      return response.data;
    },

    async create(data: {
      customerId: string;
      items: { productId: string; quantity: number; unitPrice: number }[];
      reason: string;
    }): Promise<{ success: boolean; data: CreditNote }> {
      const response = await api.post('/credit-notes', data);
      return response.data;
    },

    async getById(id: string): Promise<{ success: boolean; data: CreditNote }> {
      const response = await api.get(`/credit-notes/${id}`);
      return response.data;
    },

    async downloadPDF(id: string): Promise<Blob> {
      const response = await api.get(`/credit-notes/${id}/pdf`, {
        responseType: 'blob',
      });
      return response.data;
    },
  },
};

export default documentsAPI;
