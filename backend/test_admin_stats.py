#!/usr/bin/env python
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.accounts.models import User
from apps.accounts.views import admin_stats

print("=== TEST API ADMIN STATS ===")

# Simuler une requête admin
class MockRequest:
    def __init__(self):
        self.user = User.objects.filter(role='admin').first()

# Récupérer les stats
try:
    request = MockRequest()
    if request.user:
        from rest_framework.test import APIRequestFactory
        from rest_framework.request import Request
        
        factory = APIRequestFactory()
        django_request = factory.get('/auth/admin/stats/')
        drf_request = Request(django_request)
        drf_request.user = request.user
        
        response = admin_stats(drf_request)
        stats_data = response.data
        
        print("✅ Données retournées par l'API:")
        print(f"Total utilisateurs: {stats_data.get('total_users', 0)}")
        print(f"Par rôle: {stats_data.get('users_by_role', {})}")
        print(f"Croissance: {stats_data.get('user_growth', 0)}%")
        print(f"Récents: {len(stats_data.get('recent_users', []))} utilisateurs")
        
        print("\n=== DÉTAIL PAR RÔLE ===")
        users_by_role = stats_data.get('users_by_role', {})
        print(f"📚 Étudiants: {users_by_role.get('etudiants', 0)}")
        print(f"👨‍🏫 Tuteurs: {users_by_role.get('tuteurs', 0)}")
        print(f"🎓 Enseignants: {users_by_role.get('enseignants', 0)}")
        print(f"👤 Admins: {users_by_role.get('admins', 0)}")
        
        print("\n=== COMPARAISON AVEC BASE DE DONNÉES ===")
        total_db = User.objects.count()
        etudiants_db = User.objects.filter(role='etudiant', is_active=True).count()
        tuteurs_db = User.objects.filter(role='tuteur', is_active=True).count()
        enseignants_db = User.objects.filter(role='enseignant', is_active=True).count()
        admins_db = User.objects.filter(role='admin', is_active=True).count()
        
        print(f"Base de données:")
        print(f"  Total: {total_db}")
        print(f"  Étudiants: {etudiants_db}")
        print(f"  Tuteurs: {tuteurs_db}")
        print(f"  Enseignants: {enseignants_db}")
        print(f"  Admins: {admins_db}")
        
        print("\n=== VÉRIFICATION COHÉRENCE ===")
        api_total = stats_data.get('total_users', 0)
        if api_total == total_db:
            print("✅ Total utilisateurs cohérent")
        else:
            print(f"⚠️  Incohérence: API={api_total}, DB={total_db}")
            
    else:
        print("❌ Aucun utilisateur admin trouvé")
        
except Exception as e:
    print(f"❌ Erreur: {e}")
    import traceback
    traceback.print_exc()

print("\n=== TEST TERMINÉ ===")
