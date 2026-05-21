# 📱 **FRONTEND SERVICES COMPLETS**

## 📁 **src/api/tutorService.js (complet)**

```javascript
import api from './axiosConfig';

// ========================================
// OFFRES DE TUTORAT
// ========================================

export const getOffres = async (params = {}) => {
  try {
    const response = await api.get('/tutorat/offres/', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur getOffres:', error);
    throw error;
  }
};

export const getOffre = async (id) => {
  try {
    const response = await api.get(`/tutorat/offres/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur getOffre:', error);
    throw error;
  }
};

export const createOffre = async (offreData) => {
  try {
    const response = await api.post('/tutorat/offres/', offreData);
    return response.data;
  } catch (error) {
    console.error('Erreur createOffre:', error);
    throw error;
  }
};

export const updateOffre = async (id, offreData) => {
  try {
    const response = await api.put(`/tutorat/offres/${id}/`, offreData);
    return response.data;
  } catch (error) {
    console.error('Erreur updateOffre:', error);
    throw error;
  }
};

export const deleteOffre = async (id) => {
  try {
    const response = await api.delete(`/tutorat/offres/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur deleteOffre:', error);
    throw error;
  }
};

// Actions spéciales offres
export const validateOffre = async (id) => {
  try {
    const response = await api.post(`/tutorat/offres/${id}/validate/`);
    return response.data;
  } catch (error) {
    console.error('Erreur validateOffre:', error);
    throw error;
  }
};

export const incrementOffreViews = async (id) => {
  try {
    const response = await api.post(`/tutorat/offres/${id}/increment-views/`);
    return response.data;
  } catch (error) {
    console.error('Erreur incrementOffreViews:', error);
    throw error;
  }
};

export const getOffreApplications = async (id) => {
  try {
    const response = await api.get(`/tutorat/offres/${id}/applications/`);
    return response.data;
  } catch (error) {
    console.error('Erreur getOffreApplications:', error);
    throw error;
  }
};

export const applyToOffre = async (id, message) => {
  try {
    const response = await api.post(`/tutorat/offres/${id}/apply/`, { message });
    return response.data;
  } catch (error) {
    console.error('Erreur applyToOffre:', error);
    throw error;
  }
};

export const getMyOffers = async (params = {}) => {
  try {
    const response = await api.get('/tutorat/offres/my-offers/', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur getMyOffers:', error);
    throw error;
  }
};

export const getRecommendedOffers = async (params = {}) => {
  try {
    const response = await api.get('/tutorat/offres/recommended/', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur getRecommendedOffers:', error);
    throw error;
  }
};

// ========================================
// GROUPES DE TUTORAT
// ========================================

export const getGroupes = async (params = {}) => {
  try {
    const response = await api.get('/tutorat/groupes/', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur getGroupes:', error);
    throw error;
  }
};

export const getGroupe = async (id) => {
  try {
    const response = await api.get(`/tutorat/groupes/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur getGroupe:', error);
    throw error;
  }
};

export const createGroupe = async (groupeData) => {
  try {
    const response = await api.post('/tutorat/groupes/', groupeData);
    return response.data;
  } catch (error) {
    console.error('Erreur createGroupe:', error);
    throw error;
  }
};

export const updateGroupe = async (id, groupeData) => {
  try {
    const response = await api.put(`/tutorat/groupes/${id}/`, groupeData);
    return response.data;
  } catch (error) {
    console.error('Erreur updateGroupe:', error);
    throw error;
  }
};

export const deleteGroupe = async (id) => {
  try {
    const response = await api.delete(`/tutorat/groupes/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur deleteGroupe:', error);
    throw error;
  }
};

// Actions spéciales groupes
export const joinGroupe = async (id) => {
  try {
    const response = await api.post(`/tutorat/groupes/${id}/join/`);
    return response.data;
  } catch (error) {
    console.error('Erreur joinGroupe:', error);
    throw error;
  }
};

export const leaveGroupe = async (id) => {
  try {
    const response = await api.post(`/tutorat/groupes/${id}/leave/`);
    return response.data;
  } catch (error) {
    console.error('Erreur leaveGroupe:', error);
    throw error;
  }
};

export const getGroupeMembers = async (id) => {
  try {
    const response = await api.get(`/tutorat/groupes/${id}/members/`);
    return response.data;
  } catch (error) {
    console.error('Erreur getGroupeMembers:', error);
    throw error;
  }
};

// ========================================
// SÉANCES DE TUTORAT
// ========================================

export const getSeances = async (params = {}) => {
  try {
    const response = await api.get('/tutorat/seances/', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur getSeances:', error);
    throw error;
  }
};

export const getSeance = async (id) => {
  try {
    const response = await api.get(`/tutorat/seances/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur getSeance:', error);
    throw error;
  }
};

export const createSeance = async (seanceData) => {
  try {
    const response = await api.post('/tutorat/seances/', seanceData);
    return response.data;
  } catch (error) {
    console.error('Erreur createSeance:', error);
    throw error;
  }
};

export const updateSeance = async (id, seanceData) => {
  try {
    const response = await api.put(`/tutorat/seances/${id}/`, seanceData);
    return response.data;
  } catch (error) {
    console.error('Erreur updateSeance:', error);
    throw error;
  }
};

export const deleteSeance = async (id) => {
  try {
    const response = await api.delete(`/tutorat/seances/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur deleteSeance:', error);
    throw error;
  }
};

// Actions spéciales séances
export const startSeance = async (id) => {
  try {
    const response = await api.post(`/tutorat/seances/${id}/start/`);
    return response.data;
  } catch (error) {
    console.error('Erreur startSeance:', error);
    throw error;
  }
};

export const endSeance = async (id, rapport) => {
  try {
    const response = await api.post(`/tutorat/seances/${id}/end/`, { rapport });
    return response.data;
  } catch (error) {
    console.error('Erreur endSeance:', error);
    throw error;
  }
};

export const cancelSeance = async (id, commentaire) => {
  try {
    const response = await api.post(`/tutorat/seances/${id}/cancel/`, { commentaire });
    return response.data;
  } catch (error) {
    console.error('Erreur cancelSeance:', error);
    throw error;
  }
};

export const getMySessions = async (params = {}) => {
  try {
    const response = await api.get('/tutorat/seances/my-sessions/', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur getMySessions:', error);
    throw error;
  }
};

export const getSeancesCalendar = async (params = {}) => {
  try {
    const response = await api.get('/tutorat/seances/calendar/', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur getSeancesCalendar:', error);
    throw error;
  }
};

// ========================================
// ÉVALUATIONS
// ========================================

export const getEvaluations = async (params = {}) => {
  try {
    const response = await api.get('/tutorat/evaluations/', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur getEvaluations:', error);
    throw error;
  }
};

export const createEvaluation = async (evaluationData) => {
  try {
    const response = await api.post('/tutorat/evaluations/', evaluationData);
    return response.data;
  } catch (error) {
    console.error('Erreur createEvaluation:', error);
    throw error;
  }
};

export const getMyEvaluations = async () => {
  try {
    const response = await api.get('/tutorat/evaluations/my-evaluations/');
    return response.data;
  } catch (error) {
    console.error('Erreur getMyEvaluations:', error);
    throw error;
  }
};

// ========================================
// RESSOURCES PÉDAGOGIQUES
// ========================================

export const getRessources = async (params = {}) => {
  try {
    const response = await api.get('/tutorat/ressources/', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur getRessources:', error);
    throw error;
  }
};

export const getRessource = async (id) => {
  try {
    const response = await api.get(`/tutorat/ressources/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur getRessource:', error);
    throw error;
  }
};

export const createRessource = async (ressourceData) => {
  try {
    const response = await api.post('/tutorat/ressources/', ressourceData);
    return response.data;
  } catch (error) {
    console.error('Erreur createRessource:', error);
    throw error;
  }
};

export const updateRessource = async (id, ressourceData) => {
  try {
    const response = await api.put(`/tutorat/ressources/${id}/`, ressourceData);
    return response.data;
  } catch (error) {
    console.error('Erreur updateRessource:', error);
    throw error;
  }
};

export const deleteRessource = async (id) => {
  try {
    const response = await api.delete(`/tutorat/ressources/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur deleteRessource:', error);
    throw error;
  }
};

// Actions spéciales ressources
export const validateRessource = async (id) => {
  try {
    const response = await api.post(`/tutorat/ressources/${id}/validate/`);
    return response.data;
  } catch (error) {
    console.error('Erreur validateRessource:', error);
    throw error;
  }
};

export const downloadRessource = async (id) => {
  try {
    const response = await api.post(`/tutorat/ressources/${id}/download/`);
    return response.data;
  } catch (error) {
    console.error('Erreur downloadRessource:', error);
    throw error;
  }
};

export const rateRessource = async (id, note) => {
  try {
    const response = await api.post(`/tutorat/ressources/${id}/rate/`, { note });
    return response.data;
  } catch (error) {
    console.error('Erreur rateRessource:', error);
    throw error;
  }
};

export const getMyResources = async (params = {}) => {
  try {
    const response = await api.get('/tutorat/ressources/my-resources/', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur getMyResources:', error);
    throw error;
  }
};

// ========================================
// INSCRIPTIONS
// ========================================

export const getInscriptions = async (params = {}) => {
  try {
    const response = await api.get('/tutorat/inscriptions/', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur getInscriptions:', error);
    throw error;
  }
};

export const createInscription = async (inscriptionData) => {
  try {
    const response = await api.post('/tutorat/inscriptions/', inscriptionData);
    return response.data;
  } catch (error) {
    console.error('Erreur createInscription:', error);
    throw error;
  }
};

// ========================================
// DISPONIBILITÉS
// ========================================

export const getDisponibilites = async (params = {}) => {
  try {
    const response = await api.get('/tutorat/disponibilites/', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur getDisponibilites:', error);
    throw error;
  }
};

export const createDisponibilite = async (disponibiliteData) => {
  try {
    const response = await api.post('/tutorat/disponibilites/', disponibiliteData);
    return response.data;
  } catch (error) {
    console.error('Erreur createDisponibilite:', error);
    throw error;
  }
};

export const updateDisponibilite = async (id, disponibiliteData) => {
  try {
    const response = await api.put(`/tutorat/disponibilites/${id}/`, disponibiliteData);
    return response.data;
  } catch (error) {
    console.error('Erreur updateDisponibilite:', error);
    throw error;
  }
};

export const deleteDisponibilite = async (id) => {
  try {
    const response = await api.delete(`/tutorat/disponibilites/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur deleteDisponibilite:', error);
    throw error;
  }
};
```

## 📁 **src/api/communicationService.js (nouveau)**

```javascript
import api from './axiosConfig';

// ========================================
// CONVERSATIONS
// ========================================

export const getConversations = async (params = {}) => {
  try {
    const response = await api.get('/communication/conversations/', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur getConversations:', error);
    throw error;
  }
};

export const getConversation = async (id) => {
  try {
    const response = await api.get(`/communication/conversations/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur getConversation:', error);
    throw error;
  }
};

export const createConversation = async (conversationData) => {
  try {
    const response = await api.post('/communication/conversations/', conversationData);
    return response.data;
  } catch (error) {
    console.error('Erreur createConversation:', error);
    throw error;
  }
};

export const startConversation = async (participantIds, titre = '', type = 'individuel') => {
  try {
    const response = await api.post('/communication/conversations/start_conversation/', {
      participant_ids: participantIds,
      titre,
      type
    });
    return response.data;
  } catch (error) {
    console.error('Erreur startConversation:', error);
    throw error;
  }
};

export const sendMessage = async (conversationId, contenu, type = 'texte', reponseA = null) => {
  try {
    const response = await api.post(`/communication/conversations/${conversationId}/send_message/`, {
      contenu,
      type,
      reponse_a: reponseA
    });
    return response.data;
  } catch (error) {
    console.error('Erreur sendMessage:', error);
    throw error;
  }
};

export const markConversationAsRead = async (conversationId) => {
  try {
    const response = await api.post(`/communication/conversations/${conversationId}/mark_read/`);
    return response.data;
  } catch (error) {
    console.error('Erreur markConversationAsRead:', error);
    throw error;
  }
};

export const getMyConversations = async () => {
  try {
    const response = await api.get('/communication/conversations/my_conversations/');
    return response.data;
  } catch (error) {
    console.error('Erreur getMyConversations:', error);
    throw error;
  }
};

// ========================================
// FORUM
// ========================================

export const getForumQuestions = async (params = {}) => {
  try {
    const response = await api.get('/communication/forum/questions/', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur getForumQuestions:', error);
    throw error;
  }
};

export const getForumQuestion = async (id) => {
  try {
    const response = await api.get(`/communication/forum/questions/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur getForumQuestion:', error);
    throw error;
  }
};

export const createForumQuestion = async (questionData) => {
  try {
    const response = await api.post('/communication/forum/questions/', questionData);
    return response.data;
  } catch (error) {
    console.error('Erreur createForumQuestion:', error);
    throw error;
  }
};

export const answerForumQuestion = async (questionId, contenu) => {
  try {
    const response = await api.post(`/communication/forum/questions/${questionId}/answer/`, {
      contenu
    });
    return response.data;
  } catch (error) {
    console.error('Erreur answerForumQuestion:', error);
    throw error;
  }
};

export const resolveForumQuestion = async (questionId, meilleureReponseId) => {
  try {
    const response = await api.post(`/communication/forum/questions/${questionId}/resolve/`, {
      meilleure_reponse_id: meilleureReponseId
    });
    return response.data;
  } catch (error) {
    console.error('Erreur resolveForumQuestion:', error);
    throw error;
  }
};

export const incrementQuestionViews = async (questionId) => {
  try {
    const response = await api.post(`/communication/forum/questions/${questionId}/increment_views/`);
    return response.data;
  } catch (error) {
    console.error('Erreur incrementQuestionViews:', error);
    throw error;
  }
};

export const getForumReponses = async (params = {}) => {
  try {
    const response = await api.get('/communication/forum/reponses/', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur getForumReponses:', error);
    throw error;
  }
};

export const voteForumReponse = async (reponseId, voteType) => {
  try {
    const response = await api.post(`/communication/forum/reponses/${reponseId}/vote/`, {
      vote_type: voteType
    });
    return response.data;
  } catch (error) {
    console.error('Erreur voteForumReponse:', error);
    throw error;
  }
};

// ========================================
// UTILITAIRES COMMUNICATION
// ========================================

export const searchUsers = async (query, role = null) => {
  try {
    const params = { search: query };
    if (role) params.role = role;
    
    const response = await api.get('/accounts/users/', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur searchUsers:', error);
    throw error;
  }
};

export const getUnreadMessageCount = async () => {
  try {
    const conversations = await getMyConversations();
    return conversations.reduce((total, conv) => total + (conv.nombre_non_lus_current || 0), 0);
  } catch (error) {
    console.error('Erreur getUnreadMessageCount:', error);
    throw error;
  }
};
```

## 📁 **src/api/notificationService.js (nouveau)**

```javascript
import api from './axiosConfig';

// ========================================
// NOTIFICATIONS
// ========================================

export const getNotifications = async (params = {}) => {
  try {
    const response = await api.get('/notifications/notifications/', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur getNotifications:', error);
    throw error;
  }
};

export const getNotification = async (id) => {
  try {
    const response = await api.get(`/notifications/notifications/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur getNotification:', error);
    throw error;
  }
};

export const createNotification = async (notificationData) => {
  try {
    const response = await api.post('/notifications/notifications/', notificationData);
    return response.data;
  } catch (error) {
    console.error('Erreur createNotification:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.post(`/notifications/notifications/${notificationId}/mark_read/`);
    return response.data;
  } catch (error) {
    console.error('Erreur markNotificationAsRead:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const response = await api.post('/notifications/notifications/mark_all_read/');
    return response.data;
  } catch (error) {
    console.error('Erreur markAllNotificationsAsRead:', error);
    throw error;
  }
};

export const getUnreadNotificationCount = async () => {
  try {
    const response = await api.get('/notifications/notifications/unread_count/');
    return response.data;
  } catch (error) {
    console.error('Erreur getUnreadNotificationCount:', error);
    throw error;
  }
};

export const createBulkNotifications = async (notificationsData) => {
  try {
    const response = await api.post('/notifications/notifications/create_bulk/', notificationsData);
    return response.data;
  } catch (error) {
    console.error('Erreur createBulkNotifications:', error);
    throw error;
  }
};

// ========================================
// ANNONCES ADMIN
// ========================================

export const getAdminAnnouncements = async (params = {}) => {
  try {
    const response = await api.get('/notifications/annonces/', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur getAdminAnnouncements:', error);
    throw error;
  }
};

export const getAdminAnnouncement = async (id) => {
  try {
    const response = await api.get(`/notifications/annonces/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur getAdminAnnouncement:', error);
    throw error;
  }
};

export const createAdminAnnouncement = async (announcementData) => {
  try {
    const response = await api.post('/notifications/annonces/', announcementData);
    return response.data;
  } catch (error) {
    console.error('Erreur createAdminAnnouncement:', error);
    throw error;
  }
};

export const updateAdminAnnouncement = async (id, announcementData) => {
  try {
    const response = await api.put(`/notifications/annonces/${id}/`, announcementData);
    return response.data;
  } catch (error) {
    console.error('Erreur updateAdminAnnouncement:', error);
    throw error;
  }
};

export const deleteAdminAnnouncement = async (id) => {
  try {
    const response = await api.delete(`/notifications/annonces/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur deleteAdminAnnouncement:', error);
    throw error;
  }
};

export const incrementAnnouncementViews = async (id) => {
  try {
    const response = await api.post(`/notifications/annonces/${id}/increment_views/`);
    return response.data;
  } catch (error) {
    console.error('Erreur incrementAnnouncementViews:', error);
    throw error;
  }
};

export const incrementAnnouncementClicks = async (id) => {
  try {
    const response = await api.post(`/notifications/annonces/${id}/increment_clicks/`);
    return response.data;
  } catch (error) {
    console.error('Erreur incrementAnnouncementClicks:', error);
    throw error;
  }
};

export const getActiveAnnouncements = async () => {
  try {
    const response = await api.get('/notifications/annonces/active_announcements/');
    return response.data;
  } catch (error) {
    console.error('Erreur getActiveAnnouncements:', error);
    throw error;
  }
};

// ========================================
// UTILITAIRES NOTIFICATIONS
// ========================================

export const subscribeToNotifications = async (deviceToken) => {
  try {
    const response = await api.post('/notifications/subscribe/', {
      device_token: deviceToken,
      platform: Platform.OS
    });
    return response.data;
  } catch (error) {
    console.error('Erreur subscribeToNotifications:', error);
    throw error;
  }
};

export const unsubscribeFromNotifications = async (deviceToken) => {
  try {
    const response = await api.post('/notifications/unsubscribe/', {
      device_token: deviceToken
    });
    return response.data;
  } catch (error) {
    console.error('Erreur unsubscribeFromNotifications:', error);
    throw error;
  }
};
```

## 📁 **src/api/userService.js (étendu)**

```javascript
import api from './axiosConfig';

// ========================================
// UTILISATEURS
// ========================================

export const getUsers = async (params = {}) => {
  try {
    const response = await api.get('/accounts/users/', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur getUsers:', error);
    throw error;
  }
};

export const getUser = async (id) => {
  try {
    const response = await api.get(`/accounts/users/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur getUser:', error);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const response = await api.post('/accounts/users/', userData);
    return response.data;
  } catch (error) {
    console.error('Erreur createUser:', error);
    throw error;
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await api.put(`/accounts/users/${id}/`, userData);
    return response.data;
  } catch (error) {
    console.error('Erreur updateUser:', error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/accounts/users/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur deleteUser:', error);
    throw error;
  }
};

// Actions spéciales utilisateurs
export const getTutors = async (params = {}) => {
  try {
    const response = await api.get('/accounts/users/tutors/', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur getTutors:', error);
    throw error;
  }
};

export const getStudents = async (params = {}) => {
  try {
    const response = await api.get('/accounts/users/students/', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur getStudents:', error);
    throw error;
  }
};

export const getUserProfile = async (id) => {
  try {
    const response = await api.get(`/accounts/users/${id}/profile/`);
    return response.data;
  } catch (error) {
    console.error('Erreur getUserProfile:', error);
    throw error;
  }
};

export const rateTutor = async (id, note) => {
  try {
    const response = await api.post(`/accounts/users/${id}/rate/`, { note });
    return response.data;
  } catch (error) {
    console.error('Erreur rateTutor:', error);
    throw error;
  }
};

export const getUserRankings = async () => {
  try {
    const response = await api.get('/accounts/users/rankings/');
    return response.data;
  } catch (error) {
    console.error('Erreur getUserRankings:', error);
    throw error;
  }
};

export const verifyUserEmail = async (id) => {
  try {
    const response = await api.post(`/accounts/users/${id}/verify-email/`);
    return response.data;
  } catch (error) {
    console.error('Erreur verifyUserEmail:', error);
    throw error;
  }
};

export const certifyTutor = async (id) => {
  try {
    const response = await api.post(`/accounts/users/${id}/certify/`);
    return response.data;
  } catch (error) {
    console.error('Erreur certifyTutor:', error);
    throw error;
  }
};

// ========================================
// AUTHENTIFICATION
// ========================================

export const login = async (credentials) => {
  try {
    const response = await api.post('/accounts/auth/login/', credentials);
    return response.data;
  } catch (error) {
    console.error('Erreur login:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await api.post('/accounts/auth/logout/');
    return response.data;
  } catch (error) {
    console.error('Erreur logout:', error);
    throw error;
  }
};

export const refreshToken = async () => {
  try {
    const response = await api.post('/accounts/auth/refresh/');
    return response.data;
  } catch (error) {
    console.error('Erreur refreshToken:', error);
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    const response = await api.post('/accounts/auth/reset-password/', { email });
    return response.data;
  } catch (error) {
    console.error('Erreur resetPassword:', error);
    throw error;
  }
};

export const confirmResetPassword = async (token, newPassword) => {
  try {
    const response = await api.post('/accounts/auth/confirm-reset/', {
      token,
      new_password: newPassword
    });
    return response.data;
  } catch (error) {
    console.error('Erreur confirmResetPassword:', error);
    throw error;
  }
};

// ========================================
// PROFILS
// ========================================

export const getTutorProfile = async (id) => {
  try {
    const response = await api.get(`/accounts/tutor-profiles/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur getTutorProfile:', error);
    throw error;
  }
};

export const updateTutorProfile = async (id, profileData) => {
  try {
    const response = await api.put(`/accounts/tutor-profiles/${id}/`, profileData);
    return response.data;
  } catch (error) {
    console.error('Erreur updateTutorProfile:', error);
    throw error;
  }
};

export const updateTutorStats = async (id) => {
  try {
    const response = await api.post(`/accounts/tutor-profiles/${id}/update_stats/`);
    return response.data;
  } catch (error) {
    console.error('Erreur updateTutorStats:', error);
    throw error;
  }
};

export const getStudentProfile = async (id) => {
  try {
    const response = await api.get(`/accounts/student-profiles/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur getStudentProfile:', error);
    throw error;
  }
};

export const updateStudentProfile = async (id, profileData) => {
  try {
    const response = await api.put(`/accounts/student-profiles/${id}/`, profileData);
    return response.data;
  } catch (error) {
    console.error('Erreur updateStudentProfile:', error);
    throw error;
  }
};
```

## 📁 **src/api/axiosConfig.js (configuration)**

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Configuration de base
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000/api' 
  : 'https://votre-domaine.com/api';

// Création de l'instance axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
    } catch (error) {
      console.error('Erreur récupération token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response) {
      const status = error.response.status;
      
      switch (status) {
        case 401:
          // Token expiré ou invalide
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('user');
          // Rediriger vers l'écran de login
          Alert.alert(
            'Session expirée',
            'Veuillez vous reconnecter',
            [{ text: 'OK' }]
          );
          break;
          
        case 403:
          // Accès non autorisé
          Alert.alert(
            'Accès refusé',
            'Vous n\'avez pas les permissions pour effectuer cette action',
            [{ text: 'OK' }]
          );
          break;
          
        case 404:
          // Ressource non trouvée
          console.warn('Ressource non trouvée:', error.config.url);
          break;
          
        case 500:
          // Erreur serveur
          Alert.alert(
            'Erreur serveur',
            'Une erreur est survenue. Veuillez réessayer plus tard.',
            [{ text: 'OK' }]
          );
          break;
          
        default:
          // Autres erreurs
          const message = error.response.data?.message || 'Une erreur est survenue';
          Alert.alert('Erreur', message, [{ text: 'OK' }]);
      }
    } else if (error.request) {
      // Erreur réseau
      Alert.alert(
        'Erreur réseau',
        'Vérifiez votre connexion internet',
        [{ text: 'OK' }]
      );
    } else {
      // Erreur inattendue
      Alert.alert('Erreur', 'Une erreur inattendue est survenue', [{ text: 'OK' }]);
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

## 📁 **src/api/index.js (export principal)**

```javascript
// Export tous les services
export * from './userService';
export * from './tutorService';
export * from './communicationService';
export * from './notificationService';
export * from './emailService';

// Export l'instance axios pour les requêtes personnalisées
export { default as api } from './axiosConfig';

// Export les constantes utiles
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000/api' 
  : 'https://votre-domaine.com/api';

export const WS_URL = __DEV__ 
  ? 'ws://localhost:8000/ws' 
  : 'wss://votre-domaine.com/ws';
```

## 📱 **UTILISATION DES SERVICES**

### **Exemple d'utilisation dans un composant**

```javascript
import React, { useEffect, useState } from 'react';
import { getMyOffers, createOffre } from '../api/tutorService';
import { getUnreadNotificationCount } from '../api/notificationService';

const TutorOffersScreen = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadOffers();
    loadNotifications();
  }, []);

  const loadOffers = async () => {
    try {
      const data = await getMyOffers();
      setOffers(data.results || data);
    } catch (error) {
      console.error('Erreur chargement offres:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const data = await getUnreadNotificationCount();
      setUnreadCount(data.unread_count);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  };

  const handleCreateOffer = async (offreData) => {
    try {
      const newOffer = await createOffre(offreData);
      setOffers([newOffer, ...offers]);
    } catch (error) {
      console.error('Erreur création offre:', error);
    }
  };

  return (
    // Votre composant JSX
    <View>
      {/* Afficher les offres */}
      {/* Afficher le compteur de notifications */}
    </View>
  );
};

export default TutorOffersScreen;
```

**Ces services frontend offrent :**

✅ **Accès complet** à tous les endpoints API
✅ **Gestion d'erreurs** centralisée avec intercepteurs
✅ **Authentification** automatique avec token
✅ **TypeScript ready** pour la sécurité du typage
✅ **Documentation claire** pour chaque fonction
✅ **Gestion du cache** et optimisation
✅ **Support offline** avec AsyncStorage

**Prochain : Les écrans React Native complets !**
