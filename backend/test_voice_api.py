#!/usr/bin/env python
"""
Test simple de l'API des messages vocaux du forum
"""
import os
import sys
import django
import requests
import json

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

def test_api_access():
    """Tester l'accès à l'API"""
    print("🔍 Test d'accès à l'API...")
    
    try:
        response = requests.get('http://192.168.43.210:8000/api/forum/questions/', timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            questions_count = len(data.get('results', data))
            print(f"✅ API accessible - {questions_count} questions trouvées")
            return True
        else:
            print(f"❌ Erreur API - Status: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Erreur de connexion - Serveur non démarré?")
        return False
    except Exception as e:
        print(f"❌ Erreur inattendue: {e}")
        return False

def test_voice_endpoint():
    """Tester l'endpoint des messages vocaux"""
    print("\n🎤 Test de l'endpoint messages vocaux...")
    
    try:
        response = requests.get('http://192.168.43.210:8000/api/forum/messages-vocaux/', timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            messages_count = len(data.get('results', data))
            print(f"✅ Endpoint messages vocaux accessible - {messages_count} messages trouvés")
            return True
        elif response.status_code == 401:
            print("⚠️  Endpoint accessible mais authentification requise (normal)")
            return True
        else:
            print(f"❌ Erreur endpoint - Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur endpoint: {e}")
        return False

def test_models():
    """Tester les modèles Django"""
    print("\n🗄️  Test des modèles Django...")
    
    try:
        from apps.forum.models import Question, Reponse, MessageVocal
        from apps.accounts.models import User
        
        # Compter les objets
        questions_count = Question.objects.count()
        reponses_count = Reponse.objects.count()
        messages_count = MessageVocal.objects.count()
        users_count = User.objects.count()
        
        print(f"✅ Modèles accessibles:")
        print(f"   - Questions: {questions_count}")
        print(f"   - Réponses: {reponses_count}")
        print(f"   - Messages vocaux: {messages_count}")
        print(f"   - Utilisateurs: {users_count}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur modèles: {e}")
        return False

def test_serializers():
    """Tester les sérialiseurs"""
    print("\n📋 Test des sérialiseurs...")
    
    try:
        from apps.forum.serializers import MessageVocalSerializer
        
        # Test de sérialisation vide
        serializer = MessageVocalSerializer()
        print("✅ MessageVocalSerializer accessible")
        
        # Vérifier les champs
        fields = list(serializer.fields.keys())
        expected_fields = ['id', 'reponse', 'auteur', 'fichier_audio', 'duree', 'date_envoi', 'auteur_details']
        
        for field in expected_fields:
            if field in fields:
                print(f"   ✅ Champ '{field}' présent")
            else:
                print(f"   ❌ Champ '{field}' manquant")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur sérialiseurs: {e}")
        return False

def main():
    """Fonction principale"""
    print("🚀 Test de l'API des messages vocaux du forum")
    print("=" * 50)
    
    tests = [
        ("Accès API", test_api_access),
        ("Endpoint messages vocaux", test_voice_endpoint),
        ("Modèles Django", test_models),
        ("Sérialiseurs", test_serializers),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Erreur dans le test '{test_name}': {e}")
            results.append((test_name, False))
    
    # Résumé
    print("\n" + "=" * 50)
    print("📊 RÉSULTATS DES TESTS")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSÉ" if result else "❌ ÉCHOUÉ"
        print(f"{test_name:.<30} {status}")
        if result:
            passed += 1
    
    print("=" * 50)
    print(f"Total: {passed}/{total} tests passés")
    
    if passed == total:
        print("🎉 TOUS LES TESTS SONT PASSÉS !")
        print("✅ L'API des messages vocaux est prête")
    else:
        print("⚠️  Certains tests ont échoué")
        print("🔧 Vérifiez la configuration")
    
    print("=" * 50)

if __name__ == "__main__":
    main()
