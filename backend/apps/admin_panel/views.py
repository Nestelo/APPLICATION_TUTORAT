from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import timedelta
from apps.forum.models import Question, Reponse, ModerationLog
from apps.forum.services import ForumStatsService
from apps.messaging.models import GroupeTutorat, SessionTutorat
from apps.accounts.models import User
import json

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard_stats(request):
    """Statistiques globales pour le dashboard admin"""
    
    # Stats forum
    forum_stats = ForumStatsService.get_stats_globales()
    
    # Stats utilisateurs
    user_stats = {
        'total_users': User.objects.count(),
        'total_etudiants': User.objects.filter(role='etudiant').count(),
        'total_tuteurs': User.objects.filter(role__in=['tuteur', 'enseignant']).count(),
        'total_admins': User.objects.filter(role='admin').count(),
        'users_actifs_7j': User.objects.filter(
            date_derniere_connexion__gte=timezone.now() - timedelta(days=7)
        ).count(),
        'nouvelles_inscriptions_30j': User.objects.filter(
            date_inscription__gte=timezone.now() - timedelta(days=30)
        ).count(),
    }
    
    # Stats messagerie
    messaging_stats = {
        'total_groupes': GroupeTutorat.objects.count(),
        'groupes_actifs': GroupeTutorat.objects.filter(est_actif=True).count(),
        'total_sessions': SessionTutorat.objects.count(),
        'sessions_planifiees': SessionTutorat.objects.filter(statut='planifie').count(),
        'sessions_en_cours': SessionTutorat.objects.filter(statut='en_cours').count(),
        'sessions_terminees': SessionTutorat.objects.filter(statut='terminee').count(),
    }
    
    # Stats modération
    moderation_stats = {
        'questions_signalees': Question.objects.filter(deleted=True).count(),
        'reponses_signalees': Reponse.objects.filter(deleted=True).count(),
        'actions_moderation': ModerationLog.objects.count(),
        'actions_24h': ModerationLog.objects.filter(
            created_at__gte=timezone.now() - timedelta(hours=24)
        ).count(),
    }
    
    # Tendance des questions (30 derniers jours)
    questions_trend = []
    for i in range(30):
        date = timezone.now().date() - timedelta(days=i)
        count = Question.objects.filter(
            date_publication__date=date,
            deleted=False
        ).count()
        questions_trend.append({
            'date': date.strftime('%Y-%m-%d'),
            'count': count
        })
    questions_trend.reverse()
    
    # Top matières
    top_matieres = Question.objects.filter(
        deleted=False,
        matiere__isnull=False
    ).values('matiere').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    # Top tuteurs (par points)
    from apps.accounts.models import TutorProfile
    top_tuteurs = TutorProfile.objects.select_related('user').order_by('-points')[:10]
    top_tuteurs_data = [
        {
            'nom': f"{t.user.prenom} {t.user.nom}",
            'points': t.points,
            'solutions': t.badge_solutions,
            'aide': t.badge_aide
        }
        for t in top_tuteurs
    ]
    
    return Response({
        'forum': forum_stats,
        'users': user_stats,
        'messaging': messaging_stats,
        'moderation': moderation_stats,
        'trends': {
            'questions': questions_trend
        },
        'top_matieres': list(top_matieres),
        'top_tuteurs': top_tuteurs_data,
        'last_updated': timezone.now().isoformat()
    })

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_moderation_queue(request):
    """Queue de modération avec items à approuver/rejeter"""
    
    # Questions récentes nécessitant une modération
    questions_recentes = Question.objects.filter(
        deleted=False
    ).select_related('auteur').order_by('-date_publication')[:20]
    
    # Réponses récentes nécessitant une modération
    reponses_recentes = Reponse.objects.filter(
        deleted=False
    ).select_related('auteur', 'question').order_by('-date')[:20]
    
    # Signalements (simulés - à implémenter avec vrai système)
    signalements = []
    
    return Response({
        'questions': [
            {
                'id': q.id,
                'titre': q.titre,
                'contenu': q.contenu[:200] + '...' if len(q.contenu) > 200 else q.contenu,
                'auteur': f"{q.auteur.prenom} {q.auteur.nom}",
                'matiere': q.matiere,
                'priorite': q.priorite,
                'date_publication': q.date_publication.isoformat(),
                'nb_reponses': q.reponses.filter(deleted=False).count(),
                'est_resolue': q.est_resolue
            }
            for q in questions_recentes
        ],
        'reponses': [
            {
                'id': r.id,
                'contenu': r.contenu[:200] + '...' if len(r.contenu) > 200 else r.contenu,
                'auteur': f"{r.auteur.prenom} {r.auteur.nom}",
                'question': {
                    'id': r.question.id,
                    'titre': r.question.titre
                },
                'date': r.date.isoformat(),
                'nb_votes': r.nb_votes,
                'est_solution': r.est_solution
            }
            for r in reponses_recentes
        ],
        'signalements': signalements
    })

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_approve_question(request, pk):
    """Approuver une question"""
    try:
        question = Question.objects.get(pk=pk)
        # Log l'action
        ModerationLog.objects.create(
            moderator=request.user,
            action='approve',
            target_type='question',
            target_id=question.id,
            reason='Question approuvée par l\'administrateur'
        )
        return Response({'status': 'approved'})
    except Question.DoesNotExist:
        return Response({'error': 'Question non trouvée'}, status=404)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_reject_question(request, pk):
    """Rejeter une question"""
    try:
        question = Question.objects.get(pk=pk)
        reason = request.data.get('reason', 'Rejet par l\'administrateur')
        
        question.deleted = True
        question.save()
        
        # Log l'action
        ModerationLog.objects.create(
            moderator=request.user,
            action='reject',
            target_type='question',
            target_id=question.id,
            reason=reason
        )
        
        return Response({'status': 'rejected'})
    except Question.DoesNotExist:
        return Response({'error': 'Question non trouvée'}, status=404)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_approve_response(request, pk):
    """Approuver une réponse"""
    try:
        reponse = Reponse.objects.get(pk=pk)
        # Log l'action
        ModerationLog.objects.create(
            moderator=request.user,
            action='approve',
            target_type='reponse',
            target_id=reponse.id,
            reason='Réponse approuvée par l\'administrateur'
        )
        return Response({'status': 'approved'})
    except Reponse.DoesNotExist:
        return Response({'error': 'Réponse non trouvée'}, status=404)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_reject_response(request, pk):
    """Rejeter une réponse"""
    try:
        reponse = Reponse.objects.get(pk=pk)
        reason = request.data.get('reason', 'Rejet par l\'administrateur')
        
        reponse.deleted = True
        reponse.save()
        
        # Log l'action
        ModerationLog.objects.create(
            moderator=request.user,
            action='reject',
            target_type='reponse',
            target_id=reponse.id,
            reason=reason
        )
        
        return Response({'status': 'rejected'})
    except Reponse.DoesNotExist:
        return Response({'error': 'Réponse non trouvée'}, status=404)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_export_data(request):
    """Exporter les données au format JSON/CSV"""
    export_type = request.query_params.get('type', 'json')
    
    if export_type == 'questions':
        questions = Question.objects.filter(deleted=False).values(
            'id', 'titre', 'contenu', 'matiere', 'priorite', 'est_resolue',
            'nb_vues', 'date_publication'
        )
        return Response(list(questions))

