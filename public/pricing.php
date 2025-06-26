<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pricing Plans - EzEdit</title>
  <!-- Design tokens and core styles -->
  <link rel="stylesheet" href="css/design-tokens.css">
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="css/ui-components.css">
  <link rel="stylesheet" href="css/toast.css">
  <link rel="stylesheet" href="css/dark-mode.css">
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="icon" type="image/svg+xml" href="img/logo.svg">
  <!-- Supabase Client Library -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
  <!-- Stripe JS -->
  <script src="https://js.stripe.com/v3/"></script>
</head>
<body class="pricing-page">
  <!-- Standardized header component -->
  <ez-header></ez-header>

  <main>
    <section class="pricing-hero section-padding">
      <div class="container">
        <div class="section-header text-center">
          <h1 class="section-title">Choose the Right Plan for Your Needs</h1>
          <p class="section-subtitle">Simple, transparent pricing with no hidden fees</p>
        </div>
      </div>
    </section>

    <section id="pricing-plans" class="pricing section-padding">
      <div class="container">
        <div class="pricing-toggle">
          <span class="toggle-label">Monthly</span>
          <label class="switch">
            <input type="checkbox" id="billing-toggle">
            <span class="slider round"></span>
          </label>
          <span class="toggle-label">Annual <span class="save-badge">Save 20%</span></span>
        </div>

        <div class="pricing-grid">
          <div class="pricing-card">
            <div class="pricing-header">
              <h3>Free Trial</h3>
              <div class="price">$0</div>
              <p class="period">for 7 days</p>
            </div>
            <div class="pricing-features">
              <ul>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Connect to FTP/SFTP sites
                </li>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  View & preview files
                </li>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Basic AI assistance
                </li>
                <li class="disabled">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Save changes to server
                </li>
              </ul>
            </div>
            <div class="pricing-cta">
              <a href="signup.html" class="btn btn-outline btn-block">Start Free Trial</a>
            </div>
          </div>

          <div class="pricing-card featured">
            <div class="pricing-badge">Most Popular</div>
            <div class="pricing-header">
              <h3>Pro</h3>
              <div class="price" id="pro-price">$50</div>
              <p class="period" id="pro-period">per month</p>
            </div>
            <div class="pricing-features">
              <ul>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Unlimited FTP/SFTP sites
                </li>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  View & preview files
                </li>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Advanced AI assistance
                </li>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Save & publish changes
                </li>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Priority support
                </li>
              </ul>
            </div>
            <div class="pricing-cta">
              <button id="checkout-pro" class="btn btn-primary btn-block">Subscribe Now</button>
            </div>
          </div>

          <div class="pricing-card">
            <div class="pricing-header">
              <h3>One-Time Site</h3>
              <div class="price">$500</div>
              <p class="period">one-time fee</p>
            </div>
            <div class="pricing-features">
              <ul>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Single FTP/SFTP site
                </li>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  View & preview files
                </li>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Advanced AI assistance
                </li>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Save & publish changes
                </li>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Lifetime access
                </li>
              </ul>
            </div>
            <div class="pricing-cta">
              <button id="checkout-one-time" class="btn btn-outline btn-block">Purchase</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="faq section-padding bg-light">
      <div class="container">
        <div class="section-header text-center">
          <h2 class="section-title">Frequently Asked Questions</h2>
        </div>

        <div class="faq-grid">
          <div class="faq-item">
            <h3>What is included in the free trial?</h3>
            <p>The 7-day free trial includes access to all features except saving changes to the server. You can connect to FTP/SFTP sites, browse files, edit code, and use basic AI assistance.</p>
          </div>
          
          <div class="faq-item">
            <h3>Can I cancel my subscription anytime?</h3>
            <p>Yes, you can cancel your subscription at any time. Your access will remain active until the end of your current billing period.</p>
          </div>
          
          <div class="faq-item">
            <h3>What payment methods do you accept?</h3>
            <p>We accept all major credit cards (Visa, Mastercard, American Express) and PayPal.</p>
          </div>
          
          <div class="faq-item">
            <h3>Do you offer refunds?</h3>
            <p>We offer a 30-day money-back guarantee for all plans. If you're not satisfied, contact our support team for a full refund.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="cta section-padding">
      <div class="container">
        <div class="cta-content text-center">
          <h2>Ready to simplify your website editing?</h2>
          <p>Start your 7-day free trial today. No credit card required.</p>
          <div class="cta-actions">
            <a href="signup.html" class="btn btn-lg">Sign Up Free</a>
            <a href="login.html" class="btn btn-lg btn-outline">Log In</a>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- Standardized footer component -->
  <ez-footer></ez-footer>

  <!-- Core Scripts -->
  <script src="js/config.js"></script>
  <script src="js/memory-service.js"></script>
  <script src="js/supabase-service.js"></script>
  <script src="js/subscription.js"></script>
  
  <!-- EzEdit UI Components -->
  <script src="js/ui-components.js"></script>
  <script src="components/header.js"></script>
  <script src="components/footer.js"></script>

  <script>
    document.addEventListener('DOMContentLoaded', async () => {
      // Initialize services
      const memoryService = new MemoryService();
      const supabaseService = new SupabaseService(memoryService);
      
      // Initialize services
      window.ezEdit = window.ezEdit || {};
      window.ezEdit.memory = window.ezEdit.memory || new MemoryService();
      window.ezEdit.supabase = window.ezEdit.supabase || new SupabaseService();
      window.ezEdit.subscription = window.ezEdit.subscription || new SubscriptionService();
      
      // Initialize Supabase
      try {
        await window.ezEdit.supabase.init();
        console.log('Supabase initialized successfully');
      } catch (err) {
        console.error('Failed to initialize Supabase:', err);
        window.ezEdit.ui.showToast('Authentication service error. Please try again later.', 'error');
      }
      
      // Initialize Stripe
      const stripe = Stripe(EzEditConfig.apiKeys.stripe.publicKey);
      
      // Price IDs from config
      const priceIds = {
        proMonthly: EzEditConfig.apiKeys.stripe.priceIds.subPro,
        proAnnual: 'price_subPro_annual', // This would come from config in production
        oneTimeSite: EzEditConfig.apiKeys.stripe.priceIds.oneTimeSite
      };
      
      console.log('Using Stripe price IDs:', priceIds);
      
      // Handle billing toggle
      const billingToggle = document.getElementById('billing-toggle');
      const proPrice = document.getElementById('pro-price');
      const proPeriod = document.getElementById('pro-period');
      
      billingToggle.addEventListener('change', () => {
        if (billingToggle.checked) {
          // Annual billing
          proPrice.textContent = '$480';
          proPeriod.textContent = 'per year';
        } else {
          // Monthly billing
          proPrice.textContent = '$50';
          proPeriod.textContent = 'per month';
        }
      });
      
      // Handle Pro checkout
      const checkoutProBtn = document.getElementById('checkout-pro');
      checkoutProBtn.addEventListener('click', async () => {
        if (!window.ezEdit.supabase.isAuthenticated()) {
          // Store intent to purchase
          localStorage.setItem('ezEditPurchaseIntent', billingToggle.checked ? 'pro-annual' : 'pro-monthly');
          // Redirect to signup
          window.location.href = 'signup.html';
          return;
        }
        
        try {
          checkoutProBtn.disabled = true;
          checkoutProBtn.textContent = 'Processing...';
          
          // Create checkout session
          const priceId = billingToggle.checked ? priceIds.proAnnual : priceIds.proMonthly;
          
          // Get user data
          const session = window.ezEdit.supabase.getSession();
          const userData = {
            email: session?.user?.email
          };
          
          // Create Stripe checkout session
          const checkoutSession = await window.ezEdit.subscription.createCheckoutSession(priceId, userData);
          
          if (checkoutSession.url) {
            // Redirect directly to Stripe Checkout URL
            window.location.href = checkoutSession.url;
          } else if (checkoutSession.id) {
            // Use Stripe.js to redirect
            stripe.redirectToCheckout({ sessionId: checkoutSession.id });
          } else {
            throw new Error('Invalid checkout session response');
          }
        } catch (error) {
          console.error('Error creating checkout session:', error);
          window.ezEdit.ui.showToast('Error creating checkout session. Please try again.', 'error');
          checkoutProBtn.disabled = false;
          checkoutProBtn.textContent = 'Subscribe Now';
        }
      });
      
      // Handle One-Time Site checkout
      const checkoutOneTimeBtn = document.getElementById('checkout-one-time');
      checkoutOneTimeBtn.addEventListener('click', async () => {
        if (!window.ezEdit.supabase.isAuthenticated()) {
          // Store intent to purchase
          localStorage.setItem('ezEditPurchaseIntent', 'one-time');
          // Redirect to signup
          window.location.href = 'signup.html';
          return;
        }
        
        try {
          checkoutOneTimeBtn.disabled = true;
          checkoutOneTimeBtn.textContent = 'Processing...';
          
          // Get user data
          const session = window.ezEdit.supabase.getSession();
          const userData = {
            email: session?.user?.email
          };
          
          // Create Stripe checkout session
          const checkoutSession = await window.ezEdit.subscription.createCheckoutSession(priceIds.oneTimeSite, userData);
          
          if (checkoutSession.url) {
            // Redirect directly to Stripe Checkout URL
            window.location.href = checkoutSession.url;
          } else if (checkoutSession.id) {
            // Use Stripe.js to redirect
            stripe.redirectToCheckout({ sessionId: checkoutSession.id });
          } else {
            throw new Error('Invalid checkout session response');
          }
        } catch (error) {
          console.error('Error creating checkout session:', error);
          window.ezEdit.ui.showToast('Error creating checkout session. Please try again.', 'error');
          checkoutOneTimeBtn.disabled = false;
          checkoutOneTimeBtn.textContent = 'Buy Now';
        }
      });
      
      // Check for checkout status in URL
      const urlParams = new URLSearchParams(window.location.search);
      const checkoutStatus = urlParams.get('checkout');
      
      if (checkoutStatus === 'success') {
        window.ezEdit.ui.showToast('Payment successful! Your account has been upgraded.', 'success');
      } else if (checkoutStatus === 'canceled') {
        window.ezEdit.ui.showToast('Payment canceled. You can try again anytime.', 'warning');
      }
    });
  </script>
</body>
</html>
