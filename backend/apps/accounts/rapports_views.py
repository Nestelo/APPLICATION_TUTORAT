from datetime import timedelta
from django.db.models import Count, Avg, Q, F, Sum
from django.utils import timezone
from django.http import HttpResponse, HttpResponseForbidden, HttpResponseBadRequest
from django import http

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import exceptions, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.accounts.models import User
from apps.tutorat.models import Seance, OffreTutorat, Evaluation
from apps.forum.models import Question, Reponse
from apps.ressources.models import Ressource

from .export_generators import RapportExporter


# ---------- Fonctions helper pour récupérer les données ----------

def get_rapports_utilisateurs_data(period):
    """Récupère les données pour le rapport utilisateurs"""
    now = timezone.now()
    
    # Définir les bornes de dates
    if period == 'mois':
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == 'trimestre':
        month = (now.month - 1) // 3 * 3 + 1
        start_date = now.replace(month=month, day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == 'annee':
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:  # all
        start_date = None
    
    # Base queryset
    users_qs = User.objects.all()
    if start_date:
        users_qs = users_qs.filter(date_inscription__gte=start_date)
    
    # Statistiques générales
    total_users = users_qs.count()
    users_by_role = users_qs.values('role').annotate(count=Count('id')).order_by('role')
    users_by_filiere = users_qs.values('filiere').annotate(count=Count('id')).order_by('-count')[:10]
    users_by_annee = users_qs.values('annee').annotate(count=Count('id')).order_by('annee')
    
    # Croissance (comparaison période précédente)
    if start_date and period != 'all':
        if period == 'mois':
            prev_start = start_date - timedelta(days=32)
            prev_end = start_date
        elif period == 'trimestre':
            prev_start = start_date - timedelta(days=92)
            prev_end = start_date
        else:  # annee
            prev_start = start_date - timedelta(days=366)
            prev_end = start_date
            
        prev_count = User.objects.filter(date_inscription__range=[prev_start, prev_end]).count()
        current_count = users_qs.count()
        growth_rate = ((current_count - prev_count) / (prev_count or 1)) * 100
    else:
        growth_rate = 0
    
    # Nouveaux inscrits récents
    recent_users = users_qs.order_by('-date_inscription')[:10].values(
        'id', 'email', 'nom', 'prenom', 'role', 'filiere', 'annee', 'date_inscription'
    )
    
    # Taux d'activité (basé sur les séances)
    active_users = User.objects.filter(
        Q(seances_tuteur__isnull=False) | Q(seances_etudiant__isnull=False)
    ).distinct().count()
    activity_rate = (active_users / (total_users or 1)) * 100
    
    return {
        'period': period,
        'total_users': total_users,
        'growth_rate': round(growth_rate, 2),
        'activity_rate': round(activity_rate, 2),
        'users_by_role': list(users_by_role),
        'users_by_filiere': list(users_by_filiere),
        'users_by_annee': list(users_by_annee),
        'recent_users': list(recent_users),
    }


def get_rapports_tutorat_data(period):
    """Récupère les données pour le rapport tutorat"""
    now = timezone.now()
    
    # Définir les bornes de dates
    if period == 'mois':
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == 'trimestre':
        month = (now.month - 1) // 3 * 3 + 1
        start_date = now.replace(month=month, day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == 'annee':
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:  # all
        start_date = None
    
    # Statistiques des séances
    seances_qs = Seance.objects.all()
    if start_date:
        seances_qs = seances_qs.filter(date_heure_debut__gte=start_date)
    
    total_seances = seances_qs.count()
    seances_by_status = seances_qs.values('statut').annotate(count=Count('id')).order_by('statut')
    seances_terminees = seances_qs.filter(statut='terminee').count()
    completion_rate = (seances_terminees / (total_seances or 1)) * 100
    
    # Matières les plus demandées
    matieres_populaires = OffreTutorat.objects.filter(
        est_active=True
    ).values('matiere').annotate(
        count=Count('seance'),
        avg_tarif=Avg('tarif')
    ).order_by('-count')[:10]
    
    # Tuteurs les plus actifs
    tuteurs_actifs = User.objects.filter(
        role__in=['tuteur', 'enseignant']
    ).annotate(
        seance_count=Count('seances_tuteur')
    ).filter(seance_count__gt=0).order_by('-seance_count')[:10].values(
        'id', 'nom', 'prenom', 'email', 'seance_count'
    )
    
    # Satisfaction moyenne
    avg_satisfaction = Evaluation.objects.aggregate(
        avg_note=Avg('note')
    )['avg_note'] or 0
    
    # Distribution par type (individuel/groupe)
    type_distribution = OffreTutorat.objects.filter(
        est_active=True
    ).values('type').annotate(count=Count('id')).order_by('type')
    
    # Évolution mensuelle des séances (6 derniers mois)
    monthly_evolution = []
    for i in range(6):
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_start = month_start - timedelta(days=30 * i)
        month_end = month_start + timedelta(days=31)
        
        month_count = Seance.objects.filter(
            date_heure_debut__range=[month_start, month_end]
        ).count()
        
        monthly_evolution.append({
            'month': month_start.strftime('%Y-%m'),
            'count': month_count
        })
    
    return {
        'period': period,
        'total_seances': total_seances,
        'completion_rate': round(completion_rate, 2),
        'average_satisfaction': round(avg_satisfaction, 2),
        'seances_by_status': list(seances_by_status),
        'matieres_populaires': list(matieres_populaires),
        'tuteurs_actifs': list(tuteurs_actifs),
        'type_distribution': list(type_distribution),
        'monthly_evolution': monthly_evolution,
    }


def get_rapports_ressources_data(period):
    """Récupère les données pour le rapport ressources"""
    now = timezone.now()
    
    # Définir les bornes de dates
    if period == 'mois':
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == 'trimestre':
        month = (now.month - 1) // 3 * 3 + 1
        start_date = now.replace(month=month, day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == 'annee':
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:  # all
        start_date = None
    
    # Statistiques générales
    ressources_qs = Ressource.objects.all()
    if start_date:
        ressources_qs = ressources_qs.filter(date_publication__gte=start_date)
    
    total_ressources = ressources_qs.count()
    published_ressources = ressources_qs.filter(statut='publie').count()
    publication_rate = (published_ressources / (total_ressources or 1)) * 100
    
    # Ressources les plus téléchargées
    most_downloaded = ressources_qs.order_by('-nb_telechargements')[:10].values(
        'id', 'titre', 'matiere', 'nb_telechargements', 'nb_vues', 'type_fichier'
    )
    
    # Ressources les plus vues
    most_viewed = ressources_qs.order_by('-nb_vues')[:10].values(
        'id', 'titre', 'matiere', 'nb_telechargements', 'nb_vues', 'type_fichier'
    )
    
    # Distribution par type de fichier
    type_distribution = ressources_qs.values('type_fichier').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Matières les plus représentées avec détails
    matieres_distribution = ressources_qs.values('matiere').annotate(
        count=Count('id'),
        avg_downloads=Avg('nb_telechargements'),
        avg_views=Avg('nb_vues'),
        total_downloads=Sum('nb_telechargements'),
        total_views=Sum('nb_vues')
    ).filter(matiere__isnull=False).exclude(matiere='').order_by('-count')[:10]
    
    # Auteurs les plus productifs
    prolific_authors = User.objects.annotate(
        resource_count=Count('ressources_globales')
    ).filter(resource_count__gt=0).order_by('-resource_count')[:10].values(
        'id', 'nom', 'prenom', 'email', 'resource_count'
    )
    
    # Évolution mensuelle des publications
    monthly_evolution = []
    for i in range(6):
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_start = month_start - timedelta(days=30 * i)
        month_end = month_start + timedelta(days=31)
        
        month_count = Ressource.objects.filter(
            date_publication__range=[month_start, month_end]
        ).count()
        
        monthly_evolution.append({
            'month': month_start.strftime('%Y-%m'),
            'count': month_count
        })
    
    # Statistiques de téléchargement
    total_downloads = ressources_qs.aggregate(
        total=Sum('nb_telechargements')
    )['total'] or 0
    
    total_views = ressources_qs.aggregate(
        total=Sum('nb_vues')
    )['total'] or 0
    
    avg_downloads_per_resource = total_downloads / (total_ressources or 1)
    avg_views_per_resource = total_views / (total_ressources or 1)
    
    return {
        'period': period,
        'total_ressources': total_ressources,
        'published_ressources': published_ressources,
        'publication_rate': round(publication_rate, 2),
        'total_downloads': total_downloads,
        'total_views': total_views,
        'avg_downloads_per_resource': round(avg_downloads_per_resource, 2),
        'avg_views_per_resource': round(avg_views_per_resource, 2),
        'most_downloaded': list(most_downloaded),
        'most_viewed': list(most_viewed),
        'type_distribution': list(type_distribution),
        'matieres_distribution': list(matieres_distribution),
        'prolific_authors': list(prolific_authors),
        'monthly_evolution': monthly_evolution,
    }


def get_rapports_forum_data(period):
    """Récupère les données pour le rapport forum"""
    now = timezone.now()
    
    # Définir les bornes de dates
    if period == 'mois':
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == 'trimestre':
        month = (now.month - 1) // 3 * 3 + 1
        start_date = now.replace(month=month, day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == 'annee':
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:  # all
        start_date = None
    
    # Statistiques générales
    questions_qs = Question.objects.all()
    if start_date:
        questions_qs = questions_qs.filter(date_publication__gte=start_date)
    
    total_questions = questions_qs.count()
    resolved_questions = questions_qs.filter(est_resolue=True).count()
    resolution_rate = (resolved_questions / (total_questions or 1)) * 100
    
    # Questions les plus vues
    most_viewed_questions = questions_qs.order_by('-nb_vues')[:10].values(
        'id', 'titre', 'matiere', 'nb_vues', 'est_resolue', 'date_publication'
    )
    
    # Questions les plus répondues
    most_answered = questions_qs.annotate(
        answer_count=Count('reponses')
    ).order_by('-answer_count')[:10].values(
        'id', 'titre', 'matiere', 'answer_count', 'est_resolue', 'date_publication'
    )
    
    # Matières les plus actives
    matieres_activity = questions_qs.values('matiere').annotate(
        question_count=Count('id'),
        resolved_count=Count('id', filter=Q(est_resolue=True))
    ).order_by('-question_count')[:10]
    
    # Utilisateurs les plus actifs
    active_users = User.objects.annotate(
        question_count=Count('questions'),
        answer_count=Count('reponses')
    ).filter(
        Q(question_count__gt=0) | Q(answer_count__gt=0)
    ).order_by('-question_count', '-answer_count')[:10].values(
        'id', 'nom', 'prenom', 'email', 'question_count', 'answer_count'
    )
    
    # Réponses par question (distribution)
    answer_distribution = [
        {'range': '0 réponses', 'count': questions_qs.annotate(answer_count=Count('reponses')).filter(answer_count=0).count()},
        {'range': '1-2 réponses', 'count': questions_qs.annotate(answer_count=Count('reponses')).filter(answer_count__range=[1, 2]).count()},
        {'range': '3-5 réponses', 'count': questions_qs.annotate(answer_count=Count('reponses')).filter(answer_count__range=[3, 5]).count()},
        {'range': '6+ réponses', 'count': questions_qs.annotate(answer_count=Count('reponses')).filter(answer_count__gte=6).count()},
    ]
    
    # Évolution mensuelle
    monthly_evolution = []
    for i in range(6):
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_start = month_start - timedelta(days=30 * i)
        month_end = month_start + timedelta(days=31)
        
        month_questions = Question.objects.filter(
            date_publication__range=[month_start, month_end]
        ).count()
        
        month_resolved = Question.objects.filter(
            date_publication__range=[month_start, month_end],
            est_resolue=True
        ).count()
        
        monthly_evolution.append({
            'month': month_start.strftime('%Y-%m'),
            'questions': month_questions,
            'resolved': month_resolved
        })
    
    # Temps moyen de résolution (approximatif)
    resolved_questions_with_dates = questions_qs.filter(
        est_resolue=True,
        date_derniere_reponse__isnull=False
    )
    
    avg_resolution_time = 0
    if resolved_questions_with_dates.exists():
        total_time = sum([
            (q.date_derniere_reponse - q.date_publication).total_seconds() / 3600  # en heures
            for q in resolved_questions_with_dates
        ])
        avg_resolution_time = total_time / resolved_questions_with_dates.count()
    
    return {
        'period': period,
        'total_questions': total_questions,
        'resolved_questions': resolved_questions,
        'resolution_rate': round(resolution_rate, 2),
        'avg_resolution_time_hours': round(avg_resolution_time, 2),
        'most_viewed': list(most_viewed_questions),
        'most_answered': list(most_answered),
        'matieres_activity': list(matieres_activity),
        'active_users': list(active_users),
        'answer_distribution': answer_distribution,
        'monthly_evolution': monthly_evolution,
    }


# ---------- Rapports détaillés (admin uniquement) ----------

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def rapports_utilisateurs(request):
    """
    Rapport détaillé sur les utilisateurs
    Paramètres: period (mois, trimestre, annee, all)
    """
    period = request.GET.get('period', 'mois')
    now = timezone.now()
    
    # Définir les bornes de dates
    if period == 'mois':
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == 'trimestre':
        month = (now.month - 1) // 3 * 3 + 1
        start_date = now.replace(month=month, day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == 'annee':
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:  # all
        start_date = None
    
    # Base queryset
    users_qs = User.objects.all()
    if start_date:
        users_qs = users_qs.filter(date_inscription__gte=start_date)
    
    # Statistiques générales
    total_users = users_qs.count()
    users_by_role = users_qs.values('role').annotate(count=Count('id')).order_by('role')
    users_by_filiere = users_qs.values('filiere').annotate(count=Count('id')).order_by('-count')[:10]
    users_by_annee = users_qs.values('annee').annotate(count=Count('id')).order_by('annee')
    
    # Croissance (comparaison période précédente)
    if start_date and period != 'all':
        if period == 'mois':
            prev_start = start_date - timedelta(days=32)
            prev_end = start_date
        elif period == 'trimestre':
            prev_start = start_date - timedelta(days=92)
            prev_end = start_date
        else:  # annee
            prev_start = start_date - timedelta(days=366)
            prev_end = start_date
            
        prev_count = User.objects.filter(date_inscription__range=[prev_start, prev_end]).count()
        current_count = users_qs.count()
        growth_rate = ((current_count - prev_count) / (prev_count or 1)) * 100
    else:
        growth_rate = 0
    
    # Nouveaux inscrits récents
    recent_users = users_qs.order_by('-date_inscription')[:10].values(
        'id', 'email', 'nom', 'prenom', 'role', 'filiere', 'annee', 'date_inscription'
    )
    
    # Taux d'activité (basé sur les séances)
    active_users = User.objects.filter(
        Q(seances_tuteur__isnull=False) | Q(seances_etudiant__isnull=False)
    ).distinct().count()
    activity_rate = (active_users / (total_users or 1)) * 100
    
    # Matières les plus populaires (basées sur les matières enseignées des tuteurs)
    matieres_populaires = []
    tuteurs = users_qs.filter(role__in=['tuteur', 'enseignant'])
    for tuteur in tuteurs:
        if tuteur.matieres_enseignees:
            for matiere in tuteur.matieres_enseignees:
                matieres_populaires.append(matiere)
    
    # Compter les matières
    from collections import Counter
    matiere_counts = Counter(matieres_populaires)
    top_matieres = [{'matiere': mat, 'count': count} for mat, count in matiere_counts.most_common(10)]
    
    data = {
        'period': period,
        'total_users': total_users,
        'growth_rate': round(growth_rate, 2),
        'activity_rate': round(activity_rate, 2),
        'users_by_role': list(users_by_role),
        'users_by_filiere': list(users_by_filiere),
        'users_by_annee': list(users_by_annee),
        'recent_users': list(recent_users),
        'top_matieres': top_matieres,
    }
    
    return Response(data)


# ---------- Rapports Tutorat ----------

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def rapports_tutorat(request):
    """
    Rapport détaillé sur le tutorat
    Paramètres: period (mois, trimestre, annee, all)
    """
    period = request.GET.get('period', 'mois')
    now = timezone.now()
    
    # Définir les bornes de dates
    if period == 'mois':
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == 'trimestre':
        month = (now.month - 1) // 3 * 3 + 1
        start_date = now.replace(month=month, day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == 'annee':
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:  # all
        start_date = None
    
    # Statistiques des séances
    seances_qs = Seance.objects.all()
    if start_date:
        seances_qs = seances_qs.filter(date_heure_debut__gte=start_date)
    
    total_seances = seances_qs.count()
    seances_by_status = seances_qs.values('statut').annotate(count=Count('id')).order_by('statut')
    seances_terminees = seances_qs.filter(statut='terminee').count()
    completion_rate = (seances_terminees / (total_seances or 1)) * 100
    
    # Matières les plus demandées
    matieres_populaires = OffreTutorat.objects.filter(
        est_active=True
    ).values('matiere').annotate(
        count=Count('seance'),
        avg_tarif=Avg('tarif')
    ).order_by('-count')[:10]
    
    # Tuteurs les plus actifs
    tuteurs_actifs = User.objects.filter(
        role__in=['tuteur', 'enseignant']
    ).annotate(
        seance_count=Count('seances_tuteur')
    ).filter(seance_count__gt=0).order_by('-seance_count')[:10].values(
        'id', 'nom', 'prenom', 'email', 'seance_count'
    )
    
    # Satisfaction moyenne
    avg_satisfaction = Evaluation.objects.aggregate(
        avg_note=Avg('note')
    )['avg_note'] or 0
    
    # Distribution par type (individuel/groupe)
    type_distribution = OffreTutorat.objects.filter(
        est_active=True
    ).values('type').annotate(count=Count('id')).order_by('type')
    
    # Évolution mensuelle des séances (6 derniers mois)
    monthly_evolution = []
    for i in range(6):
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_start = month_start - timedelta(days=30 * i)
        month_end = month_start + timedelta(days=31)
        
        month_count = Seance.objects.filter(
            date_heure_debut__range=[month_start, month_end]
        ).count()
        
        monthly_evolution.append({
            'month': month_start.strftime('%Y-%m'),
            'count': month_count
        })
    
    data = {
        'period': period,
        'total_seances': total_seances,
        'completion_rate': round(completion_rate, 2),
        'average_satisfaction': round(avg_satisfaction, 2),
        'seances_by_status': list(seances_by_status),
        'matieres_populaires': list(matieres_populaires),
        'tuteurs_actifs': list(tuteurs_actifs),
        'type_distribution': list(type_distribution),
        'monthly_evolution': monthly_evolution,
    }
    
    return Response(data)


# ---------- Rapports Ressources ----------

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def rapports_ressources(request):
    """
    Rapport détaillé sur les ressources
    Paramètres: period (mois, trimestre, annee, all)
    """
    period = request.GET.get('period', 'mois')
    now = timezone.now()
    
    # Définir les bornes de dates
    if period == 'mois':
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == 'trimestre':
        month = (now.month - 1) // 3 * 3 + 1
        start_date = now.replace(month=month, day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == 'annee':
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:  # all
        start_date = None
    
    # Statistiques générales
    ressources_qs = Ressource.objects.all()
    if start_date:
        ressources_qs = ressources_qs.filter(date_publication__gte=start_date)
    
    total_ressources = ressources_qs.count()
    published_ressources = ressources_qs.filter(statut='publie').count()
    publication_rate = (published_ressources / (total_ressources or 1)) * 100
    
    # Ressources les plus téléchargées
    most_downloaded = ressources_qs.order_by('-nb_telechargements')[:10].values(
        'id', 'titre', 'matiere', 'nb_telechargements', 'nb_vues', 'type_fichier'
    )
    
    # Ressources les plus vues
    most_viewed = ressources_qs.order_by('-nb_vues')[:10].values(
        'id', 'titre', 'matiere', 'nb_telechargements', 'nb_vues', 'type_fichier'
    )
    
    # Distribution par type de fichier
    type_distribution = ressources_qs.values('type_fichier').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Matières les plus représentées avec détails
    matieres_distribution = ressources_qs.values('matiere').annotate(
        count=Count('id'),
        avg_downloads=Avg('nb_telechargements'),
        avg_views=Avg('nb_vues'),
        total_downloads=Sum('nb_telechargements'),
        total_views=Sum('nb_vues')
    ).filter(matiere__isnull=False).exclude(matiere='').order_by('-count')[:10]
    
    # Auteurs les plus productifs
    prolific_authors = User.objects.annotate(
        resource_count=Count('ressources_globales')
    ).filter(resource_count__gt=0).order_by('-resource_count')[:10].values(
        'id', 'nom', 'prenom', 'email', 'resource_count'
    )
    
    # Évolution mensuelle des publications
    monthly_evolution = []
    for i in range(6):
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_start = month_start - timedelta(days=30 * i)
        month_end = month_start + timedelta(days=31)
        
        month_count = Ressource.objects.filter(
            date_publication__range=[month_start, month_end]
        ).count()
        
        monthly_evolution.append({
            'month': month_start.strftime('%Y-%m'),
            'count': month_count
        })
    
    # Statistiques de téléchargement
    total_downloads = ressources_qs.aggregate(
        total=Sum('nb_telechargements')
    )['total'] or 0
    
    total_views = ressources_qs.aggregate(
        total=Sum('nb_vues')
    )['total'] or 0
    
    avg_downloads_per_resource = total_downloads / (total_ressources or 1)
    avg_views_per_resource = total_views / (total_ressources or 1)
    
    data = {
        'period': period,
        'total_ressources': total_ressources,
        'published_ressources': published_ressources,
        'publication_rate': round(publication_rate, 2),
        'total_downloads': total_downloads,
        'total_views': total_views,
        'avg_downloads_per_resource': round(avg_downloads_per_resource, 2),
        'avg_views_per_resource': round(avg_views_per_resource, 2),
        'most_downloaded': list(most_downloaded),
        'most_viewed': list(most_viewed),
        'type_distribution': list(type_distribution),
        'matieres_distribution': list(matieres_distribution),
        'prolific_authors': list(prolific_authors),
        'monthly_evolution': monthly_evolution,
    }
    
    return Response(data)


# ---------- Rapports Forum ----------

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def rapports_forum(request):
    """
    Rapport détaillé sur le forum
    Paramètres: period (mois, trimestre, annee, all)
    """
    period = request.GET.get('period', 'mois')
    now = timezone.now()
    
    # Définir les bornes de dates
    if period == 'mois':
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == 'trimestre':
        month = (now.month - 1) // 3 * 3 + 1
        start_date = now.replace(month=month, day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == 'annee':
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:  # all
        start_date = None
    
    # Statistiques générales
    questions_qs = Question.objects.all()
    if start_date:
        questions_qs = questions_qs.filter(date_publication__gte=start_date)
    
    total_questions = questions_qs.count()
    resolved_questions = questions_qs.filter(est_resolue=True).count()
    resolution_rate = (resolved_questions / (total_questions or 1)) * 100
    
    # Questions les plus vues
    most_viewed_questions = questions_qs.order_by('-nb_vues')[:10].values(
        'id', 'titre', 'matiere', 'nb_vues', 'est_resolue', 'date_publication'
    )
    
    # Questions les plus répondues
    most_answered = questions_qs.annotate(
        answer_count=Count('reponses')
    ).order_by('-answer_count')[:10].values(
        'id', 'titre', 'matiere', 'answer_count', 'est_resolue', 'date_publication'
    )
    
    # Matières les plus actives
    matieres_activity = questions_qs.values('matiere').annotate(
        question_count=Count('id'),
        resolved_count=Count('id', filter=Q(est_resolue=True))
    ).order_by('-question_count')[:10]
    
    # Utilisateurs les plus actifs
    active_users = User.objects.annotate(
        question_count=Count('questions'),
        answer_count=Count('reponses')
    ).filter(
        Q(question_count__gt=0) | Q(answer_count__gt=0)
    ).order_by('-question_count', '-answer_count')[:10].values(
        'id', 'nom', 'prenom', 'email', 'question_count', 'answer_count'
    )
    
    # Réponses par question (distribution)
    answer_distribution = [
        {'range': '0 réponses', 'count': questions_qs.annotate(answer_count=Count('reponses')).filter(answer_count=0).count()},
        {'range': '1-2 réponses', 'count': questions_qs.annotate(answer_count=Count('reponses')).filter(answer_count__range=[1, 2]).count()},
        {'range': '3-5 réponses', 'count': questions_qs.annotate(answer_count=Count('reponses')).filter(answer_count__range=[3, 5]).count()},
        {'range': '6+ réponses', 'count': questions_qs.annotate(answer_count=Count('reponses')).filter(answer_count__gte=6).count()},
    ]
    
    # Évolution mensuelle
    monthly_evolution = []
    for i in range(6):
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_start = month_start - timedelta(days=30 * i)
        month_end = month_start + timedelta(days=31)
        
        month_questions = Question.objects.filter(
            date_publication__range=[month_start, month_end]
        ).count()
        
        month_resolved = Question.objects.filter(
            date_publication__range=[month_start, month_end],
            est_resolue=True
        ).count()
        
        monthly_evolution.append({
            'month': month_start.strftime('%Y-%m'),
            'questions': month_questions,
            'resolved': month_resolved
        })
    
    # Temps moyen de résolution (approximatif)
    resolved_questions_with_dates = questions_qs.filter(
        est_resolue=True,
        date_derniere_reponse__isnull=False
    )
    
    avg_resolution_time = 0
    if resolved_questions_with_dates.exists():
        total_time = sum([
            (q.date_derniere_reponse - q.date_publication).total_seconds() / 3600  # en heures
            for q in resolved_questions_with_dates
        ])
        avg_resolution_time = total_time / resolved_questions_with_dates.count()
    
    data = {
        'period': period,
        'total_questions': total_questions,
        'resolved_questions': resolved_questions,
        'resolution_rate': round(resolution_rate, 2),
        'avg_resolution_time_hours': round(avg_resolution_time, 2),
        'most_viewed': list(most_viewed_questions),
        'most_answered': list(most_answered),
        'matieres_activity': list(matieres_activity),
        'active_users': list(active_users),
        'answer_distribution': answer_distribution,
        'monthly_evolution': monthly_evolution,
    }
    
    return Response(data)


# ---------- Export des rapports ----------

from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator

def export_rapport(request, rapport_type):
    """
    Export des rapports en différents formats (CSV, Excel, Word, PDF, PowerPoint)
    Paramètres: rapport_type (utilisateurs, tutorat, ressources, forum)
    Query params: format (csv, excel, word, pdf, powerpoint) - défaut: csv
                 period (mois, trimestre, annee, all)
    """
    # Authentification JWT manuelle
    jwt_auth = JWTAuthentication()
    try:
        auth_result = jwt_auth.authenticate(request)
        if auth_result is None:
            return HttpResponseForbidden("Authentication required")
        user, token = auth_result
        request.user = user
    except exceptions.AuthenticationFailed:
        return HttpResponseForbidden("Authentication failed")
    
    # Vérification des permissions
    if not request.user.is_staff and not request.user.is_superuser:
        return HttpResponseForbidden("Permission denied")
    
    if rapport_type not in ['utilisateurs', 'tutorat', 'ressources', 'forum']:
        return HttpResponseBadRequest("Type de rapport invalide")
    
    period = request.GET.get('period', 'mois')
    format_export = request.GET.get('format', 'csv')
    
    # Récupérer les données du rapport correspondant
    if rapport_type == 'utilisateurs':
        data = get_rapports_utilisateurs_data(period)
    elif rapport_type == 'tutorat':
        data = get_rapports_tutorat_data(period)
    elif rapport_type == 'ressources':
        data = get_rapports_ressources_data(period)
    elif rapport_type == 'forum':
        data = get_rapports_forum_data(period)
    
    # Créer l'exporteur de rapport
    exporter = RapportExporter(rapport_type, period, data)
    
    # Exporter selon le format demandé
    if format_export == 'excel':
        return exporter.export_excel()
    elif format_export == 'word':
        return exporter.export_word()
    elif format_export == 'pdf':
        return exporter.export_pdf()
    elif format_export == 'powerpoint':
        return exporter.export_powerpoint()
    else:  # CSV par défaut
        return exporter.export_csv()


# Les autres vues d'export ne sont plus nécessaires car le format est géré via query parameter dans export_rapport
