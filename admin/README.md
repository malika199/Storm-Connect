# Back Office Administrateur

Application React dédiée au back office (admin) du site de rencontre. Elle communique avec le **même serveur** que le client (`server/`).

## Structure

- **admin/** : frontend React (ce dossier)
- **server/** : backend Node/Express (routes `/api/admin/*`, `/api/auth`, `/api/matchmaking`, etc.)
- **client/** : frontend utilisateur (site public)

## Démarrage

1. **Démarrer le serveur** (depuis la racine du projet) :
   ```bash
   npm run server
   ```
   Ou : `cd server && node index.js` (le serveur écoute sur le port 5000).

2. **Démarrer l’admin** (depuis la racine) :
   ```bash
   cd admin
   npm install
   npm start
   ```
   L’admin tourne sur **http://localhost:3001** (configuré dans `admin/.env` avec `PORT=3001`).

3. Le **client** utilisateur reste sur **http://localhost:3000** :
   ```bash
   cd client
   npm install
   npm start
   ```

## Configuration

- **Proxy** : dans `admin/package.json`, `"proxy": "http://localhost:5000"` envoie les appels API vers le serveur.
- **CORS** : le serveur autorise `http://localhost:3001` (admin) et `http://localhost:3000` (client).

## Connexion

- URL : **http://localhost:3001**
- Page de login : **http://localhost:3001/login**
- **Identifiants admin par défaut** (créés avec `npm run create-admin` à la racine) :
  - **Email :** `admin@example.com`
  - **Mot de passe :** `admin123`
- Le formulaire est pré-rempli avec ces identifiants : il suffit de cliquer sur « Se connecter ».
- Seuls les comptes avec `role: 'admin'` peuvent se connecter.

## Routes de l’admin

| Route           | Description                |
|----------------|----------------------------|
| `/login`       | Connexion administrateur   |
| `/`            | Dashboard                  |
| `/validations` | Validations profils/matches|
| `/users`       | Gestion utilisateurs       |
| `/matchmaking` | Demandes de mise en relation |
| `/statistics`  | Statistiques détaillées    |

Toutes les routes (sauf `/login`) sont protégées : redirection vers `/login` si non connecté ou si l’utilisateur n’est pas admin.
