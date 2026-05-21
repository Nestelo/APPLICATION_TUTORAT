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

print("=== CRÉATION DE DONNÉES DE TEST ===")

# Récupérer les utilisateurs
lot = User.objects.get(id=32)  # Tuteur Lot
doudou = User.objects.get(id=34)  # Étudiant Doudoune
yayo = User.objects.get(id=35)  # Étudiant Yayo (si existe)

print(f"\n1. Utilisateurs trouvés:")
print(f"   - Lot (tuteur): {lot.prenom} {lot.nom}")
print(f"   - Doudoune (étudiant): {doudou.prenom} {doudou.nom}")

# Créer un groupe pour Lot avec des membres
groupe_lot, created = GroupeTutorat.objects.get_or_create(
    nom="Groupe de test de Lot",
    createur=lot,
    defaults={
        'description': 'Groupe de test pour vérifier l\'affichage des membres',
        'capacite_max': 10,
        'nombre_membres': 1,  # Le créateur
        'prive': False,
        'auto_inscription': True
    }
)

if created:
    print(f"\n2. Groupe créé pour Lot: {groupe_lot.nom} (ID {groupe_lot.id})")
else:
    print(f"\n2. Groupe existant pour Lot: {groupe_lot.nom} (ID {groupe_lot.id})")

# Ajouter Doudoune comme membre accepté
inscription_doudou, created = InscriptionGroupe.objects.get_or_create(
    groupe=groupe_lot,
    etudiant=doudou,
    defaults={
        'statut': 'accepte'
    }
)

if created:
    print(f"   - Doudoune ajoutée comme membre accepté")
else:
    print(f"   - Doudoune est déjà membre")

# Ajouter Yayo comme membre en attente (si l'utilisateur existe)
try:
    yayo = User.objects.get(id=35)
    inscription_yayo, created = InscriptionGroupe.objects.get_or_create(
        groupe=groupe_lot,
        etudiant=yayo,
        defaults={
            'statut': 'en_attente'
        }
    )
    if created:
        print(f"   - Yayo ajouté comme membre en attente")
    else:
        print(f"   - Yayo est déjà membre")
except User.DoesNotExist:
    print(f"   - Yayo (ID 35) n'existe pas")

# Mettre à jour le nombre de membres
groupe_lot.nombre_membres = InscriptionGroupe.objects.filter(groupe=groupe_lot, statut='accepte').count() + 1  # +1 pour le créateur
groupe_lot.save()

print(f"\n3. Résumé du groupe de Lot:")
print(f"   - Nom: {groupe_lot.nom}")
print(f"   - ID: {groupe_lot.id}")
print(f"   - Créateur: {groupe_lot.createur.prenom} {groupe_lot.createur.nom}")
print(f"   - Nombre de membres: {groupe_lot.nombre_membres}")

print(f"\n4. Membres du groupe:")
inscriptions = InscriptionGroupe.objects.filter(groupe=groupe_lot)
for insc in inscriptions:
    statut_icon = "✅" if insc.statut == 'accepte' else "⏳"
    print(f"   {statut_icon} {insc.etudiant.prenom} {insc.etudiant.nom} ({insc.statut})")

print(f"\n5. URL de test:")
print(f"   Frontend: http://localhost:19006/groupes/{groupe_lot.id}")
print(f"   Backend API: http://192.168.43.210:8000/api/tutorat/groupes/{groupe_lot.id}/membres/")

print("\n=== FIN CRÉATION ===")
