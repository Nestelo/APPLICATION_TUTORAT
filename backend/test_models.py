from apps.ressources.models import Ressource as GlobalRessource
from apps.tutorat.models import Ressource as GroupeRessource

print(f'Global: {GlobalRessource.objects.count()}, Groupe: {GroupeRessource.objects.count()}')

# Test des champs
global_ressource = GlobalRessource.objects.first()
if global_ressource:
    print(f'Global ressource fields: {dir(global_ressource)}')

groupe_ressource = GroupeRessource.objects.first()
if groupe_ressource:
    print(f'Groupe ressource fields: {dir(groupe_ressource)}')
