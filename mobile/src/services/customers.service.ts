/**
 * Service de gestion des clients
 */
import api from './api';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type: 'INDIVIDUAL' | 'COMPANY';
  address?: string;
  city?: string;
  zipCode?: string;
  siret?: string;
  latitude?: number;
  longitude?: number;
  assignedToId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFilters {
  search?: string;
  type?: 'INDIVIDUAL' | 'COMPANY';
  assignedToId?: string;
  nearLocation?: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
}

/**
 * Récupérer la liste des clients
 */
export const getCustomers = async (filters?: CustomerFilters): Promise<Customer[]> => {
  try {
    const response = await api.get('/customers', { params: filters });
    console.log('📋 Réponse getCustomers:', response.data);

    // Le backend NEOCOM peut retourner {customers: [...]} ou directement un tableau
    const customersData = response.data.customers || response.data;

    // Normaliser chaque client pour correspondre à l'interface Customer
    return customersData.map((customer: any) => ({
      id: customer.id,
      name: customer.firstName && customer.lastName
        ? `${customer.firstName} ${customer.lastName}`.trim()
        : customer.companyName || customer.name || '',
      email: customer.email,
      phone: customer.phone || customer.mobile,
      type: customer.type,
      address: customer.address,
      city: customer.city,
      zipCode: customer.postalCode || customer.zipCode,
      siret: customer.siret,
      latitude: customer.latitude,
      longitude: customer.longitude,
      assignedToId: customer.userId,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    }));
  } catch (error: any) {
    console.error('Erreur lors de la récupération des clients:', error);
    throw new Error(error.response?.data?.message || 'Erreur de chargement des clients');
  }
};

/**
 * Récupérer un client par ID
 */
export const getCustomerById = async (id: string): Promise<Customer> => {
  try {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Erreur lors de la récupération du client:', error);
    throw new Error(error.response?.data?.message || 'Client introuvable');
  }
};

/**
 * Rechercher un client par QR Code
 */
export const findCustomerByQRCode = async (qrCode: string): Promise<Customer> => {
  try {
    const response = await api.get(`/customers/qr/${qrCode}`);
    return response.data;
  } catch (error: any) {
    console.error('Erreur lors de la recherche par QR Code:', error);
    throw new Error(error.response?.data?.message || 'Client non trouvé');
  }
};

/**
 * Rechercher des clients à proximité
 */
export const findNearbyCustomers = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 10
): Promise<Customer[]> => {
  try {
    const response = await api.get('/customers/nearby', {
      params: { latitude, longitude, radiusKm },
    });
    return response.data;
  } catch (error: any) {
    console.error('Erreur lors de la recherche de clients à proximité:', error);
    throw new Error(error.response?.data?.message || 'Erreur de recherche');
  }
};

/**
 * Créer un nouveau client
 */
export const createCustomer = async (customerData: Partial<Customer>): Promise<Customer> => {
  try {
    console.log('=== TENTATIVE DE CRÉATION CLIENT ===');
    console.log('Données envoyées:', JSON.stringify(customerData, null, 2));
    const response = await api.post('/customers', customerData);
    console.log('✅ Client créé avec succès:', response.data);

    // Le backend NEOCOM retourne {customer: {...}, message: "...", success: true}
    // On extrait l'objet customer
    const customer = response.data.customer || response.data;

    // Normaliser les champs pour correspondre à l'interface Customer
    return {
      id: customer.id,
      name: customer.firstName && customer.lastName
        ? `${customer.firstName} ${customer.lastName}`.trim()
        : customer.companyName || customer.name || '',
      email: customer.email,
      phone: customer.phone || customer.mobile,
      type: customer.type,
      address: customer.address,
      city: customer.city,
      zipCode: customer.postalCode || customer.zipCode,
      siret: customer.siret,
      latitude: customer.latitude,
      longitude: customer.longitude,
      assignedToId: customer.userId,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  } catch (error: any) {
    console.error('❌ ERREUR DE CRÉATION CLIENT:');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Message:', error.message);
    console.error('Error complet:', error);
    throw new Error(error.response?.data?.message || 'Erreur de création du client');
  }
};

/**
 * Mettre à jour un client
 */
export const updateCustomer = async (
  id: string,
  customerData: Partial<Customer>
): Promise<Customer> => {
  try {
    const response = await api.put(`/customers/${id}`, customerData);
    return response.data;
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du client:', error);
    throw new Error(error.response?.data?.message || 'Erreur de mise à jour');
  }
};
