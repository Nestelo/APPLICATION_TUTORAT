from rest_framework import serializers
from .models import Question, Reponse, VoteReponse
from .models_extended import BadgeTuteur, ClassementTuteur, StatistiquesTuteur, ReponseEtendue, PieceJointeReponse
from apps.accounts.serializers import UserSerializer


class PieceJointeReponseSerializer(serializers.ModelSerializer):
    """Serializer pour les pièces jointes des réponses"""
    class Meta:
        model = PieceJointeReponse
        fields = ['id', 'nom_original', 'type_fichier', 'taille', 'date_upload', 'fichier']
        read_only_fields = ['id', 'date_upload']


class ReponseEtendueSerializer(serializers.ModelSerializer):
    """Serializer pour les réponses étendues"""
    auteur_modification_details = UserSerializer(source='auteur_modification', read_only=True)
    pieces_jointes = PieceJointeReponseSerializer(many=True, read_only=True)
    
    class Meta:
        model = ReponseEtendue
        fields = ['id', 'auteur_modification_details', 'raison_modification', 'date_modification', 
                  'nb_signalements', 'est_signalee', 'pieces_jointes']
        read_only_fields = ['id', 'date_modification', 'nb_signalements']


class ReponseExtendedSerializer(serializers.ModelSerializer):
    """Serializer étendu pour les réponses du forum"""
    auteur_details = UserSerializer(source='auteur', read_only=True)
    etendue = ReponseEtendueSerializer(read_only=True)
    pieces_jointes = PieceJointeReponseSerializer(many=True, read_only=True)
    
    # Champs calculés
    nb_votes_positifs = serializers.SerializerMethodField()
    nb_votes_negatifs = serializers.SerializerMethodField()
    temps_lecture = serializers.SerializerMethodField()
    
    class Meta:
        model = Reponse
        fields = ['id', 'question', 'auteur_details', 'contenu', 'est_solution', 'nb_votes', 
                  'date', 'etendue', 'pieces_jointes', 'nb_votes_positifs', 'nb_votes_negatifs', 'temps_lecture']
        read_only_fields = ['id', 'date', 'nb_votes']
    
    def get_nb_votes_positifs(self, obj):
        return VoteReponse.objects.filter(reponse=obj, valeur=1).count()
    
    def get_nb_votes_negatifs(self, obj):
        return VoteReponse.objects.filter(reponse=obj, valeur=-1).count()
    
    def get_temps_lecture(self, obj):
        """Temps de lecture estimé"""
        nb_mots = len(obj.contenu.split())
        return f"~{max(1, nb_mots // 200)} min"


class QuestionExtendedSerializer(serializers.ModelSerializer):
    """Serializer étendu pour les questions du forum"""
    auteur_details = UserSerializer(source='auteur', read_only=True)
    reponses = ReponseExtendedSerializer(many=True, read_only=True)
    reponse_count = serializers.IntegerField(source='reponses.count', read_only=True)
    
    # Champs calculés pour les tuteurs
    est_dans_specialite = serializers.SerializerMethodField()
    priorite = serializers.SerializerMethodField()
    nb_tuteurs_disponibles = serializers.SerializerMethodField()
    
    class Meta:
        model = Question
        fields = ['id', 'titre', 'contenu', 'auteur_details', 'matiere', 'tags', 'est_resolue', 
                  'nb_vues', 'date_publication', 'date_derniere_reponse', 'reponses', 'reponse_count',
                  'est_dans_specialite', 'priorite', 'nb_tuteurs_disponibles']
        read_only_fields = ['id', 'date_publication', 'nb_vues', 'date_derniere_reponse']
    
    def get_est_dans_specialite(self, obj):
        """Vérifie si la question est dans les spécialités du tuteur connecté"""
        request = self.context.get('request')
        if request and request.user.role in ['tuteur', 'enseignant']:
            matieres_tuteur = request.user.matieres_maitrisees or []
            return obj.matiere in matieres_tuteur
        return False
    
    def get_priorite(self, obj):
        """Calculer la priorité pour le tuteur"""
        request = self.context.get('request')
        if request and request.user.role in ['tuteur', 'enseignant']:
            matieres_tuteur = request.user.matieres_maitrisees or []
            if obj.matiere in matieres_tuteur:
                if not obj.reponses.exists():
                    return 'haute'  # Non répondue dans sa spécialité
                return 'moyenne'  # Dans sa spécialité
            return 'basse'  # Hors spécialité
        return 'normale'
    
    def get_nb_tuteurs_disponibles(self, obj):
        """Nombre de tuteurs disponibles pour cette question"""
        from apps.accounts.models import User
        return User.objects.filter(
            role__in=['tuteur', 'enseignant'],
            is_active=True,
            matieres_maitrisees__contains=obj.matiere
        ).count()


