# Fonctionnalité de Blocage d'Utilisateurs

## Vue d'ensemble

La fonctionnalité de blocage permet aux utilisateurs de bloquer d'autres utilisateurs pour empêcher toute forme d'interaction (messages, likes, découverte de profils, etc.).

## Caractéristiques

### 1. Blocage Bidirectionnel
- Lorsqu'un utilisateur A bloque un utilisateur B, **les deux utilisateurs** ne peuvent plus interagir
- B ne peut plus voir le profil de A
- A ne peut plus voir le profil de B
- Aucune notification n'est envoyée à l'utilisateur bloqué

### 2. Impact sur les Fonctionnalités

#### Découverte de Profils (`/user/match`)
- Les utilisateurs bloqués ne sont **jamais** affichés dans la page de découverte
- Exclut les profils où :
  - Vous avez bloqué l'utilisateur
  - L'utilisateur vous a bloqué

#### Likes et Matches
- Impossible de liker un utilisateur bloqué
- Les matches existants sont masqués si un blocage est effectué
- Les likes reçus ne montrent pas les utilisateurs bloqués

#### Messages
- **Messages directs** : Les conversations avec des utilisateurs bloqués sont inaccessibles
- **Messages de groupe** (avec tuteur) : Les messages sont bloqués si l'un des participants a bloqué l'autre
- Tentative d'envoi de message = erreur 403

#### Recherche
- Les utilisateurs bloqués n'apparaissent pas dans les résultats de recherche

## Structure Technique

### Backend

#### Modèle `BlockedUser`
```javascript
{
  blocker_id: ObjectId,      // Utilisateur qui bloque
  blocked_id: ObjectId,      // Utilisateur bloqué
  reason: String,            // harassment, inappropriate_content, spam, fake_profile, other
  notes: String,             // Notes optionnelles
  createdAt: Date,          // Date du blocage
  updatedAt: Date
}
```

#### Routes API

**POST** `/api/users/block/:userId`
- Bloquer un utilisateur
- Body: `{ reason: string, notes: string (optional) }`

**DELETE** `/api/users/block/:userId`
- Débloquer un utilisateur

**GET** `/api/users/blocked`
- Obtenir la liste des utilisateurs bloqués

**GET** `/api/users/block-status/:userId`
- Vérifier si un utilisateur est bloqué
- Response: `{ is_blocked: boolean, reason: string }`

#### Middleware de Blocage

Les vérifications de blocage sont intégrées dans :
- `server/routes/matching.js` - Discover, likes, matches, messages
- `server/routes/messages.js` - Messages de groupe
- `server/routes/users.js` - Profils et recherche

### Frontend

#### Composants

1. **`BlockUserButton`** (`client/src/components/BlockUserButton.js`)
   - Bouton réutilisable pour bloquer/débloquer
   - Modal de confirmation avec sélection de raison
   - Gestion de l'état de blocage

2. **`BlockedUsers`** (`client/src/pages/user/BlockedUsers.js`)
   - Page listant tous les utilisateurs bloqués
   - Affiche la raison, les notes et la date de blocage
   - Permet de débloquer

#### Intégrations

Le `BlockUserButton` est intégré dans :
- **Page Conversations** : En-tête de chaque conversation
  - Accessible via `/user/conversations`
  - Permet de bloquer pendant une conversation
  - Rafraîchit automatiquement la liste des matches après blocage

Vous pouvez également l'intégrer dans :
- Page de profil d'un utilisateur
- Page des matches
- Anywhere où vous affichez un utilisateur

Exemple d'utilisation :
```jsx
import BlockUserButton from '../../components/BlockUserButton';

<BlockUserButton
  userId={user.id}
  userName={`${user.first_name} ${user.last_name}`}
  onBlockChange={(blocked) => {
    // Actions après blocage/déblocage
    if (blocked) {
      // L'utilisateur a été bloqué
    } else {
      // L'utilisateur a été débloqué
    }
  }}
/>
```

#### Navigation

- **Menu principal** : Lien "Bloqués" (🚫) dans la navbar
- **URL** : `/user/blocked`
- Accessible depuis desktop et mobile

## Raisons de Blocage

Les utilisateurs peuvent choisir parmi ces raisons :
- **Harcèlement** (`harassment`)
- **Contenu inapproprié** (`inappropriate_content`)
- **Spam** (`spam`)
- **Faux profil** (`fake_profile`)
- **Autre** (`other`) - Par défaut

## Sécurité et Confidentialité

1. **Aucune notification** : L'utilisateur bloqué ne reçoit aucune notification
2. **Blocage invisible** : L'utilisateur bloqué ne sait pas qu'il a été bloqué
3. **Protection des deux côtés** : Les deux utilisateurs sont protégés de l'interaction
4. **Logs d'activité** : Tous les blocages sont enregistrés dans les logs

## Tests Recommandés

### Tests Manuels

1. **Bloquer un utilisateur depuis une conversation**
   - Accéder à `/user/conversations`
   - Sélectionner une conversation
   - Cliquer sur "Bloquer"
   - Vérifier que la conversation disparaît

2. **Vérifier que l'utilisateur bloqué n'apparaît plus**
   - Aller sur `/user/match` (découverte)
   - Confirmer que le profil bloqué n'apparaît pas

3. **Tentative d'envoi de message à un utilisateur bloqué**
   - Tenter d'envoyer un message via API
   - Doit recevoir erreur 403

4. **Débloquer un utilisateur**
   - Aller sur `/user/blocked`
   - Cliquer sur "Débloquer"
   - Vérifier que l'utilisateur peut à nouveau être découvert

### Tests API (avec Postman/curl)

```bash
# Bloquer un utilisateur
POST /api/users/block/:userId
Authorization: Bearer <token>
{
  "reason": "harassment",
  "notes": "Messages inappropriés répétés"
}

# Vérifier le statut de blocage
GET /api/users/block-status/:userId
Authorization: Bearer <token>

# Débloquer
DELETE /api/users/block/:userId
Authorization: Bearer <token>

# Lister les bloqués
GET /api/users/blocked
Authorization: Bearer <token>
```

## Améliorations Futures Possibles

1. **Signalement automatique aux admins** : Les blocages pour harcèlement pourraient créer automatiquement un ticket admin
2. **Statistiques de blocage** : Dashboard admin avec les utilisateurs les plus bloqués
3. **Limite de blocages** : Empêcher les abus (ex: max 50 blocages par utilisateur)
4. **Export de données** : Permettre aux utilisateurs d'exporter leur liste de blocages (RGPD)
5. **Blocage temporaire** : Option de bloquer pour une durée limitée

## Notes de Maintenance

- Le modèle `BlockedUser` utilise des index composites pour optimiser les requêtes
- Les vérifications de blocage sont effectuées à chaque requête pertinente
- Aucun cache n'est utilisé actuellement (à considérer pour optimisation future)

## Support

Pour toute question ou problème :
1. Vérifier les logs serveur : `console.error` dans les routes
2. Vérifier les logs frontend : Console du navigateur
3. Tester les endpoints API directement
