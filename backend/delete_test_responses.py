#!/usr/bin/env python
"""
Script pour supprimer les réponses de test spécifiques
"""
import os
import sys
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.forum.models import Reponse

def delete_test_responses():
    """Supprimer les réponses de test spécifiques"""
    print("=== SUPPRESSION DES RÉPONSES DE TEST ===")
    
    # IDs des réponses de test à supprimer
    test_response_ids = [23, 24, 25, 26, 27, 28, 30, 31, 32]
    
    # Supprimer les réponses de test
    deleted_count = 0
    for response_id in test_response_ids:
        try:
            response = Reponse.objects.get(id=response_id)
            print(f"Suppression de la réponse {response.id}: {response.contenu}")
            response.delete()
            deleted_count += 1
        except Reponse.DoesNotExist:
            print(f"Réponse {response_id} non trouvée")
        except Exception as e:
            print(f"Erreur suppression réponse {response_id}: {e}")
    
    print(f"\n=== {deleted_count} réponses de test supprimées ===")
    
    # Vérification
    remaining_test_responses = Reponse.objects.filter(
        contenu__icontains="test"
    ).count()
    
    print(f"Réponses avec 'test' restantes: {remaining_test_responses}")
    print("=== SUPPRESSION TERMINÉE ===")

if __name__ == "__main__":
    delete_test_responses()
