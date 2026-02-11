const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Guardian = require('../models/Guardian');
const Notification = require('../models/Notification');
const GroupChat = require('../models/GroupChat');
const Matchmaking = require('../models/Matchmaking');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { sendGuardianNotificationEmail } = require('../utils/email');

// Obtenir les informations du tuteur pour un utilisateur
router.get('/my-guardian', authenticate, async (req, res) => {
    try {
        const guardian = await Guardian.findOne({ user_id: req.user.id });

        if (!guardian) {
            return res.status(404).json({ message: 'Aucun tuteur trouvé' });
        }

        res.json({ guardian });
    } catch (error) {
        console.error('Get guardian error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du tuteur' });
    }
});

// Mettre à jour les informations du tuteur
router.put('/my-guardian', authenticate, async (req, res) => {
    try {
        const { guardian_email, guardian_phone, guardian_name, guardian_relationship } = req.body;

        const updateData = {};
        if (guardian_email) updateData.guardian_email = guardian_email;
        if (guardian_phone !== undefined) updateData.guardian_phone = guardian_phone;
        if (guardian_name) updateData.guardian_name = guardian_name;
        if (guardian_relationship) updateData.guardian_relationship = guardian_relationship;

        const guardian = await Guardian.findOneAndUpdate(
            { user_id: req.user.id },
            updateData,
            { new: true, runValidators: true }
        );

        if (!guardian) {
            return res.status(404).json({ message: 'Tuteur non trouvé' });
        }

        res.json({ guardian });
    } catch (error) {
        console.error('Update guardian error:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
});

// Liste des tuteurs/parents de l'utilisateur courant ayant déjà un compte (status active)
// Utilisé pour permettre d'ajouter un parent à une conversation de match
router.get('/my-guardians-with-account', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`[DEBUG] my-guardians-with-account: user_id=${userId}`);
        
        // Convertir en ObjectId pour la comparaison MongoDB
        let userObjectId;
        try {
            userObjectId = new mongoose.Types.ObjectId(userId);
        } catch (e) {
            console.error(`[DEBUG] Invalid user ObjectId format: ${userId}`, e);
            return res.status(400).json({ message: 'Format d\'ID utilisateur invalide' });
        }
        
        const guardians = await Guardian.find({
            user_id: userObjectId,
            status: 'active',
            guardian_user_id: { $exists: true, $ne: null }
        })
        .select('guardian_user_id guardian_name guardian_email status')
        .lean();

        console.log(`[DEBUG] Found ${guardians.length} guardians for user ${userId}`);
        
        // Vérifier que chaque guardian_user_id correspond à un User existant (pas besoin de vérifier le statut)
        const validGuardians = [];
        
        for (const g of guardians) {
            if (!g.guardian_user_id) {
                console.log(`[DEBUG] Guardian ${g.guardian_name}: no guardian_user_id`);
                continue;
            }
            
            const guardianUserIdStr = g.guardian_user_id.toString();
            try {
                const parentUser = await User.findById(g.guardian_user_id).select('first_name last_name');
                if (parentUser) {
                    validGuardians.push({
                        guardian_user_id: guardianUserIdStr,
                        guardian_name: g.guardian_name,
                        guardian_email: g.guardian_email
                    });
                    console.log(`[DEBUG] Guardian ${g.guardian_name}: valid (User exists, ID: ${guardianUserIdStr})`);
                } else {
                    console.log(`[DEBUG] Guardian ${g.guardian_name}: User not found (ID: ${guardianUserIdStr})`);
                }
            } catch (err) {
                console.error(`[DEBUG] Error checking User for guardian ${g.guardian_name} (ID: ${guardianUserIdStr}):`, err);
            }
        }

        console.log(`[DEBUG] Returning ${validGuardians.length} valid guardians with accounts`);
        const list = validGuardians;

        console.log(`[DEBUG] Returning ${list.length} guardians with valid IDs`);
        res.json({ guardians: list });
    } catch (error) {
        console.error('Get my guardians with account error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des parents' });
    }
});

// Pour l'espace tuteur : infos du tuteur connecté + la personne dont il est le tuteur (ward)
router.get('/me-and-ward', authenticate, async (req, res) => {
    try {
        const guardian = await Guardian.findOne({ guardian_user_id: req.user.id })
            .populate('user_id', 'first_name last_name email date_of_birth city country');

        if (!guardian) {
            return res.status(404).json({ message: 'Profil tuteur non trouvé' });
        }

        const ward = guardian.user_id;
        res.json({
            guardian: {
                guardian_name: guardian.guardian_name,
                guardian_email: guardian.guardian_email,
                guardian_phone: guardian.guardian_phone || '',
                guardian_relationship: guardian.guardian_relationship,
                status: guardian.status
            },
            ward: ward ? {
                id: ward._id,
                first_name: ward.first_name,
                last_name: ward.last_name,
                email: ward.email,
                date_of_birth: ward.date_of_birth,
                city: ward.city,
                country: ward.country
            } : null
        });
    } catch (error) {
        console.error('Get me-and-ward error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
    }
});

// Obtenir les notifications du tuteur (pour l'espace tuteur)
router.get('/notifications', authenticate, async (req, res) => {
    try {
        // Trouver le guardian_id associé à l'utilisateur connecté (tuteur = guardian_user_id)
        const guardian = await Guardian.findOne({ guardian_user_id: req.user.id });
        if (!guardian) {
            return res.status(404).json({ message: 'Tuteur non trouvé' });
        }

        const notifications = await Notification.find({ guardian_id: guardian._id })
            .populate({
                path: 'related_matchmaking_id',
                populate: [
                    { path: 'requester_id', select: 'first_name last_name' },
                    { path: 'target_id', select: 'first_name last_name' }
                ]
            })
            .sort({ createdAt: -1 });

        res.json({ notifications });
    } catch (error) {
        console.error('Get guardian notifications error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des notifications' });
    }
});

