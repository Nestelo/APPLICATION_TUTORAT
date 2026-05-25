from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email obligatoire')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('etudiant', 'Étudiant'),
        ('tuteur', 'Tuteur'),
        ('enseignant', 'Enseignant'),
        ('admin', 'Administrateur'),
    )
    email = models.EmailField(unique=True)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='etudiant', db_index=True)
    filiere = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    annee = models.CharField(max_length=20, blank=True, null=True, db_index=True)
    bio = models.TextField(blank=True)
    
    # Modification : Utiliser URLField au lieu de ImageField pour Cloudinary
    photo = models.URLField(max_length=500, blank=True, null=True, help_text="URL Cloudinary de la photo de profil")
    
    centres_interet = models.TextField(blank=True, help_text="Pour les étudiants")
    matieres_maitrisees = models.TextField(blank=True, help_text="Pour les tuteurs")
    tarif_horaire = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    justificatif = models.FileField(upload_to='justificatifs/', blank=True, null=True)
    est_actif = models.BooleanField(default=True)
    date_inscription = models.DateTimeField(auto_now_add=True, db_index=True)
    date_derniere_connexion = models.DateTimeField(blank=True, null=True)

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_suspended = models.BooleanField(default=False)
    suspension_until = models.DateTimeField(blank=True, null=True)
    suspension_reason = models.TextField(blank=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nom', 'prenom']

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.email})"

    def get_full_name(self):
        return f"{self.prenom} {self.nom}".strip()

    def get_short_name(self):
        return self.prenom.strip()

    # Champs supplémentaires pour la plateforme tuteur
    telephone = models.CharField(max_length=20, blank=True)
    biographie = models.TextField(blank=True)
    date_naissance = models.DateField(null=True, blank=True)
    derniere_connexion = models.DateTimeField(null=True, blank=True)
    email_verifie = models.BooleanField(default=False)
    telephone_verifie = models.BooleanField(default=False)

    # Champs spécifiques tuteur
    matieres_enseignees = models.JSONField(default=list, blank=True)
    niveau_enseignement = models.CharField(max_length=100, blank=True)
    experience = models.PositiveIntegerField(default=0)
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

    class Meta:
        db_table = 'auth_user'
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    @property
    def is_tuteur(self):
        return self.role in ['tuteur', 'enseignant']

    @property
    def is_etudiant(self):
        return self.role == 'etudiant'

    @property
    def is_admin_user(self):
        return self.role == 'admin'


class SystemSettings(models.Model):
    email_notifications = models.BooleanField(default=True, verbose_name="Notifications email")
    push_notifications = models.BooleanField(default=False, verbose_name="Notifications push")
    auto_backup = models.BooleanField(default=True, verbose_name="Sauvegarde automatique")
    maintenance_mode = models.BooleanField(default=False, verbose_name="Mode maintenance")
    allow_registration = models.BooleanField(default=True, verbose_name="Autoriser les inscriptions")
    require_email_verification = models.BooleanField(default=True, verbose_name="Vérification email requise")
    max_file_size = models.PositiveIntegerField(default=10, help_text="Taille max des fichiers en MB")
    max_users_per_day = models.PositiveIntegerField(default=100, help_text="Nombre max d'inscriptions par jour")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        verbose_name = "Paramètre système"
        verbose_name_plural = "Paramètres système"

    def __str__(self):
        return f"Paramètres système (mis à jour le {self.updated_at.strftime('%d/%m/%Y %H:%M')})"

    @classmethod
    def get_settings(cls):
        settings, created = cls.objects.get_or_create(id=1, defaults={
            'email_notifications': True,
            'push_notifications': False,
            'auto_backup': True,
            'maintenance_mode': False,
            'allow_registration': True,
            'require_email_verification': True,
            'max_file_size': 10,
            'max_users_per_day': 100,
        })
        return settings

    def update_rating(self, new_note):
        total = self.note_moyenne * self.nombre_evaluations + new_note
        self.nombre_evaluations += 1
        self.note_moyenne = total / self.nombre_evaluations
        self.save()


class DemandeTuteur(models.Model):
    STATUT_CHOICES = (
        ('en_attente', 'En attente'),
        ('valide', 'Validé'),
        ('rejete', 'Rejeté'),
    )
    utilisateur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='demandes_tuteur')
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    date_soumission = models.DateTimeField(auto_now_add=True)
    commentaire_admin = models.TextField(blank=True)

    def __str__(self):
        return f"Demande de {self.utilisateur.email} - {self.statut}"


class TutorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='tutor_profile')
    diplomes = models.JSONField(default=list, blank=True)
    competences = models.JSONField(default=list, blank=True)
    langues = models.JSONField(default=list, blank=True)
    methodes_enseignement = models.TextField(blank=True)
    disponibilites_speciales = models.TextField(blank=True)
    zone_geographique = models.CharField(max_length=200, blank=True)
    accepte_en_ligne = models.BooleanField(default=True)
    accepte_presentiel = models.BooleanField(default=False)
    tarif_reduit = models.BooleanField(default=False)
    conditions_reductions = models.TextField(blank=True)
    
    total_sessions = models.PositiveIntegerField(default=0)
    total_etudiants = models.PositiveIntegerField(default=0)
    taux_reponse = models.FloatField(default=0.0)
    taux_completion = models.FloatField(default=0.0)
    temps_moyen_reponse = models.DurationField(null=True, blank=True)
    performance_matieres = models.JSONField(default=dict, blank=True)
    points = models.IntegerField(default=0)
    badge_solutions = models.IntegerField(default=0)
    badge_aide = models.IntegerField(default=0)
    badge_expert = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Profil de {self.user.get_full_name()}"
    
    def update_performance_stats(self):
        from apps.tutorat.models import Seance, Evaluation
        
        self.total_sessions = Seance.objects.filter(tuteur=self.user, statut='terminee').count()
        self.total_etudiants = Seance.objects.filter(
            tuteur=self.user, 
            statut='terminee'
        ).values('etudiants').distinct().count()
        
        try:
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
        except:
            pass
        
        self.save()


class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    preferences_apprentissage = models.JSONField(default=list, blank=True)
    difficultes = models.JSONField(default=list, blank=True)
    objectifs_specifiques = models.TextField(blank=True)
    disponibilites_etudiant = models.JSONField(default=list, blank=True)
    budget_mensuel = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    preferences_horaires = models.JSONField(default=dict, blank=True)
    sessions_suivies = models.PositiveIntegerField(default=0)
    temps_apprentissage = models.DurationField(null=True, blank=True)
    matieres_etudiees = models.JSONField(default=list, blank=True)
    progression_globale = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Profil étudiant de {self.user.get_full_name()}"