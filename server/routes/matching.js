const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
const User = require('../models/User');
const Like = require('../models/Like');
const Skip = require('../models/Skip');
const Match = require('../models/Match');
const DirectMessage = require('../models/DirectMessage');
const GroupChat = require('../models/GroupChat');
const GroupMessage = require('../models/GroupMessage');
const Notification = require('../models/Notification');
const BlockedUser = require('../models/BlockedUser');
const SearchCriteria = require('../models/SearchCriteria');
const Guardian = require('../models/Guardian');
const { authenticate } = require('../middleware/auth');

// Multer pour l'upload de photos dans les messages
const messageImageStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, 'msg-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
    }
});
const uploadMessageImage = multer({
    storage: messageImageStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/i;
        if (allowed.test(file.mimetype) && allowed.test(path.extname(file.originalname))) {
            cb(null, true);
        } else {
            cb(new Error('Format d\'image non autorisé'));
        }
    }
}).single('image');

// Obtenir les profils à découvrir (genre opposé uniquement)
router.get('/discover', authenticate, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        if (!currentUser) {
            return res.status(404).json({ message: 'Utilisateur non trouvé', profiles: [] });
        }

        // Vérifier que l'utilisateur a un genre défini
        if (!currentUser.gender) {
            return res.status(400).json({ 
                message: 'Veuillez compléter votre profil avec votre genre', 
                profiles: [] 
            });
        }

        // Profil doit être validé (is_verified) pour voir les profils et liker
        if (!currentUser.is_verified) {
            return res.status(403).json({ 
                message: 'Votre profil doit être validé par l\'admin avant de pouvoir découvrir et liker des profils.', 
                profiles: [] 
            });
        }

        // Déterminer le genre opposé
        const targetGender = currentUser.gender === 'male' ? 'female' : 'male';

        // Récupérer les utilisateurs déjà likés - S'ASSURER QUE TOUS LES LIKES SONT EXCLUS
        const alreadyLiked = await Like.find({ from_user: req.user.id }).select('to_user');
        const likedUserIds = alreadyLiked.map(like => {
            // to_user est déjà un ObjectId, le convertir en string
            return like.to_user.toString();
        });
        
        // Récupérer les utilisateurs déjà skippés (dislikés)
        const alreadySkipped = await Skip.find({ from_user: req.user.id }).select('to_user');
        const skippedUserIds = alreadySkipped.map(skip => skip.to_user.toString());
        
        // Récupérer les utilisateurs bloqués (dans les deux sens)
        const blockedByMe = await BlockedUser.find({ blocker_id: req.user.id }).select('blocked_id');
        const blockedMe = await BlockedUser.find({ blocked_id: req.user.id }).select('blocker_id');
        const blockedUserIds = [
            ...blockedByMe.map(block => block.blocked_id.toString()),
            ...blockedMe.map(block => block.blocker_id.toString())
        ];
        
        console.log(`[DISCOVER] User ${req.user.id} - Likes trouvés: ${likedUserIds.length}, Skips trouvés: ${skippedUserIds.length}, Bloqués: ${blockedUserIds.length}`);

        // Récupérer les IDs des utilisateurs avec qui on a un match VALIDÉ
        // Exclude only validated matches (users can still see profiles with pending matches)
        const matches = await Match.find({
            $or: [
                { user1: req.user.id },
                { user2: req.user.id }
            ],
            status: 'validated', // Only exclude validated matches
            is_active: true
        }).select('user1 user2');
        
        const matchedUserIds = matches.map(match => {
            return match.user1.toString() === req.user.id 
                ? match.user2.toString() 
                : match.user1.toString();
        });

        // Combiner les IDs à exclure (likés + matchés + skippés + bloqués)
        const excludedUserIds = [...new Set([...likedUserIds, ...matchedUserIds, ...skippedUserIds, ...blockedUserIds])];
        
        // Convertir en ObjectId pour la requête MongoDB
        const excludedObjectIds = excludedUserIds.map(id => {
            try {
                return new mongoose.Types.ObjectId(id);
            } catch (e) {
                return id; // Si ce n'est pas un ObjectId valide, garder tel quel
            }
        });

        // Récupérer les profils du genre opposé, validés (is_verified), non encore likés et sans match
        const query = {
            _id: { 
                $ne: new mongoose.Types.ObjectId(req.user.id), 
                $nin: excludedObjectIds 
            },
            gender: targetGender,
            is_active: true,
            role: 'user',
            is_verified: true,
            first_name: { $exists: true, $ne: null }
        };

        // Appliquer les critères de recherche (fumeur, halal, alcool, taille, ville, pays)
        const searchCriteria = await SearchCriteria.findOne({ user_id: req.user.id });
        if (searchCriteria) {
            if (searchCriteria.preferred_smoker === true) query.smoker = true;
            if (searchCriteria.preferred_smoker === false) query.smoker = false;
            if (searchCriteria.preferred_halal === true) query.halal = true;
            if (searchCriteria.preferred_halal === false) query.halal = false;
            if (searchCriteria.preferred_alcohol === true) query.alcohol = true;
            if (searchCriteria.preferred_alcohol === false) query.alcohol = false;
            if (searchCriteria.min_height_cm != null || searchCriteria.max_height_cm != null) {
                query.height_cm = {};
                if (searchCriteria.min_height_cm != null) query.height_cm.$gte = searchCriteria.min_height_cm;
                if (searchCriteria.max_height_cm != null) query.height_cm.$lte = searchCriteria.max_height_cm;
            }
            if (searchCriteria.preferred_city) query.city = { $regex: searchCriteria.preferred_city, $options: 'i' };
            if (searchCriteria.preferred_country) query.country = { $regex: searchCriteria.preferred_country, $options: 'i' };
        }

        const profiles = await User.find(query)
        .select('first_name last_name date_of_birth bio profile_picture_url photos city country profession education religion height_cm smoker halal alcohol is_verified')
        .limit(50);

        // Double vérification : exclure les profils déjà likés
        const validProfiles = profiles.filter(p => {
            if (!p || !p.first_name) return false;
            
            const profileId = p._id.toString();
            // Vérification stricte : ne JAMAIS inclure les profils déjà likés
            // Comparer les IDs en string pour éviter les problèmes de type
            const isLiked = likedUserIds.some(likedId => {
                const likedIdStr = String(likedId);
                const profileIdStr = String(profileId);
                return likedIdStr === profileIdStr;
            });
            if (isLiked) {
                return false;
            }
            return true;
        });
        
        console.log(`[DISCOVER] User ${req.user.id} - Genre: ${targetGender}, Likes exclus: ${likedUserIds.length}, Skips exclus: ${skippedUserIds.length}, Profils trouvés: ${validProfiles.length} sur ${profiles.length}`);


        res.json({ profiles: validProfiles });
    } catch (error) {
        console.error('Error fetching discover profiles:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des profils', profiles: [] });
    }
});

