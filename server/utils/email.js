const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Transporteur email - supporte SMTP réel ou Ethereal (dev) quand non configuré
let transporter = null;
let etherealAccount = null;

const initTransporter = async () => {
    if (transporter) return transporter;

    const hasSmtpConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_PASS.trim() !== '';
    const useEthereal = process.env.USE_ETHEREAL_DEV === 'true';

    const createEtherealTransporter = async (reason) => {
        console.warn('⚠️ MODE ETHEREAL (pas d\'email réel) - Raison:', reason);
        etherealAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: etherealAccount.user,
                pass: etherealAccount.pass
            }
        });
        return transporter;
    };

    if (useEthereal) {
        return createEtherealTransporter('USE_ETHEREAL_DEV=true dans .env → supprimez cette ligne pour envoyer de vrais emails');
    }
    if (!hasSmtpConfig) {
        return createEtherealTransporter('EMAIL_USER ou EMAIL_PASS manquant dans .env → ajoutez-les pour envoyer de vrais emails');
    }

    if (hasSmtpConfig) {
        const smtpTransporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        try {
            await smtpTransporter.verify();
            transporter = smtpTransporter;
            const fromAddr = process.env.EMAIL_FROM || process.env.EMAIL_USER;
            console.log('✅ Mailer SMTP prêt (envoi réel). Emails envoyés depuis:', fromAddr || '(EMAIL_FROM/EMAIL_USER non défini)');
        } catch (err) {
            console.warn('⚠️ Connexion SMTP échouée:', err.message);
            transporter = null;
            return createEtherealTransporter('Connexion SMTP échouée → vérifiez EMAIL_USER et EMAIL_PASS (mot de passe d\'application Gmail)');
        }
    }

    return transporter;
};

// Vérifier la connexion au démarrage
initTransporter().then((t) => {
    t.verify().then(() => {
        console.log('✅ Mailer prêt');
    }).catch((err) => {
        console.error('❌ Erreur configuration mailer:', err.message);
    });
}).catch((err) => {
    console.error('❌ Erreur init mailer:', err);
});

// Adresse expéditeur : celle du .env (EMAIL_FROM ou EMAIL_USER)
const getFromAddress = () => {
    return process.env.EMAIL_FROM || process.env.EMAIL_USER || (etherealAccount && etherealAccount.user) || 'noreply@loveconnect.com';
};

// Fonction pour envoyer un email
const sendEmail = async (to, subject, html, text = '') => {
    try {
        const t = await initTransporter();
        const fromEmail = getFromAddress();

        const mailOptions = {
            from: `"LoveConnect" <${fromEmail}>`,
            to,
            subject,
            text: text || html.replace(/<[^>]*>/g, ''),
            html
        };

        const info = await t.sendMail(mailOptions);

        let previewUrl = null;
        if (etherealAccount && typeof nodemailer.getTestMessageUrl === 'function') {
            previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log('📬 [Ethereal - mode dev] Aucun email réel envoyé. Destinataire prévu:', to);
                console.log('   → Voir l\'email et le lien de réinitialisation:', previewUrl);
            }
        } else {
            console.log('✅ Email envoyé à:', to);
        }

        return { success: true, messageId: info.messageId, previewUrl: previewUrl || undefined };
    } catch (error) {
        console.error('❌ Erreur envoi email:', error);
        return { success: false, error: error.message };
    }
};

// Templates d'emails

// Email de notification au tuteur
const sendGuardianNotificationEmail = async (guardianEmail, guardianName, userName, matchDetails) => {
    const subject = 'Nouvelle demande de mise en relation';
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Nouvelle Demande de Mise en Relation</h1>
                </div>
                <div class="content">
                    <p>Bonjour ${guardianName},</p>
                    <p>Une nouvelle demande de mise en relation a été validée pour ${userName}.</p>
                    <p><strong>Détails de la demande :</strong></p>
                    <ul>
                        <li>Demandeur : ${matchDetails.requesterName}</li>
                        <li>Date : ${new Date(matchDetails.createdAt).toLocaleDateString('fr-FR')}</li>
                    </ul>
                    <p>Vous pouvez maintenant accéder à la discussion via votre espace tuteur.</p>
                    <a href="${process.env.CLIENT_URL}/guardian/dashboard" class="button">Accéder à l'espace tuteur</a>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail(guardianEmail, subject, html);
};

