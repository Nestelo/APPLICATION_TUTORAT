# Guide de test d'intégration Frontend-Backend

## Étapes de test

### 1. Démarrer le backend
```bash
cd c:\Users\Agathe\OneDrive\Desktop\APPLICATION_TUTORAT\backend
python manage.py runserver 0.0.0.0:8000
```

### 2. Démarrer le frontend
```bash
cd c:\Users\Agathe\OneDrive\Desktop\APPLICATION_TUTORAT\frontend
npx expo start -c
```

### 3. Tests d'authentification

#### Test de connexion
```javascript
// Dans la console de debug Expo
import { login } from './src/api/authService';

// Test avec un utilisateur existant
const result = await login('email@example.com', 'password');
console.log(result);
// Devrait retourner: { success: true, user: {...} }
```

#### Test de profil
```javascript
import { getProfile } from './src/api/authService';

const profile = await getProfile();
console.log(profile);
// Devrait retourner: { success: true, data: {...} }
```

### 4. Tests des services API

#### Test des notifications
```javascript
import { getNotifications, getUnreadCount } from './src/api/notificationService';

// Tester la récupération des notifications
const notifications = await getNotifications();
console.log(notifications);

// Tester le compteur de notifications non lues
const unreadCount = await getUnreadCount();
console.log(unreadCount);
```

#### Test des services tuteur
```javascript
import { getOffres, getSeances } from './src/api/tutorService';

// Tester les offres
const offres = await getOffres({ tuteur: 1 });
console.log(offres);

// Tester les séances
const seances = await getSeances({ tuteur: 1 });
console.log(seances);
```

### 5. Tests des écrans

#### Navigation vers le tableau de bord tuteur
1. Connectez-vous avec un compte tuteur
2. Naviguez vers `TutorDashboardScreen`
3. Vérifiez que :
   - Les séances s'affichent correctement
   - Les offres s'affichent correctement
   - Le compteur de notifications fonctionne
   - Les boutons de navigation fonctionnent

#### Test des erreurs
1. Essayez de vous connecter avec de mauvais identifiants
2. Vérifiez que le message d'erreur s'affiche
3. Essayez d'accéder à une page sans être connecté
4. Vérifiez que la redirection vers login fonctionne

### 6. Vérification des endpoints

#### Backend - Vérifiez que ces endpoints fonctionnent :
```bash
# Authentification
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "email@example.com", "password": "password", "include_refresh": true}'

# Notifications
curl -X GET http://localhost:8000/api/notifications/notifications/ \
  -H "Authorization: Bearer VOTRE_TOKEN"

# Tutorat
curl -X GET http://localhost:8000/api/tutorat/offres/ \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### 7. Dépannage

#### Erreurs courantes et solutions :

**Erreur 401 Unauthorized**
- Vérifiez que le token est bien stocké
- Vérifiez que le token n'est pas expiré
- Déconnectez-vous et reconnectez-vous

**Erreur 500 Server Error**
- Vérifiez les logs du backend
- Assurez-vous que tous les modèles sont bien migrés
- Vérifiez que les permissions sont correctes

**Erreur "Cannot call a class as a function"**
- Vérifiez les imports dans les composants
- Assurez-vous que les exports sont corrects
- Redémarrez le frontend avec `npx expo start -c`

**Erreur de réseau**
- Vérifiez que l'IP dans axiosConfig.js est correcte
- Assurez-vous que le backend tourne sur le bon port
- Vérifiez que le firewall ne bloque pas la connexion

### 8. Checklist de validation

- [ ] Backend démarre sans erreur
- [ ] Frontend démarre sans erreur
- [ ] Connexion utilisateur fonctionne
- [ ] Tableau de bord tuteur s'affiche
- [ ] Les notifications s'affichent
- [ ] Les offres de tutorat s'affichent
- [ ] Les séances s'affichent
- [ ] La navigation entre écrans fonctionne
- [ ] Les erreurs sont gérées correctement
- [ ] Le refresh token fonctionne

### 9. Logs à surveiller

#### Frontend (Expo)
- Erreurs de connexion réseau
- Erreurs d'authentification
- Erreurs de navigation

#### Backend (Django)
- Erreurs de validation
- Erreurs de permissions
- Erreurs de base de données

### 10. Prochaines étapes

Si tous les tests passent :
1. Testez les autres rôles (étudiant, admin)
2. Testez les fonctionnalités avancées (création d'offres, messagerie, etc.)
3. Testez sur un appareil physique
4. Optimisez les performances

## Notes importantes

- L'IP `192.168.43.210` doit être adaptée à votre configuration réseau
- Assurez-vous que la base de données PostgreSQL est accessible
- Les tokens JWT expirent après 1 jour (access) et 7 jours (refresh)
- Le frontend gère automatiquement le rafraîchissement des tokens
