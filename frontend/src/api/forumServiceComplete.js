import api from './axiosConfig';

// Questions
export const getQuestions = async (params = {}) => {
  try {
    const response = await api.get('/forum/questions/', { params });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur getQuestions:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des questions' 
    };
  }
};

export const getQuestion = async (id) => {
  try {
    const response = await api.get(`/forum/questions/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur getQuestion:', error.response?.data || error.message);
    throw error;
  }
};

export const createQuestion = async (questionData) => {
  try {
    console.log('Données envoyées pour créer une question:', questionData);
    const response = await api.post('/forum/questions/', questionData);
    console.log('Réponse du serveur:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur createQuestion:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Détails de l\'erreur:', error.response?.data);
    throw error;
  }
};

export const updateQuestion = async (id, questionData) => {
  try {
    const response = await api.put(`/forum/questions/${id}/`, questionData);
    return response.data;
  } catch (error) {
    console.error('Erreur updateQuestion:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteQuestion = async (id) => {
  try {
    const response = await api.delete(`/forum/questions/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur deleteQuestion:', error.response?.data || error.message);
    throw error;
  }
};

export const incrementerVue = async (id) => {
  try {
    const response = await api.post(`/forum/questions/${id}/vue/`);
    return response.data;
  } catch (error) {
    console.error('Erreur incrementerVue:', error.response?.data || error.message);
    throw error;
  }
};

// Réponses
export const getReponses = async (questionId) => {
  try {
    const response = await api.get(`/forum/reponses/?question=${questionId}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur getReponses:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des réponses' 
    };
  }
};

export const createReponse = async (reponseData) => {
  try {
    const response = await api.post('/forum/reponses/', reponseData);
    return response.data;
  } catch (error) {
    console.error('Erreur createReponse:', error.response?.data || error.message);
    throw error;
  }
};

export const updateReponse = async (id, reponseData) => {
  try {
    const response = await api.put(`/forum/reponses/${id}/`, reponseData);
    return response.data;
  } catch (error) {
    console.error('Erreur updateReponse:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteReponse = async (id) => {
  try {
    const response = await api.delete(`/forum/reponses/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur deleteReponse:', error.response?.data || error.message);
    throw error;
  }
};

// Votes
export const voterReponse = async (reponseId, voteValue) => {
  try {
    const response = await api.post(`/forum/reponses/${reponseId}/voter/`, { valeur: voteValue });
    return response.data;
  } catch (error) {
    console.error('Erreur voterReponse:', error.response?.data || error.message);
    throw error;
  }
};

// Abonnements
export const abonnerQuestion = async (questionId) => {
  try {
    const response = await api.post(`/forum/questions/${questionId}/abonner/`);
    return response.data;
  } catch (error) {
    console.error('Erreur abonnerQuestion:', error.response?.data || error.message);
    throw error;
  }
};

export const desabonnerQuestion = async (questionId) => {
  try {
    const response = await api.delete(`/forum/questions/${questionId}/desabonner/`);
    return response.data;
  } catch (error) {
    console.error('Erreur desabonnerQuestion:', error.response?.data || error.message);
    throw error;
  }
};

export const getQuestionsSuivies = async () => {
  try {
    const response = await api.get('/forum/questions/suivies/');
    return response.data;
  } catch (error) {
    console.error('Erreur getQuestionsSuivies:', error.response?.data || error.message);
    throw error;
  }
};

// Messages vocaux
export const envoyerMessageVocal = async (reponseId, formData) => {
  try {
    const response = await api.post(`/forum/reponses/${reponseId}/message-vocal/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erreur envoyerMessageVocal:', error.response?.data || error.message);
    throw error;
  }
};

export const getMessagesVocauxReponse = async (reponseId) => {
  try {
    const response = await api.get(`/forum/reponses/${reponseId}/messages-vocaux/`);
    return response.data;
  } catch (error) {
    console.error('Erreur getMessagesVocauxReponse:', error.response?.data || error.message);
    throw error;
  }
};

export const supprimerMessageVocal = async (messageId) => {
  try {
    const response = await api.delete(`/forum/messages-vocaux/${messageId}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur supprimerMessageVocal:', error.response?.data || error.message);
    throw error;
  }
};

// Notifications
export const getNotificationsForum = async (params = {}) => {
  try {
    const response = await api.get('/forum/notifications/', { params });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur getNotificationsForum:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des notifications' 
    };
  }
};

export const marquerNotificationLue = async (notificationId) => {
  try {
    const response = await api.post(`/forum/notifications/${notificationId}/marquer-lue/`);
    return response.data;
  } catch (error) {
    console.error('Erreur marquerNotificationLue:', error.response?.data || error.message);
    throw error;
  }
};

export const marquerToutesNotificationsLues = async () => {
  try {
    const response = await api.post('/forum/notifications/marquer-toutes-lues/');
    return response.data;
  } catch (error) {
    console.error('Erreur marquerToutesNotificationsLues:', error.response?.data || error.message);
    throw error;
  }
};

export const supprimerNotification = async (notificationId) => {
  try {
    const response = await api.delete(`/forum/notifications/${notificationId}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur supprimerNotification:', error.response?.data || error.message);
    throw error;
  }
};

// Statistiques
export const getStatistiquesForum = async () => {
  try {
    const response = await api.get('/forum/statistiques/');
    return response.data;
  } catch (error) {
    console.error('Erreur getStatistiquesForum:', error.response?.data || error.message);
    throw error;
  }
};

export const getStatistiquesAdmin = async () => {
  try {
    const response = await api.get('/forum/statistiques/admin/');
    return response.data;
  } catch (error) {
    console.error('Erreur getStatistiquesAdmin:', error.response?.data || error.message);
    throw error;
  }
};

// Badges
export const getBadgesForum = async () => {
  try {
    const response = await api.get('/forum/badges/');
    return response.data;
  } catch (error) {
    console.error('Erreur getBadgesForum:', error.response?.data || error.message);
    throw error;
  }
};

// Solutions
export const marquerSolution = async (reponseId) => {
  try {
    const response = await api.post(`/forum/reponses/${reponseId}/marquer-solution/`);
    return response.data;
  } catch (error) {
    console.error('Erreur marquerSolution:', error.response?.data || error.message);
    throw error;
  }
};

export const demarquerSolution = async (reponseId) => {
  try {
    const response = await api.post(`/forum/reponses/${reponseId}/demarquer-solution/`);
    return response.data;
  } catch (error) {
    console.error('Erreur demarquerSolution:', error.response?.data || error.message);
    throw error;
  }
};

// Signalements
export const signalerQuestion = async (questionId, raison) => {
  try {
    const response = await api.post(`/forum/questions/${questionId}/signaler/`, { raison });
    return response.data;
  } catch (error) {
    console.error('Erreur signalerQuestion:', error.response?.data || error.message);
    throw error;
  }
};

export const signalerReponse = async (reponseId, raison) => {
  try {
    const response = await api.post(`/forum/reponses/${reponseId}/signaler/`, { raison });
    return response.data;
  } catch (error) {
    console.error('Erreur signalerReponse:', error.response?.data || error.message);
    throw error;
  }
};

export const getSignalements = async (params = {}) => {
  try {
    const response = await api.get('/forum/signalements/', { params });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur getSignalements:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des signalements' 
    };
  }
};

// Suggestions de questions similaires
export const suggestionsQuestionsSimilaires = async (params = {}) => {
  try {
    const response = await api.get('/forum/questions/suggestions/', { params });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur suggestionsQuestionsSimilaires:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des suggestions' 
    };
  }
};

// Recherche avancée
export const rechercheAvancee = async (params = {}) => {
  try {
    const response = await api.get('/forum/recherche/avancee/', { params });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur rechercheAvancee:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la recherche avancée' 
    };
  }
};

// Tags populaires
export const getTagsPopulaires = async () => {
  try {
    const response = await api.get('/forum/tags/populaires/');
    return response.data;
  } catch (error) {
    console.error('Erreur getTagsPopulaires:', error.response?.data || error.message);
    throw error;
  }
};

// Utilisateurs actifs
export const getUtilisateursActifs = async () => {
  try {
    const response = await api.get('/forum/utilisateurs/actifs/');
    return response.data;
  } catch (error) {
    console.error('Erreur getUtilisateursActifs:', error.response?.data || error.message);
    throw error;
  }
};

// Modération (Admin)
export const suspendreUtilisateur = async (userId, raison, until = null) => {
  try {
    const response = await api.post(`/forum/admin/utilisateurs/${userId}/suspendre/`, { 
      raison, 
      until 
    });
    return response.data;
  } catch (error) {
    console.error('Erreur suspendreUtilisateur:', error.response?.data || error.message);
    throw error;
  }
};

export const reactiverUtilisateur = async (userId) => {
  try {
    const response = await api.post(`/forum/admin/utilisateurs/${userId}/reactiver/`);
    return response.data;
  } catch (error) {
    console.error('Erreur reactiverUtilisateur:', error.response?.data || error.message);
    throw error;
  }
};

export const bannirUtilisateur = async (userId, raison) => {
  try {
    const response = await api.post(`/forum/admin/utilisateurs/${userId}/bannir/`, { raison });
    return response.data;
  } catch (error) {
    console.error('Erreur bannirUtilisateur:', error.response?.data || error.message);
    throw error;
  }
};

export const modererQuestion = async (questionId, action, raison = '') => {
  try {
    const response = await api.post(`/forum/admin/questions/${questionId}/moderer/`, { 
      action, 
      raison 
    });
    return response.data;
  } catch (error) {
    console.error('Erreur modererQuestion:', error.response?.data || error.message);
    throw error;
  }
};

export const modererReponse = async (reponseId, action, raison = '') => {
  try {
    const response = await api.post(`/forum/admin/reponses/${reponseId}/moderer/`, { 
      action, 
      raison 
    });
    return response.data;
  } catch (error) {
    console.error('Erreur modererReponse:', error.response?.data || error.message);
    throw error;
  }
};

// Export par défaut
export default {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  incrementerVue,
  getReponses,
  createReponse,
  updateReponse,
  deleteReponse,
  voterReponse,
  abonnerQuestion,
  desabonnerQuestion,
  getQuestionsSuivies,
  envoyerMessageVocal,
  getMessagesVocauxReponse,
  supprimerMessageVocal,
  getNotificationsForum,
  marquerNotificationLue,
  marquerToutesNotificationsLues,
  supprimerNotification,
  getStatistiquesForum,
  getStatistiquesAdmin,
  getBadgesForum,
  marquerSolution,
  demarquerSolution,
  signalerQuestion,
  signalerReponse,
  getSignalements,
  suggestionsQuestionsSimilaires,
  rechercheAvancee,
  getTagsPopulaires,
  getUtilisateursActifs,
  suspendreUtilisateur,
  reactiverUtilisateur,
  bannirUtilisateur,
  modererQuestion,
  modererReponse,
};
