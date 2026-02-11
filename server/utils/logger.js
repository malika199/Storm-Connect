const ActivityLog = require('../models/ActivityLog');
const mongoose = require('mongoose');

// Logger pour RGPD - enregistrer les activités
const logActivity = async (userId, action, entityType = null, entityId = null, req = null) => {
    try {
        const ipAddress = req?.ip || req?.connection?.remoteAddress || null;
        const userAgent = req?.get('user-agent') || null;

        await ActivityLog.create({
            user_id: userId ? new mongoose.Types.ObjectId(userId) : null,
            action,
            entity_type: entityType,
            entity_id: entityId ? new mongoose.Types.ObjectId(entityId) : null,
            ip_address: ipAddress,
            user_agent: userAgent
        });
    } catch (error) {
        console.error('Error logging activity:', error);
        // Ne pas faire échouer la requête principale si le log échoue
    }
};

module.exports = {
    logActivity
};
