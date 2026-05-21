#!/usr/bin/env python3
"""
Script pour tester la correction de l'envoi de fichiers depuis le frontend
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

def test_debug_endpoint():
    """Tester l'endpoint de création avec debug pour voir les fichiers reçus"""
    token = test_auth()
    
    if not token:
        print("Impossible d'obtenir le token")
        return
    
    url = 'http://192.168.43.210:8000/api/ressources/groupes/creer-ressource/'
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    # Données FormData avec fichier
    data = {
        'titre': 'Test debug fichier',
        'description': 'Test pour vérifier la réception des fichiers',
        'type': 'cours',
        'matiere': 'Test',
        'niveau': 'L2',
        'tags': 'debug,fichier',
        'lien_externe': '',
        'groupes_partages': '6'
    }
    
    # Fichier de test
    files = {
        'fichier': ('test_debug.txt', 'Contenu du fichier de test debug', 'text/plain')
    }
    
    try:
        response = requests.post(url, data=data, files=files, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 201:
            print("SUCCESS: Fichier reçu et traité correctement !")
            return True
        else:
            print(f"ERROR: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"Exception: {e}")
        return False

def test_without_file():
    """Tester la création sans fichier (type lien)"""
    token = test_auth()
    
    if not token:
        print("Impossible d'obtenir le token")
        return
    
    url = 'http://192.168.43.210:8000/api/ressources/groupes/creer-ressource/'
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    # Données FormData pour un lien (sans fichier)
    data = {
        'titre': 'Test debug lien',
        'description': 'Test pour vérifier la création sans fichier',
        'type': 'lien',
        'matiere': 'Test',
        'niveau': 'L2',
        'tags': 'debug,lien',
        'lien_externe': 'https://example.com',
        'groupes_partages': '6'
    }
    
    try:
        response = requests.post(url, data=data, headers=headers)
        print(f"Status (sans fichier): {response.status_code}")
        print(f"Response (sans fichier): {response.text}")
        
        if response.status_code == 201:
            print("SUCCESS: Création sans fichier fonctionne !")
            return True
        else:
            print(f"ERROR: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"Exception: {e}")
        return False

if __name__ == '__main__':
    print("=== TEST DE LA CORRECTION D'ENVOI DE FICHIERS ===")
    print()
    
    print("1. Test création AVEC fichier:")
    test_debug_endpoint()
    print()
    
    print("2. Test création SANS fichier (lien):")
    test_without_file()
    print()
    
    print("=== FIN DU TEST ===")
