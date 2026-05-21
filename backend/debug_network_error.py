#!/usr/bin/env python3
"""
Script pour diagnostiquer l'erreur "Network Error" lors de la création de ressources de groupe
"""

import requests
import json
import os

def test_auth_token():
    """Tester l'authentification et obtenir un token"""
    url = 'http://192.168.43.210:8000/api/auth/login/'
    
    # Utiliser les identifiants du tuteur djek@gmail.com (mot de passe réinitialisé)
    data = {
        'email': 'djek@gmail.com',
        'password': 'password123'  # Mot de passe réinitialisé
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Auth Status: {response.status_code}")
        print(f"Auth Response: {response.text}")
        
        if response.status_code == 200:
            return response.json().get('access')
        else:
            return None
    except Exception as e:
        print(f"Auth Error: {e}")
        return None

def test_create_resource_with_auth():
    """Tester la création de ressource avec authentification"""
    token = test_auth_token()
    
    if not token:
        print("Impossible d'obtenir le token d'authentification")
        return
    
    url = 'http://192.168.43.210:8000/api/ressources/groupes/creer-ressource/'
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'multipart/form-data'
    }
    
    # Données de test (FormData)
    data = {
        'titre': 'Test ressource debug',
        'description': 'Test description pour debug',
        'type': 'cours',
        'matiere': 'Math',
        'niveau': 'L2',
        'tags': 'debug',
        'lien_externe': '',
        'groupes_partages': '6'
    }
    
    try:
        response = requests.post(url, data=data, headers=headers)
        print(f"Create Status: {response.status_code}")
        print(f"Create Response: {response.text}")
        
        if response.status_code == 201:
            print("SUCCÈS: Création de ressource fonctionne !")
        else:
            print(f"ERREUR: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"Create Error: {e}")

def test_create_resource_with_file():
    """Tester la création de ressource avec fichier"""
    token = test_auth_token()
    
    if not token:
        print("Impossible d'obtenir le token d'authentification")
        return
    
    url = 'http://192.168.43.210:8000/api/ressources/groupes/creer-ressource/'
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    # Données de test avec fichier simulé
    data = {
        'titre': 'Test ressource avec fichier',
        'description': 'Test description avec fichier',
        'type': 'cours',
        'matiere': 'Math',
        'niveau': 'L2',
        'tags': 'debug,fichier',
        'lien_externe': '',
        'groupes_partages': '6'
    }
    
    # Créer un fichier de test
    files = {
        'fichier': ('test.txt', 'Contenu du fichier de test', 'text/plain')
    }
    
    try:
        response = requests.post(url, data=data, files=files, headers=headers)
        print(f"Create with File Status: {response.status_code}")
        print(f"Create with File Response: {response.text}")
        
        if response.status_code == 201:
            print("SUCCÈS: Création de ressource avec fichier fonctionne !")
        else:
            print(f"ERREUR: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"Create with File Error: {e}")

def test_permissions():
    """Tester les permissions du tuteur sur le groupe 6"""
    token = test_auth_token()
    
    if not token:
        print("Impossible d'obtenir le token d'authentification")
        return
    
    url = 'http://192.168.43.210:8000/api/ressources/groupes/6/ressources/'
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Permissions Status: {response.status_code}")
        print(f"Permissions Response: {response.text}")
        
        if response.status_code == 200:
            print("SUCCÈS: Le tuteur a accès aux ressources du groupe 6")
        else:
            print(f"ERREUR: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"Permissions Error: {e}")

if __name__ == '__main__':
    print("=== DIAGNOSTIC DE L'ERREUR NETWORK ERROR ===")
    print()
    
    print("1. Test authentification:")
    test_auth_token()
    print()
    
    print("2. Test permissions:")
    test_permissions()
    print()
    
    print("3. Test création ressource:")
    test_create_resource_with_auth()
    print()
    
    print("4. Test création ressource avec fichier:")
    test_create_resource_with_file()
    print()
    
    print("=== FIN DU DIAGNOSTIC ===")
