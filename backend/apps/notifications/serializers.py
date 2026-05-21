from rest_framework import serializers
from .models import Notification
from .models import Notification, Announcement, AnnouncementRecipient


class NotificationSerializer(serializers.ModelSerializer):
    destinataire_details = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'destinataire', 'destinataire_details', 'type', 'titre', 'message', 'lien', 'est_lue', 'date_creation']
        read_only_fields = ['id', 'date_creation']

    def get_destinataire_details(self, obj):
        try:
            return {'id': obj.destinataire.id, 'email': obj.destinataire.email}
        except Exception:
            return None


class AnnouncementRecipientSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnnouncementRecipient
        fields = ['id', 'announcement', 'user', 'delivered_at', 'delivery_status']


class AnnouncementSerializer(serializers.ModelSerializer):
    recipients = AnnouncementRecipientSerializer(many=True, read_only=True)

    class Meta:
        model = Announcement
        fields = ['id', 'creator', 'type', 'titre', 'message', 'lien', 'audience_type', 'audience_filter', 'status', 'scheduled_at', 'created_at', 'updated_at', 'recipients']
        read_only_fields = ['id', 'created_at', 'updated_at', 'recipients']