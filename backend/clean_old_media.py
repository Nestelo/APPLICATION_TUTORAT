# clean_old_media.py
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.accounts.models import User
from apps.ressources.models import Ressource

print("=" * 60)
print("🧹 NETTOYAGE DES ANCIENS FICHIERS")
print("=" * 60)

# Nettoyer les photos de profil
print("\n1️⃣ Nettoyage des photos de profil...")
count_photos = 0
for user in User.objects.filter(photo__isnull=False):
    photo_str = str(user.photo)
    # Si ce n'est pas une URL Cloudinary, supprimer
    if not photo_str.startswith('https://res.cloudinary.com'):
        print(f"   Suppression: {user.email} -> {photo_str[:50]}...")
        user.photo = None
        user.save()
        count_photos += 1

print(f"   ✅ {count_photos} photos de profil nettoyées")

# Nettoyer les ressources
print("\n2️⃣ Nettoyage des ressources...")
count_files = 0
for res in Ressource.objects.filter(fichier__isnull=False):
    fichier_str = str(res.fichier)
    if not fichier_str.startswith('https://res.cloudinary.com'):
        print(f"   Suppression: {res.titre} -> {fichier_str[:50]}...")
        res.fichier = None
        res.save()
        count_files += 1

print(f"   ✅ {count_files} fichiers de ressources nettoyés")

print("\n" + "=" * 60)
print("✅ Nettoyage terminé !")
print("=" * 60)