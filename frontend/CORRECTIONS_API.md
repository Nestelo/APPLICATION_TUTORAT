# Corrections des services API pour correspondre au backend

## Problèmes identifiés
- Erreur `Pas de refreshToken` due à une mauvaise gestion du refresh token
- Erreurs 500 dues à des endpoints incorrects
- `TypeError: Cannot call a class as a function` dû à des imports incorrects

## Corrections apportées

### 1. axiosConfig.js
- **Avant** : Gestion stricte du refresh token qui causait une erreur si non présent
- **Après** : Gestion flexible avec fallback si pas de refresh token
- **Changement** : Ajout d'une gestion d'erreur plus robuste

### 2. authService.js
- **Avant** : `api.post('/auth/login/', { email, password })`
- **Après** : `api.post('/auth/login/', { email, password, include_refresh: true })`
- **Changement** : Demande explicite du refresh token pour éviter les erreurs

### 3. notificationService.js
- **Avant** : `/notifications/`, `/notifications/non_lues/`, `/notifications/{id}/marquer_lue/`
- **Après** : `/notifications/notifications/`, filtres pour les non lues, `/notifications/notifications/{id}/`
- **Changement** : Correction des endpoints pour correspondre à la structure backend

### 4. ressourceService.js
- **Avant** : `/ressources/ressources/`
- **Après** : `/ressources/resources/` (anglais)
- **Changement** : Ajout des endpoints pour actions (noter, favori, commenter) et admin

### 5. messagerieService.js
- **Avant** : `/messagerie/conversations/start/`, `/messagerie/conversations/{id}/envoyer/`
- **Après** : `/messagerie/conversations/`, `/messagerie/messages/`
- **Changement** : Utilisation des endpoints REST standards

### 6. forumService.js
- **Avant** : `/forum/questions/{id}/vue/` (mal nommé)
- **Après** : `/forum/questions/{id}/vue/` (correct) + nouveaux endpoints
- **Changement** : Ajout des endpoints de signalement et modération

## Endpoints corrigés

### Authentification
- ✅ `POST /api/auth/login/` - Login avec refresh token optionnel
- ✅ `GET /api/auth/profile/` - Profil utilisateur
- ✅ `POST /api/auth/token/refresh/` - Rafraîchir le token

### Notifications
- ✅ `GET /api/notifications/notifications/` - Liste des notifications
- ✅ `PUT /api/notifications/notifications/{id}/` - Marquer comme lu
- ✅ `POST /api/notifications/notifications/marquer-toutes-lues/` - Tout marquer comme lu

### Ressources
- ✅ `GET /api/ressources/resources/` - Liste des ressources
- ✅ `POST /api/ressources/resources/` - Créer une ressource
- ✅ `POST /api/ressources/resources/{id}/noter/` - Noter une ressource
- ✅ `POST /api/ressources/resources/{id}/favori/` - Ajouter aux favoris
- ✅ `GET /api/ressources/admin/ressources/en-attente/` - Ressources en attente (admin)

### Messagerie
- ✅ `GET /api/messagerie/conversations/` - Liste des conversations
- ✅ `POST /api/messagerie/conversations/` - Créer une conversation
- ✅ `POST /api/messagerie/messages/` - Envoyer un message
- ✅ `PUT /api/messagerie/messages/{id}/` - Marquer un message comme lu

### Forum
- ✅ `GET /api/forum/questions/` - Liste des questions
- ✅ `POST /api/forum/questions/` - Créer une question
- ✅ `POST /api/forum/reponses/` - Créer une réponse
- ✅ `POST /api/forum/votes/` - Voter pour une réponse

## Structure du frontend respectée

Les corrections ont été apportées dans la structure existante :
- `src/api/` - Services API
- `src/screens/tutor/` - Écrans tuteur (déjà existants)
- `src/screens/student/` - Écrans étudiant
- `src/screens/admin/` - Écrans admin
- `src/components/` - Composants partagés

## Tests recommandés

1. **Test de connexion** :
   ```javascript
   import { login } from './src/api/authService';
   await login('email@example.com', 'password');
   ```

2. **Test des ressources** :
   ```javascript
   import { getRessources } from './src/api/ressourceService';
   const ressources = await getRessources();
   ```

3. **Test des notifications** :
   ```javascript
   import { getNotifications } from './src/api/notificationService';
   const notifications = await getNotifications();
   ```

## Prochaines étapes

1. Redémarrer le frontend `npx expo start -c`
2. Tester la connexion avec un utilisateur existant
3. Vérifier que les erreurs 500 disparaissent
4. Tester chaque fonctionnalité (ressources, messagerie, forum, notifications)

## Note importante

Le backend utilise maintenant les endpoints suivants :
- Base URL : `http://192.168.43.210:8000/api`
- Auth : `/auth/`
- Ressources : `/ressources/`
- Messagerie : `/messagerie/`
- Notifications : `/notifications/`
- Forum : `/forum/`

Tous les services frontend ont été mis à jour pour utiliser ces endpoints correctement.
