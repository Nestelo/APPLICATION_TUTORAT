# 🔧 **CONFIGURATION GMAIL - MOT DE PASSE D'APPLICATION**

## 📧 **Étape 1: Activer la validation en deux étapes**

1. **Allez sur** : https://myaccount.google.com/security
2. **Connectez-vous** avec `ndjerabeernest@gmail.com`
3. **Activez "Validation en deux étapes"**
   - Cliquez sur "Validation en deux étapes"
   - Suivez les instructions (téléphone, etc.)

## 🔐 **Étape 2: Créer un mot de passe d'application**

1. **Sur la même page** de sécurité
2. **Cliquez sur "Mots de passe des applications"**
3. **Sélectionnez** :
   - Application : **"Autre (nom personnalisé)"**
   - Nom : **"Tutorat App"**
4. **Cliquez sur "Générer"**
5. **Copiez le mot de passe** de 16 caractères
   - **Exemple** : `abcd efgh ijkl mnop`
   - **Notez-le bien** (il ne s'affichera plus jamais !)

## ⚙️ **Étape 3: Mettre à jour le mot de passe**

Remplacez dans `settings.py` :

```python
# Ancienne configuration
EMAIL_HOST_PASSWORD = 'ndje123@#ERnest'  # ❌ Incorrect

# Nouvelle configuration
EMAIL_HOST_PASSWORD = 'abcd efgh ijkl mnop'  # ✅ Mot de passe application
```

## 🚀 **Étape 4: Tester à nouveau**

```bash
python test_email_smtp.py
```

## 📱 **Vérification**

Après le test :
1. **Vérifiez votre boîte Gmail** `ndjerabeernest@gmail.com`
2. **Cherchez l'email** avec sujet `[TEST] Email de test depuis Django`
3. **Si reçu** = ✅ Configuration réussie !

## 🎯 **Une fois configuré**

Le système enverra des **vrais emails** quand vous :
- Cliquez sur l'icône email dans GestionUtilisateurs
- Envoyez un message à un utilisateur
- Le destinataire recevra un email réel dans sa boîte

## ⚠️ **Important**

- **N'utilisez jamais** votre mot de passe Gmail normal
- **Utilisez uniquement** le mot de passe d'application généré
- **Gardez le mot de passe** confidentiel

**Faites-moi savoir quand vous avez créé le mot de passe d'application et je mettrai à jour la configuration !**
