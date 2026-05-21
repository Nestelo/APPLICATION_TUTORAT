from apps.tutorat.models import Ressource as GroupeRessource
from apps.accounts.models import User

print('=== VÉRIFICATION DES RESSOURCES DE GROUPE ===')
try:
    # Vérifier les ressources récentes
    ressources_recentes = GroupeRessource.objects.all().order_by('-date_creation')[:5]
    print(f'Total ressources: {GroupeRessource.objects.count()}')
    
    for r in ressources_recentes:
        print(f'ID: {r.id}')
        print(f'Titre: {r.titre}')
        print(f'Créateur: {r.createur.email if r.createur else "None"}')
        print(f'Validée: {r.validee_par_admin}')
        print(f'Date création: {r.date_creation}')
        print(f'Groupes: {[g.nom for g in r.groupes_partages.all()]}')
        print('---')
        
except Exception as e:
    print(f'Erreur: {e}')
    import traceback
    traceback.print_exc()
