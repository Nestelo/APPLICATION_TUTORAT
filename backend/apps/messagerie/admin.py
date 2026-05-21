from django.contrib import admin
from .models import Conversation, Message

class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ('date_envoi',)

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'titre', 'type_conversation', 'date_creation', 'dernier_message')
    inlines = [MessageInline]
    list_filter = ('type_conversation', 'date_creation')
    search_fields = ('titre', 'description', 'tags')

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('conversation', 'expediteur', 'contenu_court', 'date_envoi', 'lu')
    list_filter = ('lu', 'date_envoi')
    search_fields = ('contenu',)

    def contenu_court(self, obj):
        return obj.contenu[:50] + '...' if len(obj.contenu) > 50 else obj.contenu
    contenu_court.short_description = 'Message'