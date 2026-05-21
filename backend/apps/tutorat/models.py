from django.db import models
from django.utils import timezone
from apps.accounts.models import User

class OffreTutorat(models.Model):
    TYPE_CHOICES = (('individuel', 'Individuel'), ('groupe', 'Groupe'))
    # Niveaux adaptés au système LMD de l'INSTA
    NIVEAU_CHOICES = (
        ('L1', 'Licence 1ère année'),
        ('L2', 'Licence 2ème année'),
        ('L3', 'Licence 3ème année'),
        ('M1', 'Master 1ère année'),
        ('M2', 'Master 2ème année'),
    )
    
    # Matières spécifiques à l'INSTA (structurées par départements)
    MATIERE_CHOICES = (
        # Département d'Électromécanique
        ('genie_electrique', 'Génie électrique'),
        ('genie_mecanique', 'Génie mécanique'),
        ('genie_energetique', 'Génie énergétique'),
        ('electrotechnique', 'Électrotechnique'),
        ('automatisme', 'Automatisme et contrôle'),
        
        # Département d'Informatique Industrielle et de Gestion
        ('genie_informatique', 'Génie informatique'),
        ('developpement_web', 'Développement web et mobile'),
        ('reseaux_telecoms', 'Réseaux et télécommunications'),
        ('intelligence_artificielle', 'Intelligence artificielle'),
        ('base_donnees', 'Bases de données'),
        
        # Département des Sciences et Techniques d'Élevage
        ('production_animale', 'Production animale'),
        ('sante_animale', 'Santé animale'),
        ('nutrition_animale', 'Nutrition animale'),
        ('genie_animal', 'Génie animal'),
        ('hygiene_alimentaire', 'Hygiène et sécurité alimentaire'),
        
        # Département des Sciences Biomédicales et Pharmaceutiques
        ('sciences_biomedicales', 'Sciences biomédicales'),
        ('pharmacie', 'Pharmacie'),
        ('analyses_biomedicales', 'Analyses biomédicales'),
        ('biochimie', 'Biochimie'),
        ('microbiologie', 'Microbiologie'),
        
        # Département de Télécommunications-Multimédia et Audiovisuelles
        ('telecommunications', 'Télécommunications'),
        ('multimedia_audiovisuel', 'Multimédia et audiovisuel'),
        ('reseaux_informatiques', 'Réseaux informatiques'),
        ('traitement_signal', 'Traitement du signal'),
        ('systemes_communication', 'Systèmes de communication'),
        
        # Département des Sciences Fondamentales
        ('mathematiques_appliquees', 'Mathématiques appliquées'),
        ('physique', 'Physique'),
        ('chimie', 'Chimie'),
        ('statistiques', 'Statistiques'),
        ('sciences_environnement', 'Sciences de l\'environnement'),
        
        # Nouveaux départements et spécialisations
        # PEA (Production Énergétique Alternatives)
        ('energies_renouvelables', 'Énergies renouvelables'),
        ('photovoltaique', 'Solaire photovoltaïque'),
        ('eolien', 'Énergie éolienne'),
        ('biomasse', 'Biomasse et biocarburants'),
        
        # Bio-informatique
        ('bioinformatique', 'Bio-informatique'),
        ('genomique', 'Génomique'),
        ('bio_statistiques', 'Biostatistiques'),
        ('modelisation_biologique', 'Modélisation biologique'),
        
        # Autres spécialisations émergentes
        ('iot', 'Internet des Objets (IoT)'),
        ('cybersecurite', 'Cybersécurité'),
        ('data_science', 'Data Science'),
        ('cloud_computing', 'Cloud Computing'),
        ('robotique', 'Robotique et automation'),
        ('materials_science', 'Science des matériaux'),
        ('geosciences', 'Géosciences'),
        ('agro_industrie', 'Agro-industrie'),
        ('gestion_projet', 'Gestion de projet'),
        ('entrepreneuriat', 'Entrepreneuriat'),
    )
    
    # Workflow et statut
    WORKFLOW_CHOICES = (
        ('brouillon', 'Brouillon'),
        ('en_attente_validation', 'En attente de validation'),
        ('publie', 'Publié'),
        ('suspendu', 'Suspendu'),
        ('archive', 'Archivé'),
    )
    
    PLANNING_MODE_CHOICES = (
        ('manuel', 'Manuel'),
        ('auto_dispos', 'Basé sur disponibilités'),
        ('repetitif', 'Répétitif'),
    )
    
    tuteur = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role__in': ['tuteur', 'enseignant']})
    titre = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    matiere = models.CharField(max_length=100, db_index=True)  # Champ libre pour saisie manuelle
    niveau = models.CharField(max_length=50, choices=NIVEAU_CHOICES, db_index=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='individuel')
    
    # Tarification
    tarif = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    tarif_reduction = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    gratuit = models.BooleanField(default=False)
    
    # Disponibilités et planning
    duree_session = models.PositiveIntegerField(default=60)  # minutes
    nombre_places = models.PositiveIntegerField(default=1)
    planning_flexible = models.BooleanField(default=True)
    mode_planning = models.CharField(max_length=25, choices=PLANNING_MODE_CHOICES, default='manuel')
    
    # Modalités
    en_ligne = models.BooleanField(default=True)
    presentiel = models.BooleanField(default=False)
    lieu = models.CharField(max_length=255, blank=True)
    lien_visio = models.URLField(blank=True)
    
    # Workflow et validation
    statut_workflow = models.CharField(max_length=25, choices=WORKFLOW_CHOICES, default='brouillon')
    est_active = models.BooleanField(default=True)
    validee_par_admin = models.BooleanField(default=False)
    date_validation = models.DateTimeField(null=True, blank=True)
    admin_validateur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                    related_name='offres_validees', limit_choices_to={'role': 'admin'})
    
    # Configuration avancée
    repetition_config = models.JSONField(default=dict, blank=True)
    dates_exclues = models.JSONField(default=list, blank=True)
    date_publication = models.DateTimeField(null=True, blank=True)
    
    # Statistiques
    vues = models.PositiveIntegerField(default=0)
    candidatures = models.PositiveIntegerField(default=0)
    sessions_realisees = models.PositiveIntegerField(default=0)
    note_moyenne = models.FloatField(default=0.0)
    
    date_creation = models.DateTimeField(auto_now_add=True, db_index=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tutorat_offre'
        verbose_name = 'Offre de tutorat'
        verbose_name_plural = 'Offres de tutorat'
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"{self.titre} - {self.tuteur.get_full_name()}"
    
    @property
    def nombre_inscrits(self):
        """Retourne le nombre d'étudiants inscrits"""
        if self.type == 'groupe':
            return self.inscriptions.filter(statut='acceptee').count()
        return 0
    
    @property
    def places_disponibles(self):
        """Retourne le nombre de places disponibles"""
        if self.type == 'groupe':
            return self.nombre_places - self.nombre_inscrits
        return 1 if self.est_active else 0
    
    def generer_planning_sessions(self, date_debut=None, date_fin=None):
        """Génère les sessions basées sur la configuration de répétition"""
        from datetime import datetime, timedelta
        from .models import Seance
        
        if self.mode_planning != 'repetitif' or not self.repetition_config:
            return []
        
        config = self.repetition_config
        repetition_type = config.get('type', 'aucune')
        
        if repetition_type == 'aucune':
            return []
        
        # Définir la période
        date_debut = date_debut or datetime.now().date()
        date_fin = date_fin or (date_debut + timedelta(days=30))
        
        sessions = []
        current_date = date_debut
        
        while current_date <= date_fin:
            # Vérifier si c'est un jour sélectionné
            jour_semaine = current_date.weekday()  # 0=Lundi
            
            if jour_semaine in config.get('jours', []):
                # Vérifier si la date n'est pas exclue
                date_str = current_date.isoformat()
                if date_str not in config.get('exceptions', []):
                    # Créer la session
                    heure_debut = config.get('heure_debut', '09:00')
                    session_datetime = datetime.combine(current_date, datetime.strptime(heure_debut, '%H:%M').time())
                    
                    # Vérifier les conflits avec les disponibilités du tuteur
                    if self.verifier_disponibilite(session_datetime):
                        session = Seance(
                            offre=self,
                            tuteur=self.tuteur,
                            sujet=self.titre,
                            date_heure_debut=session_datetime,
                            date_heure_fin=session_datetime + timedelta(minutes=self.duree_session),
                            description=self.description,
                            en_ligne=self.en_ligne,
                            lieu=self.lieu if self.presentiel else '',
                            lien_visio=self.lien_visio if self.en_ligne else '',
                            statut='planifiee'
                        )
                        sessions.append(session)
            
            current_date += timedelta(days=1)
        
        return sessions
    
    def verifier_disponibilite(self, datetime_session):
        """Vérifie si le tuteur est disponible à cette date/heure"""
        from .models import Disponibilite
        
        jour_semaine = datetime_session.weekday()  # 0=Lundi
        heure = datetime_session.time()
        
        # Rechercher les disponibilités correspondantes
        dispos = Disponibilite.objects.filter(
            tuteur=self.tuteur,
            jour_semaine=jour_semaine,
            est_recurrent=True
        )
        
        for dispo in dispos:
            heure_debut = datetime.strptime(dispo.heure_debut, '%H:%M:%S').time()
            heure_fin = datetime.strptime(dispo.heure_fin, '%H:%M:%S').time()
            
            if heure_debut <= heure < heure_fin:
                return True
        
        return False

class GroupeTutorat(models.Model):
    offre = models.ForeignKey(OffreTutorat, on_delete=models.SET_NULL, null=True, blank=True, related_name='groupes')
    nom = models.CharField(max_length=200)
    capacite_max = models.PositiveIntegerField()
    description = models.TextField(blank=True)
    date_debut = models.DateField(null=True, blank=True)
    date_fin = models.DateField(null=True, blank=True)
    createur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='groupes_crees')
    
    # Paramètres
    prive = models.BooleanField(default=False)
    code_acces = models.CharField(max_length=20, blank=True)
    auto_inscription = models.BooleanField(default=True)
    
    # Statistiques
    nombre_membres = models.PositiveIntegerField(default=0)
    nombre_sessions = models.PositiveIntegerField(default=0)
    
    date_creation = models.DateTimeField(auto_now_add=True, null=True)
    
    class Meta:
        db_table = 'tutorat_groupe'
        verbose_name = 'Groupe de tutorat'
        verbose_name_plural = 'Groupes de tutorat'
    
    def __str__(self):
        return f"Groupe {self.nom} ({self.nombre_membres} membres)"
    
    @property
    def places_disponibles(self):
        return self.capacite_max - self.nombre_membres

