#!/usr/bin/env python
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.accounts.models import User

print('=== UTILISATEURS EXISTANTS ===')
for user in User.objects.all():
    print(f'ID: {user.id}, Email: {user.email}, Rôle: {user.role}, Actif: {user.est_actif}, is_active: {user.is_active}')

print('\n=== DEMANDES TUTEUR ===')
from apps.accounts.models import DemandeTuteur
for demande in DemandeTuteur.objects.all():
    print(f'ID: {demande.id}, Utilisateur: {demande.utilisateur.email}, Statut: {demande.statut}')
