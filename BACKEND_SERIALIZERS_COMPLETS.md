# 🔄 **BACKEND SERIALIZERS COMPLETS**

## 📁 **apps/accounts/serializers.py (étendu)**

```python
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import TutorProfile, StudentProfile

User = get_user_model()

class UserBasicSerializer(serializers.ModelSerializer):
    """Serializer basique pour les informations publiques"""
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'prenom', 'nom', 'full_name', 
                 'role', 'photo', 'note_moyenne', 'nombre_evaluations', 'certifie']

class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour les profils complets"""
    full_name = serializers.ReadOnlyField()
    is_tuteur = serializers.ReadOnlyField()
    is_etudiant = serializers.ReadOnlyField()
    is_admin_user = serializers.ReadOnlyField()
    age = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'prenom', 'nom', 'full_name',
                 'role', 'statut', 'telephone', 'photo', 'biographie',
                 'date_naissance', 'date_inscription', 'derniere_connexion',
                 'email_verifie', 'telephone_verifie', 'age', 'is_tuteur',
                 'is_etudiant', 'is_admin_user', 'matieres_enseignees',
                 'niveau_enseignement', 'experience', 'tarif_horaire',
                 'disponible', 'note_moyenne', 'nombre_evaluations',
                 'niveau_etudes', 'etablissement', 'objectifs_apprentissage',
                 'badges', 'certifie', 'date_certification']
        read_only_fields = ['id', 'username', 'email', 'date_inscription', 
                          'note_moyenne', 'nombre_evaluations', 'certifie', 
                          'date_certification']
    
    def get_age(self, obj):
        if obj.date_naissance:
            from datetime import date
            today = date.today()
            return today.year - obj.date_naissance.year - (
                (today.month, today.day) < (obj.date_naissance.month, obj.date_naissance.day)
            )
        return None

class TutorProfileSerializer(serializers.ModelSerializer):
    """Serializer pour le profil détaillé du tuteur"""
    user = UserBasicSerializer(read_only=True)
    performance_matieres_display = serializers.SerializerMethodField()
    
    class Meta:
        model = TutorProfile
        fields = ['id', 'user', 'diplomes', 'competences', 'langues',
                 'methodes_enseignement', 'disponibilites_speciales',
                 'zone_geographique', 'accepte_en_ligne', 'accepte_presentiel',
                 'tarif_reduit', 'conditions_reductions', 'total_sessions',
                 'total_etudiants', 'taux_reponse', 'taux_completion',
                 'temps_moyen_reponse', 'performance_matieres_display']
        read_only_fields = ['total_sessions', 'total_etudiants', 'taux_reponse',
                          'taux_completion', 'temps_moyen_reponse']
    
    def get_performance_matieres_display(self, obj):
        """Formate les performances par matière pour l'affichage"""
        return obj.performance_matieres

class StudentProfileSerializer(serializers.ModelSerializer):
    """Serializer pour le profil détaillé de l'étudiant"""
    user = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = StudentProfile
        fields = ['id', 'user', 'preferences_apprentissage', 'difficultes',
                 'objectifs_specifiques', 'disponibilites_etudiant',
                 'budget_mensuel', 'preferences_horaires', 'sessions_suivies',
                 'temps_apprentissage', 'matieres_etudiees', 'progression_globale']
        read_only_fields = ['sessions_suivies', 'temps_apprentissage',
                          'matieres_etudiees', 'progression_globale']

class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer pour l'inscription des utilisateurs"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm',
                 'prenom', 'nom', 'role', 'telephone', 'date_naissance']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # Créer les profils associés
        if user.is_tuteur:
            TutorProfile.objects.create(user=user)
        elif user.is_etudiant:
            StudentProfile.objects.create(user=user)
        
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour du profil utilisateur"""
    class Meta:
        model = User
        fields = ['prenom', 'nom', 'telephone', 'photo', 'biographie',
                 'date_naissance', 'matieres_enseignees', 'niveau_enseignement',
                 'experience', 'tarif_horaire', 'disponible',
                 'niveau_etudes', 'etablissement', 'objectifs_apprentissage']
    
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
```

