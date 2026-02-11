const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const SearchCriteria = require('../models/SearchCriteria');
const BlockedUser = require('../models/BlockedUser');
const Match = require('../models/Match');
const { authenticate } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

// Configuration de multer pour les uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'server/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Type de fichier non autorisé'));
        }
    }
});

// Obtenir le profil public d'un utilisateur (uniquement pour les matches validés)
router.get('/profile/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;

        if (userId === req.user.id) {
            return res.status(400).json({ message: 'Utilisez /api/users/profile pour votre propre profil' });
        }

        // Vérifier qu'il existe un match validé entre les deux utilisateurs
        const match = await Match.findOne({
            $or: [
                { user1: req.user.id, user2: userId },
                { user1: userId, user2: req.user.id }
            ],
            status: 'validated'
        });

        if (!match) {
            return res.status(403).json({ message: 'Accès non autorisé à ce profil' });
        }

        const user = await User.findById(userId)
            .select('first_name last_name date_of_birth gender bio profile_picture_url photos city country profession education religion height_cm smoker halal alcohol')
            .lean();

        if (!user) {
            return res.status(404).json({ message: 'Profil non trouvé' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
    }
});

// Obtenir le profil de l'utilisateur connecté
router.get('/profile', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password_hash');

        if (!user) {
            return res.status(404).json({ message: 'Profil non trouvé' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
    }
});

// Mettre à jour le profil
router.put('/profile', authenticate, async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            bio,
            city,
            country,
            profession,
            education,
            religion,
            height_cm,
            phone,
            smoker,
            halal,
            alcohol
        } = req.body;

        const updateData = {};
        if (first_name) updateData.first_name = first_name;
        if (last_name) updateData.last_name = last_name;
        if (bio !== undefined) updateData.bio = bio;
        if (city) updateData.city = city;
        if (country) updateData.country = country;
        if (profession) updateData.profession = profession;
        if (education) updateData.education = education;
        if (religion) updateData.religion = religion;
        if (height_cm) updateData.height_cm = height_cm;
        if (phone) updateData.phone = phone;
        if (smoker !== undefined) updateData.smoker = (smoker === null || smoker === '') ? null : (smoker === true || smoker === 'true');
        if (halal !== undefined) updateData.halal = (halal === null || halal === '') ? null : (halal === true || halal === 'true');
        if (alcohol !== undefined) updateData.alcohol = (alcohol === null || alcohol === '') ? null : (alcohol === true || alcohol === 'true');

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password_hash');

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        await logActivity(req.user.id, 'profile_updated', 'user', req.user.id, req);

        res.json({ message: 'Profil mis à jour', user });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
    }
});

// Upload photo de profil
router.post('/profile/picture', authenticate, upload.single('picture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier téléchargé' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { profile_picture_url: fileUrl },
            { new: true }
        );

        await logActivity(req.user.id, 'profile_picture_updated', 'user', req.user.id, req);

        res.json({ message: 'Photo de profil mise à jour', url: fileUrl });
    } catch (error) {
        console.error('Upload picture error:', error);
        res.status(500).json({ message: 'Erreur lors du téléchargement de la photo' });
    }
});

// Upload photos supplémentaires
router.post('/photos', authenticate, upload.array('photos', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Aucun fichier téléchargé' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const newPhotos = req.files.map(file => `/uploads/${file.filename}`);
        user.photos = [...(user.photos || []), ...newPhotos];
        await user.save();

        await logActivity(req.user.id, 'photos_uploaded', 'user', req.user.id, req);

        res.json({ message: 'Photos ajoutées', photos: user.photos });
    } catch (error) {
        console.error('Upload photos error:', error);
        res.status(500).json({ message: 'Erreur lors du téléchargement des photos' });
    }
});

// Upload pièce d'identité (vérification)
router.post('/verification/id', authenticate, upload.single('id_document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier téléchargé' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        
        await User.findByIdAndUpdate(req.user.id, {
            id_document_url: fileUrl,
            id_verification_status: 'pending'
        });

        await logActivity(req.user.id, 'id_document_uploaded', 'user', req.user.id, req);

        res.json({ message: 'Pièce d\'identité téléchargée, en attente de vérification', url: fileUrl });
    } catch (error) {
        console.error('Upload ID error:', error);
        res.status(500).json({ message: 'Erreur lors du téléchargement de la pièce d\'identité' });
    }
});

// Recherche d'utilisateurs (selon critères)
router.get('/search', authenticate, async (req, res) => {
    try {
        const {
            min_age,
            max_age,
            gender,
            min_height,
            max_height,
            religion,
            city,
            country,
            limit = 20,
            offset = 0
        } = req.query;

        const query = {
            _id: { $ne: req.user.id },
            is_active: true,
            is_verified: true
        };

        if (gender) {
            query.gender = gender;
        }

        if (min_age || max_age) {
            const today = new Date();
            if (max_age) {
                const minDate = new Date(today.getFullYear() - max_age - 1, today.getMonth(), today.getDate());
                query.date_of_birth = { ...query.date_of_birth, $gte: minDate };
            }
            if (min_age) {
                const maxDate = new Date(today.getFullYear() - min_age, today.getMonth(), today.getDate());
                query.date_of_birth = { ...query.date_of_birth, $lte: maxDate };
            }
        }

        if (min_height) {
            query.height_cm = { ...query.height_cm, $gte: parseInt(min_height) };
        }

        if (max_height) {
            query.height_cm = { ...query.height_cm, $lte: parseInt(max_height) };
        }

        if (religion) {
            query.religion = religion;
        }

        if (city) {
            query.city = { $regex: city, $options: 'i' };
        }

        if (country) {
            query.country = country;
        }

        const users = await User.find(query)
            .select('-password_hash')
            .limit(parseInt(limit))
            .skip(parseInt(offset))
            .sort({ createdAt: -1 });

        res.json({ users, count: users.length });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Erreur lors de la recherche' });
    }
});

