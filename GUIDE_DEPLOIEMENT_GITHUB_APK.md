# Guide de Déploiement - GitHub et Génération APK

## 📋 Date : 1er Juin 2026

---

## 🚀 Partie 1 : Déploiement sur GitHub

### Étape 1 : Préparer le projet pour GitHub

#### 1.1 Vérifier le fichier .gitignore

Assurez-vous que le fichier `.gitignore` est correctement configuré pour exclure les fichiers sensibles et temporaires.

```bash
# Vérifier le .gitignore
cat .gitignore
```

**Contenu recommandé pour .gitignore :**
```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Django
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal
/media

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Node
node_modules/
npm-debug.log
yarn-error.log

# Expo
.expo/
.expo-shared/

# Android
*.apk
*.aab
*.keystore
android/app/build/

# iOS
ios/Pods/
ios/build/
*.xcworkspace

# Temporary files
*.tmp
*.temp
.DS_Store
Thumbs.db
```

#### 1.2 Nettoyer le projet

```bash
# Nettoyer les fichiers temporaires Python
find . -type d -name "__pycache__" -exec rm -rf {} +
find . -type f -name "*.pyc" -delete
find . -type f -name "*.pyo" -delete

# Nettoyer les fichiers temporaires Node
cd frontend
rm -rf node_modules/
rm -rf .expo/
cd ..

# Nettoyer les fichiers temporaires Android
cd frontend/android
./gradlew clean
cd ../..
```

#### 1.3 Commiter les modifications

```bash
# Ajouter tous les fichiers modifiés
git add .

# Commiter avec un message descriptif
git commit -m "Correction téléchargement fichiers et affichage tuteurs

- Correction erreur 500 sur /api/forum/reponses/non_lues/ (date_creation -> date)
- Correction erreur 500 sur /api/tutorat/tuteurs/10/evaluations-recentes/ (date_evaluation -> date)
- Amélioration téléchargement fichiers (utilisation fichier_url)
- Amélioration affichage informations tuteurs (matières, disponibilités, biographie)
- Ajout valeurs par défaut pour champs vides
- Ajout logs de débogage"
```

#### 1.4 Pusher vers GitHub

```bash
# Si le repository existe déjà
git push origin main

# Si c'est un nouveau repository
# 1. Créer un nouveau repository sur GitHub
# 2. Ajouter le remote
git remote add origin https://github.com/VOTRE_USERNAME/APPLICATION_TUTORAT.git
git branch -M main
git push -u origin main
```

---

## 📱 Partie 2 : Génération d'un nouveau APK

### Étape 1 : Préparer l'environnement

#### 1.1 Vérifier les dépendances

```bash
cd frontend

# Vérifier que les dépendances sont installées
npm install

# Vérifier que Expo est installé
npx expo --version
```

#### 1.2 Configurer l'application Android

**Fichier : `frontend/app.json`**

Assurez-vous que la configuration est correcte :

```json
{
  "expo": {
    "name": "Tutorat App",
    "slug": "tutorat-app",
    "version": "1.0.1",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.tutorat.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.tutorat.app",
      "versionCode": 2
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "votre-project-id"
      }
    }
  }
}
}
```

**Important :**
- Incrémentez `version` (ex: 1.0.0 → 1.0.1)
- Incrémentez `versionCode` (ex: 1 → 2)

### Étape 2 : Générer l'APK avec EAS Build

#### Option A : Utiliser EAS Build (Recommandé)

```bash
cd frontend

# Installer EAS CLI
npm install -g eas-cli

# Se connecter à Expo
eas login

# Configurer EAS
eas build:configure

# Générer l'APK
eas build --platform android --profile preview
```

**Pour un build de production :**

```bash
eas build --platform android --profile production
```

#### Option B : Utiliser Expo Classic (Alternative)

```bash
cd frontend

# Installer Expo CLI
npm install -g expo-cli

# Générer l'APK
expo build:android
```

### Étape 3 : Télécharger l'APK

Une fois le build terminé, vous recevrez un lien pour télécharger l'APK.

**Avec EAS Build :**
- Le lien sera disponible dans la console
- Vous pouvez aussi le trouver sur votre dashboard Expo : https://expo.dev

**Avec Expo Classic :**
- Le lien sera envoyé par email
- Disponible sur votre dashboard Expo

---

## 🔧 Partie 3 : Configuration du Backend pour Render.com

### Étape 1 : Préparer le fichier requirements.txt

```bash
cd backend

# Générer le fichier requirements.txt
pip freeze > requirements.txt
```

