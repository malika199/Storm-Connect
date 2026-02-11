const mongoose = require('mongoose');

const matchmakingSchema = new mongoose.Schema({
    requester_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    target_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'validated_by_admin', 'rejected_by_admin', 'contacted_guardian', 'accepted_by_target', 'declined_by_target', 'expired'],
        default: 'pending'
    },
    admin_notes: {
        type: String
    },
    admin_validated_at: {
        type: Date
    },
    admin_validated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    guardian_notified_at: {
        type: Date
    },
    guardian_contacted_at: {
        type: Date
    },
    group_chat_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GroupChat'
    },
    expires_at: {
        type: Date
    }
}, {
    timestamps: true
});

// Index pour optimiser les requêtes
matchmakingSchema.index({ requester_id: 1 });
matchmakingSchema.index({ target_id: 1 });
matchmakingSchema.index({ status: 1 });
matchmakingSchema.index({ requester_id: 1, target_id: 1 });

// Validation pour s'assurer que requester_id != target_id
matchmakingSchema.pre('save', function(next) {
    if (this.requester_id.toString() === this.target_id.toString()) {
        return next(new Error('Requester and target cannot be the same user'));
    }
    next();
});

module.exports = mongoose.model('Matchmaking', matchmakingSchema);
