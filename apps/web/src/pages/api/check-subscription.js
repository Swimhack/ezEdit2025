/**
 * API route for checking user subscription status
 * This endpoint verifies if a user has an active subscription
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the user from the request
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Query the subscriptions table in Supabase
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      throw subscriptionError;
    }

    // If no subscription found in database, return false
    if (!subscriptions) {
      return res.status(200).json({ hasActiveSubscription: false });
    }

    // Double-check with Stripe API to ensure subscription is still active
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscriptions.stripe_subscription_id
    );

    const hasActiveSubscription = 
      stripeSubscription.status === 'active' || 
      stripeSubscription.status === 'trialing';

    return res.status(200).json({ hasActiveSubscription });
  } catch (error) {
    console.error('Error checking subscription:', error);
    return res.status(500).json({ error: 'Failed to check subscription status' });
  }
}
