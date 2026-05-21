import api from './axiosConfig';

// Services pour la messagerie email

export const envoyerEmail = async (destinataireId, sujet, contenu) => {
  const response = await api.post('/messagerie/email-messages/', {
    destinataire: destinataireId,
    sujet,
    contenu
  });
  return response.data;
};

export const envoyerEmailDirect = async (emailId) => {
  const response = await api.post(`/messagerie/email-messages/${emailId}/envoyer_email/`);
  return response.data;
};

export const marquerEmailRecu = async (emailId) => {
  const response = await api.post(`/messagerie/email-messages/${emailId}/marquer_recu/`);
  return response.data;
};

export const marquerEmailLu = async (emailId) => {
  const response = await api.post(`/messagerie/email-messages/${emailId}/marquer_lu/`);
  return response.data;
};

export const repondreEmail = async (emailId, contenu) => {
  const response = await api.post(`/messagerie/email-messages/${emailId}/repondre/`, {
    contenu
  });
  return response.data;
};

export const getConversation = async (emailId) => {
  const response = await api.get(`/messagerie/email-messages/${emailId}/conversation/`);
  return response.data;
};

export const getMesEmails = async () => {
  const response = await api.get('/messagerie/email-messages/mes_emails/');
  return response.data;
};

export const getStatistiquesEmails = async () => {
  const response = await api.get('/messagerie/email-messages/statistiques/');
  return response.data;
};

export const getEmailsEnvoyes = async (expediteurId) => {
  const response = await api.get('/messagerie/email-messages/', {
    params: { expediteur: expediteurId }
  });
  return response.data;
};

export const getEmailsRecus = async (destinataireId) => {
  const response = await api.get('/messagerie/email-messages/', {
    params: { destinataire: destinataireId }
  });
  return response.data;
};

export const supprimerMessageAdmin = async (emailId) => {
  const response = await api.delete(`/messagerie/email-messages/${emailId}/supprimer_message_admin/`);
  return response.data;
};
