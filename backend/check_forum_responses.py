#!/usr/bin/env python
import os
import sys
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.forum.models import Question, Reponse
from apps.accounts.models import User
import json

def check_question_responses():
    """Vérifie les réponses de la question Bio pharmaceutique (ID 9)"""
    print("=== VÉRIFICATION DES RÉPONSES DE LA QUESTION BIO PHARMACEUTIQUE ===")
    
    try:
        question = Question.objects.get(id=9)
        print(f"Question: {question.titre}")
        print(f"Auteur: {question.auteur.get_full_name()}")
        print(f"Nombre de réponses: {question.reponses.count()}")
        print()
        
        # Vérifier toutes les réponses
        reponses = Reponse.objects.filter(question=question).order_by('date')
        print(f"Liste des {reponses.count()} réponses:")
        print("-" * 80)
        
        for i, reponse in enumerate(reponses, 1):
            print(f"\n--- Réponse {i} (ID: {reponse.id}) ---")
            print(f"Auteur: {reponse.auteur.get_full_name()} ({reponse.auteur.email})")
            print(f"Rôle: {reponse.auteur.role}")
            print(f"Contenu: '{reponse.contenu}'")
            print(f"Date: {reponse.date}")
            print(f"Est solution: {reponse.est_solution}")
            print(f"Deleted: {reponse.deleted}")
            
            # Vérifier les détails de l'auteur
            auteur_details = {
                'id': reponse.auteur.id,
                'email': reponse.auteur.email,
                'nom': reponse.auteur.nom,
                'prenom': reponse.auteur.prenom,
                'role': reponse.auteur.role,
                'photo_url': reponse.auteur.photo.url if reponse.auteur.photo else None
            }
            print(f"Détails auteur: {auteur_details}")
        
        print("\n" + "=" * 80)
        print("VÉRIFICATION DE LA SÉRIALISATION API")
        print("=" * 80)
        
        # Simuler la sérialisation de l'API
        from apps.forum.serializers import QuestionSerializer, ReponseSerializer
        
        # Sérialiser la question avec les réponses
        question_data = QuestionSerializer(question).data
        print(f"Question sérialisée:")
        print(f"- Titre: {question_data['titre']}")
        print(f"- Auteur détails: {question_data['auteur_details']}")
        print(f"- Nombre de réponses dans les données: {len(question_data['reponses'])}")
        
        print(f"\nRéponses sérialisées:")
        for i, reponse_data in enumerate(question_data['reponses'], 1):
            print(f"\n--- Réponse sérialisée {i} ---")
            print(f"ID: {reponse_data['id']}")
            print(f"Contenu: '{reponse_data['contenu']}'")
            print(f"Auteur détails: {reponse_data['auteur_details']}")
            print(f"Date: {reponse_data['date']}")
            
    except Exception as e:
        print(f"ERREUR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_question_responses()
