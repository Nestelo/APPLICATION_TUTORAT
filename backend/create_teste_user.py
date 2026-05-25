# create_test_user.py
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.accounts.models import User

print("=" * 60)
print("👤 CRÉATION D'UN UTILISATEUR DE TEST")
print("=" * 60)

# Créer un utilisateur de test
email = "testcloudinary@example.com"
password = "Test123456"

if not User.objects.filter(email=email).exists():
    user = User.objects.create_user(
        email=email,
        password=password,
        prenom="Test",
        nom="Cloudinary",
        role="etudiant",
        is_active=True
    )
    print(f"✅ Utilisateur créé avec succès!")
    print(f"   Email: {email}")
    print(f"   Mot de passe: {password}")
    print(f"   Rôle: étudiant")
else:
    user = User.objects.get(email=email)
    print(f"⚠️ L'utilisateur {email} existe déjà")
    print(f"   ID: {user.id}")
    print(f"   Nom: {user.prenom} {user.nom}")

print("\n" + "=" * 60)