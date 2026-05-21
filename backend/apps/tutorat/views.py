from django.db import models
from django.utils import timezone
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from datetime import datetime, timedelta

from apps.accounts.models import User
from apps.accounts.permissions import IsTuteur, IsAdmin, IsEtudiant, IsAdminOuTuteurProprietaire
from .models import (
    OffreTutorat, GroupeTutorat, InscriptionGroupe, 
    Disponibilite, Seance, Evaluation, InscriptionOffre, Ressource
)
from .serializers import (
    OffreTutoratSerializer, GroupeTutoratSerializer, 
    InscriptionGroupeSerializer, DisponibiliteSerializer, 
    SeanceSerializer, EvaluationSerializer, InscriptionOffreSerializer
)
from apps.forum.models import Question, Reponse
from apps.notifications.models import Notification
from apps.forum.models import Question as ForumQuestion

class OffreTutoratViewSet(viewsets.ModelViewSet):
    queryset = OffreTutorat.objects.all()
    serializer_class = OffreTutoratSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['matiere', 'niveau', 'type', 'est_active', 'tuteur', 'statut_workflow', 'mode_planning']
    search_fields = ['titre', 'description']
    ordering_fields = ['date_creation', 'tarif', 'date_publication']
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filtrer selon le rôle de l'utilisateur"""
        user = self.request.user
        queryset = OffreTutorat.objects.all()
        
        if user.role == 'tuteur':
            # Tuteur: voir ses offres + offres publiées
            queryset = queryset.filter(
                Q(tuteur=user) | 
                Q(statut_workflow='publie', est_active=True)
            )
        elif user.role == 'etudiant':
            # Étudiant: voir seulement les offres publiées et actives
            queryset = queryset.filter(
                statut_workflow='publie', 
                est_active=True
            )
        elif user.role == 'admin':
            # Admin: voir toutes les offres
            pass
        else:
            queryset = queryset.none()
            
        return queryset

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            self.permission_classes = [IsTuteur]
        elif self.action in ['update', 'partial_update']:
            # Pour update/partial_update: admin OU tuteur propriétaire
            self.permission_classes = [IsAdminOuTuteurProprietaire]
        elif self.action in ['generer_planning', 'verifier_disponibilites', 'dupliquer_offre']:
            self.permission_classes = [IsTuteur]
        elif self.action in ['valider_offre', 'suspendre_offre']:
            self.permission_classes = [IsAdmin]
        return super().get_permissions()

    def perform_create(self, serializer):
        """Créer une offre avec le tuteur connecté"""
        serializer.save(tuteur=self.request.user)

    def perform_update(self, serializer):
        """Mettre à jour une offre (géré par les permissions)"""
        serializer.save()

    @action(detail=True, methods=['post'])
    def generer_planning(self, request, pk=None):
        """Génère le planning automatique basé sur les disponibilités"""
        offre = self.get_object()
        
        try:
            date_debut = request.data.get('date_debut')
            date_fin = request.data.get('date_fin')
            
            if date_debut:
                date_debut = datetime.strptime(date_debut, '%Y-%m-%d').date()
            if date_fin:
                date_fin = datetime.strptime(date_fin, '%Y-%m-%d').date()
            
            sessions = offre.generer_planning_sessions(date_debut, date_fin)
            
            # Créer les sessions en base
            created_sessions = []
            for session_data in sessions:
                session = session_data
                session.save()
                created_sessions.append(session)
            
            return Response({
                'success': True,
                'message': f'{len(created_sessions)} sessions générées',
                'sessions': OffreTutoratSerializer(created_sessions, many=True).data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=400)

    @action(detail=True, methods=['get'])
    def verifier_disponibilites(self, request, pk=None):
        """Vérifie les conflits avec les disponibilités existantes"""
        offre = self.get_object()
        
        # Récupérer les disponibilités du tuteur
        disponibilites = Disponibilite.objects.filter(
            tuteur=offre.tuteur,
            est_recurrent=True
        )
        
        # Analyser les conflits potentiels
        conflits = []
        if offre.mode_planning == 'repetitif' and offre.repetition_config:
            config = offre.repetition_config
            jours_selectionnes = config.get('jours', [])
            
            for jour in jours_selectionnes:
                jour_dispos = disponibilites.filter(jour_semaine=jour)
                if not jour_dispos.exists():
                    conflits.append({
                        'jour': jour,
                        'message': f'Aucune disponibilité pour le jour {jour}'
                    })
        
        return Response({
            'disponibilites': DisponibiliteSerializer(disponibilites, many=True).data,
            'conflits': conflits,
            'mode_planning': offre.mode_planning
        })

    @action(detail=True, methods=['post'])
    def dupliquer_offre(self, request, pk=None):
        """Duplique une offre avec modifications"""
        offre_original = self.get_object()
        
        # Créer une copie
        nouvelle_offre = OffreTutorat.objects.create(
            tuteur=request.user,
            titre=f"Copie de {offre_original.titre}",
            description=offre_original.description,
            matiere=offre_original.matiere,
            niveau=offre_original.niveau,
            type=offre_original.type,
            tarif=offre_original.tarif,
            gratuit=offre_original.gratuit,
            duree_session=offre_original.duree_session,
            nombre_places=offre_original.nombre_places,
            en_ligne=offre_original.en_ligne,
            presentiel=offre_original.presentiel,
            lieu=offre_original.lieu,
            lien_visio=offre_original.lien_visio,
            mode_planning=offre_original.mode_planning,
            repetition_config=offre_original.repetition_config,
            statut_workflow='brouillon'  # Toujours en brouillon
        )
        
        return Response({
            'success': True,
            'offre': OffreTutoratSerializer(nouvelle_offre).data
        })

    @action(detail=True, methods=['post'])
    def valider_offre(self, request, pk=None):
        """Valider une offre (admin seulement)"""
        offre = self.get_object()
        
        offre.statut_workflow = 'publie'
        offre.validee_par_admin = True
        offre.admin_validateur = request.user
        offre.date_validation = timezone.now()
        offre.date_publication = timezone.now()
        offre.save()
        
        return Response({
            'success': True,
            'message': 'Offre validée avec succès',
            'offre': OffreTutoratSerializer(offre).data
        })

    @action(detail=True, methods=['post'])
    def suspendre_offre(self, request, pk=None):
        """Suspendre une offre (admin seulement)"""
        offre = self.get_object()
        
        offre.statut_workflow = 'suspendu'
        offre.est_active = False
        offre.save()
        
        return Response({
            'success': True,
            'message': 'Offre suspendue',
            'offre': OffreTutoratSerializer(offre).data
        })

    @action(detail=True, methods=['post'])
    def publier_offre(self, request, pk=None):
        """Publier une offre (tuteur)"""
        offre = self.get_object()
        
        if offre.tuteur != request.user:
            return Response({
                'error': 'Vous ne pouvez publier que vos propres offres'
            }, status=403)
        
        offre.statut_workflow = 'publie'
        offre.est_active = True
        offre.date_publication = timezone.now()
        offre.save()
        
        return Response({
            'success': True,
            'message': 'Offre publiée avec succès',
            'offre': OffreTutoratSerializer(offre).data
        })

    @action(detail=True, methods=['get'])
    def statistiques(self, request, pk=None):
        """Statistiques détaillées de l'offre"""
        offre = self.get_object()
        
        stats = {
            'vues': offre.vues,
            'candidatures': offre.candidatures,
            'sessions_realisees': offre.sessions_realisees,
            'note_moyenne': offre.note_moyenne,
            'nombre_inscrits': offre.nombre_inscrits,
            'places_disponibles': offre.places_disponibles,
            'inscriptions_par_statut': {},
            'sessions_par_mois': {},
            'evolution_vues': []
        }
        
        # Statistiques des inscriptions
        inscriptions = offre.inscriptions.all()
        for statut, _ in InscriptionOffre.STATUT_CHOICES:
            stats['inscriptions_par_statut'][statut] = inscriptions.filter(statut=statut).count()
        
        # Évolution des vues (simulé pour l'exemple)
        from datetime import datetime, timedelta
        for i in range(30):
            date = (timezone.now() - timedelta(days=i)).date()
            stats['evolution_vues'].append({
                'date': date.isoformat(),
                'vues': max(0, offre.vues - i * 2)  # Simulation
            })
        
        return Response(stats)

class GroupeTutoratViewSet(viewsets.ModelViewSet):
    queryset = GroupeTutorat.objects.all().order_by('-date_creation')
    serializer_class = GroupeTutoratSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['prive', 'offre__matiere', 'offre__niveau']
    search_fields = ['nom', 'description']
    ordering_fields = ['date_creation', 'nom']
    ordering = ['-date_creation']
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsTuteur]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(createur=self.request.user)

    def get_queryset(self):
        """
        - Étudiant : ne voit que les groupes où il est inscrit OU les groupes publics disponibles
        - Tuteur : ne voit que ses propres groupes
        - Admin : voit tous les groupes
        """
        user = self.request.user
        if not user.is_authenticated:
            return GroupeTutorat.objects.none()
        
        queryset = self.queryset
        
        # Filtrer par créateur si demandé
        createur_param = self.request.query_params.get('createur')
        if createur_param == 'true' and getattr(user, "role", None) in ["tuteur", "admin"]:
            queryset = queryset.filter(createur=user)
        
        # Filtrer les groupes disponibles (places > 0)
        places_disponibles = self.request.query_params.get('places_disponibles')
        if places_disponibles == 'true':
            queryset = queryset.filter(
                capacite_max__gt=models.F('nombre_membres')
            )
        
        # Filtrer par mes inscriptions
        mes_inscriptions = self.request.query_params.get('mes_inscriptions')
        if mes_inscriptions == 'true':
            if getattr(user, "role", None) == "etudiant":
                queryset = queryset.filter(inscriptions__etudiant=user).distinct()
        
        # Pour les étudiants : voir les groupes où ils sont inscrits + les groupes publics disponibles
        if getattr(user, "role", None) == "etudiant":
            if not mes_inscriptions and not places_disponibles:
                # Par défaut, montrer les groupes disponibles
                queryset = queryset.filter(
                    models.Q(inscriptions__etudiant=user) | 
                    models.Q(
                        capacite_max__gt=models.F('nombre_membres'),
                        auto_inscription=True
                    )
                ).distinct()
        elif getattr(user, "role", None) == "tuteur":
            return queryset.filter(createur=user)
            
        return queryset

    @action(detail=True, methods=['get'])
    def membres(self, request, pk=None):
        """Obtenir les membres d'un groupe"""
        try:
            groupe = self.get_object()
            
            # Vérifier les permissions
            user = request.user
            if getattr(user, "role", None) == "etudiant":
                # L'étudiant doit être inscrit au groupe
                if not InscriptionGroupe.objects.filter(groupe=groupe, etudiant=user, statut='accepte').exists():
                    return Response({"error": "Accès non autorisé"}, status=403)
            elif getattr(user, "role", None) == "tuteur":
                # Le tuteur doit être le créateur
                if groupe.createur != user:
                    return Response({"error": "Accès non autorisé"}, status=403)
            
            # Obtenir les membres acceptés
            inscriptions = InscriptionGroupe.objects.filter(
                groupe=groupe, 
                statut='accepte'
            ).select_related('etudiant')
            
            membres = []
            for inscription in inscriptions:
                membres.append({
                    'id': inscription.etudiant.id,
                    'nom': inscription.etudiant.nom,
                    'prenom': inscription.etudiant.prenom,
                    'email': inscription.etudiant.email,
                    'photo': inscription.etudiant.photo.url if inscription.etudiant.photo else None,
                    'date_inscription': inscription.date_inscription
                })
            
            return Response({
                'success': True,
                'membres': membres,
                'total': len(membres)
            })
            
        except Exception as e:
            return Response({
                'error': f'Erreur lors de la récupération des membres: {str(e)}'
            }, status=500)

    @action(detail=True, methods=['get'])
    def seances(self, request, pk=None):
        """Obtenir les séances d'un groupe"""
        try:
            groupe = self.get_object()
            
            # Vérifier les permissions
            user = request.user
            if getattr(user, "role", None) == "etudiant":
                # L'étudiant doit être inscrit au groupe
                if not InscriptionGroupe.objects.filter(groupe=groupe, etudiant=user, statut='accepte').exists():
                    return Response({"error": "Accès non autorisé"}, status=403)
            elif getattr(user, "role", None) == "tuteur":
                # Le tuteur doit être le créateur
                if groupe.createur != user:
                    return Response({"error": "Accès non autorisé"}, status=403)
            
            # Obtenir les séances du groupe
            from .models import Seance
            seances = Seance.objects.filter(
                groupe=groupe
            ).order_by('date_heure_debut')
            
            seances_data = []
            for seance in seances:
                seances_data.append({
                    'id': seance.id,
                    'sujet': seance.sujet,
                    'description': seance.description,
                    'date_heure_debut': seance.date_heure_debut,
                    'date_heure_fin': seance.date_heure_fin,
                    'statut': seance.statut,
                    'en_ligne': seance.en_ligne,
                    'lien_visio': seance.lien_visio,
                    'nombre_etudiants': seance.etudiants.count()
                })
            
            return Response({
                'success': True,
                'seances': seances_data,
                'total': len(seances_data)
            })
            
        except Exception as e:
            return Response({
                'error': f'Erreur lors de la récupération des séances: {str(e)}'
            }, status=500)

