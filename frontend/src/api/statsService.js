import api from './axiosConfig';

// Statistiques publiques pour la page d'accueil
export const getStatsPubliques = async () => {
  const response = await api.get('/stats/');
  return response.data;
};

export const getMatieres = async () => {
  const response = await api.get('/matieres/');
  return response.data;
};

export const getRessourcesRecentes = async () => {
  const response = await api.get('/ressources/recentes/');
  return response.data;
};