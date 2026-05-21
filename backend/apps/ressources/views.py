from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Avg
from django.utils import timezone
from .models import Ressource as GlobalRessource, VersionRessource, CommentaireRessource, NoteRessource, FavoriRessource, Signalement, PartageRessource
from apps.tutorat.models import Ressource as GroupeRessource
from .serializers import (
    RessourceSerializer, GroupeRessourceSerializer, VersionRessourceSerializer, CommentaireRessourceSerializer,
    NoteRessourceSerializer, FavoriRessourceSerializer, SignalementSerializer, PartageRessourceSerializer, PartageRessourceCreateSerializer
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
            return GlobalRessource.objects.all()
        elif user.is_authenticated:
            # L'auteur voit toutes ses ressources
            return GlobalRessource.objects.filter(
                Q(auteur=user) | Q(statut='publie')
            ).distinct()
        else:
            return GlobalRessource.objects.filter(statut='publie')

    def perform_create(self, serializer):
        """Créer une ressource avec l'utilisateur connecté comme auteur."""
        serializer.save(auteur=self.request.user, statut='en_attente')

    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
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

    @action(detail=True, methods=['post'])
    def noter(self, request, pk=None):
        """Noter une ressource."""
        ressource = self.get_object()
        note_val = request.data.get('note')
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
        return Response({'note': note.note, 'created': created})

    @action(detail=True, methods=['post'])
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

    @action(detail=True, methods=['post'])
    def vue(self, request, pk=None):
        """Enregistrer la consultation d'une ressource."""
        ressource = self.get_object()
        # Incrémenter le compteur de vues
        ressource.nb_vues += 1
        ressource.save(update_fields=['nb_vues'])
        
        # Créer une consultation (si le modèle existe)
        try:
            from apps.ressources.models import ConsultationRessource
            consultation, created = ConsultationRessource.objects.get_or_create(
                utilisateur=request.user,
                ressource=ressource,
                defaults={'date_consultation': timezone.now()}
            )
            if not created:
                consultation.date_consultation = timezone.now()
                consultation.save(update_fields=['date_consultation'])
        except ImportError:
            # Si le modèle ConsultationRessource n'existe pas, on continue sans
            pass
        
        return Response({'status': 'consultation enregistrée', 'nb_vues': ressource.nb_vues})

    @action(detail=True, methods=['post'])
    def telecharger(self, request, pk=None):
        """Incrémenter le compteur de téléchargements et enregistrer le téléchargement."""
        ressource = self.get_object()
        
        # Incrémenter le compteur de téléchargements
        ressource.nb_telechargements += 1
        ressource.save(update_fields=['nb_telechargements'])
        
        # Créer un enregistrement de téléchargement (si le modèle existe)
        try:
            from apps.ressources.models import TelechargementRessource
            telechargement, created = TelechargementRessource.objects.get_or_create(
                utilisateur=request.user,
                ressource=ressource,
                defaults={'date_telechargement': timezone.now()}
            )
            if not created:
                telechargement.date_telechargement = timezone.now()
                telechargement.save(update_fields=['date_telechargement'])
        except ImportError:
            # Si le modèle TelechargementRessource n'existe pas, on continue sans
            pass
        
        return Response({
            'status': 'téléchargement enregistré', 
            'nb_telechargements': ressource.nb_telechargements,
            'fichier_url': ressource.fichier.url if ressource.fichier else None
        })

class CommentaireRessourceViewSet(viewsets.ModelViewSet):
    queryset = CommentaireRessource.objects.all()
    serializer_class = CommentaireRessourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(auteur=self.request.user)

class NoteRessourceViewSet(viewsets.ModelViewSet):
    queryset = NoteRessource.objects.all()
    serializer_class = NoteRessourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(auteur=self.request.user)

class FavoriRessourceViewSet(viewsets.ModelViewSet):
    queryset = FavoriRessource.objects.all()
    serializer_class = FavoriRessourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(utilisateur=self.request.user)

class SignalementViewSet(viewsets.ModelViewSet):
    queryset = Signalement.objects.all()
    serializer_class = SignalementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(auteur=self.request.user)

# ---------- API endpoints pour les ressources de groupe ----------

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def ressources_groupe(request, groupe_id):
    """Lister les ressources d'un groupe spécifique."""
    try:
        groupe = GroupeTutorat.objects.get(id=groupe_id)
        user = request.user
        
        # Vérifier que l'utilisateur a accès au groupe
        is_tutor = user.role == 'tuteur' and user == groupe.createur
        is_admin = user.role == 'admin'
        is_member = groupe.inscriptions.filter(etudiant=user, statut='accepte').exists()
        
        if not (is_tutor or is_admin or is_member):
            return Response(
                {'error': 'Vous n\'êtes pas membre de ce groupe'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Filtrer les ressources du groupe selon le statut
        if is_tutor or is_admin:
            # Tuteurs et admins voient toutes les ressources
            ressources = GroupeRessource.objects.filter(
                groupes_partages=groupe
            )
        else:
            # Étudiants ne voient que les ressources validées
            ressources = GroupeRessource.objects.filter(
                groupes_partages=groupe,
                validee_par_admin=True
            )
        
        # Appliquer le filtre par type si spécifié
        type_filter = request.GET.get('type')
        if type_filter and type_filter != 'toutes':
            ressources = ressources.filter(type=type_filter)
        
        ressources = ressources.order_by('-date_creation')
        
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

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def detail_ressource_groupe(request, groupe_id, ressource_id):
    """Récupérer les détails d'une ressource spécifique d'un groupe."""
    try:
        groupe = GroupeTutorat.objects.get(id=groupe_id)
        user = request.user
        
        # Vérifier que l'utilisateur a accès au groupe
        is_tutor = user.role == 'tuteur' and user == groupe.createur
        is_admin = user.role == 'admin'
        is_member = groupe.inscriptions.filter(etudiant=user, statut='accepte').exists()
        
        if not (is_tutor or is_admin or is_member):
            return Response(
                {'error': 'Vous n\'êtes pas membre de ce groupe'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Récupérer la ressource spécifique
        try:
            ressource = GroupeRessource.objects.get(
                id=ressource_id,
                groupes_partages=groupe
            )
        except GroupeRessource.DoesNotExist:
            return Response(
                {'error': 'Ressource introuvable dans ce groupe'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Vérifier que l'étudiant ne voit que les ressources validées
        if not (is_tutor or is_admin) and not ressource.validee_par_admin:
            return Response(
                {'error': 'Cette ressource n\'est pas encore validée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = GroupeRessourceSerializer(ressource, context={'request': request})
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
        # Logging détaillé pour débogage
        print(f"DEBUG: request.data type: {type(request.data)}")
        print(f"DEBUG: request.FILES type: {type(request.FILES)}")
        print(f"DEBUG: Données reçues: {dict(request.data)}")
        print(f"DEBUG: Fichiers reçus: {dict(request.FILES)}")
        print(f"DEBUG: Content-Type: {request.content_type}")
        print(f"DEBUG: request.FILES keys: {list(request.FILES.keys())}")
        print(f"DEBUG: request.data keys: {list(request.data.keys())}")
        
        # Vérifier spécifiquement le champ 'fichier'
        if 'fichier' in request.FILES:
            print(f"DEBUG: Fichier trouvé dans request.FILES: {request.FILES['fichier']}")
        elif 'fichier' in request.data:
            print(f"DEBUG: Fichier trouvé dans request.data: {request.data['fichier']}")
        else:
            print("DEBUG: Aucun fichier trouvé ni dans request.FILES ni dans request.data")
        
        # Extraire les données du formulaire
        titre = request.data.get('titre')
        description = request.data.get('description')
        matiere = request.data.get('matiere')
        niveau = request.data.get('niveau')
        type_fichier = request.data.get('type')
        tags = request.data.get('tags', '')
        lien_externe = request.data.get('lien_externe', '')
        
        # Gestion des groupes_partages (peut être une chaîne ou une liste)
        groupes_ids = None
        if hasattr(request.data, 'getlist'):
            # Cas QueryDict (formulaire normal)
            groupes_ids = request.data.getlist('groupes_partages')
        else:
            # Cas FormData (multipart/form-data)
            groupes_ids = request.data.get('groupes_partages')
        
        # S'assurer que c'est une liste
        if isinstance(groupes_ids, str):
            groupes_ids = [groupes_ids]
        elif groupes_ids is None:
            groupes_ids = []
        
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
                pass
        
        serializer = GroupeRessourceSerializer(ressource, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return Response(
            {'error': f'Erreur serveur: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ---------- Admin endpoints for group resource management ----------

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
            validee_par_admin=True
        ).order_by('-telechargements')[:5]
        
        stats['plus_populaires'] = [
            {
                'id': r.id,
                'titre': r.titre,
                'telechargements': r.telechargements,
                'vues': r.vues,
                'note_moyenne': r.notes.aggregate(avg=Avg('note')).get('avg') or 0
            }
            for r in ressources_populaires
        ]
        
        return Response(stats)
        
    except GroupeTutorat.DoesNotExist:
        return Response(
            {'error': 'Groupe introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )

# ---------- Admin endpoints for global resource management ----------

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
    ressource.commentaire_rejet = motif
    ressource.save(update_fields=['statut', 'commentaire_rejet'])
    
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
            'date_publication': ressource.date_publication,
            'auteur': ressource.auteur.email if ressource.auteur else None,
            'statut': ressource.statut,
            'nb_telechargements': ressource.nb_telechargements,
            'nb_vues': ressource.nb_vues,
            'fichier': ressource.fichier.url if ressource.fichier else None,
            'lien_externe': ressource.lien_externe if ressource.lien_externe else None,
        },
        'statistiques': {
            'nb_notes': nb_notes,
            'note_moyenne': round(moyenne, 2) if moyenne else None,
            'nb_commentaires': ressource.commentaires.count(),
            'nb_favoris': ressource.favoriressource_set.count(),
        },
        'commentaires_recents': [
            {
                'id': c.id,
                'auteur': c.auteur.email if c.auteur else 'Anonyme',
                'contenu': c.contenu[:100] + '...' if len(c.contenu) > 100 else c.contenu,
                'date': c.date,
                'note': c.note if hasattr(c, 'note') else None,
            }
            for c in commentaires_recents
        ],
    }
    return Response(data)

@api_view(['GET'])
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
            'type': n.type,
            'titre': n.titre,
            'message': n.message,
        }
        for n in notifications
    ]

    return Response({
        'ressource': {
            'id': ressource.id,
            'titre': ressource.titre,
            'auteur': ressource.auteur.email if ressource.auteur else None,
        },
        'historique': historique,
    })

@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_list_signalements(request):
    """Lister tous les signalements en attente de traitement."""
    signalements = Signalement.objects.filter(traite=False).order_by('-date_creation')
    serializer = SignalementSerializer(signalements, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_traiter_signalement(request, signalement_id):
    """Traiter un signalement (supprimer le contenu signalé ou ignorer)."""
    try:
        signalement = Signalement.objects.get(id=signalement_id)
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

# ---------- API endpoints pour la publication des ressources de groupe ----------

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def publier_ressource_groupe(request, ressource_id):
    """Publier une ressource de groupe pour les étudiants."""
    try:
        ressource = GroupeRessource.objects.get(id=ressource_id)
        user = request.user
        
        # Vérifier que l'utilisateur est le créateur ou admin
        if ressource.createur != user and user.role != 'admin':
            return Response(
                {'error': 'Vous n\'êtes pas autorisé à publier cette ressource'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Vérifier que la ressource est validée par admin
        if not ressource.validee_par_admin:
            return Response(
                {'error': 'La ressource doit être validée par l\'admin avant publication'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Marquer comme publiée
        ressource.publiee = True
        ressource.date_publication = timezone.now()
        ressource.save()
        
        # Notifier les étudiants du groupe
        for groupe in ressource.groupes_partages.all():
            etudiants = groupe.inscriptions.filter(statut='accepte')
            
            for inscription in etudiants:
                creer_notification(
                    destinataire=inscription.etudiant,
                    type_notification='ressource_publiee',
                    titre=f'Nouvelle ressource: {ressource.titre}',
                    message=f'Une nouvelle ressource "{ressource.titre}" a été publiée dans le groupe {groupe.nom}',
                    objet_id=ressource.id,
                    objet_type='ressource'
                )
        
        serializer = GroupeRessourceSerializer(ressource, context={'request': request})
        return Response({
            'success': True,
            'message': 'Ressource publiée avec succès',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
        
    except GroupeRessource.DoesNotExist:
        return Response(
            {'error': 'Ressource introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"ERROR publier_ressource_groupe: {str(e)}")
        return Response(
            {'error': f'Erreur serveur: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ---------- API pour les statistiques de téléchargement ----------

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def incrementer_telechargement_ressource_groupe(request, ressource_id):
    """Incrémenter le compteur de téléchargement d'une ressource de groupe."""
    try:
        ressource = GroupeRessource.objects.get(id=ressource_id)
        ressource.telechargements += 1
        ressource.save()
        
        return Response({
            'success': True,
            'telechargements': ressource.telechargements
        }, status=status.HTTP_200_OK)
        
    except GroupeRessource.DoesNotExist:
        return Response(
            {'error': 'Ressource introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Erreur serveur: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return Response({'status': 'signalement traité'})

# ---------- API pour le partage de ressources entre étudiants ----------

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def partager_ressource(request):
    """Partager une ressource existante avec un autre étudiant"""
    try:
        serializer = PartageRessourceCreateSerializer(
            data=request.data, 
            context={'request': request}
        )
        
        if serializer.is_valid():
            # Créer le partage
            partage = serializer.save(expediteur=request.user)
            
            # Créer une notification pour le destinataire
            Notification.objects.create(
                destinataire=partage.destinataire,
                type='autre',
                titre='📚 Nouvelle ressource partagée',
                message=f'{request.user.get_full_name()} vous a partagé la ressource "{partage.ressource.titre}"',
                lien=f'/ressources/{partage.ressource.id}'
            )
            
            # Retourner les détails du partage
            partage_serializer = PartageRessourceSerializer(partage, context={'request': request})
            
            return Response({
                'success': True,
                'message': 'Ressource partagée avec succès!',
                'data': partage_serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        print(f"ERROR partager_ressource: {str(e)}")
        return Response(
            {'error': f'Erreur serveur: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def ressources_recues(request):
    """Obtenir la liste des ressources reçues par l'utilisateur"""
    try:
        partages = PartageRessource.objects.filter(
            destinataire=request.user
        ).order_by('-date_partage')
        
        serializer = PartageRessourceSerializer(
            partages, 
            many=True, 
            context={'request': request}
        )
        
        return Response(serializer.data)
        
    except Exception as e:
        print(f"ERROR ressources_recues: {str(e)}")
        return Response(
            {'error': f'Erreur serveur: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def ressources_envoyees(request):
    """Obtenir la liste des ressources envoyées par l'utilisateur"""
    try:
        partages = PartageRessource.objects.filter(
            expediteur=request.user
        ).order_by('-date_partage')
        
        serializer = PartageRessourceSerializer(
            partages, 
            many=True, 
            context={'request': request}
        )
        
        return Response(serializer.data)
        
    except Exception as e:
        print(f"ERROR ressources_envoyees: {str(e)}")
        return Response(
            {'error': f'Erreur serveur: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def marquer_partage_lu(request, partage_id):
    """Marquer un partage comme lu"""
    try:
        partage = PartageRessource.objects.get(
            id=partage_id,
            destinataire=request.user
        )
        
        partage.marquer_comme_lue()
        
        return Response({
            'success': True,
            'message': 'Partage marqué comme lu'
        })
        
    except PartageRessource.DoesNotExist:
        return Response(
            {'error': 'Partage introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"ERROR marquer_partage_lu: {str(e)}")
        return Response(
            {'error': f'Erreur serveur: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def etudiants_actifs(request):
    """Obtenir la liste de tous les étudiants actifs pour le partage de ressources"""
    try:
        from apps.accounts.models import User
        
        # Récupérer tous les étudiants actifs sauf l'utilisateur courant
        etudiants = User.objects.filter(
            role='etudiant',
            is_active=True
        ).exclude(id=request.user.id).order_by('prenom', 'nom')
        
        # Serializer simple pour les étudiants
        etudiants_data = []
        for etudiant in etudiants:
            photo_url = ''
            if etudiant.photo:
                photo_url = f"http://192.168.43.210:8000/media/{etudiant.photo}"
            
            etudiants_data.append({
                'id': etudiant.id,
                'prenom': etudiant.prenom,
                'nom': etudiant.nom,
                'email': etudiant.email,
                'filiere': etudiant.filiere or '',
                'annee': etudiant.annee or '',
                'photo': str(etudiant.photo) if etudiant.photo else '',
                'photo_url': photo_url,
                'is_active': etudiant.is_active
            })
        
        return Response(etudiants_data)
        
    except Exception as e:
        print(f"ERROR etudiants_actifs: {str(e)}")
        return Response(
            {'error': f'Erreur serveur: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
