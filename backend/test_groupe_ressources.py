#!/usr/bin/env python3
"""
Script pour tester les ressources de groupe et l'accès étudiant
"""

import requests
import json

def test_auth():
    """Obtenir un token d'authentification"""
    url = 'http://192.168.43.210:8000/api/auth/login/'
    
    data = {
        'email': 'djek@gmail.com',
        'password': 'password123'
    }
    
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            return response.json().get('access')
        else:
            print(f"Auth error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Auth exception: {e}")
        return None

def test_auth_student():
    """Obtenir un token pour un étudiant"""
    url = 'http://192.168.43.210:8000/api/auth/login/'
    
    data = {
        'email': 'maha@gmail.com',  # Étudiant inscrite au groupe 6
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

def test_ressources_groupe_tuteur():
    """Tester l'accès aux ressources du groupe pour un tuteur"""
    token = test_auth()
    
    if not token:
        print("Impossible d'obtenir le token tuteur")
        return
    
    url = 'http://192.168.43.210:8000/api/ressources/groupes/6/ressources/'
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Tuteur - Status: {response.status_code}")
        print(f"Tuteur - Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Tuteur - Nombre de ressources: {len(data) if isinstance(data, list) else 'N/A'}")
            return True
        else:
            return False
            
    except Exception as e:
        print(f"Tuteur exception: {e}")
        return False

def test_ressources_groupe_etudiant():
    """Tester l'accès aux ressources du groupe pour un étudiant"""
    token = test_auth_student()
    
    if not token:
        print("Impossible d'obtenir le token étudiant")
        return
    
    url = 'http://192.168.43.210:8000/api/ressources/groupes/6/ressources/'
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Étudiant - Status: {response.status_code}")
        print(f"Étudiant - Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Étudiant - Nombre de ressources: {len(data) if isinstance(data, list) else 'N/A'}")
            if isinstance(data, list) and len(data) > 0:
                print(f"Étudiant - Première ressource: {data[0].get('titre', 'N/A')}")
            return True
        else:
            return False
            
    except Exception as e:
        print(f"Étudiant exception: {e}")
        return False

def test_ressources_generales():
    """Tester l'endpoint général des ressources avec filtre groupe"""
    token = test_auth_student()
    
    if not token:
        print("Impossible d'obtenir le token étudiant")
        return
    
    # Test avec l'endpoint général et filtre groupes_partages
    url = 'http://192.168.43.210:8000/api/ressources/ressources/'
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    params = {
        'groupes_partages': '6',
        'statut': 'publie'
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        print(f"Étudiant (général) - Status: {response.status_code}")
        print(f"Étudiant (général) - Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Étudiant (général) - Nombre de ressources: {len(data) if isinstance(data, list) else 'N/A'}")
            return True
        else:
            return False
            
    except Exception as e:
        print(f"Étudiant (général) exception: {e}")
        return False

if __name__ == '__main__':
    print("=== TEST RESSOURCES DE GROUPE ===")
    print()
    
    print("1. Test ressources groupe (Tuteur Djek):")
    test_ressources_groupe_tuteur()
    print()
    
    print("2. Test ressources groupe (Étudiant Maha):")
    test_ressources_groupe_etudiant()
    print()
    
    print("3. Test ressources générales avec filtre groupe (Étudiant):")
    test_ressources_generales()
    print()
    
    print("=== FIN DU TEST ===")
