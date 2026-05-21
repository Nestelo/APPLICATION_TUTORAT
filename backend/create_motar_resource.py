#!/usr/bin/env python3
"""
Script pour créer une ressource avec fichier pour Motar
"""

import requests
import json

def test_auth_motar():
    """Obtenir un token pour Motar (tuteur)"""
    url = 'http://192.168.43.210:8000/api/auth/login/'
    
    data = {
        'email': 'motar@gmail.com',
        'password': 'password123'
    }
    
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            return response.json().get('access')
        else:
            print(f"Motar auth error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Motar auth exception: {e}")
        return None

def create_resource_with_file():
    """Créer une ressource avec fichier pour Motar"""
    token = test_auth_motar()
    
    if not token:
        print("Impossible d'obtenir le token Motar")
        return
    
    url = 'http://192.168.43.210:8000/api/ressources/groupes/creer-ressource/'
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    # Données pour la ressource
    data = {
        'titre': 'Guide complet de Recherche Scientifique',
        'description': 'Document complet sur les méthodologies de recherche scientifique avec exemples pratiques',
        'type': 'cours',
        'matiere': 'Recherche Scientifique',
        'niveau': 'L2',
        'tags': 'recherche,methodologie,guide',
        'lien_externe': '',
        'groupes_partages': '3'  # Groupe "Recherche scientifique"
    }
    
    # Fichier PDF de test
    files = {
        'fichier': ('guide_recherche_scientifique.pdf', b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Hello World) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000054 00000 n\n0000000119 00000 n\n0000000209 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n299\n%%EOF', 'application/pdf')
    }
    
    try:
        print("Création de la ressource avec fichier...")
        response = requests.post(url, data=data, files=files, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 201:
            resource_data = response.json()
            print("SUCCESS: Ressource créée avec fichier !")
            print(f"ID: {resource_data.get('id')}")
            print(f"Fichier URL: {resource_data.get('fichier_url')}")
            return True
        else:
            print(f"ERROR: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"Exception: {e}")
        return False

def validate_resource():
    """Valider la ressource créée (en tant qu'admin)"""
    # D'abord créer la ressource
    if not create_resource_with_file():
        print("Impossible de créer la ressource")
        return
    
    # Se connecter en admin pour valider
    url = 'http://192.168.43.210:8000/api/auth/login/'
    
    data = {
        'email': 'ndoubadabonheur@gmail.com',  # Admin
        'password': 'password123'
    }
    
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            admin_token = response.json().get('access')
            
            # Récupérer les ressources en attente
            pending_url = 'http://192.168.43.210:8000/api/ressources/admin/groupes/ressources/en-attente/'
            headers = {'Authorization': f'Bearer {admin_token}'}
            
            pending_response = requests.get(pending_url, headers=headers)
            if pending_response.status_code == 200:
                resources = pending_response.json()
                print(f"Ressources en attente: {len(resources)}")
                
                # Valider la première ressource
                if resources:
                    resource_id = resources[0].get('id')
                    validate_url = f'http://192.168.43.210:8000/api/ressources/admin/groupes/ressources/{resource_id}/valider/'
                    
                    validate_response = requests.post(validate_url, headers=headers)
                    if validate_response.status_code == 200:
                        print("SUCCESS: Ressource validée par l'admin !")
                    else:
                        print(f"ERROR validation: {validate_response.text}")
        else:
            print(f"Admin auth error: {response.status_code}")
            
    except Exception as e:
        print(f"Exception validation: {e}")

if __name__ == '__main__':
    print("=== CRÉATION RESSOURCE MOTAR AVEC FICHIER ===")
    print()
    
    validate_resource()
    print()
    
    print("=== FIN DU TEST ===")
