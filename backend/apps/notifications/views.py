from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Ne retourner que les notifications de l'utilisateur connecté."""
        user = self.request.user
        if user.role == 'admin':
            return self.queryset  # Les admins peuvent tout voir (optionnel)
        return self.queryset.filter(destinataire=user)

    def perform_create(self, serializer):
        """Créer une notification (réservé à certaines parties du système, pas exposé directement)."""
        # On peut restreindre la création aux admins ou via des services internes.
        # Pour l'API, on peut désactiver la création directe.
        serializer.save()

    @action(detail=True, methods=['post'])
    def marquer_lue(self, request, pk=None):
        """Marquer une notification comme lue."""
        notification = self.get_object()
        notification.est_lue = True
        notification.save(update_fields=['est_lue'])
        return Response({'status': 'notification marquée comme lue'})

    @action(detail=False, methods=['post'])
    def marquer_tout_lu(self, request):
        """Marquer toutes les notifications de l'utilisateur comme lues."""
        self.get_queryset().filter(est_lue=False).update(est_lue=True)
        return Response({'status': 'toutes les notifications ont été marquées comme lues'})

    @action(detail=False, methods=['get'])
    def non_lues(self, request):
        """Retourne le nombre de notifications non lues."""
        count = self.get_queryset().filter(est_lue=False).count()
        return Response({'non_lues': count})


from .serializers import AnnouncementSerializer
from .models import Announcement
from . import services
from django.utils import timezone


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and getattr(request.user, 'role', None) == 'admin'


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAdminOrReadOnly]

    def perform_create(self, serializer):
        creator = self.request.user if self.request.user.is_authenticated else None
        ann = serializer.save(creator=creator)
        send_now = self.request.data.get('send_now', False)
        if send_now:
            # For simplicity run synchronously; in production enqueue a Celery task
            services.process_announcement(ann.id)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def send(self, request, pk=None):
        ann = self.get_object()
        services.process_announcement(ann.id)
        return Response({'status': 'send enqueued or processed'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def marquer_recue(self, request, pk=None):
        """Marquer la réception de l'annonce pour l'utilisateur connecté.

        Cette route met à jour l'AnnouncementRecipient correspondant.
        """
        ann = self.get_object()
        user = request.user
        try:
            recipient = ann.recipients.get(user=user)
        except Announcement.recipients.related.related_model.DoesNotExist:
            # Création si absent (compatibilité)
            from .models import AnnouncementRecipient
            recipient = AnnouncementRecipient.objects.create(announcement=ann, user=user, delivery_status='delivered', delivered_at=timezone.now())
            return Response({'status': 'marked delivered (created)'} , status=status.HTTP_201_CREATED)

        recipient.delivery_status = 'delivered'
        recipient.delivered_at = timezone.now()
        recipient.save(update_fields=['delivery_status', 'delivered_at'])
        return Response({'status': 'marked delivered'})