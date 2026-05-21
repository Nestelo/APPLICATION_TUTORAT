from django.test import Client
from django.contrib.auth import get_user_model
from apps.accounts.models import User
from apps.tutorat.models import GroupeTutorat, Ressource as GroupeRessource
import json

print('=== TEST AVEC AUTHENTIFICATION RÉELLE ===')

# Créer un client de test
client = Client()

# Récupérer le tuteur et le groupe
try:
    tuteur = User.objects.get(email='djek@gmail.com')
    groupe = GroupeTutorat.objects.get(id=6)
    print(f'✅ Tuteur: {tuteur.email} (ID: {tuteur.id})')
    print(f'✅ Groupe: {groupe.nom} (ID: {groupe.id})')
except Exception as e:
    print(f'❌ Erreur récupération: {e}')
    exit()

# Simuler la connexion (forcer l'utilisateur)
client.force_login(tuteur)

# Test 1: API ressources_groupe
print('\n=== TEST 1: GET ressources_groupe ===')
try:
    response = client.get(f'/api/ressources/groupes/{groupe.id}/ressources/')
    print(f'✅ Status: {response.status_code}')
    if response.status_code == 200:
        data = response.json()
        print(f'✅ Nombre de ressources: {len(data)}')
        if data:
            print(f'✅ Première ressource: {data[0].get("titre", "N/A")}')
    else:
        print(f'❌ Erreur: {response.content.decode()}')
except Exception as e:
    print(f'❌ Erreur API: {e}')

# Test 2: API création ressource
print('\n=== TEST 2: POST creer_ressource_groupe ===')
try:
    data = {
        'titre': 'Test API Final',
        'description': 'Ressource créée via API test',
        'type': 'cours',
        'matiere': 'Informatique',
        'niveau': 'L2',
        'tags': 'test,api',
        'lien_externe': '',
        'groupes_partages': str(groupe.id)
    }
    
    response = client.post('/api/ressources/groupes/creer-ressource/', 
                         data=data, 
                         content_type='application/json')
    print(f'✅ Status création: {response.status_code}')
    if response.status_code == 201:
        result = response.json()
        print(f'✅ Ressource créée: {result.get("titre", "N/A")}')
    else:
        print(f'❌ Erreur création: {response.content.decode()}')
except Exception as e:
    print(f'❌ Erreur création: {e}')

# Vérifier les ressources après création
print('\n=== VÉRIFICATION FINALE ===')
ressources = GroupeRessource.objects.filter(groupes_partages=groupe)
print(f'📊 Total ressources du groupe: {ressources.count()}')

for r in ressources.order_by('-date_creation')[:3]:
    print(f'  - {r.titre} (Créée: {r.date_creation.strftime("%H:%M:%S")})')
