/**
 * Service API pour les statistiques du dashboard
 */
import api from './api';

export interface DashboardStats {
  customers: {
    total: number;
    active: number;
    new: number;
  };
  invoices: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    totalAmount: number;
  };
  quotes: {
    total: number;
    accepted: number;
    pending: number;
    rejected: number;
    totalAmount: number;
  };
  creditNotes: {
    total: number;
    totalAmount: number;
  };
  deliveryNotes: {
    total: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
  };
  products: {
    total: number;
    lowStock: number;
  };
}

export interface StatsResponse {
  success: boolean;
  data: DashboardStats;
}

const statsAPI = {
  /**
   * Récupère les statistiques globales du dashboard
   */
  async getDashboardStats(): Promise<StatsResponse> {
    const response = await api.get('/stats/dashboard');
    return response.data;
  },

  /**
   * Récupère les statistiques des clients
   */
  async getCustomerStats(): Promise<{ success: boolean; data: DashboardStats['customers'] }> {
    const response = await api.get('/stats/customers');
    return response.data;
  },

  /**
   * Récupère les statistiques des factures
   */
  async getInvoiceStats(): Promise<{ success: boolean; data: DashboardStats['invoices'] }> {
    const response = await api.get('/stats/invoices');
    return response.data;
  },

  /**
   * Récupère les statistiques des devis
   */
  async getQuoteStats(): Promise<{ success: boolean; data: DashboardStats['quotes'] }> {
    const response = await api.get('/stats/quotes');
    return response.data;
  },
};

export default statsAPI;