// Liker un profil
router.post('/like/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;

        if (userId === req.user.id) {
            return res.status(400).json({ message: 'Vous ne pouvez pas vous liker vous-même' });
        }

        // Vérifier que le profil de l'utilisateur actuel est validé (is_verified) pour pouvoir liker
        const currentUser = await User.findById(req.user.id);
        if (!currentUser) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        if (!currentUser.is_verified) {
            return res.status(403).json({ 
                message: 'Votre profil doit être validé par l\'admin avant de pouvoir liker.' 
            });
        }

        // Vérifier que l'utilisateur cible existe et est validé (is_verified) pour être liké
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        if (!targetUser.is_verified) {
            return res.status(403).json({ 
                message: 'Ce profil n\'est pas encore validé. Vous ne pouvez liker que les profils validés.' 
            });
        }

        // Vérifier qu'aucun blocage n'existe entre les deux utilisateurs
        const blockExists = await BlockedUser.findOne({
            $or: [
                { blocker_id: req.user.id, blocked_id: userId },
                { blocker_id: userId, blocked_id: req.user.id }
            ]
        });

        if (blockExists) {
            return res.status(403).json({ 
                message: 'Vous ne pouvez pas liker cet utilisateur en raison d\'un blocage.' 
            });
        }

        // Vérifier si déjà liké
        const existingLike = await Like.findOne({ from_user: req.user.id, to_user: userId });
        if (existingLike) {
            return res.status(400).json({ message: 'Vous avez déjà liké ce profil' });
        }

        // Créer le like
        const like = await Like.create({
            from_user: req.user.id,
            to_user: userId
        });

        // Notifier la personne likée qu'elle a reçu un like (pour qu'elle me voie dans "ils vous aiment")
        await Notification.create({
            user_id: userId,
            type: 'like_received',
            title: 'Nouveau like !',
            message: `${currentUser.first_name} ${currentUser.last_name} vous a liké.`
        });

        // Vérifier si l'autre personne nous a déjà liké
        const reverseLike = await Like.findOne({ from_user: userId, to_user: req.user.id });
        
        if (reverseLike) {
            // STATUS 2: MATCH RÉCIPROQUE - Les deux personnes se sont likées
            // Il faut maintenant la validation de l'admin
            
            // Mettre à jour les deux likes
            like.is_match = true;
            like.matched_at = new Date();
            await like.save();

            reverseLike.is_match = true;
            reverseLike.matched_at = new Date();
            await reverseLike.save();

            // Vérifier si un match existe déjà (au cas où)
            let match = await Match.findOne({
                $or: [
                    { user1: req.user.id, user2: userId },
                    { user1: userId, user2: req.user.id }
                ]
            });

            if (match) {
                // Mettre à jour le match existant vers pending_admin_validation
                match.status = 'pending_admin_validation';
                await match.save();
            } else {
                // Créer un nouveau match avec status pending_admin_validation
                match = await Match.create({
                    user1: req.user.id,
                    user2: userId,
                    status: 'pending_admin_validation',
                    is_active: false // Inactif jusqu'à validation admin
                });
            }

            // Notifier l'admin qu'une nouvelle demande de match réciproque est en attente
            const admins = await User.find({ role: 'admin' });
            for (const admin of admins) {
                await Notification.create({
                    user_id: admin._id,
                    type: 'match_request_pending',
                    title: 'Nouvelle demande de match réciproque',
                    message: `${currentUser.first_name} ${currentUser.last_name} et ${targetUser.first_name} ${targetUser.last_name} se sont mutuellement likés. Validation requise.`
                });
            }

            // Notifier les deux utilisateurs qu'ils se sont likés en retour
            await Notification.create({
                user_id: req.user.id,
                type: 'match_reciprocal_created',
                title: 'Like réciproque !',
                message: `Vous avez liké en retour ${targetUser.first_name} ${targetUser.last_name}. En attente de validation par l'administrateur.`
            });

            await Notification.create({
                user_id: userId,
                type: 'match_reciprocal_created',
                title: 'Like réciproque !',
                message: `Vous avez liké en retour ${currentUser.first_name} ${currentUser.last_name}. En attente de validation par l'administrateur.`
            });
        } else {
            // STATUS 1: PREMIER LIKE - Créer un match avec status pending_reciprocal_like
            // L'autre personne doit liker en retour ET l'admin doit valider
            
            // Vérifier si un match existe déjà
            let match = await Match.findOne({
                $or: [
                    { user1: req.user.id, user2: userId },
                    { user1: userId, user2: req.user.id }
                ]
            });

            if (!match) {
                // Créer un match avec status pending_reciprocal_like
                match = await Match.create({
                    user1: req.user.id,
                    user2: userId,
                    status: 'pending_reciprocal_like',
                    is_active: false // Inactif jusqu'à like réciproque + validation
                });
            }
        }

        // Return like confirmation with appropriate message
        let responseMessage = 'Vous avez liké cette personne';
        
        if (reverseLike) {
            // Like réciproque détecté
            responseMessage = 'Vous avez liké en retour';
        }
        
        res.json({ 
            success: true, 
            likedUserName: `${targetUser.first_name} ${targetUser.last_name}`,
            message: responseMessage,
            isReciprocal: !!reverseLike,
            statusMessage: responseMessage // Pour le frontend
        });
    } catch (error) {
        console.error('Error liking profile:', error);
        res.status(500).json({ message: 'Erreur lors du like' });
    }
});

