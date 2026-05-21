from rest_framework import serializers
from .models import EmailMessage, EmailReponse, AccuseReception
from apps.accounts.serializers import UserSerializer

class EmailMessageSerializer(serializers.ModelSerializer):
    expediteur_info = UserSerializer(source='expediteur', read_only=True)
    destinataire_info = UserSerializer(source='destinataire', read_only=True)

    class Meta:
        model = EmailMessage
        fields = ['id', 'expediteur', 'destinataire', 'expediteur_info', 'destinataire_info',
                  'sujet', 'contenu', 'statut', 'date_envoi', 'date_reception', 
                  'date_lecture', 'email_id_externe']
        read_only_fields = ('id', 'expediteur', 'date_envoi', 'email_id_externe', 'statut', 'date_reception', 'date_lecture')

class EmailReponseSerializer(serializers.ModelSerializer):
    auteur_info = UserSerializer(source='auteur', read_only=True)

    class Meta:
        model = EmailReponse
        fields = ['id', 'email_original', 'auteur', 'auteur_info', 'contenu', 'date_envoi']
        read_only_fields = ('id', 'date_envoi')

class AccuseReceptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccuseReception
        fields = ['id', 'email', 'type_accus', 'date_accus', 'ip_adresse', 'user_agent']