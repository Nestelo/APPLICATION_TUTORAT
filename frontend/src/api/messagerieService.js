import api from './axiosConfig';

export const getConversations = async () => {
  const response = await api.get('/messagerie/conversations/');
  return response.data;
};

export const getConversation = async (id) => {
  const response = await api.get(`/messagerie/conversations/${id}/`);
  return response.data;
};

export const createConversation = async (participants, titre = '') => {
  const response = await api.post('/messagerie/conversations/', { 
    participants, 
    titre 
  });
  return response.data;
};

export const startConversation = async (autreId) => {
  const response = await api.post('/messagerie/conversations/', { 
    participants: [autreId] 
  });
  return response.data;
};

export const envoyerMessage = async (conversationId, contenu) => {
  const response = await api.post('/messagerie/messages/', { 
    conversation: conversationId, 
    contenu 
  });
  return response.data;
};

export const envoyerMessageVocal = async (conversationId, audioFile, contenu = 'Message vocal') => {
  const formData = new FormData();
  formData.append('audio_file', audioFile);
  formData.append('contenu', contenu);
  
  const response = await api.post(`/messagerie/conversations/${conversationId}/envoyer_vocal/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getMessages = async (conversationId) => {
  const response = await api.get('/messagerie/messages/', { 
    params: { conversation: conversationId } 
  });
  return response.data;
};

export const marquerMessageLu = async (messageId) => {
  const response = await api.put(`/messagerie/messages/${messageId}/`, { lu: true });
  return response.data;
};

export const marquerConversationLue = async (conversationId) => {
  // Marquer tous les messages de la conversation comme lus
  const response = await api.get('/messagerie/messages/', { 
    params: { conversation: conversationId } 
  });
  const messages = response.data;
  
  // Marquer chaque message comme lu
  const promises = messages.map(message => 
    api.put(`/messagerie/messages/${message.id}/`, { est_lue: true })
  );
  
  await Promise.all(promises);
  return response.data;
};

export const deleteMessage = async (messageId) => {
  const response = await api.delete(`/messagerie/messages/${messageId}/`);
  return response.data;
};

export const deleteConversation = async (conversationId) => {
  const response = await api.delete(`/messagerie/conversations/${conversationId}/`);
  return response.data;
};

export default {
  getConversations,
  getConversation,
  createConversation,
  startConversation,
  envoyerMessage,
  envoyerMessageVocal,
  getMessages,
  marquerMessageLu,
  marquerConversationLue,
  deleteMessage,
  deleteConversation,
};