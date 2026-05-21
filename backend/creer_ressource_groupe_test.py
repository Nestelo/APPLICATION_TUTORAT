#!/usr/bin/env python
import os
import django

# Configurer Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.tutorat.models import Ressource, GroupeTutorat
from apps.accounts.models import User

def creer_ressource_groupe_test():
    print('=== CRÉATION RESSOURCE DE GROUPE TEST ===')
    
    try:
        # Récupérer le tuteur Motar
        motar = User.objects.get(email='motar@gmail.com')
        print(f'Tuteur trouvé: {motar.email} ({motar.nom} {motar.prenom})')
        
        # Récupérer le groupe 3 (Recherche scientifique)
        groupe = GroupeTutorat.objects.get(id=3)
        print(f'Groupe trouvé: {groupe.nom} (ID: {groupe.id})')
        
        # Vérifier si la ressource existe déjà
        existing = Ressource.objects.filter(titre="Test Ressource Groupe", createur=motar).first()
        if existing:
            print('Ressource de test déjà existante')
            return existing
        
        # Créer la ressource de groupe
        ressource = Ressource.objects.create(
            titre="Test Ressource Groupe",
            description="Ceci est une ressource de test pour le groupe Recherche scientifique",
            createur=motar,
            type="cours",
            validee_par_admin=True,  # Validée pour le test
            fichier=None,  # Pas de fichier pour le test
            lien_externe="https://example.com/resource"
        )
        
        # Associer au groupe
        ressource.groupes_partages.add(groupe)
        
        print(f' Ressource créée: {ressource.titre}')
        print(f' ID: {ressource.id}')
        print(f' Auteur: {ressource.createur.email}')
        print(f' Groupes: {[g.nom for g in ressource.groupes_partages.all()]}')
        print(f' Validée: {ressource.validee_par_admin}')
        
        return ressource
        
    except Exception as e:
        print(f'Erreur: {e}')
        import traceback
        traceback.print_exc()
        return None

if __name__ == '__main__':
    creer_ressource_groupe_test()
