# 🌐 **BACKEND VIEWS COMPLETS**

## 📁 **apps/accounts/views.py (étendu)**

```python
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Avg, Count

from .models import User, TutorProfile, StudentProfile
from .serializers import (
    UserBasicSerializer, UserDetailSerializer, UserRegistrationSerializer,
    UserUpdateSerializer, TutorProfileSerializer, StudentProfileSerializer
)

class CustomAuthToken(ObtainAuthToken):
    """Authentification personnalisée avec informations utilisateur"""
    
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                       context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user': UserDetailSerializer(user).data,
            'message': 'Connexion réussie'
        })

class UserViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des utilisateurs"""
    queryset = User.objects.all()
    serializer_class = UserDetailSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['role', 'statut', 'matieres_enseignees']
    search_fields = ['username', 'email', 'prenom', 'nom']
    ordering_fields = ['date_inscription', 'note_moyenne', 'nombre_evaluations']
    
    def get_serializer_class(self):
        """Retourne le serializer approprié selon l'action"""
        if self.action == 'create':
            return UserRegistrationSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserDetailSerializer
    
    def get_permissions(self):
        """Gère les permissions selon l'action"""
        if self.action == 'create':
            return [permissions.AllowAny()]
        elif self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        else:
            return [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def tutors(self, request):
        """Retourne la liste des tuteurs avec filtres avancés"""
        queryset = User.objects.filter(role__in=['tuteur', 'enseignant'], disponible=True)
        
        # Filtres
        matiere = request.query_params.get('matiere')
        niveau = request.query_params.get('niveau')
        tarif_max = request.query_params.get('tarif_max')
        note_min = request.query_params.get('note_min')
        
        if matiere:
            queryset = queryset.filter(matieres_enseignees__contains=[matiere])
        if niveau:
            queryset = queryset.filter(niveau_enseignement=niveau)
        if tarif_max:
            queryset = queryset.filter(tarif_horaire__lte=tarif_max)
        if note_min:
            queryset = queryset.filter(note_moyenne__gte=note_min)
        
        # Tri par pertinence
        queryset = queryset.order_by('-note_moyenne', '-nombre_evaluations')
        
        page = self.paginate_queryset(queryset)
        serializer = UserBasicSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def students(self, request):
        """Retourne la liste des étudiants"""
        queryset = User.objects.filter(role='etudiant', statut='actif')
        
        # Filtres
        matiere = request.query_params.get('matiere')
        niveau = request.query_params.get('niveau')
        
        if matiere:
            queryset = queryset.filter(
                Q(student_profile__matieres_etudiees__contains=[matiere]) |
                Q(objectifs_apprentissage__icontains=matiere)
            )
        if niveau:
            queryset = queryset.filter(niveau_etudes=niveau)
        
        page = self.paginate_queryset(queryset)
        serializer = UserBasicSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def profile(self, request, pk=None):
        """Retourne le profil détaillé (tuteur ou étudiant)"""
        user = self.get_object()
        
        if user.is_tuteur:
            try:
                profile = user.tutor_profile
                serializer = TutorProfileSerializer(profile)
                return Response(serializer.data)
            except TutorProfile.DoesNotExist:
                return Response({'error': 'Profil tuteur non trouvé'}, 
                              status=status.HTTP_404_NOT_FOUND)
        elif user.is_etudiant:
            try:
                profile = user.student_profile
                serializer = StudentProfileSerializer(profile)
                return Response(serializer.data)
            except StudentProfile.DoesNotExist:
                return Response({'error': 'Profil étudiant non trouvé'}, 
                              status=status.HTTP_404_NOT_FOUND)
        
        return Response({'error': 'Type de profil non reconnu'}, 
                      status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        """Note un tuteur (étudiant → tuteur)"""
        tuteur = self.get_object()
        
        if not tuteur.is_tuteur:
            return Response({'error': 'Cet utilisateur n\'est pas un tuteur'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if request.user.role != 'etudiant':
            return Response({'error': 'Seuls les étudiants peuvent noter les tuteurs'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        note = request.data.get('note')
        if not note or not (1 <= int(note) <= 5):
            return Response({'error': 'La note doit être entre 1 et 5'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        tuteur.update_rating(int(note))
        
        return Response({
            'message': 'Note enregistrée avec succès',
            'nouvelle_note_moyenne': tuteur.note_moyenne,
            'nombre_evaluations': tuteur.nombre_evaluations
        })
    
    @action(detail=False, methods=['get'])
    def rankings(self, request):
        """Retourne le classement des tuteurs"""
        queryset = User.objects.filter(
            role__in=['tuteur', 'enseignant'],
            nombre_evaluations__gte=1
        ).order_by('-note_moyenne', '-nombre_evaluations')[:20]
        
        serializer = UserBasicSerializer(queryset, many=True)
        return Response({
            'rankings': serializer.data,
            'total_tutors': User.objects.filter(
                role__in=['tuteur', 'enseignant']
            ).count()
        })
    
    @action(detail=True, methods=['post'])
    def verify_email(self, request, pk=None):
        """Vérifie l'email d'un utilisateur (admin only)"""
        if not request.user.is_admin_user:
            return Response({'error': 'Accès non autorisé'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        user = self.get_object()
        user.email_verifie = True
        user.save()
        
        return Response({'message': 'Email vérifié avec succès'})
    
    @action(detail=True, methods=['post'])
    def certify(self, request, pk=None):
        **Certifie un tuteur (admin only)**
        if not request.user.is_admin_user:
            return Response({'error': 'Accès non autorisé'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        user = self.get_object()
        if not user.is_tuteur:
            return Response({'error': 'Cet utilisateur n\'est pas un tuteur'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        user.certifie = True
        user.date_certification = timezone.now()
        user.save()
        
        return Response({'message': 'Tuteur certifié avec succès'})

class TutorProfileViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des profils tuteurs"""
    queryset = TutorProfile.objects.all()
    serializer_class = TutorProfileSerializer
    
    @action(detail=True, methods=['post'])
    def update_stats(self, request, pk=None):
        """Met à jour les statistiques du tuteur"""
        profile = self.get_object()
        profile.update_performance_stats()
        
        return Response({
            'message': 'Statistiques mises à jour',
            'stats': TutorProfileSerializer(profile).data
        })

class StudentProfileViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des profils étudiants"""
    queryset = StudentProfile.objects.all()
    serializer_class = StudentProfileSerializer

    @action(detail=True, methods=['post'])
    def increment_ressources(self, request, pk=None):
        """Incrémente le compteur de ressources consultées"""
        profile = self.get_object()
        profile.increment_ressources_consultees()
        
        return Response({
            'message': 'Ressources consultées incrémentées',
            'ressources_consultees': profile.ressources_consultees
        })
