#!/usr/bin/env python
"""
Script pour tester l'API de la question Bio pharmaceutique
"""
import os
import sys
import django
import json

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.forum.models import Question
from apps.forum.serializers import QuestionSerializer

def test_question_api():
    """Tester l'API response pour la question Bio pharmaceutique"""
    print("=== TEST API QUESTION BIO PHARMACEUTIQUE ===")
    
    # Récupérer la question Bio pharmaceutique (ID: 9)
    try:
        question = Question.objects.get(id=9)
        print(f"Question: {question.titre}")
        print(f"ID: {question.id}")
        print(f"Supprimée: {question.deleted}")
        
        # Sérialiser la question avec ses réponses
        serializer = QuestionSerializer(question)
        serialized_data = serializer.data
        
        print(f"\n=== DONNÉES SÉRIALISÉES ===")
        print(f"Nombre de réponses sérialisées: {len(serialized_data['reponses'])}")
        
        # Afficher toutes les réponses sérialisées
        print(f"\n=== DÉTAIL DES RÉPONSES SÉRIALISÉES ===")
        for i, resp_data in enumerate(serialized_data['reponses']):
            print(f"Réponse {i+1}:")
            print(f"  ID: {resp_data['id']}")
            print(f"  Auteur ID: {resp_data['auteur']}")
            print(f"  Auteur Details: {resp_data['auteur_details']['prenom']} {resp_data['auteur_details']['nom']}")
            print(f"  Contenu: {resp_data['contenu']}")
            print(f"  Supprimée: {resp_data['deleted']}")
            print(f"  Date: {resp_data['date']}")
            print("---")
        
        # Vérifier spécifiquement les réponses de Lote Lot
        print(f"\n=== RÉPONSES DE LOTE LOT ===")
        lote_responses = [r for r in serialized_data['reponses'] if r['auteur_details']['prenom'] == 'Lote']
        print(f"Nombre de réponses de Lote Lot dans l'API: {len(lote_responses)}")
        
        for resp in lote_responses:
            print(f"  ID: {resp['id']} - Contenu: {resp['contenu']}")
        
        # Afficher le JSON complet pour debugging
        print(f"\n=== JSON COMPLET DE LA QUESTION ===")
        print(json.dumps(serialized_data, indent=2, ensure_ascii=False))
    
    except Question.DoesNotExist:
        print("Question Bio pharmaceutique non trouvée")
    
    print("\n=== TEST TERMINÉ ===")

if __name__ == "__main__":
    test_question_api()
