const express = require('express');
const router = express.Router();
const GroupChat = require('../models/GroupChat');
const GroupMessage = require('../models/GroupMessage');
const Guardian = require('../models/Guardian');
const User = require('../models/User');
const Match = require('../models/Match');
const BlockedUser = require('../models/BlockedUser');
const { authenticate } = require('../middleware/auth');

// Obtenir les messages d'un groupe de discussion
router.get('/group/:groupId', authenticate, async (req, res) => {
    try {
        const { groupId } = req.params;

        // Vérifier que l'utilisateur a accès à ce groupe
        const group = await GroupChat.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Groupe non trouvé' });
        }

        // Accès : groupe match (participant_ids + readonly_participant_ids) ou groupe matchmaking (requester/target/guardian)
        let hasAccess = false;
        if (group.match_id && group.participant_ids && group.participant_ids.length) {
            // Permettre l'accès aux participants actifs ET aux participants en lecture seule
            const isActiveParticipant = group.participant_ids.some((id) => id.toString() === req.user.id);
            const isReadonlyParticipant = group.readonly_participant_ids && group.readonly_participant_ids.some((id) => id.toString() === req.user.id);
            hasAccess = isActiveParticipant || isReadonlyParticipant;
        } else {
            hasAccess =
                (group.requester_id && group.requester_id.toString() === req.user.id) ||
                (group.target_id && group.target_id.toString() === req.user.id) ||
                (group.guardian_id && await Guardian.findOne({ _id: group.guardian_id, guardian_user_id: req.user.id }));
        }
        if (!hasAccess) {
            return res.status(403).json({ message: 'Accès non autorisé à ce groupe' });
        }

        if (!group.match_id && group.requester_id && group.target_id) {
            const blockExists = await BlockedUser.findOne({
                $or: [
                    { blocker_id: group.requester_id, blocked_id: group.target_id },
                    { blocker_id: group.target_id, blocked_id: group.requester_id }
                ]
            });

            if (blockExists) {
                return res.status(403).json({ message: 'Accès non autorisé en raison d\'un blocage' });
            }
        }

        const messages = await GroupMessage.find({ group_chat_id: groupId })
            .populate('sender_id', 'first_name last_name profile_picture_url')
            .sort({ createdAt: 1 });

        res.json({ messages });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des messages' });
    }
});

// Envoyer un message dans un groupe
router.post('/group/:groupId', authenticate, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { message_text, attachments } = req.body;

        if (!message_text || message_text.trim().length === 0) {
            return res.status(400).json({ message: 'Le message ne peut pas être vide' });
        }

        // Vérifier l'accès et déterminer le rôle de l'expéditeur
        const group = await GroupChat.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Groupe non trouvé' });
        }

        let hasAccess = false;
        let senderRole = 'guardian';

        if (group.match_id && group.participant_ids && group.participant_ids.length) {
            const isActiveParticipant = group.participant_ids.some((id) => id.toString() === req.user.id);
            const isReadonlyParticipant = group.readonly_participant_ids && group.readonly_participant_ids.some((id) => id.toString() === req.user.id);
            
            // Seuls les participants actifs peuvent envoyer des messages
            hasAccess = isActiveParticipant && !isReadonlyParticipant;
            
            if (hasAccess) {
                const match = await Match.findById(group.match_id);
                if (match) {
                    if (match.user1.toString() === req.user.id) senderRole = 'requester';
                    else if (match.user2.toString() === req.user.id) senderRole = 'target';
                }
            } else if (isReadonlyParticipant) {
                return res.status(403).json({ message: 'Vous avez quitté ce groupe. Vous pouvez voir les messages mais ne pouvez plus en envoyer.' });
            }
        } else {
            if (group.requester_id && group.requester_id.toString() === req.user.id) {
                hasAccess = true;
                senderRole = 'requester';
            } else if (group.target_id && group.target_id.toString() === req.user.id) {
                hasAccess = true;
                senderRole = 'target';
            } else if (group.guardian_id) {
                const guardian = await Guardian.findOne({ _id: group.guardian_id, guardian_user_id: req.user.id });
                if (guardian) {
                    hasAccess = true;
                    senderRole = 'guardian';
                }
            }
        }

        if (!hasAccess) {
            return res.status(403).json({ message: 'Accès non autorisé à ce groupe' });
        }

        if (!group.match_id && group.requester_id && group.target_id) {
            const blockExists = await BlockedUser.findOne({
                $or: [
                    { blocker_id: group.requester_id, blocked_id: group.target_id },
                    { blocker_id: group.target_id, blocked_id: group.requester_id }
                ]
            });
            if (blockExists) {
                return res.status(403).json({ message: 'Impossible d\'envoyer des messages en raison d\'un blocage' });
            }
        }

        // Créer le message
        const message = await GroupMessage.create({
            group_chat_id: groupId,
            sender_id: req.user.id,
            sender_role: senderRole,
            message_text,
            attachments: attachments || []
        });

        // Mettre à jour la date de mise à jour du groupe
        group.updatedAt = new Date();
        await group.save();

        const populatedMessage = await GroupMessage.findById(message._id)
            .populate('sender_id', 'first_name last_name profile_picture_url');

        res.status(201).json({ message: populatedMessage });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Erreur lors de l\'envoi du message' });
    }
});

// Obtenir les groupes de discussion de l'utilisateur (matchmaking + match supervisés)
router.get('/my-groups', authenticate, async (req, res) => {
    try {
        const groups = await GroupChat.find({
            $or: [
                { requester_id: req.user.id },
                { target_id: req.user.id },
                { participant_ids: req.user.id },
                { readonly_participant_ids: req.user.id }
            ],
            is_active: true
        })
        .populate({
            path: 'matchmaking_id',
            select: 'status'
        })
        .populate('requester_id', 'first_name last_name profile_picture_url')
        .populate('target_id', 'first_name last_name profile_picture_url')
        .sort({ updatedAt: -1 });

        // Ajouter le nombre de messages non lus pour chaque groupe
        const groupsWithUnread = await Promise.all(groups.map(async (group) => {
            const unreadCount = await GroupMessage.countDocuments({
                group_chat_id: group._id,
                sender_id: { $ne: req.user.id },
                is_read: false
            });
            return {
                ...group.toObject(),
                unread_count: unreadCount
            };
        }));

        res.json({ groups: groupsWithUnread });
    } catch (error) {
        console.error('Get my groups error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des groupes' });
    }
});

// Marquer les messages comme lus
router.put('/group/:groupId/read', authenticate, async (req, res) => {
    try {
        const { groupId } = req.params;

        await GroupMessage.updateMany(
            {
                group_chat_id: groupId,
                sender_id: { $ne: req.user.id },
                is_read: false
            },
            {
                is_read: true
            }
        );

        res.json({ message: 'Messages marqués comme lus' });
    } catch (error) {
        console.error('Mark messages as read error:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
});

module.exports = router;
