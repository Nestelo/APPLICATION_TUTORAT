import requests
import json

# Test simple de l'API
API_URL = "http://192.168.43.210:8000/api/forum/questions/"

try:
    print("Test de connexion à l'API...")
    response = requests.get(API_URL)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Nombre de questions: {len(data.get('results', data))}")
        print("✅ API accessible")
    else:
        print(f"❌ Erreur: {response.text}")
except Exception as e:
    print(f"❌ Exception: {e}")
