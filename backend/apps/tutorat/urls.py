from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    OffreTutoratViewSet,
    GroupeTutoratViewSet,
    InscriptionGroupeViewSet,
    DisponibiliteViewSet,
    SeanceViewSet,
    EvaluationViewSet,
    student_dashboard,
    student_seances_list,
    reserver_seance,
    creer_seance_directe,
    seances_statistiques_etudiant,
    mettre_a_jour_seances_expirees,
    seances_avenir_etudiant,
    seances_etudiant,
    student_history,
    groupe_membres,
    groupe_ajouter_membre,
    groupe_supprimer_membre,
    recherche_tuteurs,
    tuteurs_recommandes,
    meilleurs_tuteurs,
    tuteurs_disponibles_maintenant,
    tuteur_profile,
    tuteur_evaluations,
    tuteur_disponibilites,
    tuteur_seances,
)
from .temp_views import seances_disponibles_etudiants_temp as seances_disponibles_etudiants
from .session_views import (
    disponibilites_tuteur,
    inscrire_seance,
    annuler_seance,
    confirmer_participation,
    mes_seances,
    inscrire_seance_existante,
    gerer_inscription_seance,
)

router = DefaultRouter()
router.register(r"offres", OffreTutoratViewSet)
router.register(r"groupes", GroupeTutoratViewSet)
router.register(r"inscriptions", InscriptionGroupeViewSet)
router.register(r"disponibilites", DisponibiliteViewSet)
router.register(r"seances", SeanceViewSet)
router.register(r"evaluations", EvaluationViewSet)

urlpatterns = [
    # === ENDPOINTS POST PERSONNALISÉS (AVANT le router pour éviter les conflits) ===
    path("seances/inscrire-seance-existante/", inscrire_seance_existante, name="inscrire-seance-existante"),
    path("seances/gerer-inscription/", gerer_inscription_seance, name="gerer-inscription-seance"),
    path("seances/disponibles-etudiants/", seances_disponibles_etudiants, name="seances-disponibles-etudiants"),
    
    path("", include(router.urls)),
    # Endpoints spécifiques Étudiant
    path("student/dashboard/", student_dashboard, name="student-dashboard"),
    path("student/seances/", student_seances_list, name="student-seances"),
    path(
        "student/offres/<int:offre_id>/reserver/",
        reserver_seance,
        name="student-reserver-seance",
    ),
    path("student/history/", student_history, name="student-history"),
    # Endpoints de recherche de tuteurs
    path("tuteurs/recherche/", recherche_tuteurs, name="recherche-tuteurs"),
    path("tuteurs/recommandes/", tuteurs_recommandes, name="tuteurs-recommandes"),
    path("tuteurs/classement/", meilleurs_tuteurs, name="meilleurs-tuteurs"),
    path("tuteurs/disponibles-maintenant/", tuteurs_disponibles_maintenant, name="tuteurs-disponibles-maintenant"),
    # Endpoints profil tuteur
    path("tuteurs/<int:tuteur_id>/profile/", tuteur_profile, name="tuteur-profile"),
    path("tuteurs/<int:tuteur_id>/evaluations/", tuteur_evaluations, name="tuteur-evaluations"),
    path("tuteurs/<int:tuteur_id>/evaluations-recentes/", tuteur_evaluations, name="tuteur-evaluations-recentes"),
    path("tuteurs/<int:tuteur_id>/disponibilites/", tuteur_disponibilites, name="tuteur-disponibilites"),
    path("tuteurs/<int:tuteur_id>/seances/", tuteur_seances, name="tuteur-seances"),
    path("tuteurs/<int:tuteur_id>/update-rating/", tuteur_profile, name="tuteur-update-rating"),
    
    # === ENDPOINTS GESTION COMPLÈTE DES SÉANCES ===
    path("tuteurs/<int:tuteur_id>/disponibilites-detail/", disponibilites_tuteur, name="disponibilites-tuteur"),
    path("seances/inscrire/", inscrire_seance, name="inscrire-seance"),
    path("seances/<int:seance_id>/annuler/", annuler_seance, name="annuler-seance"),
    path("seances/<int:seance_id>/confirmer/", confirmer_participation, name="confirmer-participation"),
    path("seances/creer-direct/", creer_seance_directe, name="creer-seance-directe"),
    path("seances/statistiques/etudiant/", seances_statistiques_etudiant, name="seances-statistiques-etudiant"),
    path("seances/mettre-a-jour-expirees/", mettre_a_jour_seances_expirees, name="mettre-a-jour-seances-expirees"),
    path("seances/avenir/", seances_avenir_etudiant, name="seances-avenir-etudiant"),
    path("seances/etudiant/", seances_etudiant, name="seances-etudiant"),
    path("mes-seances/", mes_seances, name="mes-seances"),
    # Endpoints statistiques manquants
    path("evaluations/moyenne/etudiant/", student_dashboard, name="evaluations-moyenne-etudiant"),
    # Endpoints spécifiques Groupes
    path("groupes/<int:groupe_id>/membres/", groupe_membres, name="groupe-membres"),
    path("groupes/<int:groupe_id>/ajouter-membre/", groupe_ajouter_membre, name="groupe-ajouter-membre"),
    path("groupes/<int:groupe_id>/membres/<int:membre_id>/", groupe_supprimer_membre, name="groupe-supprimer-membre"),
]