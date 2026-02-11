const mongoose = require('mongoose');

const skipSchema = new mongoose.Schema({
    from_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    to_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index unique pour éviter les doublons (un utilisateur ne peut skip qu'une seule fois une personne)
skipSchema.index({ from_user: 1, to_user: 1 }, { unique: true });
// Index pour les recherches rapides
skipSchema.index({ from_user: 1 });

module.exports = mongoose.model('Skip', skipSchema);
