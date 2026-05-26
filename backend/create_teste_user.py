# check_test_user.py
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.accounts.models import User
from django.contrib.auth.hashers import check_password

print("=" * 60)
print("👤 VÉRIFICATION UTILISATEUR DE TEST")
print("=" * 60)

email = "testcloudinary@example.com"
user = User.objects.filter(email=email).first()

if user:
    print(f"✅ Utilisateur trouvé:")
    print(f"   Email: {user.email}")
    print(f"   Nom: {user.prenom} {user.nom}")
    print(f"   Role: {user.role}")
    print(f"   is_active: {user.is_active}")
    print(f"   Photo: {user.photo}")
    
    # Réinitialiser le mot de passe
    user.set_password("Test123456")
    user.is_active = True
    user.save()
    print(f"\n✅ Mot de passe réinitialisé à 'Test123456'")
    print(f"✅ Compte activé")
else:
    print(f"❌ Utilisateur {email} non trouvé")
    print(f"   Création...")
    
    # Créer l'utilisateur
    user = User.objects.create_user(
        email=email,
        password="Test123456",
        prenom="Test",
        nom="Cloudinary",
        role="etudiant",
        is_active=True
    )
    print(f"✅ Utilisateur créé avec succès!")

print("\n" + "=" * 60)