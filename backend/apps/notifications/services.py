from .models import Notification
from apps.accounts.models import User

def creer_notification(destinataire_id, type_notif, titre, message="", lien=""):
    """
    Crée une notification pour un utilisateur.
    """
    try:
        destinataire = User.objects.get(id=destinataire_id)
        Notification.objects.create(
            destinataire=destinataire,
            type=type_notif,
            titre=titre,
            message=message,
            lien=lien
        )
        return True
    except User.DoesNotExist:
        return False


def process_announcement(announcement_id):
    """
    Enqueue le traitement de l'annonce via Celery si disponible, sinon
    exécute le traitement de façon synchrone.
    """
    try:
        from .tasks import enqueue_process_announcement
        return enqueue_process_announcement(announcement_id)
    except Exception:
        # Fallback synchrone si la file de tâches n'est pas disponible
        from .models import Announcement, AnnouncementRecipient
        try:
            ann = Announcement.objects.get(id=announcement_id)
        except Announcement.DoesNotExist:
            return False

        # Déterminer les destinataires selon audience_type
        audience = ann.audience_type
        users_qs = User.objects.filter(est_actif=True)

        if audience == 'all':
            recipients = users_qs
        elif audience == 'role':
            role = ann.audience_filter.get('role') if ann.audience_filter else None
            if role:
                recipients = users_qs.filter(role=role)
            else:
                recipients = User.objects.none()
        elif audience == 'users':
            ids = ann.audience_filter.get('user_ids') if ann.audience_filter else []
            recipients = users_qs.filter(id__in=ids)
        elif audience == 'filter':
            filt = ann.audience_filter or {}
            if filt.get('filiere'):
                recipients = users_qs.filter(filiere=filt['filiere'])
            elif filt.get('annee'):
                recipients = users_qs.filter(annee=filt['annee'])
            else:
                recipients = User.objects.none()
        else:
            recipients = User.objects.none()

        created = 0
        for user in recipients.iterator():
            Notification.objects.create(
                destinataire=user,
                type=ann.type if hasattr(ann, 'type') else 'autre',
                titre=ann.titre,
                message=ann.message or '',
                lien=ann.lien or ''
            )
            AnnouncementRecipient.objects.update_or_create(announcement=ann, user=user)
            created += 1

        ann.status = 'sent'
        ann.save(update_fields=['status'])
        return {'created': created}