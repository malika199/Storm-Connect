const express = require('express');
const router = express.Router();
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Guardian = require('../models/Guardian');
const { authenticate } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');
const { sendPasswordResetEmail, sendParentInvitationEmail } = require('../utils/email');

/**
 * Valide le mot de passe selon les critères de sécurité :
 * - Au moins 8 caractères
 * - Au moins une majuscule (A–Z)
 * - Au moins une minuscule (a–z)
 * - Au moins un chiffre (0–9)
 * - Au moins un caractère spécial (! @ # $ % & * …)
 */
function validatePassword(password) {
    if (!password || password.length < 8) {
        return { valid: false, message: 'Le mot de passe doit contenir au moins 8 caractères' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Le mot de passe doit contenir au moins une majuscule (A–Z)' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Le mot de passe doit contenir au moins une minuscule (a–z)' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Le mot de passe doit contenir au moins un chiffre (0–9)' };
    }
    if (!/[!@#$%&*()[\]{};:'",.<>?\\\/\-_+=`~]/.test(password)) {
        return { valid: false, message: 'Le mot de passe doit contenir au moins un caractère spécial (! @ # $ % & * …)' };
    }
    return { valid: true };
}

// Inscription
router.post('/register', async (req, res) => {
    try {
        const {
            email,
            password,
            first_name,
            last_name,
            gender,
            date_of_birth,
            phone,
            smoker,
            halal,
            alcohol,
            guardian_email,
            guardian_phone,
            guardian_name,
            guardian_relationship,
            gdpr_consent
        } = req.body;

        // Validation
        if (!email || !password || !first_name || !last_name || !gender || !date_of_birth) {
            return res.status(400).json({ message: 'Champs obligatoires manquants' });
        }

        if (!guardian_email || !guardian_name || !guardian_relationship) {
            return res.status(400).json({ message: 'Les coordonnées du tuteur sont obligatoires' });
        }

        if (!gdpr_consent) {
            return res.status(400).json({ message: 'Le consentement RGPD est obligatoire' });
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({ message: passwordValidation.message });
        }

        // Vérifier si l'email existe déjà
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }

        // Hasher le mot de passe
        const passwordHash = await bcrypt.hash(password, 10);

        // Créer l'utilisateur
        const user = await User.create({
            email: email.toLowerCase(),
            password_hash: passwordHash,
            first_name,
            last_name,
            gender,
            date_of_birth,
            phone,
            smoker: (smoker === 'yes' || smoker === true) ? true : (smoker === 'no' || smoker === false) ? false : undefined,
            halal: (halal === 'yes' || halal === true) ? true : (halal === 'no' || halal === false) ? false : undefined,
            alcohol: (alcohol === 'yes' || alcohol === true) ? true : (alcohol === 'no' || alcohol === false) ? false : undefined,
            gdpr_consent,
            gdpr_consent_date: new Date()
        });

        // Créer l'invitation parent (pas de compte parent : envoi d'un lien pour qu'il s'inscrive)
        const invitationToken = crypto.randomBytes(32).toString('hex');
        const invitationExpiresAt = new Date();
        invitationExpiresAt.setDate(invitationExpiresAt.getDate() + 7);

        await Guardian.create({
            user_id: user._id,
            guardian_email: guardian_email.toLowerCase(),
            guardian_phone: guardian_phone || undefined,
            guardian_name,
            guardian_relationship,
            status: 'invited',
            invitation_token: invitationToken,
            invitation_expires_at: invitationExpiresAt
        });

        const invitationLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/register-parent?token=${invitationToken}`;
        const childName = `${first_name} ${last_name}`;
        const emailResult = await sendParentInvitationEmail(guardian_email, guardian_name, childName, invitationLink);

        // Si l'email n'a pas été envoyé (SMTP non configuré, Ethereal, ou erreur), renvoyer le lien pour le partager au parent
        const invitationLinkForParent = (!emailResult || !emailResult.success) || process.env.NODE_ENV === 'development';
        if (!emailResult || !emailResult.success) {
            console.warn('⚠️ Email d\'invitation parent non envoyé (SMTP manquant ou erreur). Lien à partager au parent :', invitationLink);
        }

        // Logger l'activité
        await logActivity(user._id.toString(), 'user_registered', 'user', user._id.toString(), req);

        // Générer le token JWT avec expiration de 1h (ou valeur depuis env)
        const token = jwt.sign(
            { userId: user._id.toString(), email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        const responsePayload = {
            message: 'Inscription réussie',
            token,
            user: {
                id: user._id.toString(),
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role
            }
        };
        // En dev ou si l'email n'a pas été envoyé : renvoyer le lien d'invitation pour le partager manuellement au parent
        if (invitationLinkForParent) {
            responsePayload.invitation_link = invitationLink;
            responsePayload.invitation_email_sent = !!emailResult?.success;
        }
        res.status(201).json(responsePayload);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Erreur lors de l\'inscription' });
    }
});

// Connexion
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email et mot de passe requis' });
        }

        // Trouver l'utilisateur
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        if (!user.is_active) {
            return res.status(403).json({ message: 'Compte désactivé' });
        }

        // Vérifier le mot de passe
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Mettre à jour la dernière connexion
        user.last_login = new Date();
        await user.save();

        // Générer le token avec expiration de 1h (ou valeur depuis env)
        const token = jwt.sign(
            { userId: user._id.toString(), email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        // TODO: Pour implémenter refresh token plus tard :
        // const refreshToken = jwt.sign(
        //     { userId: user._id.toString(), type: 'refresh' },
        //     process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        //     { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
        // );
        // Stocker refreshToken dans la base de données (user.refreshToken = refreshToken)

        // Logger l'activité
        await logActivity(user._id.toString(), 'user_logged_in', 'user', user._id.toString(), req);

        res.json({
            message: 'Connexion réussie',
            token,
            // refreshToken: refreshToken, // À décommenter quand refresh token sera implémenté
            user: {
                id: user._id.toString(),
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
});

// Mot de passe oublié - Demander un lien de réinitialisation
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email requis' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        // Toujours retourner le même message pour éviter l'énumération d'emails
        const successMessage = 'Si un compte existe avec cet email, vous recevrez un lien pour réinitialiser votre mot de passe.';

        if (!user) {
            return res.json({ message: successMessage });
        }

        if (!user.is_active) {
            return res.json({ message: successMessage });
        }

        // Générer un token sécurisé
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.password_reset_token = hashedToken;
        user.password_reset_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure
        await user.save();

        const emailResult = await sendPasswordResetEmail(user.email, resetToken, user.first_name);

        if (!emailResult.success) {
            user.password_reset_token = undefined;
            user.password_reset_expires = undefined;
            await user.save();
            console.error('Email send error:', emailResult.error);
            return res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer plus tard.' });
        }

        // En mode Ethereal (dev), renvoyer le lien de prévisualisation pour afficher sur la page
        const response = { message: successMessage };
        if (emailResult.previewUrl) {
            response.previewUrl = emailResult.previewUrl;
            response.devMode = true;
        }
        res.json(response);
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Erreur lors de la demande de réinitialisation' });
    }
});

// Réinitialiser le mot de passe avec le token
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: 'Token et nouveau mot de passe requis' });
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({ message: passwordValidation.message });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            password_reset_token: hashedToken,
            password_reset_expires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Lien invalide ou expiré. Veuillez faire une nouvelle demande.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        user.password_hash = passwordHash;
        user.password_reset_token = undefined;
        user.password_reset_expires = undefined;
        await user.save();

        await logActivity(user._id.toString(), 'password_reset', 'user', user._id.toString(), req);

        res.json({ message: 'Mot de passe réinitialisé avec succès' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Erreur lors de la réinitialisation du mot de passe' });
    }
});

// --- Inscription parent via invitation (lien envoyé à l'email du tuteur) ---

// GET invitation : valider le token et retourner les infos pour afficher le formulaire
router.get('/invitation/:token', async (req, res) => {
    try {
        const { token } = req.params;
        if (!token) {
            return res.status(400).json({ message: 'Token requis' });
        }
        const guardian = await Guardian.findOne({
            invitation_token: token,
            invitation_expires_at: { $gt: new Date() },
            status: 'invited'
        }).populate('user_id', 'first_name last_name');

        if (!guardian) {
            return res.status(400).json({
                valid: false,
                message: 'Lien invalide ou expiré. Demandez un nouvel email d\'invitation.'
            });
        }
        const child = guardian.user_id;
        res.json({
            valid: true,
            guardian_email: guardian.guardian_email,
            guardian_name: guardian.guardian_name,
            child_name: child ? `${child.first_name} ${child.last_name}` : 'Votre enfant'
        });
    } catch (error) {
        console.error('Invitation check error:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// POST register-parent : créer le compte parent et lier au Guardian
router.post('/register-parent', async (req, res) => {
    try {
        const { token, email, password, gdpr_consent, parental_consent } = req.body;

        if (!token || !email || !password) {
            return res.status(400).json({ message: 'Token, email et mot de passe requis' });
        }
        if (!gdpr_consent) {
            return res.status(400).json({ message: 'L\'acceptation des CGU est obligatoire' });
        }
        if (!parental_consent) {
            return res.status(400).json({ message: 'Le consentement parental est obligatoire' });
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({ message: passwordValidation.message });
        }

        const guardian = await Guardian.findOne({
            invitation_token: token,
            invitation_expires_at: { $gt: new Date() },
            status: 'invited'
        }).populate('user_id', 'first_name last_name');

        if (!guardian) {
            return res.status(400).json({ message: 'Lien invalide ou expiré.' });
        }

        const emailNorm = email.toLowerCase().trim();
        if (guardian.guardian_email.toLowerCase() !== emailNorm) {
            return res.status(400).json({ message: 'L\'email doit être celui qui a reçu l\'invitation.' });
        }

        const existingUser = await User.findOne({ email: emailNorm });
        if (existingUser) {
            return res.status(400).json({ message: 'Un compte existe déjà avec cet email.' });
        }

        const nameParts = (guardian.guardian_name || '').trim().split(/\s+/);
        const first_name = nameParts[0] || 'Parent';
        const last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        const passwordHash = await bcrypt.hash(password, 10);
        const parentUser = await User.create({
            email: emailNorm,
            password_hash: passwordHash,
            first_name,
            last_name: last_name || 'Parent',
            gender: 'other',
            date_of_birth: new Date('1980-01-01'),
            role: 'guardian',
            gdpr_consent: true,
            gdpr_consent_date: new Date(),
            parental_consent: true,
            parental_consent_date: new Date()
        });

        guardian.guardian_user_id = parentUser._id;
        guardian.status = 'active';
        guardian.invitation_token = undefined;
        guardian.invitation_expires_at = undefined;
        await guardian.save();

        await logActivity(parentUser._id.toString(), 'guardian_registered', 'user', guardian.user_id.toString(), req);

        const jwtToken = jwt.sign(
            { userId: parentUser._id.toString(), email: parentUser.email, role: parentUser.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        res.status(201).json({
            message: 'Compte parent créé avec succès',
            token: jwtToken,
            user: {
                id: parentUser._id.toString(),
                email: parentUser.email,
                first_name: parentUser.first_name,
                last_name: parentUser.last_name,
                role: parentUser.role
            }
        });
    } catch (error) {
        console.error('Register parent error:', error);
        res.status(500).json({ message: 'Erreur lors de la création du compte parent' });
    }
});

// Vérifier le token et obtenir les informations utilisateur
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password_hash');

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.json({ user: {
            id: user._id.toString(),
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            gender: user.gender,
            date_of_birth: user.date_of_birth,
            phone: user.phone,
            bio: user.bio,
            profile_picture_url: user.profile_picture_url,
            photos: user.photos,
            city: user.city,
            country: user.country,
            profession: user.profession,
            education: user.education,
            religion: user.religion,
            height_cm: user.height_cm,
            subscription_status: user.subscription_status,
            role: user.role,
            is_verified: user.is_verified,
            created_at: user.createdAt
        } });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
    }
});

// Vérifier si la session est encore active (route légère pour vérification rapide)
router.get('/check-session', authenticate, async (req, res) => {
    try {
        // Si on arrive ici, le token est valide (middleware authenticate a réussi)
        const user = await User.findById(req.user.id).select('email role is_active');
        
        if (!user) {
            return res.status(404).json({ 
                valid: false,
                message: 'Utilisateur non trouvé' 
            });
        }

        if (!user.is_active) {
            return res.status(403).json({ 
                valid: false,
                message: 'Compte désactivé' 
            });
        }

        res.json({ 
            valid: true,
            message: 'Session active',
            user: {
                id: user._id.toString(),
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Check session error:', error);
        res.status(500).json({ 
            valid: false,
            message: 'Erreur lors de la vérification de la session' 
        });
    }
});

// TODO: Route pour refresh token (à implémenter plus tard)
// router.post('/refresh-token', async (req, res) => {
//     try {
//         const { refreshToken } = req.body;
//         if (!refreshToken) {
//             return res.status(400).json({ message: 'Refresh token requis' });
//         }
//         
//         const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
//         const user = await User.findById(decoded.userId);
//         
//         if (!user || user.refreshToken !== refreshToken) {
//             return res.status(401).json({ message: 'Refresh token invalide' });
//         }
//         
//         const newToken = jwt.sign(
//             { userId: user._id.toString(), email: user.email, role: user.role },
//             process.env.JWT_SECRET,
//             { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
//         );
//         
//         res.json({ token: newToken });
//     } catch (error) {
//         res.status(401).json({ message: 'Refresh token invalide ou expiré' });
//     }
// });

module.exports = router;
