#!/usr/bin/env python
"""
Script pour vérifier les données dans PostgreSQL
"""
import os
import sys
import django
from django.db import models

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.accounts.models import User, DemandeTuteur
from apps.tutorat.models import OffreTutorat, Seance
from apps.forum.models import Question, Reponse

def verifier_utilisateurs():
    print("=== 📋 UTILISATEURS ENREGISTRÉS ===")
    users = User.objects.all()
    print(f"Total utilisateurs: {users.count()}")
    
    print("\n📊 Répartition par rôle :")
    for role in ['etudiant', 'tuteur', 'enseignant', 'admin']:
        count = User.objects.filter(role=role).count()
        print(f"  - {role}: {count}")
    
    print("\n👥 5 derniers utilisateurs :")
    for user in users.order_by('-date_inscription')[:5]:
        print(f"  - {user.prenom} {user.nom} ({user.email}) - {user.role} - {user.date_inscription}")
    
    print("\n" + "="*50 + "\n")

def verifier_tutorat():
    print("=== 📚 TUTORAT ===")
    offres = OffreTutorat.objects.all()
    seances = Seance.objects.all()
    
    print(f"Total offres de tutorat: {offres.count()}")
    print(f"Total séances: {seances.count()}")
    
    print("\n📖 Matières les plus demandées :")
    matieres = offres.values('matiere').annotate(count=models.Count('id')).order_by('-count')[:5]
    for matiere in matieres:
        print(f"  - {matiere['matiere']}: {matiere['count']} offres")
    
    print("\n📅 5 dernières séances :")
    for seance in seances.order_by('-date_heure_debut')[:5]:
        print(f"  - {seance.tuteur.prenom} -> {seance.etudiant.prenom if seance.etudiant else 'Groupe'} - {seance.date_heure_debut} - {seance.statut}")
    
    print("\n" + "="*50 + "\n")

def verifier_ressources():
    print("=== 📁 RESSOURCES ===")
    ressources = Ressource.objects.all()
    print(f"Total ressources: {ressources.count()}")
    
    print("\n📊 Répartition par statut :")
    for statut in ['en_attente', 'publie', 'rejete']:
        count = ressources.filter(statut=statut).count()
        print(f"  - {statut}: {count}")
    
    print("\n🔥 Ressources les plus téléchargées :")
    top_ressources = ressources.order_by('-nb_telechargements')[:5]
    for res in top_ressources:
        print(f"  - {res.titre}: {res.nb_telechargements} téléchargements")
    
    print("\n" + "="*50 + "\n")

def verifier_forum():
    print("=== 💬 FORUM ===")
    questions = Question.objects.all()
    reponses = Reponse.objects.all()
    
    print(f"Total questions: {questions.count()}")
    print(f"Total réponses: {reponses.count()}")
    
    print("\n✅ Questions résolues :")
    resolues = questions.filter(est_resolue=True).count()
    print(f"  - {resolues}/{questions.count()} ({(resolues/questions.count()*100):.1f}%)")
    
    print("\n🔥 Questions les plus vues :")
    top_questions = questions.order_by('-nb_vues')[:5]
    for q in top_questions:
        print(f"  - {q.titre}: {q.nb_vues} vues")
    
    print("\n" + "="*50 + "\n")

if __name__ == "__main__":
    print("🔍 VÉRIFICATION DES DONNÉES POSTGRESQL\n")
    
    try:
        verifier_utilisateurs()
        verifier_tutorat()
        verifier_ressources()
        verifier_forum()
        
        print("✅ Vérification terminée avec succès !")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
