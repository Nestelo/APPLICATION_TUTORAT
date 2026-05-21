#!/usr/bin/env python3
"""
Script pour tester la correction de l'erreur 'dict object has no attribute getlist'
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

def test_create_ressource_avec_fichier():
    """Tester la création de ressource avec fichier (FormData)"""
    token = test_auth()
    
    if not token:
        print("Impossible d'obtenir le token")
        return
    
    url = 'http://192.168.43.210:8000/api/ressources/groupes/creer-ressource/'
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    # Données FormData
    data = {
        'titre': 'Test ressource avec fichier',
        'description': 'Test description après correction getlist',
        'type': 'cours',
        'matiere': 'Math',
        'niveau': 'L2',
        'tags': 'test,correction,getlist',
        'lien_externe': '',
        'groupes_partages': '6'
    }
    
    # Fichier de test
    files = {
        'fichier': ('test_correction.txt', 'Contenu du fichier après correction getlist', 'text/plain')
    }
    
    try:
        response = requests.post(url, data=data, files=files, headers=headers)
        print(f"Status avec fichier: {response.status_code}")
        print(f"Response avec fichier: {response.text}")
        
        if response.status_code == 201:
            print("✅ SUCCÈS: Création avec fichier fonctionne !")
            return True
        else:
            print(f"❌ ERREUR: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"Exception avec fichier: {e}")
        return False

def test_create_ressource_sans_fichier():
    """Tester la création de ressource sans fichier (FormData)"""
    token = test_auth()
    
    if not token:
        print("Impossible d'obtenir le token")
        return
    
    url = 'http://192.168.43.210:8000/api/ressources/groupes/creer-ressource/'
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    # Données FormData pour un lien
    data = {
        'titre': 'Test ressource lien',
        'description': 'Test description lien après correction getlist',
        'type': 'lien',
        'matiere': 'Informatique',
        'niveau': 'L2',
        'tags': 'test,lien,correction',
        'lien_externe': 'https://example.com',
        'groupes_partages': '6'
    }
    
    try:
        response = requests.post(url, data=data, headers=headers)
        print(f"Status sans fichier: {response.status_code}")
        print(f"Response sans fichier: {response.text}")
        
        if response.status_code == 201:
            print("✅ SUCCÈS: Création sans fichier fonctionne !")
            return True
        else:
            print(f"❌ ERREUR: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"Exception sans fichier: {e}")
        return False

if __name__ == '__main__':
    print("=== TEST DE LA CORRECTION GETLIST ===")
    print()
    
    print("1. Test création ressource AVEC fichier:")
    test_create_ressource_avec_fichier()
    print()
    
    print("2. Test création ressource SANS fichier (lien):")
    test_create_ressource_sans_fichier()
    print()
    
    print("=== FIN DU TEST ===")
