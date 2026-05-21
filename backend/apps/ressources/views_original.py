from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Avg
from django.utils import timezone
from .models import Ressource as GlobalRessource, VersionRessource, CommentaireRessource, NoteRessource, FavoriRessource, Signalement
from apps.tutorat.models import Ressource as GroupeRessource
from .serializers import (
    RessourceSerializer, GroupeRessourceSerializer, VersionRessourceSerializer, CommentaireRessourceSerializer,
    NoteRessourceSerializer, FavoriRessourceSerializer, SignalementSerializer
)
from apps.accounts.permissions import IsTuteur, IsAdmin, IsAdminOuTuteur
from apps.notifications.models import Notification
from apps.tutorat.models import GroupeTutorat

class RessourceViewSet(viewsets.ModelViewSet):
    queryset = GlobalRessource.objects.all()
    serializer_class = RessourceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['matiere', 'niveau', 'type_fichier', 'statut']
    search_fields = ['titre', 'description', 'tags']
    ordering_fields = ['date_publication', 'nb_telechargements', 'nb_vues']
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Par défaut, ne montrer que les ressources publiées (sauf pour les admins et les auteurs)."""
        user = self.request.user
        if user.role == 'admin':
            return self.queryset
        return self.queryset.filter(Q(statut='publie') | Q(auteur=user))

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Seuls les tuteurs, enseignants et admins peuvent modifier/supprimer
            self.permission_classes = [IsAdminOuTuteur]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(auteur=self.request.user)

    def perform_update(self, serializer):
        """
        Workflow validation:
        - Les tuteurs/enseignants peuvent modifier leurs ressources,
          mais les modifications repassent en "en_attente" pour une re-validation admin.
        - Les admins valident/rejettent via endpoints dédiés.
        """
        instance = self.get_object()
        user = self.request.user
        if user.role in ['tuteur', 'enseignant'] and instance.auteur_id == user.id:
            serializer.save(statut='en_attente')
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def telecharger(self, request, pk=None):
        """Incrémente le compteur de téléchargements."""
        ressource = self.get_object()
        ressource.nb_telechargements += 1
        ressource.save(update_fields=['nb_telechargements'])
        # Retourner l'URL du fichier ou du lien
        if ressource.type_fichier in ['lien', 'video'] and ressource.lien_externe:
            # Pour les vidéos/ressources "lien", on ouvre l'URL externe.
            return Response({'lien': ressource.lien_externe})
        elif ressource.fichier:
            return Response({'fichier': ressource.fichier.url})
        return Response({'error': 'Aucun fichier ou lien disponible'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def vue(self, request, pk=None):
        """Incrémente le compteur de vues."""
        ressource = self.get_object()
        ressource.nb_vues += 1
        ressource.save(update_fields=['nb_vues'])
        return Response({'nb_vues': ressource.nb_vues})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def commenter(self, request, pk=None):
        """Ajouter un commentaire à une ressource."""
        ressource = self.get_object()
        contenu = request.data.get('contenu')
        if not contenu:
            return Response({'error': 'Le contenu du commentaire est requis'}, status=status.HTTP_400_BAD_REQUEST)
        commentaire = CommentaireRessource.objects.create(
            ressource=ressource,
            auteur=request.user,
            contenu=contenu
        )
        serializer = CommentaireRessourceSerializer(commentaire)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def noter(self, request, pk=None):
        """Noter une ressource (1-5)."""
        ressource = self.get_object()
        note_val = request.data.get('note')
        if not note_val:
            return Response({'error': 'La note est requise'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            note_val = int(note_val)
            if note_val < 1 or note_val > 5:
                raise ValueError
        except ValueError:
            return Response({'error': 'La note doit être un entier entre 1 et 5'}, status=status.HTTP_400_BAD_REQUEST)
        note, created = NoteRessource.objects.update_or_create(
            ressource=ressource,
            auteur=request.user,
            defaults={'note': note_val}
        )
        serializer = NoteRessourceSerializer(note)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def favori(self, request, pk=None):
        """Ajouter ou retirer des favoris."""
        ressource = self.get_object()
        favori, created = FavoriRessource.objects.get_or_create(
            utilisateur=request.user,
            ressource=ressource
        )
        if not created:
            favori.delete()
            return Response({'status': 'retiré des favoris'})
        return Response({'status': 'ajouté aux favoris'})

class CommentaireRessourceViewSet(viewsets.ModelViewSet):
    queryset = CommentaireRessource.objects.all()
    serializer_class = CommentaireRessourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            # Seul l'auteur ou un admin peut modifier/supprimer
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()

    def perform_update(self, serializer):
        if self.get_object().auteur != self.request.user and self.request.user.role != 'admin':
            raise permissions.PermissionDenied("Vous n'êtes pas l'auteur de ce commentaire.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.auteur != self.request.user and self.request.user.role != 'admin':
            raise permissions.PermissionDenied("Vous n'êtes pas l'auteur de ce commentaire.")
        instance.delete()

    @action(detail=True, methods=['post'])
    def signaler(self, request, pk=None):
        """Signaler un commentaire."""
        commentaire = self.get_object()
        motif = request.data.get('motif')
        if not motif:
            return Response({'error': 'Le motif du signalement est requis'}, status=status.HTTP_400_BAD_REQUEST)
        signalement = Signalement.objects.create(
            type_contenu='commentaire',
            id_contenu=commentaire.id,
            motif=motif,
            signalant=request.user
        )
        commentaire.signale = True
        commentaire.save(update_fields=['signale'])
        return Response({'status': 'commentaire signalé'})

class NoteRessourceViewSet(viewsets.ModelViewSet):
    queryset = NoteRessource.objects.all()
    serializer_class = NoteRessourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(auteur=self.request.user)

    def perform_create(self, serializer):
        serializer.save(auteur=self.request.user)

class FavoriRessourceViewSet(viewsets.ModelViewSet):
    queryset = FavoriRessource.objects.all()
    serializer_class = FavoriRessourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(utilisateur=self.request.user)

    def perform_create(self, serializer):
        serializer.save(utilisateur=self.request.user)

class SignalementViewSet(viewsets.ModelViewSet):
    queryset = Signalement.objects.all()
    serializer_class = SignalementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            self.permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy', 'list', 'retrieve']:
            self.permission_classes = [IsAdmin]  # Seul l'admin peut gérer les signalements
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(signalant=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def traiter(self, request, pk=None):
        """Marquer un signalement comme traité."""
        signalement = self.get_object()
        signalement.traite = True
        signalement.save(update_fields=['traite'])
        return Response({'status': 'signalement marqué comme traité'})

# ---------- Admin endpoints for resource management ----------

@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_list_ressources_en_attente(request):
    """Lister toutes les ressources en attente de validation."""
    ressources = GlobalRessource.objects.filter(statut='en_attente').order_by('-date_publication')
    serializer = RessourceSerializer(ressources, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_valider_ressource(request, pk):
    """Valider une ressource."""
    try:
        ressource = GlobalRessource.objects.get(pk=pk)
    except GlobalRessource.DoesNotExist:
        return Response({'error': 'Ressource introuvable'}, status=status.HTTP_404_NOT_FOUND)
    
    ressource.statut = 'publie'
    ressource.save(update_fields=['statut'])
    
    # Notifier l'auteur
    try:
        from apps.notifications.services import creer_notification
        creer_notification(
            ressource.auteur.id, 
            'validation_ressource',
            'Ressource validée',
            f'Votre ressource "{ressource.titre}" a été validée et publiée.'
        )
    except Exception:
        pass
    
    return Response({'status': 'ressource validée'})

@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_rejeter_ressource(request, pk):
    """Rejeter une ressource."""
    try:
        ressource = GlobalRessource.objects.get(pk=pk)
    except GlobalRessource.DoesNotExist:
        return Response({'error': 'Ressource introuvable'}, status=status.HTTP_404_NOT_FOUND)
    
    motif = (request.data.get('motif') or '').strip()
    if not motif:
        return Response({'error': 'Motif de rejet obligatoire'}, status=status.HTTP_400_BAD_REQUEST)
    ressource.statut = 'rejete'
    ressource.save(update_fields=['statut'])
    
    # Notifier l'auteur
    try:
        from apps.notifications.services import creer_notification
        creer_notification(
            ressource.auteur.id, 
            'validation_ressource',
            'Ressource rejetée', 
            f'Votre ressource "{ressource.titre}" a été rejetée. Motif: {motif}'
        )
    except Exception:
        pass
    
    return Response({'status': 'ressource rejetée'})


@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_apercu_validation(request, pk):
    """Aperçu avant validation: statistiques + commentaires récents."""
    try:
        ressource = GlobalRessource.objects.get(pk=pk)
    except GlobalRessource.DoesNotExist:
        return Response({'error': 'Ressource introuvable'}, status=status.HTTP_404_NOT_FOUND)

    notes_qs = ressource.notes.all()
    nb_notes = notes_qs.count()
    moyenne = notes_qs.aggregate(avg=Avg('note')).get('avg') if nb_notes else None

    commentaires_recents = ressource.commentaires.order_by('-date')[:3]

    data = {
        'ressource': {
            'id': ressource.id,
            'titre': ressource.titre,
            'description': ressource.description,
            'matiere': ressource.matiere,
            'niveau': ressource.niveau,
            'type_fichier': ressource.type_fichier,
            'tags': [t.strip() for t in (ressource.tags or '').split(',') if t.strip()],
            'statut': ressource.statut,
            'date_publication': ressource.date_publication,
        },
        'auteur': {
            'id': ressource.auteur.id,
            'email': ressource.auteur.email,
            'nom': ressource.auteur.nom,
            'prenom': ressource.auteur.prenom,
            'role': ressource.auteur.role,
        },
        'statistiques': {
            'nb_vues': ressource.nb_vues,
            'nb_telechargements': ressource.nb_telechargements,
            'nb_notes': nb_notes,
            'note_moyenne': float(moyenne) if moyenne is not None else 0,
            'nb_commentaires': ressource.commentaires.count(),
        },
        'commentaires_recents': [
            {
                'auteur': f'{c.auteur.prenom} {c.auteur.nom}',
                'contenu': c.contenu[:100] + ('...' if len(c.contenu) > 100 else ''),
                'date': c.date,
            }
            for c in commentaires_recents
        ],
        'fichier': {
            'url': ressource.fichier.url if ressource.fichier else None,
            'type': ressource.type_fichier,
        },
        'lien_externe': ressource.lien_externe if ressource.lien_externe else None,
    }
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_historique_validations(request, pk):
    """Historique des validations/réjections via notifications envoyées à l'auteur."""
    try:
        ressource = GlobalRessource.objects.get(pk=pk)
    except GlobalRessource.DoesNotExist:
        return Response({'error': 'Ressource introuvable'}, status=status.HTTP_404_NOT_FOUND)

    notifications = Notification.objects.filter(
        destinataire=ressource.auteur,
        type='validation_ressource',
    ).order_by('-date_creation')[:20]

    historique = [
        {
            'date': n.date_creation,
            'titre': n.titre,
            'message': n.message,
            'commentaire': n.message,
        }
        for n in notifications
    ]

    return Response({'ressource_id': ressource.id, 'historique': historique})

