from django.urls import path, include

print("Salut!")
from rest_framework.routers import DefaultRouter
from .views import (
    ConversationViewSet, MessageViewSet, ForumQuestionViewSet, ForumReponseViewSet
)

router = DefaultRouter()
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'forum/questions', ForumQuestionViewSet, basename='forum-question')
router.register(r'forum/reponses', ForumReponseViewSet, basename='forum-reponse')

urlpatterns = [
    path('communication/', include(router.urls)),
]
