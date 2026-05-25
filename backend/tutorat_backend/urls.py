"""
URL configuration for tutorat_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from apps.accounts.views import stats_publiques

def accueil(request):
    return HttpResponse("Bienvenue sur l'API de la plateforme de tutorat.")

urlpatterns = [
    path('', accueil),
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/tutorat/', include('apps.tutorat.urls')),
    path('api/messagerie/', include('apps.messagerie.urls')),
    path('api/messaging/', include('apps.messaging.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/ressources/', include('apps.ressources.urls')),
    path('api/forum/', include('apps.forum.urls')),
    path('api/admin/', include('apps.admin_panel.urls')),
    path('api/stats/', stats_publiques, name='stats-publiques'),
    path('api/statistiques/', include('apps.accounts.urls')),
]

# Servir les fichiers médias en développement uniquement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)