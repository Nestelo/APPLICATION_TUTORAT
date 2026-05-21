from rest_framework import serializers
from .models import Question, Reponse, VoteReponse, ModerationLog, AbonnementQuestion, MessageVocal, NotificationForum
from apps.accounts.serializers import UserSerializer

class ReponseSerializer(serializers.ModelSerializer):
    auteur_details = UserSerializer(source='auteur', read_only=True)
    
    class Meta:
        model = Reponse
        fields = [
            'id', 'question', 'auteur', 'contenu', 'est_solution', 
            'deleted', 'nb_votes', 'date', 'auteur_details'
        ]
        read_only_fields = ['id', 'auteur', 'date', 'nb_votes', 'auteur_details']
        
    def validate_contenu(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Le contenu est obligatoire.")
        return value.strip()

class QuestionSerializer(serializers.ModelSerializer):
    auteur_details = UserSerializer(source='auteur', read_only=True)
    reponses = ReponseSerializer(many=True, read_only=True)
    nb_reponses = serializers.IntegerField(source='reponses.count', read_only=True)
    nb_messages_vocaux = serializers.SerializerMethodField()
    
    class Meta:
        model = Question
        fields = [
            'id', 'titre', 'contenu', 'auteur', 'matiere', 'tags', 'priorite',
            'est_resolue', 'deleted', 'nb_vues', 'date_publication', 
            'date_derniere_reponse', 'auteur_details', 'reponses', 'nb_reponses', 'nb_messages_vocaux'
        ]
        read_only_fields = ['id', 'auteur', 'date_publication', 'nb_vues', 'date_derniere_reponse', 'auteur_details', 'reponses', 'nb_reponses', 'nb_messages_vocaux']
    
    def get_nb_messages_vocaux(self, obj):
        """Calculer le nombre total de messages vocaux pour cette question"""
        from django.db.models import Count
        return MessageVocal.objects.filter(reponse__question=obj).count()
        
    def validate_titre(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Le titre est obligatoire.")
        return value.strip()
    
    def validate_contenu(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Le contenu est obligatoire.")
        return value.strip()

class ModerationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModerationLog
        fields = '__all__'

class VoteReponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoteReponse
        fields = '__all__'

class AbonnementQuestionSerializer(serializers.ModelSerializer):
    utilisateur_details = UserSerializer(source='utilisateur', read_only=True)
    
    class Meta:
        model = AbonnementQuestion
        fields = ['id', 'question', 'utilisateur', 'date_abonnement', 'utilisateur_details']
        read_only_fields = ['id', 'date_abonnement', 'utilisateur_details']

class MessageVocalSerializer(serializers.ModelSerializer):
    auteur_details = UserSerializer(source='auteur', read_only=True)
    
    class Meta:
        model = MessageVocal
        fields = ['id', 'reponse', 'auteur', 'fichier_audio', 'duree', 'date_envoi', 'auteur_details']
        read_only_fields = ['id', 'auteur', 'date_envoi', 'auteur_details']
    
    def validate_reponse(self, value):
        """Valider que la réponse existe et est accessible"""
        if not value:
            raise serializers.ValidationError("La réponse est obligatoire.")
        
        from .models import Reponse
        try:
            reponse = Reponse.objects.get(id=value.id if hasattr(value, 'id') else value)
            return reponse
        except Reponse.DoesNotExist:
            raise serializers.ValidationError("Cette réponse n'existe pas.")
    
    def validate_fichier_audio(self, value):
        """Valider que le fichier audio est fourni"""
        if not value:
            raise serializers.ValidationError("Le fichier audio est obligatoire.")
        return value

class NotificationForumSerializer(serializers.ModelSerializer):
    question_details = QuestionSerializer(source='question', read_only=True)
    
    class Meta:
        model = NotificationForum
        fields = ['id', 'destinataire', 'type_notification', 'question', 'message', 'lue', 'date_creation', 'question_details']
        read_only_fields = ['id', 'date_creation', 'question_details']
    class Meta:
        model = VoteReponse
        fields = ['id', 'reponse', 'votant', 'valeur', 'date']
        read_only_fields = ['id', 'date', 'votant']
        
    def validate_valeur(self, value):
        if value not in [1, -1]:
            raise serializers.ValidationError("Le vote doit être 1 (pour) ou -1 (contre).")
        return value