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

print("=== TEST GROUPES ET INSCRIPTIONS ===")

# Vérifier tous les groupes
print("\n1. Tous les groupes:")
groupes = GroupeTutorat.objects.all()
for g in groupes:
    print(f"  - {g.id}: {g.nom} (créé par: {g.createur})")

# Vérifier les inscriptions
print("\n2. Toutes les inscriptions:")
inscriptions = InscriptionGroupe.objects.all()
for insc in inscriptions:
    print(f"  - {insc.etudiant.prenom} {insc.etudiant.nom} -> {insc.groupe.nom} ({insc.statut})")

# Vérifier les groupes du tuteur Lot (ID 32)
print("\n3. Groupes du tuteur Lot (ID 32):")
lot = User.objects.get(id=32)
groupes_lot = GroupeTutorat.objects.filter(createur=lot)
for g in groupes_lot:
    print(f"  - {g.id}: {g.nom}")
    insc_groupe = InscriptionGroupe.objects.filter(groupe=g)
    print(f"    Inscriptions ({insc_groupe.count()}):")
    for insc in insc_groupe:
        print(f"      - {insc.etudiant.prenom} {insc.etudiant.nom} ({insc.statut})")

# Vérifier les étudiants en attente pour les groupes de Lot
print("\n4. Étudiants en attente pour les groupes de Lot:")
for g in groupes_lot:
    en_attente = InscriptionGroupe.objects.filter(groupe=g, statut='en_attente')
    print(f"  - Groupe {g.nom}: {en_attente.count()} en attente")
    for insc in en_attente:
        print(f"    * {insc.etudiant.prenom} {insc.etudiant.nom} ({insc.etudiant.email})")

# Chercher le groupe "Recherche scientifique avancé de technologie moderne"
print("\n5. Recherche du groupe 'Recherche scientifique avancé de technologie moderne':")
groupe_recherche = GroupeTutorat.objects.filter(nom__contains='Recherche scientifique').first()
if groupe_recherche:
    print(f"  - Trouvé: {groupe_recherche.id}: {groupe_recherche.nom}")
    print(f"  - Créé par: {groupe_recherche.createur}")
    insc_groupe = InscriptionGroupe.objects.filter(groupe=groupe_recherche)
    print(f"  - Inscriptions ({insc_groupe.count()}):")
    for insc in insc_groupe:
        print(f"    * {insc.etudiant.prenom} {insc.etudiant.nom} ({insc.statut})")
else:
    print("  - Non trouvé avec 'Recherche scientifique'")

# Chercher tous les groupes contenant "technologie"
print("\n6. Groupes contenant 'technologie':")
groupes_tech = GroupeTutorat.objects.filter(nom__contains='technologie')
for g in groupes_tech:
    print(f"  - {g.id}: {g.nom} (créé par: {g.createur})")

# Chercher tous les groupes de Motar
print("\n7. Groupes de Motar (ID 20):")
motar = User.objects.get(id=20)
groupes_motar = GroupeTutorat.objects.filter(createur=motar)
for g in groupes_motar:
    print(f"  - {g.id}: {g.nom}")
    insc_groupe = InscriptionGroupe.objects.filter(groupe=g)
    print(f"    Inscriptions ({insc_groupe.count()}):")
    for insc in insc_groupe:
        print(f"      * {insc.etudiant.prenom} {insc.etudiant.nom} ({insc.statut})")

print("\n=== FIN TEST ===")
