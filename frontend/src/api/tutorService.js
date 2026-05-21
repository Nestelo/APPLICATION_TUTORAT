import api from './axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ===== OFFRES DE TUTORAT =====

// Obtenir toutes les offres de tutorat
export const getOffres = async (params = {}) => {
  try {
    const response = await api.get('/tutorat/offres/', { params });
    const data = response.data;
    if (Array.isArray(data)) return { success: true, data };
    if (Array.isArray(data.results)) return { success: true, data: data.results };
    return { success: true, data: [] };
  } catch (error) {
    console.error('Erreur récupération offres:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des offres' 
    };
  }
};

// Obtenir une offre spécifique
export const getOffre = async (id) => {
  try {
    const response = await api.get(`/tutorat/offres/${id}/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur offre:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération de l\'offre' 
    };
  }
};

// Créer une nouvelle offre
export const createOffre = async (offreData) => {
  try {
    const response = await api.post('/tutorat/offres/', offreData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur création offre:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la création de l\'offre' 
    };
  }
};

// Mettre à jour une offre
export const updateOffre = async (id, offreData) => {
  try {
    const response = await api.put(`/tutorat/offres/${id}/`, offreData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur mise à jour offre:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la mise à jour de l\'offre' 
    };
  }
};

// Supprimer une offre
export const deleteOffre = async (id) => {
  try {
    const response = await api.delete(`/tutorat/offres/${id}/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur suppression offre:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la suppression de l\'offre' 
    };
  }
};

// ===== GROUPES DE TUTORAT =====

// Obtenir tous les groupes
export const getGroupes = async (params = {}) => {
  try {
    const response = await api.get('/tutorat/groupes/', { params });
    const data = response.data;
    if (Array.isArray(data)) return { success: true, data };
    if (Array.isArray(data.results)) return { success: true, data: data.results };
    return { success: true, data: [] };
  } catch (error) {
    console.error('Erreur récupération groupes:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des groupes' 
    };
  }
};

// Obtenir un groupe spécifique
export const getGroupe = async (id) => {
  try {
    const response = await api.get(`/tutorat/groupes/${id}/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur groupe:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération du groupe' 
    };
  }
};

// Créer un nouveau groupe
export const createGroupe = async (groupeData) => {
  try {
    const response = await api.post('/tutorat/groupes/', groupeData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur création groupe:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la création du groupe' 
    };
  }
};

// Mettre à jour un groupe
export const updateGroupe = async (id, groupeData) => {
  try {
    const response = await api.put(`/tutorat/groupes/${id}/`, groupeData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur mise à jour groupe:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la mise à jour du groupe' 
    };
  }
};

// Obtenir les membres d'un groupe
export const getMembresGroupe = async (groupeId) => {
  try {
    const response = await api.get(`/tutorat/groupes/${groupeId}/membres/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur récupération membres groupe:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Erreur lors de la récupération des membres du groupe' 
    };
  }
};

// Obtenir mes inscriptions
export const getMesInscriptions = async () => {
  try {
    const response = await api.get('/tutorat/inscriptions/');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur inscriptions:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des inscriptions' 
    };
  }
};

// Supprimer un groupe
export const deleteGroupe = async (id) => {
  try {
    const response = await api.delete(`/tutorat/groupes/${id}/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur suppression groupe:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la suppression du groupe' 
    };
  }
};

// ===== MEMBRES DES GROUPES =====

// S'inscrire à un groupe
export const inscrireGroupe = async (groupeId) => {
  try {
    const response = await api.post('/tutorat/inscriptions/', { groupe: groupeId });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur inscription groupe:', error.response?.data || error.message);
    
    let errorMessage = 'Erreur lors de l\'inscription au groupe';
    
    if (error.response?.data) {
      const errorData = error.response.data;
      if (typeof errorData === 'string') {
        if (errorData.includes('déjà inscrit')) {
          errorMessage = 'Vous êtes déjà inscrit à ce groupe';
        } else {
          errorMessage = errorData;
        }
      } else if (Array.isArray(errorData)) {
        errorMessage = errorData[0] || errorMessage;
      } else if (typeof errorData === 'object') {
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors[0] || errorMessage;
        } else {
          const firstKey = Object.keys(errorData)[0];
          if (firstKey && Array.isArray(errorData[firstKey])) {
            errorMessage = errorData[firstKey][0] || errorMessage;
          }
        }
      }
    }
    
    return { 
      success: false, 
      error: errorMessage
    };
  }
};

// ===== INSCRIPTIONS AUX GROUPES =====

// Accepter une inscription (tuteur)
export const accepterInscription = async (inscriptionId) => {
  try {
    const response = await api.post(`/tutorat/inscriptions/${inscriptionId}/accepter/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur accepter inscription:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de l\'acceptation de l\'inscription' 
    };
  }
};

