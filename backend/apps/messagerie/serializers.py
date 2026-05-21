from rest_framework import serializers
from .models import (
    Conversation, ParticipantsConversation, Message, PieceJointeMessage, 
    ReactionMessage, EmailMessage, EmailReponse, AccuseReception
)
from apps.accounts.serializers import UserSerializer


class ParticipantsConversationSerializer(serializers.ModelSerializer):
    """Serializer pour les participants aux conversations"""
    utilisateur_details = UserSerializer(source='utilisateur', read_only=True)
    
    class Meta:
        model = ParticipantsConversation
        fields = ['id', 'utilisateur_details', 'role', 'est_actif', 'a_rejoint', 'a_quitte',
                  'peut_ecrire', 'peut_partager_fichiers', 'peut_inviter',
                  'notifications_activees', 'dernier_message_lu', 'nb_messages_non_lus']
        read_only_fields = ['id', 'a_rejoint']


class PieceJointeMessageSerializer(serializers.ModelSerializer):
    """Serializer pour les pièces jointes des messages"""
    expediteur_details = UserSerializer(source='message.expediteur', read_only=True)
    
    class Meta:
        model = PieceJointeMessage
        fields = ['id', 'message', 'nom_original', 'type_fichier', 'taille', 
                  'vignette', 'date_upload', 'est_virus_scanne', 'est_chiffre']
        read_only_fields = ['id', 'date_upload']


class ReactionMessageSerializer(serializers.ModelSerializer):
    """Serializer pour les réactions aux messages"""
    utilisateur_details = UserSerializer(source='utilisateur', read_only=True)
    
    class Meta:
        model = ReactionMessage
        fields = ['id', 'message', 'utilisateur_details', 'type_reaction', 
                  'emoji_custom', 'date_reaction']
        read_only_fields = ['id', 'date_reaction']


class MessageSerializer(serializers.ModelSerializer):
    """Serializer pour les messages avec fonctionnalités avancées"""
    expediteur_details = UserSerializer(source='expediteur', read_only=True)
    pieces_jointes = PieceJointeMessageSerializer(many=True, read_only=True)
    reactions = ReactionMessageSerializer(many=True, read_only=True)
    reponses = serializers.SerializerMethodField()
    est_modifiable = serializers.SerializerMethodField()
    temps_lecture = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'conversation', 'expediteur_details', 'type_message', 'contenu',
                  'fichier', 'nom_original_fichier', 'type_fichier', 'taille_fichier',
                  'date_envoi', 'date_modification', 'date_suppression',
                  'lu', 'est_edite', 'est_supprime', 'message_parent',
                  'est_forward', 'nb_reactions', 'pieces_jointes', 'reactions',
                  'reponses', 'est_modifiable', 'temps_lecture']
        read_only_fields = ['id', 'date_envoi', 'date_modification', 'date_suppression']
    
    def get_reponses(self, obj):
        """Récupérer les réponses à ce message"""
        reponses = Message.objects.filter(message_parent=obj)
        return MessageSerializer(reponses, many=True).data
    
    def get_est_modifiable(self, obj):
        """Vérifier si le message est modifiable (15 minutes)"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Seul l'auteur peut modifier
            if obj.expediteur != request.user:
                return False
            
            # Dans les 15 minutes
            from datetime import timedelta
            from django.utils import timezone
            if obj.date_envoi < timezone.now() - timedelta(minutes=15):
                return False
            
            return True
        return False
    
    def get_temps_lecture(self, obj):
        """Calculer le temps de lecture estimé"""
        if obj.type_message == 'texte':
            nb_mots = len(obj.contenu.split())
            return f"~{max(1, nb_mots // 200)} min"
        elif obj.fichier:
            return f"Fichier ({obj.taille_fichier} octets)"
        return "1 min"


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer de base pour les conversations"""
    class Meta:
        model = Conversation
        fields = ['id', 'titre', 'description', 'type_conversation', 'statut',
                  'date_creation', 'dernier_message', 'avatar', 'tags',
                  'autoriser_fichiers', 'taille_max_fichier', 'nb_max_participants']
        read_only_fields = ['id', 'date_creation', 'dernier_message']


class ConversationDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour les conversations"""
    participants_details = ParticipantsConversationSerializer(source='participants_details', many=True, read_only=True)
    dernier_message_details = serializers.SerializerMethodField()
    nb_messages_non_lus = serializers.SerializerMethodField()
    autres_participants = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'titre', 'description', 'type_conversation', 'statut',
                  'date_creation', 'dernier_message', 'avatar', 'tags',
                  'autoriser_fichiers', 'taille_max_fichier', 'nb_max_participants',
                  'participants_details', 'dernier_message_details', 'nb_messages_non_lus',
                  'autres_participants']
        read_only_fields = ['id', 'date_creation', 'dernier_message']
    
    def get_dernier_message_details(self, obj):
        """Récupérer les détails du dernier message"""
        dernier_message = obj.messagerie_messages.last()
        if dernier_message:
            return MessageSerializer(dernier_message).data
        return None
    
    def get_nb_messages_non_lus(self, obj):
        """Calculer le nombre de messages non lus pour l'utilisateur courant"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                participant = ParticipantsConversation.objects.get(
                    conversation=obj,
                    utilisateur=request.user
                )
                return participant.nb_messages_non_lus
            except ParticipantsConversation.DoesNotExist:
                return 0
        return 0
    
    def get_autres_participants(self, obj):
        """Récupérer les autres participants (sauf l'utilisateur courant)"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            autres = obj.participants.exclude(id=request.user.id)
            return UserSerializer(autres, many=True).data
        return []


class EmailMessageSerializer(serializers.ModelSerializer):
    """Serializer pour les messages email"""
    expediteur_details = UserSerializer(source='expediteur', read_only=True)
    destinataire_details = UserSerializer(source='destinataire', read_only=True)
    
    class Meta:
        model = EmailMessage
        fields = ['id', 'expediteur_details', 'destinataire_details', 'sujet', 'contenu',
                  'statut', 'date_envoi', 'date_reception', 'date_lecture',
                  'email_id_externe']
        read_only_fields = ['id', 'date_envoi', 'date_reception']


class EmailReponseSerializer(serializers.ModelSerializer):
    """Serializer pour les réponses aux emails"""
    auteur_details = UserSerializer(source='auteur', read_only=True)
    
    class Meta:
        model = EmailReponse
        fields = ['id', 'email_original', 'auteur_details', 'contenu', 'date_envoi']
        read_only_fields = ['id', 'date_envoi']


class AccuseReceptionSerializer(serializers.ModelSerializer):
    """Serializer pour les accusés de réception"""
    class Meta:
        model = AccuseReception
        fields = ['id', 'email', 'type_accus', 'date_accus', 'ip_adresse', 'user_agent']
        read_only_fields = ['id', 'date_accus']