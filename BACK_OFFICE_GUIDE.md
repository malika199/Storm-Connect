# Guide du Back Office Administrateur

## 🎯 Vue d'ensemble

Le back office administrateur est une interface complète et moderne pour gérer toute la plateforme de rencontre. Il offre un design professionnel avec une navigation intuitive et des fonctionnalités avancées.

## 🚀 Accès au Back Office

### URL de connexion
- **Page dédiée** : `http://localhost:3000/admin/login`
- **Page publique** : `http://localhost:3000/login` (redirige automatiquement si admin)

### Création du compte admin
```bash
node create-admin.js
```

## 📋 Structure du Back Office

### Layout Principal (`AdminLayout`)
- **Sidebar** : Navigation fixe avec menu déroulant
- **Responsive** : S'adapte aux écrans mobiles
- **Thème** : Design moderne avec dégradés et animations

### Pages Disponibles

#### 1. 📊 Dashboard (`/admin`)
**Fonctionnalités** :
- Vue d'ensemble des statistiques en temps réel
- Cartes statistiques avec indicateurs visuels
- Actions rapides vers les sections importantes
- Badges d'alerte pour les éléments urgents
- Rafraîchissement automatique toutes les minutes

**Statistiques affichées** :
- Total utilisateurs
- Utilisateurs actifs
- Profils en attente de validation
- Matches en attente de validation
- Matches validés
- Revenus totaux
- Abonnements actifs
- Utilisateurs vérifiés

#### 2. ⚡ Validations (`/admin/validations`)
**Fonctionnalités** :
- **Onglet Profils** : Valider/rejeter les profils utilisateurs
- **Onglet Matches** : Valider/rejeter les demandes de match
- Interface en deux colonnes (liste + détails)
- Prévisualisation complète des profils
- Notes de validation optionnelles
- Raisons de rejet requises

**Actions disponibles** :
- ✅ Valider un profil/match
- ❌ Rejeter un profil/match (avec raison)
- 📝 Ajouter des notes administratives

#### 3. 👥 Utilisateurs (`/admin/users`)
**Fonctionnalités** :
- Liste complète de tous les utilisateurs
- Recherche par nom/email
- Filtres par statut (Tous, Actifs, Inactifs, En attente)
- Tableau avec toutes les informations
- Actions rapides sur chaque utilisateur

**Actions disponibles** :
- Vérifier l'identité (ID)
- Valider le profil
- Activer/Désactiver un compte
- Voir les détails complets

#### 4. 💕 Matchmaking (`/admin/matchmaking`)
**Fonctionnalités** :
- Gestion des demandes de mise en relation spéciales
- Vue détaillée des demandeurs et cibles
- Informations sur les tuteurs (guardians)
- Validation/Rejet des demandes

#### 5. 📈 Statistiques (`/admin/statistics`)
**Fonctionnalités** :
- Statistiques détaillées par catégorie
- Graphiques de progression
- Taux de conversion
- Analyses approfondies

