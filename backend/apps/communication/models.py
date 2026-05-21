from django.db import models
from django.utils import timezone
from apps.accounts.models import User

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
