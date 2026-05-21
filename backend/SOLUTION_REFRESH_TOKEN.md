# Solution pour l'erreur "Pas de refreshToken"

## Problème
Le frontend affiche l'erreur `Pas de refreshToken` et `AxiosError: Request failed with status code 500` car il essaie d'utiliser un token de rafraîchissement qui n'existe pas dans le stockage local.

## Solutions disponibles

### Solution 1: Désactiver l'utilisation du refresh token (recommandé)
Modifiez la requête de login pour inclure le paramètre `include_refresh: false`:

```javascript
// Au lieu de:
const response = await axios.post('http://localhost:8000/api/auth/login/', {
  email,
  password
});

// Utilisez:
const response = await axios.post('http://localhost:8000/api/auth/login/', {
  email,
  password,
  include_refresh: false  // Ne demande pas de refresh token
});
```

### Solution 2: Utiliser le refresh token
Si vous voulez utiliser le refresh token, stockez-le lors de la connexion:

```javascript
// Stocker les tokens
const login = async (email, password) => {
  const response = await axios.post('http://localhost:8000/api/auth/login/', {
    email,
    password
  });
  
  const { access, refresh, user } = response.data;
  
  // Stocker les tokens
  localStorage.setItem('access_token', access);
  if (refresh) {
    localStorage.setItem('refresh_token', refresh);
  }
  localStorage.setItem('user', JSON.stringify(user));
  
  return response.data;
};

// Rafraîchir le token
const refreshToken = async () => {
  const refresh_token = localStorage.getItem('refresh_token');
  
  if (!refresh_token) {
    throw new Error('Pas de refreshToken');
  }
  
  try {
    const response = await axios.post('http://localhost:8000/api/auth/token/refresh/', {
      refresh: refresh_token
    });
    
    const { access } = response.data;
    localStorage.setItem('access_token', access);
    
    return access;
  } catch (error) {
    // Si le refresh token est invalide, déconnecter l'utilisateur
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    throw error;
  }
};
```

### Solution 3: Reconnexion automatique
Si vous n'avez pas de refresh token, vous pouvez implémenter une reconnexion automatique:

```javascript
const apiRequest = async (url, options = {}) => {
  try {
    const response = await axios(url, options);
    return response;
  } catch (error) {
    if (error.response?.status === 401) {
      // Token expiré, essayer de se reconnecter
      const credentials = getStoredCredentials(); // email et password stockés
      if (credentials) {
        await login(credentials.email, credentials.password);
        // Réessayer la requête originale
        return axios(url, options);
      }
    }
    throw error;
  }
};
```

## Endpoints disponibles

### Authentification
- `POST /api/auth/login/` - Connexion (retourne access et refresh token)
- `POST /api/auth/register/` - Inscription
- `POST /api/auth/token/refresh/` - Rafraîchir le token (nécessite refresh token)
- `POST /api/auth/token/verify/` - Vérifier un token
- `GET /api/auth/profile/` - Obtenir le profil utilisateur

### Options de connexion
```javascript
// Option 1: Sans refresh token (plus simple)
{
  email: "user@example.com",
  password: "password",
  include_refresh: false
}
// Retourne: { access: "...", user: {...} }

// Option 2: Avec refresh token (par défaut)
{
  email: "user@example.com", 
  password: "password"
}
// Retourne: { access: "...", refresh: "...", user: {...} }
```

## Recommandation

Pour simplifier, utilisez **Solution 1** (désactiver le refresh token) en ajoutant `include_refresh: false` à votre requête de login. L'access token a une durée de vie de 1 jour, ce qui est suffisant pour une session de développement.

## Configuration JWT côté serveur

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),      # 1 jour
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),      # 7 jours
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

L'access token est valide pendant 1 jour, ce qui évite la nécessité de rafraîchir fréquemment pendant le développement.
