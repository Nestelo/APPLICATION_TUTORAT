"""
Configuration des URLs pour les fonctionnalités avancées du forum et de la messagerie
À ajouter dans urls.py principal de l'application
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# URLs pour le forum étendu
forum_patterns = [
    # URLs existantes (à conserver)
    path('', include('apps.forum.urls')),
    
    # Nouvelles URLs pour tuteurs
    path('tutor-extended/', include('apps.forum.urls_extended')),
]

# URLs pour la messagerie étendue
messagerie_patterns = [
    path('', include('apps.messagerie.urls')),
]

# Configuration principale des URLs
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/tutorat/', include('apps.tutorat.urls')),
    path('api/ressources/', include('apps.ressources.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    
    # Forum et messagerie
    path('api/forum/', include(forum_patterns)),
    path('api/messagerie/', include(messagerie_patterns)),
    
    # URLs statiques
    path('media/', static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)),
]

# Configuration pour le développement
if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns
