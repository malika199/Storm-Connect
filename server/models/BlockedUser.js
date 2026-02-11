const mongoose = require('mongoose');

const blockedUserSchema = new mongoose.Schema({
    blocker_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    blocked_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        enum: ['harassment', 'inappropriate_content', 'spam', 'fake_profile', 'other'],
        default: 'other'
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

// Index unique pour éviter les doublons
blockedUserSchema.index({ blocker_id: 1, blocked_id: 1 }, { unique: true });
blockedUserSchema.index({ blocker_id: 1 });
blockedUserSchema.index({ blocked_id: 1 });

module.exports = mongoose.model('BlockedUser', blockedUserSchema);
