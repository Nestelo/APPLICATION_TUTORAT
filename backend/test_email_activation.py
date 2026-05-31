#!/usr/bin/env python
"""
Script de test pour l'envoi d'email d'activation avec Brevo
Utilisez ce script pour vérifier que la configuration email fonctionne correctement
"""
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def test_email_activation():
    """Tester l'envoi d'email d'activation avec Brevo"""
    print("=" * 60)
    print("🧪 TEST D'ENVOI D'EMAIL D'ACTIVATION - BREVO")
    print("=" * 60)
    
    # Afficher la configuration
    print("\n📧 Configuration Email (Brevo):")
    print(f"   Backend: {settings.EMAIL_BACKEND}")
    print(f"   Host: {settings.EMAIL_HOST}")
    print(f"   Port: {settings.EMAIL_PORT}")
    print(f"   Use TLS: {settings.EMAIL_USE_TLS}")
    print(f"   From: {settings.DEFAULT_FROM_EMAIL}")
    print(f"   User: {settings.EMAIL_HOST_USER}")
    
    # Email de test
    destinataire = 'ndjerabeernest@gmail.com'  # Changez ceci pour tester avec un autre email
    
    sujet = '✅ TEST - Votre compte a été activé !'
    message = f'''
Cher/Chère Test Utilisateur,

Ceci est un TEST d'envoi d'email d'activation depuis la plateforme de tutorat.

Votre compte sur l'application de tutorat a été activé par l'administrateur.

Vous pouvez maintenant vous connecter avec vos identifiants:
- Email: {destinataire}
- Mot de passe: [votre mot de passe]

Cordialement,
L'équipe de tutorat
---
Ceci est un email de test automatique envoyé via Brevo.
    '''
    
    print(f"\n📤 Envoi d'email à: {destinataire}")
    print(f"📝 Sujet: {sujet}")
    
    try:
        result = send_mail(
            sujet,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [destinataire],
            fail_silently=False,
        )
        
        print(f"\n✅ SUCCÈS: Email envoyé avec succès !")
        print(f"   Nombre d'emails envoyés: {result}")
        print(f"\n📬 Vérifiez votre boîte de réception: {destinataire}")
        
    except Exception as e:
        print(f"\n❌ ERREUR: L'envoi d'email a échoué")
        print(f"   Erreur: {str(e)}")
        print(f"\n💡 CONSEILS:")
        print(f"   1. Créez un compte gratuit sur https://www.brevo.com")
        print(f"   2. Allez dans SMTP & API pour obtenir vos clés SMTP")
        print(f"   3. Remplacez 'votre_cle_smtp_brevo_ici' dans settings.py")
        print(f"   4. Vérifiez que l'email sender est validé dans Brevo")
        
        return False
    
    print("\n" + "=" * 60)
    return True

if __name__ == '__main__':
    test_email_activation()
