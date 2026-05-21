"""
Fichier temporaire pour ajouter l'endpoint des séances disponibles
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions
from rest_framework.response import Response
from django.utils import timezone
from apps.accounts.models import User
from .models import Seance

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def seances_disponibles_etudiants_temp(request):
    """
    Endpoint pour que les étudiants voient TOUTES les séances disponibles des tuteurs
    """
    try:
        user = request.user
        if user.role != 'etudiant':
            return Response({
                'error': 'Accès réservé aux étudiants'
            }, status=403)
        
        # Récupérer toutes les séances à venir
        seances = Seance.objects.filter(
            date_heure_debut__gte=timezone.now(),
            statut__in=['planifiee', 'confirmee']
        ).select_related('tuteur').prefetch_related('etudiants')
        
        seances_data = []
        for seance in seances:
            est_deja_inscrit = seance.etudiants.filter(id=user.id).exists()
            places_disponibles = seance.etudiants.count() < 10
            
            seance_info = {
                'id': seance.id,
                'sujet': seance.sujet,
                'description': seance.description or '',
                'date_heure_debut': seance.date_heure_debut,
                'date_heure_fin': seance.date_heure_fin,
                'duree': seance.duree,
                'lieu': seance.lieu,
                'en_ligne': seance.en_ligne,
                'statut': seance.statut,
                'statut_display': seance.statut,
                'nombre_etudiants': seance.etudiants.count(),
                'tuteur': {
                    'id': seance.tuteur.id,
                    'nom': seance.tuteur.nom,
                    'prenom': seance.tuteur.prenom,
                    'email': seance.tuteur.email
                },
                'etudiants': [
                    {
                        'id': etudiant.id,
                        'nom': etudiant.nom,
                        'prenom': etudiant.prenom,
                        'email': etudiant.email
                    }
                    for etudiant in seance.etudiants.all()
                ],
                'peut_s_inscrire': not est_deja_inscrit and places_disponibles
            }
            seances_data.append(seance_info)
        
        return Response({
            'success': True,
            'seances': seances_data,
            'total': len(seances_data)
        })
        
    except Exception as e:
        print(f"Erreur séances disponibles: {e}")
        return Response({
            'error': 'Erreur lors de la récupération des séances disponibles'
        }, status=500)
