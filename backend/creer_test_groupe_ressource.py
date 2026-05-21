from apps.tutorat.models import Ressource as GroupeRessource, GroupeTutorat
from apps.accounts.models import User

# Créer une ressource de groupe de test pour validation
try:
    # Récupérer un tuteur et un groupe
    tuteur = User.objects.get(email='motar@gmail.com')
    groupe = GroupeTutorat.objects.first()
    
    if not groupe:
        print("Aucun groupe trouvé")
        exit()
    
    # Créer une ressource de groupe en attente
    ressource = GroupeRessource.objects.create(
        titre="Test Ressource Groupe pour Validation",
        description="Ceci est une ressource de groupe créée pour tester la validation admin",
        matiere="Test",
        niveau="L2",
        type="cours",
        tags="test,validation,admin",
        createur=tuteur,
        validee_par_admin=False
    )
    
    # Associer au groupe
    ressource.groupes_partages.add(groupe)
    
    print(f"Ressource de groupe créée: {ressource.titre}")
    print(f"ID: {ressource.id}")
    print(f"Groupe: {groupe.nom}")
    
except Exception as e:
    print(f"Erreur: {e}")
