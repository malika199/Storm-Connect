# Guide de Dépannage - Connexion Admin

## 🔍 Diagnostic du Problème

Si vous ne pouvez pas vous connecter en tant qu'admin, suivez ces étapes :

### Étape 1 : Vérifier que l'admin existe

```bash
node check-admin.js
```

Ce script va :
- ✅ Vérifier si l'admin existe dans la base de données
- ✅ Tester le mot de passe
- ✅ Afficher le statut du compte (actif, vérifié, etc.)
- ✅ Lister tous les admins existants si l'email ne correspond pas

### Étape 2 : Créer l'admin (si nécessaire)

```bash
node create-admin.js
```

Ce script va créer l'admin avec les identifiants du fichier `.env` :
- `ADMIN_EMAIL` : Email de l'admin
- `ADMIN_PASSWORD` : Mot de passe de l'admin

### Étape 3 : Réinitialiser le mot de passe (si nécessaire)

Si le mot de passe ne fonctionne pas :

```bash
node reset-admin-password.js
```

Ce script va réinitialiser le mot de passe avec la valeur de `ADMIN_PASSWORD` dans `.env`.

### Étape 4 : Activer le compte (si désactivé)

Si le compte est désactivé :

```bash
node activate-admin.js
```

## 📋 Identifiants par Défaut

Si vous utilisez les valeurs par défaut du script :
- **Email** : `admin@example.com` (ou celui dans `.env`)
- **Mot de passe** : `admin123` (ou celui dans `.env`)

## 🔧 Problèmes Courants

### Problème 1 : "Email ou mot de passe incorrect"

**Causes possibles** :
1. L'admin n'existe pas dans la base de données
2. Le mot de passe dans `.env` ne correspond pas
3. L'email dans `.env` ne correspond pas

**Solutions** :
1. Exécutez `node check-admin.js` pour diagnostiquer
2. Exécutez `node create-admin.js` pour créer l'admin
3. Exécutez `node reset-admin-password.js` pour réinitialiser le mot de passe

### Problème 2 : "Compte désactivé"

**Cause** : Le compte admin a été désactivé (`is_active: false`)

**Solution** :
```bash
node activate-admin.js
```

### Problème 3 : L'admin existe mais avec un autre email

**Solution** :
1. Exécutez `node check-admin.js` pour voir tous les admins
2. Utilisez l'email affiché dans la liste
3. Ou modifiez `ADMIN_EMAIL` dans `.env` pour correspondre

### Problème 4 : Erreur de connexion MongoDB

**Cause** : MongoDB n'est pas accessible ou l'URI est incorrecte

**Solution** :
1. Vérifiez que MongoDB est démarré
2. Vérifiez `MONGODB_URI` dans `.env`
3. Testez la connexion : `mongosh "votre_uri"`

## 🎯 Scripts Disponibles

### `check-admin.js`
Vérifie l'existence de l'admin et teste le mot de passe.

### `create-admin.js`
Crée un nouvel admin avec les identifiants du `.env`.

### `reset-admin-password.js`
Réinitialise le mot de passe de l'admin existant.

### `activate-admin.js`
Active le compte admin (met `is_active: true`).

## 📝 Fichier .env Requis

Assurez-vous que votre fichier `.env` contient :

```env
MONGODB_URI=mongodb://localhost:27017/site_rencontre
ADMIN_EMAIL=admin@sitederencontre.com
ADMIN_PASSWORD=admin123
JWT_SECRET=votre_secret_jwt
```

## ✅ Vérification Finale

Après avoir créé/réinitialisé l'admin, testez la connexion :

1. Allez sur `http://localhost:3000/admin/login`
2. Entrez l'email : `admin@sitederencontre.com`
3. Entrez le mot de passe : `admin123`
4. Vous devriez être redirigé vers `/admin`

## 🆘 Si Rien Ne Fonctionne

1. Vérifiez les logs du serveur pour voir les erreurs
2. Vérifiez la console du navigateur (F12)
3. Vérifiez que le serveur backend est démarré
4. Vérifiez que MongoDB est accessible
5. Vérifiez que les variables d'environnement sont chargées

## 📞 Commandes Utiles

```bash
# Vérifier l'admin
node check-admin.js

# Créer l'admin
node create-admin.js

# Réinitialiser le mot de passe
node reset-admin-password.js

# Activer le compte
node activate-admin.js

# Vérifier MongoDB (si installé localement)
mongosh mongodb://localhost:27017/site_rencontre
```