@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_list_signalements(request):
    """Lister tous les signalements non traités."""
    signalements = Signalement.objects.filter(traite=False).order_by('-date')
    serializer = SignalementSerializer(signalements, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_traiter_signalement(request, pk):
    """Marquer un signalement comme traité."""
    try:
        signalement = Signalement.objects.get(pk=pk)
    except Signalement.DoesNotExist:
        return Response({'error': 'Signalement introuvable'}, status=status.HTTP_404_NOT_FOUND)
    
    action = request.data.get('action', '')  # 'supprimer' ou 'ignorer'
    signalement.traite = True
    signalement.save(update_fields=['traite'])
    
    if action == 'supprimer':
        # Supprimer le contenu signalé
        if signalement.type_contenu == 'ressource':
            try:
                ressource = GlobalRessource.objects.get(id=signalement.id_contenu)
                ressource.delete()
                return Response({'status': 'ressource supprimée et signalement traité'})
            except GlobalRessource.DoesNotExist:
                pass
        elif signalement.type_contenu == 'commentaire':
            try:
                commentaire = CommentaireRessource.objects.get(id=signalement.id_contenu)
                commentaire.delete()
                return Response({'status': 'commentaire supprimé et signalement traité'})
            except CommentaireRessource.DoesNotExist:
                pass
    
    return Response({'status': 'signalement traité'})

# ---------- Endpoints pour les ressources de groupes ----------

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def ressources_groupe(request, groupe_id):
    """Lister les ressources validées d'un groupe spécifique."""
    try:
        # Vérifier que le groupe existe
        groupe = GroupeTutorat.objects.get(id=groupe_id)
        
        # Vérifier si l'utilisateur a accès au groupe
        is_member = False
        is_tutor = False
        is_admin = False
        
        # Vérifier si admin
        if hasattr(request.user, 'role') and request.user.role == 'admin':
            is_admin = True
            is_member = True
        
        # Vérifier si createur du groupe (tuteur)
        if groupe.createur == request.user:
            is_tutor = True
            is_member = True
        
        # Vérifier si membre inscrit
        if not is_member:
            try:
                from apps.tutorat.models import InscriptionGroupe
                inscription = InscriptionGroupe.objects.filter(
                    groupe=groupe,
                    etudiant=request.user,
                    statut='accepte'
                ).first()
                if inscription:
                    is_member = True
            except Exception:
                pass
        
        if not is_member:
            return Response(
                {'error': 'Vous n\'êtes pas membre de ce groupe'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Filtrer les ressources du groupe selon le statut
        
        if is_tutor or is_admin:
            # Tuteurs et admins voient toutes les ressources
            ressources = GroupeRessource.objects.filter(
                groupes_partages=groupe
            ).order_by('-date_creation')
        else:
            # Étudiants ne voient que les ressources validées
            ressources = GroupeRessource.objects.filter(
                groupes_partages=groupe,
                validee_par_admin=True
            ).order_by('-date_creation')
        
        serializer = GroupeRessourceSerializer(ressources, many=True, context={'request': request})
        return Response(serializer.data)
        
    except GroupeTutorat.DoesNotExist:
        return Response(
            {'error': 'Groupe introuvable'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Erreur serveur: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAdminOuTuteur])
def creer_ressource_groupe(request):
    """Créer une ressource pour des groupes spécifiques."""
    try:
        # Logging pour débogage
        print(f"DEBUG: Données reçues: {dict(request.data)}")
        print(f"DEBUG: Fichiers reçus: {dict(request.FILES)}")
        
        # Extraire les données du formulaire
        titre = request.data.get('titre')
        description = request.data.get('description')
        matiere = request.data.get('matiere')
        niveau = request.data.get('niveau')
        type_fichier = request.data.get('type')
        tags = request.data.get('tags', '')
        lien_externe = request.data.get('lien_externe', '')
        
        # Gestion des groupes_partages (peut être une chaîne ou une liste)
        groupes_ids = request.data.getlist('groupes_partages')
        if not groupes_ids and 'groupes_partages' in request.data:
            groupes_ids = [request.data.get('groupes_partages')]
        
        print(f"DEBUG: Groupes IDs extraits: {groupes_ids}")
        
        # Validation
        if not titre or not description or not matiere or not niveau or not type_fichier:
            return Response(
                {'error': 'Les champs titre, description, matière, niveau et type sont obligatoires'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if type_fichier == 'lien' and not lien_externe:
            return Response(
                {'error': 'L\'URL est obligatoire pour les liens'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if type_fichier != 'lien' and not request.FILES.get('fichier'):
            return Response(
                {'error': 'Le fichier est obligatoire pour ce type de ressource'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier que l'utilisateur est tuteur des groupes sélectionnés
        for groupe_id in groupes_ids:
            try:
                groupe = GroupeTutorat.objects.get(id=groupe_id)
                if groupe.createur != request.user and request.user.role != 'admin':
                    return Response(
                        {'error': f'Vous n\'êtes pas tuteur du groupe {groupe.nom}'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except GroupeTutorat.DoesNotExist:
                return Response(
                    {'error': f'Groupe {groupe_id} introuvable'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Créer la ressource
        ressource = GroupeRessource.objects.create(
            titre=titre,
            description=description,
            matiere=matiere,
            niveau=niveau,
            type=type_fichier,
            tags=tags,
            lien=lien_externe if type_fichier == 'lien' else '',
            createur=request.user,
            validee_par_admin=False  # En attente de validation admin
        )
        
        # Ajouter le fichier si présent
        if type_fichier != 'lien' and request.FILES.get('fichier'):
            ressource.fichier = request.FILES.get('fichier')
            ressource.save()
        
        # Associer aux groupes
        for groupe_id in groupes_ids:
            try:
                groupe = GroupeTutorat.objects.get(id=groupe_id)
                ressource.groupes_partages.add(groupe)
            except GroupeTutorat.DoesNotExist:
                pass  # Ignorer les groupes invalides
        
        # Notifier les admins
        try:
            from apps.notifications.services import creer_notification
            
            # Notifier tous les admins
            from apps.accounts.models import User
            admins = User.objects.filter(role='admin')
            for admin in admins:
                creer_notification(
                    admin.id,
                    'ressource_en_attente',
                    'Nouvelle ressource en attente',
                    f'Une nouvelle ressource "{titre}" attend votre validation.'
                )
        except Exception:
            pass
        
        serializer = GroupeRessourceSerializer(ressource)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'Erreur lors de la création: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def ressources_groupe_en_attente(request):
    """Lister toutes les ressources de groupe en attente de validation (pour les admins)."""
    if request.user.role != 'admin':
        return Response(
            {'error': 'Accès réservé aux administrateurs'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Récupérer toutes les ressources de groupe en attente
    ressources = GroupeRessource.objects.filter(validee_par_admin=False).order_by('-date_creation')
    serializer = GroupeRessourceSerializer(ressources, many=True)
    
    return Response({
        'count': ressources.count(),
        'results': serializer.data
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def valider_ressource_groupe(request, ressource_id):
    """Valider une ressource de groupe (admin seulement)."""
    if request.user.role != 'admin':
        return Response(
            {'error': 'Accès réservé aux administrateurs'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        ressource = GroupeRessource.objects.get(id=ressource_id)
        ressource.validee_par_admin = True
        ressource.admin_validateur = request.user
        ressource.date_validation = timezone.now()
        ressource.save()
        
        # Notifier le créateur de la ressource
        try:
            from apps.notifications.services import creer_notification
            creer_notification(
                ressource.createur.id,
                'ressource_validee',
                'Ressource validée',
                f'Votre ressource "{ressource.titre}" a été validée par l\'administrateur.'
            )
        except Exception:
            pass
        
        serializer = GroupeRessourceSerializer(ressource)
        return Response(serializer.data)
        
    except GroupeRessource.DoesNotExist:
        return Response(
            {'error': 'Ressource introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def rejeter_ressource_groupe(request, ressource_id):
    """Rejeter une ressource de groupe (admin seulement)."""
    if request.user.role != 'admin':
        return Response(
            {'error': 'Accès réservé aux administrateurs'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        ressource = GroupeRessource.objects.get(id=ressource_id)
        
        # Supprimer la ressource rejetée
        titre = ressource.titre
        createur = ressource.createur
        
        ressource.delete()
        
        # Notifier le créateur du rejet
        try:
            from apps.notifications.services import creer_notification
            creer_notification(
                createur.id,
                'ressource_rejetee',
                'Ressource rejetée',
                f'Votre ressource "{titre}" a été rejetée par l\'administrateur.'
            )
        except Exception:
            pass
        
        return Response({
            'message': 'Ressource rejetée et supprimée avec succès',
            'titre': titre
        })
        
    except GroupeRessource.DoesNotExist:
        return Response(
            {'error': 'Ressource introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def statistiques_ressources_groupe(request, groupe_id):
    """Statistiques des ressources pour un groupe."""
    try:
        # Vérifier que l'utilisateur est tuteur du groupe ou admin
        groupe = GroupeTutorat.objects.get(id=groupe_id)
        
        if groupe.createur != request.user and request.user.role != 'admin':
            return Response(
                {'error': 'Accès non autorisé'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        ressources = GroupeRessource.objects.filter(groupes_partages=groupe)
        
        # Statistiques générales
        stats = {
            'total_ressources': ressources.count(),
            'ressources_validees': ressources.filter(validee_par_admin=True).count(),
            'ressources_en_attente': ressources.filter(validee_par_admin=False).count(),
            'total_telechargements': sum(r.telechargements for r in ressources),
            'total_vues': sum(r.vues for r in ressources),
        }
        
        # Statistiques par type
        stats_par_type = {}
        for ressource in ressources:
            type_key = ressource.type
            if type_key not in stats_par_type:
                stats_par_type[type_key] = {
                    'count': 0,
                    'telechargements': 0,
                    'vues': 0,
                    'note_moyenne': 0,
                    'nb_notes': 0
                }
            
            stats_par_type[type_key]['count'] += 1
            stats_par_type[type_key]['telechargements'] += ressource.telechargements
            stats_par_type[type_key]['vues'] += ressource.vues
        
        # Calculer les notes moyennes
        for type_key in stats_par_type:
            ressources_type = ressources.filter(type=type_key)
            notes = []
            for ressource in ressources_type:
                notes.extend([note.note for note in ressource.notes.all()])
            
            if notes:
                stats_par_type[type_key]['note_moyenne'] = sum(notes) / len(notes)
                stats_par_type[type_key]['nb_notes'] = len(notes)
        
        stats['par_type'] = stats_par_type
        
        # Ressources les plus populaires
        ressources_populaires = ressources.filter(
            statut='publie'
        ).order_by('-nb_telechargements')[:5]
        
        stats['plus_populaires'] = [
            {
                'id': r.id,
                'titre': r.titre,
                'type': r.type_fichier,
                'telechargements': r.nb_telechargements,
                'note_moyenne': r.notes.aggregate(avg=Avg('note'))['avg'] or 0
            }
            for r in ressources_populaires
        ]
        
        return Response(stats)
        
    except GroupeTutorat.DoesNotExist:
        return Response(
            {'error': 'Groupe introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )