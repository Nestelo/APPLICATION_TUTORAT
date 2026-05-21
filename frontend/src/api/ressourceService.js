import api from './axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fonction utilitaire pour créer des clés AsyncStorage spécifiques à l'utilisateur
const getUserStorageKey = (baseKey, userId) => {
  if (!userId) {
    console.warn('📚 getUserStorageKey: userId est undefined, utilisation de la clé globale');
    return baseKey;
  }
  return `user_${userId}_${baseKey}`;
};

// Liste des ressources (avec filtres éventuels : statut, matiere, niveau, type_fichier...)
export const getRessources = async (params = {}) => {
  const response = await api.get('/ressources/ressources/', { params });
  const data = response.data;
  // Si un jour tu actives la pagination DRF, on gèrera data.results ici
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data.results)) {
    return data.results;
  }
  return [];
};

export const getRessource = async (id) => {
  const response = await api.get(`/ressources/ressources/${id}/`);
  return response.data;
};

export const createRessource = async (formData) => {
  const response = await api.post('/ressources/ressources/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateRessource = async (id, payload) => {
  // Permet aussi l'upload de fichiers via multipart/form-data
  const isFormData = payload && typeof payload.get === 'function';
  const config = isFormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : undefined;
  const response = await api.put(`/ressources/ressources/${id}/`, payload, config);
  return response.data;
};

export const deleteRessource = async (id) => {
  const response = await api.delete(`/ressources/ressources/${id}/`);
  return response.data;
};

// Actions sur les ressources
export const telechargerRessource = async (id, titre, userId = null) => {
  console.log('📚 telechargerRessource appelé avec:', { id, titre, userId });
  
  // Utiliser les clés spécifiques à l'utilisateur si userId est fourni
  const interactionsKey = getUserStorageKey('ressources_interactions', userId);
  const triggerKey = getUserStorageKey('dashboard_refresh_trigger', userId);
  
  console.log('📚 Clés utilisées pour téléchargement:', { interactionsKey, triggerKey });
  
  // Enregistrer l'interaction localement pour le compteur global
  try {
    const interactionData = {
      ressource_id: id,
      titre: titre || 'Ressource sans titre',
      type: 'telechargement',
      date_interaction: new Date().toISOString(),
      user_id: userId // Ajouter l'ID utilisateur pour traçabilité
    };
    
    console.log('📚 Début enregistrement téléchargement local:', interactionData);
    
    const interactionsStockees = await AsyncStorage.getItem(interactionsKey) || '[]';
    const interactions = JSON.parse(interactionsStockees);
    interactions.unshift(interactionData);
    const interactionsRecentes = interactions.slice(0, 50); // Garder plus d'historique
    
    await AsyncStorage.setItem(interactionsKey, JSON.stringify(interactionsRecentes));
    console.log('📚 Téléchargement enregistré localement:', interactionData);
    
    // Déclencher un événement pour rafraîchir le dashboard
    const triggerTime = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    await AsyncStorage.setItem(triggerKey, triggerTime);
    console.log('📚 Trigger de rafraîchissement du dashboard (téléchargement):', triggerTime);
  } catch (error) {
    console.error('📚 Erreur enregistrement téléchargement local:', error);
  }
  
  const response = await api.post(`/ressources/ressources/${id}/telecharger/`);
  return response.data;
};

export const vueRessource = async (id, titre, categorie = 'globale', userId = null) => {
  console.log('📚 vueRessource appelé avec:', { id, titre, categorie, userId });
  
  // Utiliser les clés spécifiques à l'utilisateur si userId est fourni
  const consultationsKey = getUserStorageKey('consultations_ressources', userId);
  const interactionsKey = getUserStorageKey('ressources_interactions', userId);
  const triggerKey = getUserStorageKey('dashboard_refresh_trigger', userId);
  
  console.log('📚 Clés utilisées:', { consultationsKey, interactionsKey, triggerKey });
  
  // Enregistrer dans les deux systèmes pour compatibilité
  try {
    // 1. Ancien système (consultations_ressources) pour compatibilité
    const consultationData = {
      ressource_id: id,
      titre: titre || 'Ressource sans titre',
      date_consultation: new Date().toISOString(),
      user_id: userId // Ajouter l'ID utilisateur pour traçabilité
    };
    
    console.log('📚 Début enregistrement local depuis vueRessource:', consultationData);
    
    const consultationsStockees = await AsyncStorage.getItem(consultationsKey) || '[]';
    console.log('📚 État avant consultations_ressources:', consultationsStockees);
    const consultations = JSON.parse(consultationsStockees);
    consultations.unshift(consultationData);
    const consultationsRecentes = consultations.slice(0, 10);
    
    await AsyncStorage.setItem(consultationsKey, JSON.stringify(consultationsRecentes));
    console.log('📚 Consultation enregistrée localement depuis vueRessource:', consultationData);
    
    // 2. Nouveau système unifié (ressources_interactions)
    const interactionData = {
      ressource_id: id,
      titre: titre || 'Ressource sans titre',
      type: 'consultation',
      categorie: categorie,
      date_interaction: new Date().toISOString(),
      user_id: userId // Ajouter l'ID utilisateur pour traçabilité
    };
    
    console.log('📚 Début enregistrement interaction unifiée:', interactionData);
    
    const interactionsStockees = await AsyncStorage.getItem(interactionsKey) || '[]';
    console.log('📚 État avant ressources_interactions:', interactionsStockees);
    const interactions = JSON.parse(interactionsStockees);
    console.log('📚 Interactions parsées avant ajout:', interactions);
    interactions.unshift(interactionData);
    const interactionsRecentes = interactions.slice(0, 50);
    
    await AsyncStorage.setItem(interactionsKey, JSON.stringify(interactionsRecentes));
    console.log('📚 Interaction unifiée enregistrée:', interactionData);
    
    // Vérifier l'enregistrement
    const verifyInteractions = await AsyncStorage.getItem(interactionsKey);
    console.log('📚 Vérification ressources_interactions après enregistrement:', verifyInteractions);
    
    // Déclencher un événement pour rafraîchir le dashboard
    const triggerTime = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    await AsyncStorage.setItem(triggerKey, triggerTime);
    console.log('📚 Trigger de rafraîchissement du dashboard activé:', triggerTime);
    
    // Vérifier que le trigger est bien enregistré
    const verifyTrigger = await AsyncStorage.getItem(triggerKey);
    console.log('📚 Vérification trigger enregistré:', verifyTrigger);
  } catch (error) {
    console.error('📚 Erreur enregistrement local:', error);
  }
  
  // Essayer l'API ensuite (non bloquant)
  try {
    const response = await api.post(`/ressources/ressources/${id}/vue/`);
    return response.data;
  } catch (error) {
    console.log('📚 Erreur API vueRessource (ignorée car local fonctionne):', error.message);
    // Ne pas propager l'erreur pour ne pas bloquer l'interface
    return { success: true, local: true };
  }
};

export const noterRessource = async (id, note) => {
  const response = await api.post(`/ressources/ressources/${id}/noter/`, { note });
  return response.data;
};

export const toggleFavori = async (id) => {
  const response = await api.post(`/ressources/ressources/${id}/favori/`);
  return response.data;
};

// RessourceDetailScreen a besoin de getCommentaires.
// Notre backend fournit déjà commentaires dans RessourceSerializer,
// donc on les récupère via getRessource.
export const getCommentaires = async (id) => {
  const res = await getRessource(id);
  return res?.commentaires || [];
};

export const commenterRessource = async (id, contenu) => {
  const response = await api.post(`/ressources/ressources/${id}/commenter/`, { contenu });
  return response.data;
};

// Alias pour cohérence des noms côté UI
export const createCommentaire = commenterRessource;

// Admin endpoints
export const getRessourcesEnAttente = async () => {
  const response = await api.get('/ressources/admin/ressources/en-attente/');
  return response.data;
};

export const validerRessource = async (id) => {
  const response = await api.post(`/ressources/admin/ressources/${id}/valider/`);
  return response.data;
};

export const rejeterRessource = async (id, motif) => {
  const response = await api.post(`/ressources/admin/ressources/${id}/rejeter/`, { motif });
  return response.data;
};

// Fonctions pour les ressources de groupes
export const getRessourcesGroupe = async (groupeId, params = {}) => {
  const response = await api.get(`/ressources/groupes/${groupeId}/ressources/`, { params });
  return response.data;
};

export const createRessourceGroupe = async (formData) => {
  const response = await api.post('/ressources/groupes/creer-ressource/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getStatistiquesRessourcesGroupe = async (groupeId) => {
  const response = await api.get(`/ressources/groupes/${groupeId}/statistiques/`);
  return response.data;
};

export const telechargerRessourceGroupe = async (id, titre, userId = null) => {
  console.log('📚 telechargerRessourceGroupe appelé avec:', { id, titre, userId });
  
  // Utiliser les clés spécifiques à l'utilisateur si userId est fourni
  const interactionsKey = getUserStorageKey('ressources_interactions', userId);
  const triggerKey = getUserStorageKey('dashboard_refresh_trigger', userId);
  
  console.log('📚 Clés utilisées pour téléchargement groupe:', { interactionsKey, triggerKey });
  
  // Enregistrer l'interaction localement pour le compteur global
  try {
    const interactionData = {
      ressource_id: id,
      titre: titre || 'Ressource de groupe sans titre',
      type: 'telechargement',
      categorie: 'groupe',
      date_interaction: new Date().toISOString(),
      user_id: userId // Ajouter l'ID utilisateur pour traçabilité
    };
    
    console.log('📚 Début enregistrement téléchargement groupe local:', interactionData);
    
    const interactionsStockees = await AsyncStorage.getItem(interactionsKey) || '[]';
    const interactions = JSON.parse(interactionsStockees);
    interactions.unshift(interactionData);
    const interactionsRecentes = interactions.slice(0, 50); // Garder plus d'historique
    
    await AsyncStorage.setItem(interactionsKey, JSON.stringify(interactionsRecentes));
    console.log('📚 Téléchargement groupe enregistré localement:', interactionData);
    
    // Déclencher un événement pour rafraîchir le dashboard
    const triggerTime = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    await AsyncStorage.setItem(triggerKey, triggerTime);
    console.log('📚 Trigger de rafraîchissement du dashboard (téléchargement groupe):', triggerTime);
  } catch (error) {
    console.error('📚 Erreur enregistrement téléchargement groupe local:', error);
  }
  
  const response = await api.post(`/ressources/groupes/ressources/${id}/telecharger/`);
  return response.data;
};

export const getRessourceGroupeDetail = async (groupeId, resourceId) => {
  const response = await api.get(`/ressources/groupes/${groupeId}/ressources/${resourceId}/`);
  return response.data;
};

export default {
  getRessources,
  getRessource,
  createRessource,
  updateRessource,
  deleteRessource,
  telechargerRessource,
  vueRessource,
  noterRessource,
  toggleFavori,
  commenterRessource,
  getCommentaires,
  createCommentaire,
  getRessourcesEnAttente,
  validerRessource,
  rejeterRessource,
  getRessourcesGroupe,
  createRessourceGroupe,
  getStatistiquesRessourcesGroupe,
  telechargerRessourceGroupe,
  getRessourceGroupeDetail,
};
