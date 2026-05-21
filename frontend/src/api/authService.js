import api from './axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Configuration alternative pour contourner les problèmes CSRF
const BASE_URL = 'http://192.168.43.210:8000/api';
const simpleApi = axios.create({
  baseURL: BASE_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000,
});

// MODIFICATION: Ajout du paramètre selectedRole
export const login = async (email, password, selectedRole) => {
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Tentative de connexion ${attempt}/${maxRetries}, rôle: ${selectedRole}`);
      
      // Essayer d'abord avec l'API normale
      let response;
      try {
        response = await api.post('/auth/login/', {
          email,
          password,
          role: selectedRole,
          include_refresh: true,
        });
      } catch (apiError) {
        // Si erreur 403, essayer avec l'API simple
        if (apiError.response?.status === 403) {
          console.log('API normale bloquée (403), essai avec API simple...');
          response = await simpleApi.post('/auth/login/', {
            email,
            password,
            role: selectedRole,
            include_refresh: true,
          });
        } else {
          throw apiError;
        }
      }
      
      const { access, refresh, user } = response.data;
      
      // Vérification côté client si l'utilisateur est actif
      console.log('Vérification utilisateur actif:', user);
      const isActive = user.is_active !== undefined ? user.is_active : true;
      
      if (!isActive) {
        return { 
          success: false, 
          error: 'Votre compte n\'est pas encore activé par l\'administrateur.' 
        };
      }
      
      // Vérification du rôle AVEC ASSOUPLISSEMENT POUR ENSEIGNANT/TUTEUR
      if (selectedRole) {
        // Cas particulier : le rôle sélectionné est "tuteur" et l'utilisateur est "enseignant"
        if (selectedRole === 'tuteur' && user.role === 'enseignant') {
          console.log('✅ Connexion autorisée pour enseignant via le rôle tuteur');
        } else if (selectedRole !== user.role) {
          return {
            success: false,
            error: `Le rôle sélectionné (${selectedRole}) ne correspond pas à votre compte. Vous êtes connecté en tant que ${user.role}.`
          };
        }
      }
      
      // Stocker les tokens et les informations utilisateur
      await AsyncStorage.setItem('accessToken', access);
      if (refresh) {
        await AsyncStorage.setItem('refreshToken', refresh);
      }
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      console.log('Connexion réussie pour:', user.email, 'rôle:', user.role);
      return { success: true, user };
      
    } catch (error) {
      lastError = error;
      console.error(`Erreur tentative ${attempt}:`, error.response?.status, error.response?.data);
      
      // Gestion spécifique de l'erreur de rôle incompatible
      if (error.response?.status === 403 && error.response?.data?.error === 'role_mismatch') {
        return { 
          success: false, 
          error: error.response?.data?.message || 'Rôle incompatible avec votre compte.'
        };
      }
      
      // Si erreur 403 et pas dernière tentative, attendre et réessayer
      if (error.response?.status === 403 && attempt < maxRetries) {
        console.log(`Erreur 403, nouvelle tentative dans ${attempt * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        continue;
      }
      
      if (error.response?.status === 403 && attempt === maxRetries) {
        return { 
          success: false, 
          error: 'Le serveur a temporairement refusé la connexion. Veuillez réessayer dans quelques instants.' 
        };
      }
      
      break;
    }
  }
  
  return { 
    success: false, 
    error: lastError?.response?.data?.error || lastError?.response?.data?.detail || 'Erreur de connexion' 
  };
};

// Inscription utilisateur
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register/', userData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur d\'inscription:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data || 'Erreur d\'inscription' 
    };
  }
};

// Obtenir le profil utilisateur
export const getProfile = async () => {
  try {
    const response = await api.get('/auth/profile/');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur profil:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération du profil' 
    };
  }
};

// Mettre à jour le profil utilisateur
export const updateProfile = async (formData) => {
  try {
    const response = await api.put('/auth/profile/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur mise à jour profil:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la mise à jour du profil' 
    };
  }
};

// Changer le mot de passe
export const changePassword = async (oldPassword, newPassword) => {
  try {
    const response = await api.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur changement mot de passe:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors du changement de mot de passe' 
    };
  }
};

// Déconnexion
export const logout = async () => {
  try {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    return { success: true };
  } catch (error) {
    console.error('Erreur déconnexion:', error.message);
    return { success: false, error: 'Erreur lors de la déconnexion' };
  }
};

// Vérifier si l'utilisateur est connecté
export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    const user = await AsyncStorage.getItem('user');
    return !!(token && user);
  } catch (error) {
    console.error('Erreur vérification auth:', error.message);
    return false;
  }
};

// Obtenir l'utilisateur actuel
export const getCurrentUser = async () => {
  try {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error.message);
    return null;
  }
};

// Demande de tuteur
export const submitTutorRequest = async (requestData) => {
  try {
    const response = await api.post('/auth/demande-tuteur/', requestData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur demande tuteur:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la soumission de la demande' 
    };
  }
};

export default {
  login,
  register,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  isAuthenticated,
  getCurrentUser,
  submitTutorRequest,
};