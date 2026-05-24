import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration de base - CORRECTION : utiliser URL Render
const BASE_URL = 'https://application-tutorat.onrender.com/api';

// Création de l'instance axios
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true, // Pour les cookies CSRF
  timeout: 15000, // Augmenté à 15 secondes
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Ajouter un header anti-CSRF pour les requêtes POST/PUT/DELETE
      if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())) {
        config.headers['X-CSRF-Token'] = 'csrf-token';
      }
    } catch (error) {
      console.log('Erreur lors de la récupération du token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer le rafraîchissement du token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Si erreur 403, c'est probablement une erreur de permission du backend
    if (error.response?.status === 403) {
      console.log('Erreur 403 Forbidden - Vérifier les permissions backend');
      return Promise.reject(error);
    }
    
    // Si erreur 401 et pas de retry déjà effectué
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (refreshToken) {
          // Tenter de rafraîchir le token
          const refreshResponse = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = refreshResponse.data;
          await AsyncStorage.setItem('accessToken', access);
          
          // Réessayer la requête originale avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } else {
          // Pas de refresh token, déconnecter l'utilisateur
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
          throw new Error('Session expirée - Veuillez vous reconnecter');
        }
      } catch (refreshError) {
        // Erreur lors du rafraîchissement, nettoyer et déconnecter
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        throw new Error('Session expirée - Veuillez vous reconnecter');
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;