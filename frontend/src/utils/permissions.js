import { ROLES } from './constants';

export const canCreateRessource = (user) => {
  return user && [ROLES.TUTEUR, ROLES.ENSEIGNANT, ROLES.ADMIN].includes(user.role);
};

export const canModerate = (user) => {
  return user && user.role === ROLES.ADMIN;
};

export const canAccessDashboard = (user, requiredRole) => {
  if (!user) return false;
  if (requiredRole === ROLES.ADMIN) return user.role === ROLES.ADMIN;
  if (requiredRole === ROLES.TUTEUR) return [ROLES.TUTEUR, ROLES.ENSEIGNANT, ROLES.ADMIN].includes(user.role);
  return true; // étudiant peut accéder à son dashboard
};