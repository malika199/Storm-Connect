# Guide d'Installation - Site de Rencontre

## Prérequis

- Node.js (v16 ou supérieur)
- MongoDB (local ou MongoDB Atlas - gratuit)
- Compte Stripe (pour les paiements)
- Compte email SMTP (pour les notifications)

## Installation

### 1. Cloner et installer les dépendances

```bash
# Installer les dépendances du backend et frontend
npm run install-all
```

### 2. Configuration de la base de données

#### Option A : MongoDB Local

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

**Note :** Les collections seront créées automatiquement lors de la première utilisation. Aucun schéma SQL à exécuter !

#### Option B : MongoDB Atlas (Cloud - Gratuit)

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
   - Copiez la chaîne de connexion

### 3. Configuration des variables d'environnement

Créez un fichier `.env` à la racine du projet en copiant `.env.example` :

```bash
# Sur Windows
copy .env.example .env
```

Puis modifiez le fichier `.env` avec vos valeurs :

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (MongoDB)
# Option 1: MongoDB Local
MONGODB_URI=mongodb://localhost:27017/site_rencontre

# Option 2: MongoDB Atlas (Cloud)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/site_rencontre?retryWrites=true&w=majority

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@sitederencontre.com

# Frontend URL
CLIENT_URL=http://localhost:3000

# Admin Configuration
ADMIN_EMAIL=admin@sitederencontre.com
```

**Important :**
- Remplacez `MONGODB_URI` par votre URL de connexion MongoDB
- Remplacez `JWT_SECRET` par une clé secrète longue et aléatoire
- Pour MongoDB Atlas, remplacez `username`, `password` et `cluster` dans l'URL

### 4. Créer le premier administrateur

Avec MongoDB, vous pouvez créer le premier administrateur via l'interface d'inscription ou utiliser un script Node.js :

```javascript
// create-admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./server/models/User');
require('dotenv').config();

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
        
        const adminEmail = 'admin@example.com';
        const adminPassword = 'votre-mot-de-passe-securise';
        
        // Vérifier si l'admin existe déjà
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log('Admin existe déjà !');
            process.exit(0);
        }
        
        // Créer l'admin
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        const admin = await User.create({
            email: adminEmail,
            password_hash: passwordHash,
            first_name: 'Admin',
            last_name: 'User',
            gender: 'male',
            date_of_birth: new Date('1990-01-01'),
            role: 'admin',
            is_verified: true,
            gdpr_consent: true,
            gdpr_consent_date: new Date()
        });
        
        console.log('✅ Admin créé avec succès !');
        console.log('Email:', adminEmail);
        console.log('Mot de passe:', adminPassword);
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

createAdmin();
```

Exécutez le script :
```bash
node create-admin.js
```

### 5. Configuration Stripe

1. Créer un compte sur [Stripe](https://stripe.com)
2. Récupérer les clés API dans le tableau de bord
3. Configurer le webhook :
   - URL: `https://votre-domaine.com/api/payments/webhook`
   - Événements: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `payment_intent.succeeded`

### 6. Configuration Email

Pour Gmail :
1. Activer l'authentification à deux facteurs
2. Générer un mot de passe d'application
3. Utiliser ce mot de passe dans `EMAIL_PASS`

### 7. Démarrer l'application

```bash
# Démarrer le serveur de développement (backend + frontend)
npm run dev
```

L'application sera accessible sur :
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Structure du Projet

```
├── client/                 # Application React frontend
│   ├── src/
│   │   ├── pages/         # Pages de l'application
│   │   ├── components/    # Composants réutilisables
│   │   └── context/       # Context React (Auth)
│   └── public/
├── server/                 # API Node.js backend
│   ├── models/            # Modèles Mongoose (MongoDB)
│   ├── routes/            # Routes API
│   ├── middleware/        # Middleware (auth, etc.)
│   ├── utils/             # Utilitaires (email, logger)
│   └── config/            # Configuration (database)
└── docs/                  # Documentation (CGU, RGPD)
```

## Workflow de Mise en Relation

1. **Inscription** : L'utilisateur remplit son profil et renseigne les coordonnées de son tuteur
2. **Recherche** : L'utilisateur recherche des profils selon ses critères
3. **Demande** : L'homme exprime son intérêt pour une femme
4. **Validation Admin** : L'administrateur valide la demande
5. **Contact Tuteur** : Le système crée un groupe de discussion incluant le tuteur
6. **Discussion** : Les trois parties (demandeur, cible, tuteur) peuvent communiquer

## Espaces Utilisateurs

### Espace Utilisateur (Célibataire)
- `/user` - Tableau de bord
- `/user/profile` - Gestion du profil
- `/user/search` - Recherche de profils
- `/user/messages` - Messages et discussions

### Espace Tuteur
- `/guardian` - Tableau de bord
- `/guardian/discussions` - Discussions actives

### Espace Administrateur
- `/admin` - Tableau de bord
- `/admin/matchmaking` - Gestion des demandes
- `/admin/users` - Gestion des utilisateurs
- `/admin/statistics` - Statistiques

## Sécurité

- Les mots de passe sont hashés avec bcrypt
- JWT pour l'authentification
- Validation des données côté serveur
- Protection CSRF (à configurer en production)
- HTTPS requis en production

## Déploiement

### Backend
- Déployer sur Heroku, Railway, ou VPS
- Configurer les variables d'environnement
- Configurer la base de données MongoDB (Atlas recommandé pour la production)

### Frontend
- Build: `cd client && npm run build`
- Déployer le dossier `build/` sur Netlify, Vercel, ou serveur statique

## Support

Pour toute question, consultez la documentation dans le dossier `docs/` ou `MONGODB_SETUP.md`.
