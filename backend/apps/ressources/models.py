from django.db import models
from apps.accounts.models import User
from apps.tutorat.models import GroupeTutorat
from django.utils import timezone
from cloudinary.models import CloudinaryField  # Importation essentielle pour la gestion des vidéos/médias

# Modèle pour les ressources globales du tableau de bord
class Ressource(models.Model):
    TYPE_CHOICES = (
        ('cours', 'Cours'),
        ('pdf', 'PDF'),
        ('exercice', 'Exercice'),
        ('corrige', 'Corrigé'),
        ('video', 'Vidéo'),
        ('lien', 'Lien'),
        ('image', 'Image'),
    )
    STATUT_CHOICES = (
        ('en_attente', 'En attente'),
        ('publie', 'Publié'),
        ('rejete', 'Rejeté'),
    )
    
    titre = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    auteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ressources_globales')
    matiere = models.CharField(max_length=100, blank=True, db_index=True)
    niveau = models.CharField(max_length=50, blank=True, db_index=True)
    type_fichier = models.CharField(max_length=20, choices=TYPE_CHOICES)
    
    # Remplacement par CloudinaryField pour prendre en charge de manière robuste les vidéos, audios et images
    fichier = CloudinaryField('resource', resource_type='auto', blank=True, null=True)
    
    lien_externe = models.URLField(blank=True)
    tags = models.CharField(max_length=500, blank=True, help_text="Séparés par des virgules")
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente', db_index=True)
    commentaire_rejet = models.TextField(blank=True, null=True, help_text="Motif du rejet de la ressource")
    nb_telechargements = models.PositiveIntegerField(default=0)
    nb_vues = models.PositiveIntegerField(default=0)
    date_publication = models.DateTimeField(auto_now_add=True, db_index=True)
    date_maj = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.titre
    
    class Meta:
        db_table = 'ressources_globales'
        verbose_name = 'Ressource globale'
        verbose_name_plural = 'Ressources globales'
        ordering = ['-date_publication']


class VersionRessource(models.Model):
    ressource = models.ForeignKey('Ressource', on_delete=models.CASCADE, related_name='versions')
    
    # Remplacement par CloudinaryField pour s'assurer que l'historique des versions monte aussi sur Cloudinary
    fichier = CloudinaryField('resource', resource_type='auto')
    
    commentaire = models.TextField(blank=True)
    date_upload = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Version {self.id} de {self.ressource.titre}"


class CommentaireRessource(models.Model):
    ressource = models.ForeignKey('Ressource', on_delete=models.CASCADE, related_name='commentaires')
    auteur = models.ForeignKey(User, on_delete=models.CASCADE)
    contenu = models.TextField()
    date = models.DateTimeField(auto_now_add=True)
    signale = models.BooleanField(default=False)

    def __str__(self):
        return f"Commentaire de {self.auteur} sur {self.ressource.titre[:30]}"


class NoteRessource(models.Model):
    ressource = models.ForeignKey('Ressource', on_delete=models.CASCADE, related_name='notes')
    auteur = models.ForeignKey(User, on_delete=models.CASCADE)
    note = models.PositiveSmallIntegerField()
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('ressource', 'auteur')

    def __str__(self):
        return f"{self.auteur} a noté {self.ressource.titre} : {self.note}/5"


class FavoriRessource(models.Model):
    utilisateur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favoris')
    ressource = models.ForeignKey('Ressource', on_delete=models.CASCADE)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('utilisateur', 'ressource')

    def __str__(self):
        return f"{self.utilisateur} a mis en favori {self.ressource.titre}"


class Signalement(models.Model):
    TYPE_CONTENU_CHOICES = (
        ('ressource', 'Ressource'),
        ('commentaire', 'Commentaire'),
    )
    type_contenu = models.CharField(max_length=20, choices=TYPE_CONTENU_CHOICES)
    id_contenu = models.PositiveIntegerField()
    motif = models.TextField()
    signalant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='signalements')
    date = models.DateTimeField(auto_now_add=True)
    traite = models.BooleanField(default=False)

    def __str__(self):
        return f"Signalement de {self.type_contenu} {self.id_contenu} par {self.signalant}"


class PartageRessource(models.Model):
    STATUT_VALIDATION_CHOICES = (
        ('en_attente', 'En attente de validation'),
        ('validee', 'Validée'),
        ('rejetee', 'Rejetée'),
    )
    
    ressource = models.ForeignKey('Ressource', on_delete=models.CASCADE, related_name='partages')
    expediteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ressources_envoyees')
    destinataire = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ressources_recues')
    date_partage = models.DateTimeField(auto_now_add=True)
    commentaire = models.TextField(blank=True, help_text="Message personnel pour le destinataire")
    statut_validation = models.CharField(
        max_length=20, 
        choices=STATUT_VALIDATION_CHOICES, 
        default='en_attente'
    )
    est_lue = models.BooleanField(default=False)
    date_lecture = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'ressources_partagees'
        verbose_name = 'Partage de ressource'
        verbose_name_plural = 'Partages de ressources'
        ordering = ['-date_partage']
        unique_together = ('ressource', 'destinataire')

    def __str__(self):
        return f"{self.expediteur} → {self.destinataire}: {self.ressource.titre[:30]}"

    def marquer_comme_lue(self):
        if not self.est_lue:
            self.est_lue = True
            self.date_lecture = timezone.now()
            self.save(update_fields=['est_lue', 'date_lecture'])