class InscriptionGroupeViewSet(viewsets.ModelViewSet):
    queryset = InscriptionGroupe.objects.all()
    serializer_class = InscriptionGroupeSerializer

    def get_permissions(self):
        if self.action == 'create':
            self.permission_classes = [IsEtudiant]
        elif self.action in ['update', 'partial_update', 'destroy']:
            self.permission_classes = [IsTuteur]  # seul le tuteur peut accepter/refuser
        return super().get_permissions()

    def get_queryset(self):
        """
        - Étudiant : ne voit que ses propres inscriptions
        - Tuteur : ne voit que les inscriptions de SES groupes
        - Admin : voient tout
        """
        user = self.request.user
        
        if not user.is_authenticated:
            return InscriptionGroupe.objects.none()
        if getattr(user, "role", None) == "etudiant":
            return self.queryset.filter(etudiant=user)
        elif getattr(user, "role", None) == "tuteur":
            # Le tuteur ne voit que les inscriptions de ses propres groupes
            return self.queryset.filter(groupe__createur=user)
        return self.queryset

    def perform_create(self, serializer):
        """Créer une inscription avec statut 'en_attente'"""
        groupe = serializer.validated_data['groupe']
        etudiant = self.request.user
        
        # Vérifier si l'étudiant est déjà inscrit
        from .models import InscriptionGroupe
        if InscriptionGroupe.objects.filter(etudiant=etudiant, groupe=groupe).exists():
            from rest_framework.exceptions import ValidationError
            from rest_framework.response import Response
            from rest_framework import status
            return Response(
                {"error": "Vous êtes déjà inscrit à ce groupe"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer.save(etudiant=etudiant, statut='en_attente')
        
        # Notifier le tuteur du groupe
        from apps.notifications.services import creer_notification
        creer_notification(
            groupe.createur.id, 
            'inscription_groupe',
            f"Nouvelle demande d'inscription",
            f"{etudiant.prenom} {etudiant.nom} demande à rejoindre votre groupe '{groupe.nom}'"
        )

    @action(detail=True, methods=['post'])
    def accepter(self, request, pk=None):
        """Accepter une inscription (tuteur uniquement)"""
        if getattr(request.user, "role", None) not in ["tuteur", "admin"]:
            return Response({"error": "Accès non autorisé"}, status=403)
            
        inscription = self.get_object()
        groupe = inscription.groupe
        
        # Vérifier que l'utilisateur est le créateur du groupe
        if groupe.createur != request.user:
            return Response({"error": "Vous n'êtes pas le créateur de ce groupe"}, status=403)
        
        # Accepter l'inscription
        inscription.statut = 'accepte'
        inscription.save()
        
        # Mettre à jour le nombre de membres
        groupe.nombre_membres += 1
        groupe.save()
        
        # Notifier l'étudiant
        from apps.notifications.services import creer_notification
        creer_notification(
            inscription.etudiant.id,
            'acceptation_groupe',
            f"Inscription acceptée",
            f"Votre demande pour rejoindre '{groupe.nom}' a été acceptée"
        )
        
        return Response({"success": True, "message": "Inscription acceptée"})
    
    @action(detail=True, methods=['post'])
    def refuser(self, request, pk=None):
        """Refuser une inscription (tuteur uniquement)"""
        if getattr(request.user, "role", None) not in ["tuteur", "admin"]:
            return Response({"error": "Accès non autorisé"}, status=403)
            
        inscription = self.get_object()
        groupe = inscription.groupe
        
        # Vérifier que l'utilisateur est le créateur du groupe
        if groupe.createur != request.user:
            return Response({"error": "Vous n'êtes pas le créateur de ce groupe"}, status=403)
        
        # Refuser l'inscription
        inscription.statut = 'refuse'
        inscription.save()
        
        # Notifier l'étudiant
        from apps.notifications.services import creer_notification
        creer_notification(
            inscription.etudiant.id,
            'inscription_groupe',
            f"Inscription refusée",
            f"Votre demande pour rejoindre '{groupe.nom}' a été refusée"
        )
        
        return Response({"success": True, "message": "Inscription refusée"})

    @action(detail=True, methods=['post'])
    def quitter(self, request, pk=None):
        """Quitter un groupe (étudiant uniquement)"""
        if getattr(request.user, "role", None) != "etudiant":
            return Response({"error": "Accès réservé aux étudiants"}, status=403)
            
        inscription = self.get_object()
        
        # Vérifier que l'utilisateur est bien l'étudiant inscrit
        if inscription.etudiant != request.user:
            return Response({"error": "Cette inscription ne vous appartient pas"}, status=403)
        
        groupe = inscription.groupe
        
        # Supprimer l'inscription
        inscription.delete()
        
        # Mettre à jour le nombre de membres
        groupe.nombre_membres = max(0, groupe.nombre_membres - 1)
        groupe.save()
        
        # Notifier le tuteur
        from apps.notifications.services import creer_notification
        creer_notification(
            groupe.createur.id,
            'inscription_groupe',
            f"Membre parti",
            f"{request.user.prenom} {request.user.nom} a quitté votre groupe '{groupe.nom}'"
        )
        
        return Response({"success": True, "message": "Vous avez quitté le groupe"})

class DisponibiliteViewSet(viewsets.ModelViewSet):
    queryset = Disponibilite.objects.all()
    serializer_class = DisponibiliteSerializer
    permission_classes = [IsTuteur]

    def get_queryset(self):
        return self.queryset.filter(tuteur=self.request.user)

    def perform_create(self, serializer):
        serializer.save(tuteur=self.request.user)

class SeanceViewSet(viewsets.ModelViewSet):
    queryset = Seance.objects.all()
    serializer_class = SeanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        - Admin : voit toutes les séances
        - Tuteur : séances où il est tuteur
        - Étudiant : TOUTES les séances disponibles (pas seulement celles où il est inscrit)
        """
        user = self.request.user
        if getattr(user, "role", None) == "admin":
            return self.queryset
        # ManyToMany côté étudiants - MODIFIÉ pour voir TOUTES les séances disponibles
        elif getattr(user, "role", None) == "etudiant":
            # Renvoyer toutes les séances à venir pour que les étudiants puissent s'inscrire
            return self.queryset.filter(
                date_heure_debut__gte=timezone.now(),
                statut__in=['planifiee', 'confirmee']
            )
        # ForeignKey côté tuteur
        elif getattr(user, "role", None) == "tuteur":
            return self.queryset.filter(tuteur=user)
        return self.queryset.none()
    
    def perform_create(self, serializer):
        """
        Personnaliser la création pour ajouter automatiquement l'étudiant connecté
        """
        print(f"DEBUG: Données reçues dans perform_create: {self.request.data}")
        print(f"DEBUG: User: {self.request.user} (role: {getattr(self.request.user, 'role', None)})")
        
        try:
            # Si l'utilisateur est un étudiant, l'ajouter à la séance
            if getattr(self.request.user, "role", None) == "etudiant":
                # Sauvegarder d'abord la séance
                seance = serializer.save()
                # Puis ajouter l'étudiant
                seance.etudiants.add(self.request.user)
                print(f"DEBUG: Séance créée avec ID {seance.id}, étudiant {self.request.user.id} ajouté")
            else:
                serializer.save()
                print("DEBUG: Séance créée sans ajout automatique d'étudiant")
        except Exception as e:
            print(f"ERROR: Erreur lors de la création de la séance: {e}")
            print(f"ERROR: Serializer errors: {serializer.errors}")
            raise

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def mettre_a_jour_seances_expirees(request):
    """
    Mettre à jour automatiquement toutes les séances expirées
    """
    from django.utils import timezone
    
    maintenant = timezone.now()
    
    # Toutes les séances qui devraient être terminées
    seances_a_terminer = Seance.objects.filter(
        date_heure_fin__lt=maintenant,
        statut__in=['planifiee', 'confirmee', 'en_cours']
    )
    
    # Mettre à jour en masse
    nombre_mises_a_jour = seances_a_terminer.update(statut='terminee')
    
    return Response({
        "message": f"Mise à jour effectuée",
        "nombre_seances_mises_a_jour": nombre_mises_a_jour,
        "timestamp": maintenant.isoformat()
    })

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def seances_statistiques_etudiant(request):
    """
    Obtenir les statistiques des séances pour l'étudiant connecté.
    """
    user = request.user
    if getattr(user, "role", None) != "etudiant":
        return Response({"error": "Accès réservé aux étudiants"}, status=403)
    
    from django.db.models import Count, Avg, Q, Sum
    from django.utils import timezone
    from datetime import timedelta
    
    # Séances de l'étudiant
    seances_etudiant = Seance.objects.filter(etudiants=user)
    
    # Mettre à jour automatiquement le statut des séances expirées
    maintenant = timezone.now()
    seances_a_terminer = seances_etudiant.filter(
        date_heure_fin__lt=maintenant,
        statut__in=['planifiee', 'confirmee', 'en_cours']
    )
    
    # Mettre à jour les séances expirées
    nombre_mises_a_jour = seances_a_terminer.update(statut='terminee')
    if nombre_mises_a_jour > 0:
        print(f"🔄 Mise à jour automatique: {nombre_mises_a_jour} séances marquées comme terminées")
    
    # Statistiques générales
    total_seances = seances_etudiant.count()
    seances_terminees = seances_etudiant.filter(statut='terminee').count()
    seances_avenir = seances_etudiant.filter(
        date_heure_debut__gt=timezone.now()
    ).count()
    seances_en_cours = seances_etudiant.filter(statut='en_cours').count()
    
    # Évaluations données
    evaluations_donnees = Evaluation.objects.filter(auteur=user).count()
    
    # Note moyenne des tuteurs évalués
    evaluations_recues = Evaluation.objects.filter(cible=user)
    note_moyenne_tuteurs = evaluations_recues.aggregate(
        avg_note=Avg('note')
    )['avg_note'] or 0.0
    
    # Temps total d'étude (en minutes)
    temps_etude_total = seances_etudiant.filter(
        statut='terminee'
    ).aggregate(
        total_duree=Sum('duree')
    )['total_duree'] or 0
    
    # Séances des 30 derniers jours
    date_30_jours = timezone.now() - timedelta(days=30)
    seances_recentes = seances_etudiant.filter(
        date_heure_debut__gte=date_30_jours
    ).count()
    
    # Matières suivies avec détails (regroupées par matière + tuteur)
    matieres_data = []
    
    # Regrouper manuellement pour éviter les doublons
    seances_grouped = {}
    
    for seance in seances_etudiant.select_related('tuteur'):
        key = f"{seance.sujet}_{seance.tuteur.id}"
        
        if key not in seances_grouped:
            seances_grouped[key] = {
                'sujet': seance.sujet,
                'tuteur_id': seance.tuteur.id,
                'tuteur_nom': seance.tuteur.nom,
                'tuteur_prenom': seance.tuteur.prenom,
                'nb_seances': 0,
                'total_heures': 0
            }
        
        seances_grouped[key]['nb_seances'] += 1
        seances_grouped[key]['total_heures'] += seance.duree
    
    # Convertir en format final
    for key, data in seances_grouped.items():
        nom_affichage = f"{data['sujet']} - {data['tuteur_prenom']} {data['tuteur_nom']}"
        
        matieres_data.append({
            'nom': data['sujet'],
            'nom_affichage': nom_affichage,
            'tuteur_id': data['tuteur_id'],
            'tuteur_nom': data['tuteur_nom'],
            'tuteur_prenom': data['tuteur_prenom'],
            'nb_seances': data['nb_seances'],
            'heures': round(data['total_heures'] / 60, 1)
        })
    
    return Response({
        "nombre_seances_suivies": total_seances,
        "seances_reussies": seances_terminees,
        "seances_en_cours": seances_en_cours,
        "seances_avenir": seances_avenir,
        "temps_etude": temps_etude_total,  # en minutes
        "note_moyenne_tuteurs": round(note_moyenne_tuteurs, 1),
        "evaluations_donnees": evaluations_donnees,
        "matieres_suivies": matieres_data,
        "seances_derniers_30_jours": seances_recentes
    })

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def seances_avenir_etudiant(request):
    """
    Obtenir les séances à venir de l'étudiant.
    """
    user = request.user
    if getattr(user, "role", None) != "etudiant":
        return Response({"error": "Accès réservé aux étudiants"}, status=403)
    
    from django.utils import timezone
    
    seances_avenir = Seance.objects.filter(
        etudiants=user,
        date_heure_debut__gt=timezone.now()
    ).order_by('date_heure_debut').select_related('tuteur')
    
    # Serializer les données
    resultats = []
    for seance in seances_avenir:
        resultats.append({
            "id": seance.id,
            "sujet": seance.sujet,
            "date_heure_debut": seance.date_heure_debut.isoformat(),
            "date_heure_fin": seance.date_heure_fin.isoformat(),
            "duree": seance.duree,
            "lieu": seance.lieu,
            "en_ligne": seance.en_ligne,
            "lien_visio": seance.lien_visio,
            "statut": seance.statut,
            "tuteur": {
                "id": seance.tuteur.id,
                "nom": seance.tuteur.nom,
                "prenom": seance.tuteur.prenom,
                "photo": seance.tuteur.photo.url if seance.tuteur.photo else None
            }
        })
    
    return Response(resultats)

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def seances_etudiant(request):
    """
    Obtenir toutes les séances de l'étudiant (passées et à venir).
    """
    user = request.user
    if getattr(user, "role", None) != "etudiant":
        return Response({"error": "Accès réservé aux étudiants"}, status=403)
    
    seances = Seance.objects.filter(
        etudiants=user
    ).order_by('-date_heure_debut').select_related('tuteur')
    
    # Serializer les données
    resultats = []
    for seance in seances:
        resultats.append({
            "id": seance.id,
            "sujet": seance.sujet,
            "date_heure_debut": seance.date_heure_debut.isoformat(),
            "date_heure_fin": seance.date_heure_fin.isoformat(),
            "duree": seance.duree,
            "lieu": seance.lieu,
            "en_ligne": seance.en_ligne,
            "statut": seance.statut,
            "tuteur": {
                "id": seance.tuteur.id,
                "nom": seance.tuteur.nom,
                "prenom": seance.tuteur.prenom,
                "photo": seance.tuteur.photo.url if seance.tuteur.photo else None
            }
        })
    
    return Response(resultats)

class EvaluationViewSet(viewsets.ModelViewSet):
    queryset = Evaluation.objects.all()
    serializer_class = EvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(auteur=self.request.user)


# ============================================================
# VUES SPÉCIFIQUES PARTIE ÉTUDIANT
# ============================================================

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def student_dashboard(request):
    """
    Tableau de bord étudiant :
    - Nombre de séances terminées
    - Nombre de ressources consultées (approx : favoris)
    - Nombre de questions posées
    - Nombre de réponses reçues
    - Notifications récentes
    """
    user = request.user
    if getattr(user, "role", None) != "etudiant":
        return Response({"detail": "Accès réservé aux étudiants."}, status=403)

    # Séances terminées (ManyToMany `etudiants`)
    nb_seances = (
        Seance.objects.filter(etudiants=user, statut="terminee")
        .distinct()
        .count()
    )

    # Ressources consultées : approximation via les vues
    nb_ressources_consultees = Ressource.objects.filter(
        createur=user
    ).count()  # Utilise les ressources créées comme approximation

    # Questions posées
    nb_questions = Question.objects.filter(auteur_id=user.id).count()

    # Réponses reçues sur ses questions
    nb_reponses = Reponse.objects.filter(question__auteur_id=user.id).count()

    # Notifications récentes
    notifications = (
        Notification.objects.filter(destinataire_id=user.id)
        .order_by("-date_creation")[:5]
    )
    notifications_data = [
        {
            "id": n.id,
            "type": n.type,
            "titre": n.titre,
            "message": n.message,
            "lien": n.lien,
            "est_lue": n.est_lue,
            "date_creation": n.date_creation,
        }
        for n in notifications
    ]

    data = {
        "nb_seances": nb_seances,
        "nb_ressources_consultees": nb_ressources_consultees,
        "nb_questions": nb_questions,
        "nb_reponses": nb_reponses,
        "notifications_recents": notifications_data,
    }
    return Response(data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def student_seances_list(request):
    """
    Liste des séances d'un étudiant connecté.
    """
    user = request.user
    if getattr(user, "role", None) != "etudiant":
        return Response({"detail": "Accès réservé aux étudiants."}, status=403)

    seances = (
        Seance.objects.filter(etudiants=user)
        .select_related("tuteur", "offre")
        .order_by("-date_heure_debut")
        .distinct()
    )

    data = [
        {
            "id": s.id,
            "matiere": s.offre.matiere if s.offre else None,
            "titre_offre": s.offre.titre if s.offre else None,
            "tuteur": {
                "id": s.tuteur.id,
                "nom": s.tuteur.nom,
                "prenom": s.tuteur.prenom,
            }
            if s.tuteur
            else None,
            "date_heure_debut": s.date_heure_debut,
            "date_heure_fin": s.date_heure_fin,
            "statut": s.statut,
            "lien_reunion": getattr(s, "lien_reunion", None),
        }
        for s in seances
    ]
    return Response(data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def reserver_seance(request, offre_id):
    """
    Réserver une séance individuelle à partir d'une offre.
    """
    user = request.user
    if getattr(user, "role", None) != "etudiant":
        return Response({"detail": "Accès réservé aux étudiants."}, status=403)

    try:
        offre = OffreTutorat.objects.get(id=offre_id, est_active=True)
    except OffreTutorat.DoesNotExist:
        return Response({"detail": "Offre introuvable."}, status=404)

    date_debut = request.data.get("date_heure_debut")
    date_fin = request.data.get("date_heure_fin")
    if not date_debut or not date_fin:
        return Response(
            {"detail": "date_heure_debut et date_heure_fin sont requis."},
            status=400,
        )

    seance = Seance.objects.create(
        offre=offre,
        tuteur=offre.tuteur,
        date_heure_debut=date_debut,
        date_heure_fin=date_fin,
        statut="planifiee",
        sujet=offre.titre,
        description=offre.description or "",
    )
    seance.etudiants.add(user)

    return Response(
        {"id": seance.id, "detail": "Séance réservée avec succès."}, status=201
    )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def creer_seance_directe(request):
    """
    Créer une séance directement sans offre préexistante.
    """
    user = request.user
    if getattr(user, "role", None) != "etudiant":
        return Response({"detail": "Accès réservé aux étudiants."}, status=403)

    try:
        tuteur_id = request.data.get("tuteur")
        matiere = request.data.get("matiere")
        date_heure_debut = request.data.get("date_heure_debut")
        duree = request.data.get("duree", 60)
        lieu = request.data.get("lieu", "")
        description = request.data.get("description", "")
        
        if not tuteur_id or not matiere or not date_heure_debut:
            return Response({
                "detail": "tuteur, matiere et date_heure_debut sont requis."
            }, status=400)
        
        # Vérifier que le tuteur existe
        tuteur = User.objects.get(id=tuteur_id, role='tuteur')
        
        # Calculer la date de fin
        from datetime import datetime, timedelta
        date_debut = datetime.fromisoformat(date_heure_debut.replace('Z', '+00:00'))
        date_fin = date_debut + timedelta(minutes=duree)
        
        # Créer la séance
        seance = Seance.objects.create(
            tuteur=tuteur,
            sujet=matiere,
            description=description,
            date_heure_debut=date_debut,
            date_heure_fin=date_fin,
            duree=duree,
            lieu=lieu,
            en_ligne=lieu == "" or "en ligne" in lieu.lower(),
            statut="planifiee"
        )
        
        # Ajouter l'étudiant
        seance.etudiants.add(user)
        
        return Response({
            "id": seance.id,
            "detail": "Séance créée avec succès."
        }, status=201)
        
    except User.DoesNotExist:
        return Response({"detail": "Tuteur introuvable."}, status=404)
    except Exception as e:
        return Response({"detail": f"Erreur: {str(e)}"}, status=400)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def student_history(request):
    """
    Historique d'apprentissage de l'étudiant :
    - Dernières séances suivies
    - Dernières ressources consultées (favoris)
    - Dernières questions posées
    """
    user = request.user
    if getattr(user, "role", None) != "etudiant":
        return Response({"detail": "Accès réservé aux étudiants."}, status=403)

    seances = (
        Seance.objects.filter(etudiants=user)
        .select_related("offre")
        .order_by("-date_heure_debut")[:20]
    )
    seances_data = [
        {
            "id": s.id,
            "sujet": s.sujet,
            "matiere": s.offre.matiere if s.offre else "",
            "date_heure_debut": s.date_heure_debut,
        }
        for s in seances
    ]

    ressources = (
        Ressource.objects.filter(favoris__utilisateur_id=user.id)
        .order_by("-date_publication")[:20]
    )
    ressources_data = [
        {
            "id": r.id,
            "titre": r.titre,
            "matiere": r.matiere,
            "niveau": r.niveau,
        }
        for r in ressources
    ]

    questions = (
        ForumQuestion.objects.filter(auteur_id=user.id)
        .order_by("-date_publication")[:20]
    )
    questions_data = [
        {
            "id": q.id,
            "titre": q.titre,
            "date_publication": q.date_publication,
        }
        for q in questions
    ]

    return Response(
        {
            "seances": seances_data,
            "ressources": ressources_data,
            "questions": questions_data,
        }
    )


# ============================================================
# VUES SPÉCIFIQUES GESTION DES GROUPES
# ============================================================

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def groupe_membres(request, groupe_id):
    """
    Lister les membres d'un groupe.
    """
    user = request.user
    try:
        groupe = GroupeTutorat.objects.get(id=groupe_id)
        
        # Vérifier les permissions
        user_role = getattr(user, "role", None)
        
        if user_role == "tuteur":
            if groupe.createur != user:
                return Response({
                    "detail": "Accès non autorisé.", 
                    "error": "Vous n'êtes pas le créateur de ce groupe",
                    "groupe_createur": f"{groupe.createur.prenom} {groupe.createur.nom}",
                    "votre_role": user_role
                }, status=403)
        elif user_role == "etudiant":
            if not InscriptionGroupe.objects.filter(groupe=groupe, etudiant=user, statut='accepte').exists():
                return Response({
                    "detail": "Vous n'êtes pas membre de ce groupe.",
                    "error": "Vous devez être membre pour voir les détails"
                }, status=403)
        
        # Récupérer les membres
        inscriptions = InscriptionGroupe.objects.filter(groupe=groupe, statut='accepte')
        membres = []
        
        # Ajouter les étudiants membres
        for inscription in inscriptions:
            etudiant = inscription.etudiant
            membres.append({
                "id": etudiant.id,
                "nom": etudiant.nom,
                "prenom": etudiant.prenom,
                "email": etudiant.email,
                "role": "étudiant",
                "date_inscription": inscription.date_inscription,
                "biographie": etudiant.biographie or "",
                "telephone": etudiant.telephone or "",
                "filiere": etudiant.filiere or "",
                "annee": etudiant.annee or "",
                "photo": etudiant.photo.url if etudiant.photo else None
            })
        
        # Ajouter le tuteur comme membre
        createur = groupe.createur
        membres.append({
            "id": createur.id,
            "nom": createur.nom,
            "prenom": createur.prenom,
            "email": createur.email,
            "role": "tuteur",
            "date_inscription": groupe.date_creation,
            "biographie": createur.biographie or "",
            "telephone": createur.telephone or "",
            "filiere": createur.filiere or "",
            "annee": createur.annee or "",
            "photo": createur.photo.url if createur.photo else None
        })
        
        return Response(membres)
        
    except GroupeTutorat.DoesNotExist:
        return Response({"detail": "Groupe introuvable."}, status=404)

@api_view(["POST"])
@permission_classes([IsTuteur])
def groupe_ajouter_membre(request, groupe_id):
    """
    Ajouter un membre à un groupe (par email).
    """
    user = request.user
    try:
        groupe = GroupeTutorat.objects.get(id=groupe_id)
        
        # Vérifier que l'utilisateur est le créateur du groupe
        if groupe.createur != user:
            return Response({"detail": "Seul le créateur peut ajouter des membres."}, status=403)
        
        email = request.data.get("email")
        if not email:
            return Response({"detail": "L'email est requis."}, status=400)
        
        try:
            etudiant = User.objects.get(email=email, role="etudiant")
        except User.DoesNotExist:
            return Response({"detail": "Étudiant introuvable."}, status=404)
        
        # Vérifier si déjà membre
        if InscriptionGroupe.objects.filter(groupe=groupe, etudiant=etudiant).exists():
            return Response({"detail": "Cet étudiant est déjà membre du groupe."}, status=400)
        
        # Créer l'inscription
        inscription = InscriptionGroupe.objects.create(
            groupe=groupe,
            etudiant=etudiant,
            statut='accepte'
        )
        
        # Mettre à jour le nombre de membres du groupe
        groupe.nombre_membres += 1
        groupe.save()
        
        # Retourner les détails de l'étudiant ajouté
        from apps.accounts.serializers import UserBasicSerializer
        etudiant_serializer = UserBasicSerializer(etudiant)
        
        return Response({
            "success": True,
            "message": "Membre ajouté avec succès.",
            "membre": etudiant_serializer.data,
            "inscription_id": inscription.id
        }, status=201)
        
    except GroupeTutorat.DoesNotExist:
        return Response({"detail": "Groupe introuvable."}, status=404)

@api_view(["DELETE"])
@permission_classes([IsTuteur])
def groupe_supprimer_membre(request, groupe_id, membre_id):
    """
    Supprimer un membre d'un groupe.
    """
    user = request.user
    try:
        groupe = GroupeTutorat.objects.get(id=groupe_id)
        
        # Vérifier que l'utilisateur est le créateur du groupe
        if groupe.createur != user:
            return Response({"detail": "Seul le créateur peut supprimer des membres."}, status=403)
        
        try:
            inscription = InscriptionGroupe.objects.get(groupe=groupe, etudiant_id=membre_id)
            inscription.delete()
            return Response({"message": "Membre supprimé avec succès."})
        except InscriptionGroupe.DoesNotExist:
            return Response({"detail": "Membre introuvable."}, status=404)
        
    except GroupeTutorat.DoesNotExist:
        return Response({"detail": "Groupe introuvable."}, status=404)


# VIEWS POUR LA RECHERCHE DE TUTEURS

@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def recherche_tuteurs(request):
    """
    Rechercher des tuteurs avec filtres avancés.
    """
    print("🔥🔥🔥 RECHERCHE TUTEURS APPELÉE !!! 🔥🔥🔥")
    
    # Test simple - retourner tous les tuteurs
    from apps.accounts.models import User
    from apps.tutorat.models import OffreTutorat, Disponibilite, Seance, Evaluation
    from django.db.models import Q
    
    # Récupérer les paramètres de filtre
    matiere = request.GET.get('matiere', '')
    niveau = request.GET.get('niveau', '')
    disponibilite = request.GET.get('disponibilite', '')
    note_minimum = float(request.GET.get('note_minimum', 0))
    tarif_max = request.GET.get('tarif_max', '')
    type_seance = request.GET.get('type_seance', '')
    search = request.GET.get('search', '')
    
    print(f"Paramètres - matière: '{matiere}', niveau: '{niveau}', search: '{search}'")
    
    # Construire la requête de base
    tuteurs = User.objects.filter(role='tuteur', is_active=True)
    print(f"Tuteurs de base: {tuteurs.count()}")
    
    # Filtrer par recherche textuelle
    if search:
        tuteurs = tuteurs.filter(
            Q(prenom__icontains=search) |
            Q(nom__icontains=search) |
            Q(biographie__icontains=search) |
            Q(matieres_enseignees__icontains=search)
        )
        print(f"Tuteurs après filtre search: {tuteurs.count()}")
    
    # Filtrer par matière (dans matieres_enseignees)
    if matiere:
        tuteurs = tuteurs.filter(matieres_enseignees__icontains=matiere)
        print(f"Tuteurs après filtre matière: {tuteurs.count()}")
    
    # Filtrer par niveau
    if niveau:
        tuteurs = tuteurs.filter(niveau_enseignement__icontains=niveau)
        print(f"Tuteurs après filtre niveau: {tuteurs.count()}")
    
    # Filtrer par note minimum
    if note_minimum > 0:
        tuteurs = tuteurs.filter(note_moyenne__gte=note_minimum)
        print(f"Tuteurs après filtre note: {tuteurs.count()}")
    
    # Filtrer par tarif maximum (via offres)
    if tarif_max:
        try:
            tarif_max_value = float(tarif_max)
            tuteurs_ids = OffreTutorat.objects.filter(
                tuteur__in=tuteurs,
                tarif__lte=tarif_max_value
            ).values_list('tuteur_id', flat=True).distinct()
            tuteurs = tuteurs.filter(id__in=tuteurs_ids)
            print(f"Tuteurs après filtre tarif: {tuteurs.count()}")
        except ValueError:
            print(f"Erreur tarif_max: {tarif_max}")
            pass
    
    # Filtrer par type de séance (via offres)
    if type_seance:
        tuteurs_ids = OffreTutorat.objects.filter(
            tuteur__in=tuteurs,
            type=type_seance
        ).values_list('tuteur_id', flat=True).distinct()
        tuteurs = tuteurs.filter(id__in=tuteurs_ids)
        print(f"Tuteurs après filtre type: {tuteurs.count()}")
    
    print(f"Tuteurs finaux: {tuteurs.count()}")
    
    # Construire la réponse COMPLÈTE
    resultats = []
    for tuteur in tuteurs:
        print(f"Traitement tuteur: {tuteur.prenom} {tuteur.nom}")
        
        # Récupérer les offres de tutorat du tuteur
        offres = OffreTutorat.objects.filter(tuteur=tuteur, est_active=True)
        
        # Récupérer les disponibilités
        disponibilites = Disponibilite.objects.filter(tuteur=tuteur)
        
        # Compter les vraies séances réalisées et étudiants depuis la base de données
        try:
            # Compter les vraies séances depuis le modèle Seance
            from apps.tutorat.models import Seance, Evaluation
            
            # Séances réelles de ce tuteur (toutes les séances, pas seulement terminées)
            seances_reelles = Seance.objects.filter(tuteur=tuteur)
            nombre_seances = seances_reelles.count()
            
            # Compter aussi les séances terminées pour les statistiques
            seances_terminees = Seance.objects.filter(tuteur=tuteur, statut='terminee').count()
            
            # Étudiants uniques ayant pris des cours avec ce tuteur
            etudiants_uniques = []
            for seance in seances_reelles:
                etudiants_uniques.extend(seance.etudiants.all())
            
            # Utiliser un set pour obtenir les étudiants uniques
            etudiants_uniques_ids = list(set([etudiant.id for etudiant in etudiants_uniques]))
            nombre_etudiants = len(etudiants_uniques_ids)
            
            # Note moyenne réelle depuis les évaluations
            evaluations = Evaluation.objects.filter(cible=tuteur)
            if evaluations.exists():
                notes = [ev.note for ev in evaluations if ev.note is not None]
                note_moyenne = round(sum(notes) / len(notes), 1) if notes else 0.0
                nombre_evaluations = len(notes)
            else:
                note_moyenne = 0.0
                nombre_evaluations = 0
                
            print(f"📊 Données réelles pour {tuteur.prenom} {tuteur.nom}: {nombre_seances} séances, {nombre_etudiants} étudiants, note {note_moyenne}")
            
        except Exception as e:
            print(f"❌ Erreur récupération données réelles pour {tuteur.prenom} {tuteur.nom}: {e}")
            # Fallback sur des données par défaut
            nombre_seances = 0
            nombre_etudiants = 0
            note_moyenne = 0.0
            nombre_evaluations = 0
        
        # Parser les matières
        matieres_list = []
        if tuteur.matieres_enseignees:
            try:
                matieres_str = str(tuteur.matieres_enseignees)
                if matieres_str.startswith('[') and matieres_str.endswith(']'):
                    import json
                    matieres_list = json.loads(matieres_str)
                else:
                    matieres_list = [m.strip() for m in matieres_str.split(',') if m.strip()]
            except:
                matieres_list = [str(tuteur.matieres_enseignees)]
        
        # Construire les données COMPLÈTES du tuteur
        tuteur_data = {
            'id': tuteur.id,
            'prenom': tuteur.prenom,
            'nom': tuteur.nom,
            'photo': tuteur.photo.url if tuteur.photo else None,
            'biographie': tuteur.biographie or '',
            'matieres_enseignees': matieres_list,
            'niveau_enseignement': tuteur.niveau_enseignement or '',
            'note_moyenne': note_moyenne,
            'nombre_evaluations': nombre_evaluations,
            'nombre_seances': nombre_seances,
            'tarif': None,
            'type_seance': None,
            'disponibilites': [
                {
                    'jour': dispo.jour_semaine,
                    'heures': f"{dispo.heure_debut} - {dispo.heure_fin}"
                } for dispo in disponibilites
            ],
            'badges': [],
            'experience_ans': getattr(tuteur, 'experience_ans', 0),
            'nombre_etudiants': nombre_etudiants,
        }
        
        # Ajouter les informations de la première offre active
        if offres.exists():
            offre = offres.first()
            tuteur_data.update({
                'tarif': offre.tarif,
                'type_seance': offre.type,
                'matiere_offre': offre.matiere,
                'niveau_offre': offre.niveau
            })
        
        resultats.append(tuteur_data)
        print(f"Tuteur {tuteur.prenom} {tuteur.nom} ajouté aux résultats")
    
    print(f"Total résultats retournés: {len(resultats)}")
    return Response(resultats)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def tuteurs_recommandes(request):
    """
    Obtenir les tuteurs recommandés pour l'étudiant.
    """
    user = request.user
    
    if user.role != 'etudiant':
        return Response({"detail": "Accès réservé aux étudiants."}, status=403)
    
    # Logique de recommandation simple (basée sur la filière de l'étudiant)
    tuteurs = User.objects.filter(role='tuteur', is_active=True)
    
    # Filtrer par filière si disponible
    if user.filiere:
        tuteurs = tuteurs.filter(
            Q(matieres_enseignees__icontains=user.filiere) |
            Q(offretutorat__matiere__icontains=user.filiere)
        ).distinct()
    
    # Prendre les 5 meilleurs tuteurs
    tuteurs = tuteurs.order_by('-note_moyenne')[:5]
    
    resultats = []
    for tuteur in tuteurs:
        offres = OffreTutorat.objects.filter(tuteur=tuteur, est_active=True)
        disponibilites = Disponibilite.objects.filter(tuteur=tuteur)
        nombre_seances = Seance.objects.filter(tuteur=tuteur).count()
        
        resultats.append({
            'id': tuteur.id,
            'prenom': tuteur.prenom,
            'nom': tuteur.nom,
            'photo': tuteur.photo.url if tuteur.photo else None,
            'biographie': tuteur.biographie or '',
            'matieres_enseignees': tuteur.matieres_enseignees or [],
            'note_moyenne': float(tuteur.note_moyenne) if tuteur.note_moyenne else 0,
            'nombre_evaluations': tuteur.nombre_evaluations or 0,
            'nombre_seances': nombre_seances,
            'tarif': offres.first().tarif if offres.exists() else None,
            'disponibilites': [
                {'jour': dispo.jour, 'heures': dispo.heures} 
                for dispo in disponibilites
            ],
            'badges': list(tuteur.badges_tuteur_set.all().values('nom', 'icone', 'couleur')) if hasattr(tuteur, 'badges_tuteur_set') else []
        })
    
    return Response(resultats)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def meilleurs_tuteurs(request):
    """
    Obtenir le classement des meilleurs tuteurs.
    """
    tuteurs = User.objects.filter(
        role='tuteur', 
        is_active=True,
        note_moyenne__isnull=False
    ).order_by('-note_moyenne', '-nombre_evaluations')[:10]
    
    resultats = []
    for i, tuteur in enumerate(tuteurs, 1):
        nombre_seances = Seance.objects.filter(tuteur=tuteur).count()
        
        resultats.append({
            'id': tuteur.id,
            'prenom': tuteur.prenom,
            'nom': tuteur.nom,
            'photo': tuteur.photo.url if tuteur.photo else None,
            'matieres_enseignees': tuteur.matieres_enseignees or [],
            'note_moyenne': float(tuteur.note_moyenne),
            'nombre_evaluations': tuteur.nombre_evaluations or 0,
            'nombre_seances': nombre_seances,
            'classement': i,
            'tarif': OffreTutorat.objects.filter(tuteur=tuteur, est_active=True).first().tarif if OffreTutorat.objects.filter(tuteur=tuteur, est_active=True).first() else None
        })
    
    return Response(resultats)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def tuteurs_disponibles_maintenant(request):
    """
    Obtenir les tuteurs disponibles maintenant.
    """
    from django.utils import timezone
    import calendar
    
    now = timezone.now()
    jour_actuel = calendar.day_name[now.weekday()]
    heure_actuelle = now.time()  # Utiliser time() au lieu de hour
    
    # Tuteurs ayant des disponibilités pour le jour et heure actuels
    tuteurs = User.objects.filter(
        role='tuteur', 
        is_active=True,
        disponibilite__jour_semaine=now.weekday()
    ).distinct()
    
    # Filtrer par heure actuel dans les résultats
    tuteurs_avec_heure = []
    for tuteur in tuteurs:
        disponibilites = Disponibilite.objects.filter(tuteur=tuteur, jour_semaine=now.weekday())
        # Vérifier si l'heure actuelle est dans les disponibilités
        heure_disponible = False
        for dispo in disponibilites:
            # Convertir les heures en minutes pour comparaison
            heure_actuelle_minutes = heure_actuelle.hour * 60 + heure_actuelle.minute
            heure_debut_minutes = dispo.heure_debut.hour * 60 + dispo.heure_debut.minute
            heure_fin_minutes = dispo.heure_fin.hour * 60 + dispo.heure_fin.minute
            
            if heure_debut_minutes <= heure_actuelle_minutes < heure_fin_minutes:
                heure_disponible = True
                break
        
        if heure_disponible:
            tuteurs_avec_heure.append(tuteur)
    
    resultats = []
    for tuteur in tuteurs_avec_heure:
        disponibilites = Disponibilite.objects.filter(tuteur=tuteur)
        nombre_seances = Seance.objects.filter(tuteur=tuteur).count()
        
        resultats.append({
            'id': tuteur.id,
            'prenom': tuteur.prenom,
            'nom': tuteur.nom,
            'photo': tuteur.photo.url if tuteur.photo else None,
            'matieres_enseignees': tuteur.matieres_enseignees or [],
            'note_moyenne': float(tuteur.note_moyenne) if tuteur.note_moyenne else 0,
            'nombre_seances': nombre_seances,
            'disponibilites': [
                {'jour': dispo.jour, 'heures': dispo.heures} 
                for dispo in disponibilites
            ],
            'tarif': OffreTutorat.objects.filter(tuteur=tuteur, est_active=True).first().tarif if OffreTutorat.objects.filter(tuteur=tuteur, est_active=True).first() else None
        })
    
    return Response(resultats)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def tuteur_profile(request, tuteur_id):
    """
    Obtenir le profil détaillé d'un tuteur.
    """
    try:
        tuteur = User.objects.get(id=tuteur_id, role='tuteur', is_active=True)
        
        # Statistiques
        nombre_seances = Seance.objects.filter(tuteur=tuteur).count()
        nombre_etudiants = Seance.objects.filter(tuteur=tuteur).values('etudiant').distinct().count()
        
        # Taux de réussite (basé sur les évaluations positives)
        evaluations_positives = Evaluation.objects.filter(cible=tuteur, note__gte=4).count()
        total_evaluations = Evaluation.objects.filter(cible=tuteur).count()
        taux_reussite = (evaluations_positives / total_evaluations * 100) if total_evaluations > 0 else 0
        
        # Offres actives
        offres = OffreTutorat.objects.filter(tuteur=tuteur, est_active=True)
        
        # Disponibilités
        disponibilites = Disponibilite.objects.filter(tuteur=tuteur)
        
        # Badges
        badges = []
        if hasattr(tuteur, 'badges_tuteur_set'):
            badges = list(tuteur.badges_tuteur_set.all().values('nom', 'icone', 'couleur', 'description'))
        
        profile_data = {
            'id': tuteur.id,
            'prenom': tuteur.prenom,
            'nom': tuteur.nom,
            'photo': tuteur.photo.url if tuteur.photo else None,
            'biographie': tuteur.biographie or '',
            'matieres_enseignees': tuteur.matieres_enseignees or [],
            'niveau_enseignement': tuteur.niveau_enseignement or '',
            'note_moyenne': float(tuteur.note_moyenne) if tuteur.note_moyenne else 0,
            'nombre_evaluations': tuteur.nombre_evaluations or 0,
            'nombre_seances': nombre_seances,
            'nombre_etudiants': nombre_etudiants,
            'taux_reussite': round(taux_reussite, 1),
            'experience_ans': getattr(tuteur, 'experience_ans', 0),
            'titre': getattr(tuteur, 'titre', 'Tuteur'),
            'offres': [
                {
                    'id': offre.id,
                    'matiere': offre.matiere,
                    'niveau': offre.niveau,
                    'tarif': offre.tarif,
                    'type': offre.type,
                    'description': offre.description
                } for offre in offres
            ],
            'disponibilites': [
                {
                    'jour': dispo.jour,
                    'heures': dispo.heures
                } for dispo in disponibilites
            ],
            'badges': badges
        }
        
        return Response(profile_data)
        
    except User.DoesNotExist:
        return Response({"detail": "Tuteur introuvable."}, status=404)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def tuteur_evaluations(request, tuteur_id):
    """
    Obtenir les évaluations d'un tuteur.
    """
    try:
        tuteur = User.objects.get(id=tuteur_id, role='tuteur')
        
        evaluations = Evaluation.objects.filter(cible=tuteur).order_by('-date_evaluation')
        
        resultats = []
        for eval in evaluations:
            resultats.append({
                'id': eval.id,
                'eleve_nom': f"{eval.etudiant.prenom} {eval.etudiant.nom}",
                'note': eval.note,
                'commentaire': eval.commentaire,
                'points_forts': eval.points_forts,
                'points_amelioration': eval.points_amelioration,
                'recommanderait': eval.recommanderait,
                'date_evaluation': eval.date_evaluation
            })
        
        return Response(resultats)
        
    except User.DoesNotExist:
        return Response({"detail": "Tuteur introuvable."}, status=404)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def tuteur_disponibilites(request, tuteur_id):
    """
    Obtenir les disponibilités d'un tuteur.
    """
    try:
        tuteur = User.objects.get(id=tuteur_id, role='tuteur')
        
        disponibilites = Disponibilite.objects.filter(tuteur=tuteur)
        
        resultats = [
            {
                'id': dispo.id,
                'jour': dispo.get_jour_semaine_display(),
                'jour_semaine': dispo.jour_semaine,
                'heures': f"{dispo.heure_debut.strftime('%H:%M')}-{dispo.heure_fin.strftime('%H:%M')}",
                'heure_debut': dispo.heure_debut.strftime('%H:%M'),
                'heure_fin': dispo.heure_fin.strftime('%H:%M'),
                'est_recurrent': dispo.est_recurrent
            } for dispo in disponibilites
        ]
        
        return Response(resultats)
        
    except User.DoesNotExist:
        return Response({"detail": "Tuteur introuvable."}, status=404)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def tuteur_seances(request, tuteur_id):
    """
    Obtenir les séances d'un tuteur.
    """
    try:
        tuteur = User.objects.get(id=tuteur_id, role='tuteur')
        
        # Séances futures
        seances = Seance.objects.filter(
            tuteur=tuteur,
            date_heure_debut__gt=timezone.now(),
            statut='confirmee'
        ).order_by('date_heure_debut')
        
        resultats = []
        for seance in seances:
            resultats.append({
                'id': seance.id,
                'matiere': seance.matiere,
                'date_heure_debut': seance.date_heure_debut,
                'duree': seance.duree,
                'lieu': seance.lieu,
                'tarif': seance.tarif,
                'type': seance.type
            })
        
        return Response(resultats)
        
    except User.DoesNotExist:
        return Response({"detail": "Tuteur introuvable."}, status=404)
