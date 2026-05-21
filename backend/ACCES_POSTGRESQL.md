# ACCÈS POSTGRESQL - GUIDE COMPLET

## 🐘 MÉTHODE 1 : Via Python (Django Shell)

```bash
# Ouvrir le shell Django
python manage.py shell

# Lister tous les utilisateurs
from apps.accounts.models import User
users = User.objects.all()
for user in users:
    print(f"{user.id}: {user.prenom} {user.nom} - {user.email} - {user.role}")

# Vérifier un utilisateur spécifique
user = User.objects.get(email="youssoufmoungonan@gmail.com")
print(f"ID: {user.id}, Inscrit le: {user.date_inscription}")

# Voir les tables créées
from django.db import connection
cursor = connection.cursor()
cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
tables = cursor.fetchall()
for table in tables:
    print(table[0])
```

## 🐘 MÉTHODE 2 : Via psql (ligne de commande)

```bash
# Se connecter à PostgreSQL
psql -h localhost -U postgres -d tutorat_db

# Lister les tables
\dt

# Voir les utilisateurs
SELECT id, email, nom, prenom, role, date_inscription FROM accounts_user;

# Voir les 5 derniers utilisateurs
SELECT id, email, nom, prenom, role, date_inscription 
FROM accounts_user 
ORDER BY date_inscription DESC 
LIMIT 5;

# Compter par rôle
SELECT role, COUNT(*) as count 
FROM accounts_user 
GROUP BY role;

# Quitter
\q
```

## 🐘 MÉTHODE 3 : Via GUI (pgAdmin)

1. **Installer pgAdmin** si besoin
2. **Créer une connexion** :
   - Host: localhost
   - Port: 5432
   - Database: tutorat_db
   - Username: postgres
   - Password: Nestelo10

3. **Naviguer** dans les tables :
   - `accounts_user` → Utilisateurs
   - `tutorat_offretutorat` → Offres de tutorat
   - `ressources_ressource` → Ressources
   - `forum_question` → Questions du forum

## 📋 STRUCTURE DES TABLES PRINCIPALES

### accounts_user (utilisateurs)
```sql
-- Colonnes principales
id, email, nom, prenom, role, filiere, annee, 
date_inscription, is_active, is_staff
```

### tutorat_offretutorat (offres)
```sql
-- Colonnes principales  
id, tuteur_id, titre, description, matiere, niveau,
type, tarif, est_active, date_creation
```

### ressources_ressource (ressources)
```sql
-- Colonnes principales
id, auteur_id, titre, description, matiere, niveau,
type_fichier, statut, nb_telechargements, date_publication
```

### forum_question (questions)
```sql
-- Colonnes principales
id, auteur_id, titre, contenu, matiere, tags,
est_resolue, nb_vues, date_publication
```

## 🔍 REQUÊTES UTILES

```sql
-- Utilisateurs par rôle avec pourcentage
SELECT 
    role,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM accounts_user), 1) as percentage
FROM accounts_user 
GROUP BY role;

-- Croissance mensuelle des inscriptions
SELECT 
    DATE_TRUNC('month', date_inscription) as month,
    COUNT(*) as new_users
FROM accounts_user 
GROUP BY DATE_TRUNC('month', date_inscription)
ORDER BY month DESC;

-- Dernières activités par utilisateur
SELECT 
    u.email,
    u.role,
    u.date_inscription,
    CASE 
        WHEN EXISTS(SELECT 1 FROM tutorat_seance WHERE tuteur_id = u.id LIMIT 1) 
        THEN 'Tuteur actif'
        WHEN EXISTS(SELECT 1 FROM tutorat_seance WHERE etudiant_id = u.id LIMIT 1) 
        THEN 'Étudiant actif'
        ELSE 'Inactif'
    END as activity_status
FROM accounts_user u
ORDER BY u.date_inscription DESC;
```
