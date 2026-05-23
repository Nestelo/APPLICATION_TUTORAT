import os
import django

# Configuration pour utiliser la base de données de Render
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')

# Indique à Django d'utiliser la base de données définie par DATABASE_URL
# (nous la passerons en variable d'environnement avant d'exécuter ce script)

def main():
    django.setup()
    
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    email = 'ndjerabeernest@gmail.com'
    password = 'Nestelo10'
    prenom = 'Ernest'
    nom = 'Ndjérabé'
    
    if not User.objects.filter(email=email).exists():
        user = User.objects.create_superuser(
            email=email,
            password=password,
            prenom=prenom,
            nom=nom,
            role='admin',
            is_active=True,
            is_staff=True,
            is_superuser=True
        )
        print(f"✅ Superutilisateur {email} créé avec succès.")
        print(f"   Nom complet : {user.prenom} {user.nom}")
        print(f"   Rôle : {user.role}")
    else:
        print(f"⚠️ L'utilisateur {email} existe déjà.")

if __name__ == '__main__':
    main()