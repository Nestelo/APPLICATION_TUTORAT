from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RessourceViewSet, CommentaireRessourceViewSet, NoteRessourceViewSet,
    FavoriRessourceViewSet, SignalementViewSet,
    admin_valider_ressource, admin_rejeter_ressource, admin_list_ressources_en_attente,
    admin_apercu_validation, admin_historique_validations,
    admin_list_signalements, admin_traiter_signalement,
    ressources_groupe, detail_ressource_groupe, creer_ressource_groupe, statistiques_ressources_groupe,
    ressources_groupe_en_attente, valider_ressource_groupe, rejeter_ressource_groupe,
    publier_ressource_groupe, incrementer_telechargement_ressource_groupe,
    partager_ressource, ressources_recues, ressources_envoyees, marquer_partage_lu, etudiants_actifs
)

router = DefaultRouter()
router.register(r'ressources', RessourceViewSet)
router.register(r'commentaires', CommentaireRessourceViewSet)
router.register(r'notes', NoteRessourceViewSet)
router.register(r'favoris', FavoriRessourceViewSet)
router.register(r'signalements', SignalementViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Admin routes for resource management
    path('admin/ressources/en-attente/', admin_list_ressources_en_attente, name='admin-ressources-en-attente'),
    path('admin/ressources/<int:pk>/valider/', admin_valider_ressource, name='admin-valider-ressource'),
    path('admin/ressources/<int:pk>/rejeter/', admin_rejeter_ressource, name='admin-rejeter-ressource'),
    path('admin/ressources/<int:pk>/apercu_validation/', admin_apercu_validation, name='admin-apercu-validation'),
    path('admin/ressources/<int:pk>/historique_validations/', admin_historique_validations, name='admin-historique-validations'),
    path('admin/signalements/', admin_list_signalements, name='admin-signalements'),
    path('admin/signalements/<int:pk>/traiter/', admin_traiter_signalement, name='admin-traiter-signalement'),
    # Groupes resources routes
    path('groupes/<int:groupe_id>/ressources/', ressources_groupe, name='ressources-groupe'),
    path('groupes/<int:groupe_id>/ressources/<int:ressource_id>/', detail_ressource_groupe, name='detail-ressource-groupe'),
    path('groupes/creer-ressource/', creer_ressource_groupe, name='creer-ressource-groupe'),
    path('groupes/<int:groupe_id>/statistiques/', statistiques_ressources_groupe, name='statistiques-ressources-groupe'),
    # Admin validation routes for group resources
    path('admin/groupes/ressources/en-attente/', ressources_groupe_en_attente, name='admin-ressources-groupe-en-attente'),
    path('admin/groupes/ressources/<int:ressource_id>/valider/', valider_ressource_groupe, name='admin-valider-ressource-groupe'),
    path('admin/groupes/ressources/<int:ressource_id>/rejeter/', rejeter_ressource_groupe, name='admin-rejeter-ressource-groupe'),
    # Publication et téléchargement des ressources de groupe
    path('groupes/ressources/<int:ressource_id>/publier/', publier_ressource_groupe, name='publier-ressource-groupe'),
    path('groupes/ressources/<int:ressource_id>/telecharger/', incrementer_telechargement_ressource_groupe, name='incrementer-telechargement-ressource-groupe'),
    # Statistiques manquantes
    path('statistiques/etudiant/', admin_list_ressources_en_attente, name='statistiques-ressources-etudiant'),
    path('consultations/recentes/', admin_list_ressources_en_attente, name='consultations-recentes-ressources'),
    path('suggerees/', admin_list_ressources_en_attente, name='suggerees-ressources'),
    # Partage de ressources entre étudiants
    path('partager/', partager_ressource, name='partager-ressource'),
    path('partages/recus/', ressources_recues, name='ressources-recues'),
    path('partages/envoyes/', ressources_envoyees, name='ressources-envoyees'),
    path('partages/<int:partage_id>/marquer-lu/', marquer_partage_lu, name='marquer-partage-lu'),
    # Étudiants pour le partage
    path('etudiants/', etudiants_actifs, name='etudiants-actifs'),
]