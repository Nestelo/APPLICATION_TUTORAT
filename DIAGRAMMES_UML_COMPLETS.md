# 📐 Diagrammes UML Complets - Plateforme de Tutorat

## 1️⃣ DIAGRAMME DE CAS D'UTILISATION (Use Case Diagram)

```mermaid
graph TB
    %% Acteurs
    A[👨‍🎓 Étudiant]
    T[👨‍🏫 Tuteur]
    Admin[👨‍💼 Admin]
    E[👨‍🏫 Enseignant]

    %% Cas d'utilisation pour Étudiant
    A -->|S'authentifier| Auth["🔐 S'authentifier"]
    A -->|Rechercher tuteurs| SearchTutors["🔍 Rechercher Offres Tuteur"]
    A -->|Réserver séance| BookSession["📅 Réserver Séance"]
    A -->|Poser question| PostQuestion["❓ Poser Question Forum"]
    A -->|Voter réponses| VoteAnswer["👍 Voter Réponse"]
    A -->|Échanger messages| Message["💬 Messagerie"]
    A -->|Télécharger ressources| DownloadRes["⬇️ Télécharger Ressources"]
    A -->|Évaluer tuteur| RateTutor["⭐ Évaluer Tuteur"]

    %% Cas d'utilisation pour Tuteur
    T -->|S'authentifier| Auth
    T -->|Soumettre demande| RequestTutor["📝 Demander Devenir Tuteur"]
    T -->|Créer offre| CreateOffer["✨ Créer Offre Tutorat"]
    T -->|Gérer disponibilités| ManageAvail["🗓️ Gérer Disponibilités"]
    T -->|Confirmer séance| ConfirmSession["✅ Confirmer Séance"]
    T -->|Répondre questions| AnswerQ["✏️ Répondre Questions Forum"]
    T -->|Partager ressources| ShareRes["📤 Partager Ressources"]
    T -->|Voir statistiques| ViewStats["📊 Voir Statistiques"]

    %% Cas d'utilisation pour Admin
    Admin -->|Valider offres| ValidateOffer["🔏 Valider Offre Tutorat"]
    Admin -->|Approuver tuteurs| ApproveTutor["✔️ Approuver Tuteur"]
    Admin -->|Modérer contenu| Moderate["🛡️ Modérer Contenu"]
    Admin -->|Voir dashboard| Dashboard["📈 Dashboard Admin"]
    Admin -->|Gérer utilisateurs| ManageUsers["👥 Gérer Utilisateurs"]

    %% Cas d'utilisation pour Enseignant
    E -->|S'authentifier| Auth
    E -->|Créer offre| CreateOffer
    E -->|Partager ressources| ShareRes
    E -->|Modérer contenu| Moderate

    %% Cas d'utilisation partagés (extends)
    ViewStats -.->|généré à partir| BookSession
    ViewStats -.->|généré à partir| AnswerQ
    Dashboard -.->|accède à| ValidateOffer
    Dashboard -.->|accède à| ApproveTutor

    style Auth fill:#e1f5ff
    style SearchTutors fill:#fff3e0
    style BookSession fill:#f3e5f5
    style Message fill:#e8f5e9
    style ValidateOffer fill:#ffebee
    style ViewStats fill:#fce4ec
```

---

## 2️⃣ DIAGRAMME DE CLASSES / BASE DE DONNÉES (Entity Relationship)

