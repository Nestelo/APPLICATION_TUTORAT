"""Task helpers for announcements.

This module tries to use Celery when available. If Celery is not installed
or not configured, the enqueue function will execute processing synchronously.
"""
from typing import Any, Dict

try:
    from celery import shared_task
    CELERY_AVAILABLE = True
except Exception:
    CELERY_AVAILABLE = False

from .models import Announcement, AnnouncementRecipient, Notification
from apps.accounts.models import User


def _process_announcement_sync(announcement_id: int) -> Dict[str, Any]:
    try:
        ann = Announcement.objects.get(id=announcement_id)
    except Announcement.DoesNotExist:
        return {'error': 'not_found'}

    audience = ann.audience_type
    users_qs = User.objects.filter(est_actif=True)

    if audience == 'all':
        recipients = users_qs
    elif audience == 'role':
        role = ann.audience_filter.get('role') if ann.audience_filter else None
        recipients = users_qs.filter(role=role) if role else User.objects.none()
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


if CELERY_AVAILABLE:
    @shared_task
    def process_announcement_job(announcement_id: int) -> Dict[str, Any]:
        return _process_announcement_sync(announcement_id)

    def enqueue_process_announcement(announcement_id: int):
        return process_announcement_job.delay(announcement_id)
else:
    # No Celery available: expose same function names but synchronous.
    def process_announcement_job(announcement_id: int):
        return _process_announcement_sync(announcement_id)

    def enqueue_process_announcement(announcement_id: int):
        return process_announcement_job(announcement_id)
