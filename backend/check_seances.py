#!/usr/bin/env python
"""
Script pour vérifier les séances et les heures d'étude
"""
import os
import sys
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.tutorat.models import Seance
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

def check_seances():
    """Vérifier les séances terminées"""
    print("=== VÉRIFICATION DES SÉANCES TERMINÉES ===")
    
    # Séances terminées
    seances_terminees = Seance.objects.filter(statut='terminee').order_by('-date_heure_debut')
    print(f"Total séances terminées: {seances_terminees.count()}")
    
    print("\n=== DERNIÈRES SÉANCES TERMINÉES ===")
    for i, seance in enumerate(seances_terminees[:10], 1):
        print(f"{i}. ID: {seance.id}")
        print(f"   Sujet: {seance.sujet}")
        print(f"   Durée: {seance.duree} minutes")
        print(f"   Date: {seance.date_heure_debut}")
        print(f"   Étudiants: {seance.etudiants.count()}")
        print(f"   Statut: {seance.statut}")
        print()
    
    # Calcul des heures d'étude par étudiant
    print("=== HEURES D'ÉTUDE PAR ÉTUDIANT ===")
    etudiants = User.objects.filter(role='etudiant', is_active=True)
    
    for etudiant in etudiants[:5]:  # Limiter aux 5 premiers étudiants
        # Séances où l'étudiant participe et qui sont terminées
        seances_etudiant = Seance.objects.filter(
            etudiants=etudiant,
            statut='terminee'
        )
        
        total_minutes = sum(seance.duree for seance in seances_etudiant)
        total_heures = total_minutes / 60
        
        print(f"Étudiant: {etudiant.prenom} {etudiant.nom} (ID: {etudiant.id})")
        print(f"  Séances terminées: {seances_etudiant.count()}")
        print(f"  Temps total: {total_minutes} minutes = {total_heures:.1f} heures")
        print()

def check_api_endpoint():
    """Vérifier si l'endpoint API fonctionne"""
    print("=== VÉRIFICATION DE L'ENDPOINT API ===")
    
    # Simuler l'appel API pour les statistiques
    from django.test import Client
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    client = Client()
    
    # Prendre un étudiant au hasard
    etudiant = User.objects.filter(role='etudiant', is_active=True).first()
    if etudiant:
        # Forcer l'authentification
        client.force_login(etudiant)
        
        # Tester l'endpoint
        response = client.get('/api/tutorat/seances/statistiques/etudiant/')
        print(f"Status API: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Données API: {data}")
        else:
            print(f"Erreur API: {response.content.decode()}")
    else:
        print("Aucun étudiant trouvé pour tester l'API")

if __name__ == "__main__":
    check_seances()
    check_api_endpoint()
