from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, F, Count, Avg, Sum
from django.utils import timezone
from datetime import timedelta

from .models import Question, Reponse, VoteReponse
from .models_extended import BadgeTuteur, ClassementTuteur, StatistiquesTuteur, ReponseEtendue, PieceJointeReponse
from .serializers_extended import (
    QuestionExtendedSerializer, ReponseExtendedSerializer, 
    BadgeTuteurSerializer, ClassementTuteurSerializer, StatistiquesTuteurSerializer
)
from apps.accounts.permissions import IsTuteur, IsEtudiant, IsAdminOuTuteur
from apps.notifications.services import creer_notification


class TutorForumViewSet(viewsets.ModelViewSet):
    """ViewSet optimisé pour les tuteurs avec fonctionnalités avancées"""
    queryset = Question.objects.all()
    serializer_class = QuestionExtendedSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['matiere', 'est_resolue', 'auteur']
    search_fields = ['titre', 'contenu', 'tags']
    ordering_fields = ['date_publication', 'nb_vues', 'date_derniere_reponse']
    permission_classes = [permissions.IsAuthenticated, IsTuteur]

    def get_queryset(self):
        """Filtrer les questions selon les spécialités du tuteur"""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Si c'est un tuteur, prioriser ses matières
        if user.role in ['tuteur', 'enseignant']:
            matieres_tuteur = user.matieres_maitrisees or []
            if matieres_tuteur:
                # Questions dans ses matières (priorité haute)
                questions_matieres = queryset.filter(matiere__in=matieres_tuteur)
                # Autres questions (priorité basse)
                autres_questions = queryset.exclude(matiere__in=matieres_tuteur)
                # Combiner avec priorité
                queryset = questions_matieres.union(autres_questions)
        
        return queryset

    @action(detail=False, methods=['get'])
    def mes_specialites(self, request):
        """Questions dans les spécialités du tuteur"""
        user = request.user
        if user.role not in ['tuteur', 'enseignant']:
            return Response({'error': 'Réservé aux tuteurs'}, status=403)
        
        matieres = user.matieres_maitrisees or []
        questions = self.get_queryset().filter(matiere__in=matieres)
        
        serializer = self.get_serializer(questions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def mes_reponses(self, request):
        """Questions où le tuteur a répondu"""
        user = request.user
        reponses = Reponse.objects.filter(auteur=user).values_list('question_id', flat=True)
        questions = Question.objects.filter(id__in=reponses).order_by('-date_publication')
        
        serializer = self.get_serializer(questions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def non_repondues(self, request):
        """Questions sans réponse dans les spécialités du tuteur"""
        user = request.user
        if user.role not in ['tuteur', 'enseignant']:
            return Response({'error': 'Réservé aux tuteurs'}, status=403)
        
        matieres = user.matieres_maitrisees or []
        questions = self.get_queryset().filter(
            matiere__in=matieres,
            reponses__isnull=True
        ).order_by('-date_publication')
        
        serializer = self.get_serializer(questions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def repondre_avec_fichier(self, request, pk=None):
        """Répondre à une question avec pièce jointe"""
        question = self.get_object()
        user = request.user
        
        # Vérifier que le tuteur peut répondre
        if user.role not in ['tuteur', 'enseignant']:
            return Response({'error': 'Réservé aux tuteurs'}, status=403)
        
        # Créer la réponse
        reponse_data = {
            'question': question.id,
            'auteur': user.id,
            'contenu': request.data.get('contenu', '')
        }
        
        serializer = ReponseExtendedSerializer(data=reponse_data)
        if serializer.is_valid():
            reponse = serializer.save()
            
            # Mettre à jour la date de dernière réponse
            question.date_derniere_reponse = timezone.now()
            question.save(update_fields=['date_derniere_reponse'])
            
            # Gérer les pièces jointes
            if 'fichiers' in request.FILES:
                for fichier in request.FILES.getlist('fichiers'):
                    PieceJointeReponse.objects.create(
                        reponse=reponse,
                        fichier=fichier,
                        nom_original=fichier.name,
                        type_fichier=fichier.content_type,
                        taille=fichier.size
                    )
            
            # Notifier l'auteur de la question
            creer_notification(
                question.auteur.id,
                'reponse_forum',
                'Nouvelle réponse à votre question',
                f'{user.prenom} {user.nom} a répondu à votre question "{question.titre}"'
            )
            
            # Mettre à jour les statistiques du tuteur
            self._mettre_a_jour_statistiques_tuteur(user, 'reponse_forum')
            
            return Response(serializer.data, status=201)
        
        return Response(serializer.errors, status=400)

    @action(detail=True, methods=['post'])
    def marquer_solution_et_badge(self, request, pk=None):
        """Marquer une réponse comme solution et attribuer un badge"""
        reponse = self.get_object()
        question = reponse.question
        user = request.user
        
        # Vérification des permissions
        if user not in [question.auteur] and user.role not in ['tuteur', 'enseignant', 'admin']:
            return Response({'error': 'Permission refusée'}, status=403)
        
        try:
            # Si une autre réponse était marquée solution, on la retire
            Reponse.objects.filter(question=question, est_solution=True).update(est_solution=False)
            
            # Marquer cette réponse comme solution
            reponse.est_solution = True
            reponse.save(update_fields=['est_solution'])
            
            # Marquer la question comme résolue
            question.est_resolue = True
            question.save(update_fields=['est_resolue'])
            
            # Attribuer le badge "Solution Expert"
            badge, created = BadgeTuteur.objects.get_or_create(
                tuteur=reponse.auteur,
                nom_badge='Solution Expert',
                defaults={
                    'description': f'A fourni la solution à la question: {question.titre[:50]}',
                    'points': 50
                }
            )
            
            if created:
                # Notifier le tuteur
                creer_notification(
                    reponse.auteur.id,
                    'badge',
                    'Nouveau badge obtenu !',
                    f'Félicitations ! Vous avez obtenu le badge "Solution Expert" (+50 points)'
                )
            
            # Mettre à jour les statistiques
            self._mettre_a_jour_statistiques_tuteur(reponse.auteur, 'solution')
            self._calculer_classement_tuteur(reponse.auteur)
            
            return Response({
                'status': 'solution_marquee',
                'badge_attribue': created,
                'badge': BadgeTuteurSerializer(badge).data if created else None
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['get'])
    def classement(self, request):
        """Classement des tuteurs les plus actifs"""
        periode = request.query_params.get('periode', 'mois')
        
        # Calculer la période
        if periode == 'mois':
            date_debut = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        elif periode == 'semaine':
            date_debut = timezone.now() - timedelta(days=7)
        else:  # année
            date_debut = timezone.now().replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Récupérer le classement
        classements = ClassementTuteur.objects.filter(
            mois__gte=date_debut
        ).select_related('tuteur').order_by('-score_total', 'position')[:20]
        
        serializer = ClassementTuteurSerializer(classements, many=True)
        return Response({
            'classement': serializer.data,
            'periode': periode,
            'date_calcul': timezone.now(),
            'ma_position': self._get_position_user(request.user, date_debut)
        })

    @action(detail=False, methods=['get'])
    def mes_badges(self, request):
        """Badges obtenus par le tuteur"""
        user = request.user
        badges = BadgeTuteur.objects.filter(tuteur=user).order_by('-date_obtention')
        serializer = BadgeTuteurSerializer(badges, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def mes_statistiques(self, request):
        """Statistiques personnelles du tuteur"""
        user = request.user
        periode = request.query_params.get('periode', 'mois')
        
        # Calculer la période
        if periode == 'mois':
            date_debut = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        elif periode == 'semaine':
            date_debut = timezone.now() - timedelta(days=7)
        else:  # année
            date_debut = timezone.now().replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Récupérer les statistiques
        stats, created = StatistiquesTuteur.objects.get_or_create(
            tuteur=user,
            mois=date_debut,
            defaults=self._calculer_statistiques_initiales(user, date_debut)
        )
        
        # Si pas créées, mettre à jour
        if not created:
            self._mettre_a_jour_statistiques(user, stats)
            stats.refresh_from_db()
        
        serializer = StatistiquesTuteurSerializer(stats)
        return Response(serializer.data)

    def _mettre_a_jour_statistiques_tuteur(self, user, action):
        """Mettre à jour les statistiques du tuteur"""
        mois_actuel = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        stats, created = StatistiquesTuteur.objects.get_or_create(
            tuteur=user,
            mois=mois_actuel
        )
        
        if action == 'reponse_forum':
            stats.nb_reponses_forum += 1
        elif action == 'solution':
            stats.nb_solutions = (stats.nb_solutions or 0) + 1
        
        stats.save(update_fields=['nb_reponses_forum', 'nb_solutions'])

    def _calculer_classement_tuteur(self, user):
        """Calculer ou mettre à jour le classement du tuteur"""
        mois_actuel = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Calculer le score total
        score_total = 0
        
        # Points pour les réponses au forum
        nb_reponses = Reponse.objects.filter(
            auteur=user,
            date__gte=mois_actuel
        ).count()
        score_total += nb_reponses * 10
        
        # Points pour les solutions
        nb_solutions = Reponse.objects.filter(
            auteur=user,
            est_solution=True,
            date__gte=mois_actuel
        ).count()
        score_total += nb_solutions * 50
        
        # Points pour les votes positifs
        votes_positifs = VoteReponse.objects.filter(
            reponse__auteur=user,
            valeur=1,
            date__gte=mois_actuel
        ).count()
        score_total += votes_positifs * 2
        
        # Mettre à jour le classement
        classement, created = ClassementTuteur.objects.update_or_create(
            tuteur=user,
            mois=mois_actuel,
            defaults={
                'score_total': score_total,
                'nb_reponses': nb_reponses,
                'nb_solutions': nb_solutions,
                'nb_votes_recus': votes_positifs
            }
        )
        
        if not created:
            classement.score_total = score_total
            classement.nb_reponses = nb_reponses
            classement.nb_solutions = nb_solutions
            classement.nb_votes_recus = votes_positifs
            classement.save()
        
        # Recalculer les positions
        self._recalculer_positions_classement(mois_actuel)

    def _recalculer_positions_classement(self, mois):
        """Recalculer les positions dans le classement"""
        classements = list(ClassementTuteur.objects.filter(
            mois=mois
        ).order_by('-score_total', 'date_creation'))
        
        for i, classement in enumerate(classements, 1):
            classement.position = i
            classement.save(update_fields=['position'])

    def _get_position_user(self, user, date_debut):
        """Obtenir la position de l'utilisateur dans le classement"""
        try:
            classement = ClassementTuteur.objects.get(
                tuteur=user,
                mois=date_debut
            )
            return classement.position
        except ClassementTuteur.DoesNotExist:
            return None

    def _calculer_statistiques_initiales(self, user, mois):
        """Calculer les statistiques initiales pour un mois"""
        return {
            'nb_seances': 0,
            'nb_etudiants_uniques': 0,
            'nb_ressources': 0,
            'nb_reponses_forum': 0,
            'note_moyenne': None,
            'satisfaction_moyenne': None,
            'taux_completion': None
        }

    def _mettre_a_jour_statistiques(self, user, stats):
        """Mettre à jour les statistiques avec les données réelles"""
        # Recalculer les réponses forum
        stats.nb_reponses_forum = Reponse.objects.filter(
            auteur=user,
            date__gte=stats.mois
        ).count()
        
        # Recalculer les solutions
        stats.nb_solutions = Reponse.objects.filter(
            auteur=user,
            est_solution=True,
            date__gte=stats.mois
        ).count()
        
        stats.save()


class ReponseEtendueViewSet(viewsets.ModelViewSet):
    """ViewSet pour les réponses étendues avec pièces jointes"""
    queryset = Reponse.objects.all()
    serializer_class = ReponseExtendedSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def ajouter_piece_jointe(self, request, pk=None):
        """Ajouter une pièce jointe à une réponse"""
        reponse = self.get_object()
        
        # Vérifier que l'utilisateur est l'auteur
        if reponse.auteur != request.user:
            return Response({'error': 'Permission refusée'}, status=403)
        
        if 'fichier' in request.FILES:
            fichier = request.FILES['fichier']
            piece_jointe = PieceJointeReponse.objects.create(
                reponse=reponse,
                fichier=fichier,
                nom_original=fichier.name,
                type_fichier=fichier.content_type,
                taille=fichier.size
            )
            
            return Response({
                'status': 'piece_jointe_ajoutee',
                'piece_jointe': {
                    'id': piece_jointe.id,
                    'nom_original': piece_jointe.nom_original,
                    'taille': piece_jointe.taille
                }
            })
        
        return Response({'error': 'Aucun fichier fourni'}, status=400)

    @action(detail=True, methods=['post'])
    def modifier_reponse(self, request, pk=None):
        """Modifier une réponse avec suivi"""
        reponse = self.get_object()
        
        # Vérifier que l'utilisateur est l'auteur
        if reponse.auteur != request.user:
            return Response({'error': 'Permission refusée'}, status=403)
        
        # Vérifier le délai de modification (15 minutes)
        if reponse.date < timezone.now() - timedelta(minutes=15):
            return Response({'error': 'Délai de modification dépassé (15 minutes)'}, status=400)
        
        # Créer ou mettre à jour l'extension
        extension, created = ReponseEtendue.objects.get_or_create(
            reponse_original=reponse,
            defaults={
                'auteur_modification': request.user,
                'raison_modification': request.data.get('raison', ''),
                'date_modification': timezone.now()
            }
        )
        
        if not created:
            extension.auteur_modification = request.user
            extension.raison_modification = request.data.get('raison', '')
            extension.date_modification = timezone.now()
            extension.save()
        
        # Mettre à jour le contenu
        reponse.contenu = request.data.get('contenu', reponse.contenu)
        reponse.save(update_fields=['contenu'])
        
        return Response({'status': 'reponse_modifiee'})


class BadgeTuteurViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour consulter les badges des tuteurs"""
    queryset = BadgeTuteur.objects.all()
    serializer_class = BadgeTuteurSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role in ['tuteur', 'enseignant']:
            return BadgeTuteur.objects.filter(tuteur=self.request.user)
        return BadgeTuteur.objects.none()


class ClassementTuteurViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour consulter le classement des tuteurs"""
    queryset = ClassementTuteur.objects.all()
    serializer_class = ClassementTuteurSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['mois']
    ordering_fields = ['score_total', 'position', 'nb_reponses', 'nb_solutions']
    ordering = ['-score_total', 'position']
