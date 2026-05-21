from apps.tutorat.models import Ressource as GroupeRessource, GroupeTutorat
from apps.accounts.models import User

print('=== TEST DE CRÉATION DE RESSOURCE DE GROUPE ===')

# Récupérer le tuteur djek et le groupe 6
tuteur = User.objects.get(email='djek@gmail.com')
groupe = GroupeTutorat.objects.get(id=6)

# Créer une ressource de test
ressource = GroupeRessource.objects.create(
    titre='Test Final - Ressource de Groupe',
    description='Ceci est une ressource de test finale pour vérifier le workflow complet',
    matiere='Informatique',
    niveau='L2',
    type='cours',
    tags='test,final,workflow',
    createur=tuteur,
    validee_par_admin=False
)

# Associer au groupe
ressource.groupes_partages.add(groupe)

print(f' Ressource créée avec succès !')
print(f' ID: {ressource.id}')
print(f' Titre: {ressource.titre}')
print(f' Créateur: {ressource.createur.email}')
print(f' Groupe: {groupe.nom}')
print(f' Validée: {ressource.validee_par_admin}')
print('')
print('=== L ADMIN PEUT MAINTENANT VALIDER CETTE RESSOURCE ===')
