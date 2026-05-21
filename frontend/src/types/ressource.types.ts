export interface Ressource {
  id: number;
  titre: string;
  description?: string;
  auteur: number;
  auteur_details?: User;
  matiere?: string;
  niveau?: string;
  type_fichier: 'pdf' | 'video' | 'lien' | 'image';
  fichier?: string;
  lien_externe?: string;
  tags?: string;
  statut: 'en_attente' | 'publie' | 'rejete';
  nb_telechargements: number;
  nb_vues: number;
  date_publication: string;
  date_maj?: string;
}