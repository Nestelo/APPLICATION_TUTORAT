#!/usr/bin/env python3
"""
Script de test pour valider la correction FormData
"""

import requests
import json
from requests_toolbelt.multipart.encoder import MultipartEncoder

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

def test_formdata_upload():
    """Test upload avec format FormData exact comme React Native"""
    token = test_auth()
    
    if not token:
        print("Impossible d'obtenir le token")
        return False
    
    url = 'http://192.168.43.210:8000/api/ressources/groupes/creer-ressource/'
    
    # Simuler exactement le format FormData de React Native
    # Test 1: Fichier image (comme dans les logs)
    print("=== TEST 1: Fichier image (type cours) ===")
    
    # Créer le FormData manuellement comme React Native
    fields = {
        'titre': 'Test Image FormData',
        'description': 'Test avec image depuis DocumentPicker',
        'type': 'cours',
        'matiere': 'Test',
        'niveau': 'L2',
        'tags': 'test,image,formdata',
        'lien_externe': '',
        'groupes_partages': '3'
    }
    
    # Ajouter le fichier exactement comme React Native le ferait
    file_content = b'FAKE_IMAGE_CONTENT_FOR_TESTING_FORMDATA'
    fields['fichier'] = ('IMG_20260131_102239.jpg', file_content, 'image/jpeg')
    
    multipart_data = MultipartEncoder(fields=fields)
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': multipart_data.content_type,
        'Accept': 'application/json'
    }
    
    try:
        response = requests.post(url, data=multipart_data, headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            print("✅ SUCCESS: Upload image FormData fonctionnel !")
            resource_id = response.json().get('id')
            print(f"   ID de la ressource: {resource_id}")
        else:
            print(f"❌ ERROR: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False
    
    # Test 2: Fichier vidéo (type video)
    print("\n=== TEST 2: Fichier vidéo (type video) ===")
    
    fields2 = {
        'titre': 'Test Vidéo FormData',
        'description': 'Test avec vidéo depuis ImagePicker',
        'type': 'video',
        'matiere': 'Test',
        'niveau': 'L2',
        'tags': 'test,vidéo,formdata',
        'lien_externe': '',
        'groupes_partages': '3'
    }
    
    # Ajouter le fichier vidéo
    video_content = b'FAKE_VIDEO_CONTENT_FOR_TESTING_FORMDATA'
    fields2['fichier'] = ('video_test.mp4', video_content, 'video/mp4')
    
    multipart_data2 = MultipartEncoder(fields=fields2)
    
    headers2 = {
        'Authorization': f'Bearer {token}',
        'Content-Type': multipart_data2.content_type,
        'Accept': 'application/json'
    }
    
    try:
        response2 = requests.post(url, data=multipart_data2, headers=headers2)
        print(f"Status: {response2.status_code}")
        if response2.status_code == 201:
            print("✅ SUCCESS: Upload vidéo FormData fonctionnel !")
            resource_id = response2.json().get('id')
            print(f"   ID de la ressource: {resource_id}")
        else:
            print(f"❌ ERROR: {response2.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False
    
    return True

if __name__ == '__main__':
    print("=== TEST CORRECTION FORMDATA ===")
    print()
    
    success = test_formdata_upload()
    
    if success:
        print("\n🎉 TOUS LES TESTS FORMDATA RÉUSSIS !")
        print("✅ Correction FormData validée avec succès")
        print("\n📋 Corrections appliquées:")
        print("   • 📤 Headers Content-Type: multipart/form-data")
        print("   • 📤 Headers Accept: application/json")
        print("   • 📋 Logs détaillés FormData entries")
        print("   • ✅ Support fichiers image et vidéo")
    else:
        print("\n❌ CERTAINS TESTS FORMDATA ONT ÉCHOUÉ")
        print("🔧 Vérifier les corrections FormData")
    
    print("\n=== FIN DU TEST FORMDATA ===")
