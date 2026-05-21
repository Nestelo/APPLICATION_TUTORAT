# 🗄️ **BACKEND MODELS COMPLETS**

## 📁 **apps/accounts/models.py (étendu)**

```python
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = (
        ('etudiant', 'Étudiant'),
        ('tuteur', 'Tuteur'),
        ('enseignant', 'Enseignant'),
        ('admin', 'Administrateur'),
    )
    
    STATUT_CHOICES = (
        ('actif', 'Actif'),
        ('inactif', 'Inactif'),
        ('suspendu', 'Suspendu'),
        ('en_attente', 'En attente de validation'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='etudiant')
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='actif')
    telephone = models.CharField(max_length=20, blank=True)
    photo = models.ImageField(upload_to='photos/', blank=True, null=True)
    biographie = models.TextField(blank=True)
    date_naissance = models.DateField(null=True, blank=True)
    date_inscription = models.DateTimeField(auto_now_add=True)
    derniere_connexion = models.DateTimeField(null=True, blank=True)
    email_verifie = models.BooleanField(default=False)
    telephone_verifie = models.BooleanField(default=False)
    
    # Champs spécifiques tuteur
    matieres_enseignees = models.JSONField(default=list, blank=True)
    niveau_enseignement = models.CharField(max_length=100, blank=True)
    experience = models.PositiveIntegerField(default=0)  # années d'expérience
    tarif_horaire = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    disponible = models.BooleanField(default=True)
    note_moyenne = models.FloatField(default=0.0)
    nombre_evaluations = models.PositiveIntegerField(default=0)
    
    # Champs spécifiques étudiant
    niveau_etudes = models.CharField(max_length=100, blank=True)
    etablissement = models.CharField(max_length=200, blank=True)
    objectifs_apprentissage = models.TextField(blank=True)
    
    # Badges et certifications
    badges = models.JSONField(default=list, blank=True)
    certifie = models.BooleanField(default=False)
    date_certification = models.DateTimeField(null=True, blank=True)
    
    # Statistiques des ressources
    ressources_consultees = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'auth_user'
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
    
    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.role})"
    
    @property
    def is_tuteur(self):
        return self.role in ['tuteur', 'enseignant']
    
    @property
    def is_etudiant(self):
        return self.role == 'etudiant'
    
    @property
    def is_admin_user(self):
        return self.role == 'admin'
    
    def update_rating(self, new_note):
        """Met à jour la note moyenne du tuteur"""
        total = self.note_moyenne * self.nombre_evaluations + new_note
        self.nombre_evaluations += 1
        self.note_moyenne = total / self.nombre_evaluations
        self.save()

class TutorProfile(models.Model):
    """Profil détaillé du tuteur"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='tutor_profile')
    diplomes = models.JSONField(default=list, blank=True)
    competences = models.JSONField(default=list, blank=True)
    langues = models.JSONField(default=list, blank=True)
    methodes_enseignement = models.TextField(blank=True)
    disponibilites_speciales = models.TextField(blank=True)
    zone_geographique = models.CharField(max_length=200, blank=True)
    accepte_en_ligne = models.BooleanField(default=True)
    accepte_presentiel = models.BooleanField(default=True)
    tarif_reduit = models.BooleanField(default=False)
    conditions_reductions = models.TextField(blank=True)
    
    # Statistiques avancées
    total_sessions = models.PositiveIntegerField(default=0)
    total_etudiants = models.PositiveIntegerField(default=0)
    taux_reponse = models.FloatField(default=0.0)
    taux_completion = models.FloatField(default=0.0)
    temps_moyen_reponse = models.DurationField(null=True, blank=True)
    
    # Performance par matière
    performance_matieres = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Profil de {self.user.get_full_name()}"
    
    def update_performance_stats(self):
        """Met à jour les statistiques de performance"""
        from apps.tutorat.models import Seance, Evaluation
        
        # Sessions totales
        self.total_sessions = Seance.objects.filter(tuteur=self.user, statut='terminee').count()
        
        # Étudiants uniques
        self.total_etudiants = Seance.objects.filter(
            tuteur=self.user, 
            statut='terminee'
        ).values('etudiant').distinct().count()
        
        # Taux de réponse (basé sur les messages)
        from apps.communication.models import Message
        messages_recus = Message.objects.filter(
            conversation__participants=self.user,
            expediteur__role='etudiant'
        ).count()
        messages_envoyes = Message.objects.filter(
            conversation__participants=self.user,
            expediteur=self.user
        ).count()
        
        if messages_recus > 0:
            self.taux_reponse = (messages_envoyes / messages_recus) * 100
        
        self.save()

class StudentProfile(models.Model):
    """Profil détaillé de l'étudiant"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    preferences_apprentissage = models.JSONField(default=list, blank=True)
    difficultes = models.JSONField(default=list, blank=True)
    objectifs_specifiques = models.TextField(blank=True)
    disponibilites_etudiant = models.JSONField(default=list, blank=True)
    budget_mensuel = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    preferences_horaires = models.JSONField(default=dict, blank=True)
    
    # Statistiques d'apprentissage
    sessions_suivies = models.PositiveIntegerField(default=0)
    temps_apprentissage = models.DurationField(null=True, blank=True)
    matieres_etudiees = models.JSONField(default=list, blank=True)
    progression_globale = models.FloatField(default=0.0)
    
    # Statistiques des ressources
    ressources_consultees = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Profil étudiant de {self.user.get_full_name()}"
    
    def increment_ressources_consultees(self):
        """Incrémente le compteur de ressources consultées"""
        self.ressources_consultees += 1
        self.save()
```