// Email de validation admin
const sendAdminValidationEmail = async (adminEmail, matchDetails) => {
    const subject = 'Nouvelle demande de mise en relation à valider';
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .button { display: inline-block; padding: 12px 24px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Nouvelle Demande à Valider</h1>
                </div>
                <div class="content">
                    <p>Une nouvelle demande de mise en relation nécessite votre validation.</p>
                    <p><strong>Détails :</strong></p>
                    <ul>
                        <li>Demandeur : ${matchDetails.requesterName}</li>
                        <li>Cible : ${matchDetails.targetName}</li>
                        <li>Date : ${new Date(matchDetails.createdAt).toLocaleDateString('fr-FR')}</li>
                    </ul>
                    <a href="${process.env.CLIENT_URL}/admin/matchmaking" class="button">Voir la demande</a>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail(adminEmail, subject, html);
};

// Email de réinitialisation du mot de passe
const sendPasswordResetEmail = async (email, resetToken, firstName) => {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    const subject = 'Réinitialisation de votre mot de passe - LoveConnect';
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { padding: 24px; background-color: #f9f9f9; border: 1px solid #eee; border-top: none; }
                .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
                .footer { font-size: 12px; color: #999; margin-top: 20px; }
                .link { word-break: break-all; color: #667eea; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>💕 LoveConnect</h1>
                    <p>Réinitialisation du mot de passe</p>
                </div>
                <div class="content">
                    <p>Bonjour ${firstName || 'Utilisateur'},</p>
                    <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
                    <p style="text-align: center;">
                        <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
                    </p>
                    <p>Ce lien expire dans <strong>1 heure</strong>.</p>
                    <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe restera inchangé.</p>
                    <p class="footer">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><span class="link">${resetUrl}</span></p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail(email, subject, html);
};

// Invitation parent : lien pour créer son compte (enfant déjà inscrit)
const sendParentInvitationEmail = async (guardianEmail, guardianName, childName, invitationLink) => {
    const subject = 'Invitation à créer votre compte parent - LoveConnect';
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { padding: 24px; background-color: #f9f9f9; border: 1px solid #eee; border-top: none; }
                .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
                .footer { font-size: 12px; color: #999; margin-top: 20px; }
                .link { word-break: break-all; color: #667eea; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>💕 LoveConnect</h1>
                    <p>Invitation compte parent</p>
                </div>
                <div class="content">
                    <p>Bonjour ${guardianName},</p>
                    <p><strong>${childName}</strong> vous a indiqué comme parent/tuteur sur LoveConnect. Pour superviser ses échanges et créer votre compte parent, cliquez sur le lien ci-dessous :</p>
                    <p style="text-align: center;">
                        <a href="${invitationLink}" class="button">Créer mon compte parent</a>
                    </p>
                    <p>Ce lien est valable <strong>7 jours</strong>. Vous pourrez définir votre email, mot de passe et accepter les CGU ainsi que le consentement parental.</p>
                    <p>Si vous n'êtes pas concerné(e), ignorez cet email.</p>
                    <p class="footer">Lien direct : <span class="link">${invitationLink}</span></p>
                </div>
            </div>
        </body>
        </html>
    `;
    return await sendEmail(guardianEmail, subject, html);
};

module.exports = {
    sendEmail,
    sendGuardianNotificationEmail,
    sendAdminValidationEmail,
    sendPasswordResetEmail,
    sendParentInvitationEmail
};
