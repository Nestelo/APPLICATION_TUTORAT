from rest_framework import serializers
from .models import Ressource, VersionRessource, CommentaireRessource, NoteRessource, FavoriRessource, Signalement, PartageRessource
from apps.accounts.serializers import UserSerializer

class VersionRessourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = VersionRessource
        fields = '__all__'
        read_only_fields = ['date_upload']

class CommentaireRessourceSerializer(serializers.ModelSerializer):
    auteur_details = UserSerializer(source='auteur', read_only=True)
    class Meta:
        model = CommentaireRessource
        fields = '__all__'
        read_only_fields = ['date']

class NoteRessourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NoteRessource
        fields = '__all__'
        read_only_fields = ['date']

class FavoriRessourceSerializer(serializers.ModelSerializer):
    ressource_details = serializers.SerializerMethodField()
    class Meta:
        model = FavoriRessource
        fields = '__all__'
        read_only_fields = ['date']

    def get_ressource_details(self, obj):
        from .serializers import RessourceSerializer  # éviter import circulaire
        return RessourceSerializer(obj.ressource).data

class SignalementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Signalement
        fields = '__all__'
        read_only_fields = ['date', 'traite']

class GroupeRessourceSerializer(serializers.ModelSerializer):
    createur_details = UserSerializer(source='createur', read_only=True)
    admin_validateur_details = UserSerializer(source='admin_validateur', read_only=True)
    moyenne_notes = serializers.SerializerMethodField()
    type_display = serializers.SerializerMethodField()
    fichier_url = serializers.SerializerMethodField()

    class Meta:
        from apps.tutorat.models import Ressource as TutoratRessource
        model = TutoratRessource
        fields = ['id', 'titre', 'description', 'createur', 'createur_details', 'admin_validateur', 'admin_validateur_details', 'type', 'type_display', 'fichier', 'fichier_url', 'lien', 'contenu_texte', 'matiere', 'niveau', 'tags', 'publique', 'groupes_partages', 'validee_par_admin', 'date_validation', 'telechargements', 'vues', 'notes', 'moyenne_notes', 'date_creation', 'date_modification']
        read_only_fields = ['date_creation', 'date_modification', 'telechargements', 'vues']

    def get_type_display(self, obj):
        """Retourner le libellé du type"""
        type_choices = {
            'cours': 'Cours',
            'exercice': 'Exercice',
            'video': 'Vidéo',
            'document': 'Document',
            'quiz': 'Quiz',
            'lien': 'Lien utile',
        }
        return type_choices.get(obj.type, obj.type)

    def get_moyenne_notes(self, obj):
        """Calculer la moyenne des notes"""
        if obj.notes and len(obj.notes) > 0:
            return sum(obj.notes) / len(obj.notes)
        return 0.0

    def get_fichier_url(self, obj):
        """Retourner l'URL complète du fichier"""
        if obj.fichier:
            request = self.context.get('request')
            if request and hasattr(request, 'build_absolute_uri'):
                try:
                    return request.build_absolute_uri(obj.fichier.url)
                except:
                    # En cas d'erreur avec le host, retourner l'URL relative
                    return obj.fichier.url
            return obj.fichier.url
        return None

class RessourceSerializer(serializers.ModelSerializer):
    auteur_details = UserSerializer(source='auteur', read_only=True)
    commentaires = CommentaireRessourceSerializer(many=True, read_only=True)
    notes = NoteRessourceSerializer(many=True, read_only=True)
    moyenne_notes = serializers.SerializerMethodField()
    nb_commentaires = serializers.IntegerField(source='commentaires.count', read_only=True)
    est_favori = serializers.SerializerMethodField()
    type_display = serializers.CharField(source='get_type_fichier_display', read_only=True)

    class Meta:
        model = Ressource
        fields = '__all__'
        read_only_fields = ['date_publication', 'date_maj', 'nb_telechargements', 'nb_vues', 'auteur']

    def get_moyenne_notes(self, obj):
        notes = obj.notes.all()
        if notes:
            return sum(n.note for n in notes) / len(notes)
        return None

    def get_est_favori(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return FavoriRessource.objects.filter(utilisateur=request.user, ressource=obj).exists()
        return False

class PartageRessourceSerializer(serializers.ModelSerializer):
    """Serializer pour le partage de ressources entre étudiants"""
    expediteur_details = UserSerializer(source='expediteur', read_only=True)
    destinataire_details = UserSerializer(source='destinataire', read_only=True)
    ressource_details = RessourceSerializer(source='ressource', read_only=True)
    
    class Meta:
        model = PartageRessource
        fields = [
            'id', 'ressource', 'ressource_details', 'expediteur', 'expediteur_details',
            'destinataire', 'destinataire_details', 'date_partage', 'commentaire',
            'statut_validation', 'est_lue', 'date_lecture'
        ]
        read_only_fields = ['expediteur', 'date_partage', 'date_lecture']

class PartageRessourceCreateSerializer(serializers.ModelSerializer):
    """Serializer pour créer un partage de ressource"""
    class Meta:
        model = PartageRessource
        fields = ['ressource', 'destinataire', 'commentaire']
    
    def validate(self, data):
        """Validation pour éviter les doublons"""
        user = self.context['request'].user
        ressource = data['ressource']
        destinataire = data['destinataire']
        
        # Vérifier si le partage existe déjà
        if PartageRessource.objects.filter(
            ressource=ressource,
            destinataire=destinataire
        ).exists():
            raise serializers.ValidationError(
                "Cette ressource a déjà été partagée avec cet étudiant"
            )
        
        # Empêcher l'auto-partage
        if user == destinataire:
            raise serializers.ValidationError(
                "Vous ne pouvez pas partager une ressource avec vous-même"
            )
        
        return data