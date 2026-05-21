#!/usr/bin/env python3
"""
Script pour déboguer l'upload de fichiers
"""

import requests
import json
from requests_toolbelt.multipart.encoder import MultipartEncoder

def test_file_upload_debug():
    """Tester l'upload de fichier avec différents formats"""
    
    # Authentification
    auth_url = 'http://192.168.43.210:8000/api/auth/login/'
    auth_data = {
        'email': 'motar@gmail.com',
        'password': 'Motar@1234'
    }
    
    try:
        auth_response = requests.post(auth_url, json=auth_data)
        if auth_response.status_code != 200:
            print(f"Erreur auth: {auth_response.status_code} - {auth_response.text}")
            return
        
        token = auth_response.json().get('access')
        print(f"Token obtenu: {token[:20]}...")
        
    except Exception as e:
        print(f"Erreur auth: {e}")
        return
    
    # URL de création de ressource
    url = 'http://192.168.43.210:8000/api/ressources/groupes/creer-ressource/'
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'multipart/form-data'
    }
    
    # Test 1: Format standard avec requests
    print("\n=== TEST 1: Format standard requests ===")
    data1 = {
        'titre': 'Test PDF Standard',
        'description': 'Test avec format standard',
        'type': 'cours',
        'matiere': 'Test',
        'niveau': 'L2',
        'tags': 'test,pdf',
        'lien_externe': '',
        'groupes_partages': '3'
    }
    
    files1 = {
        'fichier': ('test.pdf', b'%PDF-1.4 fake content', 'application/pdf')
    }
    
    try:
        response1 = requests.post(url, data=data1, files=files1, headers=headers)
        print(f"Status: {response1.status_code}")
        print(f"Response: {response1.text}")
    except Exception as e:
        print(f"Erreur test 1: {e}")
    
    # Test 2: Format MultipartEncoder
    print("\n=== TEST 2: Format MultipartEncoder ===")
    data2 = {
        'titre': 'Test PDF Multipart',
        'description': 'Test avec MultipartEncoder',
        'type': 'cours',
        'matiere': 'Test',
        'niveau': 'L2',
        'tags': 'test,pdf',
        'lien_externe': '',
        'groupes_partages': '3'
    }
    
    # Créer le multipart manuellement
    multipart_data = MultipartEncoder(
        fields={
            **data2,
            'fichier': ('test2.pdf', b'%PDF-1.4 fake content 2', 'application/pdf')
        }
    )
    
    headers2 = {
        'Authorization': f'Bearer {token}',
        'Content-Type': multipart_data.content_type
    }
    
    try:
        response2 = requests.post(url, data=multipart_data, headers=headers2)
        print(f"Status: {response2.status_code}")
        print(f"Response: {response2.text}")
    except Exception as e:
        print(f"Erreur test 2: {e}")
    
    # Test 3: Simulation exacte du frontend React Native
    print("\n=== TEST 3: Simulation React Native ===")
    
    # Simuler exactement ce que React Native envoie
    import io
    
    buffer = io.BytesIO()
    buffer.write(b'%PDF-1.4 fake content React Native')
    buffer.seek(0)
    
    data3 = {
        'titre': (None, 'Test React Native'),
        'description': (None, 'Test simulation React Native'),
        'type': (None, 'cours'),
        'matiere': (None, 'Test'),
        'niveau': (None, 'L2'),
        'tags': (None, 'test,react'),
        'lien_externe': (None, ''),
        'groupes_partages': (None, '3'),
        'fichier': ('test_react.pdf', buffer, 'application/pdf')
    }
    
    try:
        response3 = requests.post(url, files=data3, headers={
            'Authorization': f'Bearer {token}'
        })
        print(f"Status: {response3.status_code}")
        print(f"Response: {response3.text}")
    except Exception as e:
        print(f"Erreur test 3: {e}")

if __name__ == '__main__':
    print("=== DÉBOGAGE UPLOAD FICHIER ===")
    test_file_upload_debug()
    print("\n=== FIN DU TEST ===")
