/**
 * EzEdit Subscription Service
 * Handles Stripe integration, subscription management, and plan features
 */

class SubscriptionService {
  constructor() {
    // Stripe public key would normally be loaded from environment variables
    this.stripePublicKey = 'pk_test_your_stripe_key';
    this.stripe = null;
    this.elements = null;
    this.priceIds = {
      oneTimeSite: 'price_oneTimeSite_$500',
      subPro: 'price_subPro_$100'
    };
    
    // Plan definitions
    this.plans = {
      'free-trial': {
        name: 'Free Trial',
        price: '$0',
        duration: '7 days',
        features: [
          { name: 'View & preview sites', included: true },
          { name: 'Connect to FTP sites', included: true },
          { name: 'AI code assistance', included: true, limited: '10 queries' },
          { name: 'Save & publish changes', included: false },
          { name: 'Unlimited sites', included: false },
          { name: 'Team collaboration', included: false }
        ],
        ctaText: 'Upgrade Now',
        ctaAction: 'upgrade'
      },
      'pro': {
        name: 'Pro',
        price: '$50',
        billingPeriod: 'month',
        features: [
          { name: 'View & preview sites', included: true },
          { name: 'Connect to FTP sites', included: true },
          { name: 'AI code assistance', included: true, unlimited: true },
          { name: 'Save & publish changes', included: true },
          { name: 'Unlimited sites', included: true },
          { name: 'Team collaboration', included: true, limit: '3 members' }
        ],
        ctaText: 'Current Plan',
        ctaAction: 'manage'
      },
      'one-time': {
        name: 'Single Site',
        price: '$500',
        billingPeriod: 'one-time',
        features: [
          { name: 'View & preview sites', included: true },
          { name: 'Connect to FTP sites', included: true, limit: '1 site' },
          { name: 'AI code assistance', included: true, limited: '50 queries' },
          { name: 'Save & publish changes', included: true },
          { name: 'Unlimited sites', included: false },
          { name: 'Team collaboration', included: false }
        ],
        ctaText: 'Buy Now',
        ctaAction: 'buy'
      }
    };
  }

  /**
   * Initialize Stripe
   * @returns {Promise} - Promise resolving when Stripe is initialized
   */
  async initStripe() {
    return new Promise((resolve, reject) => {
      if (window.Stripe) {
        this.stripe = window.Stripe(this.stripePublicKey);
        resolve();
      } else {
        // Load Stripe.js if not already loaded
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.onload = () => {
          this.stripe = window.Stripe(this.stripePublicKey);
          resolve();
        };
        script.onerror = () => {
          reject(new Error('Failed to load Stripe.js'));
        };
        document.head.appendChild(script);
      }
    });
  }

  /**
   * Create a payment form
   * @param {string} containerId - ID of the container element
   * @returns {Object} - Stripe Elements instance
   */
  createPaymentForm(containerId) {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with ID ${containerId} not found`);
    }

    // Create Elements instance
    this.elements = this.stripe.elements();

    // Create card element
    const cardElement = this.elements.create('card', {
      style: {
        base: {
          color: '#32325d',
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          fontSmoothing: 'antialiased',
          fontSize: '16px',
          '::placeholder': {
            color: '#aab7c4'
          }
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a'
        }
      }
    });

    // Mount card element
    cardElement.mount(`#${containerId}`);

    return cardElement;
  }