## 📁 **apps/tutorat/serializers.py (complet)**

```python
from rest_framework import serializers
from django.utils import timezone
from apps.accounts.serializers import UserBasicSerializer, UserDetailSerializer
from .models import (
    OffreTutorat, InscriptionOffre, GroupeTutorat, InscriptionGroupe,
    Disponibilite, Seance, Evaluation, Ressource
)

class OffreTutoratSerializer(serializers.ModelSerializer):
    """Serializer pour les offres de tutorat"""
    tuteur = UserBasicSerializer(read_only=True)
    tuteur_id = serializers.IntegerField(write_only=True)
    nombre_inscrits = serializers.ReadOnlyField()
    places_disponibles = serializers.ReadOnlyField()
    statut_validation = serializers.SerializerMethodField()
    
    class Meta:
        model = OffreTutorat
        fields = ['id', 'tuteur', 'tuteur_id', 'titre', 'description',
                 'matiere', 'niveau', 'type', 'tarif', 'tarif_reduction',
                 'gratuit', 'duree_session', 'nombre_places', 'planning_flexible',
                 'en_ligne', 'presentiel', 'lieu', 'lien_visio', 'est_active',
                 'validee_par_admin', 'date_validation', 'admin_validateur',
                 'vues', 'candidatures', 'sessions_realisees', 'note_moyenne',
                 'date_creation', 'date_modification', 'nombre_inscrits',
                 'places_disponibles', 'statut_validation']
        read_only_fields = ['id', 'vues', 'candidatures', 'sessions_realisees',
                          'note_moyenne', 'date_creation', 'date_modification',
                          'validee_par_admin', 'date_validation', 'admin_validateur']
    
    def get_statut_validation(self, obj):
        if obj.validee_par_admin:
            return "Validée"
        return "En attente de validation"
    
    def create(self, validated_data):
        tuteur_id = validated_data.pop('tuteur_id')
        validated_data['tuteur_id'] = tuteur_id
        return super().create(validated_data)

class InscriptionOffreSerializer(serializers.ModelSerializer):
    """Serializer pour les inscriptions aux offres"""
    offre = OffreTutoratSerializer(read_only=True)
    offre_id = serializers.IntegerField(write_only=True)
    etudiant = UserBasicSerializer(read_only=True)
    etudiant_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = InscriptionOffre
        fields = ['id', 'offre', 'offre_id', 'etudiant', 'etudiant_id',
                 'statut', 'message', 'date_inscription', 'date_reponse',
                 'reponse_tuteur']
        read_only_fields = ['id', 'date_inscription', 'date_reponse', 'reponse_tuteur']
    
    def create(self, validated_data):
        offre_id = validated_data.pop('offre_id')
        etudiant_id = validated_data.pop('etudiant_id')
        
        validated_data['offre_id'] = offre_id
        validated_data['etudiant_id'] = etudiant_id
        
        return super().create(validated_data)

class GroupeTutoratSerializer(serializers.ModelSerializer):
    """Serializer pour les groupes de tutorat"""
    offre = OffreTutoratSerializer(read_only=True)
    offre_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    createur = UserBasicSerializer(read_only=True)
    createur_id = serializers.IntegerField(write_only=True)
    tuteurs = UserBasicSerializer(many=True, read_only=True)
    tuteurs_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )
    places_disponibles = serializers.ReadOnlyField()
    
    class Meta:
        model = GroupeTutorat
        fields = ['id', 'offre', 'offre_id', 'nom', 'description',
                 'capacite_max', 'date_debut', 'date_fin', 'createur',
                 'createur_id', 'tuteurs', 'tuteurs_ids', 'prive',
                 'code_acces', 'auto_inscription', 'nombre_membres',
                 'nombre_sessions', 'date_creation', 'places_disponibles']
        read_only_fields = ['id', 'nombre_membres', 'nombre_sessions',
                          'date_creation']
    
    def create(self, validated_data):
        tuteurs_ids = validated_data.pop('tuteurs_ids', [])
        groupe = super().create(validated_data)
        
        if tuteurs_ids:
            groupe.tuteurs.set(tuteurs_ids)
        
        return groupe

class InscriptionGroupeSerializer(serializers.ModelSerializer):
    """Serializer pour les inscriptions aux groupes"""
    groupe = GroupeTutoratSerializer(read_only=True)
    groupe_id = serializers.IntegerField(write_only=True)
    etudiant = UserBasicSerializer(read_only=True)
    etudiant_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = InscriptionGroupe
        fields = ['id', 'groupe', 'groupe_id', 'etudiant', 'etudiant_id',
                 'statut', 'date_inscription', 'date_acceptation']
        read_only_fields = ['id', 'date_inscription', 'date_acceptation']

class DisponibiliteSerializer(serializers.ModelSerializer):
    """Serializer pour les disponibilités des tuteurs"""
    tuteur = UserBasicSerializer(read_only=True)
    tuteur_id = serializers.IntegerField(write_only=True)
    jour_semaine_display = serializers.CharField(source='get_jour_semaine_display', read_only=True)
    
    class Meta:
        model = Disponibilite
        fields = ['id', 'tuteur', 'tuteur_id', 'jour_semaine',
                 'jour_semaine_display', 'heure_debut', 'heure_fin',
                 'est_recurrent', 'date_exception', 'indisponible', 'created_at']
        read_only_fields = ['id', 'created_at']

class SeanceSerializer(serializers.ModelSerializer):
    """Serializer pour les séances de tutorat"""
    offre = OffreTutoratSerializer(read_only=True)
    offre_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    groupe = GroupeTutoratSerializer(read_only=True)
    groupe_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    tuteur = UserBasicSerializer(read_only=True)
    tuteur_id = serializers.IntegerField(write_only=True)
    etudiants = UserBasicSerializer(many=True, read_only=True)
    etudiants_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    duree_en_heures = serializers.SerializerMethodField()
    
    class Meta:
        model = Seance
        fields = ['id', 'offre', 'offre_id', 'groupe', 'groupe_id',
                 'tuteur', 'tuteur_id', 'etudiants', 'etudiants_ids',
                 'date_heure_debut', 'date_heure_fin', 'duree', 'duree_en_heures',
                 'en_ligne', 'lien_visio', 'lieu', 'sujet', 'description',
                 'ressources_partagees', 'statut', 'statut_display',
                 'commentaire_annulation', 'date_annulation', 'rapport_tuteur',
                 'rapport_etudiant', 'travail_realise', 'objectifs_suivants',
                 'date_creation', 'date_modification', 'nombre_etudiants']
        read_only_fields = ['id', 'date_creation', 'date_modification',
                          'date_annulation', 'nombre_etudiants']
    
    def get_duree_en_heures(self, obj):
        return obj.duree / 60
    
    def create(self, validated_data):
        etudiants_ids = validated_data.pop('etudiants_ids', [])
        seance = super().create(validated_data)
        
        if etudiants_ids:
            seance.etudiants.set(etudiants_ids)
        
        return seance

class EvaluationSerializer(serializers.ModelSerializer):
    """Serializer pour les évaluations"""
    seance = SeanceSerializer(read_only=True)
    seance_id = serializers.IntegerField(write_only=True)
    auteur = UserBasicSerializer(read_only=True)
    auteur_id = serializers.IntegerField(write_only=True)
    cible = UserBasicSerializer(read_only=True)
    cible_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Evaluation
        fields = ['id', 'seance', 'seance_id', 'auteur', 'auteur_id',
                 'cible', 'cible_id', 'note', 'commentaire',
                 'clarte_explication', 'patience', 'preparation',
                 'efficacite', 'date']
        read_only_fields = ['id', 'date']

class RessourceSerializer(serializers.ModelSerializer):
    """Serializer pour les ressources pédagogiques"""
    createur = UserBasicSerializer(read_only=True)
    createur_id = serializers.IntegerField(write_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    note_moyenne = serializers.ReadOnlyField()
    nombre_telechargements = serializers.SerializerMethodField()
    
    class Meta:
        model = Ressource
        fields = ['id', 'createur', 'createur_id', 'titre', 'description',
                 'type', 'type_display', 'fichier', 'lien', 'contenu_texte',
                 'matiere', 'niveau', 'tags', 'publique', 'groupes_partages',
                 'validee_par_admin', 'date_validation', 'admin_validateur',
                 'telechargements', 'vues', 'notes', 'note_moyenne',
                 'nombre_telechargements', 'date_creation', 'date_modification']
        read_only_fields = ['id', 'telechargements', 'vues', 'notes',
                          'note_moyenne', 'date_creation', 'date_modification',
                          'validee_par_admin', 'date_validation', 'admin_validateur']
    
    def get_nombre_telechargements(self, obj):
        return obj.telechargements

class SeanceDetailSerializer(SeanceSerializer):
    """Serializer détaillé pour les séances avec évaluations"""
    evaluations = EvaluationSerializer(many=True, read_only=True)
    
    class Meta(SeanceSerializer.Meta):
        fields = SeanceSerializer.Meta.fields + ['evaluations']

class OffreTutoratDetailSerializer(OffreTutoratSerializer):
    """Serializer détaillé pour les offres avec inscriptions"""
    inscriptions = InscriptionOffreSerializer(many=True, read_only=True)
    
    class Meta(OffreTutoratSerializer.Meta):
        fields = OffreTutoratSerializer.Meta.fields + ['inscriptions']

class GroupeTutoratDetailSerializer(GroupeTutoratSerializer):
    """Serializer détaillé pour les groupes avec inscriptions"""
    inscriptions = InscriptionGroupeSerializer(many=True, read_only=True)
    ressources = RessourceSerializer(many=True, read_only=True)
    
    class Meta(GroupeTutoratSerializer.Meta):
        fields = GroupeTutoratSerializer.Meta.fields + ['inscriptions', 'ressources']
```

