export interface OffreTutorat {
  id: number;
  tuteur: number;
  tuteur_details?: User;
  titre: string;
  description?: string;
  matiere: string;
  niveau?: string;
  type: 'individuel' | 'groupe';
  tarif?: number;
  est_active: boolean;
  date_creation: string;
}

export interface GroupeTutorat {
  id: number;
  offre?: number;
  nom: string;
  capacite_max: number;
  description?: string;
  date_debut?: string;
  date_fin?: string;
  createur: number;
  createur_details?: User;
}

export interface Seance {
  id: number;
  offre?: number;
  groupe?: number;
  tuteur: number;
  tuteur_details?: User;
  etudiant?: number;
  etudiant_details?: User;
  date_heure_debut: string;
  date_heure_fin: string;
  lien_visio?: string;
  lieu?: string;
  statut: 'planifiee' | 'confirmee' | 'annulee' | 'terminee';
  commentaire?: string;
}