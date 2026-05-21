from apps.accounts.models import User
from apps.tutorat.models import GroupeTutorat

print('=== VÉRIFICATION PERMISSIONS GROUPES ===')

# Récupérer le tuteur connecté
tuteur = User.objects.get(email='djek@gmail.com')
print(f'Tuteur connecté: {tuteur.email} (ID: {tuteur.id})')

# Vérifier les groupes où il est créateur
groupes_crees = GroupeTutorat.objects.filter(createur=tuteur)
print(f'\nGroupes créés par {tuteur.email}:')
for groupe in groupes_crees:
    print(f'  - ID: {groupe.id}, Nom: {groupe.nom}, Membres: {groupe.nombre_membres}')

# Vérifier les détails du groupe 3
print(f'\nDétails du groupe 3:')
try:
    groupe3 = GroupeTutorat.objects.get(id=3)
    print(f'  - Nom: {groupe3.nom}')
    print(f'  - Créateur: {groupe3.createur.email} (ID: {groupe3.createur.id})')
    print(f'  - Est le créateur: {tuteur == groupe3.createur}')
    print(f'  - Rôle du tuteur: {tuteur.role}')
    print(f'  - Rôle du créateur: {groupe3.createur.role}')
    
    # Vérifier s'il est membre
    from apps.tutorat.models import InscriptionGroupe
    is_member = InscriptionGroupe.objects.filter(groupe=groupe3, etudiant=tuteur, statut='accepte').exists()
    print(f'  - Est membre: {is_member}')
    
except Exception as e:
    print(f'  - Erreur: {e}')

# Suggestion: utiliser un groupe où il est créateur
print(f'\n=== SUGGESTION ===')
if groupes_crees.exists():
    groupe_suggeré = groupes_crees.first()
    print(f'Utiliser le groupe {groupe_suggeré.id} "{groupe_suggeré.nom}" où {tuteur.email} est créateur')
else:
    print(f'{tuteur.email} n\'a créé aucun groupe. Créer un groupe d\'abord.')
