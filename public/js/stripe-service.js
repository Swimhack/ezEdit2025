/**
 * Stripe Service for EzEdit
 * Handles Stripe API integration for subscription and one-time payments
 */
class StripeService {
  /**
   * Initialize the Stripe service
   * @param {SupabaseService} supabaseService - Instance of SupabaseService for auth
   */
  constructor(supabaseService) {
    this.supabaseService = supabaseService;
    this.stripe = Stripe(window.ezEdit.config.STRIPE_PUBLIC_KEY);
    this.priceIds = {
      proMonthly: 'price_subPro_$100', // $50/month subscription
      proAnnual: 'price_subPro_annual', // Annual subscription with discount
      oneTimeSite: 'price_oneTimeSite_$500' // $500 one-time payment
    };
  }

  /**
   * Create a checkout session for subscription or one-time payment
   * @param {string} priceId - Stripe price ID
   * @param {string} successUrl - URL to redirect after successful payment
   * @param {string} cancelUrl - URL to redirect if payment is cancelled
   * @returns {Promise<Object>} Checkout session
   */
  async createCheckoutSession(priceId, successUrl, cancelUrl) {
    if (!this.supabaseService.isAuthenticated()) {
      throw new Error('User must be authenticated to create a checkout session');
    }

    const session = this.supabaseService.getSession();
    
    try {
      const response = await fetch('api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          priceId,
          successUrl: successUrl || window.location.origin + '/dashboard.html?checkout=success',
          cancelUrl: cancelUrl || window.location.origin + '/pricing.html?checkout=canceled'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Redirect to Stripe Checkout
   * @param {string} sessionId - Stripe checkout session ID
   * @returns {Promise<void>}
   */
  async redirectToCheckout(sessionId) {
    try {
      const result = await this.stripe.redirectToCheckout({ sessionId });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Error redirecting to checkout:', error);
      throw error;
    }
  }

  /**
   * Create a checkout session and redirect to Stripe Checkout
   * @param {string} planType - Plan type: 'pro-monthly', 'pro-annual', or 'one-time'
   * @param {string} successUrl - URL to redirect after successful payment
   * @param {string} cancelUrl - URL to redirect if payment is cancelled
   * @returns {Promise<void>}
   */
  async checkout(planType, successUrl, cancelUrl) {
    let priceId;
    
    switch (planType) {
      case 'pro-monthly':
        priceId = this.priceIds.proMonthly;
        break;
      case 'pro-annual':
        priceId = this.priceIds.proAnnual;
        break;
      case 'one-time':
        priceId = this.priceIds.oneTimeSite;
        break;
      default:
        throw new Error('Invalid plan type');
    }
    
    try {
      const session = await this.createCheckoutSession(priceId, successUrl, cancelUrl);
      await this.redirectToCheckout(session.id);
    } catch (error) {
      console.error('Checkout failed:', error);
      throw error;
    }
  }

  /**
   * Check if the user has an active subscription
   * @returns {Promise<boolean>} True if user has active subscription
   */
  async hasActiveSubscription() {
    if (!this.supabaseService.isAuthenticated()) {
      return false;
    }

    try {
      const response = await fetch('api/check-subscription', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.supabaseService.getSession().access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check subscription status');
      }

      const data = await response.json();
      return data.hasActiveSubscription;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  /**
   * Check if the user has purchased a one-time site
   * @returns {Promise<boolean>} True if user has purchased a one-time site
   */
  async hasOneTimeSite() {
    if (!this.supabaseService.isAuthenticated()) {
      return false;
    }

    try {
      const response = await fetch('api/check-one-time-purchase', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.supabaseService.getSession().access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check one-time purchase status');
      }

      const data = await response.json();
      return data.hasOneTimeSite;
    } catch (error) {
      console.error('Error checking one-time purchase:', error);
      return false;
    }
  }
}

// Add to global namespace if window exists
if (typeof window !== 'undefined') {
  window.ezEdit = window.ezEdit || {};
  window.ezEdit.StripeService = StripeService;
}
