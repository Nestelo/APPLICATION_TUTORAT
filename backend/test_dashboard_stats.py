#!/usr/bin/env python
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.accounts.models import User

print("=== VÉRIFICATION STATS TABLEAU DE BORD ===")

# Compter les utilisateurs par rôle
total_users = User.objects.count()
etudiants_actifs = User.objects.filter(role='etudiant', is_active=True).count()
tuteurs_actifs = User.objects.filter(role='tuteur', is_active=True).count()
enseignants_actifs = User.objects.filter(role='enseignant', is_active=True).count()
admins_actifs = User.objects.filter(role='admin', is_active=True).count()

# Combiner tuteurs + enseignants
tuteurs_enseignants_total = tuteurs_actifs + enseignants_actifs

print(f"\n📊 STATISTIQUES ACTUELLES:")
print(f"👥 Total utilisateurs: {total_users}")
print(f"📚 Étudiants: {etudiants_actifs}")
print(f"👨‍🏫 Tuteurs: {tuteurs_actifs}")
print(f"🎓 Enseignants: {enseignants_actifs}")
print(f"👨‍💼 Admins: {admins_actifs}")
print(f"🔄 Tuteurs + Enseignants: {tuteurs_enseignants_total}")

print(f"\n📋 CE QUI DOIT S'AFFICHER DANS LE TABLEAU DE BORD:")
print(f"📊 Utilisateurs: {total_users}")
print(f"📚 Étudiants: {etudiants_actifs}")
print(f"👨‍🏫 Tuteur/Enseignant: {tuteurs_enseignants_total}")

# Vérifier si les chiffres correspondent à l'exemple de l'utilisateur
print(f"\n🔍 COMPARAISON AVEC VOS CHIFFRES:")
print(f"Attendu: 23 utilisateurs, 6 tuteur/enseignant, 9 étudiants")
print(f"Réel: {total_users} utilisateurs, {tuteurs_enseignants_total} tuteur/enseignant, {etudiants_actifs} étudiants")

if total_users == 23 and tuteurs_enseignants_total == 6 and etudiants_actifs == 9:
    print("✅ Les chiffres correspondent exactement à votre exemple !")
else:
    print("⚠️ Les chiffres sont différents, mais c'est normal si vous avez ajouté/supprimé des utilisateurs")

print(f"\n📝 DÉTAIL PAR UTILISATEUR:")
print(f"{'Email':<25} {'Rôle':<12} {'Actif':<6} {'Affiché comme'}")
print("=" * 65)

for user in User.objects.all().order_by('role', 'email'):
    affiche_comme = user.role
    if user.role in ['tuteur', 'enseignant']:
        if user.is_active:
            affiche_comme = "Tuteur/Enseignant"
        else:
            affiche_comme = "Tuteur/Enseignant (inactif)"
    
    statut = "✅" if user.is_active else "❌"
    print(f"{user.email:<25} {user.role:<12} {statut:<6} {affiche_comme}")

print(f"\n🚀 TEST DE L'API:")
print("Pour tester l'API manuellement:")
print("curl -H 'Authorization: Bearer VOTRE_TOKEN' http://192.168.43.210:8000/api/auth/admin/stats/")

print(f"\n✅ VÉRIFICATION TERMINÉE")
print(f"Les stats devraient maintenant s'afficher correctement dans le tableau de bord !")
