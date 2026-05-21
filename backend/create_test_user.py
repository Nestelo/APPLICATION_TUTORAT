from apps.accounts.models import User
from apps.tutorat.models import Tuteur

# Créer un utilisateur tuteur de test
user = User.objects.create_user(
    email='tuteur@test.com',
    password='test123456',
    prenom='Test',
    nom='Tuteur',
    role='tuteur',
    is_active=True
)

# Créer le profil tuteur associé
tuteur = Tuteur.objects.create(
    user=user,
    statut='approuve',
    bio='Tuteur de test pour développement',
    experience='3 ans d\'expérience',
    tarif_horaire=25.00
)

print(f'Utilisateur tuteur créé: {user.email}')
print(f'Statut tuteur: {tuteur.statut}')
