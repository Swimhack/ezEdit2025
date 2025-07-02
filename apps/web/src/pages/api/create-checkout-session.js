/**
 * API route for creating Stripe checkout sessions
 * This endpoint creates a checkout session for subscription or one-time payments
 */

import { createSupabaseClient } from '../../../../../packages/supabase-client/src';
import Stripe from 'stripe';

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize shared Supabase client (service role)
const supabase = createSupabaseClient({ role: 'service' });

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
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

    // Get the price ID and URLs from the request body
    const { priceId, successUrl, cancelUrl } = req.body;
    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // Get the price from Stripe to determine if it's a subscription or one-time payment
    const price = await stripe.prices.retrieve(priceId);
    
    // Create the checkout session parameters
    const sessionParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: price.type === 'recurring' ? 'subscription' : 'payment',
      success_url: successUrl || `${req.headers.origin}/dashboard?checkout=success`,
      cancel_url: cancelUrl || `${req.headers.origin}/pricing?checkout=canceled`,
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
      },
    };

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    // Return the session ID to the client
    return res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
