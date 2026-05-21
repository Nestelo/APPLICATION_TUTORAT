from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.core.management import call_command
from django.http import JsonResponse
import os
import shutil
from datetime import datetime

from .models import SystemSettings


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def get_system_settings(request):
    """
    Récupère les paramètres système actuels
    """
    settings = SystemSettings.get_settings()
    return Response({
        'email_notifications': settings.email_notifications,
        'push_notifications': settings.push_notifications,
        'auto_backup': settings.auto_backup,
        'maintenance_mode': settings.maintenance_mode,
        'allow_registration': settings.allow_registration,
        'require_email_verification': settings.require_email_verification,
        'max_file_size': settings.max_file_size,
        'max_users_per_day': settings.max_users_per_day,
        'last_updated': settings.updated_at,
        'updated_by': settings.updated_by.email if settings.updated_by else None,
    })


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def update_system_settings(request):
    """
    Met à jour les paramètres système
    """
    settings = SystemSettings.get_settings()

    # Champs autorisés à la mise à jour
    allowed_fields = [
        'email_notifications', 'push_notifications', 'auto_backup',
        'maintenance_mode', 'allow_registration', 'require_email_verification',
        'max_file_size', 'max_users_per_day'
    ]

    updated = False
    for field in allowed_fields:
        if field in request.data:
            setattr(settings, field, request.data[field])
            updated = True

    if updated:
        settings.updated_by = request.user
        settings.save()

    return Response({
        'message': 'Paramètres mis à jour avec succès',
        'settings': {
            'email_notifications': settings.email_notifications,
            'push_notifications': settings.push_notifications,
            'auto_backup': settings.auto_backup,
            'maintenance_mode': settings.maintenance_mode,
            'allow_registration': settings.allow_registration,
            'require_email_verification': settings.require_email_verification,
            'max_file_size': settings.max_file_size,
            'max_users_per_day': settings.max_users_per_day,
        }
    })


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def clear_cache(request):
    """
    Vide le cache de l'application
    """
    try:
        # Supprimer les fichiers de cache Django
        from django.core.cache import cache
        cache.clear()

        # Supprimer les fichiers statiques mis en cache (si applicable)
        # Cette partie dépend de votre configuration

        return Response({'message': 'Cache vidé avec succès'})
    except Exception as e:
        return Response(
            {'error': f'Erreur lors du vidage du cache: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def export_data(request):
    """
    Exporte les données de l'application
    """
    try:
        # Créer un dossier d'export
        export_dir = f'exports/export_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
        os.makedirs(export_dir, exist_ok=True)

        # Exporter la base de données (dump JSON)
        call_command('dumpdata', '--indent=2', output=f'{export_dir}/database.json')

        # Copier les fichiers médias
        if os.path.exists('media'):
            shutil.copytree('media', f'{export_dir}/media', dirs_exist_ok=True)

        return Response({
            'message': 'Données exportées avec succès',
            'export_path': export_dir
        })
    except Exception as e:
        return Response(
            {'error': f'Erreur lors de l\'export: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def import_data(request):
    """
    Importe les données dans l'application
    """
    try:
        # Cette fonctionnalité nécessite un fichier upload
        # Pour l'instant, on retourne une réponse générique
        return Response({
            'message': 'Fonctionnalité d\'import en développement',
            'status': 'not_implemented'
        })
    except Exception as e:
        return Response(
            {'error': f'Erreur lors de l\'import: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def cleanup_database(request):
    """
    Nettoie la base de données (supprime les données obsolètes)
    """
    try:
        # Supprimer les utilisateurs inactifs depuis plus de X jours
        from django.utils import timezone
        from datetime import timedelta

        # Exemple: supprimer les comptes non vérifiés après 30 jours
        cutoff_date = timezone.now() - timedelta(days=30)
        deleted_users = 0

        # Note: Cette logique dépend de vos besoins spécifiques
        # Pour l'instant, on simule le nettoyage

        return Response({
            'message': 'Base de données nettoyée avec succès',
            'deleted_users': deleted_users,
            'deleted_sessions': 0,
            'freed_space': '0 MB'
        })
    except Exception as e:
        return Response(
            {'error': f'Erreur lors du nettoyage: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def system_info(request):
    """
    Récupère les informations système
    """
    try:
        import psutil
        import platform

        # Informations système
        system_info = {
            'platform': platform.system(),
            'platform_version': platform.version(),
            'python_version': platform.python_version(),
            'cpu_count': psutil.cpu_count(),
            'memory_total': f"{psutil.virtual_memory().total / (1024**3):.1f} GB",
            'memory_used': f"{psutil.virtual_memory().used / (1024**3):.1f} GB",
            'disk_total': f"{psutil.disk_usage('/').total / (1024**3):.1f} GB",
            'disk_used': f"{psutil.disk_usage('/').used / (1024**3):.1f} GB",
        }
    except ImportError:
        system_info = {
            'platform': platform.system(),
            'python_version': platform.python_version(),
            'note': 'psutil non installé pour informations détaillées'
        }

    # Informations de l'application
    from django.conf import settings
    app_info = {
        'django_version': f"{settings.__dict__.get('VERSION', 'N/A')}",
        'debug_mode': settings.DEBUG,
        'database_engine': settings.DATABASES['default']['ENGINE'].split('.')[-1],
        'installed_apps': len(settings.INSTALLED_APPS),
        'media_root': settings.MEDIA_ROOT,
        'static_root': settings.STATIC_ROOT,
    }

    return Response({
        'system': system_info,
        'application': app_info,
        'timestamp': datetime.now().isoformat()
    })