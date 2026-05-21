#!/usr/bin/env python3
"""
Test du workflow de publication des ressources via API
"""

import requests
import json

def test_auth(email, password):
    """Authentification"""
    url = 'http://192.168.43.210:8000/api/auth/login/'
    
    data = {
        'email': email,
        'password': password
    }
    
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            return response.json().get('access')
        else:
            print(f"Auth error pour {email}: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Auth exception pour {email}: {e}")
        return None

def main():
    print("=== TEST WORKFLOW PUBLICATION RESSOURCES VIA API ===")
    print()
    
    # 1. Test avec tuteur Motar
    print("1. TEST AVEC TUTEUR MOTAR:")
    token_motar = test_auth('motar@gmail.com', 'Motar@1234')
    
    if token_motar:
        print("   Authentification Motar: OK")
        
        # Vérifier les groupes de Motar
        headers_motar = {'Authorization': f'Bearer {token_motar}'}
        
        # Lister les ressources du groupe 3 (Recherche scientifique)
        url_groupe_ressources = 'http://192.168.43.210:8000/api/ressources/groupes/3/ressources/'
        try:
            response = requests.get(url_groupe_ressources, headers=headers_motar)
            print(f"   Ressources groupe 3 (vue tuteur): Status {response.status_code}")
            
            if response.status_code == 200:
                ressources = response.json()
                print(f"   Nombre de ressources: {len(ressources)}")
                
                for res in ressources:
                    print(f"     - {res.get('titre', 'N/A')}")
                    print(f"       Validée: {res.get('validee_par_admin', 'N/A')}")
                    print(f"       Publique: {res.get('publique', 'N/A')}")
                    print(f"       Type: {res.get('type', 'N/A')}")
            else:
                print(f"   Erreur: {response.text}")
        except Exception as e:
            print(f"   Exception: {e}")
    
    print()
    
    # 2. Test avec étudiant Yaya
    print("2. TEST AVEC ÉTUDIANT YAYA:")
    token_yaya = test_auth('yaya@gmail.com', 'Yaya@1234')
    
    if token_yaya:
        print("   Authentification Yaya: OK")
        
        headers_yaya = {'Authorization': f'Bearer {token_yaya}'}
        
        # Vérifier les ressources du groupe 3 (vue étudiant)
        try:
            response = requests.get(url_groupe_ressources, headers=headers_yaya)
            print(f"   Ressources groupe 3 (vue étudiant): Status {response.status_code}")
            
            if response.status_code == 200:
                ressources = response.json()
                print(f"   Nombre de ressources: {len(ressources)}")
                
                if len(ressources) == 0:
                    print("   >>> PROBLÈME: Yaya ne voit aucune ressource!")
                else:
                    for res in ressources:
                        print(f"     - {res.get('titre', 'N/A')}")
                        print(f"       Validée: {res.get('validee_par_admin', 'N/A')}")
                        print(f"       Publique: {res.get('publique', 'N/A')}")
                        print(f"       Type: {res.get('type', 'N/A')}")
            else:
                print(f"   Erreur: {response.text}")
                if response.status_code == 403:
                    print("   >>> PROBLÈME: Yaya n'a pas accès au groupe!")
        except Exception as e:
            print(f"   Exception: {e}")
    
    print()
    
    # 3. Test avec admin
    print("3. TEST AVEC ADMIN:")
    # Essayer avec admin@gmail.com ou créer un admin
    token_admin = test_auth('admin@gmail.com', 'Admin@1234')
    
    if not token_admin:
        # Essayer avec un autre admin potentiel
        token_admin = test_auth('admin@example.com', 'Admin@1234')
    
    if token_admin:
        print("   Authentification Admin: OK")
        
        headers_admin = {'Authorization': f'Bearer {token_admin}'}
        
        # Vérifier les ressources en attente
        url_en_attente = 'http://192.168.43.210:8000/api/ressources/groupes/en-attente/'
        try:
            response = requests.get(url_en_attente, headers=headers_admin)
            print(f"   Ressources en attente: Status {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                ressources = data.get('results', [])
                print(f"   Nombre de ressources en attente: {len(ressources)}")
                
                for res in ressources:
                    print(f"     - {res.get('titre', 'N/A')} (ID: {res.get('id', 'N/A')})")
                    
                    # Simuler la validation
                    ressource_id = res.get('id')
                    if ressource_id:
                        url_valider = f'http://192.168.43.210:8000/api/ressources/groupes/valider/{ressource_id}/'
                        try:
                            response_valider = requests.post(url_valider, headers=headers_admin)
                            print(f"       Validation: Status {response_valider.status_code}")
                            if response_valider.status_code == 200:
                                print(f"       >>> Ressource validée avec succès!")
                        except Exception as e:
                            print(f"       Erreur validation: {e}")
            else:
                print(f"   Erreur: {response.text}")
        except Exception as e:
            print(f"   Exception: {e}")
    else:
        print("   Authentification Admin: ÉCHEC")
    
    print()
    
    # 4. Vérification finale - Yaya devrait voir les ressources validées
    print("4. VÉRIFICATION FINALE - YAYA DOIT VOIR LES RESSOURCES VALIDÉES:")
    
    if token_yaya:
        try:
            response = requests.get(url_groupe_ressources, headers=headers_yaya)
            print(f"   Ressources groupe 3 (après validation): Status {response.status_code}")
            
            if response.status_code == 200:
                ressources = response.json()
                print(f"   Nombre de ressources: {len(ressources)}")
                
                if len(ressources) == 0:
                    print("   >>> PROBLÈME CRITIQUE: Yaya ne voit toujours aucune ressource!")
                    print("   >>> DIAGNOSTIC: Les ressources validées ne sont pas visibles pour les étudiants")
                else:
                    print("   >>> SUCCÈS: Yaya peut voir les ressources!")
                    for res in ressources:
                        print(f"     - {res.get('titre', 'N/A')}")
        except Exception as e:
            print(f"   Exception: {e}")
    
    print("\n=== FIN DU TEST ===")

if __name__ == '__main__':
    main()
