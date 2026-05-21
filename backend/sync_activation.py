#!/usr/bin/env python
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.accounts.models import User

print("=== SYNCHRONISATION DES COMPTES UTILISATEURS ===")

# Synchroniser tous les utilisateurs pour utiliser est_actif comme source de vérité
for user in User.objects.all():
    # Si l'utilisateur est un tuteur/enseignant, utiliser est_actif
    # Sinon, toujours considérer comme actif
    if user.role in ['tuteur', 'enseignant']:
        # Pour les tuteurs/enseignants, est_actif est la source de vérité
        nouvelle_valeur = user.est_actif
        print(f"Tuteur/Enseignant {user.email}: est_actif={user.est_actif} → is_active={nouvelle_valeur}")
    else:
        # Pour les étudiants et admins, toujours actif
        nouvelle_valeur = True
        print(f"Étudiant/Admin {user.email}: toujours actif")
    
    # Synchroniser is_active avec la logique métier
    if user.is_active != nouvelle_valeur:
        user.is_active = nouvelle_valeur
        user.save(update_fields=['is_active'])
        print(f"  → Mis à jour: is_active={nouvelle_valeur}")
    else:
        print(f"  → Déjà synchronisé")

print("\n=== RÉSUMÉ ===")
total = User.objects.count()
tuteurs_actifs = User.objects.filter(role='tuteur', est_actif=True).count()
tuteurs_inactifs = User.objects.filter(role='tuteur', est_actif=False).count()
etudiants = User.objects.filter(role='etudiant').count()
admins = User.objects.filter(role='admin').count()

print(f"Total utilisateurs: {total}")
print(f"Tuteurs actifs: {tuteurs_actifs}")
print(f"Tuteurs inactifs: {tuteurs_inactifs}")
print(f"Étudiants: {etudiants}")
print(f"Admins: {admins}")

print("\n=== SYNCHRONISATION TERMINÉE ===")
