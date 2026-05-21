from django.db import models
from apps.accounts.models import User
from django.utils import timezone

class Conversation(models.Model):
    """Conversations entre utilisateurs avec fonctionnalités avancées"""
    TYPE_CHOICES = [
        ('individuelle', 'Individuelle (1-à-1)'),
        ('groupe_etudiants', 'Groupe étudiants'),
        ('groupe_tuteurs', 'Groupe tuteurs'),
        ('support_admin', 'Support administratif'),
        ('tutorat_groupe', 'Groupe tutorat'),
    ]
    
    STATUT_CHOICES = [
        ('active', 'Active'),
        ('archivee', 'Archivée'),
        ('suspendue', 'Suspendue'),
    ]
    
    titre = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    type_conversation = models.CharField(max_length=20, choices=TYPE_CHOICES, default='individuelle')
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='active')
    
    # Participants (compatibilité avec existant)
    participants = models.ManyToManyField(User, related_name='messagerie_conversations', through='ParticipantsConversation')
    
    # Pour conversations de groupe
    avatar = models.ImageField(upload_to='conversation_avatars/', blank=True, null=True)
    tags = models.CharField(max_length=500, blank=True, help_text="Séparés par des virgules")
    
    # Timestamps
    date_creation = models.DateTimeField(auto_now_add=True)
    dernier_message = models.DateTimeField(blank=True, null=True)
    date_archivage = models.DateTimeField(null=True, blank=True)
    
    # Options de conversation
    autoriser_fichiers = models.BooleanField(default=True)
    taille_max_fichier = models.IntegerField(default=52428800)  # 50MB
    nb_max_participants = models.IntegerField(default=10)
    
    def __str__(self):
        if self.titre:
            return f"{self.titre} ({self.get_type_conversation_display()})"
        return f"Conversation {self.id} - {self.participants.count()} participants"
    
    def get_other_participant(self, user):
        """Retourne l'autre participant si la conversation est entre deux personnes."""
        participants = self.participants.exclude(id=user.id)
        return participants.first() if participants.count() == 1 else None

class ParticipantsConversation(models.Model):
    """Participants aux conversations avec rôles et permissions"""
    ROLE_CHOICES = [
        ('admin', 'Administrateur'),
        ('moderateur', 'Modérateur'),
        ('participant', 'Participant'),
        ('observateur', 'Observateur'),
    ]
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='participants_details')
    utilisateur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations_participees')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='participant')
    
    # État du participant
    a_rejoint = models.DateTimeField(auto_now_add=True)
    a_quitte = models.DateTimeField(null=True, blank=True)
    est_actif = models.BooleanField(default=True)
    
    # Permissions
    peut_ecrire = models.BooleanField(default=True)
    peut_partager_fichiers = models.BooleanField(default=True)
    peut_inviter = models.BooleanField(default=False)
    
    # Notifications
    notifications_activees = models.BooleanField(default=True)
    dernier_message_lu = models.DateTimeField(null=True, blank=True)
    nb_messages_non_lus = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ('conversation', 'utilisateur')
        ordering = ['conversation__date_creation', 'a_rejoint']
    
    def __str__(self):
        return f"{self.utilisateur.email} dans {self.conversation.titre or self.conversation.id}"

class Message(models.Model):
    """Messages échangés dans les conversations avec fonctionnalités avancées"""
    TYPE_CHOICES = [
        ('texte', 'Texte'),
        ('image', 'Image'),
        ('document', 'Document'),
        ('audio', 'Audio'),
        ('video', 'Vidéo'),
        ('lien_ressource', 'Lien ressource'),
        ('invitation_seance', 'Invitation séance'),
        ('systeme', 'Message système'),
    ]
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messagerie_messages')
    expediteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messagerie_messages_envoyes')
    
    # Contenu du message
    type_message = models.CharField(max_length=20, choices=TYPE_CHOICES, default='texte')
    contenu = models.TextField()
    
    # Pour les messages multimédias
    fichier = models.FileField(upload_to='messages_fichiers/%Y/%m/', blank=True, null=True)
    nom_original_fichier = models.CharField(max_length=255, blank=True)
    type_fichier = models.CharField(max_length=50, blank=True)
    taille_fichier = models.IntegerField(null=True, blank=True)
    
    # Métadonnées
    date_envoi = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(null=True, blank=True)
    date_suppression = models.DateTimeField(null=True, blank=True)
    
    # État du message (compatibilité avec existant)
    lu = models.BooleanField(default=False)
    est_edite = models.BooleanField(default=False)
    est_supprime = models.BooleanField(default=False)
    
    # Réponses et forwards
    message_parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='reponses')
    est_forward = models.BooleanField(default=False)
    message_original = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='forwards')
    
    # Réactions
    nb_reactions = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['date_envoi']
        indexes = [
            models.Index(fields=['conversation', 'date_envoi']),
            models.Index(fields=['expediteur', 'date_envoi']),
        ]
    
    def __str__(self):
        return f"Message de {self.expediteur.email} dans {self.conversation.titre or self.conversation.id} à {self.date_envoi.strftime('%d/%m/%Y %H:%M')}"

class PieceJointeMessage(models.Model):
    """Pièces jointes des messages"""
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='pieces_jointes')
    fichier = models.FileField(upload_to='messages_pieces_jointes/%Y/%m/')
    nom_original = models.CharField(max_length=255)
    type_fichier = models.CharField(max_length=50)
    taille = models.IntegerField()
    vignette = models.ImageField(upload_to='vignettes/%Y/%m/', blank=True, null=True)
    
    date_upload = models.DateTimeField(auto_now_add=True)
    
    # Sécurité
    est_virus_scanne = models.BooleanField(default=False)
    est_chiffre = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-date_upload']
    
    def __str__(self):
        return f"{self.nom_original} - Message {self.message.id}"

class ReactionMessage(models.Model):
    """Réactions aux messages (emoji)"""
    TYPE_REACTION_CHOICES = [
        ('like', '👍'),
        ('love', '❤️'),
        ('laugh', '😂'),
        ('wow', '😮'),
        ('sad', '😢'),
        ('angry', '😠'),
        ('custom', 'Custom'),
    ]
    
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    utilisateur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reactions_messages')
    type_reaction = models.CharField(max_length=20, choices=TYPE_REACTION_CHOICES)
    emoji_custom = models.CharField(max_length=10, blank=True)  # Pour réactions custom
    
    date_reaction = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('message', 'utilisateur', 'type_reaction')
        ordering = ['-date_reaction']
    
    def __str__(self):
        return f"{self.utilisateur.email} - {self.get_type_reaction_display()}"

# Modèles email simplifiés pour éviter les problèmes d'import
class EmailMessage(models.Model):
    """Messages envoyés par email"""
    STATUT_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('envoye', 'Envoyé'),
        ('echec', 'Échec'),
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
    email_id_externe = models.CharField(max_length=100, blank=True)
    
    class Meta:
        db_table = 'messagerie_email_message'
        ordering = ['-date_envoi']
        indexes = [
            models.Index(fields=['expediteur', 'statut']),
            models.Index(fields=['destinataire', 'statut']),
            models.Index(fields=['date_envoi']),
        ]
    
    def __str__(self):
        return f"Email: {self.sujet} de {self.expediteur.email}"

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
    
    def __str__(self):
        return f"Réponse à: {self.email_original.sujet}"

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
    
    def __str__(self):
        return f"Accusé {self.type_accus} pour: {self.email.sujet}"