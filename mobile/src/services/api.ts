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

/**
 * Intercepteur pour gérer les erreurs de réponse
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Si 401 Unauthorized ou 403 Forbidden, le token est invalide ou expiré
    if (error.response?.status === 401 || error.response?.status === 403) {
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
      // La navigation sera gérée automatiquement par App.tsx qui détecte l'absence de token
    }

    return Promise.reject(error);
  }
);

export default api;
export { API_URL };
