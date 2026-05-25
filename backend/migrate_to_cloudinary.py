#!/usr/bin/env python
"""
Script de migration des fichiers média existants vers Cloudinary
À exécuter localement avant le déploiement sur Render
"""

import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

import cloudinary
import cloudinary.uploader
from apps.accounts.models import User
from apps.ressources.models import Ressource

# Configuration Cloudinary
cloudinary.config(
    cloud_name='dqtk8z6of',
    api_key='877765774416995',
    api_secret='IlLuSpBfM3lsD8568Ve7nAZ6I-0',
    secure=True
)

def migrate_user_photos():
    """Migrer les photos de profil vers Cloudinary"""
    print("\n📸 Migration des photos de profil...")
    users = User.objects.filter(photo__isnull=False)
    
    for user in users:
        # Vérifier si c'est déjà une URL Cloudinary
        if user.photo and isinstance(user.photo, str):
            if user.photo.startswith('http://res.cloudinary.com') or user.photo.startswith('https://res.cloudinary.com'):
                print(f"  ⏭️ Déjà sur Cloudinary: {user.email}")
                continue
        
        try:
            # Vérifier si le fichier existe localement
            if user.photo and hasattr(user.photo, 'path') and os.path.exists(user.photo.path):
                result = cloudinary.uploader.upload(user.photo.path, folder="profils/")
                old_url = user.photo.url if hasattr(user.photo, 'url') else str(user.photo)
                user.photo = result['secure_url']
                user.save(update_fields=['photo'])
                print(f"  ✅ Migré: {user.email} -> {result['secure_url'][:50]}...")
            elif user.photo and isinstance(user.photo, str) and user.photo.startswith('/media/'):
                # Chemin relatif
                file_path = os.path.join('media', user.photo.replace('/media/', ''))
                if os.path.exists(file_path):
                    result = cloudinary.uploader.upload(file_path, folder="profils/")
                    user.photo = result['secure_url']
                    user.save(update_fields=['photo'])
                    print(f"  ✅ Migré (relatif): {user.email}")
                else:
                    print(f"  ⚠️ Fichier introuvable: {user.email} - {user.photo}")
            else:
                print(f"  ⚠️ Format non reconnu: {user.email} - {type(user.photo)}")
        except Exception as e:
            print(f"  ❌ Erreur pour {user.email}: {e}")

def migrate_ressources():
    """Migrer les ressources vers Cloudinary"""
    print("\n📚 Migration des ressources...")
    ressources = Ressource.objects.filter(fichier__isnull=False)
    
    for ressource in ressources:
        # Vérifier si c'est déjà une URL Cloudinary
        if ressource.fichier and isinstance(ressource.fichier, str):
            if ressource.fichier.startswith('http://res.cloudinary.com') or ressource.fichier.startswith('https://res.cloudinary.com'):
                print(f"  ⏭️ Déjà sur Cloudinary: {ressource.titre}")
                continue
        
        try:
            if hasattr(ressource.fichier, 'path') and os.path.exists(ressource.fichier.path):
                result = cloudinary.uploader.upload(ressource.fichier.path, folder="ressources/")
                ressource.fichier = result['secure_url']
                ressource.save(update_fields=['fichier'])
                print(f"  ✅ Migré: {ressource.titre}")
            elif isinstance(ressource.fichier, str) and ressource.fichier.startswith('/media/'):
                file_path = os.path.join('media', ressource.fichier.replace('/media/', ''))
                if os.path.exists(file_path):
                    result = cloudinary.uploader.upload(file_path, folder="ressources/")
                    ressource.fichier = result['secure_url']
                    ressource.save(update_fields=['fichier'])
                    print(f"  ✅ Migré (relatif): {ressource.titre}")
                else:
                    print(f"  ⚠️ Fichier introuvable: {ressource.titre} - {ressource.fichier}")
            else:
                print(f"  ⚠️ Format non reconnu: {ressource.titre}")
        except Exception as e:
            print(f"  ❌ Erreur pour {ressource.titre}: {e}")

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 MIGRATION VERS CLOUDINARY")
    print("=" * 60)
    
    # Vérifier la connexion à Cloudinary
    try:
        cloudinary.api.ping()
        print("✅ Connexion à Cloudinary établie")
    except Exception as e:
        print(f"❌ Erreur de connexion à Cloudinary: {e}")
        sys.exit(1)
    
    migrate_user_photos()
    migrate_ressources()
    
    print("\n" + "=" * 60)
    print("✅ Migration terminée !")
    print("=" * 60)