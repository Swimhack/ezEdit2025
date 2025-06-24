/**
 * EzEdit Authentication Module
 * Handles user authentication using both Supabase and PHP backends
 */

// Initialize services
window.ezEdit = window.ezEdit || {};
window.ezEdit.memory = window.ezEdit.memory || new MemoryService();
window.ezEdit.supabase = window.ezEdit.supabase || new SupabaseService();
window.ezEdit.phpAuth = window.ezEdit.phpAuth || new PhpAuthService();
window.ezEdit.auth = window.ezEdit.auth || new AuthService();

// Initialize DOM elements only when needed
document.addEventListener('DOMContentLoaded', () => {
  // Setup error containers
  setupErrorContainers();
  
  // Check for URL error parameters
  checkUrlErrors();
  
  // Initialize event listeners
  initializeEventListeners();
});

/**
 * Setup error containers for forms
 */
function setupErrorContainers() {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const resetForm = document.getElementById('reset-form');
  
  // Only proceed if we're on a page with auth forms
  if (!loginForm && !signupForm && !resetForm) return;
  
  // Create error container if it doesn't exist
  const errorContainer = document.querySelector('.error-message') || document.createElement('div');
  
  if (!document.querySelector('.error-message')) {
    errorContainer.className = 'error-message';
    errorContainer.style.display = 'none';
    errorContainer.style.color = '#ef4444';
    errorContainer.style.marginBottom = '1rem';
    errorContainer.style.padding = '0.5rem';
    errorContainer.style.borderRadius = '0.25rem';
    errorContainer.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
    
    if (loginForm) {
      loginForm.insertBefore(errorContainer, loginForm.firstChild);
    } else if (signupForm) {
      signupForm.insertBefore(errorContainer, signupForm.firstChild);
    } else if (resetForm) {
      resetForm.insertBefore(errorContainer, resetForm.firstChild);
    }
  }
}

/**
 * Check for URL error parameters and pre-fill email from landing page
 */
function checkUrlErrors() {
  // Check for URL error parameters
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  const errorDescription = urlParams.get('error_description');
  
  if (error) {
    const errorContainer = document.querySelector('.error-container');
    if (errorContainer) {
      const errorMessage = errorContainer.querySelector('.error-message') || errorContainer;
      errorMessage.textContent = errorDescription || decodeURIComponent(error);
      errorContainer.style.display = 'block';
    } else {
      showError(null, errorDescription || decodeURIComponent(error));
    }
  }
  
  // Pre-fill email from localStorage if available
  const signupEmail = document.getElementById('signup-email');
  const signupFirstName = document.getElementById('signup-first-name');
  
  if (signupEmail) {
    const savedEmail = localStorage.getItem('ezEditSignupEmail');
    if (savedEmail) {
      signupEmail.value = savedEmail;
      // Focus on the next field if email is pre-filled
      if (signupFirstName) {
        signupFirstName.focus();
      }
      // Clear the stored email after using it
      localStorage.removeItem('ezEditSignupEmail');
    }
  }
  
  // Check if user is already authenticated
  if (window.ezEdit.auth.isAuthenticated()) {
    // Don't redirect from auth-callback or logout pages
    const currentPath = window.location.pathname;
    if (!currentPath.includes('auth-callback') && !currentPath.includes('logout')) {
      window.location.href = 'dashboard.php';
    }
  }
}

/**
 * Initialize event listeners for auth forms
 */
/**
 * Show error message in the UI
 * @param {HTMLElement} container - Error container element
 * @param {string} message - Error message to display
 */
function showError(container, message) {
  console.error('Auth error:', message);
  
  // Try to find error container if not provided
  if (!container) {
    container = document.querySelector('.error-container') || document.querySelector('.error-message');
  }
  
  // If container exists, show error message
  if (container) {
    // If container is the wrapper, find the message element inside
    const messageElement = container.classList.contains('error-container') 
      ? container.querySelector('.error-message') 
      : container;
    
    if (messageElement) {
      messageElement.textContent = message;
    }
    
    // Show the container
    container.style.display = 'block';
  } else {
    // Fallback to alert if no container is found
    alert(message);
  }
}

