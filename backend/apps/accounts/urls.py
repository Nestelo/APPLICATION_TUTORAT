from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from .views import (
    login_view,
    register_view,
    change_password_view,
    demande_tuteur_view,
    update_profile_missing_fields,
    test_debug,
    creer_offres_gratuites,
    stats_publiques,
    user_profile,
    users_list,
    admin_stats,
    get_user_by_id,
)
from . import rapports_views

urlpatterns = [
    path('login/', login_view, name='login'),
    path('register/', register_view, name='register'),
    path('change-password/', change_password_view, name='change-password'),
    path('demande-tuteur/', demande_tuteur_view, name='demande-tuteur'),
    path('profile/update-missing/', update_profile_missing_fields, name='update-profile-missing'),
    path('profile/', user_profile, name='user-profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('token/simple/', TokenRefreshView.as_view(), name='token_simple'),
    # Test debug
    path('test-debug/', test_debug, name='test-debug'),
    # Stats publiques
    path('stats/', stats_publiques, name='stats'),
    # Profil utilisateur
    path('profile/', user_profile, name='user-profile'),
    # Administration
    path('users/', users_list, name='users-list'),
    path('users/<int:pk>/', get_user_by_id, name='get-user-by-id'),
    path('admin/stats/', admin_stats, name='admin-stats'),
    # Créer des offres gratuites
    path('creer-offres-gratuites/', creer_offres_gratuites, name='creer-offres-gratuites'),
    # Rapports administrateur
    path('rapports/utilisateurs/', rapports_views.rapports_utilisateurs, name='rapports-utilisateurs'),
    path('rapports/tutorat/', rapports_views.rapports_tutorat, name='rapports-tutorat'),
    path('rapports/ressources/', rapports_views.rapports_ressources, name='rapports-ressources'),
    path('rapports/forum/', rapports_views.rapports_forum, name='rapports-forum'),
    # Export des rapports (supporte PDF et Word)
    path('rapports/export/<str:rapport_type>/', rapports_views.export_rapport, name='export-rapport'),
]
