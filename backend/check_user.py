#!/usr/bin/env python
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.accounts.models import User

def check_user():
    try:
        # Vérifier si l'utilisateur existe
        user = User.objects.filter(email='ndoubadabnheur@gmail.com').first()
        
        if user:
            print(f'✅ Utilisateur trouvé: {user.email}')
            print(f'✅ Prénom: {user.prenom}')
            print(f'✅ Nom: {user.nom}')
            print(f'✅ Rôle: {user.role}')
            print(f'✅ Actif: {user.is_active}')
            print(f'✅ ID: {user.id}')
        else:
            print('❌ Utilisateur non trouvé')
            
        # Lister tous les utilisateurs
        print('\n📋 Tous les utilisateurs:')
        for u in User.objects.all():
            print(f'  - {u.email} ({u.role}) - Actif: {u.is_active}')
            
    except Exception as e:
        print(f'❌ Erreur: {e}')

if __name__ == '__main__':
    check_user()
