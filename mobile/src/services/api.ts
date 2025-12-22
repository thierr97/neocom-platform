/**
 * Service API principal avec gestion de l'authentification
 */
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL du backend - modifiable via .env
const API_URL = process.env.API_URL || 'https://neocom-backend.onrender.com/api';

/**
 * Instance Axios configurée avec intercepteurs
 */
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secondes
});

/**
 * Intercepteur pour ajouter automatiquement le token JWT
 */
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Variable pour éviter les multiples tentatives de refresh simultanées
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

/**
 * Fonction pour rafraîchir le token
 */
const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = await AsyncStorage.getItem('refreshToken');

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    const { tokens } = response.data;

    // Sauvegarder les nouveaux tokens
    await AsyncStorage.setItem('authToken', tokens.accessToken);
    await AsyncStorage.setItem('refreshToken', tokens.refreshToken);

    return tokens.accessToken;
  } catch (error) {
    // Si le refresh échoue, nettoyer les données
    await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
    throw error;
  }
};

/**
 * Intercepteur pour gérer les erreurs de réponse
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Ne pas tenter de refresh pour les routes d'authentification
    const isAuthRoute = originalRequest.url?.includes('/auth/login') ||
                        originalRequest.url?.includes('/auth/register') ||
                        originalRequest.url?.includes('/auth/refresh');

    // Si 401/403 et que ce n'est pas déjà une retry et pas une route d'auth
    if ((error.response?.status === 401 || error.response?.status === 403) &&
        !originalRequest._retry &&
        !isAuthRoute) {
      originalRequest._retry = true;

      try {
        // Si un refresh est déjà en cours, attendre qu'il se termine
        if (isRefreshing) {
          const newToken = await refreshPromise;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }

        // Sinon, initier le refresh
        isRefreshing = true;
        refreshPromise = refreshAccessToken();

        const newToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        isRefreshing = false;
        refreshPromise = null;

        // Réessayer la requête originale avec le nouveau token
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshPromise = null;

        console.log('Token invalide ou expiré - nettoyage des données d\'authentification');

        // Nettoyer toutes les données d'authentification
        try {
          await AsyncStorage.multiRemove([
            'authToken',
            'refreshToken',
            'userId',
            'userRole',
            'user'
          ]);
        } catch (cleanupError) {
          console.error('Erreur lors du nettoyage des données:', cleanupError);
        }

        // L'utilisateur devra se reconnecter
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { API_URL };
