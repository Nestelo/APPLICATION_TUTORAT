# Guide de Configuration API Brevo pour l'Envoi d'Emails sur Render

## Problème Identifié

Le diagnostic a montré que :
- ✅ La configuration SMTP fonctionne correctement en local
- ❌ Render bloque les connexions SMTP sortantes sur les ports standards
- ✅ Solution : Utiliser l'API HTTP Brevo qui contourne cette restriction

## Solution Implémentée

J'ai créé un système hybride qui utilise l'API Brevo par défaut avec fallback vers le backend console si l'API échoue.

## Étapes de Configuration

### 1. Obtenir une Clé API Brevo

1. Connectez-vous à votre compte Brevo : https://app.brevo.com/
2. Allez dans : `SMTP & API` → `API Keys`
3. Cliquez sur `+ Add a new API key`
4. Donnez un nom à votre clé (ex: "Render Production")
5. Sélectionnez les droits : `Access transactional email API`
6. Copiez la clé API générée (elle commence par `xkeysib-...`)

### 2. Configurer les Variables d'Environnement sur Render

Dans le dashboard Render de votre application backend, ajoutez/modifiez ces variables d'environnement :

```
EMAIL_HOST_PASSWORD = votre-clé-api-ici
DEFAULT_FROM_EMAIL = ndjerabeernest@gmail.com
EMAIL_HOST = smtp-relay.brevo.com
EMAIL_HOST_USER = ad1e50001@smtp-brevo.com
EMAIL_PORT = 587
EMAIL_USE_TLS = True
```

**IMPORTANT :** Remplacez `votre-clé-api-ici` par votre clé API Brevo (commence par `xkeysib-...`).

### 3. Déployer les Modifications

Les fichiers suivants ont été modifiés/créés :

1. **backend/apps/messagerie/brevo_api_client.py** (NOUVEAU)
   - Client API Brevo pour l'envoi d'emails via HTTP

2. **backend/apps/messagerie/email_views.py** (MODIFIÉ)
   - Utilise maintenant l'API Brevo par défaut
   - Fallback vers console backend si API échoue
   - Envoi d'emails en HTML au lieu de texte brut

3. **backend/tutorat_backend/settings.py** (MODIFIÉ)
   - Clé API Brevo mise à jour avec votre nouvelle clé

4. **backend/test_smtp_connection.py** (NOUVEAU)
   - Script de diagnostic SMTP (utile pour tests futurs)

5. **backend/test_brevo_api.py** (NOUVEAU)
   - Script de test pour l'API Brevo

6. **backend/tutorat_backend/requirements.txt** (VÉRIFIÉ)
   - La dépendance `requests==2.32.5` est déjà présente

### 4. Tester le Déploiement

Après déploiement sur Render, testez l'envoi d'email :

1. Connectez-vous à votre application
2. Créez un nouveau message email
3. Cliquez sur "Envoyer"
4. Vérifiez les logs Render pour voir si l'email est envoyé via API Brevo

**Logs attendus en cas de succès :**
```
** EMAIL ENVOYÉ VIA API BREVO vers destinataire@example.com **
** Sujet: [TUTORAT] Votre sujet **
** ID: uuid-ici **
** Message ID Brevo: message-id-ici **
```

**Logs en cas de fallback (API non disponible) :**
```
** ERREUR: Impossible de se connecter à l'API Brevo **
** EMAIL ENVOYÉ VIA CONSOLE (fallback) vers destinataire@example.com **
⚠️ API Brevo non disponible, email envoyé en mode console
```

## Avantages de Cette Solution

1. **Contourne les restrictions SMTP de Render** - Utilise HTTP au lieu de SMTP
2. **Plus fiable** - Pas de timeouts de connexion
3. **Fallback automatique** - Si l'API échoue, utilise le backend console
4. **Emails en HTML** - Meilleure présentation
5. **Logs détaillés** - Facile à déboguer
6. **Même fournisseur** - Pas besoin de changer de compte Brevo

## Dépannage

### Si l'API Brevo ne fonctionne pas

1. **Vérifiez votre clé API** : Assurez-vous qu'elle est valide et a les droits nécessaires
2. **Vérifiez les logs Render** : Regardez les erreurs dans les logs
3. **Testez localement** : Utilisez le script `test_smtp_connection.py` pour tester
4. **Contactez le support Brevo** : Si la clé API semble correcte mais ne fonctionne pas

### Si vous voulez revenir au SMTP

Si Render débloque les ports SMTP à l'avenir, vous pouvez :

1. Remplacer le code dans `email_views.py` par l'ancienne version
2. Utiliser les identifiants SMTP originaux
3. Supprimer le fichier `brevo_api_client.py`

## Résumé

La configuration SMTP originale était correcte, mais Render bloque les connexions SMTP sortantes. La solution API Brevo contourne cette limitation et permet d'envoyer de vrais emails sur Render sans timeout ni crash de worker.
