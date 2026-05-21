export interface Question {
  id: number;
  titre: string;
  contenu: string;
  auteur: number;
  auteur_details?: User;
  matiere?: string;
  tags?: string;
  est_resolue: boolean;
  nb_vues: number;
  date_publication: string;
  date_derniere_reponse?: string;
}

export interface Reponse {
  id: number;
  question: number;
  auteur: number;
  auteur_details?: User;
  contenu: string;
  est_solution: boolean;
  nb_votes: number;
  date: string;
}