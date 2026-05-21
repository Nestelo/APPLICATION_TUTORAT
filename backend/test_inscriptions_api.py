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
from apps.tutorat.serializers import InscriptionGroupeSerializer

print("=== TEST API INSCRIPTIONS ===")

# Récupérer Motar (ID 20)
motar = User.objects.get(id=20)
print(f"\n1. Utilisateur: {motar.prenom} {motar.nom} ({motar.email}) - Rôle: {motar.role}")

# Obtenir les groupes de Motar
groupes_motar = GroupeTutorat.objects.filter(createur=motar)
print(f"\n2. Groupes de Motar ({groupes_motar.count()}):")
for g in groupes_motar:
    print(f"   - {g.id}: {g.nom}")

# Obtenir toutes les inscriptions pour les groupes de Motar
print(f"\n3. Inscriptions pour les groupes de Motar:")
inscriptions = InscriptionGroupe.objects.filter(groupe__createur=motar)
print(f"   Total: {inscriptions.count()} inscriptions")

for insc in inscriptions:
    print(f"   - {insc.etudiant.prenom} {insc.etudiant.nom} -> {insc.groupe.nom} ({insc.statut})")

# Tester le serializer
print(f"\n4. Test du serializer:")
for insc in inscriptions:
    serializer = InscriptionGroupeSerializer(insc)
    data = serializer.data
    print(f"   Inscription ID {data['id']}:")
    print(f"   - Étudiant: {data.get('etudiant_details', {}).get('prenom', 'N/A')} {data.get('etudiant_details', {}).get('nom', 'N/A')}")
    print(f"   - Email: {data.get('etudiant_details', {}).get('email', 'N/A')}")
    print(f"   - Biographie: {data.get('etudiant_details', {}).get('biographie', 'N/A')}")
    print(f"   - Téléphone: {data.get('etudiant_details', {}).get('telephone', 'N/A')}")
    print(f"   - Groupe: {data.get('groupe_details', {}).get('nom', 'N/A')}")
    print(f"   - Statut: {data.get('statut', 'N/A')} ({data.get('statut_display', 'N/A')})")
    print(f"   - Date: {data.get('date_inscription', 'N/A')}")
    print("   ---")

print("\n=== FIN TEST ===")
