/**
 * Service de gestion des devis
 */
import api from './api';

export interface QuoteItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  items: QuoteItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  validUntil: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
}

export interface CreateQuoteData {
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }>;
  notes?: string;
  validityDays?: number;
}

/**
 * Récupérer la liste des devis
 */
export const getQuotes = async (filters?: {
  status?: string;
  customerId?: string;
}): Promise<Quote[]> => {
  try {
    const response = await api.get('/quotes', { params: filters });
    return response.data;
  } catch (error: any) {
    console.error('Erreur lors de la récupération des devis:', error);
    throw new Error(error.response?.data?.message || 'Erreur de chargement des devis');
  }
};

/**
 * Récupérer un devis par ID
 */
export const getQuoteById = async (id: string): Promise<Quote> => {
  try {
    const response = await api.get(`/quotes/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Erreur lors de la récupération du devis:', error);
    throw new Error(error.response?.data?.message || 'Devis introuvable');
  }
};

/**
 * Créer un nouveau devis
 */
export const createQuote = async (quoteData: CreateQuoteData): Promise<Quote> => {
  try {
    const response = await api.post('/quotes', quoteData);
    return response.data;
  } catch (error: any) {
    console.error('Erreur lors de la création du devis:', error);
    throw new Error(error.response?.data?.message || 'Erreur de création du devis');
  }
};

/**
 * Mettre à jour un devis
 */
export const updateQuote = async (
  id: string,
  quoteData: Partial<CreateQuoteData>
): Promise<Quote> => {
  try {
    const response = await api.put(`/quotes/${id}`, quoteData);
    return response.data;
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du devis:', error);
    throw new Error(error.response?.data?.message || 'Erreur de mise à jour');
  }
};

/**
 * Envoyer un devis par email
 */
export const sendQuote = async (id: string, email?: string): Promise<void> => {
  try {
    await api.post(`/quotes/${id}/send`, { email });
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi du devis:', error);
    throw new Error(error.response?.data?.message || 'Erreur d\'envoi');
  }
};

/**
 * Convertir un devis en commande
 */
export const convertQuoteToOrder = async (id: string): Promise<{ orderId: string }> => {
  try {
    const response = await api.post(`/quotes/${id}/convert`);
    return response.data;
  } catch (error: any) {
    console.error('Erreur lors de la conversion du devis:', error);
    throw new Error(error.response?.data?.message || 'Erreur de conversion');
  }
};

/**
 * Télécharger le PDF d'un devis
 */
export const downloadQuotePDF = async (id: string): Promise<Blob> => {
  try {
    const response = await api.get(`/quotes/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error: any) {
    console.error('Erreur lors du téléchargement du PDF:', error);
    throw new Error(error.response?.data?.message || 'Erreur de téléchargement');
  }
};
