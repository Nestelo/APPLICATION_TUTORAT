import api from './axiosConfig';

// Tableau de bord étudiant
export const getStudentDashboard = async () => {
  const response = await api.get('/tutorat/student/dashboard/');
  return response.data;
};

// Séances de l'étudiant connecté
export const getStudentSeances = async () => {
  const response = await api.get('/tutorat/student/seances/');
  return response.data;
};

// Historique d'apprentissage
export const getStudentHistory = async () => {
  const response = await api.get('/tutorat/student/history/');
  return response.data;
};

// Réserver une séance à partir d'une offre
export const reserverSeance = async (offreId, payload) => {
  const response = await api.post(`/tutorat/student/offres/${offreId}/reserver/`, payload);
  return response.data;
};

// ---------- Services pour les ressources de groupe ----------

export const getRessourcesGroupe = async (params = {}) => {
  try {
    const response = await api.get('/ressources/groupes/ressources/', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur getRessourcesGroupe:', error);
    throw error;
  }
};

export const telechargerRessourceGroupe = async (ressourceId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    const response = await api.post(`/ressources/groupes/ressources/${ressourceId}/telecharger/`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur telechargerRessourceGroupe:', error);
    throw error;
  }
};

export const noterRessourceGroupe = async (ressourceId, note) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    const response = await api.post(`/ressources/groupes/ressources/${ressourceId}/noter/`, 
      { note },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Erreur noterRessourceGroupe:', error);
    throw error;
  }
};

export const toggleFavoriRessourceGroupe = async (ressourceId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    const response = await api.post(`/ressources/groupes/ressources/${ressourceId}/favori/`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur toggleFavoriRessourceGroupe:', error);
    throw error;
  }
};

export default {
  getStudentDashboard,
  getStudentSeances,
  getStudentHistory,
  reserverSeance,
};


