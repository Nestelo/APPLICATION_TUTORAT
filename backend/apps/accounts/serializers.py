from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from .models import User, DemandeTuteur, TutorProfile, StudentProfile


class UserSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'nom', 'prenom', 'role', 'filiere', 'annee',
            'bio', 'photo', 'photo_url', 'centres_interet', 'matieres_maitrisees',
            'tarif_horaire', 'is_active', 'date_inscription',
            'telephone', 'biographie', 'date_naissance', 'derniere_connexion',
            'email_verifie', 'telephone_verifie', 'matieres_enseignees',
            'niveau_enseignement', 'experience', 'disponible',
            'note_moyenne', 'nombre_evaluations', 'niveau_etudes',
            'etablissement', 'objectifs_apprentissage', 'badges',
            'certifie', 'date_certification'
        ]
        read_only_fields = ['id', 'date_inscription', 'note_moyenne', 
                          'nombre_evaluations', 'date_certification']
        extra_kwargs = {
            'nom': {'required': False},
            'prenom': {'required': False},
            'bio': {'required': False},
            'telephone': {'required': False},
            'biographie': {'required': False},
            'centres_interet': {'required': False},
            'matieres_maitrisees': {'required': False},
            'matieres_enseignees': {'required': False},
            'etablissement': {'required': False},
            'objectifs_apprentissage': {'required': False},
        }
    
    def get_photo_url(self, obj):
        """Retourne l'URL de la photo, supporte à la fois URLField et ImageField"""
        if not obj.photo:
            return None
        
        # Si photo est une chaîne (URL Cloudinary ou chemin)
        if isinstance(obj.photo, str):
            # Si c'est déjà une URL complète (Cloudinary)
            if obj.photo.startswith('http://') or obj.photo.startswith('https://'):
                return obj.photo
            # Si c'est un chemin relatif
            else:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.photo)
                return f"{settings.MEDIA_URL}{obj.photo}"
        
        # Si photo est un objet FileField (ancien format avec attribut url)
        if hasattr(obj.photo, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        
        return None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            'email',
            'nom',
            'prenom',
            'password',
            'password2',
            'role',
            'filiere',
            'annee',
            'bio',
            'centres_interet',
            'matieres_maitrisees',
            'tarif_horaire',
            'justificatif',
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        role = validated_data.get('role')

        # Les tuteurs / enseignants doivent être validés par un admin avant connexion
        if role in ['tuteur', 'enseignant']:
            validated_data['is_active'] = False

        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class DemandeTuteurSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeTuteur
        fields = '__all__'
        read_only_fields = ['date_soumission', 'statut']


class TutorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TutorProfile
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class UserBasicSerializer(serializers.ModelSerializer):
    """Serializer minimal pour les références"""
    photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'nom', 'prenom', 'photo', 'photo_url', 'role', 'biographie', 'telephone', 'filiere', 'annee']
    
    def get_photo_url(self, obj):
        """Retourne l'URL de la photo"""
        if not obj.photo:
            return None
        
        if isinstance(obj.photo, str):
            if obj.photo.startswith('http://') or obj.photo.startswith('https://'):
                return obj.photo
            else:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.photo)
                return f"{settings.MEDIA_URL}{obj.photo}"
        
        if hasattr(obj.photo, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        
        return None


class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour les profils"""
    tutor_profile = TutorProfileSerializer(read_only=True)
    student_profile = StudentProfileSerializer(read_only=True)
    photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'nom', 'prenom', 'role', 'filiere', 'annee',
            'bio', 'photo', 'photo_url', 'centres_interet', 'matieres_maitrisees',
            'tarif_horaire', 'is_active', 'date_inscription',
            'telephone', 'biographie', 'date_naissance', 'derniere_connexion',
            'email_verifie', 'telephone_verifie', 'matieres_enseignees',
            'niveau_enseignement', 'experience', 'disponible',
            'note_moyenne', 'nombre_evaluations', 'niveau_etudes',
            'etablissement', 'objectifs_apprentissage', 'badges',
            'certifie', 'date_certification', 'tutor_profile', 'student_profile'
        ]
        read_only_fields = ['id', 'date_inscription', 'note_moyenne', 
                          'nombre_evaluations', 'date_certification']
    
    def get_photo_url(self, obj):
        """Retourne l'URL de la photo"""
        if not obj.photo:
            return None
        
        if isinstance(obj.photo, str):
            if obj.photo.startswith('http://') or obj.photo.startswith('https://'):
                return obj.photo
            else:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.photo)
                return f"{settings.MEDIA_URL}{obj.photo}"
        
        if hasattr(obj.photo, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        
        return None