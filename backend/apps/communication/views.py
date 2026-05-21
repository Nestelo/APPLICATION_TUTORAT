from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import Conversation, Message, ForumQuestion, ForumReponse
from .serializers import (
    ConversationSerializer, MessageSerializer, ConversationDetailSerializer,
    ForumQuestionSerializer, ForumReponseSerializer, ForumQuestionDetailSerializer
)

class ConversationViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des conversations"""
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['type', 'groupe_associe']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ConversationDetailSerializer
        return ConversationSerializer
    
    @action(detail=False, methods=['post'])
    def start_conversation(self, request):
        """Démarre une nouvelle conversation"""
        participant_ids = request.data.get('participant_ids', [])
        titre = request.data.get('titre', '')
        type_conversation = request.data.get('type', 'individuel')
        
        if not participant_ids:
            return Response({'error': 'Participants requis'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Ajouter l'utilisateur actuel aux participants
        participant_ids.append(request.user.id)
        participant_ids = list(set(participant_ids))  # Éviter les doublons
        
        conversation = Conversation.objects.create(
            titre=titre,
            type=type_conversation,
            cree_par=request.user
        )
        conversation.participants.set(participant_ids)
        
        return Response({
            'message': 'Conversation créée',
            'conversation': ConversationSerializer(conversation).data
        })
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Envoie un message dans une conversation"""
        conversation = self.get_object()
        
        # Vérifier si l'utilisateur est participant
        if request.user not in conversation.participants.all():
            return Response({'error': 'Vous n\'êtes pas participant de cette conversation'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        contenu = request.data.get('contenu', '')
        type_message = request.data.get('type', 'texte')
        reponse_a_id = request.data.get('reponse_a')
        
        if not contenu:
            return Response({'error': 'Contenu requis'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        message = Message.objects.create(
            conversation=conversation,
            expediteur=request.user,
            contenu=contenu,
            type=type_message,
            reponse_a_id=reponse_a_id
        )
        
        # Mettre à jour les compteurs
        conversation.dernier_message = message.date_envoi
        conversation.nombre_messages += 1
        conversation.mettre_a_jour_non_lus(request.user.id)
        conversation.save()
        
        # Notifications aux autres participants
        from apps.notifications.models import Notification
        for participant in conversation.participants.all():
            if participant != request.user:
                Notification.objects.create(
                    destinataire=participant,
                    type='message',
                    titre='Nouveau message',
                    message=f'{request.user.get_full_name()}: {contenu[:50]}...',
                    donnees_supplementaires={
                        'conversation_id': conversation.id,
                        'message_id': message.id
                    }
                )
        
        return Response({
            'message': 'Message envoyé',
            'message_data': MessageSerializer(message, context={'request': request}).data
        })
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Marque tous les messages comme lus"""
        conversation = self.get_object()
        
        if request.user not in conversation.participants.all():
            return Response({'error': 'Accès non autorisé'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        conversation.marquer_comme_lu(request.user.id)
        
        return Response({'message': 'Messages marqués comme lus'})
    
    @action(detail=False, methods=['get'])
    def my_conversations(self, request):
        """Retourne les conversations de l'utilisateur connecté"""
        conversations = Conversation.objects.filter(participants=request.user)
        serializer = self.get_serializer(conversations, many=True)
        return Response(serializer.data)

class MessageViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des messages"""
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    
    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        """Vote pour un message (si applicable)"""
        message = self.get_object()
        
        # Implémenter la logique de vote si nécessaire
        return Response({'message': 'Vote enregistré'})

class ForumQuestionViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des questions du forum"""
    queryset = ForumQuestion.objects.all()
    serializer_class = ForumQuestionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['categorie', 'matiere', 'niveau', 'resolu']
    search_fields = ['titre', 'contenu', 'matiere']
    ordering_fields = ['date_creation', 'vues', 'nombre_reponses']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ForumQuestionDetailSerializer
        return ForumQuestionSerializer
    
    def perform_create(self, serializer):
        """Crée une question et incrémente les compteurs"""
        serializer.save(auteur=self.request.user)
    
    @action(detail=True, methods=['post'])
    def answer(self, request, pk=None):
        """Répond à une question"""
        question = self.get_object()
        
        contenu = request.data.get('contenu', '')
        if not contenu:
            return Response({'error': 'Contenu requis'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        reponse = ForumReponse.objects.create(
            question=question,
            auteur=request.user,
            contenu=contenu
        )
        
        # Mettre à jour le compteur de réponses
        question.nombre_reponses += 1
        question.save()
        
        # Notification au questionneur
        if question.auteur != request.user:
            from apps.notifications.models import Notification
            Notification.objects.create(
                destinataire=question.auteur,
                type='forum',
                titre='Nouvelle réponse',
                message=f'{request.user.get_full_name()} a répondu à votre question',
                donnees_supplementaires={
                    'question_id': question.id,
                    'reponse_id': reponse.id
                }
            )
        
        return Response({
            'message': 'Réponse publiée',
            'reponse': ForumReponseSerializer(reponse).data
        })
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Marque une question comme résolue"""
        question = self.get_object()
        
        if request.user != question.auteur:
            return Response({'error': 'Seul l\'auteur peut résoudre la question'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        meilleure_reponse_id = request.data.get('meilleure_reponse_id')
        if meilleure_reponse_id:
            try:
                meilleure_reponse = ForumReponse.objects.get(id=meilleure_reponse_id)
                question.meilleure_reponse = meilleure_reponse
                question.resolu = True
                question.date_resolution = timezone.now()
                question.save()
                
                # Badge pour le répondant
                meilleure_reponse.est_meilleure_reponse = True
                meilleure_reponse.date_meilleure_reponse = timezone.now()
                meilleure_reponse.save()
                
                return Response({'message': 'Question résolue'})
            except ForumReponse.DoesNotExist:
                return Response({'error': 'Réponse non trouvée'}, 
                              status=status.HTTP_404_NOT_FOUND)
        
        return Response({'error': 'ID de la meilleure réponse requis'}, 
                      status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def increment_views(self, request, pk=None):
        """Incrémente le compteur de vues"""
        question = self.get_object()
        question.vues += 1
        question.save()
        
        return Response({'vues': question.vues})

class ForumReponseViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des réponses du forum"""
    queryset = ForumReponse.objects.all()
    serializer_class = ForumReponseSerializer
    
    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        """Vote pour une réponse (+1 ou -1)"""
        reponse = self.get_object()
        vote_type = request.data.get('vote_type')  # 'positif' ou 'negatif'
        
        if vote_type not in ['positif', 'negatif']:
            return Response({'error': 'Type de vote invalide'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        reponse.voter(request.user, vote_type)
        
        return Response({
            'message': 'Vote enregistré',
            'votes_positifs': reponse.votes_positifs,
            'votes_negatifs': reponse.votes_negatifs,
            'score_total': reponse.votes_positifs - reponse.votes_negatifs
        })
