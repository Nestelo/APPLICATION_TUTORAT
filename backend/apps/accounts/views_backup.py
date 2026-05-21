from datetime import timedelta

from django.contrib.auth import authenticate
from django.utils import timezone
from django.db.models import Count, Avg

from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, DemandeTuteur, TutorProfile, StudentProfile
from apps.tutorat.models import OffreTutorat
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    DemandeTuteurSerializer,
    UserBasicSerializer,
    UserDetailSerializer,
)


# ---------- Auth / profil ----------

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        print("Données reçues pour inscription:", request.data)
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        print(f"Tentative de connexion pour: {email}")
        
        user = authenticate(request, username=email, password=password)
        if user is not None:
            print(f"Utilisateur trouvé: {user.email}, rôle: {user.role}, is_active: {user.is_active}")
            
            # Bloqué tant que le compte n'est pas activé par l'admin
            if not user.is_active:
                print(f"Connexion refusée: compte {user.email} inactif")
                return Response(
                    {'error': "Votre compte n'est pas encore activé par l'administrateur."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            
            print(f"Connexion autorisée pour: {user.email}")
            refresh = RefreshToken.for_user(user)
            response_data = {
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data,
            }
            # Inclure le refresh token seulement si demandé explicitement
            if request.data.get('include_refresh', True):
                response_data['refresh'] = str(refresh)
            return Response(response_data)
        
        print(f"Échec d'authentification pour: {email}")
        return Response({'error': 'Email ou mot de passe incorrect'}, status=status.HTTP_401_UNAUTHORIZED)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


# ---------- Demande de tuteur ----------

class DemandeTuteurView(generics.CreateAPIView):
    queryset = DemandeTuteur.objects.all()
    serializer_class = DemandeTuteurSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(utilisateur=self.request.user)


# ------- Admin: lister et valider/rejeter demandes tuteur -------
class DemandeTuteurAdminList(generics.ListAPIView):
    queryset = DemandeTuteur.objects.all().order_by('-date_soumission')
    serializer_class = DemandeTuteurSerializer
    permission_classes = [permissions.IsAdminUser]


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def valider_demande_tuteur(request, pk):
    try:
        demande = DemandeTuteur.objects.get(pk=pk)
    except DemandeTuteur.DoesNotExist:
        return Response({'detail': 'Demande introuvable'}, status=status.HTTP_404_NOT_FOUND)

    # Mettre à jour le statut
    demande.statut = 'valide'
    commentaire = request.data.get('commentaire', '')
    demande.commentaire_admin = commentaire
    demande.save(update_fields=['statut', 'commentaire_admin'])

    # Promouvoir l'utilisateur en tuteur et activer son compte
    user = demande.utilisateur
    user.role = 'tuteur'
    user.is_active = True
    user.save(update_fields=['role', 'is_active'])

    # Envoyer un email réel à l'utilisateur
    try:
        from django.core.mail import send_mail
        from django.conf import settings
        
        sujet = '✅ Votre demande de tuteur a été validée'
        message = f'''
Bonjour {user.prenom} {user.nom},

Nous avons le plaisir de vous informer que votre demande pour devenir tuteur sur notre plateforme a été validée par l'administrateur.

Votre compte est maintenant activé et vous pouvez vous connecter avec vos identifiants habituels :
- Email : {user.email}

Vous pouvez dès maintenant :
- Accéder à votre espace tuteur
- Consulter les demandes de tutorat
- Proposer vos services
- Gérer votre planning

{commentaire and f"Commentaire de l'admin : {commentaire}\n\n" or ''}Merci de votre intérêt pour notre plateforme de tutorat.

Cordialement,
L'équipe de la plateforme de tutorat
        '''
        
        send_mail(
            sujet,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        print(f"Email envoyé à {user.email} pour validation de demande tuteur")
        
    except Exception as e:
        print(f"Erreur lors de l'envoi de l'email : {e}")

    # Créer notification à l'utilisateur (si service présent)
    try:
        from apps.notifications.services import creer_notification
        creer_notification(user.id, 'message', 'Demande validée', 'Votre demande de tuteur a été validée par un administrateur.')
    except Exception:
        pass

    return Response({
        'status': 'validée',
        'message': f'Le tuteur {user.email} a été activé et notifié par email.'
    })


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def rejeter_demande_tuteur(request, pk):
    try:
        demande = DemandeTuteur.objects.get(pk=pk)
    except DemandeTuteur.DoesNotExist:
        return Response({'detail': 'Demande introuvable'}, status=status.HTTP_404_NOT_FOUND)

    demande.statut = 'rejete'
    commentaire = request.data.get('commentaire', '')
    demande.commentaire_admin = commentaire
    demande.save(update_fields=['statut', 'commentaire_admin'])

    # Notifier l'utilisateur
    try:
        from apps.notifications.services import creer_notification
        creer_notification(demande.utilisateur.id, 'message', 'Demande rejetée', f'Votre demande a été rejetée. Commentaire: {commentaire}')
    except Exception:
        pass

    return Response({'status': 'rejetée'})


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def desactiver_tuteur(request, pk):
    """
    Désactiver un tuteur (l'empêcher de se connecter)
    """
    try:
        user = User.objects.get(pk=pk, role='tuteur')
    except User.DoesNotExist:
        return Response({'detail': 'Tuteur introuvable'}, status=status.HTTP_404_NOT_FOUND)
    
    # Désactiver le compte
    user.is_active = False
    user.save(update_fields=['is_active'])
    
    # Envoyer un email de notification
    try:
        from django.core.mail import send_mail
        from django.conf import settings
        
        sujet = '⚠️ Votre compte tuteur a été désactivé'
        message = f'''
Bonjour {user.prenom} {user.nom},

Nous vous informons que votre compte tuteur sur notre plateforme a été désactivé par l'administrateur.

Vous ne pouvez plus vous connecter à votre espace tuteur.

Si vous pensez qu'il s'agit d'une erreur ou si vous souhaitez plus d'informations, veuillez contacter l'administrateur.

Cordialement,
L'équipe de la plateforme de tutorat
        '''
        
        send_mail(
            sujet,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        print(f"Email de désactivation envoyé à {user.email}")
        
    except Exception as e:
        print(f"Erreur lors de l'envoi de l'email de désactivation : {e}")
    
    return Response({
        'status': 'désactivé',
        'message': f'Le tuteur {user.email} a été désactivé et notifié par email.'
    })


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def reactiver_tuteur(request, pk):
    """
    Réactiver un tuteur (lui permettre de se connecter)
    """
    try:
        user = User.objects.get(pk=pk, role='tuteur')
    except User.DoesNotExist:
        return Response({'detail': 'Tuteur introuvable'}, status=status.HTTP_404_NOT_FOUND)
    
    # Réactiver le compte
    user.is_active = True
    user.save(update_fields=['is_active'])
    
    # Envoyer un email de notification
    try:
        from django.core.mail import send_mail
        from django.conf import settings
        
        sujet = '✅ Votre compte tuteur a été réactivé'
        message = f'''
Bonjour {user.prenom} {user.nom},

Nous avons le plaisir de vous informer que votre compte tuteur sur notre plateforme a été réactivé par l'administrateur.

Vous pouvez maintenant vous connecter à votre espace tuteur avec vos identifiants habituels.

Cordialement,
L'équipe de la plateforme de tutorat
        '''
        
        send_mail(
            sujet,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        print(f"Email de réactivation envoyé à {user.email}")
        
    except Exception as e:
        print(f"Erreur lors de l'envoi de l'email de réactivation : {e}")
    
    return Response({
        'status': 'réactivé',
        'message': f'Le tuteur {user.email} a été réactivé et notifié par email.'
    })


# ---------- Statistiques publiques ----------

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def stats_publiques(request):
    stats = {
        'etudiants': User.objects.filter(role='etudiant', is_active=True).count(),
        'tuteurs': User.objects.filter(role__in=['tuteur', 'enseignant'], is_active=True).count(),
    }
    return Response(stats)


# ---------- Statistiques admin (dashboard) ----------

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_stats(request):
    now = timezone.now()
    
    # Utilisateurs
    total_users = User.objects.count()
    tuteurs_count = User.objects.filter(role='tuteur', is_active=True).count()
    enseignants_count = User.objects.filter(role='enseignant', is_active=True).count()
    etudiants_count = User.objects.filter(role='etudiant', is_active=True).count()
    admins_count = User.objects.filter(role='admin', is_active=True).count()
    
    users_by_role = {
        'etudiants': etudiants_count,
        'tuteurs': tuteurs_count,
        'enseignants': enseignants_count,
        'tuteurs_enseignants': tuteurs_count + enseignants_count,  # Combiné pour le frontend
        'admins': admins_count,
        'etudiants_inactifs': User.objects.filter(role='etudiant', is_active=False).count(),
        'tuteurs_inactifs': User.objects.filter(role='tuteur', is_active=False).count(),
        'enseignants_inactifs': User.objects.filter(role='enseignant', is_active=False).count(),
    }
    
    # Croissance utilisateurs
    users_this_month = User.objects.filter(date_inscription__gte=now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)).count()
    last_month = (now.replace(day=1) - timedelta(days=1)).replace(day=1)
    users_last_month = User.objects.filter(
        date_inscription__range=[last_month, now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)]
    ).count()
    user_growth = ((users_this_month - users_last_month) / (users_last_month or 1)) * 100
    
    # Nouveaux inscrits
    recent_users = User.objects.order_by('-date_inscription')[:5].values(
        'prenom', 'nom', 'email', 'role', 'date_inscription'
    )
    
    stats = {
        'total_users': total_users,
        'users_by_role': users_by_role,
        'user_growth': round(user_growth, 1),
        'recent_users': list(recent_users),
    }
    
    return Response(stats)


# ---------- Gestion des utilisateurs (admin) ----------

class UserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('-date_inscription')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def test_debug(request):
    """
    Endpoint de test pour vérifier les logs du backend.
    """
    print("=== TEST DEBUG BACKEND ===")
    
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


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def check_tuteurs_data(request):
    """
    Vérifier les données complètes des tuteurs.
    """
    from apps.accounts.models import User
    
    tuteurs = User.objects.filter(role='tuteur', is_active=True)
    
    resultats = []
    for t in tuteurs:
        resultats.append({
            'id': t.id,
            'prenom': t.prenom,
            'nom': t.nom,
            'matieres_enseignees': str(t.matieres_enseignees) if t.matieres_enseignees else 'VIDE',
            'niveau_enseignement': str(t.niveau_enseignement) if t.niveau_enseignement else 'VIDE',
            'biographie': str(t.biographie) if t.biographie else 'VIDE'
        })
    
    return Response(resultats)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def update_matieres_reelles(request):
    """
    Mettre à jour les matières réelles des tuteurs selon les informations fournies.
    """
    from apps.accounts.models import User
    
    # Mapping des tuteurs avec leurs vraies matières
    tuteurs_data = {
        "Bienvenue Motar": {
            "matieres": ["Crypto"],
            "niveau": "L2",
            "filiere": "Génie Informatique",
            "biographie": "Spécialiste en cryptographie et sécurité informatique en L2 Génie Informatique."
        },
        "yuyu Yoyu": {
            "matieres": ["Web1", "Web2", "Système Numérique", "Physique Quantique"],
            "niveau": "M2",
            "filiere": "Génie Électrique",
            "biographie": "Expert en développement web et physique quantique, M2 Génie Électrique."
        },
        "Lama Lala": {
            "matieres": ["PL", "Système d'Information"],
            "niveau": "Doctorat",
            "filiere": "Informatique",
            "biographie": "Doctorante en Programmation Logique et Systèmes d'Information."
        },
        "Lote Lot": {
            "matieres": ["Physique", "Chimie", "Optique"],
            "niveau": "Doctorat",
            "filiere": "Physique",
            "biographie": "Doctorant en Physique, spécialisé en optique et chimie appliquée."
        },
        "Needs Need": {
            "matieres": ["Crypto", "Analyse de Données", "Base de Données"],
            "niveau": "Doctorat",
            "filiere": "Génie Informatique",
            "biographie": "Doctorant en cryptographie, analyse de données et bases de données, GI."
        }
    }
    
    tuteurs_modifies = 0
    
    for nom_tuteur, data in tuteurs_data.items():
        try:
            # Rechercher le tuteur par nom complet
            prenom, nom = nom_tuteur.split(' ', 1)
            tuteur = User.objects.get(prenom=prenom, nom=nom, role='tuteur')
            
            # Mettre à jour les informations
            tuteur.matieres_enseignees = f"[{', '.join([f'{m}' for m in data['matieres']])}]"
            tuteur.niveau_enseignement = data['niveau']
            tuteur.biographie = data['biographie']
            tuteur.save()
            
            print(f"✅ Tuteur {nom_tuteur} mis à jour: {data['matieres']}")
            tuteurs_modifies += 1
            
        except User.DoesNotExist:
            print(f"❌ Tuteur {nom_tuteur} non trouvé")
        except Exception as e:
            print(f"❌ Erreur mise à jour {nom_tuteur}: {e}")
    
    return Response({
        'message': f'Matières réelles mises à jour pour {tuteurs_modifies} tuteurs',
        'tuteurs_modifies': tuteurs_modifies,
        'details': tuteurs_data
    })


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def matieres_list(request):
    """
    Liste des matières réelles enseignées par les tuteurs actifs.
    """
    try:
        print(f"=== MATIERES LIST ===")
        # Récupérer les matières uniques des tuteurs actifs
        from apps.accounts.models import User
        
        # Vérifier tous les utilisateurs d'abord
        tous_users = User.objects.all()
        print(f"Total utilisateurs dans DB: {tous_users.count()}")
        
        # Vérifier les rôles
        etudiants = User.objects.filter(role='etudiant')
        tuteurs = User.objects.filter(role='tuteur')
        admins = User.objects.filter(role='admin')
        
        print(f"Étudiants: {etudiants.count()}")
        print(f"Tuteurs: {tuteurs.count()}")
        print(f"Admins: {admins.count()}")
        
        # Lister tous les tuteurs avec leurs détails
        for t in tuteurs:
            print(f"  Tuteur: {t.prenom} {t.nom} (actif: {t.is_active})")
            print(f"    Matières: {t.matieres_enseignees}")
            print(f"    Niveau: {t.niveau_enseignement}")
        
        tuteurs_actifs = User.objects.filter(role='tuteur', is_active=True)
        print(f"Tuteurs actifs: {tuteurs_actifs.count()}")
        
        # Extraire toutes les matières uniques
        toutes_matieres = set()
        
        for tuteur in tuteurs_actifs:
            print(f"Tuteur: {tuteur.prenom} {tuteur.nom}, matières: {tuteur.matieres_enseignees}")
            
            if tuteur.matieres_enseignees:
                matieres_str = str(tuteur.matieres_enseignees)
                print(f"Matères brutes: {matieres_str}")
                
                # Si c'est une chaîne JSON ou séparée par des virgules
                try:
                    import json
                    if matieres_str.startswith('[') and matieres_str.endswith(']'):
                        matieres_list = json.loads(matieres_str)
                        print(f"Matères JSON parsées: {matieres_list}")
                    else:
                        matieres_list = [m.strip() for m in matieres_str.split(',') if m.strip()]
                        print(f"Matères CSV parsées: {matieres_list}")
                    
                    for matiere in matieres_list:
                        if matiere and matiere.strip():
                            toutes_matieres.add(matiere.strip())
                            
                except Exception as e:
                    print(f"Erreur parsing matières pour {tuteur.nom}: {e}")
                    # Fallback: traiter comme une seule matière
                    if matieres_str.strip():
                        toutes_matieres.add(matieres_str.strip())
        
        print(f"Total matières uniques: {len(toutes_matieres)}")
        print(f"Matières: {list(toutes_matieres)}")
        
        # Convertir en liste formatée
        matieres = []
        for matiere in sorted(toutes_matieres):
            if matiere and matiere.strip():
                matieres.append({
                    "id": matiere.lower().replace(' ', '-').replace(',', ''),
                    "nom": matiere.strip()
                })
        
        print(f"Matières formatées: {matieres}")
        print(f"=== FIN MATIERES ===")
        return Response(matieres)
        
    except Exception as e:
        print(f"Erreur générale matieres_list: {e}")
        import traceback
        traceback.print_exc()
        return Response([])


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def niveaux_enseignement_list(request):
    """
    Liste des niveaux d'enseignement réels des tuteurs actifs.
    """
    try:
        print(f"=== NIVEAUX LIST ===")
        # Récupérer les niveaux uniques des tuteurs actifs
        from apps.accounts.models import User
        
        tuteurs = User.objects.filter(role='tuteur', is_active=True)
        print(f"Nombre de tuteurs pour niveaux: {tuteurs.count()}")
        
        # Extraire tous les niveaux
        tous_niveaux = set()
        
        for tuteur in tuteurs:
            print(f"Tuteur: {tuteur.prenom} {tuteur.nom}, niveau: {tuteur.niveau_enseignement}")
            
            if tuteur.niveau_enseignement:
                niveau_str = str(tuteur.niveau_enseignement)
                if niveau_str.strip():
                    tous_niveaux.add(niveau_str.strip())
        
        print(f"Total niveaux uniques: {len(tous_niveaux)}")
        print(f"Niveaux: {list(tous_niveaux)}")
        
        # Convertir en liste formatée
        niveaux = []
        for niveau in sorted(tous_niveaux):
            if niveau and niveau.strip():
                niveaux.append({
                    "id": niveau.lower().replace(' ', '-'),
                    "nom": niveau.strip()
                })
        
        print(f"Niveaux formatés: {niveaux}")
        print(f"=== FIN NIVEAUX ===")
        return Response(niveaux)
        
    except Exception as e:
        print(f"Erreur générale niveaux_enseignement_list: {e}")
        import traceback
        traceback.print_exc()
        return Response([])


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