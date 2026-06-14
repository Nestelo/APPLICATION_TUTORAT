from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import EmailMessage, EmailReponse, AccuseReception
from .email_serializers import EmailMessageSerializer, EmailReponseSerializer, AccuseReceptionSerializer
from .brevo_api_client import BrevoAPIClient
from apps.accounts.permissions import IsAdmin
import uuid

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
        email = serializer.save(expediteur=self.request.user)
        
        # Générer un ID unique pour le suivi
        email_id_externe = str(uuid.uuid4())
        email.email_id_externe = email_id_externe
        
        # Mettre le statut à 'en_attente' (l'envoi se fera via l'action envoyer_email)
        email.statut = 'en_attente'
        email.save()
    
    @action(detail=True, methods=['post'])
    def envoyer_email(self, request, pk=None):
        """Envoyer un email (si statut en_attente ou echec) via API Brevo"""
        email = self.get_object()
        
        # Permettre l'envoi seulement si l'email n'est pas déjà envoyé
        if email.statut == 'envoye':
            return Response({
                'error': 'Cet email a déjà été envoyé avec succès'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        sujet = f"[TUTORAT] {email.sujet}"
        
        # Créer le contenu HTML pour l'email
        contenu_html = f"""
        <html>
        <body>
            <p>Cher/Chère {email.destinataire.prenom} {email.destinataire.nom},</p>
            <p>{email.contenu.replace(chr(10), '<br>')}</p>
            <hr>
            <p><em>Message envoyé via la plateforme de tutorat</em></p>
            <p><strong>ID de suivi:</strong> {email.email_id_externe}</p>
            <p><strong>Date:</strong> {email.date_envoi.strftime('%d/%m/%Y %H:%M')}</p>
        </body>
        </html>
        """
        
        try:
            # Utiliser l'API Brevo pour contourner les restrictions SMTP de Render
            brevo_client = BrevoAPIClient()
            
            # Tester la connexion API
            if not brevo_client.test_connection():
                print("** ERREUR: Impossible de se connecter à l'API Brevo **")
                # Fallback vers console backend si API échoue
                from django.core.mail import get_connection
                connection = get_connection(
                    backend='django.core.mail.backends.console.EmailBackend',
                    fail_silently=True
                )
                
                contenu_texte = f"""
Cher/Chère {email.destinataire.prenom} {email.destinataire.nom},

{email.contenu}

---
Message envoyé via la plateforme de tutorat
ID de suivi: {email.email_id_externe}
Date: {email.date_envoi.strftime('%d/%m/%Y %H:%M')}
                """
                
                result = send_mail(
                    sujet,
                    contenu_texte,
                    settings.DEFAULT_FROM_EMAIL,
                    [email.destinataire.email],
                    fail_silently=True,
                    connection=connection,
                )
                
                print(f"** EMAIL ENVOYÉ VIA CONSOLE (fallback) vers {email.destinataire.email} **")
                print('⚠️ API Brevo non disponible, email envoyé en mode console')
            else:
                # Envoyer via l'API Brevo
                result = brevo_client.send_email(
                    to_email=email.destinataire.email,
                    subject=sujet,
                    html_content=contenu_html,
                    sender_email=settings.DEFAULT_FROM_EMAIL,
                    sender_name="Plateforme Tutorat"
                )
                
                if result:
                    print(f"** EMAIL ENVOYÉ VIA API BREVO vers {email.destinataire.email} **")
                    print(f"** Sujet: {sujet} **")
                    print(f"** ID: {email.email_id_externe} **")
                    print(f"** Message ID Brevo: {result.get('messageId', 'N/A')} **")
                else:
                    raise Exception('Échec de l\'envoi via API Brevo')
            
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
                'message': 'Email envoyé avec succès via API Brevo'
            })
            
        except Exception as e:
            print(f"** ERREUR ENVOI EMAIL: {e} **")
            email.statut = 'echec'
            email.save()
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
    
    @action(detail=True, methods=['delete'])
    def supprimer_message_admin(self, request, pk=None):
        """Supprimer un message envoyé par un admin"""
        email = self.get_object()
        
        # Vérifier que l'utilisateur est un admin
        if request.user.role != 'admin':
            return Response({
                'error': 'Seul un administrateur peut supprimer des messages'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Vérifier que l'email a été envoyé par un admin
        if email.expediteur.role != 'admin':
            return Response({
                'error': 'Seuls les messages envoyés par un admin peuvent être supprimés'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Supprimer l'email et tous les éléments associés
        email_id = email.id
        sujet = email.sujet
        destinataire = f"{email.destinataire.prenom} {email.destinataire.nom}"
        
        # Supprimer les réponses associées
        EmailReponse.objects.filter(email=email).delete()
        
        # Supprimer les accusés de réception associés
        AccuseReception.objects.filter(email=email).delete()
        
        # Supprimer l'email lui-même
        email.delete()
        
        return Response({
            'success': True,
            'message': f'Message "{sujet}" envoyé à {destinataire} a été supprimé avec succès',
            'email_id': email_id
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
    
    def _get_client_ip(self, request):
        """Obtenir l'adresse IP du client"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