```mermaid
erDiagram
    USER {
        int id
        string email
        string password
        string first_name
        string last_name
        string role
        boolean is_active
        datetime created_at
    }

    TUTORPROFILE {
        int id
        int user_id
        string specialite
        float average_rating
        int total_sessions
        boolean is_validated
    }

    STUDENTPROFILE {
        int id
        int user_id
        string niveau_etude
        int total_sessions_attended
    }

    OFFER {
        int id
        int tuteur_id
        string titre
        string description
        float prix
        string matiere
        string status
        datetime created_at
    }

    SESSION {
        int id
        int offre_id
        int student_id
        datetime date_debut
        datetime date_fin
        string status
        float durée_heures
    }

    EVALUATION {
        int id
        int session_id
        int student_id
        float note
        string commentaire
        datetime created_at
    }

    QUESTION {
        int id
        int author_id
        string titre
        string description
        string matiere
        string status
        datetime created_at
    }

    REPONSE {
        int id
        int question_id
        int author_id
        string contenu
        int votes_count
        boolean is_solution
        datetime created_at
    }

    CONVERSATION {
        int id
        string titre
        datetime created_at
        int created_by
    }

    MESSAGE {
        int id
        int conversation_id
        int sender_id
        string contenu
        datetime created_at
    }

    RESSOURCE {
        int id
        int author_id
        string titre
        string description
        string file_url
        string matiere
        string status
        datetime created_at
    }

    NOTIFICATION {
        int id
        int user_id
        string type
        string message
        boolean read
        datetime created_at
    }

    %% Relations
    USER ||--o{ TUTORPROFILE : "has"
    USER ||--o{ STUDENTPROFILE : "has"
    TUTORPROFILE ||--o{ OFFER : "creates"
    OFFER ||--o{ SESSION : "has"
    SESSION ||--o{ EVALUATION : "has"
    USER ||--o{ QUESTION : "posts"
    QUESTION ||--o{ REPONSE : "receives"
    USER ||--o{ REPONSE : "answers"
    USER ||--o{ CONVERSATION : "creates"
    CONVERSATION ||--o{ MESSAGE : "contains"
    USER ||--o{ MESSAGE : "sends"
    USER ||--o{ RESSOURCE : "publishes"
    USER ||--o{ NOTIFICATION : "receives"
```

---

## 3️⃣ DIAGRAMME DE SÉQUENCE - Réservation Séance Tutorat

```mermaid
sequenceDiagram
    participant Étudiant as 👨‍🎓 Étudiant
    participant Frontend as 📱 Frontend
    participant API as 🖥️ API Django
    participant DB as 🗄️ Base Données
    participant Notification as 📧 Service Notification

    Étudiant->>Frontend: Clique sur offre tutorat
    Frontend->>API: GET /offres/{id}/
    API->>DB: Récupère offre
    DB-->>API: Offre + disponibilités tuteur
    API-->>Frontend: Détails offre
    Frontend-->>Étudiant: Affiche offre

    Étudiant->>Frontend: Remplit formulaire réservation
    Frontend->>API: POST /seances/create/ {date, heure, duree}
    activate API
        API->>API: Valide disponibilité tuteur
        API->>DB: Crée séance (status=pending)
        DB-->>API: Séance créée
        API->>Notification: Envoie notification tuteur
        Notification-->>Notification: Email + Push
        API-->>Frontend: 201 Created {seance_id}
    deactivate API

    Frontend-->>Étudiant: ✅ Séance réservée

    par Notifications
        Notification-->>Tuteur: 📧 Email: nouvelle réservation
        Notification-->>Tuteur: 📲 Push notification
    end

    Tuteur->>Frontend: Consulte réservation
    Frontend->>API: GET /seances/{id}/
    API->>DB: Récupère séance
    DB-->>API: Détails séance
    API-->>Frontend: Données séance
    Frontend-->>Tuteur: Affiche détails

    Tuteur->>Frontend: Confirme la séance
    Frontend->>API: PATCH /seances/{id}/confirm/
    API->>DB: Met à jour status=confirmed
    DB-->>API: Séance confirmée
    API->>Notification: Envoie confirmation étudiant
    API-->>Frontend: 200 OK

    Notification-->>Étudiant: 📧 Email: séance confirmée
    Notification-->>Étudiant: 📲 Rappel séance J-1
```

---

## 4️⃣ DIAGRAMME D'ACTIVITÉ - Workflow Publication Ressource Pédagogique

