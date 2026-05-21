import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration API directe pour éviter les problèmes d'import
const API_BASE_URL = 'http://192.168.43.210:8000';

// Obtenir toutes les offres
export const getOffres = async (filters = {}) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    let url = `${API_BASE_URL}/api/tutorat/offres/`;
    
    // Ajouter les filtres à l'URL
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.results || data };
    } else {
      const error = await response.json();
      return { success: false, error };
    }
  } catch (error) {
    console.error('❌ Erreur getOffres:', error);
    return { success: false, error: error.message };
  }
};

// Obtenir une offre par ID
export const getOffreById = async (offreId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}/api/tutorat/offres/${offreId}/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const error = await response.json();
      return { success: false, error };
    }
  } catch (error) {
    console.error('❌ Erreur getOffreById:', error);
    return { success: false, error: error.message };
  }
};

// Créer une nouvelle offre
export const createOffre = async (offreData) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}/api/tutorat/offres/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(offreData)
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const error = await response.json();
      return { success: false, error };
    }
  } catch (error) {
    console.error('❌ Erreur createOffre:', error);
    return { success: false, error: error.message };
  }
};

// Mettre à jour une offre
export const updateOffre = async (offreId, offreData) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}/api/tutorat/offres/${offreId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(offreData)
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const error = await response.json();
      return { success: false, error };
    }
  } catch (error) {
    console.error('❌ Erreur updateOffre:', error);
    return { success: false, error: error.message };
  }
};

// Supprimer une offre
export const deleteOffre = async (offreId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}/api/tutorat/offres/${offreId}/`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.json();
      return { success: false, error };
    }
  } catch (error) {
    console.error('❌ Erreur deleteOffre:', error);
    return { success: false, error: error.message };
  }
};

// Dupliquer une offre
export const duplicateOffre = async (offreId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}/api/tutorat/offres/${offreId}/dupliquer_offre/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const error = await response.json();
      return { success: false, error };
    }
  } catch (error) {
    console.error('❌ Erreur duplicateOffre:', error);
    return { success: false, error: error.message };
  }
};

// Publier une offre
export const publishOffre = async (offreId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}/api/tutorat/offres/${offreId}/publier_offre/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const error = await response.json();
      return { success: false, error };
    }
  } catch (error) {
    console.error('❌ Erreur publishOffre:', error);
    return { success: false, error: error.message };
  }
};

// Valider une offre (admin)
export const validateOffre = async (offreId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}/api/tutorat/offres/${offreId}/valider_offre/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const error = await response.json();
      return { success: false, error };
    }
  } catch (error) {
    console.error('❌ Erreur validateOffre:', error);
    return { success: false, error: error.message };
  }
};

// Suspendre une offre (admin)
export const suspendOffre = async (offreId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}/api/tutorat/offres/${offreId}/suspendre_offre/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const error = await response.json();
      return { success: false, error };
    }
  } catch (error) {
    console.error('❌ Erreur suspendOffre:', error);
    return { success: false, error: error.message };
  }
};

// Générer le planning d'une offre
export const generatePlanning = async (offreId, dateDebut, dateFin) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    const requestBody = {};
    if (dateDebut) requestBody.date_debut = dateDebut;
    if (dateFin) requestBody.date_fin = dateFin;
    
    const response = await fetch(`${API_BASE_URL}/api/tutorat/offres/${offreId}/generer_planning/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const error = await response.json();
      return { success: false, error };
    }
  } catch (error) {
    console.error('❌ Erreur generatePlanning:', error);
    return { success: false, error: error.message };
  }
};

// Vérifier les disponibilités pour une offre
export const verifierDisponibilites = async (offreId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}/api/tutorat/offres/${offreId}/verifier_disponibilites/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const error = await response.json();
      return { success: false, error };
    }
  } catch (error) {
    console.error('❌ Erreur verifierDisponibilites:', error);
    return { success: false, error: error.message };
  }
};

// Obtenir les statistiques d'une offre
export const getOffreStats = async (offreId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}/api/tutorat/offres/${offreId}/statistiques/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const error = await response.json();
      return { success: false, error };
    }
  } catch (error) {
    console.error('❌ Erreur getOffreStats:', error);
    return { success: false, error: error.message };
  }
};

// Obtenir les inscriptions d'une offre
export const getOffreInscriptions = async (offreId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}/api/tutorat/inscriptions/?offre=${offreId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.results || data };
    } else {
      const error = await response.json();
      return { success: false, error };
    }
  } catch (error) {
    console.error('❌ Erreur getOffreInscriptions:', error);
    return { success: false, error: error.message };
  }
};

// Répondre à une inscription
export const repondreInscription = async (inscriptionId, reponse) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}/api/tutorat/inscriptions/${inscriptionId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        statut: reponse.statut,
        reponse_tuteur: reponse.message
      })
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const error = await response.json();
      return { success: false, error };
    }
  } catch (error) {
    console.error('❌ Erreur repondreInscription:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getOffres,
  getOffreById,
  createOffre,
  updateOffre,
  deleteOffre,
  duplicateOffre,
  publishOffre,
  validateOffre,
  suspendOffre,
  generatePlanning,
  verifierDisponibilites,
  getOffreStats,
  getOffreInscriptions,
  repondreInscription
};