// Passer un profil (skip/dislike)
router.post('/skip/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;

        if (userId === req.user.id) {
            return res.status(400).json({ message: 'Vous ne pouvez pas vous passer vous-même' });
        }

        // Vérifier si déjà skippé
        const existingSkip = await Skip.findOne({ from_user: req.user.id, to_user: userId });
        if (existingSkip) {
            // Déjà skippé, on retourne succès quand même
            return res.json({ success: true, message: 'Profil déjà passé' });
        }

        // Créer l'enregistrement de skip pour ne plus proposer ce profil
        await Skip.create({
            from_user: req.user.id,
            to_user: userId
        });

        console.log(`[SKIP] User ${req.user.id} a passé le profil ${userId}`);

        res.json({ success: true, message: 'Profil passé' });
    } catch (error) {
        console.error('Error skipping profile:', error);
        res.status(500).json({ message: 'Erreur lors du skip' });
    }
});

// Obtenir TOUS les matches de l'utilisateur avec leurs statuts
router.get('/matches', authenticate, async (req, res) => {
    try {
        // Utilisateurs que j'ai bloqués / qui m'ont bloqué (conversation visible dans les deux cas)
        const blockedByMe = await BlockedUser.find({ blocker_id: req.user.id }).select('blocked_id');
        const blockedByMeIds = blockedByMe.map(block => block.blocked_id.toString());
        const blockedMe = await BlockedUser.find({ blocked_id: req.user.id }).select('blocker_id');
        const blockedMeIds = blockedMe.map(block => block.blocker_id.toString());

        // Récupérer TOUS les matches (tous les statuts sauf rejected)
        // Les utilisateurs peuvent voir leurs matches pour connaître leur statut
        const matches = await Match.find({
            $or: [
                { user1: req.user.id },
                { user2: req.user.id }
            ],
            status: { $in: ['pending_reciprocal_like', 'pending_admin_validation', 'validated'] }
        })
        .populate('user1', 'first_name last_name profile_picture_url')
        .populate('user2', 'first_name last_name profile_picture_url')
        .sort({ createdAt: -1 });

        // Transformer : garder TOUTES les conversations visibles (des deux côtés)
        const formattedMatches = await Promise.all(matches.map(async (match) => {
            // Pour les groupes, vérifier que l'utilisateur est toujours dans les participants
            if (match.group_chat_id) {
                const group = await GroupChat.findById(match.group_chat_id);
                if (!group || !group.participant_ids.some((id) => id.toString() === req.user.id)) {
                    // L'utilisateur n'est plus dans le groupe, ne pas inclure ce match
                    return null;
                }
            }

            const otherUser = match.user1._id.toString() === req.user.id 
                ? match.user2 
                : match.user1;
            const otherUserIdStr = otherUser._id.toString();
            
            const isBlockedByMe = blockedByMeIds.includes(otherUserIdStr);
            const isBlockedByThem = blockedMeIds.includes(otherUserIdStr);
            
            let lastMsg; let lastMessagePreview = ''; let isLastFromMe = false; let unreadCount = 0;
            if (match.group_chat_id) {
                lastMsg = await GroupMessage.findOne({ group_chat_id: match.group_chat_id })
                    .sort({ createdAt: -1 })
                    .populate('sender_id', 'first_name');
                if (lastMsg) {
                    const senderId = lastMsg.sender_id?._id?.toString() || lastMsg.sender_id?.toString();
                    isLastFromMe = senderId === req.user.id;
                    lastMessagePreview = (lastMsg.attachments && lastMsg.attachments.length) ? '📷 Photo' : (lastMsg.message_text || '');
                }
                unreadCount = await GroupMessage.countDocuments({
                    group_chat_id: match.group_chat_id,
                    sender_id: { $ne: req.user.id },
                    is_read: false
                });
            } else {
                lastMsg = await DirectMessage.findOne({ match_id: match._id })
                    .sort({ createdAt: -1 })
                    .populate('sender_id', 'first_name');
                const senderId = lastMsg?.sender_id?._id || lastMsg?.sender_id;
                isLastFromMe = lastMsg && senderId && senderId.toString() === req.user.id;
                if (lastMsg) {
                    if (lastMsg.image_url) lastMessagePreview = '📷 Photo';
                    else if (lastMsg.message_text) lastMessagePreview = lastMsg.message_text;
                }
                unreadCount = await DirectMessage.countDocuments({
                    match_id: match._id,
                    sender_id: { $ne: req.user.id },
                    is_read: false
                });
            }
            
            // Vérifier si c'est un like réciproque
            const likeFromMe = await Like.exists({
                from_user: req.user.id,
                to_user: otherUser._id
            });
            const likeFromThem = await Like.exists({
                from_user: otherUser._id,
                to_user: req.user.id
            });
            const isReciprocal = likeFromMe && likeFromThem;

            // Déterminer le statut réel à afficher
            let displayStatus = match.status;
            if (match.status === 'pending_reciprocal_like' && !isReciprocal) {
                displayStatus = 'pending_reciprocal_like';
            } else if (match.status === 'pending_reciprocal_like' && isReciprocal) {
                displayStatus = 'pending_admin_validation';
            }
            
            return {
                id: match._id,
                group_chat_id: match.group_chat_id || null,
                user: {
                    id: otherUser._id,
                    first_name: otherUser.first_name,
                    last_name: otherUser.last_name,
                    profile_picture_url: otherUser.profile_picture_url
                },
                created_at: match.createdAt,
                last_message_at: lastMsg ? lastMsg.createdAt : match.last_message_at,
                last_message_preview: lastMessagePreview,
                is_last_from_me: isLastFromMe,
                unread_count: unreadCount,
                status: displayStatus,
                is_blocked: isBlockedByMe,
                is_blocked_by_them: isBlockedByThem
            };
        }));

        // Filtrer les valeurs null (utilisateurs bloqués)
        const filteredMatches = formattedMatches.filter(match => match !== null);

        res.json({ matches: filteredMatches });
    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des matches' });
    }
});