// Refuser une inscription (tuteur)
export const refuserInscription = async (inscriptionId) => {
  try {
    const response = await api.post(`/tutorat/inscriptions/${inscriptionId}/refuser/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur refuser inscription:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors du refus de l\'inscription' 
    };
  }
};

// Quitter un groupe (étudiant)
export const quitterGroupe = async (inscriptionId) => {
  try {
    const response = await api.post(`/tutorat/inscriptions/${inscriptionId}/quitter/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur quitter groupe:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors du départ du groupe' 
    };
  }
};

// Obtenir les séances d'un groupe
export const getSeancesDuGroupe = async (groupeId) => {
  try {
    const response = await api.get(`/tutorat/groupes/${groupeId}/seances/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur séances groupe:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des séances' 
    };
  }
};

// Obtenir toutes les inscriptions (pour le tuteur)
export const getInscriptionsGroupe = async () => {
  try {
    const response = await api.get('/tutorat/inscriptions/');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur inscriptions groupe:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des inscriptions' 
    };
  }
};

// Obtenir les groupes disponibles
export const getGroupesDisponibles = async (params = {}) => {
  try {
    const response = await api.get('/tutorat/groupes/', { 
      params: { 
        ...params,
        places_disponibles: true 
      } 
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur groupes disponibles:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des groupes disponibles' 
    };
  }
};

// ===== GESTION DES MEMBRES DE GROUPE =====

// Ajouter un membre à un groupe
export const ajouterMembreGroupe = async (groupeId, membreData) => {
  try {
    const response = await api.post(`/tutorat/groupes/${groupeId}/ajouter-membre/`, membreData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur ajout membre groupe:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de l\'ajout du membre au groupe' 
    };
  }
};

// Supprimer un membre d'un groupe
export const supprimerMembreGroupe = async (groupeId, membreId) => {
  try {
    const response = await api.delete(`/tutorat/groupes/${groupeId}/membres/${membreId}/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur suppression membre groupe:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la suppression du membre du groupe' 
    };
  }
};

// ===== DISPONIBILITÉS =====

// Obtenir les disponibilités d'un tuteur
export const getDisponibilites = async (tuteurId) => {
  try {
    const response = await api.get('/tutorat/disponibilites/', { 
      params: { tuteur: tuteurId } 
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur disponibilités:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des disponibilités' 
    };
  }
};

// Créer une disponibilité
export const createDisponibilite = async (dispoData) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    const userId = 20; // ID temporaire, à remplacer par l'ID réel
    console.log('🔧 createDisponibilite - userId:', userId);
    const dataWithTuteur = { ...dispoData, tuteur: userId };
    console.log('📅 createDisponibilite - données envoyées:', dataWithTuteur);
    const response = await api.post('/tutorat/disponibilites/', dataWithTuteur);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Erreur création disponibilité:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data || 'Erreur lors de la création de la disponibilité' 
    };
  }
};

// Supprimer une disponibilité
export const deleteDisponibilite = async (id) => {
  try {
    const response = await api.delete(`/tutorat/disponibilites/${id}/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur suppression disponibilité:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la suppression de la disponibilité' 
    };
  }
};

// ===== SÉANCES =====

// Obtenir toutes les séances
export const getSeances = async (params = {}) => {
  try {
    const response = await api.get('/tutorat/seances/', { params });
    const data = response.data;
    if (Array.isArray(data)) return { success: true, data };
    if (Array.isArray(data.results)) return { success: true, data: data.results };
    return { success: true, data: [] };
  } catch (error) {
    console.error('Erreur séances:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des séances' 
    };
  }
};

// Obtenir une séance spécifique
export const getSeance = async (id) => {
  try {
    const response = await api.get(`/tutorat/seances/${id}/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur séance:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération de la séance' 
    };
  }
};

