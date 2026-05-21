#!/usr/bin/env python
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.accounts.models import User

def create_admin_user():
    try:
        # Supprimer l'utilisateur s'il existe déjà
        User.objects.filter(email='ndoubadabonheur@gmail.com').delete()
        
        # Créer l'utilisateur admin principal
        user = User.objects.create_user(
            email='ndoubadabonheur@gmail.com',
            password='bonheur6840',
            prenom='Admin',
            nom='Principal',
            role='admin',
            is_active=True,
            is_staff=True,
            is_superuser=True
        )
        
        print(f'✅ Utilisateur admin principal créé: {user.email}')
        print(f'✅ Rôle: {user.role}')
        print(f'✅ Actif: {user.is_active}')
        print(f'✅ Superuser: {user.is_superuser}')
        print(f'✅ Staff: {user.is_staff}')
        print(f'✅ Mot de passe: bonheur6840')
        
    except Exception as e:
        print(f'❌ Erreur: {e}')

if __name__ == '__main__':
    create_admin_user()
