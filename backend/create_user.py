#!/usr/bin/env python
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.accounts.models import User

def create_test_user():
    try:
        # Supprimer l'utilisateur s'il existe déjà
        User.objects.filter(email='tuteur@test.com').delete()
        
        # Créer un utilisateur tuteur de test
        user = User.objects.create_user(
            email='tuteur@test.com',
            password='test123456',
            prenom='Test',
            nom='Tuteur',
            role='tuteur',
            is_active=True
        )
        
        print(f'✅ Utilisateur tuteur créé: {user.email}')
        print(f'✅ Rôle: {user.role}')
        print(f'✅ Actif: {user.is_active}')
        print(f'✅ Mot de passe: test123456')
        
    except Exception as e:
        print(f'❌ Erreur: {e}')

if __name__ == '__main__':
    create_test_user()
