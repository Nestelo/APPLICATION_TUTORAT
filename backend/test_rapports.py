import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

# Test des rapports
base_url = 'http://127.0.0.1:8000/api/auth/rapports/'

print("Test des rapports...")

types = ['utilisateurs', 'tutorat', 'ressources', 'forum']

for rapport_type in types:
    url = f'{base_url}{rapport_type}/?period=mois'
    print(f"\nTest {rapport_type}: {url}")

    try:
        response = requests.get(url)
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Endpoint existe (nécessite auth)")
        elif response.status_code == 200:
            print("✅ Endpoint fonctionnel")
            data = response.json()
            print(f"Clés reçues: {list(data.keys())[:5]}...")  # Premières clés
        else:
            print(f"❌ Erreur: {response.text[:100]}")
    except Exception as e:
        print(f"Erreur de connexion: {e}")

# Test export
print("\nTest export...")
export_url = f'{base_url}export/utilisateurs/?period=mois'
try:
    response = requests.get(export_url)
    print(f"Export - Status: {response.status_code}")
    if response.status_code == 401:
        print("✅ Endpoint export existe (nécessite auth)")
    else:
        print(f"❌ Erreur export: {response.text[:100]}")
except Exception as e:
    print(f"Erreur export: {e}")