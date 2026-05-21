export type UserRole = 'etudiant' | 'tuteur' | 'enseignant' | 'admin';

export interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: UserRole;
  filiere?: string;
  annee?: string;
  bio?: string;
  photo?: string;
  centres_interet?: string;
  matieres_maitrisees?: string;
  tarif_horaire?: number;
  est_actif: boolean;
  date_inscription: string;
}

export interface DemandeTuteur {
  id: number;
  utilisateur: User;
  statut: 'en_attente' | 'valide' | 'rejete';
  date_soumission: string;
  commentaire_admin?: string;
}