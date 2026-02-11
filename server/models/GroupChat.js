const mongoose = require('mongoose');

const groupChatSchema = new mongoose.Schema({
    /** Pour flux matchmaking (admin / demande ciblée) */
    matchmaking_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Matchmaking'
    },
    requester_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    target_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    guardian_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guardian'
    },
    /** Pour flux match (like réciproque validé) : conversation supervisée = 2 enfants + tous les parents */
    match_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match'
    },
    /** IDs des participants (enfants + parents) pour les conversations match */
    participant_ids: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },
    /** IDs des parents qui ont quitté mais peuvent encore voir les messages (lecture seule) */
    readonly_participant_ids: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

groupChatSchema.index({ matchmaking_id: 1 });
groupChatSchema.index({ match_id: 1 }, { sparse: true });
groupChatSchema.index({ requester_id: 1, target_id: 1 });
groupChatSchema.index({ participant_ids: 1 });

module.exports = mongoose.model('GroupChat', groupChatSchema);
