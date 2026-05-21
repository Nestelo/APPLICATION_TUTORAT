#!/usr/bin/env python
"""
Script pour vérifier une réponse spécifique et son auteur
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

def check_specific_response():
    """Vérifier la réponse avec le message 'je suis ravie de vous aidez sur cette question?'"""
    print("=== VÉRIFICATION DE LA RÉPONSE SPÉCIFIQUE ===")
    
    # Rechercher la réponse avec ce contenu
    target_content = "je suis ravie de vous aidez sur cette question?"
    
    try:
        response = Reponse.objects.filter(contenu__icontains="ravie").first()
        if response:
            print(f"Réponse trouvée - ID: {response.id}")
            print(f"Contenu: {response.contenu}")
            print(f"Auteur ID: {response.auteur.id}")
            print(f"Auteur: {response.auteur.prenom} {response.auteur.nom} ({response.auteur.role})")
            print(f"Question: {response.question.titre}")
            print(f"Date: {response.date}")
            
            # Vérifier les détails de l'auteur
            print(f"\n=== DÉTAILS DE L'AUTEUR ===")
            author = response.auteur
            print(f"ID: {author.id}")
            print(f"Prénom: {author.prenom}")
            print(f"Nom: {author.nom}")
            print(f"Email: {author.email}")
            print(f"Rôle: {author.role}")
            
            # Vérifier s'il y a un problème avec les détails sérialisés
            print(f"\n=== VÉRIFICATION DES DÉTAILS SÉRIALISÉS ===")
            print(f"auteur_details attendu: {{prenom: {author.prenom}, nom: {author.nom}}}")
            
        else:
            print("Réponse non trouvée avec ce contenu")
            
            # Afficher toutes les réponses pour recherche
            print("\n=== TOUTES LES RÉPONSES ===")
            all_responses = Reponse.objects.all()
            for resp in all_responses:
                if "ravie" in resp.contenu.lower() or "aidez" in resp.contenu.lower():
                    print(f"ID: {resp.id} - Auteur: {resp.auteur.prenom} {resp.auteur.nom} - Contenu: {resp.contenu}")
    
    except Exception as e:
        print(f"Erreur: {e}")
    
    print("=== VÉRIFICATION TERMINÉE ===")

if __name__ == "__main__":
    check_specific_response()
