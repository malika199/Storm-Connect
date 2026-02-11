const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    action: {
        type: String,
        required: true
    },
    entity_type: {
        type: String
    },
    entity_id: {
        type: mongoose.Schema.Types.ObjectId
    },
    ip_address: {
        type: String
    },
    user_agent: {
        type: String
    }
}, {
    timestamps: true
});

activityLogSchema.index({ user_id: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ created_at: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