// Obtenir les messages d'un match
router.get('/matches/:matchId/messages', authenticate, async (req, res) => {
    try {
        const { matchId } = req.params;

        // Vérifier que l'utilisateur fait partie du match ET que le match est validé
        // Users can only see messages from validated matches
        const match = await Match.findOne({
            _id: matchId,
            $or: [
                { user1: req.user.id },
                { user2: req.user.id }
            ],
            status: 'validated' // ONLY validated matches can have messages
        });

        if (!match) {
            return res.status(403).json({ message: 'Accès non autorisé ou match non validé' });
        }

        // Conversation supervisée (groupe) : les membres actifs ET les membres en lecture seule peuvent lire
        if (match.group_chat_id) {
            const group = await GroupChat.findById(match.group_chat_id);
            const isActiveParticipant = group && group.participant_ids.some((id) => id.toString() === req.user.id);
            const isReadonlyParticipant = group && group.readonly_participant_ids && group.readonly_participant_ids.some((id) => id.toString() === req.user.id);
            
            if (!group || (!isActiveParticipant && !isReadonlyParticipant)) {
                return res.status(403).json({ message: 'Accès non autorisé à cette conversation' });
            }
            const messages = await GroupMessage.find({ group_chat_id: match.group_chat_id })
                .populate('sender_id', 'first_name last_name profile_picture_url role')
                .sort({ createdAt: 1 });
            await GroupMessage.updateMany(
                {
                    group_chat_id: match.group_chat_id,
                    sender_id: { $ne: req.user.id },
                    is_read: false
                },
                { is_read: true }
            );
            return res.json({ messages, is_group: true });
        }

        // Ancien flux (sans groupe) : messages directs (rétrocompat)
        const messages = await DirectMessage.find({ match_id: matchId })
            .populate('sender_id', 'first_name last_name profile_picture_url')
            .sort({ createdAt: 1 });
        await DirectMessage.updateMany(
            { match_id: matchId, sender_id: { $ne: req.user.id }, is_read: false },
            { is_read: true }
        );
        res.json({ messages, is_group: false });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des messages' });
    }
});

// Obtenir les participants de la conversation d'un match (groupe supervisé)
router.get('/matches/:matchId/participants', authenticate, async (req, res) => {
    try {
        const { matchId } = req.params;

        const match = await Match.findOne({
            _id: matchId,
            $or: [{ user1: req.user.id }, { user2: req.user.id }],
            status: 'validated'
        });

        if (!match) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        if (!match.group_chat_id) {
            return res.json({ participants: [] });
        }

        const group = await GroupChat.findById(match.group_chat_id);
        if (!group || (!group.participant_ids || !group.participant_ids.length) && (!group.readonly_participant_ids || !group.readonly_participant_ids.length)) {
            return res.json({ participants: [] });
        }

        // Récupérer tous les participants (actifs + lecture seule)
        const allParticipantIds = [
            ...(group.participant_ids || []),
            ...(group.readonly_participant_ids || [])
        ];
        
        const users = await User.find({ _id: { $in: allParticipantIds } })
            .select('_id first_name last_name role')
            .lean();

        const activeParticipantIds = (group.participant_ids || []).map((id) => id.toString());
        const readonlyParticipantIds = (group.readonly_participant_ids || []).map((id) => id.toString());
        
        console.log(`[DEBUG] participants route - matchId=${matchId}, user1=${match.user1?.toString()}, user2=${match.user2?.toString()}`);
        console.log(`[DEBUG] participants route - participant_ids:`, activeParticipantIds);
        console.log(`[DEBUG] participants route - readonly_participant_ids:`, readonlyParticipantIds);
        
        const participants = allParticipantIds.map((pid) => {
            const pidStr = pid.toString();
            const u = users.find((us) => us._id.toString() === pidStr);
            let role = 'participant';
            if (match.user1 && match.user1.toString() === pidStr) role = 'user1';
            else if (match.user2 && match.user2.toString() === pidStr) role = 'user2';
            else role = 'guardian';
            
            const isReadonly = readonlyParticipantIds.includes(pidStr);
            
            console.log(`[DEBUG] Participant ${pidStr}: role=${role}, readonly=${isReadonly}, name=${u ? u.first_name + ' ' + u.last_name : 'not found'}`);
            return {
                user_id: pidStr,
                first_name: u ? u.first_name : '',
                last_name: u ? u.last_name : '',
                role,
                readonly: isReadonly
            };
        });

        console.log(`[DEBUG] participants route - returning ${participants.length} participants`);
        res.json({ participants });
    } catch (error) {
        console.error('Error fetching participants:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des participants' });
    }
});

