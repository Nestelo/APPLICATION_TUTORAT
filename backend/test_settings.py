import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

# Test des paramètres système
url = 'http://127.0.0.1:8000/api/auth/settings/'

print("Test des paramètres système...")

try:
    # Test GET
    response = requests.get(url)
    print(f"GET /api/auth/settings/ - Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Endpoint GET fonctionnel")
        print("Données reçues:", response.json())
    else:
        print("❌ Erreur GET:", response.text)

    # Test POST update
    update_data = {
        'email_notifications': True,
        'push_notifications': False,
        'auto_backup': True,
        'maintenance_mode': False,
        'allow_registration': True,
        'require_email_verification': True,
    }
    response = requests.post(f'{url}update/', json=update_data)
    print(f"POST /api/auth/settings/update/ - Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Endpoint POST update fonctionnel")
    else:
        print("❌ Erreur POST update:", response.text)

    # Test system info
    response = requests.get(f'{url}system-info/')
    print(f"GET /api/auth/settings/system-info/ - Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Endpoint system-info fonctionnel")
    else:
        print("❌ Erreur system-info:", response.text)

except Exception as e:
    print(f"Erreur de connexion: {e}")