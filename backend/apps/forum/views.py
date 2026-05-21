from django.shortcuts import render
from django.http import HttpResponse, Http404, FileResponse
from django.conf import settings
import os

# Create your views here.
from rest_framework import viewsets, permissions, filters, status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, F
from django.utils import timezone
from .models import Question, Reponse, VoteReponse, AbonnementQuestion, MessageVocal, NotificationForum
from .serializers import QuestionSerializer, ReponseSerializer, VoteReponseSerializer, AbonnementQuestionSerializer, MessageVocalSerializer, NotificationForumSerializer
from .services import ForumNotificationService, ForumStatsService
from apps.accounts.permissions import IsEtudiant, IsTuteur, IsAdminOuTuteur  # si besoin
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from apps.forum.serializers import ModerationLogSerializer
from apps.forum.models import ModerationLog
from django.shortcuts import get_object_or_404
from apps.notifications.services import creer_notification
from apps.accounts.models import User

# Endpoint pour les questions suivies
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def questions_suivies(request):
    """Récupérer les questions suivies par l'utilisateur"""
    try:
        user = request.user
        questions_suivies = Question.objects.filter(
            abonnements__utilisateur=user
        ).order_by('-date_publication')
        
        if not questions_suivies.exists():
            return Response([], status=status.HTTP_200_OK)
        
        serializer = QuestionSerializer(questions_suivies, many=True)
        return Response(serializer.data)
    except Exception as e:
        print(f"Erreur questions_suivies: {e}")
        return Response([], status=status.HTTP_200_OK)

