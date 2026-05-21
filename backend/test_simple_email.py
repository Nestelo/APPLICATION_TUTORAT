#!/usr/bin/env python
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

# Test d'envoi d'email avec configuration Django
from django.core.mail import send_mail
from django.conf import settings

def test_simple():
    """Test simple d'envoi d'email"""
    try:
        print("🚀 Test simple d'envoi d'email...")
        print(f"📧 Configuration: {settings.EMAIL_HOST_USER}")
        print(f"🌐 Serveur: {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
        
        # Email de test simple
        send_mail(
            subject='[TEST] Email depuis Django',
            message='Ceci est un test d\'envoi d\'email depuis Django.\n\nSi vous recevez cet email, tout fonctionne !',
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=['ndjerabeernest@gmail.com'],
            fail_silently=False,
        )
        
        print("✅ Email de test envoyé avec succès !")
        print("📧 Vérifiez votre boîte ndjerabeernest@gmail.com")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        print("\n🔧 Débogage:")
        print(f"EMAIL_HOST: {getattr(settings, 'EMAIL_HOST', 'Non défini')}")
        print(f"EMAIL_PORT: {getattr(settings, 'EMAIL_PORT', 'Non défini')}")
        print(f"EMAIL_USE_TLS: {getattr(settings, 'EMAIL_USE_TLS', 'Non défini')}")
        print(f"EMAIL_BACKEND: {getattr(settings, 'EMAIL_BACKEND', 'Non défini')}")

if __name__ == "__main__":
    test_simple()
