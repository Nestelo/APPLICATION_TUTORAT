from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuestionViewSet, ReponseViewSet, VoteReponseViewSet, MessageVocalViewSet

router = DefaultRouter()
router.register(r'questions', QuestionViewSet)
router.register(r'reponses', ReponseViewSet)
router.register(r'votes', VoteReponseViewSet)
router.register(r'messages-vocaux', MessageVocalViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

# Admin moderation routes
from .views import (
    admin_list_questions,
    admin_list_responses,
    admin_delete_question,
    admin_restore_question,
    admin_delete_response,
    admin_restore_response,
    admin_suspend_user,
    admin_unsuspend_user,
)

urlpatterns += [
    path('admin/moderation/questions/', admin_list_questions, name='admin-moderation-questions'),
    path('admin/moderation/reponses/', admin_list_responses, name='admin-moderation-reponses'),
    path('admin/moderation/questions/<int:pk>/delete/', admin_delete_question, name='admin-delete-question'),
    path('admin/moderation/questions/<int:pk>/restore/', admin_restore_question, name='admin-restore-question'),

    path('admin/moderation/reponses/<int:pk>/delete/', admin_delete_response, name='admin-delete-reponse'),
    path('admin/moderation/reponses/<int:pk>/restore/', admin_restore_response, name='admin-restore-reponse'),

    path('admin/moderation/users/<int:pk>/suspend/', admin_suspend_user, name='admin-suspend-user'),
    path('admin/moderation/users/<int:pk>/unsuspend/', admin_unsuspend_user, name='admin-unsuspend-user'),
]

# API endpoints pour le tableau de bord étudiant
from .views import (
    statistiques_etudiant,
    questions_recentes,
    reponses_non_lues,
    mes_questions,
    badges_etudiant,
    objectifs_etudiant,
    admin_questions_list,
    questions_suivies,
    audio_file,
)

urlpatterns += [
    path('statistiques/etudiant/', statistiques_etudiant, name='statistiques-etudiant'),
    path('questions/recentes/', questions_recentes, name='questions-recentes'),
    path('reponses/non_lues/', reponses_non_lues, name='reponses-non-lues'),
    path('mes-questions/', mes_questions, name='mes-questions'),
    path('questions/suivies/', questions_suivies, name='questions-suivies'),
    path('gamification/badges/etudiant/', badges_etudiant, name='badges-etudiant'),
    path('apprentissage/objectifs/etudiant/', objectifs_etudiant, name='objectifs-etudiant'),
    path('admin/questions/', admin_questions_list, name='admin-questions-list'),
    path('audio/<int:vocal_id>/', audio_file, name='audio-file'),
]