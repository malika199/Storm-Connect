const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Match = require('../models/Match');
const Matchmaking = require('../models/Matchmaking');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const Guardian = require('../models/Guardian');
const GroupChat = require('../models/GroupChat');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

// Middleware pour toutes les routes admin
router.use(authenticate);
router.use(requireAdmin);

// Obtenir toutes les demandes de mise en relation en attente
router.get('/matchmaking/pending', async (req, res) => {
    try {
        const requests = await Matchmaking.find({ status: 'pending' })
            .populate('requester_id', 'first_name last_name email profile_picture_url phone bio')
            .populate('target_id', 'first_name last_name email profile_picture_url phone bio')
            .sort({ createdAt: -1 });

        // Ajouter les informations des guardians pour chaque requête
        const requestsWithGuardians = await Promise.all(requests.map(async (request) => {
            const targetId = request.target_id._id || request.target_id;
            const guardian = await Guardian.findOne({ user_id: targetId });
            return {
                ...request.toObject(),
                guardian: guardian ? {
                    guardian_name: guardian.guardian_name,
                    guardian_email: guardian.guardian_email,
                    guardian_phone: guardian.guardian_phone
                } : null
            };
        }));

        res.json({ requests: requestsWithGuardians });
    } catch (error) {
        console.error('Get pending matchmaking error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
});

// Obtenir toutes les demandes (tous statuts)
router.get('/matchmaking/all', async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        const query = {};
        if (status) {
            query.status = status;
        }

        const requests = await Matchmaking.find(query)
            .populate('requester_id', 'first_name last_name email')
            .populate('target_id', 'first_name last_name email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(offset));

        res.json({ requests });
    } catch (error) {
        console.error('Get all matchmaking error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
});

// Obtenir les profils en attente de vérification d'identité
router.get('/users/pending-verification', async (req, res) => {
    try {
        const users = await User.find({
            id_verification_status: 'pending',
            id_document_url: { $ne: null }
        })
        .select('email first_name last_name id_verification_status id_document_url createdAt profile_picture_url')
        .sort({ createdAt: -1 });

        res.json({ users });
    } catch (error) {
        console.error('Get pending verification error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
});

// Obtenir les profils non encore validés (is_verified === false)
router.get('/users/pending-profile-validation', async (req, res) => {
    try {
        const users = await User.find({
            is_verified: false,
            role: 'user'
        })
        .select('email first_name last_name is_verified profile_validation_status createdAt profile_picture_url bio city country profession education')
        .sort({ createdAt: -1 });

        res.json({ users });
    } catch (error) {
        console.error('Get pending profile validation error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
});

// Valider un profil utilisateur (vérification d'identité)
router.post('/users/:id/verify', async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndUpdate(
            id,
            {
                id_verification_status: 'verified',
                is_verified: true
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        await logActivity(req.user.id, 'user_verified', 'user', id, req);

        res.json({ message: 'Profil vérifié avec succès' });
    } catch (error) {
        console.error('Verify user error:', error);
        res.status(500).json({ message: 'Erreur lors de la vérification' });
    }
});

// Valider le profil d'un utilisateur (validation du profil pour le matching)
router.post('/users/:id/validate-profile', async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Mise à jour en base de données : is_verified = true
        user.is_verified = true;
        await user.save();

        // Notifier l'utilisateur que son profil est validé et qu'il peut maintenant matcher
        await Notification.create({
            user_id: id,
            type: 'profile_approved',
            title: 'Profil validé !',
            message: 'Votre profil a été validé par l\'administrateur. Vous pouvez maintenant liker d\'autres profils et créer des matches.'
        });

        await logActivity(req.user.id, 'profile_validated', 'user', id, req);

        res.json({ message: 'Profil validé avec succès' });
    } catch (error) {
        console.error('Validate profile error:', error);
        res.status(500).json({ message: 'Erreur lors de la validation' });
    }
});

// Rejeter le profil d'un utilisateur
router.post('/users/:id/reject-profile', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const user = await User.findByIdAndUpdate(
            id,
            {
                is_verified: false,
                profile_validation_status: 'rejected',
                profile_validated_at: new Date(),
                profile_validated_by: req.user.id
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Notifier l'utilisateur
        await Notification.create({
            user_id: id,
            type: 'profile_rejected',
            title: 'Profil rejeté',
            message: `Votre profil a été rejeté. Raison: ${reason || 'Non spécifiée'}. Veuillez contacter le support pour plus d'informations.`
        });

        await logActivity(req.user.id, 'profile_rejected', 'user', id, req);

        res.json({ message: 'Profil rejeté' });
    } catch (error) {
        console.error('Reject profile error:', error);
        res.status(500).json({ message: 'Erreur lors du rejet' });
    }
});

// Rejeter un profil utilisateur
router.post('/users/:id/reject-verification', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const user = await User.findByIdAndUpdate(
            id,
            { id_verification_status: 'rejected' },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Créer une notification pour l'utilisateur
        await Notification.create({
            user_id: id,
            type: 'verification_rejected',
            title: 'Vérification rejetée',
            message: `Votre pièce d'identité a été rejetée. Raison: ${reason || 'Non spécifiée'}`
        });

        await logActivity(req.user.id, 'user_verification_rejected', 'user', id, req);

        res.json({ message: 'Vérification rejetée' });
    } catch (error) {
        console.error('Reject verification error:', error);
        res.status(500).json({ message: 'Erreur lors du rejet' });
    }
});

// Obtenir les statistiques
router.get('/statistics', async (req, res) => {
    try {
        const stats = {};

        // Total utilisateurs
        stats.totalUsers = await User.countDocuments({ role: 'user' });

        // Utilisateurs actifs
        stats.activeUsers = await User.countDocuments({ is_active: true, role: 'user' });

        // Utilisateurs vérifiés
        stats.verifiedUsers = await User.countDocuments({ is_verified: true });

        // Profils non encore validés (is_verified === false)
        stats.pendingProfileValidations = await User.countDocuments({ 
            is_verified: false, 
            role: 'user' 
        });

        // Demandes de match en attente de like réciproque
        stats.pendingReciprocalLikes = await Match.countDocuments({ 
            status: 'pending_reciprocal_like' 
        });
        
        // Demandes de match en attente de validation admin (like réciproque fait)
        stats.pendingMatchValidations = await Match.countDocuments({ 
            status: 'pending_admin_validation' 
        });

        // Matches validés
        stats.validatedMatches = await Match.countDocuments({ 
            status: 'validated' 
        });

        // Demandes en attente (Matchmaking)
        stats.pendingMatches = await Matchmaking.countDocuments({ status: 'pending' });

        // Demandes validées (Matchmaking)
        stats.validatedMatchmaking = await Matchmaking.countDocuments({ status: 'validated_by_admin' });

        // Revenus totaux
        const revenueResult = await Payment.aggregate([
            { $match: { status: 'succeeded' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        stats.totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        // Abonnements actifs
        stats.activeSubscriptions = await Subscription.countDocuments({ status: 'active' });

        res.json({ statistics: stats });
    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
    }
});

// Obtenir tous les utilisateurs
router.get('/users', async (req, res) => {
    try {
        const { limit = 50, offset = 0, search } = req.query;

        const query = { role: 'user' };
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { first_name: { $regex: search, $options: 'i' } },
                { last_name: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('email first_name last_name gender createdAt is_active is_verified subscription_status id_verification_status profile_validation_status')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(offset));

        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
});

// Désactiver/Activer un utilisateur
router.post('/users/:id/toggle-active', async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        user.is_active = !user.is_active;
        await user.save();

        await logActivity(req.user.id, `user_${user.is_active ? 'activated' : 'deactivated'}`, 'user', id, req);

        res.json({ 
            message: `Utilisateur ${user.is_active ? 'activé' : 'désactivé'}`,
            user: {
                id: user._id.toString(),
                is_active: user.is_active
            }
        });
    } catch (error) {
        console.error('Toggle user active error:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
});

// Obtenir toutes les demandes de match en attente de validation admin (like réciproque déjà fait)
router.get('/matches/pending', async (req, res) => {
    try {
        // Seulement les matches où les deux se sont likés : en attente de validation admin
        const matches = await Match.find({
            status: 'pending_admin_validation'
        })
        .populate('user1', 'first_name last_name email profile_picture_url bio city country')
        .populate('user2', 'first_name last_name email profile_picture_url bio city country')
        .sort({ createdAt: -1 });

        res.json({ matches });
    } catch (error) {
        console.error('Get pending matches error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
});

// Valider une demande de match
router.post('/matches/:id/validate', async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;

        const match = await Match.findById(id);
        if (!match) {
            return res.status(404).json({ message: 'Match non trouvé' });
        }

        if (match.status !== 'pending_admin_validation') {
            return res.status(400).json({ message: 'Ce match a déjà été traité' });
        }

        // Valider le match - ONLY admin can do this
        match.status = 'validated';
        match.validated_at = new Date();
        match.validated_by = req.user.id;
        match.is_active = true;
        if (notes) {
            match.validation_notes = notes;
        }

        // Créer la conversation de groupe supervisée : 2 enfants + tous les parents (statut ACTIF)
        const guardians = await Guardian.find({
            user_id: { $in: [match.user1, match.user2] },
            status: 'active',
            guardian_user_id: { $exists: true, $ne: null }
        }).select('guardian_user_id');
        const parentIds = guardians.map((g) => g.guardian_user_id).filter(Boolean);
        const participantIds = [
            match.user1,
            match.user2,
            ...parentIds
        ];
        const groupChat = await GroupChat.create({
            match_id: match._id,
            participant_ids: participantIds,
            is_active: true
        });
        match.group_chat_id = groupChat._id;
        await match.save();

        // Récupérer les infos des utilisateurs pour les notifications
        const user1 = await User.findById(match.user1).select('first_name last_name');
        const user2 = await User.findById(match.user2).select('first_name last_name');

        // Notifier les deux utilisateurs : l'admin a validé le match, ils peuvent communiquer
        await Notification.create({
            user_id: match.user1,
            type: 'match_approved',
            title: 'Match validé !',
            message: `L'admin a validé votre match avec ${user2.first_name} ${user2.last_name}. Vous pouvez maintenant communiquer.`
        });

        await Notification.create({
            user_id: match.user2,
            type: 'match_approved',
            title: 'Match validé !',
            message: `L'admin a validé votre match avec ${user1.first_name} ${user1.last_name}. Vous pouvez maintenant communiquer.`
        });

        await logActivity(req.user.id, 'match_validated', 'match', id, req);

        res.json({ message: 'Match validé avec succès' });
    } catch (error) {
        console.error('Validate match error:', error);
        res.status(500).json({ message: 'Erreur lors de la validation' });
    }
});

// Rejeter une demande de match
router.post('/matches/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const match = await Match.findById(id);
        if (!match) {
            return res.status(404).json({ message: 'Match non trouvé' });
        }

        if (match.status !== 'pending_admin_validation') {
            return res.status(400).json({ message: 'Ce match a déjà été traité' });
        }

        // Rejeter le match - ONLY admin can do this
        match.status = 'rejected';
        match.validated_at = new Date();
        match.validated_by = req.user.id;
        match.is_active = false; // Keep inactive - users will never see this match
        if (reason) {
            match.validation_notes = reason;
        }
        await match.save();

        // Notifier les deux utilisateurs
        await Notification.create({
            user_id: match.user1,
            type: 'match_rejected',
            title: 'Match rejeté',
            message: `Votre demande de match a été rejetée. ${reason ? `Raison: ${reason}` : ''}`
        });

        await Notification.create({
            user_id: match.user2,
            type: 'match_rejected',
            title: 'Match rejeté',
            message: `Votre demande de match a été rejetée. ${reason ? `Raison: ${reason}` : ''}`
        });

        await logActivity(req.user.id, 'match_rejected', 'match', id, req);

        res.json({ message: 'Match rejeté' });
    } catch (error) {
        console.error('Reject match error:', error);
        res.status(500).json({ message: 'Erreur lors du rejet' });
    }
});

module.exports = router;
