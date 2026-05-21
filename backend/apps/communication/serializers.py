from rest_framework import serializers
from apps.accounts.serializers import UserBasicSerializer
from .models import Conversation, Message, ForumQuestion, ForumReponse

class ConversationSerializer(serializers.ModelSerializer):
    """Serializer pour les conversations"""
    participants = UserBasicSerializer(many=True, read_only=True)
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True
    )
    createur = UserBasicSerializer(read_only=True)
    createur_id = serializers.IntegerField(write_only=True)
    groupe_associe = serializers.SerializerMethodField()
    nombre_non_lus_current = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'titre', 'type', 'participants', 'participant_ids',
                 'createur', 'createur_id', 'groupe_associe', 'dernier_message',
                 'nombre_messages', 'nombre_non_lus', 'nombre_non_lus_current',
                 'date_creation']
        read_only_fields = ['id', 'dernier_message', 'nombre_messages',
                          'nombre_non_lus', 'date_creation']
    
    def get_groupe_associe(self, obj):
        if obj.groupe_associe:
            from apps.tutorat.serializers import GroupeTutoratSerializer
            return GroupeTutoratSerializer(obj.groupe_associe).data
        return None
    
    def get_nombre_non_lus_current(self, obj):
        """Retourne le nombre de messages non lus pour l'utilisateur courant"""
        request = self.context.get('request')
        if request and request.user:
            return obj.nombre_non_lus.get(str(request.user.id), 0)
        return 0

class MessageSerializer(serializers.ModelSerializer):
    """Serializer pour les messages"""
    expediteur = UserBasicSerializer(read_only=True)
    expediteur_id = serializers.IntegerField(write_only=True)
    reponse_a = serializers.SerializerMethodField()
    reponses = serializers.SerializerMethodField()
    est_lu = serializers.SerializerMethodField()
    peut_supprimer = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'conversation', 'expediteur', 'expediteur_id',
                 'type', 'contenu', 'fichier', 'lu_par', 'date_envoi',
                 'date_modification', 'supprime_par', 'reponse_a', 'reponses',
                 'est_lu', 'peut_supprimer']
        read_only_fields = ['id', 'lu_par', 'date_envoi', 'date_modification',
                          'supprime_par']
    
    def get_reponse_a(self, obj):
        if obj.reponse_a:
            return MessageSerializer(obj.reponse_a, context=self.context).data
        return None
    
    def get_reponses(self, obj):
        reponses = obj.reponses.all()
        return MessageSerializer(reponses, many=True, context=self.context).data
    
    def get_est_lu(self, obj):
        """Vérifie si le message est lu par l'utilisateur courant"""
        request = self.context.get('request')
        if request and request.user:
            return str(request.user.id) in obj.lu_par
        return False
    
    def get_peut_supprimer(self, obj):
        """Vérifie si l'utilisateur peut supprimer le message"""
        request = self.context.get('request')
        if request and request.user:
            return obj.expediteur == request.user
        return False

class ForumQuestionSerializer(serializers.ModelSerializer):
    """Serializer pour les questions du forum"""
    auteur = UserBasicSerializer(read_only=True)
    auteur_id = serializers.IntegerField(write_only=True)
    categorie_display = serializers.CharField(source='get_categorie_display', read_only=True)
    nombre_reponses_affiche = serializers.SerializerMethodField()
    
    class Meta:
        model = ForumQuestion
        fields = ['id', 'titre', 'contenu', 'categorie', 'categorie_display',
                 'auteur', 'auteur_id', 'matiere', 'niveau', 'fichiers',
                 'vues', 'nombre_reponses', 'nombre_reponses_affiche',
                 'resolu', 'date_resolution', 'meilleure_reponse',
                 'date_creation', 'date_modification']
        read_only_fields = ['id', 'vues', 'nombre_reponses', 'date_resolution',
                          'meilleure_reponse', 'date_creation', 'date_modification']
    
    def get_nombre_reponses_affiche(self, obj):
        """Retourne le nombre de réponses affichées (non supprimées)"""
        return obj.reponses.count()

class ForumReponseSerializer(serializers.ModelSerializer):
    """Serializer pour les réponses du forum"""
    question = ForumQuestionSerializer(read_only=True)
    question_id = serializers.IntegerField(write_only=True)
    auteur = UserBasicSerializer(read_only=True)
    auteur_id = serializers.IntegerField(write_only=True)
    vote_de_lutilisateur = serializers.SerializerMethodField()
    score_total = serializers.SerializerMethodField()
    
    class Meta:
        model = ForumReponse
        fields = ['id', 'question', 'question_id', 'auteur', 'auteur_id',
                 'contenu', 'fichiers', 'votes_positifs', 'votes_negatifs',
                 'voteurs', 'vote_de_lutilisateur', 'score_total',
                 'est_meilleure_reponse', 'date_meilleure_reponse',
                 'date_creation', 'date_modification']
        read_only_fields = ['id', 'votes_positifs', 'votes_negatifs', 'voteurs',
                          'est_meilleure_reponse', 'date_meilleure_reponse',
                          'date_creation', 'date_modification']
    
    def get_vote_de_lutilisateur(self, obj):
        """Retourne le vote de l'utilisateur courant"""
        request = self.context.get('request')
        if request and request.user:
            return obj.voteurs.get(str(request.user.id))
        return None
    
    def get_score_total(self, obj):
        """Calcule le score total (positifs - négatifs)"""
        return obj.votes_positifs - obj.votes_negatifs

class ForumQuestionDetailSerializer(ForumQuestionSerializer):
    """Serializer détaillé pour les questions avec réponses"""
    reponses = ForumReponseSerializer(many=True, read_only=True)
    
    class Meta(ForumQuestionSerializer.Meta):
        fields = ForumQuestionSerializer.Meta.fields + ['reponses']

class ConversationDetailSerializer(ConversationSerializer):
    """Serializer détaillé pour les conversations avec messages"""
    messages = MessageSerializer(many=True, read_only=True)
    
    class Meta(ConversationSerializer.Meta):
        fields = ConversationSerializer.Meta.fields + ['messages']
