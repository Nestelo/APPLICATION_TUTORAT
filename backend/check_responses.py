#!/usr/bin/env python
"""
Script pour vérifier les réponses dans la base de données
"""
import os
import sys
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.forum.models import Reponse, MessageVocal
from django.contrib.auth import get_user_model

User = get_user_model()

def check_motar_responses():
    """Vérifier spécifiquement les réponses de Motar (ID 20)"""
    print("=== VÉRIFICATION DES RÉPONSES DE MOTAR (ID 20) ===")
    
    try:
        motar = User.objects.get(id=20)
        reponses_motar = Reponse.objects.filter(auteur=motar, deleted=False).order_by('-date')
        
        print(f"Total réponses de Motar (ID 20): {reponses_motar.count()}")
        print("\n=== DERNIÈRES RÉPONSES (par ordre chronologique décroissant) ===")
        
        for i, rep in enumerate(reponses_motar[:15], 1):
            print(f"{i}. ID: {rep.id}, Date: {rep.date}, Question: {rep.question.id if rep.question else 'N/A'}")
            print(f"   Contenu: {rep.contenu[:60]}...")
            print()
            
        # Vérifier les IDs les plus récents
        latest_ids = [rep.id for rep in reponses_motar[:5]]
        print(f"5 derniers IDs de réponses: {latest_ids}")
        
        # Compter par date pour voir s'il y a des réponses récentes
        from django.utils import timezone
        now = timezone.now()
        recent_24h = reponses_motar.filter(date__gte=now - timezone.timedelta(hours=24))
        print(f"Réponses des dernières 24h: {recent_24h.count()}")
        
        return reponses_motar.count()
        
    except Exception as e:
        print(f"Erreur: {e}")
        return 0

def check_responses():
    """Vérifier les réponses dans la base de données"""
    print("=== VÉRIFICATION DES RÉPONSES ===")
    
    # Afficher toutes les réponses
    all_responses = Reponse.objects.all().order_by('-id')
    print(f"Total des réponses: {all_responses.count()}")
    
    print("\n=== DÉTAIL DES RÉPONSES ===")
    for response in all_responses:
        print(f"ID: {response.id}")
        print(f"Auteur: {response.auteur.prenom} {response.auteur.nom} ({response.auteur.role})")
        print(f"Contenu: {response.contenu}")
        print(f"Date: {response.date}")
        print(f"Question: {response.question.titre}")
        print("---")
    
    # Vérifier les messages de test restants
    suspect_responses = Reponse.objects.filter(
        contenu__icontains="test"
    )
    
    print(f"\n=== RÉPONSES SUSPECTES ({suspect_responses.count()}) ===")
    for response in suspect_responses:
        print(f"ID: {response.id} - {response.contenu}")
    
    print("=== VÉRIFICATION TERMINÉE ===")

if __name__ == "__main__":
    check_motar_responses()
