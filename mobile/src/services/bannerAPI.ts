/**
 * API pour les bannières de la boutique
 * Synchronisé avec le web
 */
import api from './api';

export interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  backgroundType: string;
  backgroundValue: string | null;
  textColor: string;
  buttonColor: string | null;
  mainImage: string | null;
  showBadge: boolean;
  badgeText: string | null;
  badgeColor: string | null;
  showCountdown: boolean;
  endDate: string | null;
  placement: string;
  isActive: boolean;
  priority: number;
  layout: string;
  height: string;
}

export interface BannerResponse {
  success: boolean;
  data: Banner[];
  message?: string;
}

const bannerAPI = {
  /**
   * Récupère toutes les bannières actives
   */
  getActive: async (): Promise<BannerResponse> => {
    try {
      const response = await api.get('/shop/banners/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching banners:', error);
      return { success: false, data: [], message: 'Erreur lors du chargement des bannières' };
    }
  },

  /**
   * Récupère les bannières par placement
   */
  getByPlacement: async (placement: string): Promise<BannerResponse> => {
    try {
      const response = await api.get(`/shop/banners/active?placement=${placement}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching banners for placement ${placement}:`, error);
      return { success: false, data: [], message: 'Erreur lors du chargement des bannières' };
    }
  },
};

export default bannerAPI;
