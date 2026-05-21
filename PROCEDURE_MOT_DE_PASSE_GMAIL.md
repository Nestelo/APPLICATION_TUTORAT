# 🔐 **PROCÉDURE EXACTE - MOT DE PASSE D'APPLICATION GMAIL**

## ⚠️ **Le problème actuel**

Les mots de passe `Nestelo1010` et `Nestelo10` ne fonctionnent pas car ce ne sont pas des **mots de passe d'application** valides.

## 📋 **Étapes obligatoires à suivre**

### **1. Activer la validation en deux étapes**
- Allez sur : https://myaccount.google.com/security
- Connectez-vous avec `ndjerabeernest@gmail.com`
- Trouvez "Validation en deux étapes"
- **Activez-la** (indispensable pour les mots de passe d'application)

### **2. Créer le mot de passe d'application**
- Sur la même page de sécurité
- **Cliquez sur "Mots de passe des applications"**
- **Paramètres** :
  - Sélectionnez : **"Autre (nom personnalisé)"**
  - Nom : **"Tutorat App"**
- **Cliquez sur "Générer"**

### **3. Copier le VRAI mot de passe**
- **Gmail affichera** un mot de passe de 16 caractères
- **Format** : `xxxx xxxx xxxx xxxx` (avec espaces)
- **Exemple** : `abcd efgh ijkl mnop`
- **Copiez-le EXACTEMENT** comme il apparaît

## ⚙️ **Mise à jour dans settings.py**

Une fois que vous avez le VRAI mot de passe de 16 caractères :

```python
EMAIL_HOST_PASSWORD = 'abcd efgh ijkl mnop'  # Remplacez par le vrai mot de passe
```

## 🚨 **Important**

- **N'inventez pas** de mot de passe
- **Utilisez uniquement** celui généré par Gmail
- **Le mot de passe doit avoir 16 caractères** avec espaces

## 🔄 **Test final**

Après avoir mis le vrai mot de passe :
```bash
python test_email_smtp.py
```

**Vous devriez voir :**
```
✅ Email de test envoyé avec succès vers ndjerabeernest@gmail.com
📧 Vérifiez votre boîte de réception Gmail !
```

## 📧 **Vérification**

- **Vérifiez votre boîte Gmail** après le test
- **Cherchez l'email** avec sujet `[TEST] Email de test depuis Django`
- **Si reçu** = Configuration réussie !

---

**Veuillez suivre ces étapes exactes et me donner le VRAI mot de passe de 16 caractères généré par Gmail.**
