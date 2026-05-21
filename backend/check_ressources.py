from apps.tutorat.models import Ressource as GroupeRessource
from apps.accounts.models import User

print('=== ÉTAT ACTUEL DES RESSOURCES DE GROUPE ===')
for r in GroupeRessource.objects.all().order_by('-date_creation'):
    print(f'- {r.titre} (ID: {r.id})')
    print(f'  Créateur: {r.createur.email if r.createur else "None"}')
    print(f'  Validée: {r.validee_par_admin}')
    print(f'  Date création: {r.date_creation}')
    print()
