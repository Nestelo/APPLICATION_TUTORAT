#!/usr/bin/env python3
"""
Script pour tester les ressources de Motar et l'accès étudiant
"""

import requests
import json

def test_auth_motar():
    """Obtenir un token pour Motar (tuteur)"""
    url = 'http://192.168.43.210:8000/api/auth/login/'
    
    data = {
        'email': 'motar@gmail.com',
        'password': 'password123'  # Mot de passe par défaut
    }
    
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            return response.json().get('access')
        else:
            print(f"Motar auth error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Motar auth exception: {e}")
        return None

def test_auth_student():
    """Obtenir un token pour un étudiant"""
    url = 'http://192.168.43.210:8000/api/auth/login/'
    
    data = {
        'email': 'yaya@gmail.com',  # Étudiant
        'password': 'password123'
    }
    
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            return response.json().get('access')
        else:
            print(f"Student auth error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Student auth exception: {e}")
        return None

def get_motar_groups():
    """Récupérer les groupes de Motar"""
    token = test_auth_motar()
    
    if not token:
        print("Impossible d'obtenir le token Motar")
        return []
    
    url = 'http://192.168.43.210:8000/api/tutorat/groupes/'
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            groups = data if isinstance(data, list) else data.get('results', [])
            print(f"Groupes de Motar: {len(groups)}")
            for group in groups:
                print(f"  - {group.get('nom')} (ID: {group.get('id')})")
            return groups
        else:
            print(f"Error getting groups: {response.status_code}")
            return []
    except Exception as e:
        print(f"Exception getting groups: {e}")
        return []

def test_motar_ressources(groupe_id):
    """Tester les ressources de Motar pour un groupe"""
    token = test_auth_motar()
    
    if not token:
        print("Impossible d'obtenir le token Motar")
        return
    
    url = f'http://192.168.43.210:8000/api/ressources/groupes/{groupe_id}/ressources/'
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Motar - Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Motar - Nombre de ressources: {len(data) if isinstance(data, list) else 'N/A'}")
            
            if isinstance(data, list):
                for res in data:
                    print(f"  - {res.get('titre')} (validée: {res.get('validee_par_admin')})")
                    print(f"    Fichier: {res.get('fichier_url')}")
        else:
            print(f"Motar - Error: {response.text}")
            
    except Exception as e:
        print(f"Motar exception: {e}")

def test_student_ressources(groupe_id):
    """Tester l'accès étudiant aux ressources"""
    token = test_auth_student()
    
    if not token:
        print("Impossible d'obtenir le token étudiant")
        return
    
    url = f'http://192.168.43.210:8000/api/ressources/groupes/{groupe_id}/ressources/'
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Étudiant - Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Étudiant - Nombre de ressources: {len(data) if isinstance(data, list) else 'N/A'}")
            
            if isinstance(data, list):
                for res in data:
                    print(f"  - {res.get('titre')} (validée: {res.get('validee_par_admin')})")
                    print(f"    Fichier: {res.get('fichier_url')}")
        else:
            print(f"Étudiant - Error: {response.text}")
            
    except Exception as e:
        print(f"Étudiant exception: {e}")

def validate_motar_password():
    """Réinitialiser le mot de passe de Motar si nécessaire"""
    import subprocess
    try:
        result = subprocess.run([
            'python', 'manage.py', 'shell', '-c',
            """
from apps.accounts.models import User
try:
    motar = User.objects.get(email='motar@gmail.com')
    motar.set_password('password123')
    motar.save()
    print('Mot de passe Motar réinitialisé')
except User.DoesNotExist:
    print('Utilisateur motar@gmail.com non trouvé')
"""
        ], capture_output=True, text=True, cwd='.')
        print(result.stdout)
    except Exception as e:
        print(f"Erreur réinitialisation Motar: {e}")

if __name__ == '__main__':
    print("=== TEST RESSOURCES MOTAR ===")
    print()
    
    # Réinitialiser le mot de passe de Motar si nécessaire
    validate_motar_password()
    print()
    
    # Récupérer les groupes de Motar
    groups = get_motar_groups()
    print()
    
    if groups:
        # Tester le premier groupe de Motar
        groupe_id = groups[0].get('id')
        groupe_nom = groups[0].get('nom')
        
        print(f"Test des ressources pour le groupe: {groupe_nom} (ID: {groupe_id})")
        print()
        
        print("1. Test accès Motar (tuteur):")
        test_motar_ressources(groupe_id)
        print()
        
        print("2. Test accès étudiant:")
        test_student_ressources(groupe_id)
        print()
    else:
        print("Aucun groupe trouvé pour Motar")
    
    print("=== FIN DU TEST ===")