```mermaid
stateDiagram-v2
    [*] --> SelectRessource: Tuteur upload ressource
    
    SelectRessource --> ValidateFile: Système valide type fichier
    ValidateFile --> FileValid{Fichier\nvalide ?}
    
    FileValid -->|Non| ErrorMsg: ❌ Affiche erreur
    ErrorMsg --> [*]
    
    FileValid -->|Oui| Upload: ⬆️ Upload sur Cloudinary
    Upload --> Uploaded{Upload\nréussi ?}
    
    Uploaded -->|Échoué| ErrorMsg
    Uploaded -->|Succès| FillMetadata: 📝 Remplir métadonnées
    
    FillMetadata --> SelectMatiere: Choisir matière
    SelectMatiere --> AddDescription: Ajouter description
    AddDescription --> SelectCategory: Catégorie
    SelectCategory --> SetPermissions: Définir permissions (public/privé)
    SetPermissions --> SubmitForValidation: 🚀 Soumettre validation
    
    SubmitForValidation --> AdminReview{Admin\nvalide ?}
    
    AdminReview -->|Rejet| RejectionReason: ⛔ Raison rejet
    RejectionReason --> CanEdit{Peut\nmodifier ?}
    CanEdit -->|Oui| FillMetadata
    CanEdit -->|Non| [*]
    
    AdminReview -->|Approbation| Publish: ✅ Publier ressource
    Publish --> IndexDB: 🔍 Indexer base de données
    IndexDB --> NotifyTeachers: 📢 Notifier enseignants abonnés
    NotifyTeachers --> AvailableResource: 📚 Ressource disponible
    AvailableResource --> [*]
```

---

## 5️⃣ DIAGRAMME DE DÉPLOIEMENT (Deployment Diagram)

```mermaid
graph TB
    subgraph Client["📱 CLIENT SIDE"]
        MobileApp["React Native<br/>Expo App<br/>Android/iOS"]
    end

    subgraph Frontend["🌐 FRONTEND (CDN)"]
        Expo["Expo Server<br/>expo.dev"]
        Assets["Static Assets<br/>Images, SVG"]
    end

    subgraph Backend["🖥️ BACKEND - Render.com"]
        subgraph Django["Django Application"]
            DjangoApp["Django REST Framework<br/>Python 3.11<br/>Gunicorn"]
            Apps["Apps:<br/>accounts, tutorat,<br/>forum, messagerie,<br/>ressources"]
        end
    end

    subgraph Database["🗄️ DATABASE"]
        PostgreSQL["PostgreSQL 15<br/>render.com/postgres<br/>Backups automatiques"]
    end

    subgraph Storage["☁️ CLOUD STORAGE"]
        Cloudinary["Cloudinary CDN<br/>Images, Vidéos, Audio<br/>Optimisation média"]
    end

    subgraph Email["📧 EMAIL SERVICE"]
        Brevo["Brevo SMTP<br/>Envoi emails<br/>Templates"]
    end

    subgraph Monitoring["📊 MONITORING"]
        Logs["Logs Render<br/>Error tracking"]
        Metrics["Métriques<br/>Performance"]
    end

    %% Connections
    MobileApp -->|HTTPS| Expo
    Expo -->|Fetch API| DjangoApp
    MobileApp -->|HTTPS| DjangoApp
    
    DjangoApp --> Apps
    Apps --> PostgreSQL
    
    DjangoApp -->|Upload| Cloudinary
    MobileApp -->|Fetch| Cloudinary
    
    DjangoApp -->|SMTP| Brevo
    Brevo -->|Email| MobileApp
    
    DjangoApp --> Logs
    DjangoApp --> Metrics
    
    PostgreSQL -.->|Backup| Logs

    classDef client fill:#e3f2fd
    classDef frontend fill:#f3e5f5
    classDef backend fill:#fff3e0
    classDef storage fill:#e8f5e9
    classDef service fill:#fce4ec
    
    class Client client
    class Frontend frontend
    class Django backend
    class PostgreSQL storage
    class Cloudinary storage
    class Brevo service
```

---

## 6️⃣ DIAGRAMME DE COMMUNICATION (Communication Diagram)

