#!/usr/bin/env python3
"""
Script pour tester la correction des types de fichiers
"""

import requests
import json

def test_auth():
    """Obtenir un token pour Motar"""
    url = 'http://192.168.43.210:8000/api/auth/login/'
    
    data = {
        'email': 'motar@gmail.com',
        'password': 'Motar@1234'
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

def test_file_types():
    """Tester différents types de fichiers"""
    token = test_auth()
    
    if not token:
        print("Impossible d'obtenir le token")
        return
    
    url = 'http://192.168.43.210:8000/api/ressources/groupes/creer-ressource/'
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    # Test 1: Type 'cours' avec fichier PDF
    print("=== TEST 1: Type 'cours' avec PDF ===")
    data = {
        'titre': 'Test Cours PDF',
        'description': 'Test cours avec fichier PDF',
        'type': 'cours',
        'matiere': 'Test',
        'niveau': 'L2',
        'tags': 'test,cours,pdf',
        'lien_externe': '',
        'groupes_partages': '3'
    }
    
    # Simuler un fichier PDF
    files = {
        'fichier': ('test_document.pdf', b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000054 00000 n\n0000000119 00000 n\n0000000209 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n299\n%%EOF', 'application/pdf')
    }
    
    try:
        response = requests.post(url, data=data, files=files, headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            print("SUCCESS: Ressource 'cours' avec PDF créée !")
        else:
            print(f"ERROR: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")
    
    print("\n=== TEST 2: Type 'video' avec fichier vidéo ===")
    
    # Test 2: Type 'video' avec fichier vidéo
    data_video = {
        'titre': 'Test Vidéo',
        'description': 'Test vidéo pour le groupe',
        'type': 'video',
        'matiere': 'Test',
        'niveau': 'L2',
        'tags': 'test,video',
        'lien_externe': '',
        'groupes_partages': '3'
    }
    
    # Simuler un fichier vidéo
    files_video = {
        'fichier': ('test_video.mp4', b'FAKE_VIDEO_CONTENT_FOR_TESTING', 'video/mp4')
    }
    
    try:
        response = requests.post(url, data=data_video, files=files_video, headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            print("SUCCESS: Ressource 'video' créée !")
        else:
            print(f"ERROR: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == '__main__':
    print("=== TEST CORRECTION TYPES DE FICHIERS ===")
    print()
    test_file_types()
    print()
    print("=== FIN DU TEST ===")
