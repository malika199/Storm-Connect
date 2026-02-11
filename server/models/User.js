const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password_hash: {
        type: String,
        required: true
    },
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true,
        enum: ['male', 'female', 'other']
    },
    date_of_birth: {
        type: Date,
        required: true
    },
    phone: {
        type: String
    },
    bio: {
        type: String
    },
    profile_picture_url: {
        type: String
    },
    photos: {
        type: [String],
        default: []
    },
    city: {
        type: String
    },
    country: {
        type: String
    },
    profession: {
        type: String
    },
    education: {
        type: String
    },
    religion: {
        type: String
    },
    height_cm: {
        type: Number
    },
    smoker: {
        type: Boolean
    },
    halal: {
        type: Boolean
    },
    alcohol: {
        type: Boolean
    },
    id_verification_status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    id_document_url: {
        type: String
    },
    subscription_status: {
        type: String,
        enum: ['free', 'premium', 'vip'],
        default: 'free'
    },
    subscription_expires_at: {
        type: Date
    },
    is_active: {
        type: Boolean,
        default: true
    },
    is_verified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['user', 'guardian', 'admin'],
        default: 'user'
    },
    last_login: {
        type: Date
    },
    gdpr_consent: {
        type: Boolean,
        default: false
    },
    gdpr_consent_date: {
        type: Date
    },
    parental_consent: {
        type: Boolean,
        default: false
    },
    parental_consent_date: {
        type: Date
    },
    password_reset_token: {
        type: String
    },
    password_reset_expires: {
        type: Date
    }
}, {
    timestamps: true // Crée automatiquement created_at et updated_at
});

// Index pour optimiser les requêtes
userSchema.index({ email: 1 });
userSchema.index({ gender: 1 });
userSchema.index({ subscription_status: 1 });
userSchema.index({ is_active: 1, is_verified: 1 });
userSchema.index({ profile_validation_status: 1 });

module.exports = mongoose.model('User', userSchema);
