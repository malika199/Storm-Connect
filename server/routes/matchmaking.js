const express = require('express');
const router = express.Router();
const Matchmaking = require('../models/Matchmaking');
const User = require('../models/User');
const Guardian = require('../models/Guardian');
const GroupChat = require('../models/GroupChat');
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');
const { sendAdminValidationEmail, sendGuardianNotificationEmail } = require('../utils/email');

// Créer une demande de mise en relation
router.post('/request', authenticate, async (req, res) => {
    try {
        const { target_id } = req.body;

        if (!target_id) {
            return res.status(400).json({ message: 'ID de la cible requis' });
        }

        if (target_id === req.user.id) {
            return res.status(400).json({ message: 'Vous ne pouvez pas faire une demande à vous-même' });
        }

        // Vérifier que la cible existe et est active
        const target = await User.findById(target_id);
        if (!target) {
            return res.status(404).json({ message: 'Utilisateur cible non trouvé' });
        }

        if (!target.is_active) {
            return res.status(400).json({ message: 'Cet utilisateur n\'est plus actif' });
        }

        // Vérifier le genre (homme vers femme)
        const requester = await User.findById(req.user.id);
        if (requester.gender !== 'male' || target.gender !== 'female') {
            return res.status(400).json({ message: 'Les demandes sont uniquement autorisées d\'un homme vers une femme' });
        }

        // Vérifier s'il existe déjà une demande en cours
        const existingRequest = await Matchmaking.findOne({
            requester_id: req.user.id,
            target_id: target_id,
            status: { $in: ['pending', 'validated_by_admin', 'contacted_guardian'] }
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'Une demande est déjà en cours pour cet utilisateur' });
        }

        // Créer la demande
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // Expire dans 30 jours

        const matchmaking = await Matchmaking.create({
            requester_id: req.user.id,
            target_id: target_id,
            status: 'pending',
            expires_at: expiresAt
        });

        // Créer des notifications pour tous les admins
        const admins = await User.find({ role: 'admin' });
        const notifications = admins.map(admin => ({
            user_id: admin._id,
            type: 'match_request',
            title: 'Nouvelle demande de mise en relation',
            message: 'Une nouvelle demande nécessite votre validation',
            related_matchmaking_id: matchmaking._id
        }));
        await Notification.insertMany(notifications);

        // Envoyer un email à l'admin
        if (admins.length > 0) {
            await sendAdminValidationEmail(admins[0].email, {
                requesterName: `${requester.first_name} ${requester.last_name}`,
                targetName: `${target.first_name} ${target.last_name}`,
                createdAt: matchmaking.createdAt
            });
        }

        // Logger l'activité
        await logActivity(req.user.id, 'match_request_created', 'matchmaking', matchmaking._id.toString(), req);

        res.status(201).json({
            message: 'Demande de mise en relation créée avec succès',
            matchmaking
        });
    } catch (error) {
        console.error('Create matchmaking request error:', error);
        res.status(500).json({ message: 'Erreur lors de la création de la demande' });
    }
});

// Obtenir les demandes de l'utilisateur connecté
router.get('/my-requests', authenticate, async (req, res) => {
    try {
        const requests = await Matchmaking.find({
            $or: [
                { requester_id: req.user.id },
                { target_id: req.user.id }
            ]
        })
        .populate('requester_id', 'first_name last_name profile_picture_url')
        .populate('target_id', 'first_name last_name profile_picture_url')
        .sort({ createdAt: -1 });

        res.json({ requests });
    } catch (error) {
        console.error('Get my requests error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des demandes' });
    }
});

// Valider une demande (Admin uniquement)
router.post('/:id/validate', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_notes } = req.body;

        // Récupérer la demande
        const match = await Matchmaking.findById(id)
            .populate('target_id', 'email first_name last_name');

        if (!match) {
            return res.status(404).json({ message: 'Demande non trouvée' });
        }

        if (match.status !== 'pending') {
            return res.status(400).json({ message: 'Cette demande a déjà été traitée' });
        }

        // Mettre à jour le statut
        match.status = 'validated_by_admin';
        match.admin_notes = admin_notes || null;
        match.admin_validated_at = new Date();
        match.admin_validated_by = req.user.id;
        await match.save();

        // Récupérer le tuteur de la cible
        const targetId = match.target_id._id || match.target_id;
        const guardian = await Guardian.findOne({ user_id: targetId });

        if (guardian) {
            // Créer un groupe de discussion
            const requesterId = match.requester_id._id || match.requester_id;
            const groupChat = await GroupChat.create({
                matchmaking_id: match._id,
                requester_id: requesterId,
                target_id: targetId,
                guardian_id: guardian._id
            });

            // Mettre à jour le matchmaking avec le group_chat_id
            match.group_chat_id = groupChat._id;
            match.status = 'contacted_guardian';
            match.guardian_contacted_at = new Date();
            await match.save();

            // Créer une notification pour le tuteur
            await Notification.create({
                guardian_id: guardian._id,
                type: 'guardian_contact',
                title: 'Nouvelle mise en relation validée',
                message: `Une demande de mise en relation a été validée pour ${match.target_id.first_name} ${match.target_id.last_name}`,
                related_matchmaking_id: match._id
            });

            // Récupérer les informations du demandeur pour l'email
            const requesterName = match.requester_id 
                ? `${match.requester_id.first_name} ${match.requester_id.last_name}`
                : 'Un utilisateur';

            // Envoyer un email au tuteur
            await sendGuardianNotificationEmail(
                guardian.guardian_email,
                guardian.guardian_name,
                `${match.target_id.first_name} ${match.target_id.last_name}`,
                {
                    requesterName,
                    createdAt: match.createdAt
                }
            );
        }

        // Logger l'activité
        await logActivity(req.user.id, 'match_validated', 'matchmaking', id, req);

        res.json({ message: 'Demande validée avec succès' });
    } catch (error) {
        console.error('Validate matchmaking error:', error);
        res.status(500).json({ message: 'Erreur lors de la validation' });
    }
});

// Rejeter une demande (Admin uniquement)
router.post('/:id/reject', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_notes } = req.body;

        const match = await Matchmaking.findByIdAndUpdate(
            id,
            {
                status: 'rejected_by_admin',
                admin_notes: admin_notes || null,
                admin_validated_at: new Date(),
                admin_validated_by: req.user.id
            },
            { new: true }
        );

        if (!match) {
            return res.status(404).json({ message: 'Demande non trouvée' });
        }

        // Créer une notification pour le demandeur
        await Notification.create({
            user_id: match.requester_id,
            type: 'match_rejected',
            title: 'Demande rejetée',
            message: 'Votre demande de mise en relation a été rejetée par l\'administrateur',
            related_matchmaking_id: match._id
        });

        await logActivity(req.user.id, 'match_rejected', 'matchmaking', id, req);

        res.json({ message: 'Demande rejetée' });
    } catch (error) {
        console.error('Reject matchmaking error:', error);
        res.status(500).json({ message: 'Erreur lors du rejet' });
    }
});

module.exports = router;