## 📁 **apps/communication/serializers.py (nouveau)**

```python
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
```

## 📁 **apps/notifications/serializers.py (nouveau)**

```python
from rest_framework import serializers
from apps.accounts.serializers import UserBasicSerializer
from .models import Notification, AdminAnnouncement

class NotificationSerializer(serializers.ModelSerializer):
    """Serializer pour les notifications"""
    destinataire = UserBasicSerializer(read_only=True)
    destinataire_id = serializers.IntegerField(write_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    priorite_display = serializers.CharField(source='get_priorite_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'destinataire', 'destinataire_id', 'type', 'type_display',
                 'titre', 'message', 'donnees_supplementaires', 'lien',
                 'lue', 'date_lecture', 'priorite', 'priorite_display',
                 'date_envoi', 'date_creation']
        read_only_fields = ['id', 'date_creation']

class AdminAnnouncementSerializer(serializers.ModelSerializer):
    """Serializer pour les annonces administratives"""
    auteur = UserBasicSerializer(read_only=True)
    auteur_id = serializers.IntegerField(write_only=True)
    type_display = serializers.CharField(source='get_couleur_display', read_only=True)
    est_valide = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminAnnouncement
        fields = ['id', 'titre', 'contenu', 'auteur', 'auteur_id',
                 'destinataires', 'matieres', 'niveaux', 'active', 'banniere',
                 'couleur', 'type_display', 'date_publication', 'date_expiration',
                 'vues', 'clics', 'est_valide', 'date_creation',
                 'date_modification']
        read_only_fields = ['id', 'vues', 'clics', 'date_creation',
                          'date_modification']
    
    def get_est_valide(self, obj):
        """Vérifie si l'annonce est encore valide"""
        return obj.est_valide()

class NotificationCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création de notifications en masse"""
    
    class Meta:
        model = Notification
        fields = ['destinataire_id', 'type', 'titre', 'message',
                 'donnees_supplementaires', 'lien', 'priorite', 'date_envoi']
```

**Ces serializers permettent :**

✅ **Exposition complète** de tous les modèles via l'API REST
✅ **Relations imbriquées** pour éviter les requêtes multiples
✅ **Validation des données** avec champs personnalisés
✅ **Sécurité** avec champs read_only appropriés
✅ **Performance** avec sélectivité des données
✅ **Extensibilité** pour les futures fonctionnalités

**Prochain : Les Views pour créer les endpoints API !**
