#!/usr/bin/env python
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.tutorat.models import GroupeTutorat, InscriptionGroupe
from apps.accounts.models import User

print("=== TEST PERMISSIONS GROUPES ===")

# Récupérer les utilisateurs
lot = User.objects.get(id=32)  # Tuteur Lot
motar = User.objects.get(id=20)  # Tuteur Motar

print(f"\n1. Test avec Lot (ID 32): {lot.prenom} {lot.nom} ({lot.email})")
print(f"2. Test avec Motar (ID 20): {motar.prenom} {motar.nom} ({motar.email})")

# Groupe de Motar
groupe_motar = GroupeTutorat.objects.get(id=3)  # "Recherche scientifique"
print(f"\n3. Groupe cible: {groupe_motar.nom} (ID {groupe_motar.id})")
print(f"   Créé par: {groupe_motar.createur.prenom} {groupe_motar.createur.nom}")

# Test 1: Lot essaie d'accéder au groupe de Motar
print(f"\n4. Lot essaie d'accéder au groupe de Motar:")
if groupe_motar.createur == lot:
    print("   ✅ Lot est le créateur - ACCÈS AUTORISÉ")
else:
    print("   ❌ Lot n'est PAS le créateur - ACCÈS REFUSÉ")

# Test 2: Motar essaie d'accéder à son propre groupe
print(f"\n5. Motar essaie d'accéder à son propre groupe:")
if groupe_motar.createur == motar:
    print("   ✅ Motar est le créateur - ACCÈS AUTORISÉ")
else:
    print("   ❌ Motar n'est PAS le créateur - ACCÈS REFUSÉ")

# Vérifier les inscriptions en attente pour le groupe de Motar
print(f"\n6. Inscriptions en attente pour '{groupe_motar.nom}':")
en_attente = InscriptionGroupe.objects.filter(groupe=groupe_motar, statut='en_attente')
for insc in en_attente:
    print(f"   - {insc.etudiant.prenom} {insc.etudiant.nom} ({insc.etudiant.email})")

print("\n=== FIN TEST ===")