// Ajouter son parent à la conversation du match (uniquement son propre parent ayant un compte)
router.post('/matches/:matchId/add-parent', authenticate, async (req, res) => {
    try {
        const { matchId } = req.params;
        let { parent_user_id } = req.body;

        if (parent_user_id == null || parent_user_id === '') {
            return res.status(400).json({ message: 'parent_user_id requis' });
        }

        // Normaliser l'id (string depuis le client ou objet MongoDB)
        const parentIdStr = typeof parent_user_id === 'string'
            ? parent_user_id
            : (parent_user_id && (parent_user_id.$oid || parent_user_id.toString && parent_user_id.toString()));
        if (!parentIdStr) {
            return res.status(400).json({ message: 'parent_user_id invalide' });
        }

        const match = await Match.findOne({
            _id: matchId,
            $or: [{ user1: req.user.id }, { user2: req.user.id }],
            status: 'validated'
        });

        if (!match) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        if (!match.group_chat_id) {
            return res.status(400).json({ message: 'Cette conversation n\'est pas un groupe' });
        }

        // Vérifier que le parent est bien un tuteur de l'utilisateur connecté avec un compte actif
        console.log(`[DEBUG] add-parent: user_id=${req.user.id}, parent_user_id=${parentIdStr}, matchId=${matchId}`);
        
        // Convertir en ObjectId pour la comparaison MongoDB
        let parentObjectId;
        try {
            parentObjectId = new mongoose.Types.ObjectId(parentIdStr);
        } catch (e) {
            console.error(`[DEBUG] Invalid ObjectId format: ${parentIdStr}`, e);
            return res.status(400).json({ message: 'Format d\'ID parent invalide' });
        }
        
        // Vérifier d'abord que le User parent existe (pas besoin de vérifier le statut, dès qu'il crée son compte il peut être ajouté)
        const parentUser = await User.findById(parentObjectId);
        if (!parentUser) {
            console.log(`[DEBUG] Parent user not found: ${parentIdStr}`);
            return res.status(404).json({
                message: 'Le compte du parent n\'existe pas.'
            });
        }

        // Essayer avec ObjectId pour être sûr de la comparaison
        const guardian = await Guardian.findOne({
            user_id: new mongoose.Types.ObjectId(req.user.id),
            guardian_user_id: parentObjectId,
            status: 'active'
        });

        if (!guardian) {
            // Vérifier si le guardian existe mais avec un statut différent ou un autre problème
            const guardianCheck = await Guardian.findOne({
                user_id: new mongoose.Types.ObjectId(req.user.id),
                guardian_user_id: parentObjectId
            });
            
            if (guardianCheck) {
                console.log(`[DEBUG] Guardian found but status=${guardianCheck.status}, expected 'active'`);
                return res.status(403).json({
                    message: `La relation avec ce parent n'est pas encore active (statut: ${guardianCheck.status}). Veuillez attendre l'activation.`
                });
            }
            
            // Vérifier si l'utilisateur a des guardians mais pas celui-ci
            const userGuardians = await Guardian.find({ user_id: new mongoose.Types.ObjectId(req.user.id) }).select('guardian_user_id guardian_name status').lean();
            console.log(`[DEBUG] User has ${userGuardians.length} guardian records total`);
            userGuardians.forEach((g, i) => {
                console.log(`[DEBUG] Guardian ${i}: name=${g.guardian_name}, guardian_user_id=${g.guardian_user_id ? g.guardian_user_id.toString() : 'null'}, status=${g.status}`);
            });
            
            return res.status(403).json({
                message: 'Ce compte n\'est pas votre parent/tuteur ou la relation n\'est pas active. Vérifiez que votre parent a bien créé son compte.'
            });
        }

        console.log(`[DEBUG] Guardian found: ${guardian.guardian_name} (${guardian.guardian_email}), Parent User exists: yes`);

        // Recharger le groupe depuis la base de données pour éviter les problèmes de cache
        const group = await GroupChat.findById(match.group_chat_id).lean();
        if (!group) {
            return res.status(404).json({ message: 'Conversation non trouvée' });
        }
        
        // Convertir en modèle Mongoose pour pouvoir le modifier
        const groupModel = await GroupChat.findById(match.group_chat_id);
        if (!groupModel) {
            return res.status(404).json({ message: 'Conversation non trouvée' });
        }

        // Vérifier si le parent est déjà dans les participants avec une double vérification
        // Méthode 1: Vérification directe dans MongoDB
        const existsInDB = await GroupChat.findOne({
            _id: match.group_chat_id,
            participant_ids: parentObjectId
        });
        
        // Méthode 2: Vérification manuelle sur le modèle chargé
        const participantIdStrings = groupModel.participant_ids.map((id) => {
            if (!id) return null;
            if (id.toString && typeof id.toString === 'function') {
                return id.toString().trim();
            }
            return String(id).trim();
        }).filter(id => id !== null);
        
        const parentIdStrNormalized = parentIdStr.trim();
        const parentObjectIdStr = parentObjectId.toString().trim();
        
        const isInModel = participantIdStrings.some((pidStr) => {
            return pidStr === parentIdStrNormalized || pidStr === parentObjectIdStr;
        });
        
        // Vérifier aussi avec ObjectId.equals()
        let isInModelEquals = false;
        for (const pid of groupModel.participant_ids) {
            if (pid && pid.equals && typeof pid.equals === 'function') {
                try {
                    if (pid.equals(parentObjectId)) {
                        isInModelEquals = true;
                        break;
                    }
                } catch (e) {
                    // Ignorer
                }
            }
        }
        
        const isAlreadyParticipant = existsInDB !== null || isInModel || isInModelEquals;
        
        console.log(`[DEBUG] add-parent - Group participant_ids (strings):`, participantIdStrings);
        console.log(`[DEBUG] add-parent - Group participant_ids count: ${groupModel.participant_ids.length}`);
        console.log(`[DEBUG] add-parent - Parent ID to add (string): "${parentIdStrNormalized}"`);
        console.log(`[DEBUG] add-parent - Parent ID to add (ObjectId string): "${parentObjectIdStr}"`);
        console.log(`[DEBUG] add-parent - Exists in DB query: ${existsInDB !== null}`);
        console.log(`[DEBUG] add-parent - Is in model (string): ${isInModel}`);
        console.log(`[DEBUG] add-parent - Is in model (equals): ${isInModelEquals}`);
        console.log(`[DEBUG] add-parent - Is already participant: ${isAlreadyParticipant}`);
        
        // Log détaillé de chaque comparaison
        participantIdStrings.forEach((pidStr, index) => {
            const rawId = groupModel.participant_ids[index];
            const match1 = pidStr === parentIdStrNormalized;
            const match2 = pidStr === parentObjectIdStr;
            let equalsMatch = false;
            if (rawId && rawId.equals && typeof rawId.equals === 'function') {
                try {
                    equalsMatch = rawId.equals(parentObjectId);
                } catch (e) {
                    // Ignorer
                }
            }
            console.log(`[DEBUG] add-parent - Participant ${index}: "${pidStr}" - String match1: ${match1}, String match2: ${match2}, Equals: ${equalsMatch}`);
        });
        
        if (isAlreadyParticipant) {
            console.log(`[DEBUG] add-parent - ⚠️ Parent already in conversation, skipping add`);
            return res.status(400).json({ message: 'Ce parent fait déjà partie de la conversation' });
        }
        
        console.log(`[DEBUG] add-parent - ✅ Parent NOT in conversation, proceeding with add`);

        // Ajouter le parent à la conversation
        console.log(`[DEBUG] add-parent - Adding parent to group...`);
        groupModel.participant_ids.push(parentObjectId);
        await groupModel.save();
        
        // Vérifier que l'ajout a bien fonctionné en rechargeant depuis la DB
        const verifyGroup = await GroupChat.findById(match.group_chat_id);
        const isNowInGroup = verifyGroup.participant_ids.some((id) => {
            const idStr = id.toString().trim();
            return idStr === parentIdStrNormalized || idStr === parentObjectIdStr;
        });
        
        console.log(`[DEBUG] add-parent - Successfully added parent ${parentIdStrNormalized} to group ${match.group_chat_id}`);
        console.log(`[DEBUG] add-parent - Group now has ${verifyGroup.participant_ids.length} participants`);
        console.log(`[DEBUG] add-parent - Verification: parent is now in group: ${isNowInGroup}`);
        
        if (!isNowInGroup) {
            console.error(`[DEBUG] add-parent - ERROR: Parent was not added successfully!`);
            return res.status(500).json({ message: 'Erreur lors de l\'ajout du parent' });
        }

        const parentName = parentUser ? `${parentUser.first_name} ${parentUser.last_name}` : 'Parent';

        res.json({
            message: `${parentName} a été ajouté à la conversation`,
            participants: verifyGroup.participant_ids.map(id => id.toString())
        });
    } catch (error) {
        console.error('Error adding parent to match:', error);
        res.status(500).json({ message: 'Erreur lors de l\'ajout du parent' });
    }
});

