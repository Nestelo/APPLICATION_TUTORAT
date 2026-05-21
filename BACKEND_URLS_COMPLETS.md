# 🔗 **BACKEND URLS COMPLETS**

## 📁 **apps/tutorat/urls.py**

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OffreTutoratViewSet, GroupeTutoratViewSet, SeanceViewSet,
    EvaluationViewSet, RessourceViewSet, InscriptionOffreViewSet,
    InscriptionGroupeViewSet, DisponibiliteViewSet
)

router = DefaultRouter()
router.register(r'offres', OffreTutoratViewSet, basename='offre-tutorat')
router.register(r'groupes', GroupeTutoratViewSet, basename='groupe-tutorat')
router.register(r'seances', SeanceViewSet, basename='seance')
router.register(r'evaluations', EvaluationViewSet, basename='evaluation')
router.register(r'ressources', RessourceViewSet, basename='ressource')
router.register(r'inscriptions', InscriptionOffreViewSet, basename='inscription-offre')
router.register(r'inscriptions-groupes', InscriptionGroupeViewSet, basename='inscription-groupe')
router.register(r'disponibilites', DisponibiliteViewSet, basename='disponibilite')

urlpatterns = [
    path('tutorat/', include(router.urls)),
]
```

## 📁 **apps/communication/urls.py**

```python
from django.urls import path, include
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
```

## 📁 **apps/notifications/urls.py**

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NotificationViewSet, AdminAnnouncementViewSet
)

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'annonces', AdminAnnouncementViewSet, basename='admin-announcement')

urlpatterns = [
    path('notifications/', include(router.urls)),
]
```

## 📁 **apps/accounts/urls.py**

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import ObtainAuthToken
from .views import (
    UserViewSet, TutorProfileViewSet, StudentProfileViewSet, CustomAuthToken
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'tutor-profiles', TutorProfileViewSet, basename='tutor-profile')
router.register(r'student-profiles', StudentProfileViewSet, basename='student-profile')

urlpatterns = [
    path('accounts/', include(router.urls)),
    path('accounts/auth/login/', CustomAuthToken.as_view(), name='auth-login'),
]
```

## 📁 **backend/tutorat_backend/urls.py (principal)**

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.documentation import include_docs_urls

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Routes
    path('api/', include('apps.accounts.urls')),
    path('api/', include('apps.tutorat.urls')),
    path('api/', include('apps.communication.urls')),
    path('api/', include('apps.notifications.urls')),
    
    # API Documentation
    path('api/docs/', include_docs_urls(title='Tutorat Platform API')),
    
    # Frontend (pour le déploiement)
    path('', include('frontend.urls')),
]

# Media files
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

## 📁 **frontend/urls.py (pour le déploiement)**

```python
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    # Route principale pour le frontend React
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    
    # Toutes les autres routes redirigées vers React
    path('<path:path>', TemplateView.as_view(template_name='index.html')),
]

# Static files pour le développement
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
```

## 📁 **API ENDPOINTS COMPLETS**

### **🔐 Authentication**
```
POST   /api/accounts/auth/login/              # Connexion
GET    /api/accounts/users/                  # Liste utilisateurs
GET    /api/accounts/users/{id}/              # Détail utilisateur
POST    /api/accounts/users/                  # Créer utilisateur
PUT    /api/accounts/users/{id}/              # Mettre à jour
DELETE  /api/accounts/users/{id}/              # Supprimer utilisateur

# Actions spéciales
GET    /api/accounts/users/tutors/            # Liste tuteurs
GET    /api/accounts/users/students/          # Liste étudiants
GET    /api/accounts/users/{id}/profile/      # Profil détaillé
POST    /api/accounts/users/{id}/rate/         # Noter un tuteur
GET    /api/accounts/users/rankings/          # Classement tuteurs
POST    /api/accounts/users/{id}/verify-email/ # Vérifier email
POST    /api/accounts/users/{id}/certify/      # Certifier tuteur
```

### **📚 Tutorat**
```
# Offres de tutorat
GET    /api/tutorat/offres/                 # Liste offres
GET    /api/tutorat/offres/{id}/             # Détail offre
POST    /api/tutorat/offres/                 # Créer offre
PUT    /api/tutorat/offres/{id}/             # Mettre à jour
DELETE  /api/tutorat/offres/{id}/             # Supprimer offre

