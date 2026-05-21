#!/usr/bin/env python
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

# Test des modèles
try:
    from apps.messagerie.models import EmailMessage, EmailReponse, AccuseReception
    print("✅ Importation réussie des modèles email")
    
    # Vérifier les tables
    print(f"✅ Table EmailMessage: {EmailMessage._meta.db_table}")
    print(f"✅ Table EmailReponse: {EmailReponse._meta.db_table}")
    print(f"✅ Table AccuseReception: {AccuseReception._meta.db_table}")
    
    # Test de création simple
    from apps.accounts.models import User
    
    # Vérifier s'il y a des utilisateurs
    users_count = User.objects.count()
    print(f"✅ Nombre d'utilisateurs dans la base: {users_count}")
    
    if users_count > 0:
        test_user = User.objects.first()
        print(f"✅ Utilisateur test: {test_user.email}")
        
        # Créer un email de test
        test_email = EmailMessage.objects.create(
            expediteur=test_user,
            destinataire=test_user,
            sujet="Test email système",
            contenu="Ceci est un test pour vérifier que le système fonctionne",
            statut="envoye"
        )
        print(f"✅ Email de test créé: ID {test_email.id}")
        
        # Vérifier l'email
        email_check = EmailMessage.objects.get(id=test_email.id)
        print(f"✅ Email vérifié: {email_check.sujet}")
        
    else:
        print("⚠️ Aucun utilisateur trouvé - veuillez créer un utilisateur d'abord")
        
except Exception as e:
    print(f"❌ Erreur: {e}")
    import traceback
    traceback.print_exc()