// Quitter un groupe (pour les parents uniquement)
router.post('/matches/:matchId/leave-group', authenticate, async (req, res) => {
    try {
        const { matchId } = req.params;
        const userId = req.user.id;

        // Vérifier que le match existe et est validé
        const match = await Match.findById(matchId);
        if (!match) {
            return res.status(404).json({ message: 'Match non trouvé' });
        }

        if (match.status !== 'validated') {
            return res.status(403).json({ message: 'Ce match n\'est pas encore validé' });
        }

        // Vérifier que c'est un groupe
        if (!match.group_chat_id) {
            return res.status(400).json({ message: 'Cette conversation n\'est pas un groupe' });
        }

        // Vérifier que l'utilisateur est un parent dans ce groupe
        const group = await GroupChat.findById(match.group_chat_id);
        if (!group) {
            return res.status(404).json({ message: 'Groupe non trouvé' });
        }

        // Vérifier que l'utilisateur est dans les participants
        const isParticipant = group.participant_ids.some(id => id.toString() === userId);
        if (!isParticipant) {
            return res.status(403).json({ message: 'Vous n\'êtes pas membre de ce groupe' });
        }

        // Vérifier que l'utilisateur est un parent (guardian) et non un candidat (user1 ou user2)
        const userIdStr = userId.toString();
        const isUser1 = match.user1 && match.user1.toString() === userIdStr;
        const isUser2 = match.user2 && match.user2.toString() === userIdStr;

        if (isUser1 || isUser2) {
            return res.status(403).json({ 
                message: 'Seuls les parents peuvent quitter le groupe. Les candidats ne peuvent pas quitter.' 
            });
        }

        // Retirer l'utilisateur des participants actifs et l'ajouter aux participants en lecture seule
        group.participant_ids = group.participant_ids.filter(id => id.toString() !== userIdStr);
        
        // Ajouter à readonly_participant_ids s'il n'y est pas déjà
        if (!group.readonly_participant_ids || !group.readonly_participant_ids.some(id => id.toString() === userIdStr)) {
            if (!group.readonly_participant_ids) {
                group.readonly_participant_ids = [];
            }
            group.readonly_participant_ids.push(userId);
        }
        
        await group.save();

        res.json({ message: 'Vous avez quitté le groupe avec succès. Vous pouvez toujours voir les messages mais ne pouvez plus en envoyer.' });
    } catch (error) {
        console.error('Error leaving group:', error);
        res.status(500).json({ message: 'Erreur lors de la sortie du groupe' });
    }
});