function initializeEventListeners() {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const resetForm = document.getElementById('reset-form');
  const passwordToggles = document.querySelectorAll('.password-toggle');
  const googleLoginBtn = document.querySelector('.btn-google');
  const githubLoginBtn = document.querySelector('.btn-github');
  
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }
  
  if (resetForm) {
    resetForm.addEventListener('submit', handleReset);
  }
  
  // Initialize all password toggles on the page
  if (passwordToggles && passwordToggles.length > 0) {
    passwordToggles.forEach(toggle => {
      toggle.addEventListener('click', togglePasswordVisibility);
    });
  }
  
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => handleSocialLogin('google'));
  }
  
  if (githubLoginBtn) {
    githubLoginBtn.addEventListener('click', () => handleSocialLogin('github'));
  }
}

/**
 * Handle login form submission
 * @param {Event} e - Form submit event
 */
async function handleLogin(e) {
  e.preventDefault();
  
  const loginEmail = document.getElementById('email');
  const loginPassword = document.getElementById('password');
  const errorContainer = document.querySelector('.error-container') || document.querySelector('.error-message');
  const loginForm = document.getElementById('login-form');
  
  if (!loginEmail || !loginPassword) {
    showError(errorContainer, 'Email or password fields not found');
    return;
  }
  
  const email = loginEmail.value.trim();
  const password = loginPassword.value;
  
  if (!email || !password) {
    showError(errorContainer, 'Please enter both email and password');
    return;
  }
  
  // Show loading state
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading-spinner"></span> Logging in...';
  
  try {
    // Use AuthService for authentication (handles both Supabase and PHP)
    const result = await window.ezEdit.auth.signIn(email, password);
    
    if (result.error) {
      throw new Error(result.error.message || 'Authentication failed');
    }
    
    // Store remember me preference
    const rememberMe = document.getElementById('remember');
    if (rememberMe && rememberMe.checked) {
      localStorage.setItem('ezEditRememberEmail', email);
    } else {
      localStorage.removeItem('ezEditRememberEmail');
    }
    
    // Show success message
    const successMessage = 'Login successful! Redirecting to dashboard...';
    if (window.ezEdit && window.ezEdit.ui && window.ezEdit.ui.showToast) {
      window.ezEdit.ui.showToast(successMessage, 'success');
    }
    
    // Check for purchase intent
    const purchaseIntent = localStorage.getItem('ezEditPurchaseIntent');
    
    // Redirect based on purchase intent or to dashboard
    setTimeout(async () => {
      if (purchaseIntent) {
        // Initialize subscription service if not already done
        window.ezEdit.subscription = window.ezEdit.subscription || new SubscriptionService();
        
        try {
          // Get user data for checkout
          const session = window.ezEdit.supabase.getSession();
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
          
          // Show toast notification
          if (window.ezEdit && window.ezEdit.ui && window.ezEdit.ui.showToast) {
            window.ezEdit.ui.showToast('Redirecting to checkout...', 'info');
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
      } else {
        // No purchase intent, redirect to dashboard
        window.location.href = 'dashboard.php';
      }
    }, 1000);
  } catch (error) {
    console.error('Login error:', error);
    showError(errorContainer, error.message || 'Failed to log in. Please check your credentials and try again.');
    
    // Reset button
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
}

/**
 * Handle signup form submission
 * @param {Event} e - Form submit event
 */
async function handleSignup(e) {
  e.preventDefault();
  
  // Get form elements
  const signupFirstName = document.getElementById('signup-first-name');
  const signupLastName = document.getElementById('signup-last-name');
  const signupEmail = document.getElementById('signup-email');
  const signupPassword = document.getElementById('signup-password');
  const signupTerms = document.getElementById('terms');
  const errorContainer = document.getElementById('error-container');
  const signupForm = document.getElementById('signup-form');
  
  if (!signupFirstName || !signupLastName || !signupEmail || !signupPassword || !signupTerms) {
    console.error('Form elements not found');
    return;
  }
  
  const firstName = signupFirstName.value.trim();
  const lastName = signupLastName.value.trim();
  const email = signupEmail.value.trim();
  const password = signupPassword.value;
  
  // Track signup source for analytics
  const signupSource = localStorage.getItem('ezEditSignupSource') || 'direct';
  const terms = signupTerms.checked;
  
  if (!firstName || !lastName || !email || !password) {
    showError(errorContainer, 'Please fill in all fields');
    return;
  }
  
  if (!terms) {
    showError(errorContainer, 'You must accept the terms and conditions');
    return;
  }
  
  // Password validation removed to simplify login process
  
  // Show loading state
  const submitBtn = signupForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading-spinner"></span> Creating account...';
  
  try {    
    // Use AuthService for signup (handles both Supabase and PHP)
    const result = await window.ezEdit.auth.signUp({
      email,
      password,
      metadata: {
        first_name: firstName,
        last_name: lastName,
        firstName: firstName,  // Include both formats for compatibility
        lastName: lastName,
        full_name: `${firstName} ${lastName}`,
        plan: 'free_trial',
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        signup_source: signupSource
      }
    });
    
    if (!result.success || result.error) {
      throw new Error(result.error || 'Signup failed');
    }
    
    // Check if email confirmation is required
    if (result.user && !result.session) {
      // Show email confirmation message
      const successContainer = document.querySelector('.error-container');
      if (successContainer) {
        successContainer.style.display = 'block';
        successContainer.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
        successContainer.style.color = '#22c55e';
        successContainer.textContent = 'Please check your email to confirm your account!';
      }
      
      // Show toast notification if available
      if (window.ezEdit && window.ezEdit.ui && window.ezEdit.ui.showToast) {
        window.ezEdit.ui.showToast('Please check your email to confirm your account!', 'success');
      }
      
      // Reset button after delay
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }, 1500);
      
      return;
    }
    
    // Clear signup source
    localStorage.removeItem('ezEditSignupSource');
    
    // Show success message
    const successContainer = document.querySelector('.error-container');
    if (successContainer) {
      successContainer.style.display = 'block';
      successContainer.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
      successContainer.style.color = '#22c55e';
      successContainer.textContent = 'Account created successfully! Redirecting to dashboard...';
    }
    
    // Show toast notification if available
    if (window.ezEdit && window.ezEdit.ui && window.ezEdit.ui.showToast) {
      window.ezEdit.ui.showToast('Account created successfully!', 'success');
    }
    
    // Check for purchase intent
    const purchaseIntent = localStorage.getItem('ezEditPurchaseIntent');
    
    // Redirect based on purchase intent or to dashboard
    setTimeout(async () => {
      if (purchaseIntent) {
        // Initialize subscription service if not already done
        window.ezEdit.subscription = window.ezEdit.subscription || new SubscriptionService();
        
        try {
          // Get user data for checkout
          const session = window.ezEdit.supabase.getSession();
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
          
          // Show toast notification
          if (window.ezEdit && window.ezEdit.ui && window.ezEdit.ui.showToast) {
            window.ezEdit.ui.showToast('Redirecting to checkout...', 'info');
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
      } else {
        // No purchase intent, redirect to dashboard
        window.location.href = 'dashboard.php';
      }
    }, 1500);
  } catch (error) {
    console.error('Signup error:', error);
    showError(errorContainer, error.message || 'Failed to create account. Please try again.');
    
    // Reset button
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
}

/**
 * Handle password reset form submission
 * @param {Event} e - Form submit event
 */
async function handleReset(e) {
  e.preventDefault();
  
  const email = document.getElementById('reset-email').value.trim();
  
  if (!email) {
    showError(errorContainer, 'Please enter your email address');
    return;
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError(errorContainer, 'Please enter a valid email address');
    return;
  }
  
  // Show loading state
  const submitBtn = resetForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';
  
  try {
    // Use Supabase for password reset with redirect to our custom page
    const { error } = await window.ezEdit.supabase.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password-confirm.html`,
    });
    
    if (error) throw error;
    
    // Create success message container
    const successContainer = document.createElement('div');
    successContainer.className = 'success-message';
    successContainer.style.display = 'block';
    successContainer.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
    successContainer.style.color = '#22c55e';
    successContainer.style.padding = '1rem';
    successContainer.style.borderRadius = '0.25rem';
    successContainer.style.marginBottom = '1rem';
    
    // Replace form with success message
    resetForm.innerHTML = '';
    successContainer.innerHTML = `
      <h3 style="margin-top: 0;">Check your email</h3>
      <p>We've sent a password reset link to <strong>${email}</strong></p>
      <p>Click the link in the email to reset your password.</p>
      <p>If you don't see the email, check your spam folder.</p>
      <div style="margin-top: 1rem;">
        <a href="/login.html" class="btn btn-outline">Return to login</a>
        <button id="resend-btn" class="btn btn-text">Resend email</button>
      </div>
    `;
    resetForm.parentNode.insertBefore(successContainer, resetForm);
    
    // Add resend functionality
    const resendBtn = document.getElementById('resend-btn');
    if (resendBtn) {
      resendBtn.addEventListener('click', async () => {
        resendBtn.disabled = true;
        resendBtn.textContent = 'Sending...';
        
        try {
          await window.ezEdit.supabase.client.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password-confirm.html`,
          });
          resendBtn.textContent = 'Email sent!';
          setTimeout(() => {
            resendBtn.textContent = 'Resend email';
            resendBtn.disabled = false;
          }, 5000);
        } catch (resendError) {
          resendBtn.textContent = 'Failed to send';
          setTimeout(() => {
            resendBtn.textContent = 'Resend email';
            resendBtn.disabled = false;
          }, 3000);
        }
      });
    }
    
    // Track password reset attempt for analytics
    try {
      localStorage.setItem('ezEditPasswordResetEmail', email);
      localStorage.setItem('ezEditPasswordResetTime', new Date().toISOString());
    } catch (storageError) {
      console.warn('Failed to store reset data in localStorage', storageError);
    }
    
  } catch (error) {
    console.error('Reset error:', error);
    showError(errorContainer, error.message || 'Failed to send reset link. Please try again.');
    
    // Reset button
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
}

