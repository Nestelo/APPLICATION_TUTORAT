from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MessageGroupeViewSet, 
    FichierGroupeViewSet, ExerciceGroupeViewSet,
    SessionTutoratViewSet, send_direct_message
)

router = DefaultRouter()
router.register(r'messages', MessageGroupeViewSet, basename='message')
router.register(r'fichiers', FichierGroupeViewSet, basename='fichier')
router.register(r'exercices', ExerciceGroupeViewSet, basename='exercice')
router.register(r'sessions', SessionTutoratViewSet, basename='session')

urlpatterns = [
    path('', include(router.urls)),
    path('send-direct/', send_direct_message, name='send-direct-message'),
]
