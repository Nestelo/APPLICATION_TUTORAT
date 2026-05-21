#!/usr/bin/env python
import os
import sys
import django
import requests
import json

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

def test_question_api():
    """Test direct de l'API pour la question 9"""
    print("=== TEST DIRECT DE L'API QUESTION 9 ===")
    
    base_url = "http://192.168.43.210:8000/api"
    
    try:
        # Test de l'API question
        question_url = f"{base_url}/forum/questions/9/"
        print(f"Test de: {question_url}")
        
        response = requests.get(question_url)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Question: {data.get('titre', 'N/A')}")
            print(f"Nombre de réponses: {len(data.get('reponses', []))}")
            
            print("\n--- DÉTAIL DES RÉPONSES ---")
            for i, reponse in enumerate(data.get('reponses', []), 1):
                print(f"\nRéponse {i}:")
                print(f"  ID: {reponse.get('id')}")
                print(f"  Contenu: '{reponse.get('contenu', 'N/A')}'")
                print(f"  Auteur: {reponse.get('auteur_details', {}).get('prenom', 'N/A')} {reponse.get('auteur_details', {}).get('nom', 'N/A')}")
                print(f"  Rôle: {reponse.get('auteur_details', {}).get('role', 'N/A')}")
                print(f"  Date: {reponse.get('date', 'N/A')}")
        else:
            print(f"ERREUR: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"ERREUR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_question_api()