  /**
   * Create a checkout session for subscription
   * @param {string} priceId - Stripe Price ID for the subscription
   * @param {Object} userData - User data (email, etc.)
   * @returns {Promise} - Promise resolving to the checkout session
   */
  async createCheckoutSession(priceId, userData = {}) {
    try {
      // Get authentication token from Supabase service
      const supabaseService = window.ezEdit.supabase;
      if (!supabaseService) {
        throw new Error('Supabase service not initialized');
      }
      
      const session = supabaseService.getSession();
      if (!session || !session.access_token) {
        throw new Error('User not authenticated');
      }
      
      // Create checkout session via API
      const response = await fetch('api.php?action=create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          priceId,
          successUrl: window.location.origin + '/dashboard.html?checkout=success',
          cancelUrl: window.location.origin + '/pricing.html?checkout=canceled',
          customerEmail: userData.email
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creating checkout session');
      }
      
      const checkoutSession = await response.json();
      return checkoutSession;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Process one-time payment
   * @param {string} productId - ID of the product to purchase
   * @param {Object} cardElement - Stripe card element
   * @param {Object} customerData - Customer data (name, email, etc.)
   * @returns {Promise} - Promise resolving to the payment result
   */
  async processOneTimePayment(productId, cardElement, customerData) {
    try {
      if (!this.stripe || !cardElement) {
        throw new Error('Stripe or card element not initialized');
      }

      // Create payment method
      const { paymentMethod, error: paymentMethodError } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: customerData.name,
          email: customerData.email
        }
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      // In a real app, we would send the payment method ID to our server
      // The server would create the payment intent and return a client secret
      // For demo purposes, we'll simulate a successful payment

      // Simulate API call
      return await this.simulateOneTimePaymentAPI(productId, paymentMethod.id, customerData);
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  /**
   * Simulate subscription API call
   * @param {string} planId - ID of the plan to subscribe to
   * @param {string} paymentMethodId - ID of the payment method
   * @param {Object} customerData - Customer data (name, email, etc.)
   * @returns {Promise} - Promise resolving to the API response
   */
  async simulateSubscriptionAPI(planId, paymentMethodId, customerData) {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        // Simulate successful API response
        resolve({
          success: true,
          subscription: {
            id: `sub_${Date.now()}`,
            plan: planId,
            status: 'active',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            customer: {
              id: `cus_${Date.now()}`,
              name: customerData.name,
              email: customerData.email
            }
          }
        });
      }, 1500);
    });
  }

  /**
   * Simulate one-time payment API call
   * @param {string} productId - ID of the product to purchase
   * @param {string} paymentMethodId - ID of the payment method
   * @param {Object} customerData - Customer data (name, email, etc.)
   * @returns {Promise} - Promise resolving to the API response
   */
  async simulateOneTimePaymentAPI(productId, paymentMethodId, customerData) {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        // Simulate successful API response
        resolve({
          success: true,
          payment: {
            id: `pay_${Date.now()}`,
            product: productId,
            amount: 50000, // $500.00
            status: 'succeeded',
            customer: {
              id: `cus_${Date.now()}`,
              name: customerData.name,
              email: customerData.email
            }
          }
        });
      }, 1500);
    });
  }

  /**
   * Get user's current subscription
   * @returns {Promise} - Promise resolving to the user's subscription
   */
  async getCurrentSubscription() {
    // In a real app, we would fetch this from the server
    // For demo purposes, we'll use localStorage
    const auth = JSON.parse(localStorage.getItem('ezEditAuth') || '{}');
    const userPlan = auth.user?.plan || 'free-trial';

    return {
      plan: userPlan,
      status: 'active',
      trialDaysLeft: userPlan === 'free-trial' ? (auth.user?.trialDaysLeft || 7) : 0,
      currentPeriodEnd: userPlan === 'free-trial' 
        ? new Date(Date.now() + (auth.user?.trialDaysLeft || 7) * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  /**
   * Update user's subscription
   * @param {string} planId - ID of the new plan
   * @returns {Promise} - Promise resolving when the subscription is updated
   */
  async updateSubscription(planId) {
    // In a real app, we would send this to the server
    // For demo purposes, we'll update localStorage
    const auth = JSON.parse(localStorage.getItem('ezEditAuth') || '{}');
    
    if (auth.user) {
      auth.user.plan = planId;
      auth.user.trialDaysLeft = planId === 'free-trial' ? 7 : 0;
      localStorage.setItem('ezEditAuth', JSON.stringify(auth));
    }

    return {
      success: true,
      plan: planId
    };
  }

  /**
   * Cancel subscription
   * @returns {Promise} - Promise resolving when the subscription is canceled
   */
  async cancelSubscription() {
    // In a real app, we would send this to the server
    // For demo purposes, we'll update localStorage
    const auth = JSON.parse(localStorage.getItem('ezEditAuth') || '{}');
    
    if (auth.user) {
      auth.user.plan = 'free-trial';
      auth.user.trialDaysLeft = 7;
      localStorage.setItem('ezEditAuth', JSON.stringify(auth));
    }

    return {
      success: true,
      message: 'Subscription canceled successfully'
    };
  }

  /**
   * Get plan details
   * @param {string} planId - ID of the plan
   * @returns {Object} - Plan details
   */
  getPlanDetails(planId) {
    return this.plans[planId] || this.plans['free-trial'];
  }

  /**
   * Get all available plans
   * @returns {Object} - All plans
   */
  getAllPlans() {
    return this.plans;
  }

  /**
   * Check if the current user is an admin/super user
   * @returns {boolean} - True if user is an admin
   */
  isAdminUser() {
    // Check if user is an admin based on email domain or specific emails
    const auth = JSON.parse(localStorage.getItem('ezEditAuth') || '{}');
    if (!auth.user?.email) return false;
    
    const email = auth.user.email.toLowerCase();
    
    // Admin emails list - add your admin email patterns here
    const adminEmails = [
      'admin@ezedit.co',
      'support@ezedit.co'
    ];
    
    // Check for exact email matches
    if (adminEmails.includes(email)) return true;
    
    // Check for admin domains
    const adminDomains = ['strickland.co', 'ezedit.co'];
    for (const domain of adminDomains) {
      if (email.endsWith(`@${domain}`)) return true;
    }
    
    // Check for admin role in user metadata if available
    if (auth.user?.user_metadata?.role === 'admin') return true;
    if (auth.user?.app_metadata?.role === 'admin') return true;
    
    return false;
  }

  /**
   * Check if user can save files
   * @returns {boolean} - True if user can save files
   */
  canSaveFiles() {
    // Admin users can always save files
    if (this.isAdminUser()) return true;
    
    // Check if user can save files based on plan
    const auth = JSON.parse(localStorage.getItem('ezEditAuth') || '{}');
    return auth.user?.plan === 'pro' || auth.user?.plan === 'one-time';
  }

  /**
   * Check if user can add unlimited sites
   * @returns {boolean} - True if user can add unlimited sites
   */
  canAddUnlimitedSites() {
    // Admin users can always add unlimited sites
    if (this.isAdminUser()) return true;
    
    const auth = JSON.parse(localStorage.getItem('ezEditAuth') || '{}');
    return auth.user?.plan === 'pro';
  }

  /**
   * Get maximum number of sites user can add
   * @returns {number} - Maximum number of sites
   */
  getMaxSites() {
    // Admin users can add unlimited sites
    if (this.isAdminUser()) return Infinity;
    
    const auth = JSON.parse(localStorage.getItem('ezEditAuth') || '{}');
    if (auth.user?.plan === 'pro') {
      return Infinity;
    } else if (auth.user?.plan === 'one-time') {
      return 1;
    } else {
      return 3; // Free trial can add up to 3 sites but can't save
    }
  }

  /**
   * Get maximum number of team members
   * @returns {number} - Maximum number of team members
   */
  getMaxTeamMembers() {
    // Admin users can have unlimited team members
    if (this.isAdminUser()) return Infinity;
    
    const auth = JSON.parse(localStorage.getItem('ezEditAuth') || '{}');
    if (auth.user?.plan === 'pro') {
      return 3;
    } else {
      return 0;
    }
  }

  /**
   * Get maximum number of AI queries
   * @returns {number} - Maximum number of AI queries
   */
  getMaxAiQueries() {
    // Admin users have unlimited AI queries
    if (this.isAdminUser()) return Infinity;
    
    const auth = JSON.parse(localStorage.getItem('ezEditAuth') || '{}');
    if (auth.user?.plan === 'pro') {
      return Infinity;
    } else if (auth.user?.plan === 'one-time') {
      return 50;
    } else {
      return 10;
    }
  }
}

// Export the SubscriptionService class
window.SubscriptionService = SubscriptionService;
