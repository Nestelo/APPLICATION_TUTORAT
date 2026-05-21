from django.db import models
from apps.accounts.models import User


class Notification(models.Model):
    TYPE_CHOICES = (
        ('demande_seance', 'Demande de séance'),
        ('acceptation_seance', 'Acceptation de séance'),
        ('annulation_seance', 'Annulation de séance'),
        ('message_recu', 'Message reçu'),
        ('reponse_forum', 'Réponse sur le forum'),
        ('validation_ressource', 'Validation de ressource'),
        ('inscription_groupe', 'Inscription à un groupe'),
        ('acceptation_groupe', 'Acceptation dans un groupe'),
        ('rappel_seance', 'Rappel de séance'),
        ('autre', 'Autre'),
    )
    destinataire = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    titre = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    lien = models.CharField(max_length=500, blank=True, help_text="Lien vers la ressource concernée (URL relative ou absolue)")
    est_lue = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_creation']

    def __str__(self):
        return f"{self.titre} - {self.destinataire.email}"


class Announcement(models.Model):
    AUDIENCE_CHOICES = (
        ('all', 'Tous'),
        ('role', 'Rôle'),
        ('users', 'Utilisateurs précis'),
        ('filter', 'Filtre'),
    )
    TYPE_CHOICES = (
        ('demande_seance', 'Demande de séance'),
        ('message', 'Message'),
        ('validation_ressource', 'Validation ressource'),
        ('reponse_forum', 'Réponse forum'),
        ('autre', 'Autre'),
    )

    creator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_announcements')
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    titre = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    lien = models.CharField(max_length=500, blank=True)
    audience_type = models.CharField(max_length=10, choices=AUDIENCE_CHOICES, default='all')
    audience_filter = models.JSONField(null=True, blank=True, help_text='JSON pour rôle/user_ids/filters')
    status = models.CharField(max_length=20, default='draft')
    scheduled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Announcement {self.id} - {self.titre}"


class AnnouncementRecipient(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
    )
    announcement = models.ForeignKey(Announcement, on_delete=models.CASCADE, related_name='recipients')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    delivered_at = models.DateTimeField(null=True, blank=True)
    delivery_status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')

    class Meta:
        unique_together = ('announcement', 'user')

    def __str__(self):
        return f"Ann {self.announcement_id} -> {self.user.email} ({self.delivery_status})"


class DeviceToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='device_tokens')
    token = models.CharField(max_length=500)
    platform = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'token')

    def __str__(self):
        return f"{self.user.email} - {self.platform}"