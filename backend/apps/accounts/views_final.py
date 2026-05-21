from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions, status
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from apps.tutorat.models import OffreTutorat

@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def test_debug(request):
    """
    Endpoint de test pour vérifier les logs du backend.
    """
    from apps.accounts.models import User
    
    # Compter tous les utilisateurs
    total_users = User.objects.count()
    print(f"Total utilisateurs: {total_users}")
    
    # Compter par rôle
    etudiants = User.objects.filter(role='etudiant').count()
    tuteurs = User.objects.filter(role='tuteur').count()
    admins = User.objects.filter(role='admin').count()
    
    print(f"Étudiants: {etudiants}")
    print(f"Tuteurs: {tuteurs}")
    print(f"Admins: {admins}")
    
    # Lister les tuteurs
    tuteurs_list = User.objects.filter(role='tuteur')
    print("Liste des tuteurs:")
    for t in tuteurs_list:
        print(f"  - {t.prenom} {t.nom} (actif: {t.is_active})")
    
    print("=== FIN TEST DEBUG ===")
    
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

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """
    Endpoint de login simple pour tester.
    """
    try:
        email = request.data.get('email', '')
        password = request.data.get('password', '')
        
        print(f"Tentative de connexion: {email}")
        
        # Authentification simple
        user = authenticate(username=email, password=password)
        
        if user:
            # Générer les tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            print(f"Connexion réussie pour: {user.prenom} {user.nom}")
            
            return Response({
                'message': 'Connexion réussie',
                'access': access_token,
                'refresh': refresh_token,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'prenom': user.prenom,
                    'nom': user.nom,
                    'role': user.role
                }
            })
        else:
            print(f"Échec connexion pour: {email}")
            return Response({
                'message': 'Email ou mot de passe incorrect',
                'error': 'invalid_credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except Exception as e:
        print(f"Erreur connexion: {e}")
        return Response({
            'message': 'Erreur serveur',
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
    
    # Créer des offres gratuites pour quelques tuteurs
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
            
            # Supprimer les offres existantes pour ce tuteur
            OffreTutorat.objects.filter(tuteur=tuteur).delete()
            
            # Créer une offre gratuite
            offre = OffreTutorat.objects.create(
                tuteur=tuteur,
                tarif=0,  # Gratuit !
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
