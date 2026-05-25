import os
from pathlib import Path
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-your-secret-key-here-change-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# ALLOWED_HOSTS - Autorise Render et les domaines locaux
ALLOWED_HOSTS = ['*']

# Application definition
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'cloudinary_storage',  # ← AJOUTER
    'cloudinary',          # ← AJOUTER
]

LOCAL_APPS = [
    'apps.accounts',
    'apps.tutorat',
    'apps.messaging',
    'apps.notifications',
    'apps.ressources',
    'apps.forum',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'tutorat.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'tutorat.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'tutorat_db',
        'USER': 'postgres',
        'PASSWORD': 'postgres',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Europe/Paris'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# ==================== CLOUDINARY CONFIGURATION ====================
# Configuration Cloudinary pour les médias (images, vidéos, audios, documents)

# Utiliser Cloudinary pour le stockage des médias en production
if not DEBUG:
    # Configuration Cloudinary avec les variables d'environnement
    import cloudinary
    import cloudinary.uploader
    import cloudinary.api

    cloudinary.config(
        cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME', 'dqtk8z6of'),
        api_key=os.environ.get('CLOUDINARY_API_KEY', '877765774416995'),
        api_secret=os.environ.get('CLOUDINARY_API_SECRET', 'IlLuSpBfM3lsD8568Ve7nAZ6I-0'),
        secure=True
    )

    # Configuration du stockage par défaut pour les médias
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

    # Configuration spécifique pour différents types de fichiers
    CLOUDINARY_STORAGE = {
        'CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME', 'dqtk8z6of'),
        'API_KEY': os.environ.get('CLOUDINARY_API_KEY', '877765774416995'),
        'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET', 'IlLuSpBfM3lsD8568Ve7nAZ6I-0'),
        'SECURE': True,
        'DEFAULT_TRANSFORMATION': {'quality': 'auto'},
        'EXIF_DISABLE': True,
        'STATIC_IMAGES_EXTENSIONS': ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        'VIDEO_EXTENSIONS': ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm'],
        'AUDIO_EXTENSIONS': ['mp3', 'wav', 'ogg', 'aac', 'flac'],
        'DOCUMENT_EXTENSIONS': ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'],
    }
else:
    # En développement, stockage local
    DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'

# Media files (Uploads) - Fallback pour développement
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ============================================================

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom user model
AUTH_USER_MODEL = 'accounts.User'

# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
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
}

# JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}

# ==================== CORS CONFIGURATION ====================
# Autoriser toutes les origines (uniquement pour le développement/test)
CORS_ALLOW_ALL_ORIGINS = True  # ⚠️ À n'utiliser qu'en développement / test
CORS_ALLOW_CREDENTIALS = True

# Liste explicite (conservée mais non utilisée si CORS_ALLOW_ALL_ORIGINS=True)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.43.210:8000",
    "exp://192.168.43.210:8082",
    "https://application-tutorat.onrender.com",
    "http://application-tutorat.onrender.com",
]
# ============================================================

# File upload configuration
FILE_UPLOAD_MAX_MEMORY_SIZE = 500 * 1024 * 1024  # 500MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 500 * 1024 * 1024  # 500MB

# Configure les types de fichiers autorisés
ALLOWED_UPLOAD_EXTENSIONS = [
    # Documents
    '.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt',
    # Présentations
    '.ppt', '.pptx', '.odp',
    # Feuilles de calcul
    '.xls', '.xlsx', '.ods', '.csv',
    # Images
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg',
    # Vidéos
    '.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm',
    # Audio
    '.mp3', '.wav', '.ogg', '.aac', '.flac',
    # Archives
    '.zip', '.rar', '.7z', '.tar', '.gz',
    # Code
    '.py', '.js', '.html', '.css', '.java', '.cpp', '.c',
]

# Email configuration (pour les notifications)
# Utiliser le backend console pour éviter les blocages en production
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # Pour les tests
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'ndjerabeernest@gmail.com'
EMAIL_HOST_PASSWORD = 'Nestelo10'

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': 'tutorat.log',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
        'apps': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}

# Cache configuration
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# API Configuration
API_BASE_URL = 'https://application-tutorat.onrender.com'

# Notifications settings
NOTIFICATION_SETTINGS = {
    'EMAIL_NOTIFICATIONS': True,
    'PUSH_NOTIFICATIONS': False,
    'SMS_NOTIFICATIONS': False,
}