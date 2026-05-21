from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversationViewSet, MessageViewSet
from .email_views import EmailMessageViewSet

router = DefaultRouter()
router.register(r'conversations', ConversationViewSet)
router.register(r'messages', MessageViewSet)
router.register(r'email-messages', EmailMessageViewSet, basename='emailmessage')

urlpatterns = [
    path('', include(router.urls)),
]