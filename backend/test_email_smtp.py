#!/usr/bin/env python
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

# Test d'envoi d'email réel
from django.core.mail import send_mail
from django.conf import settings

def test_email_reel():
    """Tester l'envoi d'email réel vers ndjerabeernest@gmail.com"""
    try:
        print("🚀 Test d'envoi d'email réel...")
        print(f"📧 Email configuré: {settings.EMAIL_HOST_USER}")
        print(f"🌐 Serveur SMTP: {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
        
        sujet = "[TEST] Email de test depuis Django"
        contenu = """
Ceci est un email de test pour vérifier que l'envoi SMTP fonctionne correctement.

Si vous recevez cet email, cela signifie que :
✅ La configuration SMTP est correcte
✅ L'authentification Gmail fonctionne
✅ Le système peut envoyer des vrais emails

---
Envoyé depuis le système de messagerie de la plateforme de tutorat.
Date: {}
        """.format("14/03/2026 10:30")
        
        # Envoyer l'email
        result = send_mail(
            subject=sujet,
            message=contenu,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['ndjerabeernest@gmail.com'],
            fail_silently=False,
        )
        
        if result == 1:
            print("✅ Email de test envoyé avec succès vers ndjerabeernest@gmail.com")
            print("📧 Vérifiez votre boîte de réception Gmail !")
        else:
            print("❌ L'envoi a échoué")
            
    except Exception as e:
        print(f"❌ Erreur lors de l'envoi: {e}")
        print("\n🔧 Solutions possibles:")
        print("1. Vérifiez que vous avez activé la validation en deux étapes sur Gmail")
        print("2. Créez un mot de passe d'application Gmail")
        print("3. Mettez à jour le mot de passe dans settings.py")

if __name__ == "__main__":
    test_email_reel()
