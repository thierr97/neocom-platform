/**
 * Service API pour la gestion des catégories
 */
import api from './api';

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  parentId?: string | null;
  children?: Category[];
}

export interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

const categoriesAPI = {
  /**
   * Récupère toutes les catégories avec leur hiérarchie
   */
  async getAll(): Promise<CategoriesResponse> {
    const response = await api.get('/shop/categories');
    return response.data;
  },

  /**
   * Récupère une catégorie par son ID
   */
  async getById(id: string): Promise<{ success: boolean; data: Category }> {
    const response = await api.get(`/shop/categories/${id}`);
    return response.data;
  },

  /**
   * Récupère les catégories principales (sans parent)
   */
  async getTopLevel(): Promise<CategoriesResponse> {
    const response = await api.get('/shop/categories', {
      params: { topLevel: true },
    });
    return response.data;
  },
};

export default categoriesAPI;