## 📁 **apps/tutorat/models.py (étendu)**

```python
from django.db import models
from django.utils import timezone
from apps.accounts.models import User

class OffreTutorat(models.Model):
    TYPE_CHOICES = (('individuel', 'Individuel'), ('groupe', 'Groupe'))
    NIVEAU_CHOICES = (
        ('primaire', 'Primaire'),
        ('college', 'Collège'),
        ('lycee', 'Lycée'),
        ('superieur', 'Supérieur'),
        ('professionnel', 'Professionnel'),
    )
    
    tuteur = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role__in': ['tuteur', 'enseignant']})
    titre = models.CharField(max_length=200)
    description = models.TextField()
    matiere = models.CharField(max_length=100, db_index=True)
    niveau = models.CharField(max_length=50, choices=NIVEAU_CHOICES, db_index=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='individuel')
    
    # Tarification
    tarif = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    tarif_reduction = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    gratuit = models.BooleanField(default=False)
    
    # Disponibilités
    duree_session = models.PositiveIntegerField(default=60)  # minutes
    nombre_places = models.PositiveIntegerField(default=1)
    planning_flexible = models.BooleanField(default=True)
    
    # Modalités
    en_ligne = models.BooleanField(default=True)
    presentiel = models.BooleanField(default=False)
    lieu = models.CharField(max_length=255, blank=True)
    lien_visio = models.URLField(blank=True)
    
    # Statut et validation
    est_active = models.BooleanField(default=True)
    validee_par_admin = models.BooleanField(default=False)
    date_validation = models.DateTimeField(null=True, blank=True)
    admin_validateur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                    related_name='offres_validees', limit_choices_to={'role': 'admin'})
    
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
            return self.inscriptions.filter(statut='accepte').count()
        return 0
    
    @property
    def places_disponibles(self):
        """Retourne le nombre de places disponibles"""
        if self.type == 'groupe':
            return self.nombre_places - self.nombre_inscrits
        return 1 if self.est_active else 0

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
    
    def __str__(self):
        return f"{self.etudiant.get_full_name()} → {self.offre.titre}"

class GroupeTutorat(models.Model):
    offre = models.ForeignKey(OffreTutorat, on_delete=models.SET_NULL, null=True, blank=True, related_name='groupes')
    nom = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    capacite_max = models.PositiveIntegerField()
    
    # Période
    date_debut = models.DateField(null=True, blank=True)
    date_fin = models.DateField(null=True, blank=True)
    
    # Création et gestion
    createur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='groupes_crees')
    tuteurs = models.ManyToManyField(User, related_name='groupes_tuteur', blank=True)
    
    # Paramètres
    prive = models.BooleanField(default=False)
    code_acces = models.CharField(max_length=20, blank=True)
    auto_inscription = models.BooleanField(default=True)
    
    # Statistiques
    nombre_membres = models.PositiveIntegerField(default=0)
    nombre_sessions = models.PositiveIntegerField(default=0)
    
    date_creation = models.DateTimeField(auto_now_add=True)
    
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
    STATUT_CHOICES = (
        ('en_attente', 'En attente'),
        ('accepte', 'Accepté'),
        ('refuse', 'Refusé'),
        ('expulse', 'Expulsé'),
    )
    
    groupe = models.ForeignKey(GroupeTutorat, on_delete=models.CASCADE, related_name='inscriptions')
    etudiant = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'etudiant'})
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    
    date_inscription = models.DateTimeField(auto_now_add=True)
    date_acceptation = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'tutorat_inscription_groupe'
        unique_together = ('groupe', 'etudiant')
        verbose_name = 'Inscription à un groupe'
        verbose_name_plural = 'Inscriptions aux groupes'
    
    def __str__(self):
        return f"{self.etudiant.get_full_name()} → {self.groupe.nom}"

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
    
    created_at = models.DateTimeField(auto_now_add=True)
    
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
    
    date_creation = models.DateTimeField(auto_now_add=True)
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
    
    def __str__(self):
        return f"Évaluation de {self.cible.get_full_name()} par {self.auteur.get_full_name()} ({self.note}/5)"

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
    
    date_creation = models.DateTimeField(auto_now_add=True)
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

class Conversation(models.Model):
    TYPE_CHOICES = (
        ('individuel', 'Individuel'),
        ('groupe', 'Groupe'),
        ('support', 'Support'),
    )
    
    titre = models.CharField(max_length=200, blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='individuel')
    participants = models.ManyToManyField(User, related_name='conversations')
    
    # Métadonnées
    cree_par = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations_creees')
    groupe_associe = models.ForeignKey('tutorat.GroupeTutorat', on_delete=models.CASCADE, 
                                      null=True, blank=True, related_name='conversations')
    
    # Statistiques
    dernier_message = models.DateTimeField(null=True, blank=True)
    nombre_messages = models.PositiveIntegerField(default=0)
    nombre_non_lus = models.JSONField(default=dict, blank=True)  # {user_id: count}
    
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'communication_conversation'
        verbose_name = 'Conversation'
        verbose_name_plural = 'Conversations'
        ordering = ['-dernier_message']
    
    def __str__(self):
        if self.titre:
            return self.titre
        participants_names = ", ".join([u.get_full_name() for u in self.participants.all()[:3]])
        return f"Conversation: {participants_names}"
    
    def mettre_a_jour_non_lus(self, user_id):
        """Met à jour le compteur de messages non lus pour un utilisateur"""
        current = self.nombre_non_lus.get(str(user_id), 0)
        self.nombre_non_lus[str(user_id)] = current + 1
        self.save()
    
    def marquer_comme_lu(self, user_id):
        """Marque tous les messages comme lus pour un utilisateur"""
        self.nombre_non_lus[str(user_id)] = 0
        self.save()
        self.messages.filter(lu_par__contains=[user_id]).update(lu_par=models.F('lu_par'))

class Message(models.Model):
    TYPE_CHOICES = (
        ('texte', 'Texte'),
        ('fichier', 'Fichier'),
        ('image', 'Image'),
        ('lien', 'Lien'),
        ('systeme', 'Message système'),
    )
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    expediteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages_envoyes')
    
    # Contenu
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='texte')
    contenu = models.TextField()
    fichier = models.FileField(upload_to='messages/', blank=True, null=True)
    
    # Métadonnées
    lu_par = models.JSONField(default=list, blank=True)  # Liste des user_id qui ont lu
    date_envoi = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    supprime_par = models.JSONField(default=list, blank=True)  # Liste des user_id qui ont supprimé
    
    # Réponses
    reponse_a = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='reponses')
    
    class Meta:
        db_table = 'communication_message'
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'
        ordering = ['date_envoi']
    
    def __str__(self):
        return f"Message de {self.expediteur.get_full_name()} dans {self.conversation}"
    
    def marquer_comme_lu(self, user_id):
        """Marque le message comme lu par un utilisateur"""
        if user_id not in self.lu_par:
            self.lu_par.append(user_id)
            self.save()

class ForumQuestion(models.Model):
    CATEGORIE_CHOICES = (
        ('mathematiques', 'Mathématiques'),
        ('physique', 'Physique'),
        ('chimie', 'Chimie'),
        ('biologie', 'Biologie'),
        ('informatique', 'Informatique'),
        ('français', 'Français'),
        ('anglais', 'Anglais'),
        ('histoire', 'Histoire'),
        ('geographie', 'Géographie'),
        ('economie', 'Économie'),
        ('autre', 'Autre'),
    )
    
    titre = models.CharField(max_length=200)
    contenu = models.TextField()
    categorie = models.CharField(max_length=50, choices=CATEGORIE_CHOICES)
    
    # Auteur et contexte
    auteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='questions_forum')
    matiere = models.CharField(max_length=100)
    niveau = models.CharField(max_length=50)
    
    # Fichiers joints
    fichiers = models.JSONField(default=list, blank=True)
    
    # Statistiques
    vues = models.PositiveIntegerField(default=0)
    nombre_reponses = models.PositiveIntegerField(default=0)
    
    # Statut
    resolu = models.BooleanField(default=False)
    date_resolution = models.DateTimeField(null=True, blank=True)
    meilleure_reponse = models.ForeignKey('ForumReponse', on_delete=models.SET_NULL, 
                                       null=True, blank=True, related_name='question_resolue')
    
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'communication_forum_question'
        verbose_name = 'Question forum'
        verbose_name_plural = 'Questions forum'
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"Question: {self.titre}"

class ForumReponse(models.Model):
    question = models.ForeignKey(ForumQuestion, on_delete=models.CASCADE, related_name='reponses')
    auteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reponses_forum')
    contenu = models.TextField()
    
    # Fichiers joints
    fichiers = models.JSONField(default=list, blank=True)
    
    # Votes
    votes_positifs = models.PositiveIntegerField(default=0)
    votes_negatifs = models.PositiveIntegerField(default=0)
    voteurs = models.JSONField(default=dict, blank=True)  # {user_id: vote_type}
    
    # Badges
    est_meilleure_reponse = models.BooleanField(default=False)
    date_meilleure_reponse = models.DateTimeField(null=True, blank=True)
    
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'communication_forum_reponse'
        verbose_name = 'Réponse forum'
        verbose_name_plural = 'Réponses forum'
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"Réponse de {self.auteur.get_full_name()} à {self.question.titre}"
    
    def voter(self, user, vote_type):
        """Gère le vote d'un utilisateur (+1 ou -1)"""
        user_id = user.id
        current_vote = self.voteurs.get(str(user_id))
        
        if current_vote == vote_type:
            # Annuler le vote
            del self.voteurs[str(user_id)]
            if vote_type == 'positif':
                self.votes_positifs -= 1
            else:
                self.votes_negatifs -= 1
        else:
            # Nouveau vote ou changement de vote
            if current_vote == 'positif':
                self.votes_positifs -= 1
            elif current_vote == 'negatif':
                self.votes_negatifs -= 1
            
            self.voteurs[str(user_id)] = vote_type
            if vote_type == 'positif':
                self.votes_positifs += 1
            else:
                self.votes_negatifs += 1
        
        self.save()
```

