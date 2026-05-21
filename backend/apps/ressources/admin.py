from django.contrib import admin
from .models import Ressource, VersionRessource, CommentaireRessource, NoteRessource, FavoriRessource, Signalement

class VersionRessourceInline(admin.TabularInline):
    model = VersionRessource
    extra = 0
    readonly_fields = ('date_upload',)

class CommentaireInline(admin.TabularInline):
    model = CommentaireRessource
    extra = 0
    readonly_fields = ('date',)

@admin.register(Ressource)
class RessourceAdmin(admin.ModelAdmin):
    list_display = ('titre', 'auteur', 'matiere', 'type_fichier', 'statut', 'nb_telechargements', 'date_publication')
    list_filter = ('statut', 'type_fichier', 'matiere')
    search_fields = ('titre', 'description', 'tags')
    inlines = [VersionRessourceInline, CommentaireInline]
    date_hierarchy = 'date_publication'

@admin.register(VersionRessource)
class VersionRessourceAdmin(admin.ModelAdmin):
    list_display = ('ressource', 'date_upload', 'commentaire')
    list_filter = ('date_upload',)

@admin.register(CommentaireRessource)
class CommentaireRessourceAdmin(admin.ModelAdmin):
    list_display = ('ressource', 'auteur', 'contenu_court', 'date', 'signale')
    list_filter = ('signale', 'date')
    search_fields = ('contenu',)

    def contenu_court(self, obj):
        return obj.contenu[:50] + '...' if len(obj.contenu) > 50 else obj.contenu
    contenu_court.short_description = 'Commentaire'

@admin.register(NoteRessource)
class NoteRessourceAdmin(admin.ModelAdmin):
    list_display = ('ressource', 'auteur', 'note', 'date')
    list_filter = ('note',)

@admin.register(FavoriRessource)
class FavoriRessourceAdmin(admin.ModelAdmin):
    list_display = ('utilisateur', 'ressource', 'date')
    list_filter = ('date',)

@admin.register(Signalement)
class SignalementAdmin(admin.ModelAdmin):
    list_display = ('type_contenu', 'id_contenu', 'motif', 'signalant', 'date', 'traite')
    list_filter = ('type_contenu', 'traite', 'date')
    search_fields = ('motif',)