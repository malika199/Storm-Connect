const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    user1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    user2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending_reciprocal_like', 'pending_admin_validation', 'validated', 'rejected'],
        default: 'pending_reciprocal_like',
        required: true
    },
    is_active: {
        type: Boolean,
        default: false // Inactive until validated
    },
    last_message_at: {
        type: Date
    },
    validated_at: {
        type: Date
    },
    validated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    validation_notes: {
        type: String
    },
    /** Conversation de groupe supervisée (enfants + parents) */
    group_chat_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GroupChat'
    }
}, {
    timestamps: true
});

// Index pour rechercher les matches d'un utilisateur
matchSchema.index({ user1: 1 });
matchSchema.index({ user2: 1 });
matchSchema.index({ is_active: 1 });
matchSchema.index({ status: 1 });

module.exports = mongoose.model('Match', matchSchema);
