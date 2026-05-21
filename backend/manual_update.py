#!/usr/bin/env python
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.accounts.models import User

print("=== MISE À JOUR MANUELLE DES ÉTUDIANTS ===")

# Mettre à jour Yayo Yaya (ID 28)
yayo = User.objects.get(id=28)
print(f"\nAvant mise à jour - Yayo Yaya:")
print(f"  Biographie: '{yayo.biographie}'")
print(f"  Téléphone: '{yayo.telephone}'")
print(f"  Filière: '{yayo.filiere}'")
print(f"  Année: '{yayo.annee}'")

yayo.biographie = "Étudiant passionné par l'informatique et les nouvelles technologies. Je cherche à approfondir mes connaissances en programmation et en réseaux."
yayo.telephone = "06 12 34 56 78"
yayo.filiere = "Génie Informatique"
yayo.annee = "L2"
yayo.save()

print(f"\nAprès mise à jour - Yayo Yaya:")
print(f"  Biographie: '{yayo.biographie}'")
print(f"  Téléphone: '{yayo.telephone}'")
print(f"  Filière: '{yayo.filiere}'")
print(f"  Année: '{yayo.annee}'")

# Mettre à jour Luc Jean (ID 3)
luc = User.objects.get(id=3)
print(f"\nAvant mise à jour - Luc Jean:")
print(f"  Biographie: '{luc.biographie}'")
print(f"  Téléphone: '{luc.telephone}'")
print(f"  Filière: '{luc.filiere}'")
print(f"  Année: '{luc.annee}'")

luc.biographie = "Étudiant en génie informatique avec un intérêt particulier pour l'intelligence artificielle et le machine learning."
luc.telephone = "06 45 67 89 01"
luc.filiere = "Génie Informatique"
luc.annee = "L3"
luc.save()

print(f"\nAprès mise à jour - Luc Jean:")
print(f"  Biographie: '{luc.biographie}'")
print(f"  Téléphone: '{luc.telephone}'")
print(f"  Filière: '{luc.filiere}'")
print(f"  Année: '{luc.annee}'")

print("\n=== FIN MISE À JOUR ===")
