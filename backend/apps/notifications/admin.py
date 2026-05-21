from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('destinataire', 'type', 'titre', 'est_lue', 'date_creation')
    list_filter = ('type', 'est_lue', 'date_creation')
    search_fields = ('titre', 'message', 'destinataire__email')
    date_hierarchy = 'date_creation'