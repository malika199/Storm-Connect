const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    guardian_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guardian'
    },
    type: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    related_matchmaking_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Matchmaking'
    },
    is_read: {
        type: Boolean,
        default: false
    },
    email_sent: {
        type: Boolean,
        default: false
    },
    sms_sent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

notificationSchema.index({ user_id: 1, is_read: 1 });
notificationSchema.index({ guardian_id: 1 });
notificationSchema.index({ created_at: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
