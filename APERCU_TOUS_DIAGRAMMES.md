# 📐 TOUS LES DIAGRAMMES EN APERÇU

## 🎯 VOS 7 DIAGRAMMES GÉNÉRÉS

---

## 1️⃣ DIAGRAMME DE CAS D'UTILISATION

```
┌─────────────────────────────────────────────────────┐
│                   PLATEFORME TUTORAT                │
│                                                     │
│   ┌─────────────────────────────────────────────┐   │
│   │          ACTIONS & FONCTIONNALITÉS          │   │
│   └─────────────────────────────────────────────┘   │
│                                                     │
│  👨‍🎓 ÉTUDIANT              👨‍🏫 TUTEUR                 │
│  ├─ S'authentifier        ├─ S'authentifier       │
│  ├─ Rechercher tuteurs    ├─ Demander Tuteur     │
│  ├─ Réserver séance   ┌──┤─ Créer offre          │
│  ├─ Poser question    │   ├─ Confirmer séance    │
│  ├─ Voter réponses    │   ├─ Répondre forum      │
│  ├─ Messagerie        │   ├─ Partager ressources│
│  └─ Télécharger res.  │   └─ Voir stats          │
│                       │                           │
│  👨‍💼 ADMIN              │   👨‍🏫 ENSEIGNANT       │
│  ├─ Valider offres    │   ├─ Créer offre        │
│  ├─ Approuver tuteurs ├──┤─ Partager ressources│
│  ├─ Modérer contenu       │                     │
│  ├─ Dashboard stats       │ (Variante Tuteur)   │
│  └─ Gérer utilisateurs    │                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 2️⃣ DIAGRAMME DE BASE DE DONNÉES

```
┌──────────────────────────────────────────────────────┐
│                    8 ENTITÉS CLÉS                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│   USER ◄──────────┐                                 │
│  ├─ id           │                                 │
│  ├─ email        │      ┌─────────────┐            │
│  ├─ password     ├──────► TUTORPROFILE            │
│  ├─ role         │      ├─ specialite             │
│  └─ is_active    │      ├─ avg_rating             │
│                  │      └─ validated              │
│                  │                                 │
│                  └──────► STUDENTPROFILE          │
│                           ├─ niveau_etude         │
│                           └─ nb_sessions           │
│                                                    │
│   OFFER (Tuteur → Offres)                          │
│  ├─ titre, description                             │
│  ├─ prix, matiere                                  │
│  └─ status (pending/approved)                      │
│          │                                         │
│          ▼                                         │
│   SESSION (Offre → Seances)                        │
│  ├─ date_debut, date_fin                           │
│  ├─ status (pending/confirmed/completed)          │
│  └─ durée_heures                                   │
│          │                                         │
│          ▼                                         │
│   EVALUATION                                       │
│  ├─ note (1-5)                                     │
│  ├─ commentaire                                    │
│  └─ date_evaluation                                │
│                                                    │
│   QUESTION (Étudiant → Forum)                      │
│  ├─ titre, description                             │
│  ├─ matiere, tags                                  │
│  └─ status (draft/pending/approved)                │
│          │                                         │
│          ▼                                         │
│   REPONSE (Tuteurs répondent)                      │
│  ├─ contenu                                        │
│  ├─ votes_count                                    │
│  ├─ is_solution (meilleure réponse)               │
│  └─ created_at                                     │
│                                                    │
│   CONVERSATION (Messages entre users)              │
│  ├─ titre                                          │
│  ├─ created_by                                     │
│  └─ participants                                   │
│          │                                         │
│          ▼                                         │
│   MESSAGE                                          │
│  ├─ contenu, file_url (optionnel)                  │
│  ├─ sender                                         │
│  └─ created_at                                     │
│                                                    │
│   RESSOURCE (Fichiers pédago)                      │
│  ├─ titre, description                             │
│  ├─ file_url (Cloudinary)                          │
│  ├─ matiere                                        │
│  ├─ status (draft/pending/approved)                │
│  └─ author                                         │
│                                                    │
│   NOTIFICATION                                     │
│  ├─ type (email, push, in-app)                     │
│  ├─ message                                        │
│  ├─ read                                           │
│  └─ recipient                                      │
│                                                    │
└──────────────────────────────────────────────────────┘
```

---

## 3️⃣ DIAGRAMME DE SÉQUENCE - Réservation Séance

```
TEMPS
  │
  │  Étudiant          Frontend          API Django       Database
  │    │                  │                 │                 │
  ├──► │ Voir offre       │                 │                 │
  │    │  Clic offre      │                 │                 │
  │    │ ────────────────► │ GET /offres/1   │                 │
  │    │                  │────────────────► │ SELECT offre    │
  │    │                  │                 │────────────────► │
  │    │                  │                 │ ◄────────────── Données
  │    │                  │ ◄────────────── │                  │
  │    │ ◄────────────────  Display offre   │                 │
  │    │                  │                 │                 │
  ├─►  │ Sélectionne date/heure disponibles
  │    │  Remplit form    │                 │                 │
  │    │ ────────────────► │ POST /seances   │                 │
  │    │                  │────────────────► │ CREATE seance   │
  │    │                  │                 │────────────────► │
  │    │                  │                 │ ◄────────────── ✅ ID
  │    │                  │ ◄────────────── │ Seance créée    │
  │    │ ◄────────────────  201 Created     │                 │
  │    │  ✅ Confirmé     │                 │                 │
  │    │                  │                 │ Envoyer notif   │
  │    │                  │                 │────────────────► │
  │    │                  │                 │ (Email + Push)   │
  │    │                  │                 │                 │
  │    │◄───────────────────────────────────────────────────────│
  │  Tuteur reçoit notif                                       │
  │    │                  │                 │                 │
  │    │ ──────────────────────────────────► │ Voir réservation
  │    │                  │ GET /seances/X  │                 │
  │    │                  │────────────────► │ SELECT seance   │
  │    │                  │                 │────────────────► │
  │    │                  │                 │ ◄────────────── Données
  │    │                  │ ◄────────────── │                 │
  │    │                  │ Afficher détails                 │
  │    │                  │                 │                 │
  │    │ ──────────────────────────────────► │ Confirmer       │
  │    │                  │ PATCH /confirm  │                 │
  │    │                  │────────────────► │ UPDATE status   │
  │    │                  │                 │────────────────► │
  │    │                  │                 │ ◄────────────── ✅
  │    │                  │ ◄────────────── │ 200 OK          │
  │    │                  │ ✅ Confirmé     │                 │
  │    │                  │                 │                 │
  │    │◄───────────────────────────────── Notif confirmation │
  │  Étudiant reçoit email confirmation                       │
  │    │                  │                 │                 │
  └────┴──────────────────┴─────────────────┴─────────────────┘
