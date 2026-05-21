#!/usr/bin/env python
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.accounts.models import User

print("=== VÉRIFICATION STATUT TUTEURS/ENSEIGNANTS ===")

# Vérifier les tuteurs et enseignants
tuteurs_enseignants = User.objects.filter(role__in=['tuteur', 'enseignant']).order_by('role', 'email')

print(f"\n{'Email':<30} {'Rôle':<12} {'is_active':<10} {'est_actif':<10} {'Statut Affiché'}")
print("=" * 80)

for user in tuteurs_enseignants:
    # Simuler ce que le frontend va afficher
    statut_affiche = "Actif" if user.is_active else "Inactif"
    
    print(f"{user.email:<30} {user.role:<12} {str(user.is_active):<10} {str(getattr(user, 'est_actif', 'N/A')):<10} {statut_affiche}")

print("\n=== RÉSUMÉ PAR RÔLE ===")
for role in ['tuteur', 'enseignant']:
    total = User.objects.filter(role=role).count()
    actifs_is_active = User.objects.filter(role=role, is_active=True).count()
    inactifs_is_active = User.objects.filter(role=role, is_active=False).count()
    
    print(f"\n{role.upper()}S:")
    print(f"  Total: {total}")
    print(f"  Actifs (is_active=True): {actifs_is_active}")
    print(f"  Inactifs (is_active=False): {inactifs_is_active}")

# Vérifier les incohérences
print("\n=== VÉRIFICATION INHÉRENCES ===")
incoherences = []
for user in tuteurs_enseignants:
    est_actif = getattr(user, 'est_actif', None)
    if est_actif is not None and user.is_active != est_actif:
        incoherences.append({
            'email': user.email,
            'role': user.role,
            'is_active': user.is_active,
            'est_actif': est_actif
        })

if incoherences:
    print("⚠️  INHÉRENCES TROUVÉES:")
    for inh in incoherences:
        print(f"  • {inh['email']} ({inh['role']}): is_active={inh['is_active']}, est_actif={inh['est_actif']}")
else:
    print("✅ Aucune incohérence trouvée")

print("\n=== RECOMMANDATIONS ===")
print("1. Si vous voyez 'Inactif' alors que le tuteur devrait être actif:")
print("   → Exécutez: python sync_is_active.py")
print("2. Si les logs frontend montrent est_actif=N/A:")
print("   → C'est normal, est_actif n'est plus envoyé par l'API")
print("3. Après correction, redémarrez le serveur Django")
print("\n=== VÉRIFICATION TERMINÉE ===")
