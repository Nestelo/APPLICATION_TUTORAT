#!/usr/bin/env python
import os
import sys
import django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.tutorat.models import Seance
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

def check_seance_status():
    print("=== VÉRIFICATION STATUT SÉANCES ===")
    
    # Chercher l'étudiante Marie
    marie = User.objects.filter(prenom__icontains='marie', role='etudiant').first()
    if not marie:
        print("Étudiante Marie non trouvée")
        return
    
    print(f"Étudiante trouvée: {marie.prenom} {marie.nom} (ID: {marie.id})")
    
    # Séances de Marie d'hier
    from datetime import timedelta
    hier = timezone.now() - timedelta(days=1)
    
    seances_marie = Seance.objects.filter(
        etudiants=marie,
        date_heure_debut__date=hier.date()
    ).order_by('-date_heure_debut')
    
    print(f"Nombre de séances d'hier: {seances_marie.count()}")
    
    for seance in seances_marie:
        print(f"\nSéance ID: {seance.id}")
        print(f"Sujet: {seance.sujet}")
        print(f"Tuteur: {seance.tuteur.prenom} {seance.tuteur.nom}")
        print(f"Date début: {seance.date_heure_debut}")
        print(f"Date fin: {seance.date_heure_fin}")
        print(f"Durée: {seance.duree} minutes")
        print(f"Statut: {seance.statut}")
        print(f"Maintenant: {timezone.now()}")
        
        # Vérifier si la séance devrait être terminée
        if seance.date_heure_fin < timezone.now() and seance.statut != 'terminee':
            print("⚠️  PROBLÈME: La séance devrait être terminée !")

if __name__ == "__main__":
    check_seance_status()
