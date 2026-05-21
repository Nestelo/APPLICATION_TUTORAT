import api from './axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const response = await api.get(`/forum/questions/${id}/`);
  return response.data;
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
  const response = await api.put(`/forum/questions/${id}/`, questionData);
  return response.data;
};

export const deleteQuestion = async (id) => {
  const response = await api.delete(`/forum/questions/${id}/`);
  return response.data;
};

export const incrementerVue = async (id) => {
  const response = await api.post(`/forum/questions/${id}/vue/`);
  return response.data;
};

export const getQuestionsSuivies = async () => {
  try {
    const response = await api.get('/forum/questions/suivies/');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur getQuestionsSuivies:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des questions suivies' 
    };
  }
};

export const getNotificationsForum = async () => {
  try {
    const response = await api.get('/notifications/notifications/');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur getNotificationsForum:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des notifications du forum' 
    };
  }
};

export const restaurerReponse = async (id) => {
  const response = await api.post(`/forum/admin/moderation/reponses/${id}/restore/`);
  return response.data;
};

// Abonnements
export const abonnerQuestion = async (questionId) => {
  try {
    const response = await api.post(`/forum/questions/${questionId}/abonner/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur abonnerQuestion:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de l\'abonnement à la question' 
    };
  }
};

export const desabonnerQuestion = async (questionId) => {
  try {
    const response = await api.delete(`/forum/questions/${questionId}/desabonner/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur desabonnerQuestion:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors du désabonnement de la question' 
    };
  }
};

// Messages Vocaux
export const envoyerMessageVocal = async (data) => {
  try {
    console.log('=== ENVOI MESSAGE VOCAL API ===');
    console.log('Données reçues:', data);
    
    // Validation des données
    if (!data.reponse || !data.fichier_audio || !data.duree) {
      throw new Error('Données manquantes: reponse, fichier_audio, ou duree');
    }
    
    const formData = new FormData();
    formData.append('reponse', data.reponse.toString()); // S'assurer que c'est une chaîne
    
    // Créer un objet fichier correct pour React Native
    const audioFile = {
      uri: data.fichier_audio,
      type: 'audio/3gp',
      name: `message_vocal_${Date.now()}.3gp`
    };
    
    // Vérifier que l'URI est valide (accepter les vrais fichiers et les fichiers de test)
    if (!data.fichier_audio) {
      throw new Error('Fichier audio manquant');
    }
    
    // Pour les tests, accepter les fichiers simulés
    const isTestFile = data.fichier_audio.includes('mock_') || data.fichier_audio.includes('test_');
    const isRealFile = data.fichier_audio.startsWith('file://') || data.fichier_audio.startsWith('http://');
    
    if (!isTestFile && !isRealFile) {
      console.warn('URI du fichier audio suspect:', data.fichier_audio);
      // Ne pas bloquer l'envoi, juste avertir
    }
    
    formData.append('fichier_audio', audioFile);
    formData.append('duree', data.duree);
    
    console.log('FormData préparé - Réponse:', data.reponse);
    console.log('FormData préparé - Audio URI:', data.fichier_audio);
    console.log('FormData préparé - Audio File:', audioFile);
    console.log('FormData préparé - Durée:', data.duree);
    
    // Configuration de la requête avec timeout
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 secondes timeout
    };
    
    const response = await api.post('/forum/messages-vocaux/', formData, config);
    
    console.log('Réponse API message vocal:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('=== ERREUR ENVOI MESSAGE VOCAL ===');
    console.error('Erreur complète:', error);
    
    // Gestion détaillée des erreurs
    let errorMessage = 'Erreur lors de l\'envoi du message vocal';
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Timeout: Le serveur met trop longtemps à répondre';
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage = 'Erreur réseau: Vérifiez votre connexion';
    } else if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
      
      if (error.response.status === 400) {
        errorMessage = 'Données invalides: Vérifiez le format du fichier audio';
      } else if (error.response.status === 401) {
        errorMessage = 'Non autorisé: Veuillez vous reconnecter';
      } else if (error.response.status === 413) {
        errorMessage = 'Fichier trop volumineux';
      } else if (error.response.status === 500) {
        errorMessage = 'Erreur serveur: Veuillez réessayer plus tard';
      }
      
      // Extraire le message d'erreur détaillé si disponible
      if (error.response.data) {
        if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.fichier_audio) {
          errorMessage = `Fichier audio: ${error.response.data.fichier_audio}`;
        }
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error('Message d\'erreur final:', errorMessage);
    
    return { 
      success: false, 
      error: errorMessage
    };
  }
};