/**
 * Handle password reset request
 * @param {Event} e - Form submit event
 */
async function handleReset(e) {
  e.preventDefault();
  
  // Get form elements
  const resetForm = document.getElementById('reset-form');
  const resetEmail = document.getElementById('reset-email');
  const errorContainer = document.getElementById('error-container');
  const successContainer = document.getElementById('success-container');
  
  if (!resetForm || !resetEmail) {
    console.error('Reset form elements not found');
    return;
  }
  
  const email = resetEmail.value.trim();
  
  if (!email) {
    showError(errorContainer, 'Please enter your email address');
    return;
  }
  
  // Show loading state
  const submitBtn = resetForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading-spinner"></span> Sending reset link...';
  
  try {
    // Use Supabase to send password reset email (PHP auth doesn't support this yet)
    const { error } = await window.ezEdit.supabase.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password-confirm.html`,
    });
    
    if (error) throw error;
    
    // Hide form and show success message
    resetForm.style.display = 'none';
    if (successContainer) {
      successContainer.style.display = 'block';
    }
    
    // Add resend button functionality
    const resendBtn = document.createElement('button');
    resendBtn.className = 'btn btn-outline mt-4';
    resendBtn.textContent = 'Resend email';
    resendBtn.onclick = async () => {
      resendBtn.disabled = true;
      resendBtn.textContent = 'Sending...';
      
      try {
        await window.ezEdit.supabase.client.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password-confirm.html`,
        });
        resendBtn.textContent = 'Email sent!';
        setTimeout(() => {
          resendBtn.textContent = 'Resend email';
          resendBtn.disabled = false;
        }, 5000);
      } catch (resendError) {
        resendBtn.textContent = 'Failed to send';
        setTimeout(() => {
          resendBtn.textContent = 'Resend email';
          resendBtn.disabled = false;
        }, 3000);
      }
    };
    
    // Add resend button to success container
    if (successContainer) {
      const backToLoginBtn = document.createElement('a');
      backToLoginBtn.href = '/login.html';
      backToLoginBtn.className = 'btn btn-primary mt-4 mr-2';
      backToLoginBtn.textContent = 'Back to login';
      
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'flex mt-4';
      buttonContainer.appendChild(backToLoginBtn);
      buttonContainer.appendChild(resendBtn);
      
      successContainer.appendChild(buttonContainer);
    }
    
    // Track password reset attempt for analytics
    try {
      localStorage.setItem('ezEditPasswordResetEmail', email);
      localStorage.setItem('ezEditPasswordResetTime', new Date().toISOString());
    } catch (storageError) {
      console.warn('Failed to store reset data in localStorage', storageError);
    }
    
  } catch (error) {
    console.error('Reset error:', error);
    if (errorContainer) {
      errorContainer.style.display = 'block';
      errorContainer.querySelector('.error-message').textContent = error.message || 'Failed to send reset link. Please try again.';
    } else {
      showError(null, error.message || 'Failed to send reset link. Please try again.');
    }
    
    // Reset button
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
}

