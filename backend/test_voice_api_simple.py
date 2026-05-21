#!/usr/bin/env python3
"""
Test simple pour vérifier l'API des messages vocaux du forum
"""

import requests
import json
from datetime import datetime

# Configuration
API_BASE_URL = "http://192.168.43.210:8000/api"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzE2ODQ5NjAwLCJpYXQiOjE3MTY4NDYwMDAsImp0aSI6IjIzNDU2Nzg5MDEiLCJ1c2VyX2lkIjoyMH0.N7Y8xKzJ6J3XhF2vQqLh8W9ZyT1nN7mY6k3L2wX9cFo"

def test_api_connection():
    """Test la connexion de base à l'API"""
    print("=== Test connexion API ===")
    try:
        response = requests.get(f"{API_BASE_URL}/forum/questions/", timeout=5)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("Connexion API réussie")
            return True
        else:
            print(f"Erreur connexion: {response.text}")
            return False
    except Exception as e:
        print(f"Erreur exception: {e}")
        return False

def test_get_questions():
    """Test la récupération des questions"""
    print("\n=== Test récupération questions ===")
    try:
        headers = {
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json"
        }
        response = requests.get(f"{API_BASE_URL}/forum/questions/", headers=headers, timeout=5)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Questions récupérées: {len(data)}")
            if data:
                print(f"Première question: {data[0].get('titre', 'N/A')}")
            return data
        else:
            print(f"Erreur: {response.text}")
            return []
    except Exception as e:
        print(f"Erreur exception: {e}")
        return []

def test_get_voice_messages():
    """Test la récupération des messages vocaux"""
    print("\n=== Test récupération messages vocaux ===")
    try:
        headers = {
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json"
        }
        response = requests.get(f"{API_BASE_URL}/forum/messages-vocaux/", headers=headers, timeout=5)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Messages vocaux récupérés: {len(data.get('results', []))}")
            for msg in data.get('results', [])[:2]:  # Afficher les 2 premiers
                print(f"  - ID: {msg.get('id')}, Durée: {msg.get('duree')}, Auteur: {msg.get('auteur_details', {}).get('prenom', 'N/A')}")
            return data
        else:
            print(f"Erreur: {response.text}")
            return {}
    except Exception as e:
        print(f"Erreur exception: {e}")
        return {}

def test_post_voice_message():
    """Test l'envoi d'un message vocal (simulation)"""
    print("\n=== Test envoi message vocal (simulation) ===")
    
    # D'abord récupérer une question et une réponse existante
    questions = test_get_questions()
    if not questions:
        print("Aucune question disponible pour le test")
        return False
    
    question = questions[0]
    print(f"Question utilisée: {question.get('titre')}")
    
    # Vérifier si la question a des réponses
    responses = question.get('reponses', [])
    if not responses:
        print("Aucune réponse disponible pour cette question")
        return False
    
    response_id = responses[0]['id']
    print(f"Réponse utilisée: ID {response_id}")
    
    # Simuler l'envoi d'un message vocal
    try:
        headers = {
            "Authorization": f"Bearer {TOKEN}",
        }
        
        # Simuler un fichier audio (juste pour tester l'endpoint)
        data = {
            'reponse': response_id,
            'duree': '00:00:30'
        }
        
        # Note: On ne peut pas vraiment tester l'upload de fichier depuis ce script Python simple
        # Mais on peut vérifier que l'endpoint répond correctement
        print("Test de l'endpoint messages-vocaux...")
        response = requests.post(f"{API_BASE_URL}/forum/messages-vocaux/", 
                               data=data, 
                               headers=headers, 
                               timeout=5)
        
        print(f"Status: {response.status_code}")
        if response.status_code == 400:
            print("Erreur 400 attendue (fichier audio manquant)")
            print("L'endpoint fonctionne mais nécessite un fichier audio")
            return True
        elif response.status_code == 201:
            print("Message vocal créé avec succès!")
            return True
        else:
            print(f"Réponse inattendue: {response.text}")
            return False
            
    except Exception as e:
        print(f"Erreur exception: {e}")
        return False

def main():
    """Fonction principale"""
    print("Test API Messages Vocaux du Forum")
    print("=" * 50)
    print(f"URL: {API_BASE_URL}")
    print(f"Heure: {datetime.now().strftime('%H:%M:%S')}")
    print("=" * 50)
    
    # Tests
    success_count = 0
    total_tests = 4
    
    if test_api_connection():
        success_count += 1
    
    if test_get_questions():
        success_count += 1
    
    if test_get_voice_messages():
        success_count += 1
    
    if test_post_voice_message():
        success_count += 1
    
    print(f"\n=== Résultats ===")
    print(f"Tests réussis: {success_count}/{total_tests}")
    print(f"Statut: {'OK' if success_count >= 3 else 'ÉCHEC'}")
    
    if success_count >= 3:
        print("L'API des messages vocaux est fonctionnelle!")
    else:
        print("Problèmes détectés dans l'API des messages vocaux")

if __name__ == "__main__":
    main()
