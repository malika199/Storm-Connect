const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
    from_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    to_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    is_match: {
        type: Boolean,
        default: false
    },
    matched_at: {
        type: Date
    }
}, {
    timestamps: true
});

// Index unique pour éviter les doublons
likeSchema.index({ from_user: 1, to_user: 1 }, { unique: true });
likeSchema.index({ to_user: 1 });
likeSchema.index({ is_match: 1 });

module.exports = mongoose.model('Like', likeSchema);
