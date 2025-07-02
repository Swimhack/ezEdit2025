/**
 * API route for checking one-time site purchases
 * This endpoint verifies if a user has purchased a one-time site
 */

import { createSupabaseClient } from '../../../../../packages/supabase-client/src';

// Initialize Supabase client
// Use shared Supabase client with service role
const supabase = createSupabaseClient({ role: 'service' });

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

    // Query the one_time_purchases table in Supabase
    const { data: purchases, error: purchaseError } = await supabase
      .from('one_time_purchases')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .limit(1);

    if (purchaseError) {
      throw purchaseError;
    }

    // Check if any purchases were found
    const hasOneTimeSite = purchases && purchases.length > 0;

    return res.status(200).json({ hasOneTimeSite });
  } catch (error) {
    console.error('Error checking one-time purchase:', error);
    return res.status(500).json({ error: 'Failed to check one-time purchase status' });
  }
}
