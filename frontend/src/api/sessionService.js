import api from './axiosConfig';

/**
 * Services pour la gestion complète des séances de tutorat
 */

// Obtenir les disponibilités détaillées d'un tuteur
export const getTutorDisponibilities = async (tutorId) => {
  try {
    const response = await api.get(`/tutorat/tuteurs/${tutorId}/disponibilites-detail/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur récupération disponibilités tuteur:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des disponibilités' 
    };
  }
};

// Inscrire un étudiant à une séance
export const bookSession = async (sessionData) => {
  try {
    const response = await api.post('/tutorat/seances/inscrire/', sessionData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur inscription séance:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de l\'inscription à la séance' 
    };
  }
};

// Annuler une séance
export const cancelSession = async (sessionId, motif = '') => {
  try {
    const response = await api.post(`/tutorat/seances/${sessionId}/annuler/`, { motif });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur annulation séance:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de l\'annulation de la séance' 
    };
  }
};

// Confirmer la participation à une séance
export const confirmParticipation = async (sessionId) => {
  try {
    const response = await api.post(`/tutorat/seances/${sessionId}/confirmer/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur confirmation participation:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la confirmation de participation' 
    };
  }
};

// Obtenir les séances de l'utilisateur connecté
export const getMySessions = async () => {
  try {
    const response = await api.get('/tutorat/mes-seances/');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur récupération mes séances:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des séances' 
    };
  }
};

// Obtenir les détails d'une séance spécifique
export const getSessionDetails = async (sessionId) => {
  try {
    const response = await api.get(`/tutorat/seances/${sessionId}/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur détails séance:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des détails de la séance' 
    };
  }
};

// Mettre à jour une séance (pour les tuteurs)
export const updateSession = async (sessionId, sessionData) => {
  try {
    const response = await api.patch(`/tutorat/seances/${sessionId}/`, sessionData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur mise à jour séance:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la mise à jour de la séance' 
    };
  }
};

// Générer un lien de réunion (pour les séances en ligne)
export const generateMeetingLink = async (sessionId) => {
  try {
    const response = await api.post(`/tutorat/seances/${sessionId}/generate-link/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur génération lien réunion:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la génération du lien de réunion' 
    };
  }
};

// Vérifier les conflits d'horaire pour un étudiant
export const checkScheduleConflicts = async (dateTimeStart, dateTimeEnd) => {
  try {
    const response = await api.post('/tutorat/seances/check-conflicts/', {
      date_heure_debut: dateTimeStart,
      date_heure_fin: dateTimeEnd
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur vérification conflits:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la vérification des conflits' 
    };
  }
};

// Obtenir l'historique des séances avec filtres
export const getSessionHistory = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.statut) params.append('statut', filters.statut);
    if (filters.date_debut) params.append('date_debut', filters.date_debut);
    if (filters.date_fin) params.append('date_fin', filters.date_fin);
    if (filters.matiere) params.append('matiere', filters.matiere);
    
    const response = await api.get(`/tutorat/mes-seances/history/?${params.toString()}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur historique séances:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération de l\'historique' 
    };
  }
};

// Exporter les séances en format CSV/Excel
export const exportSessions = async (format = 'csv', filters = {}) => {
  try {
    const params = new URLSearchParams();
    params.append('format', format);
    if (filters.date_debut) params.append('date_debut', filters.date_debut);
    if (filters.date_fin) params.append('date_fin', filters.date_fin);
    
    const response = await api.get(`/tutorat/mes-seances/export/?${params.toString()}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur export séances:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de l\'export des séances' 
    };
  }
};

export default {
  getTutorDisponibilities,
  bookSession,
  cancelSession,
  confirmParticipation,
  getMySessions,
  getSessionDetails,
  updateSession,
  generateMeetingLink,
  checkScheduleConflicts,
  getSessionHistory,
  exportSessions,
};
