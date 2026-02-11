# Configuration du Mailer - Mot de passe oublié

## Fonctionnement

Quand un utilisateur clique sur **« Mot de passe oublié »** sur la page de connexion :

1. Il entre son email
2. Le serveur génère un token sécurisé
3. Un email contenant un lien de réinitialisation est envoyé
4. Le lien expire après 1 heure

## Modes de configuration

### Mode développement (sans configuration)

Si `EMAIL_USER` et `EMAIL_PASS` ne sont **pas** définis dans `.env` :

- Le serveur utilise **Ethereal** (compte de test Nodemailer)
- Les emails ne sont pas envoyés réellement
- Chaque envoi affiche dans la **console serveur** un lien de prévisualisation
- Exemple : `📬 Prévisualiser: https://ethereal.email/message/xxx`
- Cliquez sur ce lien pour voir l’email dans le navigateur

**Utilisation** : lancez le serveur, déclenchez « Mot de passe oublié », puis copiez le lien affiché dans le terminal.

### Mode production (avec SMTP)

Configurez votre `.env` :

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-mot-de-passe-d-application
EMAIL_FROM=noreply@loveconnect.com
CLIENT_URL=https://votresite.com
```

#### Gmail

1. Activer la [Validation en 2 étapes](https://myaccount.google.com/security)
2. Aller dans « Sécurité » → « Mots de passe des applications »
3. Créer un mot de passe d’application pour « Mail »
4. Utiliser ce mot de passe dans `EMAIL_PASS`

#### Autres fournisseurs

- **Outlook / Hotmail** : `smtp.office365.com`, port 587
- **OVH / autre SMTP** : utilisez les paramètres fournis par votre hébergeur

## Test

1. Démarrer le serveur : `npm run dev`
2. Ouvrir http://localhost:3000/login
3. Cliquer sur « Mot de passe oublié »
4. Saisir un email lié à un compte existant
5. En mode dev : copier le lien de prévisualisation dans la console
6. En mode prod : vérifier la boîte mail

## Sécurité

- Le même message est retourné si l’email existe ou non (évite l’énumération)
- Le token est hashé en SHA-256 avant stockage
- Le token expire après 1 heure
- Le token est supprimé après utilisation
