# 📊 Guide Complet d'Analyse et de Conception UML
## Projet : Plateforme de Tutorat Académique et de Partage de Ressources

Ce guide a été conçu pour structurer et générer l'ensemble des diagrammes requis pour votre **Projet de Fin d'Études (PFE)**. Il détaille la méthodologie d'analyse et fournit les codes sources au format **Mermaid.js**, que vous pouvez visualiser directement dans votre éditeur Markdown (comme VS Code, GitHub ou des visionneuses Mermaid en ligne).

---

## 🎯 1. Méthodologie : Comment Procéder ?

Pour concevoir votre rapport de PFE et modéliser correctement votre application, vous devez suivre une démarche de génie logiciel structurée (généralement inspirée du Processus Unifié ou de Scrum). Voici l'ordre logique de réalisation de vos diagrammes :

```mermaid
flowchart LR
    A[1. Besoins & Acteurs] --> B[2. Cas d'Utilisation]
    B --> C[3. Activités / Processus]
    C --> D[4. Séquences & Comm]
    D --> E[5. Base de Données / MCD]
    E --> F[6. Déploiement / Physique]
```

### Étapes clés :
1. **Identifier les acteurs (Qui ?)** :
   - **Étudiant** : Recherche des tuteurs, s'inscrit aux séances, télécharge des ressources, participe au forum.
   - **Tuteur** : Propose des offres de tutorat, valide/organise les séances, dépose des ressources.
   - **Enseignant** : Rôle similaire au tuteur avec des privilèges académiques supplémentaires (validation immédiate).
   - **Administrateur** : Valide les profils de tuteur, modère le forum, supervise la plateforme.
2. **Définir les fonctionnalités clés (Quoi ?)** : Cartographiées par le **Diagramme de Cas d'Utilisation**.
3. **Modéliser les flux opérationnels (Comment ?)** : Modélisés par les **Diagrammes d'Activités** (aspect dynamique global).
4. **Modéliser les interactions techniques chronologiques** : Modélisées par les **Diagrammes de Séquence** et de **Communication** (échanges de messages, requêtes HTTP/JWT).
5. **Concevoir la structure des données** : Modélisée par le **Diagramme de Classe / MCD / Base de Données** (basé sur vos modèles Django).
6. **Concevoir l'infrastructure physique** : Modélisée par le **Diagramme de Déploiement** (React Native, Django, PostgreSQL, SendGrid).

---

## 👥 2. Diagramme de Cas d'Utilisation (Use Case Diagram)

Ce diagramme structure les fonctionnalités de la plateforme selon le rôle de chaque acteur.

```mermaid
flowchart TB
    %% Frontière du système
    subgraph System [Plateforme de Tutorat & Ressources Académiques]
        UC1([S'authentifier & Gérer son profil])
        UC2([Rechercher & Consulter des ressources])
        UC3([Télécharger & Évaluer une ressource])
        UC4([Uploader des ressources académiques])
        
        UC5([Créer une offre de tutorat])
        UC6([S'inscrire à une offre / un groupe])
        UC7([Planifier & Réaliser une séance de tutorat])
        UC8([Évaluer une séance / Noter le tuteur])
        
        UC9([Échanger des messages en temps réel])
        UC10([Poser & Répondre sur le Forum])
        
        UC11([Valider les profils & les offres])
        UC12([Modérer les ressources & le forum])
    end

    %% Acteurs
    Etudiant((Étudiant))
    Tuteur((Tuteur))
    Enseignant((Enseignant))
    Admin((Administrateur))

    %% Héritage d'acteurs
    Enseignant -->|Est un| Tuteur
    Tuteur -->|Est un| Etudiant

    %% Liaisons Cas d'Utilisation
    Etudiant --- UC1
    Etudiant --- UC2
    Etudiant --- UC3
    Etudiant --- UC6
    Etudiant --- UC8
    Etudiant --- UC9
    Etudiant --- UC10

    Tuteur --- UC4
    Tuteur --- UC5
    Tuteur --- UC7

    Admin --- UC11
    Admin --- UC12
```

---

## 🔄 3. Diagramme d'Activité (Activity Diagram)

Ce diagramme représente le flux de contrôle lors de la **Réservation et validation d'une séance de tutorat**.

