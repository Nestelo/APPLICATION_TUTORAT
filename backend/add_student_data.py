#!/usr/bin/env python
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.accounts.models import User

print("=== AJOUT DONNÉES ÉTUDIANTS ===")

# Récupérer les étudiants
yayo = User.objects.get(id=35)  # Yayo Yaya
doudou = User.objects.get(id=34)  # Doudoune Doudou
luc = User.objects.get(id=33)  # Luc Jean
mahamat = User.objects.get(id=31)  # Mahamat Nour

print(f"\n1. Mise à jour des données des étudiants:")

# Mettre à jour Yayo Yaya
yayo.biographie = "Étudiant passionné par l'informatique et les nouvelles technologies. Je cherche à approfondir mes connaissances en programmation et en réseaux."
yayo.telephone = "06 12 34 56 78"
yayo.filiere = "Génie Informatique"
yayo.annee = "L2"
yayo.save()
print(f"   ✅ Yayo Yaya mis à jour")

# Mettre à jour Doudoune Doudou
doudou.biographie = "Étudiant motivé en génie informatique, spécialisé en développement web et mobile. J'aime travailler en équipe et partager mes connaissances."
doudou.telephone = "06 98 76 54 32"
doudou.filiere = "Génie Informatique"
doudou.annee = "L2"
doudou.save()
print(f"   ✅ Doudoune Doudou mise à jour")

# Mettre à jour Luc Jean
luc.biographie = "Étudiant en génie informatique avec un intérêt particulier pour l'intelligence artificielle et le machine learning."
luc.telephone = "06 45 67 89 01"
luc.filiere = "Génie Informatique"
luc.annee = "L3"
luc.save()
print(f"   ✅ Luc Jean mis à jour")

# Mettre à jour Mahamat Nour
mahamat.biographie = "Étudiant sérieux et travailleur, je souhaite développer mes compétences en programmation et en gestion de projet."
mahamat.telephone = "06 23 45 67 89"
mahamat.filiere = "Génie Électrique"
mahamat.annee = "L2"
mahamat.save()
print(f"   ✅ Mahamat Nour mis à jour")

print(f"\n2. Vérification des mises à jour:")
for user in [yayo, doudou, luc, mahamat]:
    print(f"   - {user.prenom} {user.nom}:")
    print(f"     Email: {user.email}")
    print(f"     Filière: {user.filiere}")
    print(f"     Niveau: {user.annee}")
    print(f"     Téléphone: {user.telephone}")
    print(f"     Biographie: {user.biographie[:50]}...")
    print("")

print("=== FIN MISE À JOUR ===")