// Créer une séance
export const createSeance = async (seanceData) => {
  try {
    const response = await api.post('/tutorat/seances/', seanceData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur création séance:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la création de la séance' 
    };
  }
};

// Mettre à jour une séance
export const updateSeance = async (id, seanceData) => {
  try {
    const response = await api.put(`/tutorat/seances/${id}/`, seanceData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur mise à jour séance:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la mise à jour de la séance' 
    };
  }
};

// ===== ÉVALUATIONS =====

// Créer une évaluation
export const createEvaluation = async (evaluationData) => {
  try {
    const response = await api.post('/tutorat/evaluations/', evaluationData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur création évaluation:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la création de l\'évaluation' 
    };
  }
};

// Obtenir les évaluations
export const getEvaluations = async (params = {}) => {
  try {
    const response = await api.get('/tutorat/evaluations/', { params });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur évaluations:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des évaluations' 
    };
  }
};

// ===== RESSOURCES DE GROUPE =====

// Créer une ressource de groupe
export const creerRessourceGroupe = async (ressourceData) => {
  try {
    console.log('📤 Envoi FormData au backend...');
    const config = {
      headers: { 'Content-Type': 'multipart/form-data', 'Accept': 'application/json' }
    };
    if (ressourceData instanceof FormData) {
      console.log('📁 FormData entries:');
      for (let [key, value] of ressourceData.entries()) {
        console.log(`  ${key}:`, typeof value === 'object' ? value.name || value : value);
      }
    }
    const response = await api.post('/ressources/groupes/creer-ressource/', ressourceData, config);
    console.log('✅ Réponse backend reçue:', response.status);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Erreur création ressource groupe:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la création de la ressource de groupe' 
    };
  }
};

// Obtenir les ressources d'un groupe
export const getRessourcesGroupe = async (params = {}) => {
  try {
    const response = await api.get('/ressources/groupes/ressources/', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur getRessourcesGroupe:', error);
    throw error;
  }
};

// Publier une ressource de groupe (admin)
export const publierRessourceGroupe = async (ressourceId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    const response = await api.post(`/ressources/groupes/ressources/${ressourceId}/publier/`, {}, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur publierRessourceGroupe:', error);
    throw error;
  }
};

// Supprimer une ressource de groupe
export const supprimerRessourceGroupe = async (ressourceId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    const response = await api.delete(`/ressources/groupes/ressources/${ressourceId}/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur supprimerRessourceGroupe:', error);
    throw error;
  }
};

// ===== MESSAGES DE GROUPE =====

// Envoyer un message dans un groupe
export const envoyerMessageGroupe = async (groupeId, messageData) => {
  try {
    const response = await api.post(`/messaging/messages/`, { 
      contenu: messageData.contenu,
      groupe: parseInt(groupeId)
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur envoi message:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.detail || error.response?.data?.error || 'Erreur lors de l\'envoi du message' 
    };
  }
};

// Obtenir les messages d'un groupe
export const getMessagesGroupe = async (groupeId) => {
  try {
    const response = await api.get(`/messaging/messages/?groupe=${groupeId}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur récupération messages:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des messages' 
    };
  }
};

// ===== EXPORT PAR DÉFAUT (à la fin) =====

export default {
  // Offres
  getOffres,
  getOffre,
  createOffre,
  updateOffre,
  deleteOffre,
  
  // Groupes
  getGroupes,
  getGroupe,
  createGroupe,
  updateGroupe,
  deleteGroupe,
  getGroupesDisponibles,
  getMembresGroupe,
  getSeancesDuGroupe,
  
  // Inscriptions
  inscrireGroupe,
  getMesInscriptions,
  getInscriptionsGroupe,
  accepterInscription,
  refuserInscription,
  quitterGroupe,
  
  // Disponibilités
  getDisponibilites,
  createDisponibilite,
  deleteDisponibilite,
  
  // Séances
  getSeances,
  getSeance,
  createSeance,
  updateSeance,
  
  // Évaluations
  createEvaluation,
  getEvaluations,
  
  // Ressources de groupe
  creerRessourceGroupe,
  getRessourcesGroupe,
  publierRessourceGroupe,
  supprimerRessourceGroupe,
  
  // Messages de groupe
  envoyerMessageGroupe,
  getMessagesGroupe,
};