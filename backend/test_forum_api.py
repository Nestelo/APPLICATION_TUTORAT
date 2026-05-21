#!/usr/bin/env python
import os
import django

# Configurer Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.forum.models import Question
from apps.accounts.models import User
from apps.forum.serializers import QuestionSerializer

# Test de création de question
print("Test de création de question...")

# Données de test
test_data = {
    'titre': 'Question test',
    'contenu': 'Ceci est une question de test pour vérifier l\'API',
    'matiere': 'Mathématiques',
    'tags': 'test,api,django'
}

# Créer le serializer avec les données de test
serializer = QuestionSerializer(data=test_data)

print("Données de test:", test_data)
print("Serializer valide?", serializer.is_valid())

if not serializer.is_valid():
    print("Erreurs de validation:", serializer.errors)
else:
    print("Validation réussie!")
    print("Données validées:", serializer.validated_data)
    
    # Tenter de créer la question
    try:
        # Récupérer un utilisateur existant pour l'auteur
        user = User.objects.first()
        if user:
            question = serializer.save(auteur=user)
            print(f"Question créée avec succès: ID={question.id}")
            # Supprimer la question de test
            question.delete()
            print("Question de test supprimée")
        else:
            print("Aucun utilisateur trouvé pour le test")
    except Exception as e:
        print(f"Erreur lors de la création: {e}")