// Envoyer un message dans un match
router.post('/matches/:matchId/messages', authenticate, async (req, res) => {
    try {
        const { matchId } = req.params;
        const { message_text } = req.body;

        if (!message_text || message_text.trim().length === 0) {
            return res.status(400).json({ message: 'Le message ne peut pas être vide' });
        }

        // Vérifier que l'utilisateur fait partie du match
        const match = await Match.findOne({
            _id: matchId,
            $or: [
                { user1: req.user.id },
                { user2: req.user.id }
            ]
        });

        if (!match) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        if (match.status !== 'validated') {
            return res.status(403).json({
                message: 'Ce match n\'a pas encore été validé par un administrateur.'
            });
        }

        const otherUserId = match.user1.toString() === req.user.id ? match.user2 : match.user1;
        const blockExists = await BlockedUser.findOne({
            $or: [
                { blocker_id: req.user.id, blocked_id: otherUserId },
                { blocker_id: otherUserId, blocked_id: req.user.id }
            ]
        });
        if (blockExists) {
            return res.status(403).json({ message: 'Impossible d\'envoyer des messages en raison d\'un blocage' });
        }

        // Conversation supervisée : message dans le groupe uniquement (pas de message privé enfant-enfant)
        if (match.group_chat_id) {
            const group = await GroupChat.findById(match.group_chat_id);
            const isActiveParticipant = group && group.participant_ids.some((id) => id.toString() === req.user.id);
            const isReadonlyParticipant = group && group.readonly_participant_ids && group.readonly_participant_ids.some((id) => id.toString() === req.user.id);
            
            if (!group || !isActiveParticipant) {
                if (isReadonlyParticipant) {
                    return res.status(403).json({ message: 'Vous avez quitté ce groupe. Vous pouvez voir les messages mais ne pouvez plus en envoyer.' });
                }
                return res.status(403).json({ message: 'Accès non autorisé à cette conversation' });
            }
            let senderRole = 'guardian';
            if (match.user1.toString() === req.user.id) senderRole = 'requester';
            else if (match.user2.toString() === req.user.id) senderRole = 'target';
            const message = await GroupMessage.create({
                group_chat_id: match.group_chat_id,
                sender_id: req.user.id,
                sender_role: senderRole,
                message_text: message_text.trim()
            });
            match.last_message_at = new Date();
            await match.save();
            const populatedMessage = await GroupMessage.findById(message._id)
                .populate('sender_id', 'first_name last_name profile_picture_url role');
            return res.status(201).json({ message: populatedMessage });
        }

        // Rétrocompat : message direct (anciens matches sans groupe)
        const message = await DirectMessage.create({
            match_id: matchId,
            sender_id: req.user.id,
            message_text: message_text.trim()
        });
        match.last_message_at = new Date();
        await match.save();
        const populatedMessage = await DirectMessage.findById(message._id)
            .populate('sender_id', 'first_name last_name profile_picture_url');
        res.status(201).json({ message: populatedMessage });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Erreur lors de l\'envoi du message' });
    }
});

// Envoyer une photo dans un match
router.post('/matches/:matchId/messages/photo', authenticate, (req, res) => {
    uploadMessageImage(req, res, async (err) => {
        if (err) {
            console.error('Photo upload error:', err);
            return res.status(400).json({ message: err.message || 'Erreur lors de l\'upload' });
        }
        try {
            const { matchId } = req.params;
            const message_text = (req.body.message_text || '').trim();

            if (!req.file) {
                return res.status(400).json({ message: 'Aucune image fournie' });
            }

            const imageUrl = '/uploads/' + req.file.filename;

            const match = await Match.findOne({
                _id: matchId,
                $or: [{ user1: req.user.id }, { user2: req.user.id }]
            });

            if (!match) {
                return res.status(403).json({ message: 'Accès non autorisé' });
            }
            if (match.status !== 'validated') {
                return res.status(403).json({
                    message: 'Ce match n\'a pas encore été validé. Vous ne pouvez pas envoyer de photos.'
                });
            }

            // Vérifier qu'aucun blocage n'existe entre les deux utilisateurs
            const otherUserId = match.user1.toString() === req.user.id ? match.user2 : match.user1;
            const blockExists = await BlockedUser.findOne({
                $or: [
                    { blocker_id: req.user.id, blocked_id: otherUserId },
                    { blocker_id: otherUserId, blocked_id: req.user.id }
                ]
            });

            if (blockExists) {
                return res.status(403).json({ message: 'Impossible d\'envoyer des photos en raison d\'un blocage' });
            }

            if (match.group_chat_id) {
                const group = await GroupChat.findById(match.group_chat_id);
                const isActiveParticipant = group && group.participant_ids.some((id) => id.toString() === req.user.id);
                const isReadonlyParticipant = group && group.readonly_participant_ids && group.readonly_participant_ids.some((id) => id.toString() === req.user.id);
                
                if (!group || !isActiveParticipant) {
                    if (isReadonlyParticipant) {
                        return res.status(403).json({ message: 'Vous avez quitté ce groupe. Vous pouvez voir les messages mais ne pouvez plus en envoyer.' });
                    }
                    return res.status(403).json({ message: 'Accès non autorisé à cette conversation' });
                }
                let senderRole = 'guardian';
                if (match.user1.toString() === req.user.id) senderRole = 'requester';
                else if (match.user2.toString() === req.user.id) senderRole = 'target';
                const message = await GroupMessage.create({
                    group_chat_id: match.group_chat_id,
                    sender_id: req.user.id,
                    sender_role: senderRole,
                    message_text: message_text || '',
                    attachments: [imageUrl]
                });
                match.last_message_at = new Date();
                await match.save();
                const populatedMessage = await GroupMessage.findById(message._id)
                    .populate('sender_id', 'first_name last_name profile_picture_url role');
                return res.status(201).json({ message: populatedMessage });
            }

            const message = await DirectMessage.create({
                match_id: matchId,
                sender_id: req.user.id,
                message_text: message_text || '',
                image_url: imageUrl
            });
            match.last_message_at = new Date();
            await match.save();
            const populatedMessage = await DirectMessage.findById(message._id)
                .populate('sender_id', 'first_name last_name profile_picture_url');
            res.status(201).json({ message: populatedMessage });
        } catch (error) {
            console.error('Error sending photo message:', error);
            res.status(500).json({ message: 'Erreur lors de l\'envoi de la photo' });
        }
    });
});

