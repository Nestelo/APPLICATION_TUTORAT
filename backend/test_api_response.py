#!/usr/bin/env python
"""
Script pour tester l'API response pour une question spécifique
"""
import os
import sys
import django
import json

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.forum.models import Question, Reponse
from apps.forum.serializers import QuestionSerializer, ReponseSerializer

def test_api_response():
    """Tester la réponse de l'API pour une question spécifique"""
    print("=== TEST API RESPONSE ===")
    
    # Trouver la question avec la réponse de Needs Need
    response = Reponse.objects.filter(auteur__prenom="Needs", auteur__nom="Need").first()
    
    if response:
        question = response.question
        print(f"Question ID: {question.id}")
        print(f"Question Titre: {question.titre}")
        
        # Sérialiser la question avec ses réponses
        serializer = QuestionSerializer(question)
        serialized_data = serializer.data
        
        print(f"\n=== DONNÉES SÉRIALISÉES ===")
        print(f"Nombre de réponses: {len(serialized_data['reponses'])}")
        
        # Chercher la réponse spécifique
        for resp_data in serialized_data['reponses']:
            if resp_data['id'] == response.id:
                print(f"\nRéponse trouvée:")
                print(f"ID: {resp_data['id']}")
                print(f"Contenu: {resp_data['contenu']}")
                print(f"Auteur ID: {resp_data['auteur']}")
                print(f"Auteur Details: {resp_data['auteur_details']}")
                break
        else:
            print(f"Réponse {response.id} non trouvée dans les données sérialisées")
        
        # Afficher toutes les réponses avec leurs auteurs
        print(f"\n=== TOUTES LES RÉPONSES ===")
        for i, resp_data in enumerate(serialized_data['reponses']):
            print(f"Réponse {i+1}:")
            print(f"  ID: {resp_data['id']}")
            print(f"  Contenu: {resp_data['contenu'][:50]}...")
            print(f"  Auteur ID: {resp_data['auteur']}")
            print(f"  Auteur Details: {resp_data['auteur_details']}")
            print("---")
    
    else:
        print("Réponse de Needs Need non trouvée")
    
    print("=== TEST TERMINÉ ===")

if __name__ == "__main__":
    test_api_response()
