import api from './axiosConfig';

// Obtenir toutes les notifications de l'utilisateur
export const getNotifications = async (params = {}) => {
  try {
    const response = await api.get('/notifications/notifications/', { params });
    
    // Gestion de la réponse paginée de l'API
    let notificationsArray = [];
    const data = response.data;
    
    if (Array.isArray(data)) {
      notificationsArray = data;
    } else if (data && Array.isArray(data.results)) {
      notificationsArray = data.results;
    } else if (data && Array.isArray(data.data)) {
      notificationsArray = data.data;
    } else {
      notificationsArray = [];
    }
    
    return { success: true, data: notificationsArray };
  } catch (error) {
    console.error('Erreur récupération notifications:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des notifications',
      data: [] 
    };
  }
};

// Obtenir les notifications non lues
export const getUnreadNotifications = async () => {
  try {
    const response = await api.get('/notifications/notifications/', { 
      params: { est_lue: false } 
    });
    
    // Gestion de la réponse paginée
    let notificationsArray = [];
    const data = response.data;
    
    if (Array.isArray(data)) {
      notificationsArray = data;
    } else if (data && Array.isArray(data.results)) {
      notificationsArray = data.results;
    } else if (data && Array.isArray(data.data)) {
      notificationsArray = data.data;
    }
    
    return { success: true, data: notificationsArray };
  } catch (error) {
    console.error('Erreur notifications non lues:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la récupération des notifications non lues',
      data: [] 
    };
  }
};

// Marquer une notification comme lue
export const markAsRead = async (id) => {
  try {
    const response = await api.put(`/notifications/notifications/${id}/`, { est_lue: true });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur marquer comme lu:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors du marquage comme lu' 
    };
    }
};

// Marquer toutes les notifications comme lues
export const markAllAsRead = async () => {
  try {
    const response = await api.post('/notifications/notifications/marquer_tout_lu/');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur marquer tout comme lu:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors du marquage de toutes les notifications comme lues' 
    };
  }
};

// Alias pour compatibilité
export const marquerToutLu = markAllAsRead;

// Créer une notification (admin)
export const createNotification = async (notificationData) => {
  try {
    const response = await api.post('/notifications/notifications/', notificationData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur création notification:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la création de la notification' 
    };
  }
};

// Supprimer une notification
export const deleteNotification = async (id) => {
  try {
    const response = await api.delete(`/notifications/notifications/${id}/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur suppression notification:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de la suppression de la notification' 
    };
  }
};

// Obtenir le nombre de notifications non lues
export const getUnreadCount = async () => {
  try {
    const response = await api.get('/notifications/notifications/', { 
      params: { est_lue: false } 
    });
    
    // Gestion de la réponse paginée pour le compteur
    let count = 0;
    const data = response.data;
    
    if (Array.isArray(data)) {
      count = data.length;
    } else if (data && typeof data.count === 'number') {
      count = data.count;
    } else if (data && Array.isArray(data.results)) {
      count = data.results.length;
    }
    
    return { success: true, count };
  } catch (error) {
    console.error('Erreur compteur notifications:', error.response?.data || error.message);
    return { success: false, count: 0 };
  }
};

export default {
  getNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  marquerToutLu,
  createNotification,
  deleteNotification,
  getUnreadCount,
};