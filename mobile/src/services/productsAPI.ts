/**
 * Service API pour la gestion des produits
 */
import api from './api';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  imageUrl?: string;
  thumbnail?: string;
  images?: string[];
  sku?: string;
  barcode?: string;
  minStock?: number;
  costPrice?: number;
  compareAtPrice?: number;
  weight?: number;
  width?: number;
  height?: number;
  length?: number;
  tags?: string[];
  status?: string;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const productsAPI = {
  /**
   * Récupère la liste des produits avec filtres et pagination
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  }): Promise<ProductsResponse> {
    const response = await api.get('/shop/products', { params });
    return response.data;
  },

  /**
   * Récupère un produit par son ID
   */
  async getById(id: string): Promise<{ success: boolean; data: Product }> {
    const response = await api.get(`/shop/products/${id}`);
    return response.data;
  },

  /**
   * Recherche des produits
   */
  async search(query: string): Promise<ProductsResponse> {
    const response = await api.get('/shop/products', {
      params: { search: query },
    });
    return response.data;
  },
};

export default productsAPI;