// Obtenir les groupes de discussion du tuteur
router.get('/group-chats', authenticate, async (req, res) => {
    try {
        const guardian = await Guardian.findOne({ guardian_user_id: req.user.id });

        if (!guardian) {
            return res.status(404).json({ message: 'Tuteur non trouvé' });
        }

        // Récupérer les groupes où le guardian est dans participant_ids OU readonly_participant_ids (groupes de match)
        const matchGroups = await GroupChat.find({
            $or: [
                { participant_ids: req.user.id },
                { readonly_participant_ids: req.user.id }
            ],
            is_active: true,
            match_id: { $exists: true, $ne: null }
        })
        .populate('match_id', 'user1 user2 status')
        .populate('participant_ids', 'first_name last_name profile_picture_url')
        .populate('readonly_participant_ids', 'first_name last_name profile_picture_url')
        .sort({ updatedAt: -1 })
        .lean();

        // Récupérer les groupes matchmaking (ancien système)
        const matchmakingGroups = await GroupChat.find({
            guardian_id: guardian._id,
            is_active: true
        })
        .populate({
            path: 'matchmaking_id',
            select: 'status'
        })
        .populate('requester_id', 'first_name last_name profile_picture_url')
        .populate('target_id', 'first_name last_name profile_picture_url')
        .sort({ updatedAt: -1 })
        .lean();

        // Formater les groupes de match pour l'affichage
        const formattedMatchGroups = matchGroups.map(group => {
            const match = group.match_id;
            const activeParticipants = group.participant_ids || [];
            const readonlyParticipants = group.readonly_participant_ids || [];
            const user1Id = match?.user1?.toString();
            const user2Id = match?.user2?.toString();
            
            // Vérifier si le guardian actuel est en lecture seule
            const currentUserId = req.user.id.toString();
            const isReadonly = readonlyParticipants.some(p => {
                const pid = p._id?.toString() || p.toString();
                return pid === currentUserId;
            });
            
            // Combiner tous les participants (actifs + lecture seule)
            const allParticipants = [
                ...activeParticipants.map(p => ({ ...p, readonly: false })),
                ...readonlyParticipants.map(p => ({ ...p, readonly: true }))
            ];
            
            // Identifier les candidats (user1 et user2) et les guardians
            const participantsWithRole = allParticipants.map(p => {
                const pid = p._id?.toString();
                let role = 'guardian';
                if (pid === user1Id) role = 'user1';
                else if (pid === user2Id) role = 'user2';
                
                return {
                    user_id: pid,
                    first_name: p.first_name,
                    last_name: p.last_name,
                    role,
                    readonly: p.readonly || false
                };
            });
            
            const candidates = participantsWithRole.filter(p => p.role === 'user1' || p.role === 'user2');
            
            return {
                _id: group._id,
                id: group._id.toString(),
                type: 'match',
                match_id: match?._id?.toString(),
                participants: participantsWithRole,
                candidates: candidates.map(c => ({
                    first_name: c.first_name,
                    last_name: c.last_name
                })),
                readonly: isReadonly, // Flag pour indiquer si le guardian actuel est en lecture seule
                updatedAt: group.updatedAt,
                createdAt: group.createdAt
            };
        });

        // Formater les groupes matchmaking
        const formattedMatchmakingGroups = matchmakingGroups.map(group => ({
            _id: group._id,
            id: group._id.toString(),
            type: 'matchmaking',
            requester_first_name: group.requester_id?.first_name || '',
            requester_last_name: group.requester_id?.last_name || '',
            target_first_name: group.target_id?.first_name || '',
            target_last_name: group.target_id?.last_name || '',
            updatedAt: group.updatedAt,
            createdAt: group.createdAt
        }));

        // Combiner les deux types de groupes
        const allGroups = [...formattedMatchGroups, ...formattedMatchmakingGroups].sort((a, b) => {
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });

        console.log(`[DEBUG] Guardian ${guardian.guardian_name} - Found ${allGroups.length} groups (${formattedMatchGroups.length} match groups, ${formattedMatchmakingGroups.length} matchmaking groups)`);

        res.json({ groupChats: allGroups });
    } catch (error) {
        console.error('Get guardian group chats error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des discussions' });
    }
});

module.exports = router;
