from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, annonces_non_lues

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Notifications non lues
    path('non_lues/', NotificationViewSet.as_view({'get': 'list'}), name='notifications-non-lues'),
    # Annonces non lues
    path('annonces/non_lues/', annonces_non_lues, name='annonces-non-lues'),
]

# Register admin announcements viewset
from .views import AnnouncementViewSet
router.register(r'admin/announcements', AnnouncementViewSet, basename='admin-announcements')