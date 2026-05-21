from django.db.models import Q
from apps.notifications.models import Notification
from apps.accounts.models import User, TutorProfile


class ForumNotificationService:
    
    @staticmethod
    def notifier_tuteurs_specialises(question):
        """
        Notifie automatiquement les tuteurs spécialisés dans la matière de la question
        """
        matiere = question.matiere
        if not matiere:
            return
        
        # Récupérer les tuteurs spécialisés dans cette matière
        tuteurs_specialises = User.objects.filter(
            role__in=['tuteur', 'enseignant'],
            matieres_enseignees__contains=[matiere],
            is_active=True
        )
        
        # Priorité haute : notifie tous les tuteurs spécialisés
        if question.priorite == 'haute':
            priorite_text = "🔴 URGENT"
        elif question.priorite == 'moyenne':
            priorite_text = "🟡 Nouvelle"
        else:
            priorite_text = "🟢 Question"
        
        titre_notification = f"{priorite_text} - {question.titre}"
        message = f"Nouvelle question en {matiere} nécessitant votre expertise."
        
        # Créer les notifications pour chaque tuteur
        notifications = []
        for tuteur in tuteurs_specialises:
            notification = Notification(
                destinataire=tuteur,
                titre=titre_notification,
                message=message,
                type='reponse_forum',  # Type correct selon le modèle
                lien=f"/forum/question/{question.id}"
            )
            notifications.append(notification)
        
        # Création en masse pour optimisation
        if notifications:
            Notification.objects.bulk_create(notifications)
    
    @staticmethod
    def notifier_etudiant_reponse(reponse):
        """
        Notifie l'étudiant lorsqu'un tuteur répond à sa question
        """
        question = reponse.question
        auteur_question = question.auteur
        
        # Ne pas notifier si l'auteur de la réponse est l'auteur de la question
        if reponse.auteur == auteur_question:
            return
        
        titre = f"💬 Nouvelle réponse - {question.titre}"
        message = f"{reponse.auteur.get_full_name()} a répondu à votre question."
        
        Notification.objects.create(
            destinataire=auteur_question,
            titre=titre,
            message=message,
            type='reponse_forum',  # Type correct
            lien=f"/forum/question/{question.id}"
        )
    
    @staticmethod
    def notifier_solution_marquee(reponse):
        """
        Notifie le tuteur lorsque sa réponse est marquée comme solution
        """
        question = reponse.question
        tuteur = reponse.auteur
        
        titre = f"✅ Solution marquée !"
        message = f"Votre réponse à '{question.titre}' a été marquée comme solution."
        
        Notification.objects.create(
            destinataire=tuteur,
            titre=titre,
            message=message,
            type='reponse_forum',  # Type correct
            lien=f"/forum/question/{question.id}"
        )
        
        # Attribuer des points et badges au tuteur
        ForumNotificationService.attribuer_points_tuteur(tuteur, 'solution')
    
    @staticmethod
    def notifier_message_vocal(message_vocal):
        """
        Notifie les utilisateurs concernés par un nouveau message vocal
        """
        from apps.notifications.models import Notification
        
        # MessageVocal n'a pas d'attribut question direct, seulement via reponse
        # Donc on vérifie seulement la relation avec reponse
        if message_vocal.reponse:
            # Notifier l'auteur de la réponse et l'auteur de la question
            reponse = message_vocal.reponse
            question = reponse.question
            
            # Notifier l'auteur de la question
            if message_vocal.auteur != question.auteur:
                titre = f"Message vocal - {question.titre}"
                message = f"{message_vocal.auteur.get_full_name()} a envoyé un message vocal en réponse à votre question."
                
                Notification.objects.create(
                    destinataire=question.auteur,
                    titre=titre,
                    message=message,
                    type='reponse_forum',  # Type correct
                    lien=f"/forum/question/{question.id}"
                )
            
            # Notifier l'auteur de la réponse
            if message_vocal.auteur != reponse.auteur:
                titre = f"Message vocal reçu"
                message = f"{message_vocal.auteur.get_full_name()} a envoyé un message vocal en réponse à votre réponse."
                
                Notification.objects.create(
                    destinataire=reponse.auteur,
                    titre=titre,
                    message=message,
                    type='reponse_forum',  # Type correct
                    lien=f"/forum/question/{question.id}"
                )
    
    @staticmethod
    def attribuer_points_tuteur(tuteur, type_action):
        """
        Attribue des points et badges aux tuteurs pour leurs contributions
        """
        try:
            profile = tuteur.tutor_profile
            
            if type_action == 'solution':
                profile.points += 50
                profile.badge_solutions += 1
                
                # Badge expert après 10 solutions
                if profile.badge_solutions >= 10:
                    profile.badge_expert += 1
                    
            elif type_action == 'reponse_utile':
                profile.points += 10
                profile.badge_aide += 1
            
            profile.save()
            
        except TutorProfile.DoesNotExist:
            # Créer le profil s'il n'existe pas
            TutorProfile.objects.create(
                user=tuteur,
                points=50 if type_action == 'solution' else 10,
                badge_solutions=1 if type_action == 'solution' else 0,
                badge_aide=1 if type_action == 'reponse_utile' else 0
            )


class ForumStatsService:
    
    @staticmethod
    def get_stats_globales():
        """
        Statistiques globales du forum pour l'admin
        """
        from .models import Question, Reponse
        
        return {
            'total_questions': Question.objects.filter(deleted=False).count(),
            'questions_resolues': Question.objects.filter(est_resolue=True, deleted=False).count(),
            'total_reponses': Reponse.objects.filter(deleted=False).count(),
            'taux_resolution': (
                Question.objects.filter(est_resolue=True, deleted=False).count() /
                Question.objects.filter(deleted=False).count() * 100
            ) if Question.objects.filter(deleted=False).exists() else 0,
            'questions_par_matiere': {},
            'tuteurs_actifs': User.objects.filter(
                role__in=['tuteur', 'enseignant'],
                reponses__deleted=False
            ).distinct().count()
        }
    
    @staticmethod
    def get_stats_tuteur(tuteur):
        """
        Statistiques de productivité pour un tuteur
        """
        from .models import Question, Reponse
        
        reponses = Reponse.objects.filter(auteur=tuteur, deleted=False)
        solutions = reponses.filter(est_solution=True)
        
        return {
            'total_reponses': reponses.count(),
            'solutions_marquees': solutions.count(),
            'points': tuteur.tutor_profile.points if hasattr(tuteur, 'tutor_profile') else 0,
            'badge_solutions': tuteur.tutor_profile.badge_solutions if hasattr(tuteur, 'tutor_profile') else 0,
            'badge_aide': tuteur.tutor_profile.badge_aide if hasattr(tuteur, 'tutor_profile') else 0,
            'taux_solutions': (solutions.count() / reponses.count() * 100) if reponses.exists() else 0
        }
