#!/usr/bin/env python
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.accounts.models import User

print("=== TEST STATISTIQUES DÉTAILLÉES ===")

# Compter les utilisateurs par rôle et statut
total_tuteurs = User.objects.filter(role='tuteur').count()
tuteurs_actifs = User.objects.filter(role='tuteur', is_active=True).count()
tuteurs_inactifs = User.objects.filter(role='tuteur', is_active=False).count()

total_enseignants = User.objects.filter(role='enseignant').count()
enseignants_actifs = User.objects.filter(role='enseignant', is_active=True).count()
enseignants_inactifs = User.objects.filter(role='enseignant', is_active=False).count()

total_etudiants = User.objects.filter(role='etudiant').count()
etudiants_actifs = User.objects.filter(role='etudiant', is_active=True).count()
etudiants_inactifs = User.objects.filter(role='etudiant', is_active=False).count()

# Combiner tuteurs + enseignants
tuteurs_enseignants_total = total_tuteurs + total_enseignants
tuteurs_enseignants_actifs = tuteurs_actifs + enseignants_actifs
tuteurs_enseignants_inactifs = tuteurs_inactifs + enseignants_inactifs

print(f"\n📊 STATISTIQUES DÉTAILLÉES:")
print(f"\n📚 ÉTUDIANTS:")
print(f"  Total: {total_etudiants}")
print(f"  Actifs: {etudiants_actifs}")
print(f"  Inactifs: {etudiants_inactifs}")

print(f"\n👨‍🏫 TUTEURS:")
print(f"  Total: {total_tuteurs}")
print(f"  Actifs: {tuteurs_actifs}")
print(f"  Inactifs: {tuteurs_inactifs}")

print(f"\n🎓 ENSEIGNANTS:")
print(f"  Total: {total_enseignants}")
print(f"  Actifs: {enseignants_actifs}")
print(f"  Inactifs: {enseignants_inactifs}")

print(f"\n🔄 TUTEURS + ENSEIGNANTS (COMBINÉ):")
print(f"  Total: {tuteurs_enseignants_total}")
print(f"  Actifs: {tuteurs_enseignants_actifs}")
print(f"  Inactifs: {tuteurs_enseignants_inactifs}")

print(f"\n🎯 CE QUI DOIT S'AFFICHER DANS LE TABLEAU DE BORD:")

print(f"\n📈 SECTION DÉTAILLÉE:")
print(f"┌─────────────────────────────────────────────┐")
print(f"│ 📚 Étudiants                            │")
print(f"│    Total: {total_etudiants:<3}  Actif: {etudiants_actifs:<3}  Inactif: {etudiants_inactifs:<3}    │")
print(f"├─────────────────────────────────────────────┤")
print(f"│ 👨‍🏫 Tuteurs/Enseignants                │")
print(f"│    Total: {tuteurs_enseignants_total:<3}  Actif: {tuteurs_enseignants_actifs:<3}  Inactif: {tuteurs_enseignants_inactifs:<3}    │")
print(f"└─────────────────────────────────────────────┘")

print(f"\n✅ VÉRIFICATION:")
if tuteurs_enseignants_actifs == 6 and tuteurs_enseignants_inactifs == 0:
    print("✅ Parfait ! Tuteurs/Enseignants: 6 actifs, 0 inactifs")
elif tuteurs_enseignants_actifs == 0 and tuteurs_enseignants_inactifs == 6:
    print("⚠️ Problème ! Tuteurs/Enseignants: 0 actifs, 6 inactifs")
    print("   → Les tuteurs sont probablement marqués comme is_active=False")
else:
    print(f"📊 Stats réelles: {tuteurs_enseignants_actifs} actifs, {tuteurs_enseignants_inactifs} inactifs")

print(f"\n🔍 LISTE DES TUTEURS/ENSEIGNANTS:")
print(f"{'Email':<25} {'Rôle':<12} {'is_active':<10} {'Statut'}")
print("=" * 65)

for user in User.objects.filter(role__in=['tuteur', 'enseignant']).order_by('role', 'email'):
    statut = "ACTIF" if user.is_active else "INACTIF"
    print(f"{user.email:<25} {user.role:<12} {str(user.is_active):<10} {statut}")

print(f"\n🚀 SOLUTION:")
print("1. Si les tuteurs devraient être actifs:")
print("   → Exécuter: python sync_is_active.py")
print("2. Si le problème persiste:")
print("   → Vérifier les logs frontend pour les données reçues")
print("3. Pour tester l'API:")
print("   → curl -H 'Authorization: Bearer TOKEN' http://192.168.43.210:8000/api/auth/admin/stats/")

print(f"\n✅ TEST TERMINÉ")
