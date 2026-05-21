from django.urls import path
from .views import (
    admin_dashboard_stats, admin_moderation_queue,
    admin_approve_question, admin_reject_question,
    admin_approve_response, admin_reject_response,
    admin_export_data, admin_activity_logs
)

urlpatterns = [
    path('dashboard_stats/', admin_dashboard_stats, name='admin_dashboard_stats'),
    path('moderation_queue/', admin_moderation_queue, name='admin_moderation_queue'),
    path('approve_question/<int:pk>/', admin_approve_question, name='admin_approve_question'),
    path('reject_question/<int:pk>/', admin_reject_question, name='admin_reject_question'),
    path('approve_response/<int:pk>/', admin_approve_response, name='admin_approve_response'),
    path('reject_response/<int:pk>/', admin_reject_response, name='admin_reject_response'),
    path('export_data/', admin_export_data, name='admin_export_data'),
    path('activity_logs/', admin_activity_logs, name='admin_activity_logs'),
]