class InscriptionGroupe(models.Model):
    STATUT_CHOICES = (('en_attente', 'En attente'), ('accepte', 'Accepté'), ('refuse', 'Refusé'))
    etudiant = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'etudiant'})
    groupe = models.ForeignKey(GroupeTutorat, on_delete=models.CASCADE, related_name='inscriptions')
    date_inscription = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')

    class Meta:
        unique_together = ('etudiant', 'groupe')

class Disponibilite(models.Model):
    JOURS = [
        (0, 'Lundi'), (1, 'Mardi'), (2, 'Mercredi'), (3, 'Jeudi'),
        (4, 'Vendredi'), (5, 'Samedi'), (6, 'Dimanche')
    ]
    tuteur = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role__in': ['tuteur', 'enseignant']})
    jour_semaine = models.IntegerField(choices=JOURS)
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()
    est_recurrent = models.BooleanField(default=True)
    
    # Exceptions
    date_exception = models.DateField(null=True, blank=True)  # Si non récurrent
    indisponible = models.BooleanField(default=False)  # Pour marquer une exception
    
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    
    class Meta:
        db_table = 'tutorat_disponibilite'
        verbose_name = 'Disponibilité'
        verbose_name_plural = 'Disponibilités'
        ordering = ['jour_semaine', 'heure_debut']
    
    def __str__(self):
        return f"{self.tuteur.get_full_name()} - {self.get_jour_semaine_display()} {self.heure_debut}-{self.heure_fin}"