```

---

## 4️⃣ DIAGRAMME D'ACTIVITÉ - Publication Ressource

```
                         ┌─────────────────┐
                         │ Tuteur Upload   │
                         │   Ressource     │
                         └────────┬────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ Système Valide Type      │
                    │ Fichier (PDF/Video/etc)  │
                    └──────────┬───────────────┘
                               │
                        ┌──────▼──────┐
                        │  Fichier    │
                        │  Valide?    │
                        └──┬──────┬───┘
              NON           │      │ OUI
            ┌───────────────┘      └──────────────┐
            │                                     │
            ▼                                     ▼
    ┌─────────────────┐              ┌──────────────────────┐
    │ ❌ Erreur       │              │ ⬆️ Upload Cloudinary │
    │ Affiche raison  │              └──────────┬───────────┘
    └────────┬────────┘                         │
             │                                   ▼
             │                      ┌────────────────────────┐
             │                      │ Upload Réussi?        │
             │                      └────┬──────────┬────────┘
             │                           │ ÉCHEC    │ OUI
             │                    ┌──────┘          └──┐
             │                    │                   │
             │                    ▼                   ▼
             │              ┌────────────┐   ┌──────────────────┐
             │              │ Erreur     │   │ 📝 Remplir       │
             │              │ Réseau     │   │ Métadonnées      │
             │              └────────────┘   ├─ Titre           │
             │                               ├─ Description    │
             │                               ├─ Matière        │
             │                               └──────┬──────────┘
             │                                      │
             │                                      ▼
             │                            ┌──────────────────┐
             │                            │ Définir Perms    │
             │                            │ (Public/Privé)   │
             │                            └──────┬───────────┘
             │                                   │
             │                                   ▼
             │                    ┌──────────────────────────┐
             │                    │ 🚀 Soumettre Validation  │
             │                    └──────────┬───────────────┘
             │                               │
             │                               ▼
             │                    ┌──────────────────────────┐
             │                    │ Admin Valide?            │
             │                    └────┬────────────┬────────┘
             │               REJETTE    │            │ APPROUVÉ
             │              ┌───────────┘            └─────────┐
             │              │                                  │
             │              ▼                                  ▼
             │     ┌─────────────────┐        ┌──────────────────────┐
             │     │ ⛔ Rejet        │        │ ✅ Publier Resource   │
             │     │ Raison rejet    │        └────────┬─────────────┘
             │     └────────┬────────┘                 │
             │              │                         ▼
             │              │        ┌────────────────────────────┐
             │              │        │ 🔍 Indexer Base Données    │
             │              │        └────────┬───────────────────┘
             │              │                 │
             │              ▼                 ▼
             │     ┌────────────────┐  ┌──────────────────────────┐
             │     │ Peut modifier? │  │ 📢 Notifier Abonnés      │
             │     └────┬──────┬────┘  └────────┬──────────────────┘
             │          │ NON  │ OUI           │
             │      ┌───┴┐     │               ▼
             │      │    └─────►Peut            ┌──────────────────┐
             │      │       réessayer           │ 📚 Ressource      │
             │      │                           │ DISPONIBLE        │
             │      │                           │ Pour étudiants    │
             │      │                           └────────┬─────────┘
             │      │                                    │
             └──────┴────────────────────────────────────┴──► 🏁 FIN
