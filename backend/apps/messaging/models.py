from django.db import models
from apps.accounts.models import User

# Importer le modèle GroupeTutorat de l'app tutorat
from apps.tutorat.models import GroupeTutorat

class MembreGroupe(models.Model):
    """Membres d'un groupe de tutorat"""
    groupe = models.ForeignKey(GroupeTutorat, on_delete=models.CASCADE, related_name='membres_messaging')
    etudiant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='groupes_membre_messaging')
    date_ajout = models.DateTimeField(auto_now_add=True)
    est_actif = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('groupe', 'etudiant')

class MessageGroupe(models.Model):
    """Messages dans les groupes de tutorat"""
    groupe = models.ForeignKey(GroupeTutorat, on_delete=models.CASCADE, related_name='messages_messaging')
    auteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages_groupe_messaging')
    contenu = models.TextField()
    type_message = models.CharField(
        max_length=20,
        choices=[
            ('texte', 'Texte'),
            ('fichier', 'Fichier'),
            ('exercice', 'Exercice'),
            ('correction', 'Correction'),
        ],
        default='texte'
    )
    fichier_joint = models.FileField(upload_to='fichiers_groupe/', blank=True, null=True)
    date_envoi = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(blank=True, null=True)
    est_supprime = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['date_envoi']

class FichierGroupe(models.Model):
    """Fichiers partagés dans les groupes"""
    groupe = models.ForeignKey(GroupeTutorat, on_delete=models.CASCADE, related_name='fichiers')
    auteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fichiers_partages')
    titre = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    fichier = models.FileField(upload_to='fichiers_groupe/')
    type_fichier = models.CharField(max_length=50)  # pdf, doc, img, etc.
    taille = models.PositiveIntegerField()  # en octets
    date_ajout = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date_ajout']

class ExerciceGroupe(models.Model):
    """Exercices partagés dans les groupes"""
    groupe = models.ForeignKey(GroupeTutorat, on_delete=models.CASCADE, related_name='exercices')
    auteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exercices_crees')
    titre = models.CharField(max_length=200)
    enonce = models.TextField()
    correction = models.TextField(blank=True)
    difficulte = models.CharField(
        max_length=20,
        choices=[
            ('facile', 'Facile'),
            ('moyen', 'Moyen'),
            ('difficile', 'Difficile'),
        ],
        default='moyen'
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_limite = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-date_creation']

class SessionTutorat(models.Model):
    """Sessions de tutorat en direct"""
    groupe = models.ForeignKey(GroupeTutorat, on_delete=models.CASCADE, related_name='sessions')
    titre = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    date_debut = models.DateTimeField()
    duree_minutes = models.PositiveIntegerField(default=60)
    lien_visio = models.URLField(blank=True)
    statut = models.CharField(
        max_length=20,
        choices=[
            ('planifie', 'Planifiée'),
            ('en_cours', 'En cours'),
            ('terminee', 'Terminée'),
            ('annulee', 'Annulée'),
        ],
        default='planifie'
    )
    participants = models.ManyToManyField(User, related_name='sessions_participees')
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['date_debut']
