from django.shortcuts import render
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, F
from django.utils import timezone
from .models import Question, Reponse, VoteReponse
from .serializers import QuestionSerializer, ReponseSerializer, VoteReponseSerializer
from apps.accounts.permissions import IsEtudiant, IsTuteur, IsAdminOuTuteur
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from apps.forum.serializers import ModerationLogSerializer
from apps.forum.models import ModerationLog
from django.shortcuts import get_object_or_404
from apps.notifications.services import creer_notification
from apps.accounts.models import User
import serializers

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['titre', 'contenu', 'tags']
    ordering_fields = ['date_publication', 'nb_vues', 'date_derniere_reponse']
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            self.permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()

    def perform_create(self, serializer):
        print("DEBUG: perform_create appelé")
        print("DEBUG: Données reçues:", serializer.validated_data)
        print("DEBUG: Utilisateur:", self.request.user)
        try:
            question = serializer.save(auteur=self.request.user)
            print("DEBUG: Question créée avec succès:", question.id)
            return question
        except Exception as e:
            print("DEBUG: Erreur lors de la création:", str(e))
            raise

    def perform_update(self, serializer):
        if self.get_object().auteur != self.request.user and self.request.user.role != 'admin':
            raise permissions.PermissionDenied("Vous n'êtes pas l'auteur de cette question.")
        serializer.save()

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

class ReponseViewSet(viewsets.ModelViewSet):
    queryset = Reponse.objects.all()
    serializer_class = ReponseSerializer
    permission_classes = [permissions.IsAuthenticated]

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
            question = serializer.validated_data['question']
            print("DEBUG: Question ID:", question)
            question.date_derniere_reponse = timezone.now()
            question.save(update_fields=['date_derniere_reponse'])
            response = serializer.save(auteur=self.request.user)
            print("DEBUG: Réponse créée avec succès:", response.id)
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
        """Marquer une réponse comme solution"""
        reponse = self.get_object()
        question = reponse.question
        if request.user != question.auteur and request.user.role not in ['tuteur', 'enseignant', 'admin']:
            return Response({'error': 'Seul l\'auteur de la question ou un tuteur peut marquer une solution.'},
                            status=status.HTTP_403_FORBIDDEN)
        Reponse.objects.filter(question=question, est_solution=True).update(est_solution=False)
        reponse.est_solution = True
        reponse.save()
        question.est_resolue = True
        question.save()
        return Response({'status': 'Réponse marquée comme solution'})

class VoteReponseViewSet(viewsets.ModelViewSet):
    queryset = VoteReponse.objects.all()
    serializer_class = VoteReponseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(votant=self.request.user)

    def perform_create(self, serializer):
        reponse = serializer.validated_data['reponse']
        if VoteReponse.objects.filter(reponse=reponse, votant=self.request.user).exists():
            raise serializers.ValidationError("Vous avez déjà voté pour cette réponse.")
        serializer.save(votant=self.request.user)
        reponse.nb_votes += serializer.validated_data['valeur']
        reponse.save(update_fields=['nb_votes'])

    def perform_destroy(self, instance):
        reponse = instance.reponse
        reponse.nb_votes -= instance.valeur
        reponse.save(update_fields=['nb_votes'])
        instance.delete()

# Admin moderation endpoints
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_list_questions(request):
    qs = Question.objects.all().order_by('-date_publication')
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
