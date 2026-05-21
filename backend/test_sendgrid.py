#!/usr/bin/env python
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

# Test d'envoi d'email avec SendGrid
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from django.conf import settings

def test_sendgrid():
    """Tester l'envoi d'email avec SendGrid"""
    try:
        print("🚀 Test d'envoi d'email avec SendGrid...")
        print(f"📧 Configuration: {settings.DEFAULT_FROM_EMAIL}")
        
        # Vérifier si la clé API est configurée
        if not hasattr(settings, 'SENDGRID_API_KEY') or 'votre_cle' in settings.SENDGRID_API_KEY:
            print("❌ Clé API SendGrid non configurée")
            print("🔧 Veuillez créer un compte SendGrid et ajouter la clé API dans settings.py")
            print("📋 Étapes:")
            print("1. Allez sur https://signup.sendgrid.com/")
            print("2. Créez un compte gratuit")
            print("3. Générez une clé API (Settings → API Keys)")
            print("4. Donnez-moi la clé pour finaliser la configuration")
            return
        
        # Créer le client SendGrid
        sg = SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
        
        # Créer le message de test
        sujet = "[TEST] Email de test depuis SendGrid"
        contenu_html = """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h2 style="color: #007bff; margin-bottom: 20px;">🎉 Test de configuration SendGrid</h2>
                
                <p style="color: #333; line-height: 1.6;">Félicitations !</p>
                
                <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <p style="color: #333;">Ceci est un email de test pour vérifier que l'envoi SendGrid fonctionne correctement.</p>
                    
                    <p style="color: #28a745; font-weight: bold;">✅ Si vous recevez cet email, la configuration est réussie !</p>
                    
                    <p style="color: #dc3545;">⚠️ Si vous ne recevez rien, vérifiez la clé API SendGrid.</p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                
                <div style="font-size: 12px; color: #666;">
                    <p><strong>Envoyé depuis:</strong> Système de messagerie Tutorat</p>
                    <p><strong>Date:</strong> {}</p>
                    <p><strong>Service:</strong> SendGrid</p>
                </div>
            </div>
        </div>
        """.format("14/03/2026 11:05")
        
        message = Mail(
            from_email=settings.DEFAULT_FROM_EMAIL,
            to_emails='ndjerabeernest@gmail.com',
            subject=sujet,
            html_content=contenu_html
        )
        
        # Envoyer l'email
        response = sg.send(message)
        
        if response.status_code == 202:
            print("✅ Email SendGrid envoyé avec succès !")
            print(f"📧 Destinataire: ndjerabeernest@gmail.com")
            print(f"📊 Status Code: {response.status_code}")
            print("📧 Vérifiez votre boîte de réception Gmail !")
        else:
            print(f"❌ Erreur SendGrid: {response.status_code}")
            print(f"📝 Response: {response.body}")
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        print("\n🔧 Solutions possibles:")
        print("1. Vérifiez que sendgrid est installé: pip install sendgrid")
        print("2. Vérifiez la clé API dans settings.py")
        print("3. Vérifiez votre connexion internet")

if __name__ == "__main__":
    test_sendgrid()
