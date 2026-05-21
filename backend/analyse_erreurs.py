from apps.tutorat.models import Ressource as GroupeRessource, GroupeTutorat

print('=== ANALYSE DES ERREURS ===')

# Vérifier les ressources existantes
ressources = GroupeRessource.objects.all()
print(f'Total ressources de groupe: {ressources.count()}')

for r in ressources:
    print(f'- ID: {r.id}, Titre: {r.titre}, Validée: {r.validee_par_admin}')

# Vérifier les groupes
groupes = GroupeTutorat.objects.all()
print(f'\nTotal groupes: {groupes.count()}')

for g in groupes:
    print(f'- ID: {g.id}, Nom: {g.nom}, Créateur: {g.createur.email if g.createur else "None"}')
