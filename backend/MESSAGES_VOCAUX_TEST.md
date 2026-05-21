# 🎤 Test des Messages Vocaux du Forum

## 📋 Vue d'ensemble

Ce document décrit comment tester la fonctionnalité des messages vocaux dans le forum de l'application de tutorat.

## 🔧 Prérequis

### Backend
- Django serveur démarré sur `192.168.43.210:8000`
- Base de données PostgreSQL configurée
- Models `Question`, `Reponse`, `MessageVocal` créés

### Frontend
- Application React Native/Expo fonctionnelle
- Utilisateur connecté (tuteur ou étudiant)
- Accès à l'API backend

## 🧪 Tests à effectuer

### 1. Test de connexion API
```bash
# Vérifier que l'API est accessible
curl http://192.168.43.210:8000/api/forum/questions/
```

### 2. Test côté Tuteur

#### Étape 1: Accéder à l'écran de test
1. Se connecter comme tuteur
2. Aller dans le tableau de bord
3. Cliquer sur "🎤 Test Messages Vocaux"

#### Étape 2: Créer un message vocal
1. Sélectionner une question existante
2. Enregistrer un message vocal (max 30 secondes)
3. Vérifier que le message est bien envoyé

#### Étape 3: Vérifier l'envoi
- ✅ Message "Message vocal envoyé avec succès"
- ✅ Rechargement automatique des questions
- ✅ Pas d'erreur dans la console

### 3. Test côté Étudiant

#### Étape 1: Accéder au forum
1. Se connecter comme étudiant
2. Aller dans la section Forum
3. Ouvrir une question avec des réponses

#### Étape 2: Vérifier l'affichage
- ✅ Messages vocaux affichés avec l'icône 🎤
- ✅ Nom de l'auteur visible
- ✅ Durée du message affichée
- ✅ Lecteur audio fonctionnel

## 🐛 Dépannage

### Erreurs courantes

#### 1. "Bad Request: /api/forum/messages-vocaux/"
**Cause**: Envoi de `question` au lieu de `reponse`
**Solution**: Le code a été corrigé pour créer automatiquement une réponse

#### 2. "Network Error"
**Cause**: Serveur backend non démarré ou mauvaise URL
**Solution**: Vérifier que le serveur Django tourne sur la bonne IP

#### 3. "Fichier audio requis"
**Cause**: FormData mal formaté
**Solution**: Utiliser le service `envoyerMessageVocal()` corrigé

### Logs à vérifier

#### Backend Django
```bash
# Logs du serveur
python manage.py runserver 192.168.43.210:8000
```

#### Frontend React Native
- Console de l'application
- Network tab dans les outils de développement

## 📊 Résultats attendus

### Test réussi
- ✅ Tuteur peut enregistrer un message vocal
- ✅ Message vocal est sauvegardé dans la base de données
- ✅ Étudiant peut voir et écouter le message vocal
- ✅ Aucune erreur dans les logs

### Test échoué
- ❌ Messages d'erreur dans la console
- ❌ Messages vocaux non sauvegardés
- ❌ Étudiant ne peut pas voir les messages

## 🔄 Flux de test complet

1. **Démarrer le backend**
   ```bash
   cd backend
   python manage.py runserver 192.168.43.210:8000
   ```

2. **Démarrer le frontend**
   ```bash
   cd frontend
   expo start
   ```

3. **Tester comme tuteur**
   - Connexion avec compte tuteur
   - Accès à l'écran de test
   - Enregistrement et envoi d'un message vocal

4. **Tester comme étudiant**
   - Connexion avec compte étudiant
   - Accès au forum
   - Visualisation et écoute des messages vocaux

## 🎯 Validation finale

Pour valider que tout fonctionne correctement :

1. **Vérifier la base de données**
   ```sql
   SELECT COUNT(*) FROM forum_messagevocal;
   ```

2. **Vérifier les fichiers**
   - Les fichiers audio sont bien stockés dans `media/messages_vocaux/`

3. **Vérifier l'API**
   - `GET /api/forum/messages-vocaux/` retourne les messages
   - `POST /api/forum/messages-vocaux/` accepte les nouveaux messages

## 📝 Notes importantes

- Les messages vocaux sont attachés aux réponses, pas directement aux questions
- Une réponse texte est créée automatiquement si nécessaire
- Le format audio supporté: `.3gp`, `.m4a`, `.mp3`, `.wav`
- Durée maximale: 180 secondes (configurable)

## 🚀 Prochaines étapes

Après validation réussie :
1. Déployer en production
2. Ajouter des notifications pour les nouveaux messages vocaux
3. Implémenter la suppression des messages vocaux
4. Ajouter des statistiques d'utilisation
