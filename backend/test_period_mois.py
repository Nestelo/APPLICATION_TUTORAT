#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat.settings')
django.setup()

from apps.accounts.models import User
from django.utils import timezone
from datetime import timedelta

print('=== TEST DE LA LOGIQUE PÉRIODE "MOIS" ===')

now = timezone.now()
print(f'Date actuelle: {now}')
print(f'Mois actuel: {now.month}')
print(f'Année actuelle: {now.year}')

# Logique "mois" comme dans le code
start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
print(f'Date de début pour période "mois": {start_date}')

# Compter les utilisateurs
total_users = User.objects.count()
users_mois = User.objects.filter(date_inscription__gte=start_date).count()
users_all = User.objects.count()

print(f'\n=== STATISTIQUES UTILISATEURS ===')
print(f'Total utilisateurs (all): {users_all}')
print(f'Utilisateurs ce mois (mois): {users_mois}')
print(f'Différence: {users_all - users_mois} utilisateurs avant ce mois')

# Afficher quelques exemples
print(f'\n=== UTILISATEURS INSCRITS CE MOIS ===')
users_this_month = User.objects.filter(date_inscription__gte=start_date).order_by('-date_inscription')[:5]
for user in users_this_month:
    print(f'- {user.prenom} {user.nom} ({user.email}) - {user.date_inscription}')

print(f'\n=== UTILISATEURS INSCRITS AVANT CE MOIS ===')
users_before_month = User.objects.filter(date_inscription__lt=start_date).order_by('-date_inscription')[:5]
for user in users_before_month:
    print(f'- {user.prenom} {user.nom} ({user.email}) - {user.date_inscription}')

print(f'\n=== VÉRIFICATION DE LA LOGIQUE ===')
if users_mois == 0:
    print('⚠️  Aucun utilisateur inscrit ce mois - normal si la plupart des utilisateurs sont plus anciens')
    print('💡 Pour tester avec toutes les données, utilisez period=all')
else:
    print(f'✅ {users_mois} utilisateurs trouvés pour la période "mois"')

print('\n=== TEST TERMINÉ ===')