**Sections** :
- Utilisateurs (total, actifs, vérifiés, taux d'activation)
- Matches (en attente, validés, taux de validation)
- Revenus (total, abonnements, revenu moyen)
- Validations (profils et matches en attente)

## 🎨 Design et UX

### Caractéristiques du Design
- **Couleurs** : Palette moderne avec dégradés
- **Animations** : Transitions fluides et effets hover
- **Responsive** : Adapté à tous les écrans
- **Accessibilité** : Contraste élevé, navigation clavier

### Composants Réutilisables
- `AdminLayout` : Layout principal avec sidebar
- Cartes statistiques (`stat-card`)
- Boutons d'action (`admin-btn`)
- Badges de statut (`admin-badge`)
- États vides (`empty-state`)

## 🔧 Fonctionnalités Techniques

### Navigation
- Sidebar rétractable (desktop)
- Menu hamburger (mobile)
- Indicateurs de page active
- Badges de notification sur les onglets

### Gestion d'État
- Chargement asynchrone des données
- États de chargement avec spinners
- Gestion des erreurs avec toasts
- Rafraîchissement automatique

### Sécurité
- Routes protégées par middleware `requireAdmin`
- Authentification JWT requise
- Vérification du rôle admin
- Redirection automatique si non-admin

## 📱 Responsive Design

### Desktop (> 768px)
- Sidebar fixe de 280px (80px quand fermée)
- Layout en deux colonnes pour les détails
- Tableaux complets avec toutes les colonnes

### Mobile (< 768px)
- Sidebar en overlay (s'ouvre/ferme)
- Layout en une colonne
- Tableaux scrollables horizontalement
- Navigation simplifiée

## 🎯 Workflows Principaux

### Validation d'un Profil
1. Aller sur `/admin/validations`
2. Onglet "Validation des Profils"
3. Cliquer sur un profil dans la liste
4. Voir les détails complets
5. Cliquer sur "✅ Valider" ou "❌ Rejeter"
6. Ajouter des notes si nécessaire

### Validation d'un Match
1. Aller sur `/admin/validations`
2. Onglet "Validation des Matches"
3. Cliquer sur un match dans la liste
4. Voir les détails des deux utilisateurs
5. Cliquer sur "✅ Valider" ou "❌ Rejeter"
6. Les utilisateurs reçoivent une notification

### Gestion d'un Utilisateur
1. Aller sur `/admin/users`
2. Rechercher ou filtrer l'utilisateur
3. Voir toutes les informations dans le tableau
4. Utiliser les boutons d'action rapide
5. Vérifier ID, valider profil, activer/désactiver

## 🔔 Notifications

Le système envoie automatiquement des notifications aux utilisateurs pour :
- ✅ Profil validé
- ❌ Profil rejeté (avec raison)
- ✅ Match validé
- ❌ Match rejeté (avec raison)

## 📊 Statistiques en Temps Réel

Le Dashboard se met à jour automatiquement toutes les minutes pour afficher :
- Les dernières statistiques
- Les nouveaux éléments en attente
- Les changements de statut

## 🛠️ Personnalisation

### Modifier les couleurs
Éditez `AdminLayout.css` et les fichiers CSS des pages pour changer :
- Couleurs principales
- Dégradés
- Badges
- Boutons

### Ajouter de nouvelles pages
1. Créer le composant dans `client/src/pages/admin/`
2. Ajouter la route dans `App.js`
3. Ajouter l'item de menu dans `AdminLayout.js`
4. Créer le CSS associé

## 🆘 Dépannage

### Problème : Sidebar ne s'affiche pas
- Vérifier que `AdminLayout.css` est importé
- Vérifier les styles CSS globaux

### Problème : Les statistiques ne se chargent pas
- Vérifier la connexion à l'API
- Vérifier les routes backend `/api/admin/statistics`

### Problème : Les validations ne fonctionnent pas
- Vérifier que l'utilisateur est bien admin
- Vérifier les routes backend `/api/admin/matches/*` et `/api/admin/users/*`

## 📝 Notes Importantes

1. **Un seul admin** : Le système est conçu pour un seul administrateur
2. **Validation obligatoire** : Tous les profils et matches doivent être validés
3. **Notifications** : Les utilisateurs sont automatiquement notifiés des décisions
4. **Historique** : Toutes les actions sont loggées dans `ActivityLog`

## 🎉 Fonctionnalités Avancées

- **Recherche en temps réel** : Recherche instantanée dans les listes
- **Filtres multiples** : Filtrage par plusieurs critères
- **Prévisualisation** : Voir les détails sans quitter la liste
- **Actions groupées** : Possibilité de traiter plusieurs éléments (à venir)
- **Export de données** : Export CSV/Excel (à venir)

Le back office est maintenant complet et prêt à l'utilisation ! 🚀
