#!/usr/bin/env python
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.accounts.models import User

print("=== VÉRIFICATION ET CORRECTION DONNÉES ÉTUDIANTS ===")

# Récupérer tous les étudiants
etudiants = User.objects.filter(role='etudiant')
print(f"\n1. Liste de tous les étudiants:")
for etudiant in etudiants:
    print(f"   - ID {etudiant.id}: {etudiant.prenom} {etudiant.nom} ({etudiant.email})")

# Mettre à jour Yayo Yaya (email yaya@gmail.com)
try:
    yayo = User.objects.get(email='yaya@gmail.com')
    yayo.biographie = "Étudiant passionné par l'informatique et les nouvelles technologies. Je cherche à approfondir mes connaissances en programmation et en réseaux."
    yayo.telephone = "06 12 34 56 78"
    yayo.filiere = "Génie Informatique"
    yayo.annee = "L2"
    yayo.save()
    print(f"\n   ✅ Yayo Yaya ({yayo.email}) mis à jour")
except User.DoesNotExist:
    print(f"\n   ❌ Yayo Yaya (yaya@gmail.com) non trouvé")

# Mettre à jour Luc Jean (email madromjudith61@gmail.com)
try:
    luc = User.objects.get(email='madromjudith61@gmail.com')
    luc.biographie = "Étudiant en génie informatique avec un intérêt particulier pour l'intelligence artificielle et le machine learning."
    luc.telephone = "06 45 67 89 01"
    luc.filiere = "Génie Informatique"
    luc.annee = "L3"
    luc.save()
    print(f"   ✅ Luc Jean ({luc.email}) mis à jour")
except User.DoesNotExist:
    print(f"   ❌ Luc Jean (madromjudith61@gmail.com) non trouvé")

# Mettre à jour Mahamat Nour (email maha@gmail.com)
try:
    mahamat = User.objects.get(email='maha@gmail.com')
    mahamat.biographie = "Étudiant sérieux et travailleur, je souhaite développer mes compétences en programmation et en gestion de projet."
    mahamat.telephone = "06 23 45 67 89"
    mahamat.filiere = "Génie Électrique"
    mahamat.annee = "L2"
    mahamat.save()
    print(f"   ✅ Mahamat Nour ({mahamat.email}) mis à jour")
except User.DoesNotExist:
    print(f"   ❌ Mahamat Nour (maha@gmail.com) non trouvé")

print(f"\n2. Vérification finale:")
for etudiant in etudiants:
    if etudiant.email in ['yaya@gmail.com', 'madromjudith61@gmail.com', 'maha@gmail.com']:
        print(f"   - {etudiant.prenom} {etudiant.nom}:")
        print(f"     Biographie: {etudiant.biographie[:50] if etudiant.biographie else 'VIDE'}...")
        print(f"     Téléphone: {etudiant.telephone if etudiant.telephone else 'VIDE'}")
        print(f"     Filière: {etudiant.filiere if etudiant.filiere else 'VIDE'}")
        print(f"     Année: {etudiant.annee if etudiant.annee else 'VIDE'}")
        print("")

print("=== FIN CORRECTION ===")
