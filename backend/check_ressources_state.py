from apps.tutorat.models import Ressource as GroupeRessource
from apps.accounts.models import User

print('=== ÉTAT ACTUEL DES RESSOURCES DE GROUPE ===')
for r in GroupeRessource.objects.all().order_by('-date_creation'):
    print(f'ID: {r.id} - {r.titre}')
    print(f'  Créateur: {r.createur.email if r.createur else "None"}')
    print(f'  Validée: {r.validee_par_admin}')
    print(f'  Groupes: {[g.nom for g in r.groupes_partages.all()]}')
    print()
