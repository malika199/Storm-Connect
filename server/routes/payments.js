const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

// Créer une session de paiement Stripe pour un abonnement
router.post('/create-subscription-session', authenticate, async (req, res) => {
    try {
        const { plan_type } = req.body; // 'premium' or 'vip'

        if (!plan_type || !['premium', 'vip'].includes(plan_type)) {
            return res.status(400).json({ message: 'Type de plan invalide' });
        }

        // Récupérer ou créer un client Stripe
        let stripeCustomerId;
        const existingSubscription = await Subscription.findOne({ user_id: req.user.id });

        if (existingSubscription && existingSubscription.stripe_customer_id) {
            stripeCustomerId = existingSubscription.stripe_customer_id;
        } else {
            const user = await User.findById(req.user.id);
            const customer = await stripe.customers.create({
                email: user.email,
                name: `${user.first_name} ${user.last_name}`,
                metadata: { userId: req.user.id }
            });
            stripeCustomerId = customer.id;
        }

        // Créer une session de checkout Stripe
        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `Abonnement ${plan_type.toUpperCase()}`,
                            description: `Abonnement ${plan_type} pour le site de rencontre`
                        },
                        unit_amount: plan_type === 'premium' ? 2999 : 5999, // 29.99€ ou 59.99€
                        recurring: {
                            interval: 'month'
                        }
                    },
                    quantity: 1
                }
            ],
            mode: 'subscription',
            success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
            metadata: {
                userId: req.user.id,
                planType: plan_type
            }
        });

        res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Create subscription session error:', error);
        res.status(500).json({ message: 'Erreur lors de la création de la session de paiement' });
    }
});

// Webhook Stripe pour gérer les événements
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                if (session.mode === 'subscription') {
                    const subscription = await stripe.subscriptions.retrieve(session.subscription);
                    
                    await Subscription.findOneAndUpdate(
                        {
                            user_id: session.metadata.userId,
                            stripe_subscription_id: subscription.id
                        },
                        {
                            user_id: session.metadata.userId,
                            stripe_customer_id: subscription.customer,
                            stripe_subscription_id: subscription.id,
                            stripe_price_id: subscription.items.data[0].price.id,
                            plan_type: session.metadata.planType,
                            status: subscription.status,
                            current_period_start: new Date(subscription.current_period_start * 1000),
                            current_period_end: new Date(subscription.current_period_end * 1000)
                        },
                        { upsert: true, new: true }
                    );

                    // Mettre à jour le statut d'abonnement de l'utilisateur
                    await User.findByIdAndUpdate(session.metadata.userId, {
                        subscription_status: session.metadata.planType,
                        subscription_expires_at: new Date(subscription.current_period_end * 1000)
                    });
                }
                break;

            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                await Subscription.findOneAndUpdate(
                    { stripe_subscription_id: subscription.id },
                    {
                        status: subscription.status
                    },
                    { new: true }
                );
                break;

            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                await Payment.findOneAndUpdate(
                    { stripe_payment_intent_id: paymentIntent.id },
                    {
                        user_id: paymentIntent.metadata?.userId || null,
                        stripe_payment_intent_id: paymentIntent.id,
                        amount: paymentIntent.amount / 100,
                        currency: paymentIntent.currency,
                        status: 'succeeded',
                        payment_type: paymentIntent.metadata?.paymentType || 'subscription'
                    },
                    { upsert: true, new: true }
                );
                break;
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// Obtenir l'historique des paiements de l'utilisateur
router.get('/history', authenticate, async (req, res) => {
    try {
        const payments = await Payment.find({ user_id: req.user.id })
            .sort({ createdAt: -1 });

        res.json({ payments });
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
});

// Obtenir l'abonnement actif de l'utilisateur
router.get('/subscription', authenticate, async (req, res) => {
    try {
        const subscription = await Subscription.findOne({
            user_id: req.user.id,
            status: 'active'
        }).sort({ createdAt: -1 });

        res.json({ subscription: subscription || null });
    } catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
});

module.exports = router;
