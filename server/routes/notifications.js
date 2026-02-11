const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');

// Obtenir les notifications de l'utilisateur
router.get('/', authenticate, async (req, res) => {
    try {
        const { unread_only } = req.query;

        const query = { user_id: req.user.id };
        if (unread_only === 'true') {
            query.is_read = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ notifications });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
});

// Marquer une notification comme lue
router.put('/:id/read', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, user_id: req.user.id },
            { is_read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée' });
        }

        res.json({ message: 'Notification marquée comme lue' });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
});

// Marquer toutes les notifications comme lues
router.put('/read-all', authenticate, async (req, res) => {
    try {
        await Notification.updateMany(
            { user_id: req.user.id, is_read: false },
            { is_read: true }
        );

        res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
});

// Obtenir le nombre de notifications non lues
router.get('/unread-count', authenticate, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            user_id: req.user.id,
            is_read: false
        });

        res.json({ count });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
});

module.exports = router;
