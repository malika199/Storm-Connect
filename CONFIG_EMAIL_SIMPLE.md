# Configuration email – envoi réel vers Gmail

## À comprendre

| Variable   | À mettre                    | Exemple                         |
|-----------|-----------------------------|---------------------------------|
| **EMAIL_HOST** | Serveur SMTP (PAS votre email) | `smtp.gmail.com`               |
| **EMAIL_USER** | Votre email (expéditeur)      | `malika.derfoufii@gmail.com`   |
| **EMAIL_PASS** | Mot de passe d’application   | `abcd efgh ijkl mnop` (16 car.)|

**EMAIL_HOST** = adresse du serveur SMTP (comme une adresse de serveur), pas votre adresse email.

---

## 1. Créer un mot de passe d’application Gmail

1. Ouvrir : https://myaccount.google.com/apppasswords  
2. Si demandé : activer la **validation en 2 étapes** sur votre compte Google.  
3. Sélectionner **« Courrier »** et **« Autre »** (nom : LoveConnect).  
4. Cliquer sur **« Générer »**.  
5. Copier le mot de passe affiché (16 caractères, ex. : `abcd efgh ijkl mnop`).

---

## 2. Configurer le fichier `.env`

Ouvrir le fichier **`.env`** à la racine du projet et ajouter/modifier :

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=malika.derfoufii@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_FROM=malika.derfoufii@gmail.com
CLIENT_URL=http://localhost:3000
```

**À faire :**
- Remplacer `abcd efgh ijkl mnop` par votre **mot de passe d’application**.
- Ne pas mettre `USE_ETHEREAL_DEV=true` (ou le supprimer si présent).

---

## 3. Redémarrer le serveur

```bash
# Arrêter avec Ctrl+C, puis :
npm run server
```

Le message attendu au démarrage : **✅ Mailer prêt** (sans mention Ethereal).

---

## Résumé

- **EMAIL_HOST** = `smtp.gmail.com` (pour Gmail)
- **EMAIL_USER** = votre adresse Gmail
- **EMAIL_PASS** = mot de passe d’application (16 caractères), pas votre mot de passe Gmail habituel