class BadgeTuteurSerializer(serializers.ModelSerializer):
    """Serializer pour les badges des tuteurs"""
    tuteur_details = UserSerializer(source='tuteur', read_only=True)
    
    class Meta:
        model = BadgeTuteur
        fields = ['id', 'tuteur_details', 'nom_badge', 'description', 'date_obtention', 'points']
        read_only_fields = ['id', 'date_obtention']


class ClassementTuteurSerializer(serializers.ModelSerializer):
    """Serializer pour le classement des tuteurs"""
    tuteur_details = UserSerializer(source='tuteur', read_only=True)
    
    # Champs calculés
    progression = serializers.SerializerMethodField()
    niveau = serializers.SerializerMethodField()
    etoiles = serializers.SerializerMethodField()
    
    class Meta:
        model = ClassementTuteur
        fields = ['id', 'tuteur_details', 'score_total', 'position', 'nb_etoiles_total', 
                  'mois', 'nb_reponses', 'nb_solutions', 'nb_votes_recus', 
                  'satisfaction_moyenne', 'progression', 'niveau', 'etoiles']
        read_only_fields = ['id', 'position', 'score_total']
    
    def get_progression(self, obj):
        """Calculer la progression par rapport au mois précédent"""
        try:
            mois_precedent = obj.mois.replace(day=1) - timedelta(days=1)
            classement_precedent = ClassementTuteur.objects.get(
                tuteur=obj.tuteur,
                mois=mois_precedent
            )
            progression = ((obj.score_total - classement_precedent.score_total) / 
                         (classement_precedent.score_total or 1)) * 100
            return round(progression, 1)
        except ClassementTuteur.DoesNotExist:
            return 100.0  # Premier mois
    
    def get_niveau(self, obj):
        """Calculer le niveau du tuteur"""
        # Niveau basé sur le score total
        if obj.score_total >= 1000:
            return "Expert"
        elif obj.score_total >= 500:
            return "Avancé"
        elif obj.score_total >= 200:
            return "Intermédiaire"
        elif obj.score_total >= 50:
            return "Débutant"
        return "Novice"
    
    def get_etoiles(self, obj):
        """Calculer le nombre d'étoiles"""
        # 1 étoile = 100 points
        return min(5, obj.score_total // 100)


class StatistiquesTuteurSerializer(serializers.ModelSerializer):
    """Serializer pour les statistiques des tuteurs"""
    tuteur_details = UserSerializer(source='tuteur', read_only=True)
    
    # Champs calculés
    taux_reussite = serializers.SerializerMethodField()
    score_mensuel = serializers.SerializerMethodField()
    
    class Meta:
        model = StatistiquesTuteur
        fields = ['id', 'tuteur_details', 'mois', 'nb_seances', 'nb_etudiants_uniques', 
                  'nb_ressources', 'nb_reponses_forum', 'note_moyenne', 'satisfaction_moyenne', 
                  'taux_completion', 'date_calcul', 'taux_reussite', 'score_mensuel']
        read_only_fields = ['id', 'date_calcul']
    
    def get_taux_reussite(self, obj):
        """Calculer le taux de réussite"""
        if obj.nb_reponses_forum > 0:
            return round((obj.nb_solutions or 0) / obj.nb_reponses_forum * 100, 1)
        return 0.0
    
    def get_score_mensuel(self, obj):
        """Calculer le score mensuel basé sur les statistiques"""
        score = 0
        score += obj.nb_reponses_forum * 10  # 10 points par réponse
        score += (obj.nb_solutions or 0) * 50  # 50 points par solution
        score += obj.nb_ressources * 20  # 20 points par ressource
        score += obj.nb_seances * 15  # 15 points par séance
        return score