```

---

## 5️⃣ DIAGRAMME DE DÉPLOIEMENT

```
┌─────────────────────────────────────────────────────────────────┐
│                        INFRASTRUCTURE CLOUD                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐              ┌──────────────────────────┐  │
│  │  📱 CLIENTS     │              │   🌐 FRONTEND (Expo)     │  │
│  ├─────────────────┤              ├──────────────────────────┤  │
│  │ • iOS (iPhone) │◄──────HTTPS──┤ • Expo Server           │  │
│  │ • Android      │              │ • Static Assets CDN     │  │
│  │ • React Native │              │ • expo.dev             │  │
│  └────────┬────────┘              └──────────┬─────────────┘   │
│           │                                   │                │
│           │        ╔════════════════════════════╗              │
│           └────────║       RENDER.COM (Cloud)  ║              │
│                    ║════════════════════════════╝              │
│                           │                                    │
│                    ┌──────▼────────────┐                       │
│                    │ 🖥️ DJANGO SERVER  │                       │
│                    ├───────────────────┤                       │
│                    │ • Python 3.11     │                       │
│                    │ • Gunicorn        │                       │
│                    │ • 5 Django Apps   │                       │
│                    │ • DRF API         │                       │
│                    └────────┬──────────┘                       │
│                             │                                  │
│            ┌────────────────┼────────────────┬────────────┐   │
│            │                │                │            │   │
│            ▼                ▼                ▼            ▼   │
│   ┌──────────────┐  ┌──────────────┐  ┌───────────┐ ┌────────┐
│   │🗄️ PostgreSQL │  │☁️ Cloudinary │  │📧BrevoSMTP│ │📊Logs  │
│   │ • DB 15      │  │ • Images CDN │  │• Templates│ │Metrics │
│   │ • Backups    │  │ • Video Opt. │  │• Email    │ │Monitor │
│   │ • Encryption │  │ • Files      │  │• Relay    │ │        │
│   └──────────────┘  └──────────────┘  └───────────┘ └────────┘
│
│  ┌────────────────────────────────────────────────────────┐
│  │  🔒 SÉCURITÉ                                          │
│  ├────────────────────────────────────────────────────────┤
│  │  • HTTPS/TLS (Let's Encrypt auto-renew)              │
│  │  • JWT Authentication (Access + Refresh tokens)      │
│  │  • Database Encryption (at rest)                     │
│  │  • CORS Policy configured                             │
│  │  • Rate limiting on sensitive endpoints              │
│  │  • Secrets in environment variables                  │
│  └────────────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────────┘
```

---

## 6️⃣ DIAGRAMME DE COMMUNICATION

```
┌─────────────────────────────────────────────────────────────────┐
│                      INTERACTIONS SYSTÈME                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  👥 ACTEURS                    📱 CLIENT                 🖥️ API │
│  ┌──────────────┐             ┌──────────┐           ┌────────┐│
│  │ Étudiant     │◄───HTTPS───►│ React    │──────────►│ Django ││
│  │ Tuteur       │             │ Native   │           │ DRF    ││
│  │ Admin        │             │ Expo     │◄──────────│        ││
│  └──────────────┘             └──────────┘           │ • Auth ││
│                                                      │ • API  ││
│                                                      │        ││
│                                  ┌───────────┐      └────────┘│
│                                  │1: Login   │                │
│                                  │2: POST    │                │
│                                  │   /login  │                │
│                                  └──────┬────┘                │
│                                         ▼                      │
│                              ┌──────────────────┐             │
│                              │3: Validate User  │             │
│                              │4: Return JWT    │             │
│                              └──────────────────┘             │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              🔄 FLUX DE DONNÉES                        │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │                                                        │  │
│  │  Étudiant                     API              DB     │  │
│  │   │                           │                │      │  │
│  │   ├─ Cherche offres ──────────►│                │      │  │
│  │   │                           ├─ Query ────────►│      │  │
│  │   │                           │                ├─────►│  │
│  │   │                           │◄────────────────┤      │  │
│  │   │◄───────────────────────────┤                │      │  │
│  │   │                                            │      │  │
│  │   ├─ Réserver séance ─────────►│                │      │  │
│  │   │                           ├─ Create ──────►│      │  │
│  │   │                           │                ├─────►│  │
│  │   │                           │◄────────────────┤      │  │
│  │   │◄───────────────────────────┤                │      │  │
│  │   │                                            │      │  │
│  │   ├──► Notification Service ──►│                │      │  │
│  │   │      (Email + Push)        │                │      │  │
│  │                                                 │      │  │
│  │  Tuteur                                                │  │
│  │   │                                            │      │  │
│  │   ├──► Reçoit notif          │                │      │  │
│  │   │                                            │      │  │
│  │   ├─ Consulte réservation ───►│                │      │  │
│  │   │                           ├─ Query ──────►│      │  │
│  │   │                           │◄────────────────┤      │  │
│  │   │◄───────────────────────────┤                │      │  │
│  │   │                                            │      │  │
│  │   ├─ Confirme séance ────────►│                │      │  │
│  │   │                           ├─ Update ─────►│      │  │
│  │   │                           │◄────────────────┤      │  │
│  │   │◄───────────────────────────┤                │      │  │
│  │                                                │      │  │
│  │  Admin                                         │      │  │
│  │   │                                            │      │  │
│  │   ├─ Dashboard ───────────────►│                │      │  │
│  │   │                           ├─ Aggregate ──►│      │  │
│  │   │                           │◄────────────────┤      │  │
│  │   │◄───────────────────────────┤                │      │  │
│  │                                                │      │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │        ⚡ SERVICES EXTERNES                            │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │                                                        │  │
│  │  📧 Brevo SMTP              ☁️ Cloudinary            │  │
│  │   ├─ Emails transactionnels   ├─ Upload fichiers    │  │
│  │   ├─ Templates              ├─ CDN distribution    │  │
│  │   └─ Tracking               └─ Optimisation media  │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7️⃣ DIAGRAMME DE FLUX - FORUM PÉDAGOGIQUE

```
┌──────────────────────────────────────────────────────────────┐
│              🎯 WORKFLOW FORUM COMPLET                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│            ┌─────────────────────────────┐                  │
│            │  👨‍🎓 ACCUEIL FORUM          │                  │
│            └──────────┬──────────────────┘                  │
│                       │                                     │
│                ┌──────▼───────┐                             │
│                │ Rôle ?       │                             │
│                └──┬────────┬──┘                             │
│           OUI   ╱          ╲  NON                           │
│              ╱              ╲                               │
│          ╱                    ╲                             │
│     ┌───▼────────────┐  ┌──────▼──────────────────────┐  │
│     │ 👨‍🎓 ÉTUDIANT    │  │ 👨‍🏫 TUTEUR                 │  │
│     └────────────────┘  └──────────────────────────────┘  │
│            │                        │                     │
│            ▼                        ▼                     │
│   ┌────────────────┐       ┌──────────────────────┐      │
│   │ 📖 Voir Qs     │       │ 🎯 Questions par     │      │
│   │ Filtre: Tags   │       │    Spécialité        │      │
│   │ Matière        │       │    (PRIORITAIRE)     │      │
│   └────────┬───────┘       └──────────┬───────────┘      │
│            │                         │                   │
│     ┌──────▼────────┐        ┌───────▼──────────┐       │
│     │ Choisir Q     │        │ Lire Q détail    │       │
│     └───┬─────┬─────┘        └────────┬─────────┘       │
│         │     │                       │                  │
│  ┌──────┘     └────────┐              ▼                  │
│  │                     │     ┌─────────────────┐        │
│  │ OUI                 NO    │ Peut répondre?  │        │
│  │                     │     └────────┬────────┘        │
│  │                     │              │                 │
│  │ ┌────────────────┐  │ ┌───────────▼────────────┐    │
│  │ │📝 Poser Q      │  │ │ ✏️ Éditeur réponse     │    │
│  │ │ • Titre        │  │ │ • Markdown support     │    │
│  │ │ • Description  │  │ │ • Pièces jointes      │    │
│  │ │ • Matière      │  │ │ • Préview             │    │
│  │ │ • Tags         │  │ └───────────┬───────────┘    │
│  │ └────────┬───────┘  │             │                │
│  │          │          │ ┌───────────▼────────┐       │
│  │ ┌────────▼────────┐ │ │✅ Valider réponse   │       │
│  │ │🚀 Soumettre    │ │ │                     │       │
│  │ └────────┬────────┘ │ └──────────┬──────────┘       │
│  │          │          │            │                 │
│  │ ┌────────▼────────┐ │ ┌──────────▼───────────┐    │
│  │ │⏳ Admin Valide  │ │ │📤 Réponse postée      │    │
│  │ │(24h)            │ │ │⏱️ Éditable 15 min    │    │
│  │ └────┬────────┬───┘ │ └──────────┬───────────┘    │
│  │      │ NON    │ OUI │            │                │
│  │    ┌─┴─┐      │     │ ┌──────────▼──────┐       │
│  │    │   │      │     │ │👍 Votes +1/-1   │       │
│  │    │   │      │     │ └────────┬─────────┘       │
│  │    │   │      │     │          │                 │
│  │    │   └──┐   │     │ ┌────────▼─────────────┐  │
│  │    │      │   │     │ │ Meilleure réponse?  │  │
│  │    │ ┌────▼───▼───┐ │ └────────┬─────────────┘  │
│  │    │ │❌ Raison   │ │          │ OUI             │
│  │    │ │ Rejet      │ │ ┌────────▼──────────────┐ │
│  │    │ └────┬───────┘ │ │🥇 Badge Expert +50   │ │
│  │    │      │         │ │   Points             │ │
│  │    │      │         │ └────────┬──────────────┘ │
│  │    │ Peut │         │          │                │
│  │    │ réditer?│       │ ┌────────▼──────────┐    │
│  │    │      │         │ │📊 Stats Tuteur    │    │
│  │    │ NON  │ OUI     │ │                   │    │
│  │    │  ▼   │         │ └────────┬──────────┘    │
│  │    │      │         │          │                │
│  │    └──────┼─────────┼──────────┴──────────────┐ │
│  │           │         │                         │ │
│  │           │    ┌────▼──────────────────────┐  │ │
│  │           │    │🏆 Classement Tuteurs      │  │ │
│  │           │    │ Actifs/Meilleur          │  │ │
│  │           │    └────┬───────────────────────┘  │ │
│  │           │         │                         │ │
│  └───────────┼─────────┴─────────────────────────┘ │
│              │                                     │
│              ▼                                     │
│         ┌─────────────────────────────────┐       │
│         │✨ Question marquée RÉSOLUE      │       │
│         │ ➡️ Sort du flux actif           │       │
│         │ 📚 Reste en archive             │       │
│         │ 🔍 Searchable                   │       │
│         └─────────────────────────────────┘       │
│                                                   │
└──────────────────────────────────────────────────────────┘
```

---

## 📊 TABLEAU COMPARATIF DIAGRAMMES

| Diagramme | Type | Complexité | Utilité | Audience |
|-----------|------|-----------|---------|----------|
| 1️⃣ Use Case | UML | ⭐⭐ Moyenne | Vue acteurs + cas | Tous |
| 2️⃣ ER Diagram | UML | ⭐⭐⭐ Haute | Architecture données | Tech |
| 3️⃣ Séquence | UML | ⭐⭐⭐⭐ Très haute | Détail workflow | Tech |
| 4️⃣ Activité | UML | ⭐⭐ Moyenne | Processus métier | Tous |
| 5️⃣ Déploiement | UML | ⭐⭐⭐ Haute | Infrastructure | DevOps |
| 6️⃣ Communication | UML | ⭐⭐⭐ Haute | Interactions | Architectes |
| 7️⃣ Flux Forum | UML | ⭐⭐⭐ Haute | Q&A workflow | Tous |

---

## 💾 FORMATS DISPONIBLES

```
Actuellement fourni: Mermaid Diagram (texte)

Exportable vers:
├── PNG (raster) .......... Insérer dans Word/PDF
├── SVG (vecteur) ......... Scalable, meilleure qualité
├── PDF (print-ready) ..... Imprimer directement
└── HTML (interactif) ..... Web/présentation

Instructions export: GUIDE_EXPORT_DIAGRAMMES.md
```

---

## ✅ PROCHAINES ÉTAPES

1. **Exporter diagrammes en images** (Voir GUIDE_EXPORT_DIAGRAMMES.md)
2. **Insérer dans rapport Word/PDF** (Max 8-10cm largeur)
3. **Ajouter captions académiques** (Voir section captions)
4. **Créer table des figures** (Word → Références → Table illustrations)
5. **Générer PDF final** (Word → Exporter PDF)

---

**Tous vos 7 diagrammes UML sont maintenant prêts ! 🎉**

*Créé: Juin 2026*  
*Projet: Plateforme Tutorat*  
*Format: Mermaid Diagram*
