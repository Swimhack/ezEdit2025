<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authentication - ezEdit</title>
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="img/logo.svg">
  
  <!-- Stylesheets -->
  <link rel="stylesheet" href="css/design-tokens.css">
  <link rel="stylesheet" href="css/ui-components.css">
  <link rel="stylesheet" href="css/toast.css">
  <link rel="stylesheet" href="css/dark-mode.css">
  <link rel="stylesheet" href="css/styles.css">
  
  <style>
    .auth-callback {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: var(--space-6);
      background-color: var(--color-background);
      color: var(--color-text);
    }
    
    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 5px solid var(--color-border);
      border-radius: 50%;
      border-top-color: var(--color-primary);
      animation: spin 1s ease-in-out infinite;
      margin: var(--space-6) auto;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .status-message {
      font-size: var(--font-size-lg);
      margin-top: var(--space-4);
      transition: color 0.3s ease;
    }
    
    .status-message.error {
      color: var(--color-error);
    }
    
    .status-message.success {
      color: var(--color-success);
    }
    
    .logo {
      width: 80px;
      height: 80px;
      margin-bottom: var(--space-4);
    }
  </style>
</head>
<body>
  <main class="auth-callback">
    <img src="img/logo.svg" alt="ezEdit Logo" class="logo">
    <h1 class="heading-lg">Authenticating...</h1>
    <div class="loading-spinner"></div>
    <p id="status-message" class="status-message">Completing your authentication. Please wait...</p>
  </main>

  <!-- Scripts -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
  <script src="https://js.stripe.com/v3/"></script>
  <script src="js/config.js"></script>
  <script src="js/memory-service.js"></script>
  <script src="js/supabase-service.js"></script>
  <script src="js/php-auth-service.js"></script>
  <script src="js/auth-service.js"></script>
  <script src="js/subscription.js"></script>
  <script src="js/ui-components.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', async () => {
      // Initialize UI components
      if (window.ezEdit && window.ezEdit.ui) {
        window.ezEdit.ui.init();
      }
      const statusMessage = document.getElementById('status-message');
      
      try {
        // Initialize services
        window.ezEdit = window.ezEdit || {};
        window.ezEdit.memory = window.ezEdit.memory || new MemoryService();
        window.ezEdit.supabase = window.ezEdit.supabase || new SupabaseService();
        window.ezEdit.phpAuth = window.ezEdit.phpAuth || new PhpAuthService();
        window.ezEdit.auth = window.ezEdit.auth || new AuthService();
        
        // Initialize auth services
        await window.ezEdit.supabase.init();
        await window.ezEdit.auth.init();
        
        // Get the hash from the URL
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        
        // Check if this is an access token or error
        const accessToken = params.get('access_token');
        const error = params.get('error');
        const errorDescription = params.get('error_description');
        
        if (error) {
          statusMessage.textContent = `Authentication error: ${errorDescription || error}`;
          statusMessage.classList.add('error');
          
          // Show toast notification
          if (window.ezEdit && window.ezEdit.ui && window.ezEdit.ui.showToast) {
            window.ezEdit.ui.showToast('Authentication failed', 'error');
          }
          setTimeout(() => {
            window.location.href = 'login.html?error=' + encodeURIComponent(errorDescription || error);
          }, 3000);
          return;
        }
        
        if (!accessToken) {
          statusMessage.textContent = 'No authentication token found. Redirecting to login...';
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 3000);
          return;
        }
        
        // Get the client
        const supabase = window.ezEdit.supabase.client;
        
        if (!supabase) {
          statusMessage.textContent = 'Supabase client not initialized. Redirecting to login...';
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 3000);
          return;
        }
        
        // Set the session
        const refreshToken = params.get('refresh_token');
        const { data: { session }, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (sessionError) {
          statusMessage.textContent = `Session error: ${sessionError.message}`;
          statusMessage.classList.add('error');
          
          // Show toast notification
          if (window.ezEdit && window.ezEdit.ui && window.ezEdit.ui.showToast) {
            window.ezEdit.ui.showToast('Session error', 'error');
          }
          setTimeout(() => {
            window.location.href = 'login.html?error=' + encodeURIComponent(sessionError.message);
          }, 3000);
          return;
        }
        
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, plan, trial_days_left, auth_provider, signup_source')
          .eq('id', session.user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is the error code for 'no rows returned'
          console.warn('Error fetching profile:', profileError);
        }
        
        // Get saved metadata from localStorage
        let savedMetadata = {};
        try {
          const savedMetadataStr = localStorage.getItem('ezEditUserMetadata');
          if (savedMetadataStr) {
            savedMetadata = JSON.parse(savedMetadataStr);
            // Clear it after using
            localStorage.removeItem('ezEditUserMetadata');
          }
        } catch (e) {
          console.warn('Failed to parse saved metadata', e);
        }
        
        // Get social provider if any
        const socialProvider = localStorage.getItem('ezEditSocialProvider');
        if (socialProvider) {
          localStorage.removeItem('ezEditSocialProvider');
        }
        
        // If this is a new user (no profile), update their profile with metadata
        if (!profile && session.user.id) {
          // Extract name from email if not provided
          let firstName = session.user.user_metadata?.full_name?.split(' ')[0] || 
                         session.user.user_metadata?.name?.split(' ')[0] || 
                         session.user.user_metadata?.given_name || 
                         session.user.email?.split('@')[0] || 'User';
          let lastName = session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 
                        session.user.user_metadata?.name?.split(' ').slice(1).join(' ') || 
                        session.user.user_metadata?.family_name || '';
          
          // Create profile with trial information
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: session.user.id,
                first_name: firstName,
                last_name: lastName,
                email: session.user.email,
                plan: 'free-trial',
                trial_days_left: 7,
                signup_source: savedMetadata.signupSource || (socialProvider ? 'social-' + socialProvider : 'direct'),
                trial_start_date: savedMetadata.trialStartDate || new Date().toISOString(),
                auth_provider: socialProvider || 'email',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ])
            .select()
            .single();
            
          if (newProfile) {
            statusMessage.textContent = 'Account created successfully! Setting up your workspace...';
            statusMessage.classList.add('success');
            
            // Show toast notification
            if (window.ezEdit && window.ezEdit.ui && window.ezEdit.ui.showToast) {
              window.ezEdit.ui.showToast('Account created successfully!', 'success');
            }
          }
          
          if (insertError) {
            console.warn('Failed to create profile', insertError);
          }
        }
        
        // Get the final profile data (either existing or newly created)
        const finalProfile = profile || newProfile;
        
        // Store auth data in localStorage
        localStorage.setItem('ezEditAuth', JSON.stringify({
          isAuthenticated: true,
          user: {
            id: session.user.id,
            email: session.user.email,
            firstName: finalProfile?.first_name || session.user.user_metadata?.firstName || session.user.user_metadata?.given_name || 'User',
            lastName: finalProfile?.last_name || session.user.user_metadata?.lastName || session.user.user_metadata?.family_name || '',
            plan: finalProfile?.plan || 'free-trial',
            trialDaysLeft: finalProfile?.trial_days_left || 7,
            authProvider: finalProfile?.auth_provider || socialProvider || 'email',
            signupSource: finalProfile?.signup_source || savedMetadata.signupSource || 'direct'
          },
          token: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: new Date(session.expires_at).getTime()
        }));
        
        // Also store in memory service if available
        if (window.ezEdit && window.ezEdit.memory) {
          window.ezEdit.memory.set('auth', {
            isAuthenticated: true,
            userId: session.user.id,
            email: session.user.email
          });
        }
        
        // Check if there's a purchase intent stored in localStorage
        const purchaseIntent = localStorage.getItem('ezEditPurchaseIntent');
        
        // Check if there's a redirect URL stored in localStorage
        const redirectUrl = localStorage.getItem('ezEditRedirectUrl');
        
        if (purchaseIntent) {
          // Initialize subscription service
          window.ezEdit.subscription = window.ezEdit.subscription || new SubscriptionService();
          
          statusMessage.textContent = 'Authentication successful! Redirecting to checkout...';
          statusMessage.classList.add('success');
          
          // Show toast notification
          if (window.ezEdit && window.ezEdit.ui && window.ezEdit.ui.showToast) {
            window.ezEdit.ui.showToast('Authentication successful! Redirecting to checkout...', 'success');
          }
          
          setTimeout(async () => {
            try {
              // Get user data for checkout
              const userData = {
                email: session?.user?.email
              };
              
              // Determine which price ID to use based on purchase intent
              let priceId;
              switch (purchaseIntent) {
                case 'pro-monthly':
                  priceId = EzEditConfig.apiKeys.stripe.priceIds.subPro;
                  break;
                case 'pro-annual':
                  priceId = 'price_subPro_annual'; // This would come from config in production
                  break;
                case 'one-time':
                  priceId = EzEditConfig.apiKeys.stripe.priceIds.oneTimeSite;
                  break;
                default:
                  // If intent is invalid, redirect to dashboard
                  window.location.href = 'dashboard.php';
                  return;
              }
              
              // Create checkout session and redirect
              const checkoutSession = await window.ezEdit.subscription.createCheckoutSession(priceId, userData);
              
              // Clear purchase intent
              localStorage.removeItem('ezEditPurchaseIntent');
              
              if (checkoutSession.url) {
                // Redirect directly to Stripe Checkout URL
                window.location.href = checkoutSession.url;
              } else if (checkoutSession.id) {
                // Initialize Stripe if needed
                const stripe = Stripe(EzEditConfig.apiKeys.stripe.publicKey);
                // Use Stripe.js to redirect
                stripe.redirectToCheckout({ sessionId: checkoutSession.id });
              } else {
                throw new Error('Invalid checkout session response');
              }
            } catch (error) {
              console.error('Error creating checkout session:', error);
              if (window.ezEdit && window.ezEdit.ui && window.ezEdit.ui.showToast) {
                window.ezEdit.ui.showToast('Error creating checkout session. Redirecting to dashboard.', 'error');
              }
              // Redirect to dashboard on error
              setTimeout(() => {
                window.location.href = 'dashboard.php';
              }, 1500);
            }
          }, 1500);
        } else if (redirectUrl) {
          localStorage.removeItem('ezEditRedirectUrl');
          statusMessage.textContent = 'Authentication successful! Redirecting you back...';
          statusMessage.classList.add('success');
          
          // Show toast notification
          if (window.ezEdit && window.ezEdit.ui && window.ezEdit.ui.showToast) {
            window.ezEdit.ui.showToast('Authentication successful!', 'success');
          }
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1500);
        } else {
          statusMessage.textContent = 'Authentication successful! Redirecting to dashboard...';
          statusMessage.classList.add('success');
          
          // Show toast notification
          if (window.ezEdit && window.ezEdit.ui && window.ezEdit.ui.showToast) {
            window.ezEdit.ui.showToast('Authentication successful!', 'success');
          }
          setTimeout(() => {
            window.location.href = 'dashboard.php';
          }, 1500);
        }
        
      } catch (error) {
        console.error('Authentication callback error:', error);
        statusMessage.textContent = `Authentication error: ${error.message || 'Unknown error occurred'}`;
        statusMessage.classList.add('error');
        
        // Show toast notification
        if (window.ezEdit && window.ezEdit.ui && window.ezEdit.ui.showToast) {
          window.ezEdit.ui.showToast('Authentication failed', 'error');
        }
        
        // Clear any potentially corrupted auth data
        localStorage.removeItem('ezEditAuth');
        localStorage.removeItem('ezEditUserMetadata');
        localStorage.removeItem('ezEditSocialProvider');
        localStorage.removeItem('ezEditRedirectUrl');
        
        // If we have Supabase client, try to sign out to clean up session
        try {
          if (window.ezEdit && window.ezEdit.supabase && window.ezEdit.supabase.client) {
            await window.ezEdit.supabase.client.auth.signOut();
          }
        } catch (e) {
          console.warn('Failed to sign out after error', e);
        }
        
        setTimeout(() => {
          window.location.href = 'login.html?error=' + encodeURIComponent(error.message || 'Authentication failed');
        }, 3000);
      }
    });
  </script>
</body>
</html>
