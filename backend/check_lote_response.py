#!/usr/bin/env python
"""
Script pour vérifier les réponses de Lote Lot dans la base de données
"""
import os
import sys
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.forum.models import Reponse, Question
from apps.accounts.models import User

def check_lote_responses():
    """Vérifier toutes les réponses de Lote Lot"""
    print("=== VÉRIFICATION DES RÉPONSES DE LOTE LOT ===")
    
    # Trouver Lote Lot
    try:
        lote = User.objects.get(prenom="Lote", nom="Lot")
        print(f"Lote Lot trouvé - ID: {lote.id}, Rôle: {lote.role}")
        
        # Toutes ses réponses
        lote_responses = Reponse.objects.filter(auteur=lote)
        print(f"\nNombre de réponses de Lote Lot: {lote_responses.count()}")
        
        for response in lote_responses:
            print(f"\nRéponse ID: {response.id}")
            print(f"Question: {response.question.titre}")
            print(f"Contenu: {response.contenu}")
            print(f"Date: {response.date}")
            print(f"Est supprimée: {response.deleted}")
            print(f"Question ID: {response.question.id}")
            print(f"Question supprimée: {response.question.deleted}")
            
            # Vérifier si la question est bien dans les questions actives
            question = response.question
            print(f"Question active: {not question.deleted}")
            print(f"Date dernière réponse: {question.date_derniere_reponse}")
            print(f"Nombre de réponses: {question.reponses.count()}")
        
        # Vérifier spécifiquement la question "Bio pharmaceutique" (ID: 9)
        print(f"\n=== VÉRIFICATION QUESTION BIO PHARMACEUTIQUE (ID: 9) ===")
        try:
            bio_question = Question.objects.get(id=9)
            print(f"Question: {bio_question.titre}")
            print(f"Supprimée: {bio_question.deleted}")
            print(f"Nombre total de réponses: {bio_question.reponses.count()}")
            
            print("\nToutes les réponses de cette question:")
            for resp in bio_question.reponses.all():
                print(f"  ID: {resp.id} - Auteur: {resp.auteur.prenom} {resp.auteur.nom} - Contenu: {resp.contenu[:50]}...")
                print(f"    Supprimée: {resp.deleted}")
        
        except Question.DoesNotExist:
            print("Question Bio pharmaceutique non trouvée")
            
    except User.DoesNotExist:
        print("Lote Lot non trouvé")
    
    print("\n=== VÉRIFICATION TERMINÉE ===")

if __name__ == "__main__":
    check_lote_responses()
