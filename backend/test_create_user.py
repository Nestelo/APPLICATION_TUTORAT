import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

# Test de création d'utilisateur
url = 'http://127.0.0.1:8000/api/auth/register/'
data = {
    'email': 'test2@example.com',
    'nom': 'Test',
    'prenom': 'User2',
    'role': 'etudiant',
    'password': 'TestPassword123!',
    'password2': 'TestPassword123!'
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Erreur: {e}")