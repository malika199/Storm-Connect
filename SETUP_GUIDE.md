# Guide de Configuration Rapide

## 🔧 Configuration du fichier .env

### 1. Base de Données MongoDB (OBLIGATOIRE)

Vous avez deux options :

#### Option A : MongoDB Local (Recommandé pour le développement)
```env
MONGODB_URI=mongodb://localhost:27017/site_rencontre
# ou
DATABASE_URL=mongodb://localhost:27017/site_rencontre
```

#### Option B : MongoDB Atlas (Cloud - Gratuit)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/site_rencontre?retryWrites=true&w=majority
# ou
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/site_rencontre?retryWrites=true&w=majority
```

**Important :** 
- Pour MongoDB local : Assurez-vous que MongoDB est installé et démarré
- Pour MongoDB Atlas : Remplacez `username` et `password` par vos identifiants, et `cluster` par le nom de votre cluster

### 2. JWT_SECRET (OBLIGATOIRE)

Le JWT_SECRET est utilisé pour signer les tokens d'authentification. Vous devez le définir :

```env
JWT_SECRET=votre-cle-secrete-tres-longue-et-aleatoire
```

**Générer une clé secrète :**
- Vous pouvez utiliser n'importe quelle chaîne de caractères longue et aléatoire
- Exemple : `ma-super-cle-secrete-123456789-abcdefghijklmnop`
- Ou utilisez un générateur en ligne : https://randomkeygen.com/

### 3. Installation de MongoDB

#### Option 1 : MongoDB Local

1. **Télécharger MongoDB** :
   - Allez sur : https://www.mongodb.com/try/download/community
   - Sélectionnez Windows et téléchargez l'installateur MSI

2. **Installer MongoDB** :
   - Exécutez l'installateur
   - Choisissez "Complete" installation
   - Cochez "Install MongoDB as a Service"
   - MongoDB démarrera automatiquement

3. **Vérifier l'installation** :
   - Vérifiez dans les Services Windows (Win + R, tapez `services.msc`)
   - Cherchez "MongoDB Server" - il devrait être en cours d'exécution

#### Option 2 : MongoDB Atlas (Cloud)

1. **Créer un compte** :
   - Allez sur : https://www.mongodb.com/cloud/atlas/register
   - Créez un compte gratuit

2. **Créer un cluster** :
   - Choisissez le plan "Free" (M0)
   - Sélectionnez une région proche
   - Créez le cluster (cela peut prendre quelques minutes)

3. **Configurer l'accès** :
   - Cliquez sur "Connect"
   - Créez un utilisateur de base de données
   - Ajoutez votre IP à la whitelist (ou utilisez 0.0.0.0/0 pour toutes les IPs en développement)
   - Choisissez "Connect your application"
   - Copiez la chaîne de connexion dans votre `.env`

**Note :** Les collections seront créées automatiquement lors de la première utilisation. Aucun schéma SQL à exécuter !

### 4. Vérifier la Connexion

Pour tester si votre configuration fonctionne :

```bash
# Installer les dépendances (si pas déjà fait)
npm install

# Démarrer le serveur
npm run server
```

Vous devriez voir :
```
✅ Connected to MongoDB database
🚀 Server running on port 5000
```

Si vous voyez une erreur de connexion, vérifiez :
- ✅ MongoDB est démarré (pour MongoDB local)
- ✅ L'URL de connexion dans `.env` est correcte
- ✅ Pour MongoDB Atlas : votre IP est dans la whitelist et les identifiants sont corrects

## 🚨 Problèmes Courants

### Erreur : "Connection refused" ou "ECONNREFUSED"
**Solution :** 
- Vérifiez que MongoDB est démarré (Services Windows pour MongoDB local)
- Vérifiez que le port 27017 n'est pas utilisé par un autre service
- Vérifiez l'URL de connexion dans `.env`

### Erreur : "Authentication failed" (MongoDB Atlas)
**Solution :** 
- Vérifiez le nom d'utilisateur et le mot de passe
- Vérifiez que votre IP est dans la whitelist
- Vérifiez que la chaîne de connexion est correcte

### Erreur : "Database not found"
**Solution :** C'est normal ! MongoDB crée la base de données automatiquement lors de la première écriture. Aucune action nécessaire.

### Erreur : "JWT_SECRET is not defined"
**Solution :** Ajouter `JWT_SECRET=...` dans votre fichier `.env`

## 📝 Configuration Minimale pour Tester

Pour tester rapidement sans Stripe ni Email, voici la configuration minimale :

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/site_rencontre
JWT_SECRET=ma-cle-secrete-123456789
CLIENT_URL=http://localhost:3000
```

Les autres variables (Stripe, Email) peuvent rester avec des valeurs par défaut pour l'instant.

## ✅ Checklist de Démarrage

- [ ] MongoDB installé et démarré (local) OU compte MongoDB Atlas créé (cloud)
- [ ] Fichier `.env` créé avec `MONGODB_URI` ou `DATABASE_URL`
- [ ] `JWT_SECRET` défini dans `.env`
- [ ] Dépendances installées (`npm install`)
- [ ] Serveur démarre sans erreur (`npm run server`)

Une fois tout cela fait, vous pouvez vous inscrire et vous connecter ! Les collections seront créées automatiquement.

## 📚 Documentation Complète

Pour plus de détails sur MongoDB, consultez `MONGODB_SETUP.md`
