from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Max, Count, Sum, F
from django.utils import timezone
from datetime import timedelta

from .models import (
    Conversation, ParticipantsConversation, Message, PieceJointeMessage, 
    ReactionMessage, EmailMessage
)
from .serializers import (
    ConversationSerializer, ConversationDetailSerializer, MessageSerializer,
    ParticipantsConversationSerializer, PieceJointeMessageSerializer, 
    ReactionMessageSerializer, EmailMessageSerializer
)
from apps.accounts.models import User
from apps.notifications.services import creer_notification


class ConversationViewSet(viewsets.ModelViewSet):
    """ViewSet pour les conversations avec fonctionnalités avancées"""
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['titre', 'description', 'tags']
    ordering_fields = ['date_creation', 'dernier_message', 'titre']
    ordering = ['-dernier_message', '-date_creation']

    def get_queryset(self):
        """Filtre les conversations pour n'inclure que celles où l'utilisateur est participant."""
        user = self.request.user
        return self.queryset.filter(participants=user).annotate(
            last_msg=Max('messagerie_messages__date_envoi')
        ).order_by('-last_msg', '-date_creation')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ConversationDetailSerializer
        return ConversationSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=False, methods=['post'])
    def start(self, request):
        """Crée une nouvelle conversation entre l'utilisateur courant et un autre utilisateur."""
        autre_id = request.data.get('autre_id')
        if not autre_id:
            return Response({'error': 'ID de l\'autre utilisateur requis'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            autre = User.objects.get(id=autre_id)
        except User.DoesNotExist:
            return Response({'error': 'Utilisateur inexistant'}, status=status.HTTP_404_NOT_FOUND)

        if autre == request.user:
            return Response({'error': 'Vous ne pouvez pas démarrer une conversation avec vous-même'}, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier si une conversation existe déjà entre ces deux utilisateurs
        conversation = Conversation.objects.filter(participants=request.user).filter(participants=autre).first()
        if conversation:
            serializer = ConversationDetailSerializer(conversation, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Créer nouvelle conversation
        conversation = Conversation.objects.create(
            titre=f"Conversation avec {autre.prenom} {autre.nom}",
            type_conversation='individuelle'
        )
        
        # Ajouter les deux participants
        ParticipantsConversation.objects.create(
            conversation=conversation,
            utilisateur=request.user,
            role='participant'
        )
        ParticipantsConversation.objects.create(
            conversation=conversation,
            utilisateur=autre,
            role='participant'
        )
        
        serializer = ConversationDetailSerializer(conversation, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def envoyer(self, request, pk=None):
        """Envoie un message dans une conversation existante."""
        conversation = self.get_object()
        contenu = request.data.get('contenu')
        if not contenu:
            return Response({'error': 'Contenu du message requis'}, status=status.HTTP_400_BAD_REQUEST)

        message = Message.objects.create(
            conversation=conversation,
            expediteur=request.user,
            contenu=contenu
        )
        # Mettre à jour la date du dernier message
        conversation.dernier_message = timezone.now()
        conversation.save(update_fields=['dernier_message'])

        serializer = MessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def envoyer_vocal(self, request, pk=None):
        """Envoie un message vocal dans une conversation existante."""
        conversation = self.get_object()
        
        # Vérifier si un fichier audio est fourni
        if 'audio_file' not in request.FILES:
            return Response({'error': 'Fichier audio requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        audio_file = request.FILES['audio_file']
        contenu = request.data.get('contenu', 'Message vocal')
        
        # Créer le message avec le fichier audio
        message = Message.objects.create(
            conversation=conversation,
            expediteur=request.user,
            type_message='audio',
            contenu=contenu,
            fichier=audio_file,
            nom_original_fichier=audio_file.name,
            type_fichier=audio_file.content_type or 'audio/mpeg',
            taille_fichier=audio_file.size
        )
        
        # Mettre à jour la date du dernier message
        conversation.dernier_message = timezone.now()
        conversation.save(update_fields=['dernier_message'])

        serializer = MessageSerializer(message, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def marquer_lu(self, request, pk=None):
        """Marque tous les messages de la conversation comme lus pour l'utilisateur."""
        conversation = self.get_object()
        # Marquer comme lus les messages non lus dont l'expéditeur n'est pas l'utilisateur courant
        conversation.messagerie_messages.filter(lu=False).exclude(expediteur=request.user).update(lu=True)
        return Response({'status': 'messages marqués comme lus'})

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filtre les messages pour n'inclure que ceux des conversations où l'utilisateur participe."""
        user = self.request.user
        return self.queryset.filter(conversation__participants=user)

    def perform_create(self, serializer):
        """À utiliser si on veut créer un message via ce viewset (mais on utilise plutôt l'action envoyer de ConversationViewSet)."""
        conversation = serializer.validated_data['conversation']
        if self.request.user not in conversation.participants.all():
            raise permissions.PermissionDenied("Vous ne pouvez pas envoyer de message dans cette conversation.")
        serializer.save(expediteur=self.request.user)
        # Mettre à jour la date du dernier message
        conversation.dernier_message = timezone.now()
        conversation.save(update_fields=['dernier_message'])