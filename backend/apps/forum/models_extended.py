from django.db import models
from apps.accounts.models import User
from django.utils import timezone
from datetime import timedelta

# Extension des modèles existants
class BadgeTuteur(models.Model):
    """Badges obtenus par les tuteurs"""
    tuteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='badges')
    nom_badge = models.CharField(max_length=100)
    description = models.TextField()
    date_obtention = models.DateTimeField(auto_now_add=True)
    points = models.IntegerField(default=0)  # Points associés au badge
    
    class Meta:
        unique_together = ('tuteur', 'nom_badge')
        ordering = ['-date_obtention']
    
    def __str__(self):
        return f"{self.tuteur.email} - {self.nom_badge}"

class ClassementTuteur(models.Model):
    """Classement des tuteurs les plus actifs"""
    tuteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='classements')
    score_total = models.IntegerField(default=0)
    position = models.IntegerField()
    nb_etoiles_total = models.IntegerField(default=0)
    mois = models.DateField()
    
    # Statistiques détaillées
    nb_reponses = models.IntegerField(default=0)
    nb_solutions = models.IntegerField(default=0)
    nb_votes_recus = models.IntegerField(default=0)
    satisfaction_moyenne = models.DecimalField(max_digits=3, decimal_places=2, null=True)
    
    class Meta:
        unique_together = ('tuteur', 'mois')
        ordering = ['-mois', 'position']
    
    def __str__(self):
        return f"{self.tuteur.email} - {self.position}ème ({self.mois})"

class StatistiquesTuteur(models.Model):
    """Statistiques détaillées des tuteurs"""
    tuteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='statistiques')
    mois = models.DateField()
    nb_seances = models.IntegerField(default=0)
    nb_etudiants_uniques = models.IntegerField(default=0)
    nb_ressources = models.IntegerField(default=0)
    nb_reponses_forum = models.IntegerField(default=0)
    note_moyenne = models.DecimalField(max_digits=3, decimal_places=2, null=True)
    satisfaction_moyenne = models.DecimalField(max_digits=3, decimal_places=2, null=True)
    taux_completion = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    date_calcul = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('tuteur', 'mois')
        ordering = ['-mois']
    
    def __str__(self):
        return f"Stats {self.tuteur.email} - {self.mois}"

# Extension du modèle Reponse existant
class ReponseEtendue(models.Model):
    """Extension du modèle Reponse pour les fonctionnalités avancées"""
    reponse_original = models.OneToOneField('forum.Reponse', on_delete=models.CASCADE, related_name='etendue')
    auteur_modification = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reponses_modifiees')
    raison_modification = models.TextField(blank=True)
    date_modification = models.DateTimeField(null=True, blank=True)
    
    # Statistiques de la réponse
    nb_signalements = models.IntegerField(default=0)
    est_signalee = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-reponse_original__date']
    
    def __str__(self):
        return f"Extension réponse {self.reponse_original.id}"

class PieceJointeReponse(models.Model):
    """Pièces jointes pour les réponses du forum"""
    reponse = models.ForeignKey('forum.Reponse', on_delete=models.CASCADE, related_name='pieces_jointes')
    fichier = models.FileField(upload_to='forum_pieces_jointes/%Y/%m/')
    nom_original = models.CharField(max_length=255)
    type_fichier = models.CharField(max_length=50)
    taille = models.IntegerField()
    date_upload = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date_upload']
    
    def __str__(self):
        return f"{self.nom_original} - {self.reponse.id}"
