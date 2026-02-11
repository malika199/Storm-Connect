# Gestion de Session avec Expiration Automatique

## Vue d'ensemble

Ce système implémente une authentification sécurisée avec expiration automatique de session. Les utilisateurs sont automatiquement déconnectés après expiration de leur token JWT.

## Configuration

### Variables d'environnement

Dans votre fichier `.env` du serveur :

```env
# Durée de vie du token JWT (par défaut: 1h)
JWT_EXPIRES_IN=1h

# Secret pour signer les tokens JWT
JWT_SECRET=votre_secret_jwt

# Pour refresh token (futur)
# JWT_REFRESH_SECRET=votre_secret_refresh_token
# JWT_REFRESH_EXPIRES_IN=7d
```

### Formats d'expiration acceptés

- `1h` - 1 heure
- `30m` - 30 minutes
- `1d` - 1 jour
- `7d` - 7 jours
- etc.

## Backend

### Routes disponibles

#### `POST /api/auth/login`
Connexion utilisateur. Retourne un token JWT avec expiration de 1h.

**Réponse :**
```json
{
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "user"
  }
}
```

#### `GET /api/auth/me`
Récupère les informations complètes de l'utilisateur connecté.

**Headers requis :**
```
Authorization: Bearer <token>
```

**Réponse :**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    ...
  }
}
```

#### `GET /api/auth/check-session`
Vérifie rapidement si la session est encore active (route légère).

**Headers requis :**
```
Authorization: Bearer <token>
```

**Réponse si session valide :**
```json
{
  "valid": true,
  "message": "Session active",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "user"
  }
}
```

**Réponse si session expirée (401) :**
```json
{
  "message": "Session expirée. Veuillez vous reconnecter.",
  "code": "SESSION_EXPIRED",
  "expired": true
}
```

### Middleware d'authentification

Le middleware `authenticate` vérifie automatiquement :
- La présence du token
- La validité du token
- L'expiration du token
- L'existence et l'état actif de l'utilisateur

**Erreurs retournées :**
- `401` avec `code: "INVALID_TOKEN"` - Token invalide
- `401` avec `code: "SESSION_EXPIRED"` - Session expirée
- `403` - Compte désactivé

## Frontend

### Gestion automatique de la session

#### Vérification au démarrage

Au lancement de l'application, le système :
1. Vérifie si un token existe dans `localStorage`
2. Appelle `/api/auth/check-session` pour valider le token
3. Si valide, récupère les informations complètes via `/api/auth/me`
4. Si expiré, déconnecte automatiquement l'utilisateur

#### Intercepteur Axios

Un intercepteur axios est configuré pour :
- Détecter automatiquement les erreurs `401` (session expirée)
- Déclencher une déconnexion automatique
- Afficher un message d'avertissement à l'utilisateur

#### Déconnexion automatique

Quand une session expire :
1. Le token est supprimé de `localStorage`
2. L'utilisateur est déconnecté
3. Un message toast s'affiche : "Votre session a expiré. Veuillez vous reconnecter."
4. L'utilisateur est redirigé vers la page de connexion (via `PrivateRoute`)

### Utilisation dans les composants

```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  // Vérifier si l'utilisateur est connecté
  if (!isAuthenticated) {
    return <div>Veuillez vous connecter</div>;
  }

  return (
    <div>
      <p>Bienvenue {user.first_name}</p>
      <button onClick={logout}>Déconnexion</button>
    </div>
  );
}
```

### Routes protégées

Les routes protégées utilisent le composant `PrivateRoute` qui :
- Vérifie automatiquement l'authentification
- Redirige vers `/login` si non authentifié
- Gère automatiquement les sessions expirées

## Refresh Token (Préparation future)

Le code inclut déjà la structure de base pour implémenter un système de refresh token :

### Backend

Dans `server/routes/auth.js`, des commentaires TODO indiquent où ajouter :
- La génération de refresh token lors du login
- La route `/api/auth/refresh-token` pour renouveler le token

### Frontend

L'intercepteur axios peut être étendu pour :
- Détecter l'expiration du token
- Appeler automatiquement `/api/auth/refresh-token`
- Mettre à jour le token sans déconnecter l'utilisateur

## Sécurité

### Bonnes pratiques implémentées

✅ Tokens JWT avec expiration limitée (1h)
✅ Vérification de l'existence de l'utilisateur à chaque requête
✅ Vérification de l'état actif du compte
✅ Suppression automatique du token côté client en cas d'expiration
✅ Messages d'erreur clairs pour l'utilisateur

### Recommandations supplémentaires

- Utiliser HTTPS en production
- Implémenter le refresh token pour une meilleure UX
- Ajouter une rotation des secrets JWT
- Logger les tentatives d'accès avec tokens expirés
- Implémenter un système de blacklist pour les tokens révoqués

## Dépannage

### L'utilisateur est déconnecté trop souvent

- Vérifier la valeur de `JWT_EXPIRES_IN` dans `.env`
- Augmenter la durée si nécessaire (ex: `2h`, `4h`)

### La session ne se renouvelle pas automatiquement

- Vérifier que l'intercepteur axios est bien configuré dans `client/src/index.js`
- Vérifier que l'événement `session-expired` est bien écouté dans `AuthContext`

### Erreurs 401 non gérées

- Vérifier que toutes les routes protégées utilisent le middleware `authenticate`
- Vérifier que l'intercepteur axios est bien configuré

## Migration depuis l'ancien système

Si vous migrez depuis un système sans expiration :

1. Les tokens existants continueront de fonctionner jusqu'à leur expiration naturelle
2. Les nouveaux tokens auront une expiration de 1h
3. Les utilisateurs seront automatiquement déconnectés après 1h d'inactivité
4. Aucune action manuelle requise côté utilisateur
