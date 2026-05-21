from django.contrib import admin
from .models import Conversation, Message, ForumQuestion, ForumReponse

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['titre', 'type', 'cree_par', 'nombre_messages', 'date_creation']
    list_filter = ['type', 'date_creation']
    search_fields = ['titre', 'cree_par__email']
    filter_horizontal = ['participants']

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['conversation', 'expediteur', 'type', 'date_envoi']
    list_filter = ['type', 'date_envoi']
    search_fields = ['contenu', 'expediteur__email']
    readonly_fields = ['date_envoi', 'date_modification']

@admin.register(ForumQuestion)
class ForumQuestionAdmin(admin.ModelAdmin):
    list_display = ['titre', 'auteur', 'categorie', 'matiere', 'resolu', 'date_creation']
    list_filter = ['categorie', 'matiere', 'resolu', 'date_creation']
    search_fields = ['titre', 'contenu', 'auteur__email']
    readonly_fields = ['date_creation', 'date_modification']

@admin.register(ForumReponse)
class ForumReponseAdmin(admin.ModelAdmin):
    list_display = ['question', 'auteur', 'votes_positifs', 'votes_negatifs', 'date_creation']
    list_filter = ['date_creation']
    search_fields = ['contenu', 'auteur__email']
    readonly_fields = ['date_creation', 'date_modification']
