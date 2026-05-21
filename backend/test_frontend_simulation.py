#!/usr/bin/env python3
"""
Script pour simuler exactement ce que le frontend React Native envoie
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

def test_multipart_like_react_native():
    """Tester l'envoi multipart comme React Native pourrait le faire"""
    token = test_auth()
    
    if not token:
        print("Impossible d'obtenir le token")
        return
    
    url = 'http://192.168.43.210:8000/api/ressources/groupes/creer-ressource/'
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    # Données exactement comme dans le frontend
    data = {
        'titre': 'Test simulation React Native',
        'description': 'Simulation exacte du frontend',
        'type': 'cours',
        'matiere': 'Simulation',
        'niveau': 'L2',
        'tags': 'simulation,frontend',
        'lien_externe': '',
        'groupes_partages': '6'
    }
    
    # Simuler un fichier comme React Native le ferait
    # React Native utilise parfois un format différent
    files = {
        'fichier': ('simulation_test.jpg', b'fake_content', 'image/jpeg')
    }
    
    try:
        print("Simulation de l'envoi React Native...")
        response = requests.post(url, data=data, files=files, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        return response.status_code == 201
            
    except Exception as e:
        print(f"Exception: {e}")
        return False

def test_missing_file_scenario():
    """Tester le scénario où le fichier est manquant (comme dans l'erreur)"""
    token = test_auth()
    
    if not token:
        print("Impossible d'obtenir le token")
        return
    
    url = 'http://192.168.43.210:8000/api/ressources/groupes/creer-ressource/'
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    # Envoyer les données mais SANS fichier (comme si le fichier n'était pas reçu)
    data = {
        'titre': 'Test fichier manquant',
        'description': 'Test quand le fichier n\'est pas reçu',
        'type': 'cours',  # Type qui nécessite un fichier
        'matiere': 'Test',
        'niveau': 'L2',
        'tags': 'missing,file',
        'lien_externe': '',
        'groupes_partages': '6'
    }
    
    # Ne pas envoyer de fichiers pour simuler l'erreur
    try:
        print("Test sans fichier (type=cours)...")
        response = requests.post(url, data=data, headers=headers)
        print(f"Status (sans fichier): {response.status_code}")
        print(f"Response (sans fichier): {response.text}")
        
        if response.status_code == 400 and "fichier est obligatoire" in response.text:
            print("SUCCESS: Erreur attendue quand fichier manquant !")
            return True
        else:
            print(f"UNEXPECTED: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"Exception: {e}")
        return False

if __name__ == '__main__':
    print("=== TEST SIMULATION FRONTEND ===")
    print()
    
    print("1. Test sans fichier (devrait donner l'erreur):")
    test_missing_file_scenario()
    print()
    
    print("2. Test avec fichier (devrait fonctionner):")
    test_multipart_like_react_native()
    print()
    
    print("=== FIN DU TEST ===")