```mermaid
graph TB
    subgraph Users["👥 UTILISATEURS"]
        Student["👨‍🎓 Étudiant"]
        Tutor["👨‍🏫 Tuteur"]
        Admin["👨‍💼 Admin"]
    end

    subgraph FrontEnd["📱 CLIENT"]
        App["React Native App"]
    end

    subgraph Backend["🖥️ BACKEND API"]
        Auth["🔐 Auth Service<br/>JWT Tokens"]
        TutoratAPI["📚 Tutorat API<br/>Offres, Séances"]
        ForumAPI["💬 Forum API<br/>Questions, Réponses"]
        MessagingAPI["📧 Messaging API<br/>Conversations"]
        ResourceAPI["📦 Resource API<br/>Pédagogie"]
        AdminAPI["⚙️ Admin API<br/>Modération"]
    end

    subgraph Services["⚡ SERVICES"]
        NotifService["🔔 Notifications<br/>Email, Push"]
        StorageService["☁️ Cloudinary<br/>Fichiers"]
        EmailService["📨 Brevo<br/>SMTP"]
    end

    subgraph Data["🗄️ DATA"]
        PostgreSQL["PostgreSQL<br/>Users, Offres,<br/>Sessions, Messages"]
    end

    %% Student Flows
    Student -->|1: Login| App
    App -->|2: POST /login| Auth
    Auth -->|3: Validate| PostgreSQL
    PostgreSQL -->|4: User Data| Auth
    Auth -->|5: JWT Token| App
    App -->|6: Offres list| TutoratAPI
    TutoratAPI -->|7: Query| PostgreSQL
    PostgreSQL -->|8: Offres| TutoratAPI
    TutoratAPI -->|9: Display| App
    App -->|10: Reserve| TutoratAPI
    TutoratAPI -->|11: Create Session| PostgreSQL
    PostgreSQL -->|12: Saved| TutoratAPI
    TutoratAPI -->|13: Notify Tutor| NotifService
    NotifService -->|14: Email| EmailService
    EmailService -->|15: 📧 To Tutor| Tutor

    %% Tutor Flows
    Tutor -->|16: Create Offer| App
    App -->|17: POST /offres/create| TutoratAPI
    TutoratAPI -->|18: Save| PostgreSQL
    TutoratAPI -->|19: Notify Admin| AdminAPI
    AdminAPI -->|20: Admin Alert| NotifService

    %% Forum Flows
    Student -->|21: Post Question| App
    App -->|22: POST /questions| ForumAPI
    ForumAPI -->|23: Save| PostgreSQL
    ForumAPI -->|24: Notify Tutors| NotifService
    NotifService -->|25: Push| App
    Tutor -->|26: View Question| App
    App -->|27: GET /questions| ForumAPI
    Tutor -->|28: Answer| App
    App -->|29: POST /reponses| ForumAPI
    ForumAPI -->|30: Save| PostgreSQL
    ForumAPI -->|31: Notify Asker| NotifService

    %% Messaging Flows
    Student -->|32: Send Message| App
    App -->|33: POST /messages| MessagingAPI
    MessagingAPI -->|34: Store| PostgreSQL
    MessagingAPI -->|35: Attach File| StorageService
    StorageService -->|36: CDN URL| MessagingAPI
    MessagingAPI -->|37: Notify| NotifService

    %% Resource Flows
    Tutor -->|38: Upload Resource| App
    App -->|39: POST /ressources| ResourceAPI
    ResourceAPI -->|40: Upload| StorageService
    StorageService -->|41: Store| PostgreSQL
    ResourceAPI -->|42: Validate| AdminAPI
    AdminAPI -->|43: Approve/Reject| PostgreSQL
    PostgreSQL -->|44: Update| ResourceAPI

    %% Admin Flows
    Admin -->|45: Dashboard| App
    App -->|46: GET /admin/stats| AdminAPI
    AdminAPI -->|47: Aggregate| PostgreSQL
    PostgreSQL -->|48: Stats| AdminAPI
    AdminAPI -->|49: Display| App

    style Student fill:#bbdefb
    style Tutor fill:#c8e6c9
    style Admin fill:#ffe0b2
    style Auth fill:#f8bbd0
    style NotifService fill:#b2dfdb
    style PostgreSQL fill:#fffde7
```

---

## 7️⃣ DIAGRAMME DE FLUX D'ACTIVITÉ - Forum Pédagogique Complet

