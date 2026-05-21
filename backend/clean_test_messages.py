#!/usr/bin/env python
"""
Script pour nettoyer les messages de test de la base de données
"""
import os
import sys
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.forum.models import Reponse, MessageVocal
from django.db.models import Q

def clean_test_messages():
    """Nettoyer les messages de test de la base de données"""
    print("=== NETTOYAGE DES MESSAGES DE TEST ===")
    
    # Nettoyer les réponses avec contenu de test
    test_contents = [
        "reponse de test pour message vocal",
        "Réponse de test pour message vocal", 
        "Message vocal envoyé",
        "Réponse vocale envoyée",
        "Réponse de test pour le message vocal",
        "reponse message de test message vocal",
        "Message vocal envoyé",
        "Réponse vocale",
        "Message vocal envoyé",
        "Réponse vocale"
    ]
    
    # Rechercher et nettoyer les réponses avec contenu de test
    test_responses = Reponse.objects.filter(contenu__in=test_contents)
    print(f"Trouvé {test_responses.count()} réponses avec contenu de test")
    
    for response in test_responses:
        print(f"Suppression de la réponse {response.id}: {response.contenu}")
        response.delete()
    
    # Nettoyer les messages vocaux sans contenu valide
    empty_vocals = MessageVocal.objects.filter(
        Q(fichier_audio__isnull=True) | 
        Q(fichier_audio='') |
        Q(fichier_audio__contains='mock')
    )
    print(f"Trouvé {empty_vocals.count()} messages vocaux invalides")
    
    for vocal in empty_vocals:
        print(f"Suppression du message vocal {vocal.id}")
        vocal.delete()
    
    # Afficher les réponses restantes pour vérification
    all_responses = Reponse.objects.all()
    print(f"\n=== VÉRIFICATION - Total réponses restantes: {all_responses.count()} ===")
    
    # Afficher les 10 premières réponses pour vérifier
    for response in all_responses[:10]:
        print(f"Réponse {response.id}: {response.contenu[:50]}...")
    
    print("=== NETTOYAGE TERMINÉ ===")

if __name__ == "__main__":
    clean_test_messages()