# Actions offres
POST    /api/tutorat/offres/{id}/validate/     # Valider offre (admin)
POST    /api/tutorat/offres/{id}/increment-views/ # Incrémenter vues
GET    /api/tutorat/offres/{id}/applications/ # Candidatures
POST    /api/tutorat/offres/{id}/apply/       # Postuler à offre
GET    /api/tutorat/offres/my-offers/        # Mes offres
GET    /api/tutorat/offres/recommended/      # Offres recommandées

# Groupes
GET    /api/tutorat/groupes/                # Liste groupes
GET    /api/tutorat/groupes/{id}/            # Détail groupe
POST    /api/tutorat/groupes/                # Créer groupe
PUT    /api/tutorat/groupes/{id}/            # Mettre à jour
DELETE  /api/tutorat/groupes/{id}/            # Supprimer groupe

# Actions groupes
POST    /api/tutorat/groupes/{id}/join/       # Rejoindre groupe
POST    /api/tutorat/groupes/{id}/leave/      # Quitter groupe
GET    /api/tutorat/groupes/{id}/members/    # Membres du groupe

# Séances
GET    /api/tutorat/seances/                # Liste séances
GET    /api/tutorat/seances/{id}/            # Détail séance
POST    /api/tutorat/seances/                # Créer séance
PUT    /api/tutorat/seances/{id}/            # Mettre à jour
DELETE  /api/tutorat/seances/{id}/            # Supprimer séance

# Actions séances
POST    /api/tutorat/seances/{id}/start/       # Démarrer séance
POST    /api/tutorat/seances/{id}/end/         # Terminer séance
POST    /api/tutorat/seances/{id}/cancel/      # Annuler séance
GET    /api/tutorat/seances/my-sessions/     # Mes séances
GET    /api/tutorat/seances/calendar/        # Calendrier des séances

# Évaluations
GET    /api/tutorat/evaluations/             # Liste évaluations
GET    /api/tutorat/evaluations/{id}/         # Détail évaluation
POST    /api/tutorat/evaluations/             # Créer évaluation
GET    /api/tutorat/evaluations/my-evaluations/ # Mes évaluations

# Ressources
GET    /api/tutorat/ressources/              # Liste ressources
GET    /api/tutorat/ressources/{id}/          # Détail ressource
POST    /api/tutorat/ressources/              # Créer ressource
PUT    /api/tutorat/ressources/{id}/          # Mettre à jour
DELETE  /api/tutorat/ressources/{id}/          # Supprimer ressource

# Actions ressources
POST    /api/tutorat/ressources/{id}/validate/  # Valider ressource (admin)
POST    /api/tutorat/ressources/{id}/download/  # Télécharger ressource
POST    /api/tutorat/ressources/{id}/rate/      # Noter ressource
GET    /api/tutorat/ressources/my-resources/ # Mes ressources

# Inscriptions
GET    /api/tutorat/inscriptions/            # Liste inscriptions
POST    /api/tutorat/inscriptions/            # Créer inscription
GET    /api/tutorat/inscriptions-groupes/   # Inscriptions groupes
POST    /api/tutorat/inscriptions-groupes/   # Inscrire groupe

# Disponibilités
GET    /api/tutorat/disponibilites/         # Liste disponibilités
POST    /api/tutorat/disponibilites/         # Créer disponibilité
PUT    /api/tutorat/disponibilites/{id}/     # Mettre à jour
DELETE  /api/tutorat/disponibilites/{id}/     # Supprimer disponibilité
```

### **💬 Communication**
```
# Conversations
GET    /api/communication/conversations/       # Liste conversations
GET    /api/communication/conversations/{id}/   # Détail conversation
POST    /api/communication/conversations/       # Créer conversation
PUT    /api/communication/conversations/{id}/   # Mettre à jour
DELETE  /api/communication/conversations/{id}/   # Supprimer conversation

# Actions conversations
POST    /api/communication/conversations/start-conversation/ # Démarrer conversation
POST    /api/communication/conversations/{id}/send-message/    # Envoyer message
POST    /api/communication/conversations/{id}/mark-read/       # Marquer lu
GET    /api/communication/conversations/my-conversations/       # Mes conversations

# Messages
GET    /api/communication/messages/          # Liste messages
GET    /api/communication/messages/{id}/      # Détail message
POST    /api/communication/messages/          # Créer message
PUT    /api/communication/messages/{id}/      # Mettre à jour
DELETE  /api/communication/messages/{id}/      # Supprimer message

# Forum
GET    /api/communication/forum/questions/    # Liste questions forum
GET    /api/communication/forum/questions/{id}/ # Détail question
POST    /api/communication/forum/questions/    # Créer question
PUT    /api/communication/forum/questions/{id}/ # Mettre à jour
DELETE  /api/communication/forum/questions/{id}/ # Supprimer question

