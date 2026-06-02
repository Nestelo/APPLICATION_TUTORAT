import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')

app = Celery('tutorat_backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

@app.task(bind=True, max_retries=3)
def send_activation_email_task(self, email, prenom, nom):
    """Tâche asynchrone pour envoyer l'email d'activation"""
    from django.core.mail import send_mail
    from django.conf import settings
    
    subject = 'Votre compte a été activé !'
    message = f'''
Cher/Chère {prenom} {nom},

Votre compte sur l'application de tutorat a été activé par l'administrateur.

Vous pouvez maintenant vous connecter avec vos identifiants.

Cordialement,
L'équipe de tutorat
    '''
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=True,
        )
        print(f"✅ Email d'activation envoyé à {email}")
        return {'success': True, 'email': email}
    except Exception as e:
        print(f"❌ Erreur envoi email activation à {email}: {e}")
        # Retenter la tâche avec backoff exponentiel
        raise self.retry(exc=e, countdown=60 * (self.request.retries + 1))
