# clean_all_media_refs.py
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.accounts.models import User
from apps.ressources.models import Ressource

print("=" * 60)
print("🧹 NETTOYAGE COMPLET DES RÉFÉRENCES MÉDIA")
print("=" * 60)

# 1. Supprimer toutes les photos de profil
print("\n1️⃣ Suppression des photos de profil...")
count = 0
for user in User.objects.all():
    if user.photo:
        print(f"   Suppression pour {user.email}: {user.photo}")
        user.photo = None
        user.save()
        count += 1
print(f"   ✅ {count} photos supprimées")

# 2. Supprimer toutes les ressources
print("\n2️⃣ Suppression des fichiers de ressources...")
count = 0
for res in Ressource.objects.all():
    if res.fichier:
        print(f"   Suppression pour {res.titre}: {res.fichier}")
        res.fichier = None
        res.save()
        count += 1
print(f"   ✅ {count} fichiers supprimés")

print("\n" + "=" * 60)
print("✅ Nettoyage terminé !")
print("=" * 60)