@api_view(['POST'])
@permission_classes([IsAdminUser])
def suspend_user(request, user_id):
    """Suspendre un utilisateur"""
    try:
        user = User.objects.get(pk=user_id)
        reason = request.data.get('reason', 'Suspension par l\'administrateur')
        until = request.data.get('until', None)
        
        user.is_active = False
        user.is_suspended = True
        user.suspension_reason = reason
        if until:
            user.suspension_until = until
        user.save()
        
        # Log l'action
        ModerationLog.objects.create(
            moderator=request.user,
            action='suspend',
            target_type='user',
            target_id=user.id,
            reason=reason
        )
        
        return Response({'status': 'suspended'})
    except User.DoesNotExist:
        return Response({'error': 'Utilisateur non trouvé'}, status=404)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def unsuspend_user(request, user_id):
    """Réactiver un utilisateur suspendu"""
    try:
        user = User.objects.get(pk=user_id)
        
        user.is_active = True
        user.is_suspended = False
        user.suspension_reason = ''
        user.suspension_until = None
        user.save()
        
        # Log l'action
        ModerationLog.objects.create(
            moderator=request.user,
            action='unsuspend',
            target_type='user',
            target_id=user.id,
            reason='Réactivation par l\'administrateur'
        )
        
        return Response({'status': 'unsuspended'})
    except User.DoesNotExist:
        return Response({'error': 'Utilisateur non trouvé'}, status=404)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_reports(request):
    """Lister les signalements"""
    status = request.query_params.get('status', 'pending')
    
    # Simuler des signalements (à remplacer avec vrai modèle)
    reports = [
        {
            'id': 1,
            'reporter': 'Utilisateur Test',
            'reason': 'Contenu inapproprié',
            'status': status,
            'created_at': timezone.now().isoformat(),
        }
    ]
    
    return Response(reports)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def resolve_report(request, report_id):
    """Résoudre un signalement"""
    try:
        action = request.data.get('action')
        reason = request.data.get('reason', 'Résolu par l\'administrateur')
        
        # Log l'action
        ModerationLog.objects.create(
            moderator=request.user,
            action=f'resolve_report_{action}',
            target_type='report',
            target_id=report_id,
            reason=reason
        )
        
        return Response({'status': 'resolved'})
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_export_users(request):
    """Exporter les utilisateurs"""
    users = User.objects.values(
        'id', 'email', 'nom', 'prenom', 'role', 'filiere', 'annee',
        'date_inscription', 'date_derniere_connexion'
    )
    return Response(list(users))

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_export_stats(request):
    """Exporter les statistiques"""
    stats = admin_dashboard_stats(request)
    return Response(stats)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_activity_logs(request):
    """Logs d'activité de modération"""
    logs = ModerationLog.objects.select_related('moderator').order_by('-created_at')[:50]
    
    return Response([
        {
            'id': log.id,
            'action': log.action,
            'target_type': log.target_type,
            'target_id': log.target_id,
            'reason': log.reason,
            'moderator': f"{log.moderator.prenom} {log.moderator.nom}",
            'created_at': log.created_at.isoformat()
        }
        for log in logs
    ])
