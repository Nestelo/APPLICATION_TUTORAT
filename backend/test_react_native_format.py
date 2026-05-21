#!/usr/bin/env python3
"""
Script pour tester l'envoi de fichiers au format React Native
"""

import requests
import json
import os

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

def test_react_native_format():
    """Tester l'envoi avec le format exact de React Native"""
    token = test_auth()
    
    if not token:
        print("Impossible d'obtenir le token")
        return
    
    url = 'http://192.168.43.210:8000/api/ressources/groupes/creer-ressource/'
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    # Simuler le format FormData de React Native
    # Dans React Native, les fichiers sont envoyés comme des objets avec uri, type, name
    data = {
        'titre': 'Test React Native Format',
        'description': 'Test avec format exact de React Native',
        'type': 'cours',
        'matiere': 'Test RN',
        'niveau': 'L2',
        'tags': 'react,native,format',
        'lien_externe': '',
        'groupes_partages': '6'
    }
    
    # Fichier au format React Native
    # Note: En Python requests, on ne peut pas envoyer un objet comme React Native
    # On doit utiliser le format standard de requests
    files = {
        'fichier': ('react_native_test.jpg', b'fake_image_content', 'image/jpeg')
    }
    
    try:
        print("Envoi avec format requests standard...")
        response = requests.post(url, data=data, files=files, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 201:
            print("SUCCESS: Format requests standard fonctionne !")
            return True
        else:
            print(f"ERROR: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"Exception: {e}")
        return False

def test_debug_request_data():
    """Tester pour voir exactement ce que le backend reçoit"""
    token = test_auth()
    
    if not token:
        print("Impossible d'obtenir le token")
        return
    
    url = 'http://192.168.43.210:8000/api/ressources/groupes/creer-ressource/'
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    # Test sans fichier pour voir si le backend reçoit bien les autres données
    data = {
        'titre': 'Debug sans fichier',
        'description': 'Test pour vérifier la réception des données',
        'type': 'lien',  # Type lien pour ne pas nécessiter de fichier
        'matiere': 'Debug',
        'niveau': 'L2',
        'tags': 'debug,no-file',
        'lien_externe': 'https://example.com',
        'groupes_partages': '6'
    }
    
    try:
        print("Test sans fichier pour vérifier la réception des données...")
        response = requests.post(url, data=data, headers=headers)
        print(f"Status (sans fichier): {response.status_code}")
        print(f"Response (sans fichier): {response.text}")
        
        if response.status_code == 201:
            print("SUCCESS: Données reçues correctement sans fichier !")
            return True
        else:
            print(f"ERROR: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"Exception: {e}")
        return False

if __name__ == '__main__':
    print("=== TEST FORMAT REACT NATIVE ===")
    print()
    
    print("1. Test sans fichier (vérifier réception données):")
    test_debug_request_data()
    print()
    
    print("2. Test avec fichier format requests:")
    test_react_native_format()
    print()
    
    print("=== FIN DU TEST ===")
