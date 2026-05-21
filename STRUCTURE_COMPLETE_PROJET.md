# 📋 Structure Complète du Projet de Tutorat

## 🏗️ Architecture Générale

```
APPLICATION_TUTORAT/
├── backend/                    # Django REST Framework
│   ├── apps/                   # Applications Django
│   │   ├── accounts/          # Gestion utilisateurs
│   │   ├── tutorat/           # Sessions tutorat
│   │   ├── messagerie/        # Messagerie interne
│   │   ├── notifications/     # Système notifications
│   │   ├── ressources/        # Ressources pédagogiques
│   │   └── forum/             # Forums discussion
│   ├── tutorat_backend/       # Configuration Django
│   ├── media/                 # Fichiers uploadés
│   └── manage.py              # Commandes Django
├── frontend/                   # React Native + Expo
│   ├── src/
│   │   ├── api/              # Services API
│   │   ├── components/       # Composants UI
│   │   ├── screens/          # Écrans application
│   │   ├── navigation/       # Navigation
│   │   ├── context/          # Context React
│   │   ├── hooks/            # Hooks personnalisés
│   │   ├── styles/           # Styles globaux
│   │   └── utils/            # Utilitaires
│   └── App.js                # Point d'entrée
└── Documentation/             # Fichiers .md divers
```

---

## 🔧 Backend Django

### 📦 Applications Principales

#### 1. **accounts/** - Gestion Utilisateurs
- **Models**: `User`, `SystemSettings`, `DemandeTuteur`, `TutorProfile`, `StudentProfile`
- **Views**: Authentification, profils, admin, rapports
- **URLs**: `/api/auth/`
- **Fonctionnalités**:
  - JWT Authentication
  - Rôles: étudiant, tuteur, enseignant, admin
  - Profils détaillés par rôle
  - Demandes de tutorat
  - Export rapports

#### 2. **tutorat/** - Sessions de Tutorat
- **Models**: `Seance`, `Evaluation`, `Matiere`, `Disponibilite`
- **Views**: CRUD sessions, planning, évaluations
- **URLs**: `/api/tutorat/`
- **Fonctionnalités**:
  - Gestion sessions tutorat
  - Calendrier disponibilités
  - Évaluations et notes
  - Statistiques tuteur

#### 3. **messagerie/** - Communication
- **Models**: `Conversation`, `Message`, `PieceJointe`
- **Views**: Conversations, messages, notifications
- **URLs**: `/api/messagerie/`
- **Fonctionnalités**:
  - Messagerie temps réel
  - Fichiers joints
  - Notifications messages

#### 4. **notifications/** - Système Notifications
- **Models**: `Notification`, `PreferenceNotification`
- **Views**: CRUD notifications, préférences
- **URLs**: `/api/notifications/`
- **Fonctionnalités**:
  - Notifications push/email
  - Préférences utilisateur
  - Historique notifications

#### 5. **ressources/** - Matériel Pédagogique
- **Models**: `Ressource`, `CategorieRessource`, `Telechargement`
- **Views**: CRUD ressources, catégories, recherche
- **URLs**: `/api/ressources/`
- **Fonctionnalités**:
  - Upload/download fichiers
  - Catégorisation ressources
  - Statistiques utilisation

#### 6. **forum/** - Discussions
- **Models**: `Discussion`, `MessageForum`, `CategorieForum`
- **Views**: CRUD discussions, modération
- **URLs**: `/api/forum/`
- **Fonctionnalités**:
  - Forums par matière
  - Modération
  - Recherche discussions

### 🗄️ Base de Données

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'tutorat_db',
        'USER': 'postgres',
        'PASSWORD': 'Nestelo10',  # ⚠️ À sécuriser
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### 🔐 Authentification

- **JWT** avec `rest_framework_simplejwt`
- **Access token**: 1 jour
- **Refresh token**: 7 jours
- **Rotation automatique** des refresh tokens

### 🌐 Configuration API

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}
```

---

## 📱 Frontend React Native

### 🏛️ Structure Technique

#### Navigation
```javascript
// React Navigation 7
- Stack Navigator (écrans principaux)
- Drawer Navigator (menu latéral)
- Tab Navigator (navigation inférieure)
```

#### Services API
```javascript
// src/api/
- axiosConfig.js     // Configuration HTTP
- authService.js     // Authentification
- tutoratService.js  // Sessions tutorat
- messageService.js  // Messagerie
- notificationService.js // Notifications
```

#### Écrans Principaux
```javascript
// src/screens/
- Auth/
  ├── LoginScreen.js
  ├── RegisterScreen.js
  └── ProfileScreen.js
- Tutorat/
  ├── SessionsListScreen.js
  ├── SessionDetailScreen.js
  └── EvaluationScreen.js
- Messagerie/
  ├── ConversationsListScreen.js
  ├── ChatScreen.js
  └── NewConversationScreen.js