export const getMessagesVocauxReponse = async (reponseId) => {
  try {
    const response = await api.get(`/forum/messages-vocaux/?reponse=${reponseId}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur récupération messages vocaux:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des messages vocaux' 
    };
  }
};

export const supprimerMessageVocal = async (id) => {
  try {
    const response = await api.delete(`/forum/messages-vocaux/${id}/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur suppression message vocal:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la suppression du message vocal' 
    };
  }
};

// Questions pour admin (sans authentification stricte)
export const getAdminQuestions = async (params = {}) => {
  try {
    const response = await api.get('/forum/admin/questions/', { params });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur getAdminQuestions:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des questions admin' 
    };
  }
};

// Réponses
export const getReponses = async (questionId) => {
  const response = await api.get('/forum/reponses/', { params: { question: questionId } });
  // Gérer les données paginées
  const data = response.data;
  return data.results || data || [];
};

export const createReponse = async (questionId, contenu) => {
  const response = await api.post('/forum/reponses/', {
    question: questionId,
    contenu,
  });
  return response.data;
};

export const updateReponse = async (id, contenu) => {
  const response = await api.put(`/forum/reponses/${id}/`, { contenu });
  return response.data;
};

export const deleteReponse = async (id) => {
  const response = await api.delete(`/forum/reponses/${id}/`);
  return response.data;
};

export const marquerSolution = async (reponseId) => {
  try {
    console.log('=== DÉBUT MARQUAGE SOLUTION ===');
    console.log('Réponse ID à marquer:', reponseId);
    
    // Récupérer les données utilisateur depuis AsyncStorage avec la bonne clé
    const userStr = await AsyncStorage.getItem('user');
    
    if (!userStr) {
      throw new Error('Utilisateur non connecté - userStr manquant');
    }
    
    let user;
    try {
      user = JSON.parse(userStr);
      console.log('Utilisateur parsé avec succès:', { id: user.id, nom: user.nom, prenom: user.prenom });
    } catch (parseError) {
      throw new Error('Erreur de données utilisateur - parsing failed');
    }
    
    if (!user || !user.id) {
      throw new Error('Utilisateur non connecté - ID manquant');
    }

    // Récupérer les détails de la réponse pour vérifier l'auteur de la question
    const reponseResponse = await api.get(`/forum/reponses/${reponseId}/`);
    const reponse = reponseResponse.data;
    console.log('Détails de la réponse:', { id: reponse.id, question: reponse.question });
    
    // Récupérer les détails de la question pour vérifier l'auteur
    const questionResponse = await api.get(`/forum/questions/${reponse.question}/`);
    const question = questionResponse.data;
    console.log('Détails de la question:', { 
      id: question.id, 
      auteur: question.auteur,
      utilisateur_actuel: user.id 
    });
    
    // Vérifier si l'utilisateur est l'auteur de la question
    if (question.auteur !== user.id) {
      console.error('❌ Permission refusée: l\'utilisateur n\'est pas l\'auteur de la question');
      throw new Error('Seul l\'auteur de la question peut marquer une réponse comme solution');
    }

    console.log('✅ Permission accordée: l\'utilisateur est l\'auteur de la question');
    
    const response = await api.post(`/forum/reponses/${reponseId}/marquer_solution/`, {
      votant: user.id // Inclure l'ID utilisateur pour les permissions
    });
    
    console.log('Solution marquée avec succès:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur marquerSolution:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Détails de l\'erreur:', error.response?.data);
    
    // Si l'erreur est une permission, afficher un message clair
    if (error.response?.status === 403) {
      throw new Error('Seul l\'auteur de la question peut marquer une réponse comme solution');
    }
    
    // Si l'endpoint n'existe pas, essayer un endpoint alternatif
    if (error.response?.status === 404) {
      try {
        console.log('Tentative avec endpoint alternatif...');
        const altResponse = await api.post(`/forum/reponses/${reponseId}/solution/`);
        console.log('Solution marquée avec succès (alt):', altResponse.data);
        return altResponse.data;
      } catch (altError) {
        console.error('L\'endpoint alternatif a aussi échoué:', altError);
        throw new Error('Impossible de marquer comme solution - endpoint non disponible');
      }
    }
    
    throw error;
  }
};

