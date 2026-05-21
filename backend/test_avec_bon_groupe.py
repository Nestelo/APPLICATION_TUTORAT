from django.test import Client
from apps.accounts.models import User
from apps.tutorat.models import GroupeTutorat
import json

print('=== TEST AVEC LE BON GROUPE ===')

# Récupérer le tuteur et son groupe
tuteur = User.objects.get(email='djek@gmail.com')
groupe = GroupeTutorat.objects.get(id=6)  # Groupe où il est créateur

print(f'✅ Tuteur: {tuteur.email} (ID: {tuteur.id})')
print(f'✅ Groupe: {groupe.nom} (ID: {groupe.id})')
print(f'✅ Est créateur: {tuteur == groupe.createur}')

# Créer un client et forcer la connexion
client = Client()
client.force_login(tuteur)

# Test 1: Créer ressource sans fichier
print('\n=== TEST 1: Création ressource SANS fichier ===')
data = {
    'titre': 'Test API Sans Fichier',
    'description': 'Ressource créée via API sans fichier',
    'type': 'cours',
    'matiere': 'Informatique',
    'niveau': 'L2',
    'tags': 'test,api,sans_fichier',
    'lien_externe': 'https://example.com/ressource',
    'groupes_partages': str(groupe.id)
}

response = client.post('/api/ressources/groupes/creer-ressource/', 
                     data=data, 
                     content_type='application/json')
print(f'Status: {response.status_code}')
if response.status_code == 201:
    result = response.json()
    print(f'✅ Ressource créée: {result.get("titre", "N/A")}')
else:
    print(f'❌ Erreur: {response.content.decode()}')

# Test 2: Créer ressource avec type 'lien'
print('\n=== TEST 2: Création ressource TYPE LIEN ===')
data_lien = {
    'titre': 'Test API Lien Externe',
    'description': 'Ressource avec lien externe',
    'type': 'lien',
    'matiere': 'Réseaux',
    'niveau': 'L3',
    'tags': 'test,lien,reseaux',
    'lien_externe': 'https://github.com/example/tutorial',
    'groupes_partages': str(groupe.id)
}

response = client.post('/api/ressources/groupes/creer-ressource/', 
                     data=data_lien, 
                     content_type='application/json')
print(f'Status: {response.status_code}')
if response.status_code == 201:
    result = response.json()
    print(f'✅ Ressource lien créée: {result.get("titre", "N/A")}')
else:
    print(f'❌ Erreur: {response.content.decode()}')

# Vérifier les ressources créées
print('\n=== VÉRIFICATION FINALE ===')
from apps.tutorat.models import Ressource as GroupeRessource
ressources = GroupeRessource.objects.filter(groupes_partages=groupe)
print(f'Total ressources du groupe {groupe.id}: {ressources.count()}')

for r in ressources.order_by('-date_creation')[:5]:
    print(f'  - {r.titre} (Type: {r.type}, Validée: {r.validee_par_admin})')
