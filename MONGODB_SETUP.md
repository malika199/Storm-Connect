# Configuration MongoDB

## Installation de MongoDB

### Option 1 : MongoDB Community Server (Recommandé pour le développement local)

1. **Télécharger MongoDB** :
   - Allez sur : https://www.mongodb.com/try/download/community
   - Sélectionnez Windows et téléchargez l'installateur MSI

2. **Installer MongoDB** :
   - Exécutez l'installateur
   - Choisissez "Complete" installation
   - Cochez "Install MongoDB as a Service"
   - Notez le chemin d'installation (par défaut : `C:\Program Files\MongoDB\Server\7.0\`)

3. **Vérifier l'installation** :
   - MongoDB devrait démarrer automatiquement comme service Windows
   - Vérifiez dans les Services Windows (Win + R, tapez `services.msc`)
   - Cherchez "MongoDB Server"

### Option 2 : MongoDB Atlas (Cloud - Gratuit)

1. **Créer un compte** :
   - Allez sur : https://www.mongodb.com/cloud/atlas/register
   - Créez un compte gratuit

2. **Créer un cluster** :
   - Choisissez le plan "Free" (M0)
   - Sélectionnez une région proche
   - Créez le cluster (cela peut prendre quelques minutes)

3. **Configurer l'accès** :
   - Cliquez sur "Connect"
   - Créez un utilisateur de base de données (nom d'utilisateur et mot de passe)
   - Ajoutez votre IP à la whitelist (ou utilisez 0.0.0.0/0 pour toutes les IPs en développement)
   - Choisissez "Connect your application"
   - Copiez la chaîne de connexion (elle ressemble à : `mongodb+srv://username:password@cluster.mongodb.net/`)

### Option 3 : Docker (si Docker est installé)

```powershell
docker run --name mongodb -p 27017:27017 -d mongo
```

## Configuration du projet

### 1. Variables d'environnement

Créez ou modifiez le fichier `.env` à la racine du projet :

#### Pour MongoDB local :
```env
MONGODB_URI=mongodb://localhost:27017/site_rencontre
# ou
DATABASE_URL=mongodb://localhost:27017/site_rencontre
```

#### Pour MongoDB Atlas :
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/site_rencontre?retryWrites=true&w=majority
# ou
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/site_rencontre?retryWrites=true&w=majority
```

**Important** : Remplacez `username` et `password` par vos identifiants MongoDB Atlas.

### 2. Installer les dépendances

```bash
npm install
```

Cela installera `mongoose` (le driver MongoDB pour Node.js).

### 3. Démarrer le serveur

```bash
npm run server
```

Vous devriez voir :
```
✅ Connected to MongoDB database
🚀 Server running on port 5000
```

## Vérifier la connexion

### Via MongoDB Compass (Interface graphique)

1. **Télécharger MongoDB Compass** :
   - https://www.mongodb.com/try/download/compass

2. **Se connecter** :
   - Pour MongoDB local : `mongodb://localhost:27017`
   - Pour MongoDB Atlas : utilisez la chaîne de connexion de votre cluster

3. **Vérifier les collections** :
   - Une fois connecté, vous devriez voir la base de données `site_rencontre`
   - Les collections seront créées automatiquement lors de la première utilisation

### Via MongoDB Shell (mongo.exe)

```powershell
# Se connecter à MongoDB local
mongo

# Ou avec le chemin complet
"C:\Program Files\MongoDB\Server\7.0\bin\mongo.exe"

# Lister les bases de données
show dbs

# Utiliser la base de données
use site_rencontre

# Lister les collections
show collections
```

## Collections créées automatiquement

Les collections suivantes seront créées automatiquement lors de la première utilisation :

- `users` - Utilisateurs
- `guardians` - Tuteurs
- `searchcriterias` - Critères de recherche
- `matchmakings` - Demandes de mise en relation
- `groupchats` - Groupes de discussion
- `groupmessages` - Messages dans les groupes
- `notifications` - Notifications
- `subscriptions` - Abonnements
- `payments` - Paiements
- `adminstatistics` - Statistiques admin
- `activitylogs` - Logs d'activité (RGPD)

## Avantages de MongoDB

✅ **Pas besoin de schéma SQL** - Les modèles sont définis dans le code  
✅ **Installation simple** - Pas besoin de configurer des tables  
✅ **Développement rapide** - Les collections sont créées automatiquement  
✅ **Flexible** - Facile d'ajouter de nouveaux champs  
✅ **Gratuit** - MongoDB Community est gratuit  
✅ **Cloud disponible** - MongoDB Atlas offre un plan gratuit  

## Dépannage

### "Connection refused" ou "ECONNREFUSED"

- Vérifiez que MongoDB est démarré (Services Windows)
- Vérifiez que le port 27017 n'est pas utilisé par un autre service
- Vérifiez l'URL de connexion dans `.env`

### "Authentication failed" (MongoDB Atlas)

- Vérifiez le nom d'utilisateur et le mot de passe
- Vérifiez que votre IP est dans la whitelist
- Vérifiez que la chaîne de connexion est correcte

### "Database not found"

- C'est normal ! MongoDB crée la base de données automatiquement lors de la première écriture
- Aucune action nécessaire

## Migration depuis PostgreSQL

Si vous aviez des données dans PostgreSQL, vous devrez les migrer manuellement ou recréer les utilisateurs via l'interface d'inscription.
