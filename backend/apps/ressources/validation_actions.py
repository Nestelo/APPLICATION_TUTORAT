from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q, Avg
from apps.notifications.models import Notification

# Ajouter ces méthodes dans RessourceViewSet (après la ligne 49)

@action(detail=True, methods=['post'], permission_classes=[IsAdmin])
def valider(self, request, pk=None):
    """Validation admin avec commentaire et notifications."""
    ressource = self.get_object()
    statut = request.data.get('statut')  # 'publie', 'rejete', 'modifications_demandees'
    commentaire = request.data.get('commentaire', '')
    demande_modifications = request.data.get('modifications', [])  # liste de modifications demandées
    
    # Ancien statut pour les logs
    ancien_statut = ressource.statut
    
    # Mise à jour du statut
    ressource.statut = statut
    ressource.save(update_fields=['statut'])
    
    # Créer notification pour l'auteur
    titre_map = {
        'publie': 'Ressource publiée',
        'rejete': 'Ressource rejetée', 
        'modifications_demandees': 'Modifications demandées'
    }
    
    message_map = {
        'publie': f'Votre ressource "{ressource.titre}" a été publiée avec succès',
        'rejete': f'Votre ressource "{ressource.titre}" a été rejetée. {commentaire}',
        'modifications_demandees': f'Votre ressource "{ressource.titre}" nécessite des modifications'
    }
    
    Notification.objects.create(
        destinataire=ressource.auteur,
        type='validation_ressource',
        titre=titre_map.get(statut, 'Validation de ressource'),
        message=message_map.get(statut, 'Votre ressource a été traitée'),
        lien=f'/ressources/{ressource.id}',
        metadata={
            'ressource_id': ressource.id,
            'ancien_statut': ancien_statut,
            'nouveau_statut': statut,
            'commentaire_admin': commentaire,
            'modifications': demande_modifications
        }
    )
    
    # Log de l'action pour les rapports
    from apps.accounts.models import User
    User.objects.filter(id=request.user.id).update(
        last_action=f'Validation ressource {ressource.id}: {ancien_statut} -> {statut}'
    )
    
    response_data = {
        'statut': statut,
        'message': f'Ressource {statut}',
        'notification_envoyee': True
    }
    
    if commentaire:
        response_data['commentaire'] = commentaire
    
    if demande_modifications:
        response_data['modifications'] = demande_modifications
    
    return Response(response_data)

@action(detail=True, methods=['post'], permission_classes=[IsAdmin])
def historique_validations(self, request, pk=None):
    """Voir l'historique des validations d'une ressource."""
    ressource = self.get_object()
    
    # Récupérer les notifications liées à cette ressource
    notifications = Notification.objects.filter(
        destinataire=ressource.auteur,
        type='validation_ressource',
        metadata__ressource_id=ressource.id
    ).order_by('-date_creation')
    
    historique = []
    for notif in notifications:
        metadata = notif.metadata or {}
        historique.append({
            'date': notif.date_creation,
            'titre': notif.titre,
            'message': notif.message,
            'ancien_statut': metadata.get('ancien_statut'),
            'nouveau_statut': metadata.get('nouveau_statut'),
            'commentaire': metadata.get('commentaire_admin'),
            'modifications': metadata.get('modifications', [])
        })
    
    return Response({
        'ressource': {
            'id': ressource.id,
            'titre': ressource.titre,
            'statut_actuel': ressource.statut
        },
        'historique': historique
    })

@action(detail=True, methods=['post'], permission_classes=[IsAdmin])
def apercu_validation(self, request, pk=None):
    """Aperçu avant validation (simule l'affichage final)."""
    ressource = self.get_object()
    
    # Calculer les statistiques
    notes = ressource.notes.all()
    notes_moyennes = notes.aggregate(avg_note=Avg('note'))['avg_note'] or 0
    
    # Récupérer les commentaires récents
    commentaires_recents = ressource.commentaires.order_by('-date')[:3]
    
    # Vérifier si l'auteur est actif
    auteur_actif = ressource.auteur.is_active and ressource.auteur.is_suspended == False
    
    return Response({
        'ressource': {
            'id': ressource.id,
            'titre': ressource.titre,
            'description': ressource.description,
            'matiere': ressource.matiere,
            'niveau': ressource.niveau,
            'type_fichier': ressource.type_fichier,
            'tags': ressource.tags.split(',') if ressource.tags else [],
            'date_publication': ressource.date_publication,
            'statut': ressource.statut
        },
        'auteur': {
            'id': ressource.auteur.id,
            'nom': ressource.auteur.nom,
            'prenom': ressource.auteur.prenom,
            'email': ressource.auteur.email,
            'role': ressource.auteur.role,
            'actif': auteur_actif
        },
        'statistiques': {
            'nb_vues': ressource.nb_vues,
            'nb_telechargements': ressource.nb_telechargements,
            'nb_notes': notes.count(),
            'note_moyenne': round(notes_moyennes, 2),
            'nb_commentaires': ressource.commentaires.count()
        },
        'commentaires_recents': [
            {
                'auteur': f"{c.auteur.prenom} {c.auteur.nom}",
                'contenu': c.contenu[:100] + '...' if len(c.contenu) > 100 else c.contenu,
                'date': c.date
            } for c in commentaires_recents
        ],
        'fichier': {
            'url': ressource.fichier.url if ressource.fichier else None,
            'taille': ressource.fichier.size if ressource.fichier else None,
            'type': ressource.type_fichier
        } if ressource.fichier else None,
        'lien_externe': ressource.lien_externe if ressource.type_fichier == 'lien' else None
    })

@action(detail=True, methods=['get'], permission_classes=[IsAdmin])
def ressources_en_attente(self, request):
    """Liste des ressources en attente de validation."""
    ressources_en_attente = Ressource.objects.filter(statut='en_attente').order_by('-date_publication')
    
    page = self.paginate_queryset(ressources_en_attente)
    serializer = self.get_serializer(page, many=True)
    
    return self.get_paginated_response(serializer.data)
