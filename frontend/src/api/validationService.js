import api from './axiosConfig';

// Services de validation pour les administrateurs

export const validerRessource = async (id, payload) => {
  const response = await api.post(`/ressources/admin/ressources/${id}/valider/`, payload || {});
  return response.data;
};

export const getApercuValidation = async (id) => {
  const response = await api.post(`/ressources/admin/ressources/${id}/apercu_validation/`);
  return response.data;
};

export const getHistoriqueValidations = async (id) => {
  const response = await api.post(`/ressources/admin/ressources/${id}/historique_validations/`);
  return response.data;
};

export const getRessourcesEnAttente = async () => {
  const response = await api.get('/ressources/admin/ressources/en-attente/');
  return response.data;
};