**Contenu recommandé pour requirements.txt :**
```
Django==4.2.7
djangorestframework==3.14.0
django-cors-headers==4.3.1
django-cloudinary-storage==0.3.0
cloudinary==1.36.0
Pillow==10.1.0
psycopg2-binary==2.9.9
djangorestframework-simplejwt==5.3.0
python-decouple==3.8
gunicorn==21.2.0
whitenoise==6.6.0
```

### Étape 2 : Configurer les variables d'environnement

**Fichier : `.env` (à ne pas commiter)**

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database_name

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Django
SECRET_KEY=your_secret_key
DEBUG=False
ALLOWED_HOSTS=your-app-name.onrender.com

# Email (optionnel)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
```

### Étape 3 : Créer un fichier Procfile

**Fichier : `backend/Procfile`**

```
web: gunicorn tutorat_backend.wsgi:application --log-file -
```

### Étape 4 : Déployer sur Render.com

1. Créer un compte sur https://render.com
2. Créer un nouveau "Web Service"
3. Connecter votre repository GitHub
4. Configurer :
   - **Build Command** : `pip install -r requirements.txt`
   - **Start Command** : `gunicorn tutorat_backend.wsgi:application --log-file -`
   - **Root Directory** : `backend`
5. Ajouter les variables d'environnement
6. Cliquer sur "Deploy Web Service"

---

## ✅ Partie 4 : Vérifications avant déploiement

### Checklist Frontend

- [ ] Version incrémentée dans `app.json`
- [ ] API_BASE_URL configurée pour la production
- [ ] Permissions Android configurées
- [ ] Icône et splash screen ajoutés
- [ ] Testé sur simulateur/émulateur

### Checklist Backend

- [ ] requirements.txt à jour
- [ ] Variables d'environnement configurées
- [ ] Procfile créé
- [ ] Database configurée
- [ ] Cloudinary configuré
- [ ] CORS configuré
- [ ] DEBUG=False en production

### Checklist GitHub

- [ ] .gitignore configuré
- [ ] README.md à jour
- [ ] Licence ajoutée (optionnel)
- [ ] Contributing guide (optionnel)

---

## 📝 Partie 5 : Instructions pour les utilisateurs

### Installation de l'APK

1. Télécharger l'APK depuis le lien fourni
2. Sur Android :
   - Activer l'installation depuis des sources inconnues
   - Ouvrir le fichier APK
   - Suivre les instructions d'installation

### Configuration de l'application

1. Lancer l'application
2. Se connecter avec un compte existant ou s'inscrire
3. L'application se connectera automatiquement au backend déployé sur Render.com

---

## 🎯 Résumé des corrections dans ce build

### Corrections Backend

1. **Erreur 500 sur `/api/forum/reponses/non_lues/`**
   - Changé `date_creation` → `date` dans `forum/views.py`

2. **Erreur 500 sur `/api/tutorat/tuteurs/10/evaluations-recentes/`**
   - Changé `date_evaluation` → `date` dans `tutorat/views.py`

3. **Amélioration affichage tuteurs**
   - Ajout de `photo_url` dans la réponse
   - Ajout de valeurs par défaut pour les champs vides
   - Amélioration du formatage des disponibilités

### Corrections Frontend

1. **Téléchargement de fichiers**
   - Utilisation de `fichier_url` (URL complète Cloudinary)
   - Ajout de logs de débogage
   - Amélioration des messages d'erreur
   - Appliqué à : GlobalResourcesScreen.js, MyResourcesScreen.js, GroupeRessourcesScreen.js

2. **Affichage des tuteurs**
   - Les données sont maintenant récupérées en temps réel depuis la base de données
   - Les modifications du profil tuteur sont immédiatement visibles dans la recherche

---

## 🚨 Dépannage

### Problème : Build EAS échoue

**Solution :**
```bash
# Nettoyer le cache
eas build:clean

# Réessayer
eas build --platform android --profile preview
```

### Problème : APK ne s'installe pas

**Solution :**
- Vérifier que la version est incrémentée
- Vérifier que le package name est unique
- Désinstaller l'ancienne version avant d'installer la nouvelle

### Problème : Backend ne démarre pas sur Render

**Solution :**
- Vérifier les logs dans le dashboard Render
- Vérifier que toutes les variables d'environnement sont configurées
- Vérifier que la base de données est accessible

---

## 📞 Support

Pour toute question ou problème, consultez :
- Documentation Expo : https://docs.expo.dev
- Documentation Render : https://render.com/docs
- Documentation Django : https://docs.djangoproject.com

---

## ✅ Prêt pour déploiement

Le projet est maintenant prêt pour :
1. ✅ Déploiement sur GitHub
2. ✅ Génération d'un nouveau APK
3. ✅ Déploiement du backend sur Render.com

Suivez les étapes ci-dessus pour déployer votre application.
