const mongoose = require('mongoose');

const adminStatisticsSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true
    },
    total_users: {
        type: Number,
        default: 0
    },
    active_users: {
        type: Number,
        default: 0
    },
    pending_matches: {
        type: Number,
        default: 0
    },
    validated_matches: {
        type: Number,
        default: 0
    },
    total_revenue: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

adminStatisticsSchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model('AdminStatistics', adminStatisticsSchema);
