import api from './axiosConfig';

// Groupes de tutorat
export const getGroupesTutorat = async () => {
  const response = await api.get('/messaging/groupes/');
  return response.data;
};

export const createGroupe = async (groupeData) => {
  const response = await api.post('/messaging/groupes/', groupeData);
  return response.data;
};

export const getGroupeDetail = async (groupeId) => {
  const response = await api.get(`/messaging/groupes/${groupeId}/`);
  return response.data;
};

export const ajouterMembresGroupe = async (groupeId, etudiantIds) => {
  const response = await api.post(`/messaging/groupes/${groupeId}/ajouter_membres/`, {
    etudiant_ids: etudiantIds
  });
  return response.data;
};

export const retirerMembreGroupe = async (groupeId, etudiantId) => {
  const response = await api.post(`/messaging/groupes/${groupeId}/retirer_membre/`, {
    etudiant_id: etudiantId
  });
  return response.data;
};

// Messages de groupe
export const getMessagesGroupe = async (groupeId) => {
  const response = await api.get('/messaging/messages/', { 
    params: { groupe: groupeId } 
  });
  return response.data.results || response.data;
};

export const envoyerMessageGroupe = async (groupeId, messageData) => {
  const response = await api.post('/messaging/messages/', {
    ...messageData,
    groupe: groupeId
  });
  return response.data;
};

// Fichiers de groupe
export const getFichiersGroupe = async (groupeId) => {
  const response = await api.get('/messaging/fichiers/', { 
    params: { groupe: groupeId } 
  });
  return response.data.results || response.data;
};

export const uploadFichierGroupe = async (groupeId, fichierData) => {
  const formData = new FormData();
  formData.append('groupe', groupeId);
  formData.append('titre', fichierData.titre);
  formData.append('description', fichierData.description || '');
  formData.append('fichier', fichierData.fichier);
  
  const response = await api.post('/messaging/fichiers/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Exercices de groupe
export const getExercicesGroupe = async (groupeId) => {
  const response = await api.get('/messaging/exercices/', { 
    params: { groupe: groupeId } 
  });
  return response.data.results || response.data;
};

export const createExerciceGroupe = async (groupeId, exerciceData) => {
  const response = await api.post('/messaging/exercices/', {
    ...exerciceData,
    groupe: groupeId
  });
  return response.data;
};

// Sessions de tutorat
export const getSessionsTutorat = async () => {
  const response = await api.get('/messaging/sessions/');
  return response.data.results || response.data;
};

export const createSessionTutorat = async (sessionData) => {
  const response = await api.post('/messaging/sessions/', sessionData);
  return response.data;
};

export const rejoindreSession = async (sessionId) => {
  const response = await api.post(`/messaging/sessions/${sessionId}/rejoindre/`);
  return response.data;
};

export const quitterSession = async (sessionId) => {
  const response = await api.post(`/messaging/sessions/${sessionId}/quitter/`);
  return response.data;
};

// Statistiques de productivité pour tuteurs
export const getStatsTuteurMessagerie = async () => {
  const response = await api.get('/messaging/stats_tuteur/');
  return response.data;
};

// Étudiants disponibles pour l'ajout aux groupes
export const getEtudiantsDisponibles = async () => {
  const response = await api.get('/messaging/etudiants_disponibles/');
  return response.data.results || response.data;
};