## 📁 **apps/notifications/models.py (nouveau)**

```python
from django.db import models
from django.utils import timezone
from apps.accounts.models import User

class Notification(models.Model):
    TYPE_CHOICES = (
        ('systeme', 'Système'),
        ('message', 'Message'),
        ('seance', 'Séance'),
        ('inscription', 'Inscription'),
        ('evaluation', 'Évaluation'),
        ('ressource', 'Ressource'),
        ('forum', 'Forum'),
        ('admin', 'Administratif'),
        ('paiement', 'Paiement'),
    )
    
    destinataire = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    titre = models.CharField(max_length=200)
    message = models.TextField()
    
    # Métadonnées
    donnees_supplementaires = models.JSONField(default=dict, blank=True)
    lien = models.URLField(blank=True)
    
    # Statut
    lue = models.BooleanField(default=False)
    date_lecture = models.DateTimeField(null=True, blank=True)
    
    # Priorité
    priorite = models.CharField(max_length=10, choices=[
        ('basse', 'Basse'),
        ('normale', 'Normale'),
        ('haute', 'Haute'),
        ('urgente', 'Urgente'),
    ], default='normale')
    
    # Planning
    date_envoi = models.DateTimeField(default=timezone.now)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications_notification'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"Notification pour {self.destinataire.get_full_name()}: {self.titre}"
    
    def marquer_comme_lue(self):
        """Marque la notification comme lue"""
        if not self.lue:
            self.lue = True
            self.date_lecture = timezone.now()
            self.save()

class AdminAnnouncement(models.Model):
    """Annonces publiées par les administrateurs"""
    titre = models.CharField(max_length=200)
    contenu = models.TextField()
    
    # Publication
    auteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='annonces_publiees', 
                            limit_choices_to={'role': 'admin'})
    
    # Ciblage
    destinataires = models.JSONField(default=list, blank=True)  # ['tuteur', 'etudiant', 'all']
    matieres = models.JSONField(default=list, blank=True)  # Filtrer par matières
    niveaux = models.JSONField(default=list, blank=True)  # Filtrer par niveaux
    
    # Affichage
    active = models.BooleanField(default=True)
    banniere = models.BooleanField(default=False)  # Afficher en bannière
    couleur = models.CharField(max_length=20, choices=[
        ('info', 'Bleu'),
        ('success', 'Vert'),
        ('warning', 'Orange'),
        ('danger', 'Rouge'),
    ], default='info')
    
    # Planning
    date_publication = models.DateTimeField(default=timezone.now)
    date_expiration = models.DateTimeField(null=True, blank=True)
    
    # Statistiques
    vues = models.PositiveIntegerField(default=0)
    clics = models.PositiveIntegerField(default=0)
    
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notifications_admin_announcement'
        verbose_name = 'Annonce administrative'
        verbose_name_plural = 'Annonces administratives'
        ordering = ['-date_publication']
    
    def __str__(self):
        return f"Annonce: {self.titre}"
    
    def est_valide(self):
        """Vérifie si l'annonce est encore valide"""
        now = timezone.now()
        return self.active and now >= self.date_publication and (
            self.date_expiration is None or now <= self.date_expiration
        )
```
