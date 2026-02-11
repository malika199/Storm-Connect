const mongoose = require('mongoose');

const directMessageSchema = new mongoose.Schema({
    match_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
        required: true
    },
    sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message_text: {
        type: String,
        default: ''
    },
    image_url: {
        type: String,
        default: null
    },
    is_read: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

directMessageSchema.index({ match_id: 1, createdAt: 1 });
directMessageSchema.index({ sender_id: 1 });

module.exports = mongoose.model('DirectMessage', directMessageSchema);
