from rest_framework import serializers
from .models import OffreTutorat, GroupeTutorat, InscriptionGroupe, Disponibilite, Seance, Evaluation, InscriptionOffre, Ressource
from apps.accounts.serializers import UserBasicSerializer
from django.utils import timezone

class OffreTutoratSerializer(serializers.ModelSerializer):
    tuteur_details = UserBasicSerializer(source='tuteur', read_only=True)
    admin_validateur_details = UserBasicSerializer(source='admin_validateur', read_only=True)
    niveau_display = serializers.CharField(source='get_niveau_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = OffreTutorat
        fields = '__all__'
        read_only_fields = ['date_creation', 'date_modification', 'vues', 
                          'candidatures', 'sessions_realisees', 'note_moyenne']
        extra_kwargs = {
            'matiere': {'required': False},
            'niveau': {'required': False},
            'titre': {'required': False},
            'tuteur': {'required': False},
            'description': {'required': False},
            'tarif': {'required': False},
            'type': {'required': False},
            'lieu': {'required': False},
            'lien_visio': {'required': False},
            'nombre_places': {'required': False},
            'duree_session': {'required': False},
            'presentiel': {'required': False},
            'en_ligne': {'required': False},
            'est_active': {'required': False},
            'statut_workflow': {'required': False},
        }

class GroupeTutoratSerializer(serializers.ModelSerializer):
    createur_details = serializers.SerializerMethodField()
    offre_details = serializers.SerializerMethodField()
    places_disponibles = serializers.SerializerMethodField()
    inscrit = serializers.SerializerMethodField()
    prochaine_seance = serializers.SerializerMethodField()
    
    class Meta:
        model = GroupeTutorat
        fields = '__all__'
        read_only_fields = ['date_creation', 'nombre_membres', 'nombre_sessions']

    def get_createur_details(self, obj):
        if obj.createur:
            return {
                'id': obj.createur.id,
                'nom': obj.createur.nom,
                'prenom': obj.createur.prenom,
                'email': obj.createur.email
            }
        return None

    def get_offre_details(self, obj):
        if obj.offre:
            return {
                'id': obj.offre.id,
                'matiere': obj.offre.matiere,
                'niveau': obj.offre.niveau
            }
        return None

    def get_places_disponibles(self, obj):
        return max(0, obj.capacite_max - obj.nombre_membres)

    def get_inscrit(self, obj):
        """Vérifier si l'utilisateur connecté est inscrit à ce groupe"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if getattr(request.user, 'role', None) == 'etudiant':
                from .models import InscriptionGroupe
                return InscriptionGroupe.objects.filter(
                    groupe=obj, 
                    etudiant=request.user,
                    statut='accepte'
                ).exists()
        return False

    def get_prochaine_seance(self, obj):
        """Obtenir la prochaine séance du groupe"""
        from .models import Seance
        from django.utils import timezone
        prochaine = Seance.objects.filter(
            groupe=obj,
            date_heure_debut__gte=timezone.now()
        ).order_by('date_heure_debut').first()
        
        if prochaine:
            return {
                'id': prochaine.id,
                'sujet': prochaine.sujet,
                'date_heure_debut': prochaine.date_heure_debut,
                'statut': prochaine.statut
            }
        return None

class InscriptionGroupeSerializer(serializers.ModelSerializer):
    etudiant_details = UserBasicSerializer(source='etudiant', read_only=True)
    groupe_details = GroupeTutoratSerializer(source='groupe', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    class Meta:
        model = InscriptionGroupe
        fields = '__all__'
        read_only_fields = ['date_inscription', 'etudiant', 'statut']

class DisponibiliteSerializer(serializers.ModelSerializer):
    tuteur_details = UserBasicSerializer(source='tuteur', read_only=True)
    jour_display = serializers.CharField(source='get_jour_semaine_display', read_only=True)
    
    class Meta:
        model = Disponibilite
        fields = '__all__'
        read_only_fields = ['created_at']

class SeanceSerializer(serializers.ModelSerializer):
    tuteur_details = UserBasicSerializer(source='tuteur', read_only=True)
    offre_details = OffreTutoratSerializer(source='offre', read_only=True)
    groupe_details = GroupeTutoratSerializer(source='groupe', read_only=True)
    etudiants_details = UserBasicSerializer(source='etudiants', many=True, read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    class Meta:
        model = Seance
        fields = '__all__'
        read_only_fields = ['date_creation', 'date_modification']

class EvaluationSerializer(serializers.ModelSerializer):
    auteur_details = UserBasicSerializer(source='auteur', read_only=True)
    cible_details = UserBasicSerializer(source='cible', read_only=True)
    seance_details = SeanceSerializer(source='seance', read_only=True)
    
    class Meta:
        model = Evaluation
        fields = '__all__'
        read_only_fields = ['date']

class InscriptionOffreSerializer(serializers.ModelSerializer):
    etudiant_details = UserBasicSerializer(source='etudiant', read_only=True)
    offre_details = OffreTutoratSerializer(source='offre', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    class Meta:
        model = InscriptionOffre
        fields = '__all__'
        read_only_fields = ['date_inscription', 'date_reponse']

class RessourceSerializer(serializers.ModelSerializer):
    createur_details = UserBasicSerializer(source='createur', read_only=True)
    admin_validateur_details = UserBasicSerializer(source='admin_validateur', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = Ressource
        fields = '__all__'
        read_only_fields = ['date_creation', 'date_modification', 'telechargements', 'vues']