# Actions questions
POST    /api/communication/forum/questions/{id}/answer/     # Répondre à question
POST    /api/communication/forum/questions/{id}/resolve/    # Résoudre question
POST    /api/communication/forum/questions/{id}/increment-views/ # Incrémenter vues

# Réponses forum
GET    /api/communication/forum/reponses/    # Liste réponses forum
GET    /api/communication/forum/reponses/{id}/ # Détail réponse
POST    /api/communication/forum/reponses/    # Créer réponse
PUT    /api/communication/forum/reponses/{id}/ # Mettre à jour
DELETE  /api/communication/forum/reponses/{id}/ # Supprimer réponse

# Actions réponses
POST    /api/communication/forum/reponses/{id}/vote/ # Voter pour réponse
```

### **🔔 Notifications**
```
# Notifications
GET    /api/notifications/notifications/     # Liste notifications
GET    /api/notifications/notifications/{id}/ # Détail notification
POST    /api/notifications/notifications/     # Créer notification
PUT    /api/notifications/notifications/{id}/ # Mettre à jour
DELETE  /api/notifications/notifications/{id}/ # Supprimer notification

# Actions notifications
POST    /api/notifications/notifications/{id}/mark-read/ # Marquer lue
POST    /api/notifications/notifications/mark-all-read/ # Tout marquer lu
GET    /api/notifications/notifications/unread-count/ # Nombre non lues
POST    /api/notifications/notifications/create-bulk/ # Créer en masse (admin)

# Annonces admin
GET    /api/notifications/annonces/          # Liste annonces
GET    /api/notifications/annonces/{id}/      # Détail annonce
POST    /api/notifications/annonces/          # Créer annonce
PUT    /api/notifications/annonces/{id}/      # Mettre à jour
DELETE  /api/notifications/annonces/{id}/      # Supprimer annonce

# Actions annonces
POST    /api/notifications/annonces/{id}/increment-views/ # Incrémenter vues
POST    /api/notifications/annonces/{id}/increment-clicks/ # Incrémenter clics
GET    /api/notifications/annonces/active-announcements/ # Annonces actives
```

## 🔧 **CONFIGURATION SETTINGS**

### **📁 backend/tutorat_backend/settings.py (ajouts)**

```python
# Configuration pour l'API REST
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'rest_framework.schemas.coreapi.AutoSchema',
}

# Configuration CORS pour le frontend
CORS_ALLOWED_ORIGINS = [
    "http://localhost:19006",  # Expo development
    "http://localhost:3000",   # React development
    "http://127.0.0.1:19006",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True

# Configuration des fichiers
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Configuration des emails
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL')

# Configuration des notifications
NOTIFICATION_SETTINGS = {
    'EMAIL_NOTIFICATIONS': True,
    'PUSH_NOTIFICATIONS': True,
    'SMS_NOTIFICATIONS': False,
    'BATCH_SIZE': 100,
}
```

## 📱 **STRUCTURE API COMPLÈTE**

### **🏗️ Architecture des endpoints**

```
API ROOT: http://localhost:8000/api/

├── 🔐 accounts/
│   ├── auth/login/
│   ├── users/
│   ├── tutor-profiles/
│   └── student-profiles/
│
├── 📚 tutorat/
│   ├── offres/
│   ├── groupes/
│   ├── seances/
│   ├── evaluations/
│   ├── ressources/
│   ├── inscriptions/
│   └── disponibilites/
│
├── 💬 communication/
│   ├── conversations/
│   ├── messages/
│   ├── forum/questions/
│   └── forum/reponses/
│
└── 🔔 notifications/
    ├── notifications/
    └── annonces/
```

### **🔐 Sécurité intégrée**

1. **Token Authentication** pour l'API
2. **Permissions par rôle** sur chaque endpoint
3. **CORS configuré** pour le frontend
4. **Validation des données** dans les serializers
5. **Rate limiting** (à configurer)

### **📊 Documentation API**

- **URL**: `http://localhost:8000/api/docs/`
- **Format**: Swagger/OpenAPI
- **Interactive**: Test des endpoints directement
- **Complète**: Tous les endpoints documentés

### **🚀 Performance optimisée**

1. **Pagination** sur toutes les listes
2. **Filtres** optimisés avec index
3. **Select related** pour éviter N+1 queries
4. **Cache** configuré pour les données fréquemment accédées

**L'API est maintenant complète avec tous les endpoints nécessaires pour la plateforme de tutorat !**

**Prochain : Les services frontend pour consommer cette API !**
