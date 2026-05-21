#!/usr/bin/env python
import os
import django

# Configurer Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.ressources.models import Ressource
from apps.accounts.models import User

def creer_ressources_motar():
    print('=== CRÉATION DES 7 RESSOURCES GLOBALES DE MOTAR ===')
    
    try:
        # Récupérer le tuteur Motar
        motar = User.objects.get(email='motar@gmail.com')
        print(f'Tuteur trouvé: {motar.email} ({motar.nom} {motar.prenom})')
        
        # Données des 7 ressources
        ressources_data = [
            {
                'titre': 'Algorithmes de base - Cours complet',
                'description': 'Cours détaillé sur les algorithmes de base avec exemples et exercices pratiques',
                'type_fichier': 'cours',
                'matiere': 'Algorithmique',
                'niveau': 'L2',
                'tags': 'algorithmes, programmation, base',
                'statut': 'publie'
            },
            {
                'titre': 'Exercices corrigés - Structures de données',
                'description': 'Série d\'exercices sur les structures de données avec corrections détaillées',
                'type_fichier': 'exercice',
                'matiere': 'Algorithmique',
                'niveau': 'L2',
                'tags': 'structures, exercices, corrigés',
                'statut': 'publie'
            },
            {
                'titre': 'Introduction à la cryptographie',
                'description': 'Vidéo d\'introduction aux concepts fondamentaux de la cryptographie',
                'type_fichier': 'video',
                'matiere': 'Sécurité',
                'niveau': 'L2',
                'tags': 'cryptographie, sécurité, introduction',
                'statut': 'publie'
            },
            {
                'titre': 'Formulaire mathématique - Analyse',
                'description': 'Formulaire complet de mathématiques pour l\'analyse',
                'type_fichier': 'pdf',
                'matiere': 'Mathématiques',
                'niveau': 'L2',
                'tags': 'mathématiques, analyse, formulaire',
                'statut': 'publie'
            },
            {
                'titre': 'Corrigé - Examen final 2024',
                'description': 'Corrigé détaillé de l\'examen final de 2024',
                'type_fichier': 'corrige',
                'matiere': 'Algorithmique',
                'niveau': 'L2',
                'tags': 'examen, corrigé, 2024',
                'statut': 'publie'
            },
            {
                'titre': 'Ressources utiles - Programmation',
                'description': 'Liens vers des ressources en ligne pour apprendre la programmation',
                'type_fichier': 'lien',
                'matiere': 'Programmation',
                'niveau': 'L1',
                'tags': 'programmation, ressources, liens',
                'statut': 'publie'
            },
            {
                'titre': 'Schémas et diagrammes - UML',
                'description': 'Collection de schémas UML pour la conception orientée objet',
                'type_fichier': 'image',
                'matiere': 'Conception',
                'niveau': 'L2',
                'tags': 'UML, diagrammes, conception',
                'statut': 'publie'
            }
        ]
        
        ressources_crees = []
        
        for i, data in enumerate(ressources_data, 1):
            # Vérifier si la ressource existe déjà
            existing = Ressource.objects.filter(titre=data['titre'], auteur=motar).first()
            if existing:
                print(f'{i}. Ressource déjà existante: {data["titre"]}')
                ressources_crees.append(existing)
                continue
            
            # Créer la ressource
            ressource = Ressource.objects.create(
                auteur=motar,
                **data
            )
            
            print(f'{i}. Ressource créée: {ressource.titre} ({ressource.type_fichier})')
            ressources_crees.append(ressource)
        
        print(f'\n=== RÉCAPITULATIF ===')
        print(f'Total ressources créées: {len(ressources_crees)}')
        print(f'Total ressources globales: {Ressource.objects.count()}')
        print(f'Ressources publiées: {Ressource.objects.filter(statut="publie").count()}')
        print(f'Ressources de Motar: {Ressource.objects.filter(auteur=motar).count()}')
        
        return ressources_crees
        
    except Exception as e:
        print(f'Erreur: {e}')
        import traceback
        traceback.print_exc()
        return []

if __name__ == '__main__':
    creer_ressources_motar()