// Obtenir les critères de recherche de l'utilisateur
router.get('/search-criteria', authenticate, async (req, res) => {
    try {
        const criteria = await SearchCriteria.findOne({ user_id: req.user.id });

        res.json({ criteria: criteria || null });
    } catch (error) {
        console.error('Get search criteria error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des critères' });
    }
});

// Sauvegarder les critères de recherche
router.post('/search-criteria', authenticate, async (req, res) => {
    try {
        const {
            min_age,
            max_age,
            preferred_gender,
            min_height_cm,
            max_height_cm,
            preferred_religion,
            preferred_city,
            preferred_country,
            education_preference,
            preferred_smoker,
            preferred_halal,
            preferred_alcohol
        } = req.body;

        const updateFields = { user_id: req.user.id };
        if (min_age !== undefined) updateFields.min_age = min_age;
        if (max_age !== undefined) updateFields.max_age = max_age;
        if (preferred_gender !== undefined) updateFields.preferred_gender = preferred_gender;
        if (min_height_cm !== undefined) updateFields.min_height_cm = min_height_cm;
        if (max_height_cm !== undefined) updateFields.max_height_cm = max_height_cm;
        if (preferred_religion !== undefined) updateFields.preferred_religion = preferred_religion;
        if (preferred_city !== undefined) updateFields.preferred_city = preferred_city;
        if (preferred_country !== undefined) updateFields.preferred_country = preferred_country;
        if (education_preference !== undefined) updateFields.education_preference = education_preference;
        if (preferred_smoker !== undefined) updateFields.preferred_smoker = preferred_smoker === true || preferred_smoker === 'true' ? true : preferred_smoker === false || preferred_smoker === 'false' ? false : null;
        if (preferred_halal !== undefined) updateFields.preferred_halal = preferred_halal === true || preferred_halal === 'true' ? true : preferred_halal === false || preferred_halal === 'false' ? false : null;
        if (preferred_alcohol !== undefined) updateFields.preferred_alcohol = preferred_alcohol === true || preferred_alcohol === 'true' ? true : preferred_alcohol === false || preferred_alcohol === 'false' ? false : null;

        const criteria = await SearchCriteria.findOneAndUpdate(
            { user_id: req.user.id },
            { $set: updateFields },
            { upsert: true, new: true, runValidators: true }
        );

        res.json({ criteria });
    } catch (error) {
        console.error('Save search criteria error:', error);
        res.status(500).json({ message: 'Erreur lors de la sauvegarde des critères' });
    }
});

// Bloquer un utilisateur
router.post('/block/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason, notes } = req.body;

        if (userId === req.user.id) {
            return res.status(400).json({ message: 'Vous ne pouvez pas vous bloquer vous-même' });
        }

        // Vérifier que l'utilisateur cible existe
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Vérifier si déjà bloqué
        const existingBlock = await BlockedUser.findOne({
            blocker_id: req.user.id,
            blocked_id: userId
        });

        if (existingBlock) {
            return res.status(400).json({ message: 'Cet utilisateur est déjà bloqué' });
        }

        // Créer le blocage
        await BlockedUser.create({
            blocker_id: req.user.id,
            blocked_id: userId,
            reason: reason || 'other',
            notes: notes || ''
        });

        await logActivity(req.user.id, 'user_blocked', 'user', userId, req);

        res.json({ message: 'Utilisateur bloqué avec succès' });
    } catch (error) {
        console.error('Block user error:', error);
        res.status(500).json({ message: 'Erreur lors du blocage de l\'utilisateur' });
    }
});

// Débloquer un utilisateur
router.delete('/block/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;

        const block = await BlockedUser.findOneAndDelete({
            blocker_id: req.user.id,
            blocked_id: userId
        });

        if (!block) {
            return res.status(404).json({ message: 'Cet utilisateur n\'est pas bloqué' });
        }

        await logActivity(req.user.id, 'user_unblocked', 'user', userId, req);

        res.json({ message: 'Utilisateur débloqué avec succès' });
    } catch (error) {
        console.error('Unblock user error:', error);
        res.status(500).json({ message: 'Erreur lors du déblocage de l\'utilisateur' });
    }
});

// Obtenir la liste des utilisateurs bloqués
router.get('/blocked', authenticate, async (req, res) => {
    try {
        const blockedUsers = await BlockedUser.find({ blocker_id: req.user.id })
            .populate('blocked_id', 'first_name last_name profile_picture_url')
            .sort({ createdAt: -1 });

        const users = blockedUsers.map(block => ({
            id: block.blocked_id._id,
            first_name: block.blocked_id.first_name,
            last_name: block.blocked_id.last_name,
            profile_picture_url: block.blocked_id.profile_picture_url,
            reason: block.reason,
            notes: block.notes,
            blocked_at: block.createdAt
        }));

        res.json({ users });
    } catch (error) {
        console.error('Get blocked users error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs bloqués' });
    }
});

// Vérifier si un utilisateur est bloqué
router.get('/block-status/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;

        const block = await BlockedUser.findOne({
            blocker_id: req.user.id,
            blocked_id: userId
        });

        res.json({ 
            is_blocked: !!block,
            reason: block ? block.reason : null
        });
    } catch (error) {
        console.error('Check block status error:', error);
        res.status(500).json({ message: 'Erreur lors de la vérification du statut' });
    }
});

module.exports = router;
