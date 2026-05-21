#!/usr/bin/env python
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

# Test d'envoi d'email avec SendGrid SMTP
from django.core.mail import send_mail
from django.conf import settings

def test_sendgrid_smtp():
    """Tester l'envoi d'email avec SendGrid SMTP Django"""
    try:
        print("🚀 Test d'envoi d'email avec SendGrid SMTP...")
        print(f"📧 Configuration: {settings.DEFAULT_FROM_EMAIL}")
        print(f"🌐 Serveur: {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
        print(f"🔐 Utilisateur: {settings.EMAIL_HOST_USER}")
        
        # Email de test simple
        sujet = "[TEST] Email SendGrid SMTP depuis Django"
        contenu_html = """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h2 style="color: #007bff; margin-bottom: 20px;">🎉 Test de configuration SendGrid SMTP</h2>
                
                <p style="color: #333; line-height: 1.6;">Félicitations !</p>
                
                <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <p style="color: #333;">Ceci est un email de test pour vérifier que l'envoi SendGrid SMTP fonctionne correctement.</p>
                    
                    <p style="color: #28a745; font-weight: bold;">✅ Si vous recevez cet email, la configuration est réussie !</p>
                    
                    <p style="color: #dc3545;">⚠️ Si vous ne recevez rien, vérifiez la configuration SMTP.</p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                
                <div style="font-size: 12px; color: #666;">
                    <p><strong>Envoyé depuis:</strong> Système de messagerie Tutorat</p>
                    <p><strong>Date:</strong> 14/03/2026 11:58</p>
                    <p><strong>Service:</strong> SendGrid SMTP</p>
                    <p><strong>Backend:</strong> Django</p>
                </div>
            </div>
        </div>
        """
        
        contenu_texte = """
Ceci est un email de test pour vérifier que l'envoi SendGrid SMTP fonctionne correctement.

Si vous recevez cet email, la configuration est réussie !

---
Envoyé depuis le système de messagerie Tutorat
Date: 14/03/2026 11:58
Service: SendGrid SMTP
Backend: Django
        """
        
        # Envoyer l'email
        result = send_mail(
            subject=sujet,
            message=contenu_texte,
            html_message=contenu_html,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['ndjerabeernest@gmail.com'],
            fail_silently=False,
        )
        
        if result == 1:
            print("✅ Email SendGrid SMTP envoyé avec succès !")
            print(f"📧 Destinataire: ndjerabeernest@gmail.com")
            print(f"📧 Sujet: {sujet}")
            print("📧 Vérifiez votre boîte de réception Gmail !")
        else:
            print(f"❌ Erreur envoi SendGrid SMTP: result={result}")
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        print("\n🔧 Débogage:")
        print(f"EMAIL_HOST: {getattr(settings, 'EMAIL_HOST', 'Non défini')}")
        print(f"EMAIL_PORT: {getattr(settings, 'EMAIL_PORT', 'Non défini')}")
        print(f"EMAIL_USE_TLS: {getattr(settings, 'EMAIL_USE_TLS', 'Non défini')}")
        print(f"EMAIL_BACKEND: {getattr(settings, 'EMAIL_BACKEND', 'Non défini')}")
        print(f"EMAIL_HOST_USER: {getattr(settings, 'EMAIL_HOST_USER', 'Non défini')}")
        print(f"EMAIL_HOST_PASSWORD: {'CONFIGURÉ' if hasattr(settings, 'EMAIL_HOST_PASSWORD') and settings.EMAIL_HOST_PASSWORD else 'NON CONFIGURÉ'}")

if __name__ == "__main__":
    test_sendgrid_smtp()
