from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions, status
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from apps.accounts.models import User
from apps.tutorat.models import OffreTutorat
from django.db import models
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """
    Endpoint de login avec vérification du rôle sélectionné.
    """
    try:
        email = request.data.get('email', '')
        password = request.data.get('password', '')
        selected_role = request.data.get('role', '')  # Rôle sélectionné par l'utilisateur
        
        print(f"Tentative de connexion: {email}, rôle sélectionné: {selected_role}")
        
        # Authentification simple
        user = authenticate(username=email, password=password)
        
        if user:
            # Vérifier si l'utilisateur est actif
            if not user.is_active:
                print(f"Utilisateur non actif: {email}")
                return Response({
                    'message': 'Votre compte n\'est pas encore activé par l\'administrateur',
                    'error': 'account_inactive'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # VÉRIFICATION DU RÔLE AVEC ASSOUPLISSEMENT POUR ENSEIGNANT/TUTEUR
            # Si un rôle a été sélectionné, vérifier qu'il correspond au rôle réel de l'utilisateur
            if selected_role:
                # Cas particulier : le rôle sélectionné est "tuteur" et l'utilisateur est "enseignant"
                if selected_role == 'tuteur' and user.role == 'enseignant':
                    # OK : on autorise la connexion
                    print(f"✅ Connexion autorisée pour enseignant via le rôle tuteur : {user.email}")
                elif selected_role != user.role:
                    # Sinon, incompatibilité
                    print(f"⚠️ Rôle incompatible: sélectionné={selected_role}, réel={user.role}")
                    return Response({
                        'message': f'Le rôle sélectionné ({selected_role}) ne correspond pas à votre rôle réel ({user.role}). Veuillez choisir le bon rôle.',
                        'error': 'role_mismatch',
                        'real_role': user.role,
                        'selected_role': selected_role
                    }, status=status.HTTP_403_FORBIDDEN)
            
            # Générer les tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            print(f"✅ Connexion réussie pour: {user.prenom} {user.nom} (rôle: {user.role})")
            
            # Retourner le profil complet de l'utilisateur
            serializer = UserSerializer(user, context={'request': request})
            
            return Response({
                'message': 'Connexion réussie',
                'access': access_token,
                'refresh': refresh_token,
                'user': serializer.data
            }, status=status.HTTP_200_OK)
        else:
            print(f"❌ Échec connexion pour: {email}")
            return Response({
                'message': 'Email ou mot de passe incorrect',
                'error': 'invalid_credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except Exception as e:
        print(f"❌ Erreur connexion: {e}")
        import traceback
        traceback.print_exc()
        return Response({
            'message': 'Erreur serveur',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register_view(request):
    """
    Endpoint d'inscription pour les nouveaux utilisateurs.
    """
    try:
        print(f"Données reçues: {request.data}")
        
        email = request.data.get('email', '')
        password = request.data.get('password', '')
        confirm_password = request.data.get('confirm_password', '') or request.data.get('password2', '')
        role = request.data.get('role', 'etudiant')
        prenom = request.data.get('prenom', '')
        nom = request.data.get('nom', '')
        filiere = request.data.get('filiere', '')
        annee = request.data.get('annee', '')
        photo = request.data.get('photo', None)
        
        print(f"Tentative d'inscription: {email}, rôle: {role}")
        
        # Validation des champs requis
        if not email or not password or not prenom or not nom:
            return Response({
                'message': 'Tous les champs sont obligatoires',
                'error': 'missing_fields',
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validation des mots de passe
        if password != confirm_password:
            return Response({
                'message': 'Les mots de passe ne correspondent pas',
                'error': 'password_mismatch'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validation de la longueur du mot de passe
        if len(password) < 6:
            return Response({
                'message': 'Le mot de passe doit contenir au moins 6 caractères',
                'error': 'password_too_short'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier si l'email existe déjà
        if User.objects.filter(email=email).exists():
            return Response({
                'message': 'Cet email est déjà utilisé',
                'error': 'email_exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Créer l'utilisateur (par défaut inactif, activation par admin)
        user = User.objects.create_user(
            email=email,
            password=password,
            prenom=prenom,
            nom=nom,
            role=role,
            filiere=filiere,
            annee=annee,
            is_active=False  # Compte inactif jusqu'à validation admin
        )
        
        print(f"✅ Utilisateur créé: {user.email}")
        
        return Response({
            'message': 'Inscription réussie. Votre compte sera activé par un administrateur.',
            'user': {
                'id': user.id,
                'email': user.email,
                'prenom': user.prenom,
                'nom': user.nom,
                'role': user.role,
                'is_active': user.is_active
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"❌ Erreur inscription: {e}")
        import traceback
        traceback.print_exc()
        return Response({
            'message': 'Erreur lors de l\'inscription',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """
    Endpoint pour changer le mot de passe de l'utilisateur connecté.
    """
    try:
        old_password = request.data.get('old_password', '')
        new_password = request.data.get('new_password', '')
        
        if not old_password or not new_password:
            return Response({
                'message': 'Ancien et nouveau mots de passe sont requis',
                'error': 'missing_fields'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 6:
            return Response({
                'message': 'Le nouveau mot de passe doit contenir au moins 6 caractères',
                'error': 'password_too_short'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        
        # Vérifier l'ancien mot de passe
        if not user.check_password(old_password):
            return Response({
                'message': 'Ancien mot de passe incorrect',
                'error': 'invalid_old_password'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Changer le mot de passe
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Mot de passe changé avec succès'
        })
        
    except Exception as e:
        print(f"Erreur changement mot de passe: {e}")
        return Response({
            'message': 'Erreur lors du changement de mot de passe',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def demande_tuteur_view(request):
    """
    Endpoint pour soumettre une demande pour devenir tuteur.
    """
    try:
        user = request.user
        
        if user.role == 'tuteur':
            return Response({
                'message': 'Vous êtes déjà un tuteur',
                'error': 'already_tutor'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mettre à jour le rôle de l'utilisateur vers 'tuteur'
        user.role = 'tuteur'
        user.save()
        
        print(f"Demande tuteur approuvée pour: {user.email}")
        
        return Response({
            'message': 'Votre demande pour devenir tuteur a été approuvée',
            'user': {
                'id': user.id,
                'email': user.email,
                'prenom': user.prenom,
                'nom': user.nom,
                'role': user.role
            }
        })
        
    except Exception as e:
        print(f"Erreur demande tuteur: {e}")
        return Response({
            'message': 'Erreur lors de la demande de tuteur',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def test_debug(request):
    """
    Endpoint de test pour vérifier les logs du backend.
    """
    from apps.accounts.models import User
    
    total_users = User.objects.count()
    etudiants = User.objects.filter(role='etudiant').count()
    tuteurs = User.objects.filter(role='tuteur').count()
    admins = User.objects.filter(role='admin').count()
    
    tuteurs_list = User.objects.filter(role='tuteur')
    
    return Response({
        'message': 'Debug backend réussi',
        'total_users': total_users,
        'etudiants': etudiants,
        'tuteurs': tuteurs,
        'admins': admins,
        'tuteurs_list': [
            {'prenom': t.prenom, 'nom': t.nom, 'actif': t.is_active}
            for t in tuteurs_list
        ]
    })


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def stats_publiques(request):
    """
    Endpoint de statistiques publiques pour le frontend.
    """
    from apps.accounts.models import User
    from apps.tutorat.models import OffreTutorat, Seance, Evaluation
    
    try:
        # Statistiques des utilisateurs
        etudiants_actifs = User.objects.filter(role='etudiant', is_active=True).count()
        tuteurs_actifs = User.objects.filter(role='tuteur', is_active=True).count()
        admins_actifs = User.objects.filter(role='admin', is_active=True).count()
        
        total_users = etudiants_actifs + tuteurs_actifs + admins_actifs
        
        # Statistiques des offres
        total_offres = OffreTutorat.objects.count()
        offres_gratuites = OffreTutorat.objects.filter(tarif=0, est_active=True).count()
        
        # Statistiques des séances
        try:
            total_seances = Seance.objects.count()
            seances_terminees = Seance.objects.filter(statut='terminee').count()
        except:
            total_seances = 0
            seances_terminees = 0
        
        # Statistiques des évaluations
        try:
            total_evaluations = Evaluation.objects.count()
            note_moyenne_generale = Evaluation.objects.aggregate(avg_note=models.Avg('note'))['avg_note'] or 0
        except:
            total_evaluations = 0
            note_moyenne_generale = 0
        
        # Tuteurs les plus notés
        top_tuteurs = User.objects.filter(
            role='tuteur', 
            is_active=True,
            note_moyenne__isnull=False
        ).order_by('-note_moyenne')[:5]
        
        return Response({
            'message': 'Statistiques chargées avec succès',
            'utilisateurs': {
                'total': total_users,
                'etudiants': etudiants_actifs,
                'tuteurs': tuteurs_actifs,
                'admins': admins_actifs
            },
            'offres': {
                'total': total_offres,
                'gratuites': offres_gratuites,
                'payantes': total_offres - offres_gratuites
            },
            'seances': {
                'total': total_seances,
                'terminees': seances_terminees,
                'en_cours': total_seances - seances_terminees
            },
            'evaluations': {
                'total': total_evaluations,
                'note_moyenne': round(note_moyenne_generale, 2)
            },
            'top_tuteurs': [
                {
                    'id': t.id,
                    'nom': f"{t.prenom} {t.nom}",
                    'note': round(t.note_moyenne or 0, 2),
                    'nombre_evaluations': t.nombre_evaluations or 0
                }
                for t in top_tuteurs
            ]
        })
        
    except Exception as e:
        print(f"Erreur stats publiques: {e}")
        return Response({
            'message': 'Erreur lors du chargement des statistiques',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def creer_offres_gratuites(request):
    """
    Créer des offres gratuites pour tester la recherche de tuteurs gratuits.
    """
    from apps.accounts.models import User
    from apps.tutorat.models import OffreTutorat
    
    tuteurs_pour_gratuit = [
        "Bienvenue Motar",
        "Lama Lala", 
        "yuyu Yoyu"
    ]
    
    offres_creees = 0
    
    for nom_tuteur in tuteurs_pour_gratuit:
        try:
            prenom, nom = nom_tuteur.split(' ', 1)
            tuteur = User.objects.get(prenom=prenom, nom=nom, role='tuteur')
            
            OffreTutorat.objects.filter(tuteur=tuteur).delete()
            
            offre = OffreTutorat.objects.create(
                tuteur=tuteur,
                tarif=0,
                type="individuel",
                description="Cours gratuits pour aider les étudiants",
                est_active=True
            )
            
            print(f"✅ Offre gratuite créée pour {nom_tuteur}")
            offres_creees += 1
            
        except User.DoesNotExist:
            print(f"❌ Tuteur {nom_tuteur} non trouvé")
        except Exception as e:
            print(f"❌ Erreur création offre pour {nom_tuteur}: {e}")
    
    return Response({
        'message': f'{offres_creees} offres gratuites créées avec succès',
        'offres_creees': offres_creees,
        'tuteurs_concernes': tuteurs_pour_gratuit
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_profile_missing_fields(request):
    """
    Endpoint pour mettre à jour les champs manquants du profil utilisateur
    """
    try:
        user = request.user
        print(f"Mise à jour profil pour: {user.email}")
        
        filiere = request.data.get('filiere', '')
        annee = request.data.get('annee', '')
        photo = request.data.get('photo', None)
        
        updated = False
        if filiere:
            user.filiere = filiere
            updated = True
            
        if annee:
            user.annee = annee
            updated = True
            
        if photo and hasattr(photo, 'read'):
            user.photo = photo
            updated = True
        
        if updated:
            user.save()
        
        serializer = UserSerializer(user)
        return Response({
            'message': 'Profil mis à jour avec succès',
            'user': serializer.data
        })
        
    except Exception as e:
        print(f"Erreur mise à jour profil: {e}")
        return Response({
            'message': 'Erreur lors de la mise à jour du profil',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PATCH', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Vue pour obtenir et mettre à jour le profil utilisateur
    """
    try:
        user = request.user
        
        if request.method == 'GET':
            serializer = UserSerializer(user, context={'request': request})
            return Response({
                'user': serializer.data,
                'message': 'Profil récupéré avec succès'
            })
        
        elif request.method in ['PATCH', 'PUT']:
            print(f"Données reçues pour mise à jour: {request.data}")
            
            partial = request.method == 'PATCH' or request.method == 'PUT'
            
            update_data = request.data.copy()
            if 'email' in update_data and request.method == 'PUT':
                update_data.pop('email')
            
            serializer = UserSerializer(user, data=update_data, partial=partial, context={'request': request})
            
            if serializer.is_valid():
                updated_user = serializer.save()
                
                return Response({
                    'user': serializer.data,
                    'message': 'Profil mis à jour avec succès'
                })
            else:
                return Response({
                    'error': 'Données invalides',
                    'details': serializer.errors
                }, status=400)
                
    except Exception as e:
        return Response({
            'error': f'Erreur lors du traitement du profil: {str(e)}'
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def users_list(request):
    """
    Vue pour obtenir la liste des utilisateurs (admin uniquement)
    """
    try:
        if request.user.role != 'admin':
            return Response({
                'error': 'Accès non autorisé'
            }, status=403)
        
        users = User.objects.all()
        serializer = UserSerializer(users, many=True, context={'request': request})
        
        return Response({
            'users': serializer.data,
            'message': 'Liste des utilisateurs récupérée avec succès'
        })
        
    except Exception as e:
        return Response({
            'error': f'Erreur lors de la récupération des utilisateurs: {str(e)}'
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    """
    Vue pour obtenir les statistiques administratives
    """
    try:
        if request.user.role != 'admin':
            return Response({
                'error': 'Accès non autorisé'
            }, status=403)
        
        stats = {
            'utilisateurs': {
                'total': User.objects.count(),
                'etudiants': User.objects.filter(role='etudiant').count(),
                'tuteurs': User.objects.filter(role='tuteur').count(),
                'admins': User.objects.filter(role='admin').count(),
                'actifs': User.objects.filter(is_active=True).count(),
                'inactifs': User.objects.filter(is_active=False).count(),
                'tuteurs_actifs': User.objects.filter(role='tuteur', is_active=True).count(),
                'tuteurs_inactifs': User.objects.filter(role='tuteur', is_active=False).count(),
                'etudiants_actifs': User.objects.filter(role='etudiant', is_active=True).count(),
                'etudiants_inactifs': User.objects.filter(role='etudiant', is_active=False).count(),
            }
        }
        
        return Response({
            'stats': stats,
            'message': 'Statistiques administratives récupérées avec succès'
        })
        
    except Exception as e:
        return Response({
            'error': f'Erreur lors de la récupération des statistiques: {str(e)}'
        }, status=500)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def get_user_by_id(request, pk):
    """
    Récupérer, mettre à jour ou supprimer un utilisateur par son ID.
    """
    try:
        user = User.objects.get(id=pk)
        
        if request.method == 'DELETE':
            user.delete()
            return Response({
                'success': True,
                'message': 'Utilisateur supprimé avec succès'
            })
        
        if request.method == 'PATCH':
            old_status = user.is_active
            serializer = UserSerializer(user, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                updated_user = serializer.save()
                
                # Envoyer un email si l'utilisateur vient d'être activé
                if not old_status and updated_user.is_active:
                    try:
                        from django.core.mail import send_mail
                        from django.conf import settings
                        
                        subject = 'Votre compte a été activé !'
                        message = f'''
Cher/Chère {updated_user.prenom} {updated_user.nom},

Votre compte sur l'application de tutorat a été activé par l'administrateur.

Vous pouvez maintenant vous connecter avec vos identifiants.

Cordialement,
L'équipe de tutorat
                        '''
                        
                        send_mail(
                            subject,
                            message,
                            settings.DEFAULT_FROM_EMAIL,
                            [updated_user.email],
                            fail_silently=False,
                        )
                        print(f"Email d'activation envoyé à {updated_user.email}")
                    except Exception as e:
                        print(f"Erreur envoi email activation: {e}")
                
                return Response({
                    'success': True,
                    'data': serializer.data
                })
            else:
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # GET request
        serializer = UserSerializer(user, context={'request': request})
        return Response({
            'success': True,
            'data': serializer.data
        })
        
    except User.DoesNotExist:
        return Response({
            'error': 'Utilisateur non trouvé',
            'success': False
        }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        return Response({
            'error': f'Erreur lors de la récupération: {str(e)}',
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)