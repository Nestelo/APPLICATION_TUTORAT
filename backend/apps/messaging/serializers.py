from rest_framework import serializers
from apps.tutorat.models import GroupeTutorat
from .models import MembreGroupe, MessageGroupe, FichierGroupe, ExerciceGroupe, SessionTutorat
from apps.accounts.serializers import UserSerializer

class MembreGroupeSerializer(serializers.ModelSerializer):
    etudiant_details = UserSerializer(source='etudiant', read_only=True)
    
    class Meta:
        model = MembreGroupe
        fields = ['id', 'etudiant', 'etudiant_details', 'date_ajout', 'est_actif']
        read_only_fields = ['id', 'date_ajout']

class GroupeTutoratSerializer(serializers.ModelSerializer):
    tuteur_details = UserSerializer(source='tuteur', read_only=True)
    membres = MembreGroupeSerializer(many=True, read_only=True)
    nb_membres = serializers.IntegerField(source='membres.count', read_only=True)
    
    class Meta:
        model = GroupeTutorat
        fields = [
            'id', 'nom', 'description', 'tuteur', 'tuteur_details', 'matiere', 'niveau',
            'est_actif', 'date_creation', 'membres', 'nb_membres'
        ]
        read_only_fields = ['id', 'tuteur', 'date_creation', 'membres', 'nb_membres']

class MessageGroupeSerializer(serializers.ModelSerializer):
    auteur_details = UserSerializer(source='auteur', read_only=True)
    
    class Meta:
        model = MessageGroupe
        fields = [
            'id', 'groupe', 'auteur', 'auteur_details', 'contenu', 'type_message',
            'fichier_joint', 'date_envoi', 'modifie_le', 'est_supprime'
        ]
        read_only_fields = ['id', 'auteur', 'date_envoi', 'auteur_details']

class FichierGroupeSerializer(serializers.ModelSerializer):
    auteur_details = UserSerializer(source='auteur', read_only=True)
    
    class Meta:
        model = FichierGroupe
        fields = [
            'id', 'groupe', 'auteur', 'auteur_details', 'titre', 'description',
            'fichier', 'type_fichier', 'taille', 'date_ajout'
        ]
        read_only_fields = ['id', 'auteur', 'date_ajout', 'auteur_details']

class ExerciceGroupeSerializer(serializers.ModelSerializer):
    auteur_details = UserSerializer(source='auteur', read_only=True)
    
    class Meta:
        model = ExerciceGroupe
        fields = [
            'id', 'groupe', 'auteur', 'auteur_details', 'titre', 'enonce',
            'correction', 'difficulte', 'date_creation', 'date_limite'
        ]
        read_only_fields = ['id', 'auteur', 'date_creation', 'auteur_details']

class SessionTutoratSerializer(serializers.ModelSerializer):
    tuteur_details = UserSerializer(source='groupe.tuteur', read_only=True)
    participants_details = UserSerializer(source='participants', many=True, read_only=True)
    nb_participants = serializers.IntegerField(source='participants.count', read_only=True)
    
    class Meta:
        model = SessionTutorat
        fields = [
            'id', 'groupe', 'titre', 'description', 'date_debut', 'duree_minutes',
            'lien_visio', 'statut', 'participants', 'participants_details',
            'nb_participants', 'date_creation', 'tuteur_details'
        ]
        read_only_fields = ['id', 'date_creation', 'participants_details', 'nb_participants', 'tuteur_details']
