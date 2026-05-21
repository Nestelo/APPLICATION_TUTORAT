#!/usr/bin/env python3
"""
Script de débogage complet du workflow de publication des ressources
"""

import os
import sys
import django

# Ajouter le répertoire parent au PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from apps.accounts.models import User
from apps.tutorat.models import GroupeTutorat, Ressource as GroupeRessource, InscriptionGroupe
from apps.ressources.models import Ressource as GlobalRessource

def main():
    print("=== DÉBOGAGE WORKFLOW PUBLICATION RESSOURCES ===")
    print()
    
    # 1. Vérifier les utilisateurs
    print("1. UTILISATEURS DISPONIBLES:")
    tuteurs = User.objects.filter(role='tuteur')
    etudiants = User.objects.filter(role='etudiant')
    admins = User.objects.filter(role='admin')
    
    print(f"   Tuteurs: {tuteurs.count()}")
    for t in tuteurs:
        print(f"     - {t.email} ({t.get_full_name()})")
    
    print(f"   Étudiants: {etudiants.count()}")
    for e in etudiants:
        print(f"     - {e.email} ({e.get_full_name()})")
    
    print(f"   Admins: {admins.count()}")
    for a in admins:
        print(f"     - {a.email} ({a.get_full_name()})")
    
    # 2. Vérifier les groupes
    print("\n2. GROUPES DISPONIBLES:")
    groupes = GroupeTutorat.objects.all()
    print(f"   Total groupes: {groupes.count()}")
    
    for groupe in groupes:
        print(f"   Groupe {groupe.id}: {groupe.nom}")
        print(f"     Créateur: {groupe.createur.email}")
        
        # Vérifier les inscriptions
        inscriptions = InscriptionGroupe.objects.filter(groupe=groupe, statut='accepte')
        print(f"     Étudiants inscrits ({inscriptions.count()}):")
        for ins in inscriptions:
            print(f"       - {ins.etudiant.email}")
    
    # 3. Vérifier les ressources de groupe
    print("\n3. RESSOURCES DE GROUPE:")
    ressources = GroupeRessource.objects.all()
    print(f"   Total ressources: {ressources.count()}")
    
    for res in ressources.order_by('-date_creation'):
        print(f"   Ressource {res.id}: {res.titre}")
        print(f"     Créateur: {res.createur.email}")
        print(f"     Type: {res.type}")
        print(f"     Validée par admin: {res.validee_par_admin}")
        print(f"     Publique: {res.publique}")
        
        # Vérifier les groupes partagés
        groupes_partages = res.groupes_partages.all()
        print(f"     Groupes partagés ({groupes_partages.count()}):")
        for gp in groupes_partages:
            print(f"       - Groupe {gp.id}: {gp.nom}")
        print()
    
    # 4. Simulation du workflow étudiant
    print("\n4. WORKFLOW ÉTUDIANT - VÉRIFICATION ACCÈS RESSOURCES:")
    
    # Prendre le groupe "Recherche scientifique" (ID 3)
    try:
        groupe_recherche = GroupeTutorat.objects.get(id=3)
        print(f"   Groupe cible: {groupe_recherche.nom} (ID: {groupe_recherche.id})")
        
        # Vérifier les étudiants inscrits
        etudiants_inscrits = InscriptionGroupe.objects.filter(
            groupe=groupe_recherche, 
            statut='accepte'
        )
        print(f"   Étudiants inscrits valides: {etudiants_inscrits.count()}")
        
        for etudiant_inscrit in etudiants_inscrits:
            print(f"     - {etudiant_inscrit.etudiant.email}")
            
            # Vérifier ce que l'étudiant peut voir
            ressources_visibles = GroupeRessource.objects.filter(
                groupes_partages=groupe_recherche,
                validee_par_admin=True  # Étudiants ne voient que les ressources validées
            )
            print(f"       Ressources visibles: {ressources_visibles.count()}")
            
            for res in ressources_visibles:
                print(f"         - {res.titre} (Validée: {res.validee_par_admin})")
        
    except GroupeTutorat.DoesNotExist:
        print("   ERREUR: Groupe 'Recherche scientifique' (ID 3) introuvable!")
    
    # 5. Vérifier les ressources validées mais non publiées
    print("\n5. RESSOURCES VALIDÉES MAIS POTENTIELLEMENT NON PUBLIÉES:")
    ressources_validees = GroupeRessource.objects.filter(validee_par_admin=True)
    print(f"   Resources validées par admin: {ressources_validees.count()}")
    
    for res in ressources_validees:
        print(f"   Ressource {res.id}: {res.titre}")
        print(f"     Validée: {res.validee_par_admin}")
        print(f"     Publique: {res.publique}")
        print(f"     Date validation: {res.date_validation}")
        
        # Vérifier si elle est accessible aux étudiants
        groupes_partages = res.groupes_partages.all()
        for groupe in groupes_partages:
            etudiants_inscrits = InscriptionGroupe.objects.filter(
                groupe=groupe, 
                statut='accepte'
            )
            print(f"     Groupe {groupe.nom}: {etudiants_inscrits.count()} étudiants inscrits")
    
    # 6. Diagnostic du problème
    print("\n6. DIAGNOSTIC DU PROBLÈME:")
    
    # Vérifier s'il y a des ressources validées mais non visibles
    probleme_trouve = False
    
    for res in GroupeRessource.objects.filter(validee_par_admin=True):
        groupes_partages = res.groupes_partages.all()
        
        for groupe in groupes_partages:
            # Compter les étudiants qui devraient voir cette ressource
            etudiants_inscrits = InscriptionGroupe.objects.filter(
                groupe=groupe, 
                statut='accepte'
            )
            
            if etudiants_inscrits.count() > 0:
                print(f"   PROBLÈME POTENTIEL:")
                print(f"     Ressource: {res.titre}")
                print(f"     Validée: {res.validee_par_admin}")
                print(f"     Publique: {res.publique}")
                print(f"     Groupe: {groupe.nom}")
                print(f"     Étudiants inscrits: {etudiants_inscrits.count()}")
                
                # Vérifier si la ressource est réellement visible
                if not res.publique:
                    print(f"     >>> ERREUR: La ressource n'est pas publique!")
                    probleme_trouve = True
                
                probleme_trouve = True
    
    if not probleme_trouve:
        print("   Aucun problème détecté dans la configuration des ressources")
    else:
        print("   Problèmes détectés - voir ci-dessus")
    
    print("\n=== FIN DU DÉBOGAGE ===")

if __name__ == '__main__':
    main()
