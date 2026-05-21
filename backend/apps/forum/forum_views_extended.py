# Vues étendues pour le forum avec toutes les nouvelles fonctionnalités

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django.db.models import Q, F, Count
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Question, Reponse, VoteReponse, AbonnementQuestion, MessageVocal, NotificationForum
from .serializers import (
    QuestionSerializer, ReponseSerializer, VoteReponseSerializer, 
    AbonnementQuestionSerializer, MessageVocalSerializer, NotificationForumSerializer
)
from apps.accounts.models import User


# Vues pour les abonnements aux questions
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def abonner_question(request, question_id):
    """S'abonner à une question pour recevoir des notifications"""
    try:
        question = get_object_or_404(Question, id=question_id)
        abonnement, created = AbonnementQuestion.objects.get_or_create(
            question=question,
            utilisateur=request.user
        )
        
        if created:
            # Créer une notification
            NotificationForum.objects.create(
                destinataire=request.user,
                type_notification='abonnement',
                question=question,
                message=f"Vous êtes maintenant abonné à la question : {question.titre}"
            )
            return Response({'message': 'Abonnement réussi'}, status=status.HTTP_201_CREATED)
        else:
            return Response({'message': 'Déjà abonné'}, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def desabonner_question(request, question_id):
    """Se désabonner d'une question"""
    try:
        question = get_object_or_404(Question, id=question_id)
        abonnement = AbonnementQuestion.objects.filter(
            question=question,
            utilisateur=request.user
        ).first()
        
        if abonnement:
            abonnement.delete()
            return Response({'message': 'Désabonnement réussi'})
        else:
            return Response({'error': 'Non abonné'}, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Vues pour les messages vocaux
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def envoyer_message_vocal(request, reponse_id):
    """Envoyer un message vocal dans une réponse"""
    try:
        reponse = get_object_or_404(Reponse, id=reponse_id)
        
        if 'fichier_audio' not in request.FILES:
            return Response({'error': 'Fichier audio manquant'}, status=status.HTTP_400_BAD_REQUEST)
            
        fichier_audio = request.FILES['fichier_audio']
        duree = request.POST.get('duree', '00:01:00')  # Durée par défaut
        
        message_vocal = MessageVocal.objects.create(
            reponse=reponse,
            auteur=request.user,
            fichier_audio=fichier_audio,
            duree=duree
        )
        
        # Notifier l'auteur de la réponse
        if reponse.auteur != request.user:
            NotificationForum.objects.create(
                destinataire=reponse.auteur,
                type_notification='vocal',
                question=reponse.question,
                message=f"{request.user.prenom} a envoyé un message vocal à votre réponse"
            )
        
        serializer = MessageVocalSerializer(message_vocal)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def messages_vocaux_reponse(request, reponse_id):
    """Lister les messages vocaux d'une réponse"""
    try:
        reponse = get_object_or_404(Reponse, id=reponse_id)
        messages = MessageVocal.objects.filter(reponse=reponse).order_by('-date_envoi')
        serializer = MessageVocalSerializer(messages, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Vues pour les notifications du forum
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notifications_forum(request):
    """Lister les notifications du forum pour l'utilisateur"""
    try:
        notifications = NotificationForum.objects.filter(
            destinataire=request.user
        ).order_by('-date_creation')
        
        # Pagination
        page = int(request.GET.get('page', 1))
        page_size = 20
        start = (page - 1) * page_size
        end = start + page_size
        
        notifications_page = notifications[start:end]
        serializer = NotificationForumSerializer(notifications_page, many=True)
        
        return Response({
            'results': serializer.data,
            'count': notifications.count(),
            'next': f"?page={page + 1}" if end < notifications.count() else None,
            'previous': f"?page={page - 1}" if page > 1 else None,
            'non_lues': notifications.filter(lue=False).count()
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def marquer_notification_lue(request, notification_id):
    """Marquer une notification comme lue"""
    try:
        notification = get_object_or_404(NotificationForum, id=notification_id, destinataire=request.user)
        notification.lue = True
        notification.save()
        return Response({'message': 'Notification marquée comme lue'})
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def marquer_toutes_notifications_lues(request):
    """Marquer toutes les notifications comme lues"""
    try:
        NotificationForum.objects.filter(
            destinataire=request.user,
            lue=False
        ).update(lue=True)
        return Response({'message': 'Toutes les notifications marquées comme lues'})
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Vues pour les statistiques du forum
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def statistiques_forum(request):
    """Statistiques du forum pour l'utilisateur connecté"""
    try:
        user = request.user
        
        # Statistiques générales
        stats = {
            'questions_posees': Question.objects.filter(auteur=user).count(),
            'reponses_donnees': Reponse.objects.filter(auteur=user).count(),
            'solutions_apportees': Reponse.objects.filter(auteur=user, est_solution=True).count(),
            'votes_donnees': VoteReponse.objects.filter(votant=user).count(),
            'abonnements_actifs': AbonnementQuestion.objects.filter(utilisateur=user).count(),
            'messages_vocaux_envoyes': MessageVocal.objects.filter(auteur=user).count(),
            'notifications_non_lues': NotificationForum.objects.filter(destinataire=user, lue=False).count(),
        }
        
        # Badges et récompenses
        stats['badges'] = {
            'expert_questions': stats['questions_posees'] >= 5,
            'helper_actif': stats['reponses_donnees'] >= 10,
            'solutionneur': stats['solutions_apportees'] >= 3,
            'communautaire': stats['votes_donnees'] >= 20,
            'vocal_actif': stats['messages_vocaux_envoyes'] >= 5,
        }
        
        return Response(stats)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Vues pour les questions suivies par l'utilisateur
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def questions_suivies(request):
    """Lister les questions suivies par l'utilisateur"""
    try:
        abonnements = AbonnementQuestion.objects.filter(
            utilisateur=request.user
        ).select_related('question', 'question__auteur')
        
        questions = [abonnement.question for abonnement in abonnements]
        serializer = QuestionSerializer(questions, many=True)
        
        return Response(serializer.data)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Vues pour les badges et récompenses
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def badges_forum(request):
    """Lister les badges obtenus par l'utilisateur"""
    try:
        user = request.user
        
        badges = {
            'expert_questions': {
                'nom': 'Expert en Questions',
                'description': 'A posé 5 questions ou plus',
                'icone': 'help-circle-outline',
                'obtenu': Question.objects.filter(auteur=user).count() >= 5,
                'progression': min(Question.objects.filter(auteur=user).count(), 5)
            },
            'helper_actif': {
                'nom': 'Aide Actif',
                'description': 'A donné 10 réponses ou plus',
                'icone': 'hand-left-outline',
                'obtenu': Reponse.objects.filter(auteur=user).count() >= 10,
                'progression': min(Reponse.objects.filter(auteur=user).count(), 10)
            },
            'solutionneur': {
                'nom': 'Solutionneur',
                'description': 'A apporté 3 solutions ou plus',
                'icone': 'checkmark-circle-outline',
                'obtenu': Reponse.objects.filter(auteur=user, est_solution=True).count() >= 3,
                'progression': min(Reponse.objects.filter(auteur=user, est_solution=True).count(), 3)
            },
            'communautaire': {
                'nom': 'Communautaire',
                'description': 'A voté 20 fois ou plus',
                'icone': 'people-outline',
                'obtenu': VoteReponse.objects.filter(votant=user).count() >= 20,
                'progression': min(VoteReponse.objects.filter(votant=user).count(), 20)
            },
            'vocal_actif': {
                'nom': 'Communicateur Vocal',
                'description': 'A envoyé 5 messages vocaux ou plus',
                'icone': 'mic-outline',
                'obtenu': MessageVocal.objects.filter(auteur=user).count() >= 5,
                'progression': min(MessageVocal.objects.filter(auteur=user).count(), 5)
            },
        }
        
        return Response(badges)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Vues pour les suggestions de questions similaires
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def suggestions_questions_similaires(request):
    """Suggérer des questions similaires basées sur le titre et les tags"""
    try:
        titre = request.GET.get('titre', '')
        tags = request.GET.get('tags', '')
        
        if not titre and not tags:
            return Response({'error': 'Titre ou tags requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        questions_similaires = Question.objects.filter(
            deleted=False
        )
        
        if titre:
            questions_similaires = questions_similaires.filter(
                Q(titre__icontains=titre) | Q(contenu__icontains=titre)
            )
        
        if tags:
            tags_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
            for tag in tags_list:
                questions_similaires = questions_similaires.filter(
                    Q(tags__icontains=tag)
                )
        
        # Exclure les questions de l'utilisateur
        questions_similaires = questions_similaires.exclude(auteur=request.user)
        
        # Limiter à 5 suggestions
        questions_similaires = questions_similaires[:5]
        
        serializer = QuestionSerializer(questions_similaires, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
