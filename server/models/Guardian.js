const mongoose = require('mongoose');

const guardianSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    guardian_email: {
        type: String,
        required: true
    },
    guardian_phone: {
        type: String
    },
    guardian_name: {
        type: String,
        required: true
    },
    guardian_relationship: {
        type: String,
        required: true,
        enum: ['parent', 'sibling', 'friend', 'other']
    },
    /** Compte parent (User role guardian) une fois inscrit via invitation */
    guardian_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    /** INVITÉ = invitation envoyée, pas encore inscrit ; ACTIF = compte créé et lié */
    status: {
        type: String,
        enum: ['invited', 'active'],
        default: 'invited'
    },
    invitation_token: {
        type: String
    },
    invitation_expires_at: {
        type: Date
    },
    is_verified: {
        type: Boolean,
        default: false
    },
    verification_token: {
        type: String
    },
    verification_expires_at: {
        type: Date
    }
}, {
    timestamps: true
});

// Index unique pour user_id et guardian_email
guardianSchema.index({ user_id: 1, guardian_email: 1 }, { unique: true });
guardianSchema.index({ user_id: 1 });

module.exports = mongoose.model('Guardian', guardianSchema);
