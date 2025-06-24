/**
 * Stripe webhook handler
 * Processes Stripe events like subscription updates, payment success/failure, etc.
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { buffer } from 'micro';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Disable body parser to get raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody = await buffer(req);
    const signature = req.headers['stripe-signature'];

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.userId;
        
        if (session.mode === 'subscription') {
          // Handle subscription purchase
          await handleSubscriptionPurchase(session, userId);
        } else if (session.mode === 'payment') {
          // Handle one-time payment
          await handleOneTimePurchase(session, userId);
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await updateSubscriptionStatus(subscription);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await cancelSubscription(subscription);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          await handleInvoicePaymentSucceeded(invoice);
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          await handleInvoicePaymentFailed(invoice);
        }
        break;
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

/**
 * Handle subscription purchase
 * @param {Object} session - Stripe checkout session
 * @param {string} userId - Supabase user ID
 */
async function handleSubscriptionPurchase(session, userId) {
  try {
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    
    // Store subscription in database
    const { error } = await supabase.from('subscriptions').insert({
      user_id: userId,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    });
    
    if (error) throw error;
    
    // Update user's plan status
    await supabase
      .from('profiles')
      .update({ plan: 'pro' })
      .eq('id', userId);
      
  } catch (error) {
    console.error('Error handling subscription purchase:', error);
    throw error;
  }
}

/**
 * Handle one-time purchase
 * @param {Object} session - Stripe checkout session
 * @param {string} userId - Supabase user ID
 */
async function handleOneTimePurchase(session, userId) {
  try {
    // Store one-time purchase in database
    const { error } = await supabase.from('one_time_purchases').insert({
      user_id: userId,
      stripe_customer_id: session.customer,
      stripe_checkout_id: session.id,
      payment_intent: session.payment_intent,
      status: 'completed',
      amount: session.amount_total / 100, // Convert from cents to dollars
    });
    
    if (error) throw error;
    
    // Update user's plan status
    await supabase
      .from('profiles')
      .update({ plan: 'one-time' })
      .eq('id', userId);
      
  } catch (error) {
    console.error('Error handling one-time purchase:', error);
    throw error;
  }
}

/**
 * Update subscription status
 * @param {Object} subscription - Stripe subscription object
 */
async function updateSubscriptionStatus(subscription) {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
      .eq('stripe_subscription_id', subscription.id);
      
    if (error) throw error;
    
    // If subscription is no longer active, update user's plan
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      // Get the user ID from the subscription
      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Update user's plan status to free
      await supabase
        .from('profiles')
        .update({ plan: 'free' })
        .eq('id', data.user_id);
    }
  } catch (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }
}

/**
 * Cancel subscription
 * @param {Object} subscription - Stripe subscription object
 */
async function cancelSubscription(subscription) {
  try {
    // Update subscription status in database
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);
      
    if (error) throw error;
    
    // Get the user ID from the subscription
    const { data, error: fetchError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();
      
    if (fetchError) throw fetchError;
    
    // Update user's plan status to free
    await supabase
      .from('profiles')
      .update({ plan: 'free' })
      .eq('id', data.user_id);
      
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Handle invoice payment succeeded
 * @param {Object} invoice - Stripe invoice object
 */
async function handleInvoicePaymentSucceeded(invoice) {
  try {
    // Update subscription status in database
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_end: new Date(invoice.lines.data[0].period.end * 1000).toISOString(),
      })
      .eq('stripe_subscription_id', invoice.subscription);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
    throw error;
  }
}

/**
 * Handle invoice payment failed
 * @param {Object} invoice - Stripe invoice object
 */
async function handleInvoicePaymentFailed(invoice) {
  try {
    // Update subscription status in database
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
      })
      .eq('stripe_subscription_id', invoice.subscription);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
    throw error;
  }
}
