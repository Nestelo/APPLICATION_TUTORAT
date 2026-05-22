// Configuration API pour l'application
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ===== URL DU BACKEND =====
// URL de production sur Render (à utiliser pour l'APK final)
export const API_BASE_URL = 'https://tutorat-backend.onrender.com';

// Pour le développement local, décommentez la ligne ci-dessous et commentez celle du dessus
// export const API_BASE_URL = 'http://192.168.43.210:8000';

// Configuration des endpoints
export const ENDPOINTS = {
  // Authentification
  LOGIN: '/api/auth/login/',
  REGISTER: '/api/auth/register/',
  REFRESH_TOKEN: '/api/auth/token/refresh/',
  
  // Utilisateurs
  PROFILE: '/api/auth/profile/',
  USERS: '/api/auth/users/',
  
  // Statistiques et rapports
  STATS_PUBLIQUES: '/api/stats/',
  ADMIN_STATS: '/api/auth/admin/stats/',
  
  // Rapports détaillés
  RAPPORTS_UTILISATEURS: '/api/auth/rapports/utilisateurs/',
  RAPPORTS_TUTORAT: '/api/auth/rapports/tutorat/',
  RAPPORTS_RESSOURCES: '/api/auth/rapports/ressources/',
  RAPPORTS_FORUM: '/api/auth/rapports/forum/',
  
  // Export
  EXPORT_RAPPORT: '/api/auth/rapports/export/',
};

// Configuration des headers par défaut
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Vérifier la connexion Internet
const isNetworkAvailable = async () => {
  // Fonction simple pour vérifier si l'appareil a une connexion
  // Sur React Native, vous pouvez utiliser NetInfo pour une vérification plus poussée
  return true; // À remplacer par une vraie vérification si nécessaire
};

// Fonction utilitaire pour les requêtes API avec gestion du timeout
export const apiRequest = async (endpoint, options = {}, timeout = 30000) => {
  const token = await AsyncStorage.getItem('accessToken');
  
  // Vérifier si l'URL est accessible
  console.log(`🌐 Appel API: ${API_BASE_URL}${endpoint}`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  const config = {
    headers: {
      ...DEFAULT_HEADERS,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    signal: controller.signal,
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    clearTimeout(timeoutId);
    
    // Gestion spéciale pour le code 503 (service en veille sur Render)
    if (response.status === 503) {
      console.log('⏳ Service en réveil (503), nouvelle tentative dans 3 secondes...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      return apiRequest(endpoint, options, timeout); // Réessayer
    }
    
    if (!response.ok) {
      // Essayer de lire le message d'erreur JSON
      let errorMessage = `Erreur ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // Si ce n'est pas du JSON, garder le message par défaut
      }
      throw new Error(errorMessage);
    }
    
    // Pour les réponses vides (ex: DELETE)
    const text = await response.text();
    return text ? JSON.parse(text) : {};
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Gestion des erreurs de connexion
    if (error.name === 'AbortError') {
      throw new Error('La requête a expiré. Vérifiez votre connexion Internet.');
    }
    
    if (error.message === 'Failed to fetch' || error.message === 'Network request failed') {
      throw new Error('Impossible de joindre le serveur. Vérifiez votre connexion Internet.');
    }
    
    throw error;
  }
};

// Fonction pour vérifier l'état du backend
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stats/`, {
      method: 'GET',
      headers: DEFAULT_HEADERS,
    });
    return response.ok;
  } catch (error) {
    console.error('❌ Backend inaccessible:', error.message);
    return false;
  }
};

// Export par défaut
export default {
  API_BASE_URL,
  ENDPOINTS,
  apiRequest,
  checkBackendHealth,
};