/**
 * Handle social login
 * @param {string} provider - Social provider (google, github)
 */
async function handleSocialLogin(provider) {
  try {
    // Track signup source for analytics
    const signupSource = localStorage.getItem('ezEditSignupSource') || 'direct';
    localStorage.setItem('ezEditSocialProvider', provider);
    
    // Show loading state on the button
    const button = document.querySelector(provider === 'google' ? '.btn-google' : '.btn-github');
    if (!button) {
      throw new Error(`${provider} login button not found`);
    }
    
    const originalContent = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="loading-spinner"></span> Connecting...`;
    
    // Get redirect URL from query parameters if available
    const urlParams = new URLSearchParams(window.location.search);
    const redirectTo = urlParams.get('redirect');
    
    // Store metadata in localStorage to be used in auth-callback
    localStorage.setItem('ezEditUserMetadata', JSON.stringify({
      signupSource,
      trialStartDate: new Date().toISOString()
    }));
    
    // Store redirect URL if available
    if (redirectTo) {
      localStorage.setItem('ezEditRedirectUrl', redirectTo);
    }
    
    // Use our AuthService for social login (which uses Supabase for OAuth)
    try {
      const result = await window.ezEdit.auth.signInWithProvider(provider, {
        redirectTo: window.location.origin + '/auth-callback.html',
        scopes: provider === 'google' ? 'email profile' : undefined
      });
      
      // The page will be redirected by Supabase, so we don't need to do anything else here
      // But if we get here, something went wrong with the redirect
      if (!result || result.error) {
        throw new Error(result?.error?.message || `${provider} authentication failed`);
      }
    } catch (error) {
      // Reset button state if there's an error
      button.disabled = false;
      button.innerHTML = originalContent;
      throw error;
    }
  } catch (error) {
    console.error(`${provider} login error:`, error);
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
      showError(errorContainer, error.message || `Failed to log in with ${provider}. Please try again.`);
    } else {
      alert(error.message || `Failed to log in with ${provider}. Please try again.`);
    }
  }
}

/**
 * Toggle password visibility
 * @param {Event} e - Click event
 */
function togglePasswordVisibility(e) {
  // Get the button that was clicked
  const toggle = e.currentTarget;
  
  // Find the closest password input (parent's sibling or within the same container)
  const container = toggle.closest('.password-input-wrapper');
  if (!container) return;
  
  const passwordInput = container.querySelector('input[type="password"], input[type="text"]');
  if (!passwordInput) return;
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggle.setAttribute('aria-label', 'Hide password');
    toggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
  } else {
    passwordInput.type = 'password';
    toggle.setAttribute('aria-label', 'Show password');
    toggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  }
}

/**
 * Show error message
 * @param {HTMLElement} container - Error container element
 * @param {string} message - Error message
 */
function showError(container, message) {
  if (!container) {
    console.error('Error container not found');
    return;
  }
  
  // Find the error message element inside the container
  let messageElement = container;
  if (container.classList.contains('error-container')) {
    messageElement = container.querySelector('.error-message') || container;
  }
  
  messageElement.textContent = message;
  container.style.display = 'block';
  container.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
  container.style.color = '#ef4444';
  
  // Show toast notification if available
  if (window.ezEdit && window.ezEdit.ui && window.ezEdit.ui.showToast) {
    window.ezEdit.ui.showToast(message, 'error');
  }
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    container.style.display = 'none';
  }, 5000);
}
