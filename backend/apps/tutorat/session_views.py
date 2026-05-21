"""
Endpoints pour la gestion complète des séances de tutorat
Fichier créé séparément pour éviter les conflits avec views.py existant
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, timedelta
from apps.accounts.models import User
from .models import OffreTutorat, Disponibilite, Seance
from apps.notifications.services import creer_notification

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def test_simple(request):
    """
    Test simple pour vérifier que le module est bien chargé
    """
    return Response({
        'message': 'Module session_views chargé avec succès!',
        'user': request.user.prenom if request.user.is_authenticated else 'Anonymous'
    })

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def disponibilites_tuteur(request, tutor_id):
    """
    Obtenir les disponibilités détaillées d'un tuteur spécifique avec créneaux disponibles.
    """
    try:
        # Vérifier que le tuteur existe
        tuteur = User.objects.get(id=tutor_id, role='tuteur')
        
        # Récupérer les disponibilités récurrentes
        dispos = Disponibilite.objects.filter(
            tuteur=tuteur,
            est_recurrent=True
        ).order_by('jour_semaine', 'heure_debut')
        
        # Récupérer les séances existantes pour éviter les conflits
        seances_existantes = Seance.objects.filter(
            tuteur=tuteur,
            date_heure_debut__gte=timezone.now(),
            statut__in=['planifiee', 'confirmee']
        )
        
        disponibilites_data = []
        
        for dispo in dispos:
            # Générer les créneaux pour les 2 prochaines semaines
            date_actuelle = timezone.now().date()
            for i in range(14):  # 2 semaines
                date_creneau = date_actuelle + timedelta(days=i)
                
                # Vérifier si le jour correspond
                if date_creneau.weekday() == dispo.jour_semaine:
                    # Créer datetime pour le créneau
                    heure_debut = datetime.strptime(dispo.heure_debut.strftime('%H:%M'), '%H:%M').time()
                    heure_fin = datetime.strptime(dispo.heure_fin.strftime('%H:%M'), '%H:%M').time()
                    
                    datetime_debut = timezone.make_aware(
                        datetime.combine(date_creneau, heure_debut)
                    )
                    datetime_fin = timezone.make_aware(
                        datetime.combine(date_creneau, heure_fin)
                    )
                    
                    # Vérifier les conflits avec les séances existantes
                    conflit = False
                    for seance in seances_existantes:
                        if (datetime_debut < seance.date_heure_fin and 
                            datetime_fin > seance.date_heure_debut):
                            conflit = True
                            break
                    
                    if not conflit and datetime_debut > timezone.now():
                        disponibilites_data.append({
                            'id': dispo.id,
                            'date': date_creneau.isoformat(),
                            'heure_debut': datetime_debut.isoformat(),
                            'heure_fin': datetime_fin.isoformat(),
                            'jour_semaine': dispo.jour_semaine,
                            'jour_display': dispo.get_jour_semaine_display(),
                            'disponible': True
                        })
        
        return Response({
            'tuteur': {
                'id': tuteur.id,
                'nom': tuteur.nom,
                'prenom': tuteur.prenom,
                'matieres_enseignees': tuteur.matieres_enseignees
            },
            'disponibilites': disponibilites_data
        })
        
    except User.DoesNotExist:
        return Response({
            'error': 'Tuteur introuvable'
        }, status=404)
    except Exception as e:
        print(f"Erreur récupération disponibilités: {e}")
        return Response({
            'error': 'Erreur lors de la récupération des disponibilités'
        }, status=500)


@api_view(["POST", "GET"])
@permission_classes([permissions.IsAuthenticated])
def inscrire_seance(request):
    """
    Inscrire un étudiant à une séance de tutorat avec notifications automatiques.
    """
    # Debug: afficher la méthode
    print(f"Méthode de requête: {request.method}")
    
    if request.method == "GET":
        return Response({
            'message': 'Endpoint accessible en GET',
            'method': request.method,
            'user': request.user.username if request.user.is_authenticated else 'Anonymous'
        })
    
    # Le reste du code POST reste inchangé
    try:
        etudiant = request.user
        if etudiant.role != 'etudiant':
            return Response({
                'error': 'Accès réservé aux étudiants'
            }, status=403)
        
        data = request.data
        offre_id = data.get('offre_id')
        tuteur_id = data.get('tuteur_id')
        date_heure_debut = data.get('date_heure_debut')
        duree = data.get('duree', 60)
        sujet = data.get('sujet', data.get('matiere', 'Séance de tutorat'))  # Accepter matiere aussi
        description = data.get('description', '')
        
        # Si pas d'offre_id, utiliser tuteur_id directement
        if offre_id:
            # Vérifier l'offre
            try:
                offre = OffreTutorat.objects.get(id=offre_id, est_active=True)
                tuteur = offre.tuteur
            except OffreTutorat.DoesNotExist:
                return Response({
                    'error': 'Offre introuvable ou inactive'
                }, status=404)
        elif tuteur_id:
            # Réservation directe sans offre
            try:
                tuteur = User.objects.get(id=tuteur_id, role='tuteur')
                offre = None  # Pas d'offre associée
            except User.DoesNotExist:
                return Response({
                    'error': 'Tuteur introuvable'
                }, status=404)
        else:
            return Response({
                'error': 'offre_id ou tuteur_id est requis'
            }, status=400)
        
        # Parser la date
        debut_datetime = timezone.make_aware(
            datetime.strptime(date_heure_debut, '%Y-%m-%dT%H:%M:%S')
        )
        fin_datetime = debut_datetime + timedelta(minutes=duree)
        
        # Vérifier si l'étudiant n'est pas déjà inscrit à une séance au même créneau
        inscription_existante = Seance.objects.filter(
            etudiants=etudiant,
            date_heure_debut__lt=fin_datetime,
            date_heure_fin__gt=debut_datetime,
            statut__in=['planifiee', 'confirmee']
        ).exists()
        
        if inscription_existante:
            return Response({
                'error': 'Vous êtes déjà inscrit à une séance à ce créneau'
            }, status=400)
        
        # Créer la séance
        seance_data = {
            'tuteur': tuteur,
            'sujet': sujet,
            'description': description,
            'date_heure_debut': debut_datetime,
            'date_heure_fin': fin_datetime,
            'duree': duree,
            'statut': 'planifiee'
        }
        
        # Ajouter les champs spécifiques à l'offre si elle existe
        if offre:
            seance_data['offre'] = offre
            seance_data['en_ligne'] = offre.en_ligne
            seance_data['lieu'] = offre.lieu if offre.presentiel else ''
            seance_data['lien_visio'] = offre.lien_visio if offre.en_ligne else ''
        else:
            # Réservation directe - valeurs par défaut
            seance_data['en_ligne'] = True
            seance_data['lieu'] = ''
            seance_data['lien_visio'] = ''
        
        seance = Seance.objects.create(**seance_data)
        
        # Ajouter l'étudiant à la séance
        seance.etudiants.add(etudiant)
        
        # Envoyer la notification au tuteur
        try:
            creer_notification(
                destinataire_id=tuteur.id,
                type_notification='nouvelle_seance',
                titre='Nouvelle séance réservée',
                message=f'{etudiant.get_full_name()} a réservé une séance pour {sujet} le {debut_datetime.strftime("%d/%m/%Y à %H:%M")}',
                lien=f'/tutorat/seances/{seance.id}'
            )
        except Exception as e:
            print(f"Erreur notification tuteur: {e}")
        
        # Envoyer la confirmation à l'étudiant
        try:
            creer_notification(
                destinataire_id=etudiant.id,
                type_notification='confirmation_seance',
                titre='Séance confirmée',
                message=f'Votre séance "{sujet}" avec {offre.tuteur.get_full_name()} est prévue le {debut_datetime.strftime("%d/%m/%Y à %H:%M")}',
                lien=f'/tutorat/mes-seances/{seance.id}'
            )
        except Exception as e:
            print(f"Erreur notification étudiant: {e}")
        
        return Response({
            'success': True,
            'message': 'Séance réservée avec succès',
            'seance': {
                'id': seance.id,
                'sujet': seance.sujet,
                'date_heure_debut': seance.date_heure_debut.isoformat(),
                'date_heure_fin': seance.date_heure_fin.isoformat(),
                'tuteur': {
                    'id': offre.tuteur.id,
                    'nom': offre.tuteur.nom,
                    'prenom': offre.tuteur.prenom
                },
                'lien_visio': seance.lien_visio,
                'lieu': seance.lieu
            }
        })
        
    except Exception as e:
        print(f"Erreur inscription séance: {e}")
        return Response({
            'error': 'Erreur lors de l\'inscription à la séance'
        }, status=500)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def annuler_seance(request, seance_id):
    """
    Annuler une séance avec notifications et validation des délais.
    """
    try:
        user = request.user
        
        try:
            seance = Seance.objects.get(id=seance_id)
        except Seance.DoesNotExist:
            return Response({
                'error': 'Séance introuvable'
            }, status=404)
        
        # Vérifier les permissions
        if user.role == 'etudiant':
            if user not in seance.etudiants.all():
                return Response({
                    'error': 'Vous n\'êtes pas inscrit à cette séance'
                }, status=403)
        elif user.role == 'tuteur':
            if seance.tuteur != user:
                return Response({
                    'error': 'Cette séance ne vous appartient pas'
                }, status=403)
        else:
            return Response({
                'error': 'Accès non autorisé'
            }, status=403)
        
        # Vérifier que la séance peut être annulée
        if seance.statut in ['terminee', 'annulee']:
            return Response({
                'error': 'Cette séance ne peut plus être annulée'
            }, status=400)
        
        # Vérifier le délai d'annulation (24h minimum)
        if seance.date_heure_debut - timezone.now() < timedelta(hours=24):
            return Response({
                'error': 'L\'annulation doit se faire au moins 24 heures à l\'avance'
            }, status=400)
        
        motif = request.data.get('motif', 'Annulation par l\'utilisateur')
        
        # Mettre à jour le statut
        seance.statut = 'annulee'
        seance.commentaire_annulation = motif
        seance.date_annulation = timezone.now()
        seance.save()
        
        # Notifier l'autre partie
        if user.role == 'etudiant':
            # Notifier le tuteur
            destinataire = seance.tuteur
            message_annulation = f'L\'étudiant {user.get_full_name()} a annulé la séance "{seance.sujet}" du {seance.date_heure_debut.strftime("%d/%m/%Y %H:%M")}'
        else:
            # Notifier tous les étudiants de la séance
            destinataires = seance.etudiants.all()
            message_annulation = f'Le tuteur {user.get_full_name()} a annulé la séance "{seance.sujet}" du {seance.date_heure_debut.strftime("%d/%m/%Y %H:%M")}'
        
        try:
            if user.role == 'etudiant':
                creer_notification(
                    destinataire_id=destinataire.id,
                    type_notification='annulation_seance',
                    titre='Séance annulée',
                    message=message_annulation,
                    lien=f'/tutorat/seances/{seance.id}'
                )
            else:
                for etudiant in destinataires:
                    creer_notification(
                        destinataire_id=etudiant.id,
                        type_notification='annulation_seance',
                        titre='Séance annulée',
                        message=message_annulation,
                        lien=f'/tutorat/mes-seances/{seance.id}'
                    )
        except Exception as e:
            print(f"Erreur notification annulation: {e}")
        
        return Response({
            'success': True,
            'message': 'Séance annulée avec succès'
        })
        
    except Exception as e:
        print(f"Erreur annulation séance: {e}")
        return Response({
            'error': 'Erreur lors de l\'annulation de la séance'
        }, status=500)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def confirmer_participation(request, seance_id):
    """
    Confirmer la participation à une séance (étudiant).
    """
    try:
        etudiant = request.user
        if etudiant.role != 'etudiant':
            return Response({
                'error': 'Accès réservé aux étudiants'
            }, status=403)
        
        try:
            seance = Seance.objects.get(id=seance_id)
        except Seance.DoesNotExist:
            return Response({
                'error': 'Séance introuvable'
            }, status=404)
        
        if etudiant not in seance.etudiants.all():
            return Response({
                'error': 'Vous n\'êtes pas inscrit à cette séance'
            }, status=403)
        
        if seance.statut != 'planifiee':
            return Response({
                'error': 'Cette séance ne peut plus être confirmée'
            }, status=400)
        
        # Confirmer la séance
        seance.statut = 'confirmee'
        seance.save()
        
        # Notifier le tuteur
        try:
            creer_notification(
                destinataire_id=seance.tuteur.id,
                type_notification='confirmation_participation',
                titre='Participation confirmée',
                message=f'{etudiant.get_full_name()} a confirmé sa participation à la séance "{seance.sujet}" du {seance.date_heure_debut.strftime("%d/%m/%Y %H:%M")}',
                lien=f'/tutorat/seances/{seance.id}'
            )
        except Exception as e:
            print(f"Erreur notification confirmation: {e}")
        
        return Response({
            'success': True,
            'message': 'Participation confirmée avec succès'
        })
        
    except Exception as e:
        print(f"Erreur confirmation participation: {e}")
        return Response({
            'error': 'Erreur lors de la confirmation de participation'
        }, status=500)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def mes_seances(request):
    """
    Obtenir les séances de l'utilisateur connecté (étudiant ou tuteur) avec historique complet.
    """
    try:
        user = request.user
        maintenant = timezone.now()
        
        if user.role == 'etudiant':
            # Séances où l'étudiant est inscrit
            seances_query = Seance.objects.filter(
                etudiants=user
            ).select_related('tuteur', 'offre').order_by('-date_heure_debut')
        elif user.role == 'tuteur':
            # Séances données par le tuteur
            seances_query = Seance.objects.filter(
                tuteur=user
            ).select_related('offre').prefetch_related('etudiants').order_by('-date_heure_debut')
        else:
            return Response({
                'error': 'Accès non autorisé'
            }, status=403)
        
        # Séparer les séances à venir et passées
        seances_avenir = seances_query.filter(date_heure_debut__gt=maintenant)
        seances_passees = seances_query.filter(date_heure_debut__lte=maintenant)
        
        def serializer_seance(seance, user_role):
            data = {
                'id': seance.id,
                'sujet': seance.sujet,
                'description': seance.description,
                'date_heure_debut': seance.date_heure_debut.isoformat(),
                'date_heure_fin': seance.date_heure_fin.isoformat(),
                'duree': seance.duree,
                'statut': seance.statut,
                'statut_display': seance.get_statut_display(),
                'en_ligne': seance.en_ligne,
                'lien_visio': seance.lien_visio,
                'lieu': seance.lieu,
                'date_creation': seance.date_creation.isoformat(),
                'commentaire_annulation': seance.commentaire_annulation,
                'date_annulation': seance.date_annulation.isoformat() if seance.date_annulation else None
            }
            
            if user_role == 'etudiant':
                data.update({
                    'tuteur': {
                        'id': seance.tuteur.id,
                        'nom': seance.tuteur.nom,
                        'prenom': seance.tuteur.prenom,
                        'photo_url': seance.tuteur.photo.url if seance.tuteur.photo else None
                    },
                    'matiere': seance.offre.matiere if seance.offre else '',
                    'offre_id': seance.offre.id if seance.offre else None
                })
            elif user_role == 'tuteur':
                data.update({
                    'etudiants': [
                        {
                            'id': etudiant.id,
                            'nom': etudiant.nom,
                            'prenom': etudiant.prenom,
                            'email': etudiant.email
                        }
                        for etudiant in seance.etudiants.all()
                    ],
                    'nombre_etudiants': seance.nombre_etudiants
                })
            
            return data
        
        seances_avenir_data = [serializer_seance(s, user.role) for s in seances_avenir]
        seances_passees_data = [serializer_seance(s, user.role) for s in seances_passees]
        
        return Response({
            'seances_avenir': seances_avenir_data,
            'seances_passees': seances_passees_data,
            'total_avenir': len(seances_avenir_data),
            'total_passees': len(seances_passees_data)
        })
        
    except Exception as e:
        print(f"Erreur récupération séances: {e}")
        return Response({
            'error': 'Erreur lors de la récupération des séances'
        }, status=500)

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def inscrire_seance_existante(request):
    """
    Permet à un étudiant de s'inscrire à une séance existante créée par un tuteur.
    Le tuteur pourra ensuite accepter ou refuser l'inscription.
    """
    try:
        etudiant = request.user
        if etudiant.role != 'etudiant':
            return Response({
                'error': 'Accès réservé aux étudiants'
            }, status=403)
        
        seance_id = request.data.get('seance_id')
        if not seance_id:
            return Response({
                'error': 'seance_id est requis'
            }, status=400)
        
        # Vérifier que la séance existe
        try:
            seance = Seance.objects.get(id=seance_id)
        except Seance.DoesNotExist:
            return Response({
                'error': 'Séance introuvable'
            }, status=404)
        
        # Vérifier que la séance est à venir
        if seance.date_heure_debut <= timezone.now():
            return Response({
                'error': 'Impossible de s\'inscrire à une séance passée'
            }, status=400)
        
        # Vérifier que l'étudiant n'est pas déjà inscrit
        if seance.etudiants.filter(id=etudiant.id).exists():
            return Response({
                'error': 'Vous êtes déjà inscrit à cette séance'
            }, status=400)
        
        # Ajouter l'étudiant à la séance
        seance.etudiants.add(etudiant)
        
        # Notifier le tuteur de la nouvelle inscription
        try:
            creer_notification(
                destinataire=seance.tuteur,
                type_notification='inscription_seance',
                titre='Nouvelle inscription à votre séance',
                message=f'{etudiant.get_full_name()} souhaite rejoindre votre séance "{seance.sujet}" du {seance.date_heure_debut.strftime("%d/%m/%Y à %H:%M")}',
                lien=f'/tutorat/seances/{seance.id}'
            )
        except Exception as e:
            print(f"Erreur notification tuteur: {e}")
        
        return Response({
            'success': True,
            'message': 'Inscription envoyée avec succès. Le tuteur doit valider votre participation.',
            'seance': {
                'id': seance.id,
                'sujet': seance.sujet,
                'date_heure_debut': seance.date_heure_debut,
                'tuteur': {
                    'id': seance.tuteur.id,
                    'nom': seance.tuteur.nom,
                    'prenom': seance.tuteur.prenom
                }
            }
        })
        
    except Exception as e:
        print(f"Erreur inscription séance existante: {e}")
        return Response({
            'error': 'Erreur lors de l\'inscription à la séance'
        }, status=500)

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def gerer_inscription_seance(request):
    """
    Permet à un tuteur d'accepter ou de refuser l'inscription d'un étudiant à sa séance.
    """
    try:
        tuteur = request.user
        if tuteur.role != 'tuteur':
            return Response({
                'error': 'Accès réservé aux tuteurs'
            }, status=403)
        
        seance_id = request.data.get('seance_id')
        etudiant_id = request.data.get('etudiant_id')
        action = request.data.get('action')  # 'accepter' ou 'refuser'
        
        if not all([seance_id, etudiant_id, action]):
            return Response({
                'error': 'seance_id, etudiant_id et action sont requis'
            }, status=400)
        
        if action not in ['accepter', 'refuser']:
            return Response({
                'error': 'action doit être "accepter" ou "refuser"'
            }, status=400)
        
        # Vérifier que la séance existe et appartient au tuteur
        try:
            seance = Seance.objects.get(id=seance_id, tuteur=tuteur)
        except Seance.DoesNotExist:
            return Response({
                'error': 'Séance introuvable ou accès non autorisé'
            }, status=404)
        
        # Vérifier que l'étudiant existe
        try:
            etudiant = User.objects.get(id=etudiant_id, role='etudiant')
        except User.DoesNotExist:
            return Response({
                'error': 'Étudiant introuvable'
            }, status=404)
        
        # Vérifier que l'étudiant est inscrit à la séance
        if not seance.etudiants.filter(id=etudiant.id).exists():
            return Response({
                'error': 'L\'étudiant n\'est pas inscrit à cette séance'
            }, status=400)
        
        if action == 'refuser':
            # Retirer l'étudiant de la séance
            seance.etudiants.remove(etudiant)
            
            # Notifier l'étudiant du refus
            try:
                creer_notification(
                    destinataire=etudiant,
                    type_notification='refus_inscription',
                    titre='Inscription refusée',
                    message=f'Le tuteur {tuteur.get_full_name()} a refusé votre inscription à la séance "{seance.sujet}"',
                    lien=f'/tutorat/seances'
                )
            except Exception as e:
                print(f"Erreur notification étudiant: {e}")
            
            return Response({
                'success': True,
                'message': 'Inscription refusée avec succès'
            })
        
        elif action == 'accepter':
            # L'étudiant reste inscrit (validation de l'inscription)
            
            # Notifier l'étudiant de l'acceptation
            try:
                creer_notification(
                    destinataire=etudiant,
                    type_notification='acceptation_inscription',
                    titre='Inscription acceptée',
                    message=f'Le tuteur {tuteur.get_full_name()} a accepté votre inscription à la séance "{seance.sujet}" du {seance.date_heure_debut.strftime("%d/%m/%Y à %H:%M")}',
                    lien=f'/tutorat/seances/{seance.id}'
                )
            except Exception as e:
                print(f"Erreur notification étudiant: {e}")
            
            return Response({
                'success': True,
                'message': 'Inscription acceptée avec succès'
            })
        
    except Exception as e:
        print(f"Erreur gestion inscription: {e}")
        return Response({
            'error': 'Erreur lors de la gestion de l\'inscription'
        }, status=500)

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def test_seances_disponibles(request):
    """
    Endpoint de test simple pour vérifier l'accès
    """
    try:
        user = request.user
        return Response({
            'success': True,
            'message': f'Accès OK pour {user.prenom} {user.nom} (role: {user.role})',
            'user_id': user.id,
            'count_seances': Seance.objects.filter(
                date_heure_debut__gte=timezone.now(),
                statut__in=['planifiee', 'confirmee']
            ).count()
        })
    except Exception as e:
        return Response({
            'error': f'Erreur: {str(e)}'
        }, status=500)

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def seances_disponibles_etudiants(request):
    """
    Endpoint spécifique pour que les étudiants voient TOUTES les séances disponibles
    des tuteurs (pas seulement celles où ils sont inscrits).
    """
    try:
        user = request.user
        if user.role != 'etudiant':
            return Response({
                'error': 'Accès réservé aux étudiants'
            }, status=403)
        
        # Récupérer toutes les séances à venir des tuteurs
        seances = Seance.objects.filter(
            date_heure_debut__gte=timezone.now(),
            statut__in=['planifiee', 'confirmee']
        ).select_related('tuteur').prefetch_related('etudiants')
        
        # Serializer simple pour les étudiants
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
        print(f"Erreur séances disponibles étudiants: {e}")
        return Response({
            'error': 'Erreur lors de la récupération des séances disponibles'
        }, status=500)
