from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from .models import EmailMessage, EmailReponse, AccuseReception
from .email_serializers import EmailMessageSerializer, EmailReponseSerializer, AccuseReceptionSerializer
from apps.accounts.permissions import IsAdmin
import uuid
import requests
from django.conf import settings

class EmailMessageViewSet(viewsets.ModelViewSet):
    """Gestion des messages email"""
    serializer_class = EmailMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['expediteur', 'destinataire', 'statut']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return EmailMessage.objects.all()
        return EmailMessage.objects.filter(
            Q(expediteur=user) | Q(destinataire=user)
        )
    
    def perform_create(self, serializer):
        serializer.save(expediteur=self.request.user)
    
    @action(detail=True, methods=['post'])
    def envoyer_email(self, request, pk=None):
        """Envoyer l'email et générer l'accusé de réception"""
        email = self.get_object()
        
        try:
            # Générer un ID unique pour le suivi
            email_id_externe = str(uuid.uuid4())
            email.email_id_externe = email_id_externe
            email.save()
            
            # Envoyer l'email réel avec Django SMTP
            success = self._envoyer_email_reel(email, email_id_externe)
            
            if success:
                # Créer l'accusé de réception d'envoi
                AccuseReception.objects.create(
                    email=email,
                    type_accus='envoi',
                    ip_adresse=self._get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                
                email.statut = 'envoye'
                email.save()
                
                return Response({
                    'success': True,
                    'message': 'Email envoyé avec succès',
                    'email_id': email_id_exterre
                })
            else:
                return Response({
                    'success': False,
                    'error': 'Échec de l\'envoi de l\'email'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def marquer_recu(self, request, pk=None):
        """Marquer l'email comme reçu (accusé de réception)"""
        email = self.get_object()
        
        if email.statut != 'envoye':
            return Response({
                'error': 'Cet email n\'est pas dans un état permettant la réception'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        email.statut = 'recu'
        email.date_reception = timezone.now()
        email.save()
        
        # Créer l'accusé de réception
        AccuseReception.objects.create(
            email=email,
            type_accus='reception',
            ip_adresse=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({
            'success': True,
            'message': 'Email marqué comme reçu',
            'date_reception': email.date_reception
        })
    
    @action(detail=True, methods=['post'])
    def marquer_lu(self, request, pk=None):
        """Marquer l'email comme lu"""
        email = self.get_object()
        
        if email.statut not in ['recu', 'repondu']:
            return Response({
                'error': 'Cet email doit d\'abord être reçu'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        email.statut = 'lu'
        email.date_lecture = timezone.now()
        email.save()
        
        # Créer l'accusé de lecture
        AccuseReception.objects.create(
            email=email,
            type_accus='lecture',
            ip_adresse=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({
            'success': True,
            'message': 'Email marqué comme lu',
            'date_lecture': email.date_lecture
        })
    
    @action(detail=True, methods=['post'])
    def repondre(self, request, pk=None):
        """Répondre à un email"""
        email = self.get_object()
        contenu = request.data.get('contenu')
        
        if not contenu:
            return Response({
                'error': 'Le contenu de la réponse est requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Créer la réponse
        reponse = EmailReponse.objects.create(
            email_original=email,
            auteur=request.user,
            contenu=contenu
        )
        
        # Mettre à jour le statut de l'email original
        if email.statut != 'repondu':
            email.statut = 'repondu'
            email.save()
        
        # Envoyer une notification à l'expéditeur original
        self._envoyer_notification_reponse(email, reponse)
        
        serializer = EmailReponseSerializer(reponse)
        return Response({
            'success': True,
            'message': 'Réponse envoyée avec succès',
            'reponse': serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def conversation(self, request, pk=None):
        """Voir la conversation complète (email original + réponses)"""
        email = self.get_object()
        reponses = email.reponses.all().order_by('date_envoi')
        
        email_serializer = EmailMessageSerializer(email)
        reponses_serializer = EmailReponseSerializer(reponses, many=True)
        
        return Response({
            'email': email_serializer.data,
            'reponses': reponses_serializer.data,
            'total_reponses': reponses.count()
        })
    
    @action(detail=False, methods=['get'])
    def mes_emails(self, request):
        """Voir tous les emails de l'utilisateur connecté"""
        user = request.user
        emails_envoyes = EmailMessage.objects.filter(expediteur=user)
        emails_recus = EmailMessage.objects.filter(destinataire=user)
        
        # Combiner et trier par date
        emails = (emails_envoyes | emails_recus).order_by('-date_envoi')
        
        page = self.paginate_queryset(emails)
        serializer = self.get_serializer(page, many=True)
        
        return self.get_paginated_response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def statistiques(self, request):
        """Statistiques des emails (admin seulement)"""
        total_emails = EmailMessage.objects.count()
        emails_envoyes = EmailMessage.objects.filter(statut='envoye').count()
        emails_recus = EmailMessage.objects.filter(statut='recu').count()
        emails_lus = EmailMessage.objects.filter(statut='lu').count()
        emails_repondus = EmailMessage.objects.filter(statut='repondu').count()
        
        return Response({
            'total_emails': total_emails,
            'emails_envoyes': emails_envoyes,
            'emails_recus': emails_recus,
            'emails_lus': emails_lus,
            'emails_repondus': emails_repondus,
            'taux_reception': (emails_recus / total_emails * 100) if total_emails > 0 else 0,
            'taux_lecture': (emails_lus / total_emails * 100) if total_emails > 0 else 0,
            'taux_reponse': (emails_repondus / total_emails * 100) if total_emails > 0 else 0,
        })
    
    def _envoyer_email_reel(self, email, email_id_externe):
        """Envoyer l'email réel avec Django SMTP"""
        try:
            from django.core.mail import send_mail
            from django.conf import settings
            
            # Créer le contenu de l'email avec tracking
            sujet = f"[TUTORAT] {email.sujet}"
            contenu = f"""
Cher/Chère {email.destinataire.prenom} {email.destinataire.nom},

{email.contenu}

---
Cet email a été envoyé via le système de messagerie de la plateforme de tutorat.
ID de suivi: {email_id_externe}
Date d'envoi: {email.date_envoi.strftime('%d/%m/%Y %H:%M')}

Pour répondre à cet email, utilisez simplement le bouton "Répondre" de votre client email.
            """
            
            # Envoyer l'email avec Django
            send_mail(
                sujet=sujet,
                message=contenu,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email.destinataire.email],
                fail_silently=False,
            )
            
            print(f"✅ Email réel envoyé à {email.destinataire.email}")
            print(f"📧 Sujet: {sujet}")
            print(f"🆔 ID: {email_id_externe}")
            
            return True
            
        except Exception as e:
            print(f"❌ Erreur envoi email SMTP: {e}")
            return False
    
    def _envoyer_notification_reponse(self, email_original, reponse):
        """Envoyer une notification pour une nouvelle réponse"""
        try:
            # Créer une notification dans le système
            from apps.notifications.models import Notification
            
            Notification.objects.create(
                destinataire=email_original.expediteur,
                type='reponse_email',
                titre=f'Réponse à votre email: {email_original.sujet}',
                message=f'{reponse.auteur.prenom} {reponse.auteur.nom} a répondu à votre email',
                lien=f'/emails/{email_original.id}/conversation'
            )
            
            return True
        except Exception as e:
            print(f"Erreur notification réponse: {e}")
            return False
    
    def _get_client_ip(self, request):
        """Obtenir l'adresse IP du client"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
