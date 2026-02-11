const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    matchmaking_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Matchmaking'
    },
    stripe_payment_intent_id: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'EUR'
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'succeeded', 'failed', 'refunded']
    },
    payment_type: {
        type: String,
        enum: ['subscription', 'match_fee', 'verification']
    }
}, {
    timestamps: true
});

paymentSchema.index({ user_id: 1 });
paymentSchema.index({ stripe_payment_intent_id: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
