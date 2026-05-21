"""
URLs pour les fonctionnalités étendues du forum pour les tuteurs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views_extended import (
    TutorForumViewSet, ReponseEtendueViewSet, 
    BadgeTuteurViewSet, ClassementTuteurViewSet
)

router = DefaultRouter()
router.register(r'questions', TutorForumViewSet, basename='tutor-forum-questions')
router.register(r'reponses', ReponseEtendueViewSet, basename='tutor-forum-reponses')
router.register(r'badges', BadgeTuteurViewSet, basename='tutor-forum-badges')
router.register(r'classement', ClassementTuteurViewSet, basename='tutor-forum-classement')

urlpatterns = [
    path('', include(router.urls)),
]
