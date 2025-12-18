/**
 * Service API pour le Shop (boutique pour clients lambda)
 */
import api from './api';

export interface ShopCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isVisible: boolean;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
  };
}

export interface ShopProduct {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  price: number;
  costPrice: number;
  compareAtPrice: number | null;
  stock: number;
  minStock: number;
  maxStock: number | null;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  availabilityStatus: 'AVAILABLE' | 'OUT_OF_STOCK' | 'PREORDER';
  isVisible: boolean;
  isFeatured: boolean;
  images: string[];
  thumbnail: string;
  categoryId: string;
  supplierId: string | null;
  weight: number | null;
  width: number | null;
  height: number | null;
  length: number | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface ShopProductsResponse {
  success: boolean;
  data: ShopProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

const shopAPI = {
  // ============ CATÉGORIES ============
  categories: {
    async getAll(): Promise<{ success: boolean; data: ShopCategory[] }> {
      const response = await api.get('/shop/categories');
      return response.data;
    },

    async getById(id: string): Promise<{ success: boolean; data: ShopCategory }> {
      const response = await api.get(`/shop/categories/${id}`);
      return response.data;
    },
  },

  // ============ PRODUITS ============
  products: {
    async getAll(params?: {
      page?: number;
      limit?: number;
      categoryId?: string;
      search?: string;
      featured?: boolean;
    }): Promise<ShopProductsResponse> {
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.featured !== undefined) queryParams.append('featured', params.featured.toString());

      const response = await api.get(`/shop/products?${queryParams.toString()}`);
      return response.data;
    },

    async getById(id: string): Promise<{ success: boolean; data: ShopProduct }> {
      const response = await api.get(`/shop/products/${id}`);
      return response.data;
    },

    async getFeatured(): Promise<ShopProductsResponse> {
      const response = await api.get('/shop/products?featured=true&limit=10');
      return response.data;
    },
  },

  // ============ PANIER (si backend supporte) ============
  cart: {
    async add(productId: string, quantity: number): Promise<{ success: boolean; message: string }> {
      const response = await api.post('/shop/cart/add', { productId, quantity });
      return response.data;
    },

    async update(productId: string, quantity: number): Promise<{ success: boolean; message: string }> {
      const response = await api.put('/shop/cart/update', { productId, quantity });
      return response.data;
    },

    async remove(productId: string): Promise<{ success: boolean; message: string }> {
      const response = await api.delete(`/shop/cart/remove/${productId}`);
      return response.data;
    },

    async get(): Promise<{ success: boolean; data: CartItem[] }> {
      const response = await api.get('/shop/cart');
      return response.data;
    },

    async clear(): Promise<{ success: boolean; message: string }> {
      const response = await api.delete('/shop/cart/clear');
      return response.data;
    },
  },

  // ============ COMMANDES ============
  orders: {
    async create(items: CartItem[]): Promise<{ success: boolean; data: Order }> {
      const response = await api.post('/shop/orders', { items });
      return response.data;
    },

    async getAll(): Promise<{ success: boolean; data: Order[] }> {
      const response = await api.get('/shop/orders');
      return response.data;
    },

    async getById(id: string): Promise<{ success: boolean; data: Order }> {
      const response = await api.get(`/shop/orders/${id}`);
      return response.data;
    },
  },
};

export default shopAPI;