// Votes
export const voterReponse = async (reponseId, valeur) => {
  try {
    // Récupérer les données utilisateur depuis AsyncStorage avec la bonne clé
    const userStr = await AsyncStorage.getItem('user');
    
    if (!userStr) {
      throw new Error('Utilisateur non connecté - userStr manquant');
    }
    
    let user;
    try {
      user = JSON.parse(userStr);
    } catch (parseError) {
      throw new Error('Erreur de données utilisateur - parsing failed');
    }
    
    if (!user || !user.id) {
      throw new Error('Utilisateur non connecté - ID manquant');
    }

    console.log('Données envoyées pour voter:', { 
      reponse: reponseId, 
      valeur,
      votant: user.id
    });
    
    const response = await api.post('/forum/votes/', {
      reponse: reponseId,
      valeur, // 1 ou -1
      votant: user.id, // Utiliser l'ID utilisateur correct
    });
    console.log('Réponse du serveur pour le vote:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur voterReponse:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Détails de l\'erreur:', error.response?.data);
    throw error;
  }
};

// Signalements
export const signalerQuestion = async (questionId, motif) => {
  const response = await api.post(`/forum/questions/${questionId}/signaler/`, { motif });
  return response.data;
};

export const signalerReponse = async (reponseId, motif) => {
  const response = await api.post(`/forum/reponses/${reponseId}/signaler/`, { motif });
  return response.data;
};

// Admin endpoints
export const getQuestionsSignalees = async () => {
  const response = await api.get('/forum/admin/moderation/questions/', {
    params: { reported_only: 'true' }
  });
  return response.data;
};

export const getReponsesSignalees = async () => {
  const response = await api.get('/forum/admin/moderation/reponses/', {
    params: { reported_only: 'true' }
  });
  return response.data;
};

export const supprimerQuestion = async (id) => {
  const response = await api.post(`/forum/admin/moderation/questions/${id}/delete/`);
  return response.data;
};

export const restaurerQuestion = async (id) => {
  const response = await api.post(`/forum/admin/moderation/questions/${id}/restore/`);
  return response.data;
};

export const supprimerReponse = async (id) => {
  const response = await api.post(`/forum/admin/moderation/reponses/${id}/delete/`);
  return response.data;
};

export default {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  incrementerVue,
  getQuestionsSuivies,
  getNotificationsForum,
  abonnerQuestion,
  desabonnerQuestion,
  getReponses,
  createReponse,
  updateReponse,
  deleteReponse,
  marquerSolution,
  voterReponse,
  signalerQuestion,
  signalerReponse,
  getQuestionsSignalees,
  getReponsesSignalees,
  supprimerQuestion,
  restaurerQuestion,
  supprimerReponse,
  restaurerReponse,
  envoyerMessageVocal,
  getMessagesVocauxReponse,
  supprimerMessageVocal,
  getAdminQuestions,
};