from django.test import RequestFactory
from apps.ressources.views import ressources_groupe, creer_ressource_groupe
from apps.accounts.models import User
from apps.tutorat.models import GroupeTutorat, Ressource as GroupeRessource
import json

print('=== DÉBOGAGE RESSOURCES GROUPE ===')

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

for r in ressources:
    print(f'  - ID: {r.id}, Titre: {r.titre}, Validée: {r.validee_par_admin}')

# Test 1: API ressources_groupe
print('\n=== TEST 1: API ressources_groupe ===')
factory = RequestFactory()
request = factory.get(f'/api/ressources/groupes/{groupe.id}/ressources/')
request.user = tuteur

try:
    response = ressources_groupe(request, groupe.id)
    print(f'✅ Status: {response.status_code}')
    if hasattr(response, 'data'):
        print(f'✅ Données: {len(response.data)} ressources')
    else:
        print(f'⚠️ Response type: {type(response)}')
except Exception as e:
    print(f'❌ Erreur API ressources_groupe: {e}')
    import traceback
    traceback.print_exc()

# Test 2: Vérifier le serializer
print('\n=== TEST 2: Serializer ===')
from apps.ressources.serializers import GroupeRessourceSerializer

try:
    if ressources.exists():
        ressource = ressources.first()
        serializer = GroupeRessourceSerializer(ressource, context={'request': request})
        print(f'✅ Serializer OK - Champs: {list(serializer.data.keys())}')
    else:
        print('⚠️ Aucune ressource à sérialiser')
except Exception as e:
    print(f'❌ Erreur serializer: {e}')
    import traceback
    traceback.print_exc()

# Test 3: Vérifier les permissions
print('\n=== TEST 3: Permissions ===')
is_tutor = tuteur.role == 'tuteur' and tuteur == groupe.createur
is_admin = tuteur.role == 'admin'
is_member = groupe.membres.filter(id=tuteur.id).exists()

print(f'  - Tuteur: {is_tutor}')
print(f'  - Admin: {is_admin}')
print(f'  - Membre: {is_member}')
print(f'  - Accès autorisé: {is_tutor or is_admin or is_member}')
