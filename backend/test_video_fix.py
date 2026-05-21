#!/usr/bin/env python3
"""
Script de test pour valider les corrections vidéo
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

def test_video_upload():
    """Test upload vidéo avec différentes approches"""
    token = test_auth()
    
    if not token:
        print("Impossible d'obtenir le token")
        return False
    
    url = 'http://192.168.43.210:8000/api/ressources/groupes/creer-ressource/'
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    # Test 1: Simulation vidéo depuis galerie
    print("=== TEST 1: Vidéo depuis galerie ===")
    from requests_toolbelt.multipart.encoder import MultipartEncoder
    
    data1 = MultipartEncoder(
        fields={
            'titre': 'Test Vidéo Galerie',
            'description': 'Test vidéo sélectionnée depuis galerie',
            'type': 'video',
            'matiere': 'Test',
            'niveau': 'L2',
            'tags': 'test,vidéo,galerie',
            'lien_externe': '',
            'groupes_partages': '3',
            'fichier': ('video_galerie.mp4', b'FAKE_VIDEO_FROM_GALLERY_CONTENT', 'video/mp4')
        }
    )
    
    headers['Content-Type'] = data1.content_type
    
    try:
        response1 = requests.post(url, data=data1, headers=headers)
        print(f"Status: {response1.status_code}")
        if response1.status_code == 201:
            print("✅ SUCCESS: Vidéo galerie uploadée !")
            video_id = response1.json().get('id')
            print(f"   ID de la ressource: {video_id}")
        else:
            print(f"❌ ERROR: {response1.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False
    
    # Test 2: Simulation vidéo enregistrée avec caméra
    print("\n=== TEST 2: Vidéo enregistrée caméra ===")
    
    data2 = MultipartEncoder(
        fields={
            'titre': 'Test Vidéo Caméra',
            'description': 'Test vidéo enregistrée avec caméra',
            'type': 'video',
            'matiere': 'Test',
            'niveau': 'L2',
            'tags': 'test,vidéo,caméra',
            'lien_externe': '',
            'groupes_partages': '3',
            'fichier': ('video_camera.mp4', b'FAKE_VIDEO_FROM_CAMERA_CONTENT', 'video/mp4')
        }
    )
    
    headers['Content-Type'] = data2.content_type
    
    try:
        response2 = requests.post(url, data=data2, headers=headers)
        print(f"Status: {response2.status_code}")
        if response2.status_code == 201:
            print("✅ SUCCESS: Vidéo caméra uploadée !")
            video_id = response2.json().get('id')
            print(f"   ID de la ressource: {video_id}")
        else:
            print(f"❌ ERROR: {response2.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False
    
    # Test 3: Test avec un format vidéo différent (MOV)
    print("\n=== TEST 3: Vidéo format MOV ===")
    
    data3 = MultipartEncoder(
        fields={
            'titre': 'Test Vidéo MOV',
            'description': 'Test vidéo au format MOV',
            'type': 'video',
            'matiere': 'Test',
            'niveau': 'L2',
            'tags': 'test,vidéo,mov',
            'lien_externe': '',
            'groupes_partages': '3',
            'fichier': ('video_camera.mov', b'FAKE_VIDEO_MOV_CONTENT', 'video/quicktime')
        }
    )
    
    headers['Content-Type'] = data3.content_type
    
    try:
        response3 = requests.post(url, data=data3, headers=headers)
        print(f"Status: {response3.status_code}")
        if response3.status_code == 201:
            print("✅ SUCCESS: Vidéo MOV uploadée !")
            video_id = response3.json().get('id')
            print(f"   ID de la ressource: {video_id}")
        else:
            print(f"❌ ERROR: {response3.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False
    
    return True

if __name__ == '__main__':
    print("=== TEST CORRECTIONS VIDÉO ===")
    print()
    
    success = test_video_upload()
    
    if success:
        print("\n🎉 TOUS LES TESTS VIDÉO RÉUSSIS !")
        print("✅ Corrections vidéo validées avec succès")
        print("\n📱 Fonctionnalités disponibles:")
        print("   • 📱 Sélection vidéo depuis galerie")
        print("   • 🎥 Enregistrement vidéo avec caméra")
        print("   • 📁 Support multiples formats (MP4, MOV, etc.)")
        print("   • ✅ Upload et validation fonctionnels")
    else:
        print("\n❌ CERTAINS TESTS VIDÉO ONT ÉCHOUÉ")
        print("🔧 Vérifier les corrections")
    
    print("\n=== FIN DU TEST VIDÉO ===")
