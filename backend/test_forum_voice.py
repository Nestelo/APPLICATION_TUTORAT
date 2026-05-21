#!/usr/bin/env python
"""
Script de test pour vérifier l'API des messages vocaux du forum
"""

import os
import sys
import django
import requests
import json
from datetime import timedelta

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.forum.models import Question, Reponse

User = get_user_model()

# Configuration
API_BASE_URL = "http://192.168.43.210:8000/api"
USERNAME = "motar@gmail.com"
PASSWORD = "password123"  # À adapter selon vos données de test

def login_and_get_token():
    """Connexion et récupération du token JWT"""
    print("🔐 Connexion en cours...")
    
    login_data = {
        "email": USERNAME,
        "password": PASSWORD
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/auth/login/", json=login_data)
        if response.status_code == 200:
            token_data = response.json()
            print("✅ Connexion réussie")
            return token_data.get('access')
        else:
            print(f"❌ Erreur de connexion: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Exception lors de la connexion: {e}")
        return None

def test_create_question(token):
    """Créer une question de test"""
    print("\n📝 Création d'une question de test...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    question_data = {
        "titre": "Question test pour message vocal",
        "contenu": "Ceci est une question pour tester les messages vocaux",
        "matiere": "Informatique",
        "tags": "test, vocal, forum"
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/forum/questions/", 
                             json=question_data, headers=headers)
        if response.status_code == 201:
            question = response.json()
            print(f"✅ Question créée: ID {question['id']}")
            return question
        else:
            print(f"❌ Erreur création question: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Exception création question: {e}")
        return None

def test_create_response(token, question_id):
    """Créer une réponse de test"""
    print(f"\n💬 Création d'une réponse pour la question {question_id}...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response_data = {
        "question": question_id,
        "contenu": "Réponse de test pour le message vocal"
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/forum/reponses/", 
                             json=response_data, headers=headers)
        if response.status_code == 201:
            response_obj = response.json()
            print(f"✅ Réponse créée: ID {response_obj['id']}")
            return response_obj
        else:
            print(f"❌ Erreur création réponse: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Exception création réponse: {e}")
        return None

def test_voice_message_upload(token, response_id):
    """Tester l'upload d'un message vocal"""
    print(f"\n🎤 Test d'upload d'un message vocal pour la réponse {response_id}...")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # Créer un faux fichier audio pour le test
    audio_content = b"FAKE_AUDIO_CONTENT_FOR_TESTING"
    
    files = {
        'reponse': (None, str(response_id)),
        'fichier_audio': ('test_voice.mp3', audio_content, 'audio/mpeg'),
        'duree': (None, '00:01:30')
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/forum/messages-vocaux/", 
                             files=files, headers=headers)
        if response.status_code == 201:
            voice_message = response.json()
            print(f"✅ Message vocal créé: ID {voice_message['id']}")
            print(f"   Fichier: {voice_message['fichier_audio']}")
            print(f"   Durée: {voice_message['duree']}")
            return voice_message
        else:
            print(f"❌ Erreur upload message vocal: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Exception upload message vocal: {e}")
        return None

def test_get_voice_messages(token, response_id):
    """Récupérer les messages vocaux d'une réponse"""
    print(f"\n📋 Récupération des messages vocaux pour la réponse {response_id}...")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(f"{API_BASE_URL}/forum/messages-vocaux/?reponse={response_id}", 
                            headers=headers)
        if response.status_code == 200:
            messages = response.json()
            print(f"✅ Messages vocaux récupérés: {len(messages.get('results', []))}")
            for msg in messages.get('results', []):
                print(f"   - ID {msg['id']}: {msg['duree']} par {msg['auteur_details']['prenom']}")
            return messages
        else:
            print(f"❌ Erreur récupération messages: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Exception récupération messages: {e}")
        return None

def main():
    """Fonction principale de test"""
    print("🚀 Démarrage des tests de l'API des messages vocaux du forum")
    print("=" * 60)
    
    # 1. Connexion
    token = login_and_get_token()
    if not token:
        print("❌ Impossible de continuer sans token d'authentification")
        sys.exit(1)
    
    # 2. Créer une question de test
    question = test_create_question(token)
    if not question:
        print("❌ Impossible de continuer sans question")
        sys.exit(1)
    
    # 3. Créer une réponse de test
    response_obj = test_create_response(token, question['id'])
    if not response_obj:
        print("❌ Impossible de continuer sans réponse")
        sys.exit(1)
    
    # 4. Tester l'upload d'un message vocal
    voice_message = test_voice_message_upload(token, response_obj['id'])
    if not voice_message:
        print("❌ Échec de l'upload du message vocal")
        sys.exit(1)
    
    # 5. Tester la récupération des messages vocaux
    messages = test_get_voice_messages(token, response_obj['id'])
    if not messages:
        print("❌ Échec de la récupération des messages vocaux")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !")
    print("✅ L'API des messages vocaux du forum fonctionne correctement")
    print("=" * 60)

if __name__ == "__main__":
    main()
