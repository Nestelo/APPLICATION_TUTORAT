from django.db import models
from apps.accounts.models import User

class Question(models.Model):
    PRIORITE_CHOICES = [
        ('haute', 'Haute'),
        ('moyenne', 'Moyenne'),
        ('basse', 'Basse'),
    ]
    
    titre = models.CharField(max_length=255)
    contenu = models.TextField()
    auteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='questions')
    matiere = models.CharField(max_length=100, blank=True, db_index=True)
    tags = models.CharField(max_length=500, blank=True, help_text="Séparés par des virgules")
    priorite = models.CharField(max_length=10, choices=PRIORITE_CHOICES, default='moyenne', db_index=True)
    est_resolue = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)
    nb_vues = models.PositiveIntegerField(default=0)
    date_publication = models.DateTimeField(auto_now_add=True, db_index=True)
    date_derniere_reponse = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return self.titre

    class Meta:
        ordering = ['-date_publication']

class Reponse(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='reponses')
    auteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reponses')
    contenu = models.TextField()
    est_solution = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)
    nb_votes = models.IntegerField(default=0)  # somme des votes (peut être calculé mais on le stocke pour optimisation)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Réponse de {self.auteur} à {self.question.titre[:30]}"

    class Meta:
        ordering = ['-est_solution', '-nb_votes', 'date']

class VoteReponse(models.Model):
    VOTE_CHOICES = ((1, 'Pour'), (-1, 'Contre'))
    reponse = models.ForeignKey(Reponse, on_delete=models.CASCADE, related_name='votes')
    votant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='votes_forum')
    valeur = models.SmallIntegerField(choices=VOTE_CHOICES)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('reponse', 'votant')

    def __str__(self):
        return f"Vote {self.valeur} de {self.votant} sur réponse {self.reponse.id}"


class ModerationLog(models.Model):
    ACTION_CHOICES = (
        ('delete', 'Delete'),
        ('restore', 'Restore'),
        ('suspend', 'Suspend'),
        ('unsuspend', 'Unsuspend'),
        ('other', 'Other'),
    )
    moderator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='moderation_actions')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    target_type = models.CharField(max_length=20)  # 'question', 'reponse', 'user'
    target_id = models.IntegerField()
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} {self.target_type}#{self.target_id} by {self.moderator}"


class AbonnementQuestion(models.Model):
    """Gestion des abonnements aux questions pour les notifications"""
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='abonnements')
    utilisateur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='abonnements_forum')
    date_abonnement = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('question', 'utilisateur')
        ordering = ['-date_abonnement']
    
    def __str__(self):
        return f"{self.utilisateur} abonné à {self.question.titre[:30]}"


class MessageVocal(models.Model):
    """Messages vocaux dans les réponses du forum"""
    reponse = models.ForeignKey(Reponse, on_delete=models.CASCADE, null=True, blank=True, related_name='messages_vocaux')
    auteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages_vocaux_forum')
    fichier_audio = models.FileField(
        upload_to='messages_vocaux/%Y/%m/',
        help_text="Fichier audio (.3gp, .m4a, .mp3, .wav)"
    )
    duree = models.DurationField(help_text="Durée du message vocal")
    date_envoi = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date_envoi']
    
    def __str__(self):
        return f"Message vocal de {self.auteur.prenom} ({self.duree})"


class NotificationForum(models.Model):
    """Notifications spécifiques au forum"""
    TYPE_CHOICES = (
        ('nouvelle_reponse', 'Nouvelle réponse'),
        ('solution', 'Solution acceptée'),
        ('vocal', 'Message vocal'),
        ('mention', 'Mention'),
        ('abonnement', 'Nouveau message sur question suivie'),
    )
    
    destinataire = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications_forum')
    type_notification = models.CharField(max_length=30, choices=TYPE_CHOICES)
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='notifications_forum')
    message = models.TextField()
    lue = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date_creation']
        indexes = [
            models.Index(fields=['destinataire', 'lue']),
            models.Index(fields=['date_creation']),
        ]
    
    def __str__(self):
        return f"{self.type_notification} pour {self.destinataire.prenom}"