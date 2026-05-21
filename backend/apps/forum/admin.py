from django.contrib import admin
from .models import Question, Reponse, VoteReponse

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('titre', 'auteur', 'matiere', 'est_resolue', 'nb_vues', 'date_publication')
    list_filter = ('est_resolue', 'matiere')
    search_fields = ('titre', 'contenu', 'tags')
    date_hierarchy = 'date_publication'

@admin.register(Reponse)
class ReponseAdmin(admin.ModelAdmin):
    list_display = ('question', 'auteur', 'est_solution', 'nb_votes', 'date')
    list_filter = ('est_solution',)
    search_fields = ('contenu',)

@admin.register(VoteReponse)
class VoteReponseAdmin(admin.ModelAdmin):
    list_display = ('reponse', 'votant', 'valeur', 'date')
    list_filter = ('valeur',)