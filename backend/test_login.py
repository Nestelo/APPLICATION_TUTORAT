import requests

url = "http://192.168.43.210:8000/api/auth/login/"
data = {
    "email": "ndoubadabonheur@gmail.com",
    "password": "bonheur6840"
}

try:
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Erreur: {e}")