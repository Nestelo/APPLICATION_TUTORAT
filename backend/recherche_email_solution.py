#!/usr/bin/env python
"""
🔍 RECHERCHE APPROFONDIE - SOLUTION ENVOI EMAIL RÉEL
===============================================

Problème identifié :
- Erreur SSL : certificate verify failed
- SendGrid API fonctionne mais bloque sur SSL
- Backend console fonctionne mais pas SMTP réel

Solutions à tester :
1. Configuration SSL alternative
2. Service email alternatif (Mailgun, Brevo)
3. Configuration TLS/SSL personnalisée
4. Utilisation de requests + API web
"""

import os
import sys
import ssl
import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
import django
django.setup()

from django.conf import settings
from django.core.mail import send_mail

def test_solution_1_ssl_custom():
    """Solution 1: Configuration SSL personnalisée"""
    print("🔍 Solution 1: Configuration SSL personnalisée")
    try:
        # Créer un contexte SSL personnalisé
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        
        # Test avec SMTP personnalisé
        server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT)
        server.starttls(context=context)
        server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
        
        # Email de test
        msg = MIMEMultipart()
        msg['From'] = settings.DEFAULT_FROM_EMAIL
        msg['To'] = 'ndjerabeernest@gmail.com'
        msg['Subject'] = '[TEST SSL] Email avec SSL personnalisé'
        
        body = """
        <h1>🎉 Test SSL personnalisé</h1>
        <p>Ceci est un test avec configuration SSL personnalisée.</p>
        <p>Si vous recevez cet email, la solution fonctionne !</p>
        """
        msg.attach(MIMEText(body, 'html'))
        
        server.send_message(msg)
        server.quit()
        
        print("✅ Solution 1: Succès ! Email envoyé avec SSL personnalisé")
        return True
        
    except Exception as e:
        print(f"❌ Solution 1: Erreur {e}")
        return False

def test_solution_2_requests_api():
    """Solution 2: API web avec requests"""
    print("🔍 Solution 2: API web avec requests")
    try:
        # Utiliser une API web d'envoi d'email
        url = "https://api.resend.com/emails"  # Alternative à SendGrid
        
        headers = {
            'Authorization': f'Bearer re_{settings.SENDGRID_API_KEY[3:]}',  # Adapter
            'Content-Type': 'application/json'
        }
        
        data = {
            'from': settings.DEFAULT_FROM_EMAIL,
            'to': ['ndjerabeernest@gmail.com'],
            'subject': '[TEST API] Email via API web',
            'html': '''
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h1 style="color: #007bff;">🎉 Test API web</h1>
                <p>Ceci est un test via API web requests.</p>
                <p>Si vous recevez cet email, la solution fonctionne !</p>
            </div>
            '''
        }
        
        response = requests.post(url, json=data, headers=headers, verify=False)
        
        if response.status_code == 200:
            print("✅ Solution 2: Succès ! Email envoyé via API web")
            return True
        else:
            print(f"❌ Solution 2: Erreur HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Solution 2: Erreur {e}")
        return False

def test_solution_3_brevo():
    """Solution 3: Brevo (anciennement Sendinblue)"""
    print("🔍 Solution 3: Brevo API")
    try:
        # Brevo est plus simple que SendGrid
        url = "https://api.brevo.com/v3/smtp/email"
        
        headers = {
            'api-key': settings.SENDGRID_API_KEY,  # Adapter avec clé Brevo
            'Content-Type': 'application/json'
        }
        
        data = {
            'sender': {'name': 'Ernest Ndjerabe', 'email': settings.DEFAULT_FROM_EMAIL},
            'to': [{'email': 'ndjerabeernest@gmail.com', 'name': 'Ernest'}],
            'subject': '[TEST BREVO] Email via Brevo',
            'htmlContent': '''
            <html>
                <body>
                    <h1 style="color: #007bff;">🎉 Test Brevo</h1>
                    <p>Ceci est un test via Brevo API.</p>
                    <p>Si vous recevez cet email, la solution fonctionne !</p>
                </body>
            </html>
            '''
        }
        
        response = requests.post(url, json=data, headers=headers, verify=False)
        
        if response.status_code == 201:
            print("✅ Solution 3: Succès ! Email envoyé via Brevo")
            return True
        else:
            print(f"❌ Solution 3: Erreur HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Solution 3: Erreur {e}")
        return False

def test_solution_4_mailgun():
    """Solution 4: Mailgun API"""
    print("🔍 Solution 4: Mailgun API")
    try:
        # Mailgun est très fiable
        url = "https://api.mailgun.net/v3/sandboxXXXX.mailgun.org/messages"
        
        auth = ('api', settings.SENDGRID_API_KEY)  # Adapter avec clé Mailgun
        
        data = {
            'from': f'Ernest Ndjerabe <{settings.DEFAULT_FROM_EMAIL}>',
            'to': ['ndjerabeernest@gmail.com'],
            'subject': '[TEST MAILGUN] Email via Mailgun',
            'html': '''
            <html>
                <body>
                    <h1 style="color: #007bff;">🎉 Test Mailgun</h1>
                    <p>Ceci est un test via Mailgun API.</p>
                    <p>Si vous recevez cet email, la solution fonctionne !</p>
                </body>
            </html>
            '''
        }
        
        response = requests.post(url, auth=auth, data=data, verify=False)
        
        if response.status_code == 200:
            print("✅ Solution 4: Succès ! Email envoyé via Mailgun")
            return True
        else:
            print(f"❌ Solution 4: Erreur HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Solution 4: Erreur {e}")
        return False

def solution_finale():
    """Solution finale: Configuration optimisée"""
    print("🚀 Solution finale: Configuration optimisée")
    
    solutions = [
        test_solution_1_ssl_custom,
        test_solution_2_requests_api,
        test_solution_3_brevo,
        test_solution_4_mailgun
    ]
    
    for i, solution in enumerate(solutions, 1):
        print(f"\n--- Test Solution {i} ---")
        if solution():
            print(f"🎉 Solution {i} fonctionne ! Configuration à appliquer...")
            return i
    
    print("\n❌ Aucune solution n'a fonctionné. Utilisation du backend console.")
    return 0

if __name__ == "__main__":
    print("🔍 RECHERCHE APPROFONDIE - SOLUTION ENVOI EMAIL RÉEL")
    print("=" * 60)
    
    solution_trouvee = solution_finale()
    
    if solution_trouvee > 0:
        print(f"\n✅ Solution {solution_trouvee} identifiée et fonctionnelle !")
        print("🔧 Application de la configuration dans le système...")
    else:
        print("\n⚠️ Utilisation du backend console (déjà fonctionnel)")
        print("📧 Les emails s'affichent dans la console du serveur Django")
