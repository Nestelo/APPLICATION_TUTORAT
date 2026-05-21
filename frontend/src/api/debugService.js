import api from './axiosConfig';

// Service de diagnostic pour vérifier les réponses du backend
export const debugBackend = async () => {
  console.log('🔍 Début du diagnostic backend...');
  
  const results = {
    auth: null,
    notifications: null,
    tutorat: null,
    ressources: null,
    forum: null,
    messagerie: null,
  };

  try {
    // Test authentification
    console.log('📝 Test authentification...');
    try {
      const authResponse = await api.get('/auth/profile/');
      results.auth = {
        success: true,
        data: authResponse.data,
        status: authResponse.status
      };
      console.log('✅ Auth OK:', authResponse.status);
    } catch (error) {
      results.auth = {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status
      };
      console.log('❌ Auth Error:', error.response?.status);
    }

    // Test notifications
    console.log('📝 Test notifications...');
    try {
      const notifResponse = await api.get('/notifications/notifications/');
      results.notifications = {
        success: true,
        data: notifResponse.data,
        isArray: Array.isArray(notifResponse.data),
        isPaginated: notifResponse.data?.results !== undefined,
        status: notifResponse.status
      };
      console.log('✅ Notifications OK:', notifResponse.status);
    } catch (error) {
      results.notifications = {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status
      };
      console.log('❌ Notifications Error:', error.response?.status);
    }

    // Test tutorat
    console.log('📝 Test tutorat...');
    try {
      const tutorResponse = await api.get('/tutorat/offres/');
      results.tutorat = {
        success: true,
        data: tutorResponse.data,
        isArray: Array.isArray(tutorResponse.data),
        isPaginated: tutorResponse.data?.results !== undefined,
        status: tutorResponse.status
      };
      console.log('✅ Tutorat OK:', tutorResponse.status);
    } catch (error) {
      results.tutorat = {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status
      };
      console.log('❌ Tutorat Error:', error.response?.status);
    }

    // Test ressources
    console.log('📝 Test ressources...');
    try {
      const resResponse = await api.get('/ressources/ressources/');
      results.ressources = {
        success: true,
        data: resResponse.data,
        isArray: Array.isArray(resResponse.data),
        isPaginated: resResponse.data?.results !== undefined,
        status: resResponse.status
      };
      console.log('✅ Ressources OK:', resResponse.status);
    } catch (error) {
      results.ressources = {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status
      };
      console.log('❌ Ressources Error:', error.response?.status);
    }

    // Test forum
    console.log('📝 Test forum...');
    try {
      const forumResponse = await api.get('/forum/questions/');
      results.forum = {
        success: true,
        data: forumResponse.data,
        isArray: Array.isArray(forumResponse.data),
        isPaginated: forumResponse.data?.results !== undefined,
        status: forumResponse.status
      };
      console.log('✅ Forum OK:', forumResponse.status);
    } catch (error) {
      results.forum = {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status
      };
      console.log('❌ Forum Error:', error.response?.status);
    }

    // Test messagerie
    console.log('📝 Test messagerie...');
    try {
      const msgResponse = await api.get('/messagerie/conversations/');
      results.messagerie = {
        success: true,
        data: msgResponse.data,
        isArray: Array.isArray(msgResponse.data),
        isPaginated: msgResponse.data?.results !== undefined,
        status: msgResponse.status
      };
      console.log('✅ Messagerie OK:', msgResponse.status);
    } catch (error) {
      results.messagerie = {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status
      };
      console.log('❌ Messagerie Error:', error.response?.status);
    }

  } catch (error) {
    console.error('❌ Erreur globale diagnostic:', error);
  }

  console.log('🔍 Diagnostic terminé:', results);
  return results;
};

// Fonction pour tester un endpoint spécifique
export const testEndpoint = async (endpoint, description = '') => {
  console.log(`📝 Test ${description || endpoint}...`);
  try {
    const response = await api.get(endpoint);
    console.log(`✅ ${description || endpoint} OK:`, response.status);
    console.log('📊 Structure:', {
      isArray: Array.isArray(response.data),
      isPaginated: response.data?.results !== undefined,
      hasCount: response.data?.count !== undefined,
      dataKeys: Object.keys(response.data)
    });
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    console.log(`❌ ${description || endpoint} Error:`, error.response?.status);
    console.log('📊 Error:', error.response?.data);
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

export default {
  debugBackend,
  testEndpoint,
};
