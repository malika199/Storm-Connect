const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    stripe_customer_id: {
        type: String
    },
    stripe_subscription_id: {
        type: String
    },
    stripe_price_id: {
        type: String
    },
    plan_type: {
        type: String,
        required: true,
        enum: ['premium', 'vip']
    },
    status: {
        type: String,
        required: true,
        enum: ['active', 'canceled', 'past_due', 'unpaid']
    },
    current_period_start: {
        type: Date
    },
    current_period_end: {
        type: Date
    },
    cancel_at_period_end: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

subscriptionSchema.index({ user_id: 1 });
subscriptionSchema.index({ stripe_subscription_id: 1 });
subscriptionSchema.index({ status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
