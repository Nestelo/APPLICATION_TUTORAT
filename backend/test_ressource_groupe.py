#!/usr/bin/env python
import os
import django

# Configurer Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.tutorat.models import Ressource, GroupeTutorat
from apps.accounts.models import User

def test_ressource_groupe():
    print('=== CRÉATION RESSOURCE DE GROUPE TEST ===')
    
    try:
        # Récupérer le tuteur
        tuteur = User.objects.get(email='motar@gmail.com')
        print(f'Tuteur trouvé: {tuteur.email}')
        
        # Récupérer ou créer un groupe
        groupe = GroupeTutorat.objects.first()
        if not groupe:
            print('Aucun groupe trouvé, création d\'un groupe de test')
            groupe = GroupeTutorat.objects.create(
                nom='Groupe Test Ressources',
                description='Test pour ressources de groupe',
                createur=tuteur,
                capacite_max=10
            )
            print(f'Groupe créé: {groupe.nom} (ID: {groupe.id})')
        else:
            print(f'Groupe trouvé: {groupe.nom} (ID: {groupe.id})')
        
        # Créer une ressource pour ce groupe
        ressource = Ressource.objects.create(
            titre='Test Ressource Groupe',
            description='Ceci est une ressource de test pour le groupe',
            createur=tuteur,
            type='cours',
            matiere='Test',
            niveau='L2',
            validee_par_admin=True  # Validée pour être visible
        )
        
        # Ajouter la ressource au groupe
        ressource.groupes_partages.add(groupe)
        
        print(f'\nRessource créée: {ressource.titre}')
        print(f'ID: {ressource.id}')
        print(f'Auteur: {ressource.createur.email}')
        groupes_noms = list(ressource.groupes_partages.all().values_list('nom', flat=True))
        print(f'Groupes: {groupes_noms}')
        print(f'Validée: {ressource.validee_par_admin}')
        
        # Tester l'API
        print(f'\n=== TEST API ===')
        print(f'URL de test: /api/ressources/groupes/{groupe.id}/ressources/')
        
        return ressource, groupe
        
    except Exception as e:
        print(f'Erreur: {e}')
        import traceback
        traceback.print_exc()
        return None, None

if __name__ == '__main__':
    test_ressource_groupe()
