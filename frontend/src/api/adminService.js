import api from './axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUsers, updateUserStatus, deleteUser } from './userService';

export const getDemandesTuteur = async () => {
  const response = await api.get('/auth/demandes-tuteur/');
  return response.data;
};

export const validerDemande = async (id) => {
  const response = await api.post(`/auth/demandes-tuteur/${id}/valider/`);
  return response.data;
};

export const rejeterDemande = async (id, commentaire) => {
  const response = await api.post(`/auth/demandes-tuteur/${id}/rejeter/`, { commentaire });
  return response.data;
};

export const getSignalements = async () => {
  const response = await api.get('/ressources/signalements/');
  return response.data;
};

export const traiterSignalement = async (id) => {
  const response = await api.post(`/ressources/signalements/${id}/traiter/`);
  return response.data;
};

export const getStatsAdmin = async () => {
  const response = await api.get('/auth/admin/stats/');
  return response.data;
};

// ---------- Services pour l'administration des ressources de groupe ----------

export const getRessourcesGroupeEnAttente = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    const response = await api.get('/ressources/admin/groupes/ressources/en-attente/', { 
      params,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur getRessourcesGroupeEnAttente:', error);
    throw error;
  }
};

export const validerRessourceGroupe = async (ressourceId, token) => {
  try {
    const response = await api.post(`/ressources/admin/groupes/ressources/${ressourceId}/valider/`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur validerRessourceGroupe:', error);
    return { success: false, error: error.response?.data?.error || 'Erreur lors de la validation' };
  }
};

export const rejeterRessourceGroupe = async (ressourceId, motif, token) => {
  try {
    const response = await api.post(`/ressources/admin/groupes/ressources/${ressourceId}/rejeter/`, 
      { motif },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur rejeterRessourceGroupe:', error);
    return { success: false, error: error.response?.data?.error || 'Erreur lors du rejet' };
  }
};

export const createAnnouncement = async (payload) => {
  const response = await api.post('/notifications/admin/announcements/', payload);
  return response.data;
};

// Moderation endpoints (admin)
export const getModerationQuestions = async (params = {}) => {
  const response = await api.get('/forum/admin/moderation/questions/', { params });
  return response.data;
};

export const getModerationResponses = async (params = {}) => {
  const response = await api.get('/forum/admin/moderation/reponses/', { params });
  return response.data;
};

export const deleteQuestion = async (id, reason = '') => {
  const response = await api.post(`/forum/admin/moderation/questions/${id}/delete/`, { reason });
  return response.data;
};

export const restoreQuestion = async (id, reason = '') => {
  const response = await api.post(`/forum/admin/moderation/questions/${id}/restore/`, { reason });
  return response.data;
};

export const deleteResponse = async (id, reason = '') => {
  const response = await api.post(`/forum/admin/moderation/reponses/${id}/delete/`, { reason });
  return response.data;
};

export const restoreResponse = async (id, reason = '') => {
  const response = await api.post(`/forum/admin/moderation/reponses/${id}/restore/`, { reason });
  return response.data;
};

export const suspendUser = async (id, payload) => {
  const response = await api.post(`/forum/admin/moderation/users/${id}/suspend/`, payload);
  return response.data;
};

export const unsuspendUser = async (id) => {
  const response = await api.post(`/forum/admin/moderation/users/${id}/unsuspend/`);
  return response.data;
};

// Réexport des fonctions de gestion des utilisateurs (communes)
export { getUsers, updateUserStatus, deleteUser };