```mermaid
flowchart TD
    Start([Début]) --> Connect{Utilisateur connecté ?}
    Connect -- Non --> Login[S'authentifier via JWT] --> Search[Rechercher un Tuteur / une Offre]
    Connect -- Oui --> Search
    
    Search --> Select[Sélectionner une offre et consulter le calendrier]
    Select --> ChooseSlot[Choisir un créneau horaire libre]
    ChooseSlot --> SubmitReq[Soumettre la demande d'inscription]
    
    SubmitReq --> NotifyTutor[Notifier le Tuteur via Push/Email]
    
    NotifyTutor --> TutorDecision{Le tuteur accepte ?}
    
    TutorDecision -- Oui --> Confirm[Mettre la séance à 'Confirmée']
    Confirm --> GenerateLink[Générer le lien de visioconférence]
    GenerateLink --> NotifyStudent[Notifier l'étudiant de la confirmation]
    NotifyStudent --> AddCalendar[Ajouter aux calendriers respectifs] --> End([Fin])
    
    TutorDecision -- Non --> Reject[Mettre le statut à 'Refusée']
    Reject --> NotifyStudentReject[Notifier l'étudiant du refus]
    NotifyStudentReject --> End
```

---

## ⏱️ 4. Diagramme de Séquence (Sequence Diagram)

Modélise le scénario de **Réservation d'une séance de tutorat** avec passage de jetons d'authentification (JWT).

```mermaid
sequenceDiagram
    autonumber
    actor Etudiant as Étudiant
    participant Mobile as App Mobile (React Native)
    participant API as API Backend (Django REST)
    participant DB as Base de Données (PostgreSQL)
    actor Tuteur as Tuteur
    participant Notify as Service Notification (SendGrid/Push)

    Etudiant->>Mobile: Choisit un tuteur & un créneau horaire
    Mobile->>API: POST /api/tutorat/sessions/ (Payload + Token JWT)
    activate API
    API->>API: Valider l'authenticité du Token JWT
    API->>DB: Vérifier la disponibilité (Disponibilite model)
    activate DB
    DB-->>API: Créneau libre
    deactivate DB
    
    API->>DB: Créer l'enregistrement Seance (statut: 'planifiee')
    activate DB
    DB-->>API: Séance créée (ID: 412, statut: planifiee)
    deactivate DB
    
    API->>Notify: Déclencher notification de demande
    activate Notify
    Notify-->>Tuteur: Notification Push / Email : "Nouvelle demande de tutorat"
    deactivate Notify
    
    API-->>Mobile: 201 Created (Séance enregistrée)
    deactivate API
    Mobile-->>Etudiant: Affiche "Demande envoyée avec succès"

    Note over Tuteur, API: Le tuteur reçoit et examine la demande
    
    Tuteur->>Mobile: Accepte la demande de séance
    Mobile->>API: POST /api/tutorat/sessions/412/confirmer/
    activate API
    API->>DB: Mettre à jour statut -> 'confirmee' + lien_visio
    activate DB
    DB-->>API: Enregistré
    deactivate DB
    
    API->>Notify: Déclencher notifications de confirmation
    activate Notify
    Notify-->>Etudiant: Push/Email : "Séance confirmée ! Lien : https://..."
    Notify-->>Tuteur: Push/Email : "Séance confirmée ! Lien : https://..."
    deactivate Notify
    
    API-->>Mobile: 200 OK (Séance confirmée)
    deactivate API
```

---

## 🗣️ 5. Diagramme de Communication (Communication Diagram)

Ce diagramme montre les mêmes interactions que le diagramme de séquence ci-dessus, mais se focalise sur l'organisation structurelle des objets.

```mermaid
flowchart TD
    Student((Étudiant)) -- "1: Demander une séance\n5: Recevoir confirmation" --- AppMobile[App Mobile (React Native)]
    AppMobile -- "2: POST /api/tutorat/sessions/\n4: Retourner confirmation (201)" --- DjangoAPI[API Backend (Django REST)]
    DjangoAPI -- "3.1: Insérer Séance\n3.3: Mettre à jour statut" --- Database[(PostgreSQL DB)]
    DjangoAPI -- "3.2: Envoyer notification" --- NotificationServer[Serveur de Notifications]
    NotificationServer -- "3.2.1: Recevoir alerte" --- Tutor((Tuteur))
    Tutor -- "3.2.2: Accepter séance" --- AppMobile
```