```mermaid
flowchart TD
    A["🏠 Accueil Forum"] --> B{Étudiant ou<br/>Tuteur ?}
    
    B -->|Étudiant| C["📖 Voir Questions<br/>Filtre: Matière, Tags"]
    C --> D{Action ?}
    D -->|Lire Réponses| E["✅ Affiche réponses<br/>Triées par votes"]
    E --> F{Question<br/>résolue ?}
    F -->|Non| G["👍 Voter réponses"]
    G --> H["🏆 Marquer meilleure réponse"]
    H --> I["⭐ Évaluer tuteur"]
    
    D -->|Poser Question| J["📝 Formulaire Question<br/>Titre, description, matière"]
    J --> K["🏷️ Ajouter tags"]
    K --> L["📸 Pièces jointes<br/>optionnelles"]
    L --> M["✨ Soumettre"]
    M --> N["⏳ Admin approuve<br/>Validation 24h"]
    N --> O{Approuvé ?}
    O -->|Non| P["❌ Affiche raison<br/>Peut modifier"]
    P --> J
    O -->|Oui| Q["📢 Question publiée<br/>Notif tuteurs"]
    Q --> R["🔔 Tuteurs spécialisés reçoivent<br/>notification"]
    
    B -->|Tuteur| S["🎯 Voir Questions<br/>Ma spécialité prioritaire"]
    S --> T{Action ?}
    T -->|Répondre| U["✏️ Éditeur réponse<br/>Markdown support"]
    U --> V["📎 Pièces jointes"]
    V --> W["✅ Valider réponse"]
    W --> X["📤 Réponse postée"]
    X --> Y["⏱️ Éditable 15 min"]
    Y --> Z["👍 Peut recevoir votes"]
    Z --> AA{Meilleure<br/>réponse ?}
    AA -->|Oui| AB["🥇 Badge 'Solution Expert'<br/>+50 points"]
    AA -->|Non| AC["💬 Tuteurs peuvent discuter"]
    
    T -->|Modérer| AD["🛡️ Admin vérifie<br/>Contenu approprié"]
    
    AB --> AE["📊 Stats Tuteur<br/>Réponses, solutions, points"]
    AC --> AE
    AE --> AF["🏆 Classement Tuteurs"]
    
    F -->|Oui| AG["✨ Marquer résolu"]
    AG --> AH["📉 Sortie flux actif"]
    
    style A fill:#e3f2fd
    style J fill:#fff3e0
    style U fill:#f3e5f5
    style AB fill:#c8e6c9
    style AE fill:#ffe0b2
```

---

## 📋 RÉSUMÉ DES DIAGRAMMES

| Diagramme | Format | Utilité | Destinataires |
|-----------|--------|---------|-----------------|
| **Cas d'utilisation** | Use Case | Montre tous les acteurs et leurs actions | Parties prenantes, professeurs |
| **Classes/Base de données** | Entity-Relationship | Architecture données complète | Développeurs, DBAs |
| **Séquence** | Sequence | Détail flux réservation séance | Techniques |
| **Activité** | Activity | Workflow publication ressource | Tous (facile à comprendre) |
| **Déploiement** | Deployment | Infrastructure cloud, Render | DevOps, administrateurs |
| **Communication** | Communication | Interactions entre composants | Architectes, leads |
| **Activité Forum** | Activity | Processus complet du forum | Tous (fonctionnel) |

---

## 🚀 COMMENT UTILISER CES DIAGRAMMES DANS VOTRE MÉMOIRE

### Option 1 : Export en Images
```bash
# Avec Mermaid CLI
npm install -g @mermaid-js/mermaid-cli
mmdc -i DIAGRAMMES_UML_COMPLETS.md -o diagrammes/

# Avec PlantUML online
# Copier-coller le code Mermaid sur https://mermaid.live
```

### Option 2 : Intégration Directe
```markdown
# Dans votre rapport .md ou .docx:
![Cas d'utilisation](./diagrammes/use-case.png)
```

### Option 3 : Présentation interactive
- Ouvrir https://mermaid.live
- Copier-coller chaque code
- Exporter en SVG haute résolution

---

## 💡 POINTS CLÉS À METTRE EN AVANT DANS LE MÉMOIRE

✅ **Architecture modulaire** : 5 apps Django indépendantes  
✅ **Scalabilité** : Déploiement cloud (Render), CDN (Cloudinary)  
✅ **Sécurité** : JWT, validation permissions par rôle  
✅ **UX** : Notifications temps-réel, gamification  
✅ **Résilience** : Backups PostgreSQL automatiques  

---

**Généré avec Mermaid Diagram Syntax v10 - Compatible PlantUML/Lucidchart**
