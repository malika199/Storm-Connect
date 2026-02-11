# Envoyer les emails (ex: mot de passe oublié) vers une vraie boîte Gmail

En mode **Ethereal**, l’email n’arrive **jamais** dans votre boîte (malika.derfoufii@gmail.com).  
Pour recevoir vraiment l’email dans Gmail, suivez ces étapes.

## 1. Activer la validation en 2 étapes (Google)

1. Allez sur : https://myaccount.google.com/security  
2. Dans « Connexion à Google », cliquez sur **Validation en deux étapes**.  
3. Activez-la si ce n’est pas déjà fait.

## 2. Créer un mot de passe d’application

1. Allez sur : https://myaccount.google.com/apppasswords  
   (Si le lien ne s’affiche pas, la validation en 2 étapes n’est pas activée.)  
2. Dans « Sélectionner l’application », choisissez **Courrier**.  
3. Dans « Sélectionner l’appareil », choisissez **Autre** et tapez par exemple « LoveConnect ».  
4. Cliquez sur **Générer**.  
5. **Copiez le mot de passe affiché** (16 caractères, sans espace).

## 3. Configurer le fichier `.env`

À la racine du projet, ouvrez (ou créez) le fichier `.env` et mettez :

```env
# Désactiver le mode Ethereal pour envoyer de vrais emails
USE_ETHEREAL_DEV=false

# Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=malika.derfoufii@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM=malika.derfoufii@gmail.com

# URL du site (pour le lien dans l’email)
CLIENT_URL=http://localhost:3000
```

Remplacez `xxxx xxxx xxxx xxxx` par le **mot de passe d’application** copié à l’étape 2 (vous pouvez laisser les espaces ou les enlever).

## 4. Redémarrer le serveur

Arrêtez le serveur (Ctrl+C) puis relancez :

```bash
npm run server
```

Vous devriez voir dans la console : **✅ Mailer prêt** (sans message Ethereal).

## 5. Tester

1. Allez sur **Mot de passe oublié**.  
2. Saisissez **malika.derfoufii@gmail.com**.  
3. Vérifiez la boîte de réception (et les spams) de cette adresse : l’email doit arriver avec le lien de réinitialisation.

---

**En résumé :**  
- Avec **Ethereal** : l’email n’est pas envoyé à une vraie adresse ; utilisez le lien de prévisualisation (console ou page).  
- Avec **Gmail** configuré comme ci-dessus : l’email est bien envoyé à **malika.derfoufii@gmail.com**.
