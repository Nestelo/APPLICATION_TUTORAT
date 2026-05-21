"""
URLs pour les fonctionnalités étendues de la messagerie
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ConversationViewSet, MessageViewSet, EmailMessageViewSet
)

router = DefaultRouter()
router.register(r'conversations', ConversationViewSet, basename='messagerie-conversations')
router.register(r'messages', MessageViewSet, basename='messagerie-messages')
router.register(r'emails', EmailMessageViewSet, basename='messagerie-emails')

urlpatterns = [
    path('', include(router.urls)),
]
