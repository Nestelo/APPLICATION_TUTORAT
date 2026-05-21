from django.db import models
from django.contrib.auth import get_user_model
from apps.accounts.models import User

User = get_user_model()

class EmailMessage(models.Model):
    """Messages envoyés par email"""
    STATUT_CHOICES = [
        ('envoye', 'Envoyé'),
        ('recu', 'Reçu'),
        ('lu', 'Lu'),
        ('repondu', 'Répondu'),
    ]
    
    expediteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='emails_envoyes')
    destinataire = models.ForeignKey(User, on_delete=models.CASCADE, related_name='emails_recus')
    sujet = models.CharField(max_length=200)
    contenu = models.TextField()
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='envoye')
    date_envoi = models.DateTimeField(auto_now_add=True)
    date_reception = models.DateTimeField(null=True, blank=True)
    date_lecture = models.DateTimeField(null=True, blank=True)
    email_id_externe = models.CharField(max_length=100, blank=True)  # ID du service email externe
    
    class Meta:
        db_table = 'messagerie_email_message'
        ordering = ['-date_envoi']
        indexes = [
            models.Index(fields=['expediteur', 'statut']),
            models.Index(fields=['destinataire', 'statut']),
            models.Index(fields=['date_envoi']),
        ]

class EmailReponse(models.Model):
    """Réponses aux emails"""
    email_original = models.ForeignKey(EmailMessage, on_delete=models.CASCADE, related_name='reponses')
    auteur = models.ForeignKey(User, on_delete=models.CASCADE)
    contenu = models.TextField()
    date_envoi = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'messagerie_email_reponse'
        ordering = ['date_envoi']
        indexes = [
            models.Index(fields=['email_original', 'date_envoi']),
        ]

class AccuseReception(models.Model):
    """Accusés de réception automatiques"""
    email = models.ForeignKey(EmailMessage, on_delete=models.CASCADE, related_name='accuses')
    type_accus = models.CharField(max_length=20, choices=[
        ('envoi', 'Confirmation envoi'),
        ('reception', 'Confirmation réception'),
        ('lecture', 'Confirmation lecture'),
    ])
    date_accus = models.DateTimeField(auto_now_add=True)
    ip_adresse = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        db_table = 'messagerie_accuse_reception'
        ordering = ['-date_accus']
        indexes = [
            models.Index(fields=['email', 'type_accus']),
        ]
