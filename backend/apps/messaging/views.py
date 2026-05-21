from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Count
from django.utils import timezone
from apps.tutorat.models import GroupeTutorat
from .models import MembreGroupe, MessageGroupe, FichierGroupe, ExerciceGroupe, SessionTutorat
from .serializers import (
    MembreGroupeSerializer, MessageGroupeSerializer,
    FichierGroupeSerializer, ExerciceGroupeSerializer, SessionTutoratSerializer
)
from apps.notifications.services import creer_notification
from apps.accounts.models import User

class MessageGroupeViewSet(viewsets.ModelViewSet):
    serializer_class = MessageGroupeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        groupe_id = self.request.query_params.get('groupe')
        if groupe_id:
            # Vérifier que l'utilisateur est bien membre du groupe
            if not self._est_membre_groupe(int(groupe_id)):
                return MessageGroupe.objects.none()  # Ne retourner aucun message si non membre
            
            return MessageGroupe.objects.filter(
                groupe_id=groupe_id,
                est_supprime=False
            ).select_related('auteur')
        return MessageGroupe.objects.filter(est_supprime=False)

    def _est_membre_groupe(self, groupe_id):
        """Vérifier si l'utilisateur actuel est membre du groupe"""
        from apps.tutorat.models import InscriptionGroupe, GroupeTutorat
        
        user = self.request.user
        
        # Le tuteur/créateur du groupe a toujours accès
        try:
            groupe = GroupeTutorat.objects.get(id=groupe_id)
            if groupe.createur_id == user.id:
                return True
        except GroupeTutorat.DoesNotExist:
            return False
        
        # Vérifier si l'utilisateur est un étudiant accepté dans le groupe
        return InscriptionGroupe.objects.filter(
            groupe_id=groupe_id,
            etudiant=user,
            statut='accepte'
        ).exists()

    def perform_create(self, serializer):
        groupe_id = serializer.validated_data.get('groupe')
        
        # Vérifier que l'utilisateur peut envoyer des messages dans ce groupe
        if not self._est_membre_groupe(groupe_id.id):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Vous n'êtes pas membre de ce groupe")
        
        message = serializer.save(auteur=self.request.user)
        # Notifier les autres membres du groupe
        self.notifier_membres_groupe(message.groupe, message)

    @action(detail=True, methods=['post'])
    def marquer_important(self, request, pk=None):
        """Marquer un message comme important"""
        message = self.get_object()
        # Logique pour marquer comme important
        return Response({'status': 'Message marqué comme important'})

    def notifier_membres_groupe(self, groupe, message):
        """Notifier tous les membres du groupe sauf l'auteur"""
        # Utiliser les inscriptions acceptées du groupe
        from apps.tutorat.models import InscriptionGroupe
        membres = InscriptionGroupe.objects.filter(
            groupe=groupe, 
            statut='accepte'
        ).select_related('etudiant')
        
        for membre in membres:
            if membre.etudiant != message.auteur:
                creer_notification(
                    membre.etudiant.id, 'message_groupe',
                    f'Nouveau message dans {groupe.nom}',
                    f'{message.auteur.get_full_name()} a envoyé un message'
                )

class FichierGroupeViewSet(viewsets.ModelViewSet):
    serializer_class = FichierGroupeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        groupe_id = self.request.query_params.get('groupe')
        if groupe_id:
            return FichierGroupe.objects.filter(groupe_id=groupe_id)
        return FichierGroupe.objects.all()

    def perform_create(self, serializer):
        fichier = serializer.save(auteur=self.request.user)
        # Notifier les membres du groupe
        creer_notification(
            fichier.groupe.id, 'fichier_groupe',
            f'Nouveau fichier: {fichier.titre}',
            f'{fichier.auteur.get_full_name()} a partagé un fichier'
        )

class ExerciceGroupeViewSet(viewsets.ModelViewSet):
    serializer_class = ExerciceGroupeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        groupe_id = self.request.query_params.get('groupe')
        if groupe_id:
            return ExerciceGroupe.objects.filter(groupe_id=groupe_id)
        return ExerciceGroupe.objects.all()

    def perform_create(self, serializer):
        exercice = serializer.save(auteur=self.request.user)
        # Notifier les étudiants
        creer_notification(
            exercice.groupe.id, 'exercice_groupe',
            f'Nouvel exercice: {exercice.titre}',
            f'{exercice.auteur.get_full_name()} a publié un exercice'
        )

class SessionTutoratViewSet(viewsets.ModelViewSet):
    serializer_class = SessionTutoratSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['tuteur', 'enseignant']:
            return SessionTutorat.objects.filter(groupe__tuteur=user)
        else:
            return SessionTutorat.objects.filter(participants=user)

    def perform_create(self, serializer):
        session = serializer.save()
        # Ajouter le tuteur comme participant par défaut
        session.participants.add(session.groupe.tuteur)
        # Notifier les membres
        self.notifier_session(session)

    @action(detail=True, methods=['post'])
    def rejoindre(self, request, pk=None):
        """Rejoindre une session"""
        session = self.get_object()
        if request.user not in session.participants.all():
            session.participants.add(request.user)
            return Response({'message': 'Vous avez rejoint la session'})
        return Response({'message': 'Vous êtes déjà participant'})

    @action(detail=True, methods=['post'])
    def quitter(self, request, pk=None):
        """Quitter une session"""
        session = self.get_object()
        if request.user in session.participants.all():
            session.participants.remove(request.user)
            return Response({'message': 'Vous avez quitté la session'})
        return Response({'message': 'Vous n\'êtes pas participant'})

    def notifier_session(self, session):
        """Notifier les membres du groupe pour la session"""
        membres = MembreGroupe.objects.filter(groupe=session.groupe, est_actif=True)
        for membre in membres:
            creer_notification(
                membre.etudiant.id, 'session_tutorat',
                f'Nouvelle session: {session.titre}',
                f'Une session de tutorat est prévue le {session.date_debut.strftime("%d/%m/%Y %H:%M")}'
            )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_direct_message(request):
    """
    Envoyer un message direct à un utilisateur
    """
    try:
        destinataire_id = request.data.get('destinataire_id')
        sujet = request.data.get('sujet', 'Message de l\'administrateur')
        contenu = request.data.get('contenu', '')
        
        if not destinataire_id or not contenu:
            return Response({
                'success': False,
                'error': 'Destinataire et contenu sont requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier que le destinataire existe
        try:
            destinataire = User.objects.get(id=destinataire_id)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Destinataire introuvable'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Créer une notification pour le message
        creer_notification(
            destinataire_id,
            'message_admin',
            sujet,
            contenu,
            f'/messages/admin'
        )
        
        print(f"Message envoyé de {request.user.email} à {destinataire.email}: {sujet}")
        
        return Response({
            'success': True,
            'message': 'Message envoyé avec succès'
        })
        
    except Exception as e:
        print(f"Erreur envoi message direct: {e}")
        return Response({
            'success': False,
            'error': 'Erreur lors de l\'envoi du message'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
