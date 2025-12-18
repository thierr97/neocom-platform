/**
 * Service d'authentification
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

/**
 * Connexion de l'utilisateur
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/login', credentials);
    const { token, user } = response.data;

    // Sauvegarder le token et l'utilisateur
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));

    return { token, user };
  } catch (error: any) {
    console.error('Erreur de connexion:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erreur de connexion au serveur');
  }
};

/**
 * Déconnexion de l'utilisateur
 */
export const logout = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  }
};

/**
 * Récupérer l'utilisateur connecté depuis le stockage local
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const userString = await AsyncStorage.getItem('user');
    if (userString) {
      return JSON.parse(userString);
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
};

/**
 * Vérifier si l'utilisateur est connecté
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return token !== null;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification:', error);
    return false;
  }
};

/**
 * Récupérer le token d'authentification
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Erreur lors de la récupération du token:', error);
    return null;
  }
};
