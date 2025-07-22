/**
 * Stripe Payment Processing Routes
 * Handles subscription creation, webhooks, and billing management
 */

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Pricing configuration
const PRICING = {
    pro: {
        monthly: {
            priceId: 'price_1QXbhKAuYycpID5hJUv8QE1H',
            amount: 5000, // $50.00 in cents
            interval: 'month'
        },
        yearly: {
            priceId: 'price_1QXbhKAuYycpID5hJUv8QE1H_yearly',
            amount: 4000, // $40.00 in cents (monthly equivalent)
            interval: 'year'
        }
    },
    lifetime: {
        'one-time': {
            priceId: 'price_1QXbhKAuYycpID5hJUv8QE1H_lifetime',
            amount: 49700, // $497.00 in cents
            mode: 'payment'
        }
    }
};

/**
 * Create Stripe Checkout Session
 */
router.post('/create-checkout-session', async (req, res) => {
    try {
        const { priceId, userId, userEmail, plan, billing } = req.body;
        
        if (!priceId || !userId || !userEmail) {
            return res.status(400).json({
                error: 'Missing required parameters'
            });
        }
        
        // Verify user exists
        const { data: userProfile, error: userError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (userError || !userProfile) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        
        const isLifetime = plan === 'lifetime';
        const baseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://ezedit.co' 
            : `http://localhost:${process.env.PORT || 3000}`;
        
        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer_email: userEmail,
            mode: isLifetime ? 'payment' : 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                }
            ],
            metadata: {
                userId: userId,
                plan: plan,
                billing: billing
            },
            subscription_data: isLifetime ? undefined : {
                metadata: {
                    userId: userId,
                    plan: plan,
                    billing: billing
                },
                trial_period_days: userProfile.subscription_status === 'trial' ? 0 : 7
            },
            success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/pricing.html?canceled=true`,
            automatic_tax: {
                enabled: true,
            },
            tax_id_collection: {
                enabled: true,
            },
            billing_address_collection: 'required',
            allow_promotion_codes: true
        });
        
        res.json({
            sessionId: session.id,
            url: session.url
        });
        
    } catch (error) {
        console.error('Checkout session creation error:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

/**
 * Create Customer Portal Session
 */
router.post('/create-portal-session', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                error: 'User ID is required'
            });
        }
        
        // Get user's Stripe customer ID
        const { data: userProfile, error } = await supabase
            .from('user_profiles')
            .select('stripe_customer_id')
            .eq('id', userId)
            .single();
        
        if (error || !userProfile?.stripe_customer_id) {
            return res.status(404).json({
                error: 'Customer not found'
            });
        }
        
        const baseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://ezedit.co' 
            : `http://localhost:${process.env.PORT || 3000}`;
        
        const session = await stripe.billingPortal.sessions.create({
            customer: userProfile.stripe_customer_id,
            return_url: `${baseUrl}/billing`,
        });
        
        res.json({
            url: session.url
        });
        
    } catch (error) {
        console.error('Portal session creation error:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

/**
 * Stripe Webhook Handler
 */
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;
                
            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object);
                break;
                
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;
                
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;
                
            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;
                
            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;
                
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        
        res.json({received: true});
        
    } catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).json({error: error.message});
    }
});

/**
 * Handle successful checkout completion
 */
async function handleCheckoutCompleted(session) {
    const userId = session.metadata.userId;
    const plan = session.metadata.plan;
    const billing = session.metadata.billing;
    
    if (!userId) {
        console.error('No userId in checkout session metadata');
        return;
    }
    
    const updateData = {
        stripe_customer_id: session.customer,
        subscription_plan: plan,
        subscription_billing: billing,
        subscription_status: 'active',
        trial_ends_at: null
    };
    
    if (session.mode === 'subscription') {
        updateData.stripe_subscription_id = session.subscription;
    } else {
        // One-time payment (lifetime)
        updateData.subscription_status = 'lifetime';
        updateData.lifetime_purchase_date = new Date().toISOString();
    }
    
    await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId);
    
    console.log(`Subscription activated for user ${userId}: ${plan} (${billing})`);
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(subscription) {
    const userId = subscription.metadata.userId;
    
    if (!userId) return;
    
    await supabase
        .from('user_profiles')
        .update({
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
        })
        .eq('id', userId);
        
    console.log(`Subscription created for user ${userId}: ${subscription.id}`);
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription) {
    const userId = subscription.metadata.userId;
    
    if (!userId) return;
    
    await supabase
        .from('user_profiles')
        .update({
            subscription_status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
        })
        .eq('id', userId);
        
    console.log(`Subscription updated for user ${userId}: ${subscription.status}`);
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription) {
    const userId = subscription.metadata.userId;
    
    if (!userId) return;
    
    await supabase
        .from('user_profiles')
        .update({
            subscription_status: 'canceled',
            stripe_subscription_id: null,
            current_period_start: null,
            current_period_end: null
        })
        .eq('id', userId);
        
    console.log(`Subscription canceled for user ${userId}`);
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const userId = subscription.metadata.userId;
    
    if (!userId) return;
    
    // Update payment status and extend subscription
    await supabase
        .from('user_profiles')
        .update({
            subscription_status: 'active',
            last_payment_date: new Date().toISOString(),
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
        })
        .eq('id', userId);
        
    console.log(`Payment succeeded for user ${userId}: ${invoice.amount_paid / 100}`);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const userId = subscription.metadata.userId;
    
    if (!userId) return;
    
    // Mark subscription as past due
    await supabase
        .from('user_profiles')
        .update({
            subscription_status: 'past_due',
            last_payment_attempt: new Date().toISOString()
        })
        .eq('id', userId);
        
    console.log(`Payment failed for user ${userId}`);
}

/**
 * Get subscription status
 */
router.get('/subscription-status/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const { data: userProfile, error } = await supabase
            .from('user_profiles')
            .select('subscription_status, subscription_plan, subscription_billing, current_period_end, trial_ends_at')
            .eq('id', userId)
            .single();
        
        if (error) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        
        res.json({
            status: userProfile.subscription_status,
            plan: userProfile.subscription_plan,
            billing: userProfile.subscription_billing,
            currentPeriodEnd: userProfile.current_period_end,
            trialEndsAt: userProfile.trial_ends_at
        });
        
    } catch (error) {
        console.error('Subscription status error:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

module.exports = router;