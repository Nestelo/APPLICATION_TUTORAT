// Configuration API pour l'application
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'http://192.168.43.210:8000';

// Configuration des endpoints
export const ENDPOINTS = {
  // Authentification
  LOGIN: '/api/accounts/login/',
  REGISTER: '/api/accounts/register/',
  REFRESH_TOKEN: '/api/accounts/token/refresh/',
  
  // Utilisateurs
  PROFILE: '/api/accounts/profile/',
  USERS: '/api/accounts/users/',
  
  // Statistiques et rapports
  STATS_PUBLIQUES: '/api/accounts/stats/',
  ADMIN_STATS: '/api/accounts/admin/stats/',
  
  // Rapports détaillés
  RAPPORTS_UTILISATEURS: '/api/accounts/rapports/utilisateurs/',
  RAPPORTS_TUTORAT: '/api/accounts/rapports/tutorat/',
  RAPPORTS_RESSOURCES: '/api/accounts/rapports/ressources/',
  RAPPORTS_FORUM: '/api/accounts/rapports/forum/',
  
  // Export
  EXPORT_RAPPORT: '/api/accounts/rapports/export/',
};

// Configuration des headers par défaut
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// Fonction utilitaire pour les requêtes API
export const apiRequest = async (endpoint, options = {}) => {
  const token = await AsyncStorage.getItem('accessToken');
  
  const config = {
    headers: {
      ...DEFAULT_HEADERS,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};
