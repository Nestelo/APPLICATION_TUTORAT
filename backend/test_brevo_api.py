#!/usr/bin/env python
"""
Script de test pour l'API Brevo
Teste la connexion et l'envoi d'email via l'API Brevo
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.messagerie.brevo_api_client import BrevoAPIClient
from django.conf import settings

def test_brevo_api():
    """Tester l'API Brevo"""
    print("=" * 60)
    print("TEST API BREVO")
    print("=" * 60)
    print(f"Clé API configurée: {settings.EMAIL_HOST_PASSWORD[:20]}...")
    print(f"Email expéditeur: {settings.DEFAULT_FROM_EMAIL}")
    print("=" * 60)
    
    # Créer le client
    client = BrevoAPIClient()
    
    # Tester la connexion
    print("\n1. Test de connexion à l'API Brevo...")
    if client.test_connection():
        print("✓ Connexion API Brevo réussie!")
    else:
        print("✗ Échec de la connexion API Brevo")
        print("Vérifiez votre clé API")
        return False
    
    # Tester l'envoi d'email
    print("\n2. Test d'envoi d'email...")
    html_content = """
    <html>
    <body>
        <h2>Test API Brevo</h2>
        <p>Ceci est un email de test pour vérifier que l'API Brevo fonctionne correctement.</p>
        <p>Si vous recevez cet email, la configuration est parfaite!</p>
        <hr>
        <p><em>Envoyé via la plateforme de tutorat</em></p>
    </body>
    </html>
    """
    
    result = client.send_email(
        to_email=settings.DEFAULT_FROM_EMAIL,  # Envoyer à soi-même pour le test
        subject="[TEST] API Brevo - Configuration",
        html_content=html_content,
        sender_email=settings.DEFAULT_FROM_EMAIL,
        sender_name="Test API Brevo"
    )
    
    if result:
        print("✓ Email de test envoyé avec succès!")
        print(f"  Message ID: {result.get('messageId', 'N/A')}")
        print(f"  Vérifiez votre boîte de réception: {settings.DEFAULT_FROM_EMAIL}")
        return True
    else:
        print("✗ Échec de l'envoi d'email")
        return False

if __name__ == "__main__":
    success = test_brevo_api()
    print("\n" + "=" * 60)
    if success:
        print("RÉSULTAT: TOUS LES TESTS RÉUSSIS")
        print("L'API Brevo est correctement configurée!")
    else:
        print("RÉSULTAT: TESTS ÉCHOUÉS")
        print("Vérifiez votre clé API et les paramètres")
    print("=" * 60)
    
    sys.exit(0 if success else 1)
