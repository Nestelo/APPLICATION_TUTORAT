# 🎓 Tutorat INSTA - Plateforme de Tutorat

Application mobile et backend pour la gestion de tutorat entre tuteurs et étudiants.

## 📱 Fonctionnalités

### Pour les Étudiants
- 🔍 **Recherche de tuteurs** : Trouvez des tuteurs par matière, niveau, disponibilité
- 📚 **Ressources éducatives** : Accédez aux ressources globales, de groupe et personnelles
- 💬 **Forum** : Posez des questions et obtenez des réponses
- 📥 **Téléchargement de fichiers** : Téléchargez des ressources stockées sur Cloudinary
- 👥 **Groupes de tutorat** : Rejoignez ou créez des groupes d'étude
- 📊 **Statistiques** : Suivez votre progression

### Pour les Tuteurs
- 👤 **Gestion du profil** : Mettez à jour vos matières, disponibilités, biographie
- 📅 **Gestion des disponibilités** : Définissez vos créneaux horaires
- 💰 **Offres de tutorat** : Créez des offres avec tarifs et types de séance
- 📈 **Évaluations** : Recevez des évaluations de la part des étudiants
- 📊 **Statistiques** : Suivez vos performances

## 🏗️ Architecture

### Backend (Django REST Framework)
- **Framework** : Django 4.2.7
- **API** : Django REST Framework
- **Base de données** : PostgreSQL
- **Stockage fichiers** : Cloudinary
- **Authentification** : JWT (SimpleJWT)

### Frontend (React Native + Expo)
- **Framework** : React Native
- **Outil de build** : Expo
- **Navigation** : React Navigation
- **État** : React Hooks + AsyncStorage

## 🚀 Installation

### Prérequis
- Node.js 18+
- Python 3.10+
- PostgreSQL
- Expo CLI

### Backend

```bash
cd backend

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos configurations

# Exécuter les migrations
python manage.py migrate

# Créer un superutilisateur
python manage.py createsuperuser

# Lancer le serveur
python manage.py runserver
```

### Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer l'application
npx expo start
```

## 📱 Build APK

### Avec EAS Build (Recommandé)

```bash
cd frontend

# Installer EAS CLI
npm install -g eas-cli

# Se connecter
eas login

# Générer l'APK
eas build --platform android --profile preview
```

### Avec Expo Classic

```bash
cd frontend

# Installer Expo CLI
npm install -g expo-cli

# Générer l'APK
expo build:android
```

## 🌐 Déploiement

### Backend sur Render.com

1. Créer un compte sur [Render.com](https://render.com)
2. Connecter votre repository GitHub
3. Configurer les variables d'environnement
4. Déployer

Voir [GUIDE_DEPLOIEMENT_GITHUB_APK.md](GUIDE_DEPLOIEMENT_GITHUB_APK.md) pour les instructions détaillées.

### Frontend sur Google Play

1. Générer un signed APK ou AAB
2. Créer un compte Google Play Developer
3. Soumettre l'application

## 🔧 Configuration

### Variables d'environnement Backend

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

### Configuration Frontend

Modifier `frontend/src/config/api.js` :

```javascript
export const API_BASE_URL = 'https://your-backend-url.onrender.com/api';
```

## 📝 Corrections dans la version 1.0.1

### Backend
- ✅ Correction erreur 500 sur `/api/forum/reponses/non_lues/` (date_creation → date)
- ✅ Correction erreur 500 sur `/api/tutorat/tuteurs/10/evaluations-recentes/` (date_evaluation → date)
- ✅ Amélioration affichage tuteurs (matières, disponibilités, biographie)
- ✅ Ajout de valeurs par défaut pour les champs vides

### Frontend
- ✅ Correction téléchargement fichiers (utilisation fichier_url)
- ✅ Amélioration messages d'erreur
- ✅ Ajout logs de débogage
- ✅ Synchronisation automatique des modifications de profil tuteur

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez suivre ces étapes :

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos modifications (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

## 👥 Auteurs

- **Votre Nom** - *Travail initial*

## 🙏 Remerciements

- Expo pour le framework React Native
- Django pour le backend
- Cloudinary pour le stockage de fichiers
- Render.com pour l'hébergement

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub.

---

**Version actuelle** : 1.0.1  
**Dernière mise à jour** : 1er Juin 2026