class Seance(models.Model):
    STATUT_CHOICES = (
        ('planifiee', 'Planifiée'),
        ('confirmee', 'Confirmée'),
        ('en_cours', 'En cours'),
        ('terminee', 'Terminée'),
        ('annulee', 'Annulée'),
        ('manquee', 'Manquée'),
    )
    
    offre = models.ForeignKey(OffreTutorat, on_delete=models.SET_NULL, null=True, blank=True)
    groupe = models.ForeignKey(GroupeTutorat, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Participants
    tuteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='seances_tuteur')
    etudiants = models.ManyToManyField(User, related_name='seances_etudiant', blank=True)
    
    # Planning
    date_heure_debut = models.DateTimeField(db_index=True)
    date_heure_fin = models.DateTimeField()
    duree = models.PositiveIntegerField(default=60)  # minutes
    
    # Modalités
    en_ligne = models.BooleanField(default=True)
    lien_visio = models.URLField(blank=True)
    lieu = models.CharField(max_length=255, blank=True)
    
    # Contenu
    sujet = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    ressources_partagees = models.JSONField(default=list, blank=True)
    
    # Statut et suivi
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='planifiee', db_index=True)
    commentaire_annulation = models.TextField(blank=True)
    date_annulation = models.DateTimeField(null=True, blank=True)
    
    # Rapport de séance
    rapport_tuteur = models.TextField(blank=True)
    rapport_etudiant = models.TextField(blank=True)
    travail_realise = models.TextField(blank=True)
    objectifs_suivants = models.TextField(blank=True)
    
    date_creation = models.DateTimeField(auto_now_add=True, null=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tutorat_seance'
        verbose_name = 'Séance de tutorat'
        verbose_name_plural = 'Séances de tutorat'
        ordering = ['-date_heure_debut']
    
    def __str__(self):
        return f"Séance {self.sujet} - {self.date_heure_debut.strftime('%d/%m/%Y %H:%M')}"
    
    @property
    def est_terminee(self):
        return self.statut == 'terminee'
    
    @property
    def nombre_etudiants(self):
        return self.etudiants.count()

class Evaluation(models.Model):
    seance = models.ForeignKey(Seance, on_delete=models.CASCADE, related_name='evaluations')
    auteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='evaluations_donnees')
    cible = models.ForeignKey(User, on_delete=models.CASCADE, related_name='evaluations_recues')
    
    # Note et commentaire
    note = models.PositiveSmallIntegerField()  # 1-5
    commentaire = models.TextField(blank=True)
    
    # Critères d'évaluation
    clarte_explication = models.PositiveSmallIntegerField(null=True, blank=True)
    patience = models.PositiveSmallIntegerField(null=True, blank=True)
    preparation = models.PositiveSmallIntegerField(null=True, blank=True)
    efficacite = models.PositiveSmallIntegerField(null=True, blank=True)
    
    date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'tutorat_evaluation'
        unique_together = ('seance', 'auteur', 'cible')
        verbose_name = 'Évaluation'
        verbose_name_plural = 'Évaluations'

