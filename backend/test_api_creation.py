from django.test import RequestFactory
from apps.ressources.views import creer_ressource_groupe
from apps.accounts.models import User
from apps.tutorat.models import GroupeTutorat
import json

print('=== TEST API CRÉATION RESSOURCE ===')

# Créer une requête factice
factory = RequestFactory()

# Récupérer le tuteur et le groupe
tuteur = User.objects.get(email='djek@gmail.com')
groupe = GroupeTutorat.objects.get(id=6)

# Données de test
data = {
    'titre': 'Test API - Ressource de Groupe',
    'description': 'Ceci est une ressource créée via API pour test',
    'type': 'cours',
    'matiere': 'Informatique',
    'niveau': 'L2',
    'tags': 'test,api,creation',
    'lien_externe': '',
    'groupes_partages': str(groupe.id)
}

# Créer la requête POST
request = factory.post('/api/ressources/groupes/creer-ressource/', data)
request.user = tuteur

print(f'Tuteur: {tuteur.email}')
print(f'Groupe: {groupe.nom} (ID: {groupe.id})')
print(f'Données envoyées: {data}')

try:
    response = creer_ressource_groupe(request)
    print(f'Status: {response.status_code}')
    print(f'Données réponse: {response.data}')
except Exception as e:
    print(f'Erreur: {e}')
    import traceback
    traceback.print_exc()
