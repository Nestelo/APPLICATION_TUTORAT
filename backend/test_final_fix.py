#!/usr/bin/env python3
"""
Script de test final pour valider les corrections
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

def test_pdf_upload():
    """Test upload PDF avec le format corrigé"""
    token = test_auth()
    
    if not token:
        print("Impossible d'obtenir le token")
        return False
    
    url = 'http://192.168.43.210:8000/api/ressources/groupes/creer-ressource/'
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    # Simuler le format exact que React Native envoie maintenant
    from requests_toolbelt.multipart.encoder import MultipartEncoder
    
    data = MultipartEncoder(
        fields={
            'titre': 'Test PDF Corrigé',
            'description': 'Test avec format PDF corrigé',
            'type': 'cours',
            'matiere': 'Test',
            'niveau': 'L2',
            'tags': 'test,pdf,corrigé',
            'lien_externe': '',
            'groupes_partages': '3',
            'fichier': ('test_final.pdf', b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test Final) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000054 00000 n\n0000000119 00000 n\n0000000209 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n299\n%%EOF', 'application/pdf')
        }
    )
    
    headers['Content-Type'] = data.content_type
    
    try:
        response = requests.post(url, data=data, headers=headers)
        print(f"TEST PDF - Status: {response.status_code}")
        if response.status_code == 201:
            print("✅ SUCCESS: Upload PDF fonctionnel !")
            return True
        else:
            print(f"❌ ERROR: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_video_upload():
    """Test upload vidéo"""
    token = test_auth()
    
    if not token:
        print("Impossible d'obtenir le token pour vidéo")
        return False
    
    url = 'http://192.168.43.210:8000/api/ressources/groupes/creer-ressource/'
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    # Simuler upload vidéo
    from requests_toolbelt.multipart.encoder import MultipartEncoder
    
    data = MultipartEncoder(
        fields={
            'titre': 'Test Vidéo Corrigée',
            'description': 'Test avec format vidéo corrigé',
            'type': 'video',
            'matiere': 'Test',
            'niveau': 'L2',
            'tags': 'test,vidéo,corrigé',
            'lien_externe': '',
            'groupes_partages': '3',
            'fichier': ('test_final.mp4', b'FAKE_VIDEO_CONTENT_FOR_TESTING_FINAL', 'video/mp4')
        }
    )
    
    headers['Content-Type'] = data.content_type
    
    try:
        response = requests.post(url, data=data, headers=headers)
        print(f"TEST VIDÉO - Status: {response.status_code}")
        if response.status_code == 201:
            print("✅ SUCCESS: Upload vidéo fonctionnel !")
            return True
        else:
            print(f"❌ ERROR: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

if __name__ == '__main__':
    print("=== TEST FINAL DES CORRECTIONS ===")
    print()
    
    print("1. Test upload PDF (type 'cours'):")
    pdf_result = test_pdf_upload()
    print()
    
    print("2. Test upload Vidéo (type 'video'):")
    video_result = test_video_upload()
    print()
    
    if pdf_result and video_result:
        print("🎉 TOUS LES TESTS RÉUSSIS !")
        print("✅ Corrections validées avec succès")
    else:
        print("❌ Certains tests ont échoué")
        print("🔧 Vérifier les corrections")
    
    print()
    print("=== FIN DU TEST FINAL ===")
