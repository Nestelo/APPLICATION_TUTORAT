import requests
import json
from datetime import datetime

print('=== DÉBOGAGE ERREUR RÉSEAU CRÉATION RESSOURCE ===')

# Données exactes envoyées par le frontend selon les logs
data_frontend = {
    "description": "La télécommunications moderne ",
    "groupeId": 3,
    "hasFile": True,
    "matiere": "Telecom ",
    "niveau": "L2",
    "titre": "Recherche scientifique dans la domaine de réseau ",
    "type": "cours"
}

print(f'Données frontend: {json.dumps(data_frontend, indent=2, ensure_ascii=False)}')

# Test 1: Vérifier si le groupe 3 existe et le tuteur a accès
print('\n=== TEST 1: Vérification groupe et permissions ===')
try:
    from apps.accounts.models import User
    from apps.tutorat.models import GroupeTutorat
    
    tuteur = User.objects.get(email='djek@gmail.com')
    groupe = GroupeTutorat.objects.get(id=3)
    
    print(f'✅ Tuteur: {tuteur.email} (ID: {tuteur.id})')
    print(f'✅ Groupe: {groupe.nom} (ID: {groupe.id})')
    print(f'✅ Créateur du groupe: {groupe.createur.email} (ID: {groupe.createur.id})')
    print(f'✅ Est le créateur: {tuteur == groupe.createur}')
    print(f'✅ Rôle tuteur: {tuteur.role}')
    
except Exception as e:
    print(f'❌ Erreur vérification: {e}')

# Test 2: Simulation de l'API avec les bonnes données
print('\n=== TEST 2: Simulation API POST ===')
try:
    # Convertir les données pour l'API
    api_data = {
        'titre': data_frontend['titre'],
        'description': data_frontend['description'],
        'type': data_frontend['type'],
        'matiere': data_frontend['matiere'],
        'niveau': data_frontend['niveau'],
        'tags': '',
        'lien_externe': '',
        'groupes_partages': str(data_frontend['groupeId'])
    }
    
    print(f'Données API: {json.dumps(api_data, indent=2, ensure_ascii=False)}')
    
    # Test avec le client Django
    from django.test import Client
    client = Client()
    client.force_login(tuteur)
    
    response = client.post('/api/ressources/groupes/creer-ressource/', 
                         data=api_data, 
                         content_type='application/json')
    
    print(f'Status: {response.status_code}')
    if response.status_code != 201:
        print(f'Erreur: {response.content.decode()}')
    else:
        result = response.json()
        print(f'Succès: {result.get("titre", "N/A")}')
        
except Exception as e:
    print(f'❌ Erreur simulation: {e}')
    import traceback
    traceback.print_exc()

# Test 3: Vérifier les logs du serveur
print('\n=== TEST 3: Vérification configuration ===')
try:
    from django.conf import settings
    print(f'✅ DEBUG: {settings.DEBUG}')
    print(f'✅ ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}')
    print(f'✅ MEDIA_ROOT: {settings.MEDIA_ROOT}')
    print(f'✅ FILE_UPLOAD_MAX_MEMORY_SIZE: {getattr(settings, "FILE_UPLOAD_MAX_MEMORY_SIZE", "Non défini")}')
    print(f'✅ DATA_UPLOAD_MAX_MEMORY_SIZE: {getattr(settings, "DATA_UPLOAD_MAX_MEMORY_SIZE", "Non défini")}')
    
except Exception as e:
    print(f'❌ Erreur configuration: {e}')

print(f'\n=== HEURE ACTUELLE: {datetime.now()} ===')
