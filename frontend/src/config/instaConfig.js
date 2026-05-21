// Configuration spécifique à l'INSTA (Institut National des Sciences et Techniques d'Abéché)

export const INSTA_DEPARTEMENTS = {
  ELECTROMECANIQUE: {
    name: "Département d'Électromécanique",
    icon: "⚡",
    matieres: [
      { value: 'genie_electrique', label: 'Génie électrique' },
      { value: 'genie_mecanique', label: 'Génie mécanique' },
      { value: 'genie_energetique', label: 'Génie énergétique' },
      { value: 'electrotechnique', label: 'Électrotechnique' },
      { value: 'automatisme', label: 'Automatisme et contrôle' }
    ]
  },
  INFORMATIQUE: {
    name: "Département d'Informatique Industrielle et de Gestion",
    icon: "💻",
    matieres: [
      { value: 'genie_informatique', label: 'Génie informatique' },
      { value: 'developpement_web', label: 'Développement web et mobile' },
      { value: 'reseaux_telecoms', label: 'Réseaux et télécommunications' },
      { value: 'intelligence_artificielle', label: 'Intelligence artificielle' },
      { value: 'base_donnees', label: 'Bases de données' }
    ]
  },
  ELEVAGE: {
    name: "Département des Sciences et Techniques d'Élevage",
    icon: "🐄",
    matieres: [
      { value: 'production_animale', label: 'Production animale' },
      { value: 'sante_animale', label: 'Santé animale' },
      { value: 'nutrition_animale', label: 'Nutrition animale' },
      { value: 'genie_animal', label: 'Génie animal' },
      { value: 'hygiene_alimentaire', label: 'Hygiène et sécurité alimentaire' }
    ]
  },
  BIOMEDICAL: {
    name: "Département des Sciences Biomédicales et Pharmaceutiques",
    icon: "🏥",
    matieres: [
      { value: 'sciences_biomedicales', label: 'Sciences biomédicales' },
      { value: 'pharmacie', label: 'Pharmacie' },
      { value: 'analyses_biomedicales', label: 'Analyses biomédicales' },
      { value: 'biochimie', label: 'Biochimie' },
      { value: 'microbiologie', label: 'Microbiologie' }
    ]
  },
  TELECOMMUNICATIONS: {
    name: "Département de Télécommunications-Multimédia et Audiovisuelles",
    icon: "📡",
    matieres: [
      { value: 'telecommunications', label: 'Télécommunications' },
      { value: 'multimedia_audiovisuel', label: 'Multimédia et audiovisuel' },
      { value: 'reseaux_informatiques', label: 'Réseaux informatiques' },
      { value: 'traitement_signal', label: 'Traitement du signal' },
      { value: 'systemes_communication', label: 'Systèmes de communication' }
    ]
  },
  FONDAMENTALES: {
    name: "Département des Sciences Fondamentales",
    icon: "🔬",
    matieres: [
      { value: 'mathematiques_appliquees', label: 'Mathématiques appliquées' },
      { value: 'physique', label: 'Physique' },
      { value: 'chimie', label: 'Chimie' },
      { value: 'statistiques', label: 'Statistiques' },
      { value: 'sciences_environnement', label: 'Sciences de l\'environnement' }
    ]
  },
  PEA: {
    name: "PEA (Production Énergétique Alternatives)",
    icon: "🌞",
    matieres: [
      { value: 'energies_renouvelables', label: 'Énergies renouvelables' },
      { value: 'photovoltaique', label: 'Solaire photovoltaïque' },
      { value: 'eolien', label: 'Énergie éolienne' },
      { value: 'biomasse', label: 'Biomasse et biocarburants' }
    ]
  },
  BIOINFORMATIQUE: {
    name: "Bio-informatique",
    icon: "🧬",
    matieres: [
      { value: 'bioinformatique', label: 'Bio-informatique' },
      { value: 'genomique', label: 'Génomique' },
      { value: 'bio_statistiques', label: 'Biostatistiques' },
      { value: 'modelisation_biologique', label: 'Modélisation biologique' }
    ]
  },
  EMERGENTES: {
    name: "Spécialisations Émergentes",
    icon: "🚀",
    matieres: [
      { value: 'iot', label: 'Internet des Objets (IoT)' },
      { value: 'cybersecurite', label: 'Cybersécurité' },
      { value: 'data_science', label: 'Data Science' },
      { value: 'cloud_computing', label: 'Cloud Computing' },
      { value: 'robotique', label: 'Robotique et automation' },
      { value: 'materials_science', label: 'Science des matériaux' },
      { value: 'geosciences', label: 'Géosciences' },
      { value: 'agro_industrie', label: 'Agro-industrie' },
      { value: 'gestion_projet', label: 'Gestion de projet' },
      { value: 'entrepreneuriat', label: 'Entrepreneuriat' }
    ]
  }
};

export const INSTA_NIVEAUX = [
  { value: 'L1', label: 'Licence 1ère année (L1)' },
  { value: 'L2', label: 'Licence 2ème année (L2)' },
  { value: 'L3', label: 'Licence 3ème année (L3)' },
  { value: 'M1', label: 'Master 1ère année (M1)' },
  { value: 'M2', label: 'Master 2ème année (M2)' }
];

// Obtenir toutes les matières aplaties pour les sélecteurs
export const getAllMatieres = () => {
  const allMatieres = [];
  Object.values(INSTA_DEPARTEMENTS).forEach(departement => {
    allMatieres.push(...departement.matieres);
  });
  return allMatieres;
};

// Obtenir une matière par sa valeur
export const getMatiereByValue = (value) => {
  const allMatieres = getAllMatieres();
  return allMatieres.find(matiere => matiere.value === value);
};

// Obtenir le département d'une matière
export const getDepartementByMatiere = (matiereValue) => {
  for (const [key, departement] of Object.entries(INSTA_DEPARTEMENTS)) {
    const found = departement.matieres.find(m => m.value === matiereValue);
    if (found) {
      return { key, ...departement };
    }
  }
  return null;
};