---

## 🗄️ 6. Diagramme de Base de Données (Entity-Relationship Diagram - MCD)

Ce diagramme représente la structure physique et logique de votre base de données PostgreSQL, mappée sur vos modèles Django réels décrits dans [BACKEND_MODELS_COMPLETS.md](file:///c:/Users/Agathe/OneDrive/Desktop/APPLICATION_TUTORAT/BACKEND_MODELS_COMPLETS.md).

```mermaid
erDiagram
    USER {
        int id PK
        string username
        string email
        string role "etudiant | tuteur | enseignant | admin"
        string statut "actif | inactif | suspendu | en_attente"
        string telephone
        string biographie
        date date_naissance
        datetime date_inscription
        boolean email_verifie
        boolean certifie
        float note_moyenne
        int nombre_evaluations
    }

    TUTOR_PROFILE {
        int id PK
        int user_id FK "1-1 relation with USER"
        json diplomes
        json competences
        json langues
        text methodes_enseignement
        int total_sessions
        int total_etudiants
        float taux_reponse
    }

    STUDENT_PROFILE {
        int id PK
        int user_id FK "1-1 relation with USER"
        json preferences_apprentissage
        json difficultes
        text objectifs_specifiques
        int sessions_suivies
        float progression_globale
    }

    OFFRE_TUTORAT {
        int id PK
        int tuteur_id FK
        string titre
        text description
        string matiere
        string niveau
        string type "individuel | groupe"
        decimal tarif
        int duree_session
        int nombre_places
        boolean en_ligne
        boolean est_active
        boolean validee_par_admin
    }

    INSCRIPTION_OFFRE {
        int id PK
        int offre_id FK
        int etudiant_id FK
        string statut "en_attente | acceptee | refusee | annulee"
        text message
        datetime date_inscription
    }

    GROUPE_TUTORAT {
        int id PK
        int offre_id FK
        string nom
        text description
        int capacite_max
        date date_debut
        date date_fin
        int createur_id FK
        boolean prive
    }

    DISPONIBILITE {
        int id PK
        int tuteur_id FK
        int jour_semaine "0-6"
        time heure_debut
        time heure_fin
        boolean est_recurrent
    }

    SEANCE {
        int id PK
        int offre_id FK
        int groupe_id FK
        int tuteur_id FK
        datetime date_heure_debut
        datetime date_heure_fin
        int duree
        boolean en_ligne
        string lien_visio
        string sujet
        string statut "planifiee | confirmee | en_cours | terminee | annulee"
        text rapport_tuteur
    }

    EVALUATION {
        int id PK
        int seance_id FK
        int auteur_id FK
        int cible_id FK
        int note "1-5"
        text commentaire
    }

    RESSOURCE {
        int id PK
        int createur_id FK
        string titre
        text description
        string type "cours | exercice | video | document | quiz"
        string fichier
        string lien
        string matiere
        string niveau
        boolean publique
        boolean validee_par_admin
        int telechargements
        int vues
    }

    CONVERSATION {
        int id PK
        string titre
        string type "individuel | groupe | support"
        int cree_par_id FK
        int groupe_associe_id FK
        datetime dernier_message
    }

    MESSAGE {
        int id PK
        int conversation_id FK
        int expediteur_id FK
        string type "texte | fichier | image | lien | systeme"
        text contenu
        string fichier
        datetime date_envoi
    }

    FORUM_QUESTION {
        int id PK
        string titre
        text contenu
        string categorie
        int auteur_id FK
        string matiere
        string niveau
        boolean resolu
        int meilleure_reponse_id FK
        datetime date_creation
    }

    FORUM_REPONSE {
        int id PK
        int question_id FK
        int auteur_id FK
        text contenu
        int votes_positifs
        int votes_negatifs
        boolean est_meilleure_reponse
    }

    NOTIFICATION {
        int id PK
        int destinataire_id FK
        string type "systeme | message | seance | inscription..."
        string titre
        text message
        boolean lue
        datetime date_creation
    }

    %% Relations cardinality
    USER ||--|| TUTOR_PROFILE : "possède (1-1)"
    USER ||--|| STUDENT_PROFILE : "possède (1-1)"
    USER ||--o{ OFFRE_TUTORAT : "propose (1-N)"
    USER ||--o{ INSCRIPTION_OFFRE : "s'inscrit (1-N)"
    USER ||--o{ DISPONIBILITE : "définit (1-N)"
    USER ||--o{ SEANCE : "anime (1-N)"
    USER ||--o{ EVALUATION : "évalue / reçoit (1-N)"
    USER ||--o{ RESSOURCE : "dépose (1-N)"
    USER ||--o{ CONVERSATION : "participe (1-N)"
    USER ||--o{ MESSAGE : "envoie (1-N)"
    USER ||--o{ FORUM_QUESTION : "pose (1-N)"
    USER ||--o{ FORUM_REPONSE : "répond (1-N)"
    USER ||--o{ NOTIFICATION : "reçoit (1-N)"

    OFFRE_TUTORAT ||--o{ INSCRIPTION_OFFRE : "reçoit (1-N)"
    OFFRE_TUTORAT ||--o{ GROUPE_TUTORAT : "génère (1-N)"
    OFFRE_TUTORAT ||--o{ SEANCE : "planifie (1-N)"
    GROUPE_TUTORAT ||--o{ SEANCE : "contient (1-N)"
    SEANCE ||--o{ EVALUATION : "donne lieu à (1-N)"
    CONVERSATION ||--o{ MESSAGE : "contient (1-N)"
    FORUM_QUESTION ||--o{ FORUM_REPONSE : "engendre (1-N)"
```

---

## 🖥️ 7. Diagramme de Déploiement (Deployment Diagram)

Ce diagramme modélise l'architecture physique de production pour le déploiement de l'application.

```mermaid
flowchart TB
    subgraph Client_Env [Environnement Utilisateur]
        direction LR
        Android[Smartphones Android\nApp React Native & Expo]
        iOS[Smartphones iOS\nApp React Native & Expo]
        AdminWeb[Navigateur Web PC\nDashboard Admin]
    end

    subgraph Cloud_Hosting [Hébergement VPS / Cloud production]
        subgraph Web_Tier [Serveur Nginx]
            Nginx[Nginx Reverse Proxy\nHTTPS port 443]
        end

        subgraph App_Tier [Serveur Gunicorn & Django]
            Gunicorn[Serveur WSGI Gunicorn]
            Django[Django REST Framework\nPython 3.10+]
        end

        subgraph DB_Tier [Serveur Base de Données]
            Postgres[(PostgreSQL 15)]
        end
        
        subgraph Storage_Tier [Fichiers Statiques / Media]
            MediaFiles[Stockage Local / S3\nPhotos & Ressources PDF]
        end
    end

    subgraph External_Services [APIs & Services Tierces]
        SendGrid[Serveur SMTP SendGrid\nEnvoi Emails]
        ExpoPush[Expo Notification Service\nNotifications Push Android/iOS]
    end

    %% Interactions physiques
    Android -- HTTPS / REST / JSON --> Nginx
    iOS -- HTTPS / REST / JSON --> Nginx
    AdminWeb -- HTTPS / Django Admin --> Nginx
    
    Nginx -- Proxy Pass (Port 8000) --> Gunicorn
    Gunicorn -- Gère les process --> Django
    
    Django -- SQL (Port 5432) --> Postgres
    Django -- Lecture/Écriture Fichiers --> MediaFiles
    
    Django -- HTTPS / API Rest --> SendGrid
    Django -- HTTPS / API Rest --> ExpoPush
```

---

## 🛠️ 8. Outils Recommandés pour la Rédaction de Votre Rapport

Pour insérer ces diagrammes dans votre document de thèse de PFE (Word ou LaTeX) :
1. **DBeaver ou pgAdmin** : Pour générer automatiquement le schéma physique directement depuis votre base de données PostgreSQL locale.
2. **Mermaid Live Editor** ([mermaid.live](https://mermaid.live)) : Collez le code Mermaid de ce fichier pour exporter directement les diagrammes en **PNG haute résolution**, **SVG** ou **PDF**.
3. **Draw.io (ou app.diagrams.net)** : Outil gratuit pour redessiner ou enrichir manuellement les diagrammes si nécessaire.
4. **StarUML / Modelio** : Si votre école exige un formalisme strict avec vérification des contraintes UML.
