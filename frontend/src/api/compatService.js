// Service de compatibilité pour maintenir l'ancien format tout en utilisant les nouveaux services
import { getNotifications as newGetNotifications } from './notificationService';
import { markAsRead as newMarkAsRead, marquerToutLu as newMarquerToutLu } from './notificationService';
import { getOffres as newGetOffres, getSeances as newGetSeances, deleteOffre as newDeleteOffre } from './tutorService';
import { getRessources as newGetRessources } from './ressourceService';
import { getQuestions as newGetQuestions } from './forumService';
import { getConversations as newGetConversations } from './messagerieService';

// Notifications - retourne directement le tableau
export const getNotifications = async (params = {}) => {
  const result = await newGetNotifications(params);
  return result.success ? result.data : [];
};

export const getUnreadNotifications = async () => {
  const result = await newGetNotifications({ est_lue: false });
  return result.success ? result.data : [];
};

export const markAsRead = async (id) => {
  const result = await newMarkAsRead(id);
  return result.success ? result.data : [];
};

export const marquerLue = async (id) => {
  const result = await newMarkAsRead(id);
  return result.success ? result.data : [];
};

export const marquerToutLu = async () => {
  const result = await newMarquerToutLu();
  return result.success ? result.data : [];
};

// Tutorat - retourne directement le tableau
export const getOffres = async (params = {}) => {
  const result = await newGetOffres(params);
  return result.success ? result.data : [];
};

export const getSeances = async (params = {}) => {
  const result = await newGetSeances(params);
  return result.success ? result.data : [];
};

export const deleteOffre = async (id) => {
  const result = await newDeleteOffre(id);
  return result.success ? result.data : [];
};

// Ressources - retourne directement le tableau
export const getRessources = async (params = {}) => {
  const result = await newGetRessources(params);
  return result.success ? result.data : [];
};

// Forum - retourne directement le tableau
export const getQuestions = async (params = {}) => {
  const result = await newGetQuestions(params);
  return result.success ? result.data : [];
};

// Messagerie - retourne directement le tableau
export const getConversations = async (params = {}) => {
  const result = await newGetConversations(params);
  return result.success ? result.data : [];
};

export default {
  getNotifications,
  getUnreadNotifications,
  markAsRead,
  marquerLue,
  marquerToutLu,
  getOffres,
  getSeances,
  deleteOffre,
  getRessources,
  getQuestions,
  getConversations,
};
