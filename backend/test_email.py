import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

# Forcer les paramètres Gmail directement dans le script
settings.EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
settings.EMAIL_HOST = 'smtp.gmail.com'
settings.EMAIL_PORT = 587
settings.EMAIL_USE_TLS = True
settings.EMAIL_HOST_USER = 'ndjerabeernest@gmail.com'
settings.EMAIL_HOST_PASSWORD = 'Nestelo10'

print("Forcing Gmail SMTP configuration:")
print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")

print("=" * 50)
print("TEST ENVOI EMAIL")
print("=" * 50)

try:
    result = send_mail(
        '[TUTORAT] Test Email',
        'Ceci est un test d\'envoi d\'email depuis Django.',
        settings.DEFAULT_FROM_EMAIL,
        ['hykzouneelisereunba@gmail.com'],
        fail_silently=False,
    )
    print(f"✅ EMAIL ENVOYÉ AVEC SUCCÈS! (result: {result})")
except Exception as e:
    print(f"❌ ERREUR ENVOI EMAIL: {e}")

print("=" * 50)
