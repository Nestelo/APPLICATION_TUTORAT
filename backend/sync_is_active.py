#!/usr/bin/env python
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.accounts.models import User

print("=== SYNCHRONISATION SUR is_active ===")

# Synchroniser tous les utilisateurs pour utiliser is_active comme source de vérité
for user in User.objects.all():
    ancien_est_actif = getattr(user, 'est_actif', None)
    ancien_is_active = user.is_active
    
    # Si l'utilisateur est un tuteur/enseignant, utiliser est_actif pour déterminer is_active
    if user.role in ['tuteur', 'enseignant']:
        # Si est_actif existe, l'utiliser, sinon garder is_actif actuel
        if ancien_est_actif is not None:
            nouvelle_valeur = ancien_est_actif
        else:
            nouvelle_valeur = ancien_is_active  # Garder la valeur actuelle si est_actif n'existe pas
        
        print(f"Tuteur/Enseignant {user.email}: est_actif={ancien_est_actif}, is_active={ancien_is_active} → is_active={nouvelle_valeur}")
    else:
        # Pour les étudiants et admins, toujours actif
        nouvelle_valeur = True
        print(f"Étudiant/Admin {user.email}: est_actif={ancien_est_actif}, is_active={ancien_is_active} → is_active={nouvelle_valeur}")
    
    # Mettre à jour is_active
    if user.is_active != nouvelle_valeur:
        user.is_active = nouvelle_valeur
        user.save(update_fields=['is_active'])
        print(f"  → MIS À JOUR: is_active={nouvelle_valeur}")
    else:
        print(f"  → DÉJÀ CORRECT")

print("\n=== RÉSUMÉ ===")
total = User.objects.count()
tuteurs_actifs = User.objects.filter(role='tuteur', is_active=True).count()
tuteurs_inactifs = User.objects.filter(role='tuteur', is_active=False).count()
etudiants = User.objects.filter(role='etudiant', is_active=True).count()
admins = User.objects.filter(role='admin', is_active=True).count()

print(f"Total utilisateurs: {total}")
print(f"Tuteurs actifs: {tuteurs_actifs}")
print(f"Tuteurs inactifs: {tuteurs_inactifs}")
print(f"Étudiants: {etudiants}")
print(f"Admins: {admins}")

print("\n=== TEST DE CONNEXION ===")
# Tester quelques comptes
test_users = User.objects.filter(role='tuteur')[:3]
for user in test_users:
    statut = "ACTIF" if user.is_active else "INACTIF"
    print(f"• {user.email} ({user.role}) → {statut}")

print("\n=== SYNCHRONISATION TERMINÉE ===")
print("Le système utilise maintenant UNIQUEMENT is_active pour l'activation !")
