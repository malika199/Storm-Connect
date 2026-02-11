# Guide de Configuration Admin - Back Office

## 📋 Vue d'ensemble

Le système dispose d'un **back office administrateur** séparé pour gérer la plateforme. Un seul administrateur peut exister dans le système.

## 🔐 Création du Compte Administrateur

### Méthode 1 : Script automatique (Recommandé)

1. **Créer le fichier `.env`** à la racine du projet avec :
```env
MONGODB_URI=votre_uri_mongodb
ADMIN_EMAIL=admin@votre-site.com
ADMIN_PASSWORD=VotreMotDePasseSecurise123!
JWT_SECRET=votre_secret_jwt_tres_securise
```

2. **Exécuter le script de création** :
```bash
node create-admin.js
```

Le script va :
- ✅ Vérifier si un admin existe déjà
- ✅ Créer le compte admin avec les identifiants du `.env`
- ✅ Valider automatiquement le profil admin
- ✅ Afficher les identifiants de connexion

### Méthode 2 : Création manuelle via MongoDB

Si vous préférez créer l'admin manuellement :

```javascript
// Dans MongoDB shell ou Compass
db.users.insertOne({
  email: "admin@votre-site.com",
  password_hash: "$2a$10$...", // Hash bcrypt du mot de passe
  first_name: "Admin",
  last_name: "User",
  gender: "male",
  date_of_birth: ISODate("1990-01-01"),
  role: "admin",
  is_verified: true,
  is_active: true,
  profile_validation_status: "approved",
  gdpr_consent: true,
  gdpr_consent_date: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## 🚀 Connexion au Back Office

### URL de connexion admin

**Option 1 : Page de login dédiée (Recommandée)**
```
http://localhost:3000/admin/login
```

**Option 2 : Page de login publique**
```
http://localhost:3000/login
```
(Redirige automatiquement vers `/admin` si vous êtes admin)

### Identifiants par défaut

Si vous utilisez le script avec les valeurs par défaut :
- **Email** : `admin@example.com`
- **Mot de passe** : `admin123`

⚠️ **IMPORTANT** : Changez le mot de passe après la première connexion !

## 🎯 Fonctionnalités du Back Office

### 1. Dashboard (`/admin`)
- Vue d'ensemble des statistiques
- Nombre de profils en attente de validation
- Nombre de matches en attente de validation
- Statistiques générales

### 2. Validations (`/admin/validations`)
**Onglet Profils** :
- Voir tous les profils en attente de validation
- Valider ou rejeter les profils utilisateurs
- Ajouter des notes de validation

**Onglet Matches** :
- Voir toutes les demandes de match en attente
- Valider ou rejeter les matches
- Les matches validés permettent la discussion

### 3. Matchmaking (`/admin/matchmaking`)
- Gérer les demandes de mise en relation spéciales
- Contacter les tuteurs (guardians)
- Valider les demandes de matchmaking

### 4. Utilisateurs (`/admin/users`)
- Liste de tous les utilisateurs
- Vérifier les identités
- Activer/Désactiver des comptes
- Rechercher des utilisateurs

### 5. Statistiques (`/admin/statistics`)
- Statistiques détaillées de la plateforme
- Revenus
- Abonnements actifs
- Utilisateurs actifs

## 🔒 Sécurité

### Protection des routes admin

Toutes les routes `/admin/*` sont protégées par :
1. **Authentification JWT** : L'utilisateur doit être connecté
2. **Vérification du rôle** : Seuls les utilisateurs avec `role: 'admin'` peuvent accéder
3. **Middleware `requireAdmin`** : Vérifie automatiquement le rôle

### Redirection automatique

- Si un utilisateur non-admin essaie d'accéder à `/admin/*`, il est redirigé vers `/user`
- Si un admin se connecte via `/login`, il est automatiquement redirigé vers `/admin`

## 📱 Navigation Admin

La navbar admin affiche :
- 📊 **Dashboard** : Vue d'ensemble
- ⚡ **Validations** : Gérer les validations (profils & matches)
- 💕 **Matchmaking** : Demandes de mise en relation
- 👥 **Utilisateurs** : Gestion des utilisateurs
- 📈 **Statistiques** : Statistiques détaillées

## 🔄 Workflow de Validation

### Validation des Profils

1. Un utilisateur s'inscrit → `profile_validation_status: 'pending'`
2. L'admin voit le profil dans `/admin/validations` (onglet Profils)
3. L'admin valide → `profile_validation_status: 'approved'`
4. L'utilisateur peut maintenant liker d'autres profils validés

### Validation des Matches

1. Deux utilisateurs se likent mutuellement → Match créé avec `validation_status: 'pending'`
2. L'admin reçoit une notification
3. L'admin voit le match dans `/admin/validations` (onglet Matches)
4. L'admin valide → `validation_status: 'approved'` + `is_active: true`
5. Les utilisateurs peuvent maintenant discuter

## 🛠️ Commandes Utiles

### Créer un admin
```bash
node create-admin.js
```

### Vérifier si un admin existe
```bash
# Dans MongoDB
db.users.findOne({ role: "admin" })
```

### Réinitialiser le mot de passe admin
```bash
# Utiliser bcrypt pour hasher le nouveau mot de passe
# Puis mettre à jour dans MongoDB
db.users.updateOne(
  { role: "admin" },
  { $set: { password_hash: "nouveau_hash_bcrypt" } }
)
```

## 📝 Notes Importantes

1. **Un seul admin** : Le système est conçu pour un seul administrateur
2. **Profil auto-validé** : L'admin n'a pas besoin de validation de profil
3. **Accès complet** : L'admin peut gérer tous les aspects de la plateforme
4. **Notifications** : L'admin reçoit des notifications pour les nouvelles demandes de validation

## 🆘 Dépannage

### Problème : Impossible de se connecter
- Vérifiez que l'admin existe dans la base de données
- Vérifiez le mot de passe (utilisez bcrypt pour comparer)
- Vérifiez que `is_active: true`

### Problème : Redirection vers `/user` au lieu de `/admin`
- Vérifiez que `role: 'admin'` dans la base de données
- Vérifiez le token JWT (doit contenir `role: 'admin'`)

### Problème : Erreur 403 "Accès réservé aux administrateurs"
- Vérifiez que vous êtes bien connecté avec un compte admin
- Vérifiez le middleware `requireAdmin` dans les routes

## 📞 Support

Pour toute question ou problème, consultez la documentation du projet ou contactez le développeur.