// Obtenir les personnes qui nous ont liké (seulement les NOUVEAUX - ceux qu'on n'a pas encore likés en retour)
router.get('/likes-received', authenticate, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        // Trouver les likes reçus
        const likesReceived = await Like.find({
            to_user: userId
        }).select('from_user createdAt is_match');

        // Récupérer tous les IDs des personnes qui nous ont liké
        const likerIds = likesReceived.map(like => like.from_user);
        
        // Récupérer les likes qu'on a déjà faits vers ces personnes
        const ourLikes = await Like.find({
            from_user: userId,
            to_user: { $in: likerIds }
        }).select('to_user');
        
        const alreadyLikedIds = ourLikes.map(like => like.to_user.toString());

        // Filtrer pour garder SEULEMENT ceux qu'on n'a PAS encore likés en retour (nouveaux likes)
        const pendingLikerIds = likerIds.filter(id => !alreadyLikedIds.includes(id.toString()));

        // Exclure les utilisateurs bloqués (dans les deux sens)
        const blockedByMe = await BlockedUser.find({ blocker_id: userId }).select('blocked_id');
        const blockedMe = await BlockedUser.find({ blocked_id: userId }).select('blocker_id');
        const blockedUserIds = [
            ...blockedByMe.map(block => block.blocked_id.toString()),
            ...blockedMe.map(block => block.blocker_id.toString())
        ];

        const filteredLikerIds = pendingLikerIds.filter(id => !blockedUserIds.includes(id.toString()));

        // Récupérer les profils de ces personnes (seulement les nouveaux likes non bloqués)
        const profilesData = await User.find({
            _id: { $in: filteredLikerIds },
            is_active: true
        })
        .select('first_name last_name date_of_birth bio profile_picture_url photos city country profession education religion height_cm smoker halal alcohol');

        // Enrichir les profils (pas de match car on ne les a pas encore likés)
        const profiles = profilesData.map(profile => {
            return {
                ...profile.toObject()
            };
        });

        res.json({ profiles });
    } catch (error) {
        console.error('Error fetching likes received:', error);
        res.status(500).json({ message: 'Erreur', profiles: [] });
    }
});

// Obtenir le nombre de likes reçus (personnes qui nous ont liké et qu'on n'a pas encore likées en retour)
router.get('/likes-received-count', authenticate, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        // Trouver tous les likes reçus
        const likesReceived = await Like.find({
            to_user: userId
        }).select('from_user');

        const likerIds = likesReceived.map(like => like.from_user);

        // Vérifier lesquels on n'a pas encore liké en retour
        const ourLikes = await Like.find({
            from_user: userId,
            to_user: { $in: likerIds }
        }).select('to_user');

        const alreadyLikedIds = ourLikes.map(like => like.to_user.toString());
        
        // Compter seulement ceux qu'on n'a pas encore likés en retour (nouveaux likes)
        const count = likerIds.filter(id => !alreadyLikedIds.includes(id.toString())).length;

        res.json({ count });
    } catch (error) {
        console.error('Error getting likes received count:', error);
        res.status(500).json({ message: 'Erreur', count: 0 });
    }
});

// Obtenir le nombre de personnes avec messages non lus
router.get('/unread-count', authenticate, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        // Trouver tous les matches de l'utilisateur
        const matches = await Match.find({
            $or: [
                { user1: userId },
                { user2: userId }
            ],
            is_active: true
        }).select('_id');

        const matchIds = matches.map(m => m._id);

        if (matchIds.length === 0) {
            return res.json({ count: 0 });
        }

        // Compter le nombre de matches (personnes) avec au moins un message non lu
        // Utiliser aggregate pour grouper par match_id
        const unreadByMatch = await DirectMessage.aggregate([
            {
                $match: {
                    match_id: { $in: matchIds },
                    sender_id: { $ne: userId },
                    is_read: false
                }
            },
            {
                $group: {
                    _id: '$match_id'
                }
            }
        ]);

        // Le count est le nombre de matches distincts avec des messages non lus
        const count = unreadByMatch.length;

        res.json({ count });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ message: 'Erreur', count: 0 });
    }
});

module.exports = router;