class MessageVocalViewSet(viewsets.ModelViewSet):
    queryset = MessageVocal.objects.all()
    serializer_class = MessageVocalSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Filtrer par réponse si spécifié
        reponse_id = self.request.query_params.get('reponse')
        
        if reponse_id:
            return MessageVocal.objects.filter(reponse_id=reponse_id)
        
        return MessageVocal.objects.filter(auteur=self.request.user)
    
    def perform_create(self, serializer):
        # Valider que la réponse est bien fournie et existe
        reponse_id = self.request.data.get('reponse')
        if not reponse_id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("L'ID de la réponse est obligatoire.")
        
        try:
            from .models import Reponse
            reponse = Reponse.objects.get(id=reponse_id)
        except Reponse.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Cette réponse n'existe pas.")
        
        # Sauvegarder avec l'auteur et la réponse validée
        message_vocal = serializer.save(auteur=self.request.user, reponse=reponse)
        
        # Notifier les utilisateurs concernés
        if message_vocal.reponse:
            ForumNotificationService.notifier_message_vocal(message_vocal)

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['titre', 'contenu', 'tags']
    ordering_fields = ['date_publication', 'nb_vues', 'date_derniere_reponse']
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Exclure les questions supprimées pour les utilisateurs normaux
        # Les admins peuvent voir toutes les questions via un endpoint séparé
        return Question.objects.filter(deleted=False)

    def get_permissions(self):
        if self.action == 'create':
            # Seuls les étudiants et tuteurs peuvent poser des questions ?
            # On peut autoriser tous les utilisateurs connectés.
            self.permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Seul l'auteur ou un admin peut modifier/supprimer
            self.permission_classes = [permissions.IsAuthenticated]  # On vérifiera dans perform_update
        return super().get_permissions()

    def perform_create(self, serializer):
        print("DEBUG: perform_create appelé")
        print("DEBUG: Données reçues:", serializer.validated_data)
        try:
            question = serializer.save(auteur=self.request.user)
            print("DEBUG: Question créée avec succès:", question.id)
            # Notifier les tuteurs spécialisés dans la matière
            ForumNotificationService.notifier_tuteurs_specialises(question)
            # Notifier l'auteur de la création de la question
            creer_notification(question.auteur.id, 'message', 'Votre question a été créée avec succès', 'Question créée avec succès')
            return question
        except Exception as e:
            print("DEBUG: Erreur lors de la création:", str(e))
            raise

    def perform_update(self, serializer):
        print("DEBUG: perform_update appelé")
        print("DEBUG: Données reçues:", serializer.validated_data)
        print("DEBUG: Utilisateur:", self.request.user)
        # Vérifier que l'utilisateur est l'auteur ou admin
        if self.get_object().auteur != self.request.user and self.request.user.role != 'admin':
            raise permissions.PermissionDenied("Vous n'êtes pas l'auteur de cette question.")
        try:
            question = serializer.save()
            print("DEBUG: Question mise à jour avec succès:", question.id)
            return question
        except Exception as e:
            print("DEBUG: Erreur lors de la mise à jour:", str(e))
            raise

    def perform_destroy(self, instance):
        if instance.auteur != self.request.user and self.request.user.role != 'admin':
            raise permissions.PermissionDenied("Vous n'êtes pas l'auteur de cette question.")
        instance.delete()

    @action(detail=True, methods=['post'])
    def vue(self, request, pk=None):
        """Incrémente le compteur de vues"""
        question = self.get_object()
        question.nb_vues = F('nb_vues') + 1
        question.save(update_fields=['nb_vues'])
        question.refresh_from_db()
        return Response({'nb_vues': question.nb_vues})

    @action(detail=True, methods=['post'])
    def abonner(self, request, pk=None):
        """S'abonner à une question"""
        question = self.get_object()
        user = request.user
        
        # Vérifier si l'utilisateur n'est pas déjà abonné
        if AbonnementQuestion.objects.filter(question=question, utilisateur=user).exists():
            return Response({'error': 'Vous êtes déjà abonné à cette question'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Créer l'abonnement
        AbonnementQuestion.objects.create(question=question, utilisateur=user)
        
        return Response({'status': 'Abonné avec succès'})

    @action(detail=True, methods=['post'])
    def desabonner(self, request, pk=None):
        """Se désabonner d'une question"""
        question = self.get_object()
        user = request.user
        
        # Supprimer l'abonnement s'il existe
        try:
            abonnement = AbonnementQuestion.objects.get(question=question, utilisateur=user)
            abonnement.delete()
            return Response({'status': 'Désabonné avec succès'})
        except AbonnementQuestion.DoesNotExist:
            return Response({'error': 'Vous n\'êtes pas abonné à cette question'}, status=status.HTTP_400_BAD_REQUEST)

class ReponseViewSet(viewsets.ModelViewSet):
    queryset = Reponse.objects.all()
    serializer_class = ReponseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['auteur', 'question', 'est_solution']
    search_fields = ['contenu']
    ordering_fields = ['date', 'nb_votes']
    ordering = ['-date']

    def get_queryset(self):
        # Exclure les réponses supprimées pour les utilisateurs normaux
        # Les admins peuvent voir toutes les réponses via un endpoint séparé
        return Reponse.objects.filter(deleted=False)

    def get_permissions(self):
        if self.action == 'create':
            self.permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()

    def perform_create(self, serializer):
        print("DEBUG: ReponseViewSet.perform_create appelé")
        print("DEBUG: Données reçues:", serializer.validated_data)
        print("DEBUG: Utilisateur:", self.request.user)
        try:
            # Mettre à jour la date de dernière réponse de la question
            question = serializer.validated_data['question']
            print("DEBUG: Question ID:", question)
            question.date_derniere_reponse = timezone.now()
            question.save(update_fields=['date_derniere_reponse'])
            response = serializer.save(auteur=self.request.user)
            print("DEBUG: Réponse créée avec succès:", response.id)
            
            # Notifier l'étudiant qu'une réponse a été postée
            ForumNotificationService.notifier_etudiant_reponse(response)
            
            return response
        except Exception as e:
            print("DEBUG: Erreur lors de la création de réponse:", str(e))
            raise

    def perform_update(self, serializer):
        if self.get_object().auteur != self.request.user and self.request.user.role != 'admin':
            raise permissions.PermissionDenied("Vous n'êtes pas l'auteur de cette réponse.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.auteur != self.request.user and self.request.user.role != 'admin':
            raise permissions.PermissionDenied("Vous n'êtes pas l'auteur de cette réponse.")
        instance.delete()

    @action(detail=True, methods=['post'], permission_classes=[IsTuteur, IsAdminOuTuteur])
    def marquer_solution(self, request, pk=None):
        """Marquer une réponse comme solution (réservé à l'auteur de la question ou tuteur/admin)"""
        reponse = self.get_object()
        question = reponse.question
        # Vérifier que l'utilisateur est l'auteur de la question ou tuteur/admin
        if request.user != question.auteur and request.user.role not in ['tuteur', 'enseignant', 'admin']:
            return Response({'error': 'Seul l\'auteur de la question ou un tuteur peut marquer une solution.'},
                            status=status.HTTP_403_FORBIDDEN)
        # Si une autre réponse était marquée solution, on la retire
        Reponse.objects.filter(question=question, est_solution=True).update(est_solution=False)
        reponse.est_solution = True
        reponse.save()
        question.est_resolue = True
        question.save()
        
        # Notifier le tuteur et attribuer des points
        ForumNotificationService.notifier_solution_marquee(reponse)
        
        return Response({'status': 'Réponse marquée comme solution'})

class VoteReponseViewSet(viewsets.ModelViewSet):
    queryset = VoteReponse.objects.all()
    serializer_class = VoteReponseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(votant=self.request.user)

    def perform_create(self, serializer):
        print("DEBUG: VoteReponseViewSet.perform_create appelé")
        print("DEBUG: Données reçues:", serializer.validated_data)
        print("DEBUG: Utilisateur:", self.request.user)
        try:
            # Vérifier qu'il n'y a pas déjà un vote de cet utilisateur sur cette réponse
            reponse = serializer.validated_data['reponse']
            print("DEBUG: Réponse ID:", reponse)
            if VoteReponse.objects.filter(reponse=reponse, votant=self.request.user).exists():
                raise serializers.ValidationError("Vous avez déjà voté pour cette réponse.")
            # Mettre à jour le compteur de votes de la réponse
            vote = serializer.save(votant=self.request.user)
            print("DEBUG: Vote créé avec succès:", vote.id)
            reponse.nb_votes += serializer.validated_data['valeur']
            reponse.save(update_fields=['nb_votes'])
            print("DEBUG: Compteur de votes mis à jour")
        except Exception as e:
            print("DEBUG: Erreur lors du vote:", str(e))
            raise

    def perform_destroy(self, instance):
        # Décrémenter le compteur de votes
        reponse = instance.reponse
        reponse.nb_votes -= instance.valeur
        reponse.save(update_fields=['nb_votes'])
        instance.delete()


# ----- Admin moderation endpoints -----
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_list_questions(request):
    qs = Question.objects.all().order_by('-date_publication')
    reported_only = request.query_params.get('reported_only')
    if reported_only in ['1', 'true', 'True']:
        # TODO: Implement reporting functionality without apps.ressources
        pass
    serializer = QuestionSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_list_responses(request):
    qs = Reponse.objects.all().order_by('-date')
    serializer = ReponseSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_delete_question(request, pk):
    q = get_object_or_404(Question, pk=pk)
    reason = request.data.get('reason', '')
    q.deleted = True
    q.save(update_fields=['deleted'])
    ModerationLog.objects.create(moderator=request.user, action='delete', target_type='question', target_id=q.id, reason=reason)
    # notify author
    try:
        creer_notification(q.auteur.id, 'message', 'Votre question a été supprimée', reason or 'Contenu supprimé par un modérateur.')
    except Exception:
        pass
    return Response({'status': 'deleted'})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_restore_question(request, pk):
    q = get_object_or_404(Question, pk=pk)
    reason = request.data.get('reason', '')
    q.deleted = False
    q.save(update_fields=['deleted'])
    ModerationLog.objects.create(moderator=request.user, action='restore', target_type='question', target_id=q.id, reason=reason)
    try:
        creer_notification(q.auteur.id, 'message', 'Votre question a été restaurée', reason or 'Contenu restauré par un modérateur.')
    except Exception:
        pass
    return Response({'status': 'restored'})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_delete_response(request, pk):
    r = get_object_or_404(Reponse, pk=pk)
    reason = request.data.get('reason', '')
    r.deleted = True
    r.save(update_fields=['deleted'])
    ModerationLog.objects.create(moderator=request.user, action='delete', target_type='reponse', target_id=r.id, reason=reason)
    try:
        creer_notification(r.auteur.id, 'message', 'Votre réponse a été supprimée', reason or 'Contenu supprimé par un modérateur.')
    except Exception:
        pass
    return Response({'status': 'deleted'})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_restore_response(request, pk):
    r = get_object_or_404(Reponse, pk=pk)
    reason = request.data.get('reason', '')
    r.deleted = False
    r.save(update_fields=['deleted'])
    ModerationLog.objects.create(moderator=request.user, action='restore', target_type='reponse', target_id=r.id, reason=reason)
    try:
        creer_notification(r.auteur.id, 'message', 'Votre réponse a été restaurée', reason or 'Contenu restauré par un modérateur.')
    except Exception:
        pass
    return Response({'status': 'restored'})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_suspend_user(request, pk):
    from apps.accounts.models import User
    u = get_object_or_404(User, pk=pk)
    reason = request.data.get('reason', '')
    until = request.data.get('until')
    u.is_suspended = True
    if until:
        from django.utils.dateparse import parse_datetime
        dt = parse_datetime(until)
        u.suspension_until = dt
    u.suspension_reason = reason
    u.save(update_fields=['is_suspended', 'suspension_until', 'suspension_reason'])
    ModerationLog.objects.create(moderator=request.user, action='suspend', target_type='user', target_id=u.id, reason=reason)
    try:
        creer_notification(u.id, 'message', 'Votre compte a été suspendu', reason or 'Suspension par un modérateur.')
    except Exception:
        pass
    return Response({'status': 'suspended'})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_unsuspend_user(request, pk):
    from apps.accounts.models import User
    u = get_object_or_404(User, pk=pk)
    u.is_suspended = False
    u.suspension_until = None
    u.suspension_reason = ''
    u.save(update_fields=['is_suspended', 'suspension_until', 'suspension_reason'])
    ModerationLog.objects.create(moderator=request.user, action='unsuspend', target_type='user', target_id=u.id, reason='unsuspend')
    try:
        creer_notification(u.id, 'message', 'Votre compte a été réactivé', 'Votre compte a été réactivé par un modérateur.')
    except Exception:
        pass
    return Response({'status': 'unsuspended'})

    serializer = QuestionSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_delete_question(request, pk):
    try:
        q = Question.objects.get(pk=pk)
    except Question.DoesNotExist:
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    reason = request.data.get('reason', '')
    q.deleted = True
    q.save(update_fields=['deleted'])
    ModerationLog.objects.create(moderator=request.user, action='delete', target_type='question', target_id=q.id, reason=reason)
    # Notify author
    try:
        creer_notification(q.auteur.id, 'message', 'Votre question a été supprimée', reason)
    except Exception:
        pass
    return Response({'status': 'deleted'})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_restore_question(request, pk):
    try:
        q = Question.objects.get(pk=pk)
    except Question.DoesNotExist:
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    reason = request.data.get('reason', '')
    q.deleted = False
    q.save(update_fields=['deleted'])
    ModerationLog.objects.create(moderator=request.user, action='restore', target_type='question', target_id=q.id, reason=reason)
    return Response({'status': 'restored'})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_delete_reponse(request, pk):
    try:
        r = Reponse.objects.get(pk=pk)
    except Reponse.DoesNotExist:
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    reason = request.data.get('reason', '')
    r.deleted = True
    r.save(update_fields=['deleted'])
    ModerationLog.objects.create(moderator=request.user, action='delete', target_type='reponse', target_id=r.id, reason=reason)
    try:
        creer_notification(r.auteur.id, 'message', 'Votre réponse a été supprimée', reason)
    except Exception:
        pass
    return Response({'status': 'deleted'})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_restore_reponse(request, pk):
    try:
        r = Reponse.objects.get(pk=pk)
    except Reponse.DoesNotExist:
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    reason = request.data.get('reason', '')
    r.deleted = False
    r.save(update_fields=['deleted'])
    ModerationLog.objects.create(moderator=request.user, action='restore', target_type='reponse', target_id=r.id, reason=reason)
    return Response({'status': 'restored'})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_suspend_user(request, pk):
    try:
        u = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    reason = request.data.get('reason', '')
    until = request.data.get('until')
    u.is_suspended = True
    u.suspension_reason = reason
    if until:
        from django.utils.dateparse import parse_datetime
        u.suspension_until = parse_datetime(until)
    u.save(update_fields=['is_suspended', 'suspension_reason', 'suspension_until'])
    ModerationLog.objects.create(moderator=request.user, action='suspend', target_type='user', target_id=u.id, reason=reason)
    try:
        creer_notification(u.id, 'message', 'Compte suspendu', reason)
    except Exception:
        pass
    return Response({'status': 'suspended'})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_unsuspend_user(request, pk):
    try:
        u = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    u.is_suspended = False
    u.suspension_reason = ''
    u.suspension_until = None
    u.save(update_fields=['is_suspended', 'suspension_reason', 'suspension_until'])
    ModerationLog.objects.create(moderator=request.user, action='unsuspend', target_type='user', target_id=u.id, reason='')
    try:
        creer_notification(u.id, 'message', 'Compte réactivé', 'Votre compte a été réactivé par un administrateur.')
    except Exception:
        pass
    return Response({'status': 'unsuspended'})


# ----- API endpoints pour le tableau de bord étudiant -----
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def statistiques_etudiant(request):
    """Statistiques du forum pour l'étudiant"""
    user = request.user
    questions_posees = Question.objects.filter(auteur=user).count()
    reponses_donnees = Reponse.objects.filter(auteur=user).count()
    solutions_apportees = Reponse.objects.filter(auteur=user, est_solution=True).count()
    votes_donnes = VoteReponse.objects.filter(votant=user).count()
    
    return Response({
        'questions_posees': questions_posees,
        'reponses_donnees': reponses_donnees,
        'solutions_apportees': solutions_apportees,
        'votes_donnes': votes_donnes,
        'questions_suivies': AbonnementQuestion.objects.filter(utilisateur=user).count()
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def questions_recentes(request):
    """Questions récentes de l'étudiant"""
    user = request.user
    questions = Question.objects.filter(auteur=user).order_by('-date_publication')[:5]
    serializer = QuestionSerializer(questions, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def reponses_non_lues(request):
    """Réponses non lues pour l'étudiant"""
    user = request.user
    # Récupérer les réponses aux questions de l'utilisateur qu'il n'a pas encore vues
    questions_user = Question.objects.filter(auteur=user)
    reponses_non_lues = Reponse.objects.filter(
        question__in=questions_user,
        date_creation__gt=user.derniere_connexion or timezone.now() - timezone.timedelta(days=7)
    ).exclude(auteur=user).order_by('-date_creation')[:10]
    
    serializer = ReponseSerializer(reponses_non_lues, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def mes_questions(request):
    """Questions de l'utilisateur connecté"""
    user = request.user
    questions = Question.objects.filter(auteur=user).order_by('-date_publication')
    serializer = QuestionSerializer(questions, many=True)
    return Response(serializer.data)


# ----- API endpoints pour les badges -----
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def badges_etudiant(request):
    """Badges obtenus par l'étudiant"""
    user = request.user
    # TODO: Implémenter la logique des badges
    # Pour l'instant, retourner des badges factices
    badges = [
        {'id': 1, 'nom': 'Débutant', 'description': 'Première question posée', 'icone': '🌟', 'obtenu': True},
        {'id': 2, 'nom': 'Helper', 'description': '10 réponses utiles', 'icone': '🤝', 'obtenu': False},
        {'id': 3, 'nom': 'Expert', 'description': '50 questions résolues', 'icone': '🏆', 'obtenu': False},
    ]
    return Response({'badges': badges})


# ----- API endpoints pour les objectifs d'apprentissage -----
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def objectifs_etudiant(request):
    """Objectifs d'apprentissage de l'étudiant"""
    user = request.user
    # TODO: Implémenter la logique des objectifs
    objectifs = [
        {'id': 1, 'titre': 'Poser 5 questions', 'description': 'Contribuer au forum', 'progression': 2, 'objectif': 5},
        {'id': 2, 'titre': 'Répondre à 10 questions', 'description': 'Aider les autres étudiants', 'progression': 3, 'objectif': 10},
    ]
    return Response({'objectifs': objectifs})


# ----- API endpoint pour servir les fichiers audio -----
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def audio_file(request, vocal_id):
    """Servir un fichier audio pour un message vocal"""
    try:
        # Récupérer le message vocal
        message_vocal = get_object_or_404(MessageVocal, id=vocal_id)
        
        # Vérifier que le fichier existe
        if not message_vocal.fichier_audio:
            return Response({'error': 'Fichier audio non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        # Construire le chemin complet du fichier
        file_path = os.path.join(settings.MEDIA_ROOT, str(message_vocal.fichier_audio))
        
        if not os.path.exists(file_path):
            return Response({'error': 'Fichier audio non trouvé sur le serveur'}, status=status.HTTP_404_NOT_FOUND)
        
        # Servir le fichier avec les bons headers
        response = FileResponse(open(file_path, 'rb'), content_type='audio/mpeg')
        response['Content-Disposition'] = f'inline; filename="audio_{vocal_id}.mp3"'
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET'
        response['Access-Control-Allow-Headers'] = 'Content-Type'
        
        return response
        
    except Exception as e:
        return Response({'error': f'Erreur lors de la lecture du fichier: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ----- API endpoints admin pour le forum -----
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def admin_questions_list(request):
    """Liste des questions pour l'administration (sans permissions admin)"""
    try:
        questions = Question.objects.all().order_by('-date_publication')
        serializer = QuestionSerializer(questions, many=True)
        return Response(serializer.data)
    except Exception as e:
        print(f"Erreur admin_questions_list: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)