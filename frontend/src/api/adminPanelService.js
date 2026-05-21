import api from './axiosConfig';

// Dashboard stats
export const getAdminDashboardStats = async () => {
  const response = await api.get('/admin/dashboard_stats/');
  return response.data;
};

// Queue de modération
export const getModerationQueue = async () => {
  const response = await api.get('/admin/moderation_queue/');
  return response.data;
};

// Actions de modération
export const approveQuestion = async (questionId) => {
  const response = await api.post(`/admin/approve_question/${questionId}/`);
  return response.data;
};

export const rejectQuestion = async (questionId, reason) => {
  const response = await api.post(`/admin/reject_question/${questionId}/`, { reason });
  return response.data;
};

export const approveResponse = async (responseId) => {
  const response = await api.post(`/admin/approve_response/${responseId}/`);
  return response.data;
};

export const rejectResponse = async (responseId, reason) => {
  const response = await api.post(`/admin/reject_response/${responseId}/`, { reason });
  return response.data;
};

// Logs d'activité
export const getAdminActivityLogs = async () => {
  const response = await api.get('/admin/activity_logs/');
  return response.data;
};

// Export de données
export const exportAdminData = async (type) => {
  const response = await api.get(`/admin/export_data/?type=${type}`);
  return response.data;
};

// Actions utilisateurs avancées
export const suspendUser = async (userId, reason, until) => {
  const response = await api.post(`/admin/suspend_user/${userId}/`, { reason, until });
  return response.data;
};

export const unsuspendUser = async (userId) => {
  const response = await api.post(`/admin/unsuspend_user/${userId}/`);
  return response.data;
};

// Stats détaillées
export const getDetailedStats = async (period) => {
  const response = await api.get(`/admin/detailed_stats/?period=${period}`);
  return response.data;
};

// Gestion des signalements
export const getReports = async (status = 'pending') => {
  const response = await api.get(`/admin/reports/?status=${status}`);
  return response.data;
};

export const resolveReport = async (reportId, action, reason) => {
  const response = await api.post(`/admin/resolve_report/${reportId}/`, { action, reason });
  return response.data;
};
