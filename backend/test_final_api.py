from django.test import RequestFactory
from apps.ressources.views import ressources_groupe
from apps.accounts.models import User
from apps.tutorat.models import GroupeTutorat, Ressource as GroupeRessource

print('=== TEST FINAL API RESSOURCES GROUPE ===')

# Récupérer le tuteur et le groupe
try:
    tuteur = User.objects.get(email='djek@gmail.com')
    groupe = GroupeTutorat.objects.get(id=6)
    print(f'✅ Tuteur: {tuteur.email} (ID: {tuteur.id})')
    print(f'✅ Groupe: {groupe.nom} (ID: {groupe.id})')
except Exception as e:
    print(f'❌ Erreur récupération: {e}')
    exit()

# Vérifier les ressources existantes
ressources = GroupeRessource.objects.filter(groupes_partages=groupe)
print(f'📊 Ressources du groupe {groupe.id}: {ressources.count()}')

# Test API ressources_groupe
print('\n=== TEST API ressources_groupe ===')
factory = RequestFactory()
request = factory.get(f'/api/ressources/groupes/{groupe.id}/ressources/')
request.user = tuteur

try:
    response = ressources_groupe(request, groupe.id)
    print(f'✅ Status: {response.status_code}')
    if hasattr(response, 'data'):
        print(f'✅ Nombre de ressources retournées: {len(response.data)}')
        if response.data:
            print(f'✅ Première ressource: {response.data[0].get("titre", "N/A")}')
    else:
        print(f'⚠️ Response type: {type(response)}')
except Exception as e:
    print(f'❌ Erreur API: {e}')
    import traceback
    traceback.print_exc()

# Test avec le serializer directement
print('\n=== TEST SERIALIZER ===')
from apps.ressources.serializers import GroupeRessourceSerializer

try:
    if ressources.exists():
        ressource = ressources.first()
        # Créer un request mock avec un host valide
        from django.test import Client
        client = Client()
        request = client.get('/').wsgi_request
        request.user = tuteur
        
        serializer = GroupeRessourceSerializer(ressource, context={'request': request})
        print(f'✅ Serializer OK - Champs: {list(serializer.data.keys())}')
        print(f'✅ Fichier URL: {serializer.data.get("fichier_url", "N/A")}')
    else:
        print('⚠️ Aucune ressource à sérialiser')
except Exception as e:
    print(f'❌ Erreur serializer: {e}')
    import traceback
    traceback.print_exc()
