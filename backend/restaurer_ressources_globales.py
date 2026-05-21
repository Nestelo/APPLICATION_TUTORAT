#!/usr/bin/env python
import os
import sys
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from apps.ressources.models import Ressource
from apps.accounts.models import User

def restaurer_ressources_globales():
    """Restaurer les 7 ressources globales originales par Motar"""
    
    # Trouver l'utilisateur Motar (tuteur)
    try:
        motar = User.objects.get(email='motar@gmail.com')
        print(f"Utilisateur Motar trouvé: {motar}")
    except User.DoesNotExist:
        print("Erreur: Utilisateur Motar non trouvé")
        return
    
    # Supprimer les ressources globales existantes
    print("Suppression des ressources globales existantes...")
    Ressource.objects.all().delete()
    
    # Créer les 7 ressources originales
    ressources_data = [
        {
            'titre': 'Introduction à la Cryptographie',
            'description': 'Cours complet sur les principes fondamentaux de la cryptographie moderne',
            'matiere': 'Cryptographie',
            'niveau': 'L2',
            'type_fichier': 'cours',
            'tags': 'cryptographie, sécurité, algorithmes',
            'statut': 'publie'
        },
        {
            'titre': 'Exercices d\'Analyse Mathématique',
            'description': 'Série d\'exercices corrigés sur l\'analyse mathématique',
            'matiere': 'Analyse',
            'niveau': 'L2',
            'type_fichier': 'exercice',
            'tags': 'analyse, mathématiques, exercices',
            'statut': 'publie'
        },
        {
            'titre': 'Programmation en C',
            'description': 'Guide complet de programmation en langage C',
            'matiere': 'Programmation',
            'niveau': 'L2',
            'type_fichier': 'cours',
            'tags': 'programmation, C, algorithmique',
            'statut': 'publie'
        },
        {
            'titre': 'Optique Géométrique - Cours',
            'description': 'Cours détaillé sur l\'optique géométrique et ses applications',
            'matiere': 'Physique',
            'niveau': 'L2',
            'type_fichier': 'cours',
            'tags': 'optique, physique, géométrique',
            'statut': 'publie'
        },
        {
            'titre': 'Structures de Données',
            'description': 'Introduction aux structures de données en algorithmique',
            'matiere': 'Informatique',
            'niveau': 'L2',
            'type_fichier': 'cours',
            'tags': 'structures, données, algorithmique',
            'statut': 'publie'
        },
        {
            'titre': 'Calcul Différentiel',
            'description': 'Exercices et corrigés de calcul différentiel',
            'matiere': 'Mathématiques',
            'niveau': 'L2',
            'type_fichier': 'corrige',
            'tags': 'calcul, différentiel, mathématiques',
            'statut': 'publie'
        },
        {
            'titre': 'Réseaux Informatiques',
            'description': 'Introduction aux réseaux informatiques et protocoles',
            'matiere': 'Réseaux',
            'niveau': 'L2',
            'type_fichier': 'cours',
            'tags': 'réseaux, informatique, protocoles',
            'statut': 'publie'
        }
    ]
    
    print("Création des 7 ressources globales...")
    
    for i, data in enumerate(ressources_data, 1):
        ressource = Ressource.objects.create(
            auteur=motar,
            **data
        )
        print(f"{i}. {ressource.titre} - créé")
    
    print(f"\nTotal: {Ressource.objects.count()} ressources globales créées")
    print("Ressources globales restaurées avec succès!")

if __name__ == '__main__':
    restaurer_ressources_globales()
