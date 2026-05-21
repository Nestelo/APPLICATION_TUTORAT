#!/usr/bin/env python
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat.settings')
django.setup()

from apps.accounts.models import User
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta

# Analyse des données réelles
print('=== ANALYSE DES DONNÉES UTILISATEURS ===')
print(f'Total utilisateurs dans la base: {User.objects.count()}')

# Répartition par rôle
print('\n=== RÉPARTITION PAR RÔLE ===')
users_by_role = User.objects.values('role').annotate(count=Count('id')).order_by('role')
for item in users_by_role:
    print(f'Rôle: {item["role"]} - Count: {item["count"]}')

# Vérification des dates d'inscription
print('\n=== ANALYSE DES DATES D\'INSCRIPTION ===')
now = timezone.now()
start_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
print(f'Début du mois: {start_month}')

users_this_month = User.objects.filter(date_inscription__gte=start_month)
print(f'Utilisateurs ce mois: {users_this_month.count()}')

# Vérifier si date_inscription peut être NULL
null_dates = User.objects.filter(date_inscription__isnull=True)
print(f'Utilisateurs avec date_inscription NULL: {null_dates.count()}')

# Afficher quelques exemples
print('\n=== EXEMPLES D\'UTILISATEURS ===')
sample_users = User.objects.all()[:5]
for user in sample_users:
    print(f'ID: {user.id}, Email: {user.email}, Rôle: {user.role}, Date: {user.date_inscription}')

# Test du logique de rapport
print('\n=== TEST LOGIQUE RAPPORT ===')
period = 'mois'

if period == 'mois':
    start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
elif period == 'trimestre':
    month = (now.month - 1) // 3 * 3 + 1
    start_date = now.replace(month=month, day=1, hour=0, minute=0, second=0, microsecond=0)
elif period == 'annee':
    start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
else:  # all
    start_date = None

print(f'Start date for period "{period}": {start_date}')

# Base queryset
users_qs = User.objects.all()
if start_date:
    users_qs = users_qs.filter(date_inscription__gte=start_date)

print(f'Users queryset count: {users_qs.count()}')

# Statistiques générales
total_users = users_qs.count()
print(f'Total users in period: {total_users}')

users_by_role = users_qs.values('role').annotate(count=Count('id')).order_by('role')
print('Users by role in period:')
for item in users_by_role:
    print(f'  {item["role"]}: {item["count"]}')