class InscriptionOffre(models.Model):
    STATUT_CHOICES = (
        ('en_attente', 'En attente'),
        ('acceptee', 'Acceptée'),
        ('refusee', 'Refusée'),
        ('annulee', 'Annulée'),
    )
    
    offre = models.ForeignKey(OffreTutorat, on_delete=models.CASCADE, related_name='inscriptions')
    etudiant = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'etudiant'})
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    message = models.TextField(blank=True)
    
    date_inscription = models.DateTimeField(auto_now_add=True)
    date_reponse = models.DateTimeField(null=True, blank=True)
    reponse_tuteur = models.TextField(blank=True)
    
    class Meta:
        db_table = 'tutorat_inscription_offre'
        unique_together = ('offre', 'etudiant')
        verbose_name = 'Inscription à une offre'
        verbose_name_plural = 'Inscriptions aux offres'

class Ressource(models.Model):
    TYPE_CHOICES = (
        ('cours', 'Cours'),
        ('exercice', 'Exercice'),
        ('video', 'Vidéo'),
        ('document', 'Document'),
        ('quiz', 'Quiz'),
        ('lien', 'Lien utile'),
    )
    
    createur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ressources_creees')
    titre = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    
    # Contenu
    fichier = models.FileField(upload_to='ressources/', blank=True, null=True)
    lien = models.URLField(blank=True)
    contenu_texte = models.TextField(blank=True)
    
    # Classification
    matiere = models.CharField(max_length=100)
    niveau = models.CharField(max_length=50)
    tags = models.JSONField(default=list, blank=True)
    
    # Partage
    publique = models.BooleanField(default=True)
    groupes_partages = models.ManyToManyField(GroupeTutorat, related_name='ressources', blank=True)
    
    # Validation et statistiques
    validee_par_admin = models.BooleanField(default=False)
    date_validation = models.DateTimeField(null=True, blank=True)
    admin_validateur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                       related_name='ressources_validees', limit_choices_to={'role': 'admin'})
    
    telechargements = models.PositiveIntegerField(default=0)
    vues = models.PositiveIntegerField(default=0)
    notes = models.JSONField(default=list, blank=True)  # Liste des notes 1-5
    
    date_creation = models.DateTimeField(auto_now_add=True, null=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tutorat_ressource'
        verbose_name = 'Ressource pédagogique'
        verbose_name_plural = 'Ressources pédagogiques'
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"{self.titre} ({self.type})"
    
    @property
    def note_moyenne(self):
        if not self.notes:
            return 0
        return sum(self.notes) / len(self.notes)
    
    def ajouter_note(self, note):
        self.notes.append(note)
        self.save()