```

### 🎨 UI Components

```javascript
// Bibliothèques principales
- React Native Paper      // Composants Material Design
- React Native Vector Icons // Icônes
- React Native Calendars  // Calendrier
- React Native Chart Kit  // Graphiques
```

### 💾 Stockage Local

```javascript
// AsyncStorage
- accessToken     // Token JWT
- refreshToken    // Token de rafraîchissement
- user           // Infos utilisateur
- preferences    // Préférences app
```

---

## 🔗 Communication Frontend-Backend

### Endpoints Principaux

#### Authentification
```
POST /api/auth/login/          # Connexion
POST /api/auth/register/       # Inscription
GET  /api/auth/profile/        # Profil utilisateur
PUT  /api/auth/profile/        # Mise à jour profil
POST /api/auth/demande-tuteur/ # Demande tuteur
```

#### Tutorat
```
GET    /api/tutorat/sessions/           # Sessions
POST   /api/tutorat/sessions/           # Créer session
GET    /api/tutorat/disponibilites/     # Disponibilités
POST   /api/tutorat/evaluations/        # Évaluer session
```

#### Messagerie
```
GET    /api/messagerie/conversations/   # Conversations
GET    /api/messagerie/messages/        # Messages
POST   /api/messagerie/messages/        # Envoyer message
```

### Configuration HTTP

```javascript
// axiosConfig.js
const BASE_URL = 'http://192.168.43.210:8000/api';  // ⚠️ IP hardcodée

// Intercepteurs
- Ajout automatique token JWT
- Gestion rafraîchissement token
- Gestion erreurs 401/403
- Timeout 15 secondes
```

---

## ⚙️ Configuration Déploiement

### Backend
```python
# Settings principaux
DEBUG = True                    # ⚠️ À désactiver en prod
ALLOWED_HOSTS = ['192.168.43.210', 'localhost', '127.0.0.1']

# CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:19000",
    "http://localhost:19006",
    "http://192.168.43.210:19000",
]

# Email (SendGrid)
EMAIL_HOST = 'smtp.sendgrid.net'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
```

### Frontend
```json
// package.json
{
  "name": "tutorat-frontend",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  }
}
```

---

## 🚨 Erreurs et Problèmes Identifiés

### 🔴 **Critiques - Sécurité**
1. **Mot de passe PostgreSQL en clair** (`settings.py:72`)
2. **SECRET_KEY Django exposée** (`settings.py:12`)
3. **Clés API SendGrid visibles** (`settings.py:139,151`)

### 🟡 **Moyens - Configuration**
1. **DEBUG = True** (production)
2. **URL IP hardcodée** (`192.168.43.210`)
3. **Manque requirements.txt** principal

### 🟠 **Code - Améliorations**
1. **Champs dupliqués** User model (`date_derniere_connexion`/`derniere_connexion`)
2. **Méthode `update_rating`** mal placée (SystemSettings)
3. **Gestion erreurs 403** répétitive frontend

---

## ✅ Points Forts

1. **Architecture modulaire** bien organisée
2. **JWT authentication** correctement implémenté
3. **CORS configuration** présente et fonctionnelle
4. **Models Django** complets et bien structurés
5. **Frontend service layer** bien séparé
6. **Gestion des tokens** automatique
7. **Support multi-rôles** complet
8. **Export rapports** intégré

---

## 📋 Dépendances Principales

### Backend
```python
# Django Core
django>=4.2.0
djangorestframework>=3.14.0
django-cors-headers>=4.0.0
django-filter>=23.0

# Authentification
djangorestframework-simplejwt>=5.2.0

# Base de données
psycopg2-binary>=2.9.0

# Exports
openpyxl>=3.8.0        # Excel
python-docx>=0.8.11    # Word
reportlab>=3.6.12      # PDF
python-pptx>=0.6.21    # PowerPoint
```

### Frontend
```json
{
  "dependencies": {
    "expo": "~54.0.33",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "@react-navigation/native": "^7.0.14",
    "@react-navigation/stack": "^7.1.1",
    "axios": "^1.7.9",
    "@react-native-async-storage/async-storage": "2.2.0",
    "react-native-paper": "^5.13.1",
    "react-native-calendars": "^1.1314.0"
  }
}
```

---

## 🔄 Workflow de Développement

### Backend
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
python manage.py createsuperuser
```

### Frontend
```bash
npm install
expo start
# ou
expo start --web
```

---

## 📊 Statistiques Projet

- **Total fichiers backend**: ~240 fichiers
- **Total fichiers frontend**: ~179 fichiers
- **Apps Django**: 6 modules principaux
- **Écrans React Native**: ~92 écrans
- **Components UI**: ~28 composants
- **Services API**: ~16 services

---

*Généré le 27/03/2026 - Analyse complète du projet de tutorat*
