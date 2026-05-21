import os
import django
import ssl

# Désactiver la vérification SSL pour le test
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from django.core.mail import send_mail, get_connection
from django.conf import settings

print('Configuration email actuelle:')
print(f'EMAIL_BACKEND: {settings.EMAIL_BACKEND}')
print(f'EMAIL_HOST: {settings.EMAIL_HOST}')
print(f'EMAIL_PORT: {settings.EMAIL_PORT}')
print(f'EMAIL_USE_TLS: {getattr(settings, "EMAIL_USE_TLS", "Non défini")}')
print(f'EMAIL_USE_SSL: {getattr(settings, "EMAIL_USE_SSL", "Non défini")}')
print(f'DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}')

# Test avec connexion personnalisée
try:
    connection = get_connection(
        host=settings.EMAIL_HOST,
        port=settings.EMAIL_PORT,
        username=settings.EMAIL_HOST_USER,
        password=settings.EMAIL_HOST_PASSWORD,
        use_tls=getattr(settings, 'EMAIL_USE_TLS', True),
        use_ssl=getattr(settings, 'EMAIL_USE_SSL', False),
        fail_silently=False,
    )

    result = send_mail(
        subject='[TEST] Plateforme Tutorat - Email réel',
        message='Bonjour,\n\nCeci est un test d\'envoi d\'email réel depuis la plateforme de tutorat.\n\nSi vous recevez cet email, le système fonctionne correctement!\n\nCordialement,\nL\'équipe de la plateforme',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=['ndjerabeernest@gmail.com'],
        connection=connection,
        fail_silently=False,
    )
    print(f'✅ Email de test envoyé avec succès! Résultat: {result}')
except Exception as e:
    print(f'❌ Erreur envoi email: {e}')
    import traceback
    traceback.print_exc()