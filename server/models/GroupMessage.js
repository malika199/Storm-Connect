const mongoose = require('mongoose');

const groupMessageSchema = new mongoose.Schema({
    group_chat_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GroupChat',
        required: true
    },
    sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender_role: {
        type: String,
        required: true,
        enum: ['requester', 'target', 'guardian', 'admin']
    },
    message_text: {
        type: String,
        required: true
    },
    attachments: {
        type: [String],
        default: []
    },
    is_read: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

groupMessageSchema.index({ group_chat_id: 1, created_at: 1 });
groupMessageSchema.index({ sender_id: 1 });

module.exports = mongoose.model('GroupMessage', groupMessageSchema);
