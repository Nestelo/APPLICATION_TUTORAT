"""
Client API Brevo pour l'envoi d'emails
Contourne les restrictions SMTP de Render en utilisant l'API HTTP
"""
import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class BrevoAPIClient:
    """Client pour l'API Brevo (anciennement Sendinblue)"""
    
    def __init__(self):
        self.api_key = settings.EMAIL_HOST_PASSWORD  # Utiliser le même mot de passe comme API key
        self.base_url = "https://api.brevo.com/v3"
        self.headers = {
            "accept": "application/json",
            "api-key": self.api_key,
            "content-type": "application/json"
        }
    
    def send_email(self, to_email, subject, html_content, sender_email=None, sender_name=None):
        """
        Envoyer un email via l'API Brevo
        
        Args:
            to_email: Email du destinataire
            subject: Sujet de l'email
            html_content: Contenu HTML de l'email
            sender_email: Email de l'expéditeur (défaut: DEFAULT_FROM_EMAIL)
            sender_name: Nom de l'expéditeur (défaut: None)
            
        Returns:
            dict: Réponse de l'API ou None en cas d'erreur
        """
        if not sender_email:
            sender_email = settings.DEFAULT_FROM_EMAIL
        
        # Construire le payload
        payload = {
            "sender": {
                "email": sender_email,
                "name": sender_name or "Plateforme Tutorat"
            },
            "to": [
                {
                    "email": to_email,
                    "name": to_email.split('@')[0]
                }
            ],
            "subject": subject,
            "htmlContent": html_content
        }
        
        try:
            logger.info(f"Envoi d'email via API Brevo à {to_email}")
            response = requests.post(
                f"{self.base_url}/smtp/email",
                headers=self.headers,
                json=payload,
                timeout=10
            )
            
            if response.status_code == 201:
                logger.info(f"Email envoyé avec succès via API Brevo: {response.json()}")
                return response.json()
            else:
                logger.error(f"Erreur API Brevo: {response.status_code} - {response.text}")
                return None
                
        except requests.exceptions.Timeout:
            logger.error("Timeout lors de l'envoi via API Brevo")
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Erreur de requête API Brevo: {e}")
            return None
        except Exception as e:
            logger.error(f"Erreur inattendue API Brevo: {e}")
            return None
    
    def test_connection(self):
        """Tester la connexion à l'API Brevo"""
        try:
            response = requests.get(
                f"{self.base_url}/account",
                headers=self.headers,
                timeout=10
            )
            if response.status_code == 200:
                logger.info("Connexion API Brevo réussie")
                return True
            else:
                logger.error(f"Erreur connexion API Brevo: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"Erreur test connexion API Brevo: {e}")
            return False
