<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign Up - EzEdit</title>
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
  <!-- Stripe.js -->
  <script src="https://js.stripe.com/v3/"></script>
</head>
<body class="auth-page">
  <!-- Standardized header component -->
  <ez-header></ez-header>

  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1 class="logo">
          <a href="/">
            <span class="logo-icon">Ez</span> <span class="logo-text">Edit.co</span>
          </a>
        </h1>
        <h2>Create your account</h2>
        <p>Start your 7-day free trial, no credit card required</p>
      </div>
      
      <form id="signup-form" class="auth-form">
        <div id="error-container" class="error-container" style="display: none;">
          <div class="error-message"></div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="signup-first-name">First Name</label>
            <input type="text" id="signup-first-name" class="form-input" placeholder="John" required>
          </div>
          <div class="form-group">
            <label for="signup-last-name">Last Name</label>
            <input type="text" id="signup-last-name" class="form-input" placeholder="Doe" required>
          </div>
        </div>
        
        <div class="form-group">
          <label for="signup-email">Email</label>
          <input type="email" id="signup-email" class="form-input" placeholder="your@email.com" required>
        </div>
        
        <div class="form-group">
          <label for="signup-password">Password</label>
          <div class="password-input-wrapper">
            <input type="password" id="signup-password" class="form-input" placeholder="••••••••" required>
            <button type="button" class="password-toggle" aria-label="Toggle password visibility">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
          <!-- Password strength meter removed to simplify login process -->
        </div>
        
        <div class="form-group">
          <div class="checkbox-wrapper">
            <input type="checkbox" id="terms" required>
            <label for="terms">I agree to the <a href="/terms.html" class="text-primary">Terms of Service</a> and <a href="/privacy.html" class="text-primary">Privacy Policy</a></label>
          </div>
        </div>
        
        <button type="submit" class="btn btn-primary btn-block">Create Account</button>
        
        <div class="auth-divider">
          <span>Or continue with</span>
        </div>
        
        <div class="social-logins">
          <button type="button" class="btn btn-social btn-google">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google
          </button>
          <button type="button" class="btn btn-social btn-github">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.24.73-.53v-1.85c-3.03.66-3.67-1.45-3.67-1.45-.5-1.29-1.21-1.63-1.21-1.63-.99-.68.07-.67.07-.67 1.09.08 1.67 1.13 1.67 1.13.97 1.66 2.55 1.18 3.17.9.1-.7.38-1.18.69-1.45-2.42-.27-4.96-1.21-4.96-5.4 0-1.2.42-2.17 1.12-2.94-.11-.28-.49-1.4.11-2.91 0 0 .92-.3 3 1.12a10.44 10.44 0 015.5 0c2.08-1.42 3-1.12 3-1.12.6 1.51.22 2.63.11 2.91.7.77 1.12 1.74 1.12 2.94 0 4.2-2.55 5.13-4.98 5.4.39.34.74 1 .74 2.02v3c0 .29.19.62.74.52A11 11 0 0012 1.27"></path></svg>
            GitHub
          </button>
        </div>
      </form>
      
      <div class="auth-footer">
        <p>Already have an account? <a href="/login.html" class="text-primary">Log in</a></p>
      </div>
      

    </div>
    
    <div class="auth-help">
      <div class="help-card">
        <h3>Plan Options</h3>
        <ul class="help-links">
          <li><a href="/pricing.html">View Pricing Plans</a></li>
          <li><a href="/docs/plans.html">Plan Comparison</a></li>
          <li><a href="/contact.html">Request Custom Plan</a></li>
        </ul>
      </div>
      
      <div class="help-card">
        <h3>Why Choose EzEdit?</h3>
        <p>EzEdit makes editing legacy websites simple with our intuitive Monaco editor, FTP integration, and AI assistance. Start your 7-day free trial today!</p>
        <div class="feature-highlights">
          <div class="feature-highlight">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>No coding skills needed</span>
          </div>
          <div class="feature-highlight">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Instant preview</span>
          </div>
          <div class="feature-highlight">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>AI-powered assistance</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <footer class="auth-footer-main">
    <div class="container">
      <div class="footer-bottom">
        <p>&copy; 2025 EzEdit.co • <a href="/privacy.html">Privacy</a> • <a href="/terms.html">Terms</a></p>
        <div class="footer-links">
          <a href="/">Home</a>
          <a href="/pricing.html">Pricing</a>
          <a href="/docs/index.html">Documentation</a>
          <a href="/contact.html">Contact</a>
        </div>
      </div>
    </div>
  </footer>

  <!-- Core Scripts -->
  <script src="js/config.js"></script>
  <script src="js/memory-service.js"></script>
  <script src="js/supabase-service.js"></script>
  <script src="js/php-auth-service.js"></script>
  <script src="js/auth-service.js"></script>
  <script src="js/subscription.js"></script>
  <script src="js/auth.js" defer></script>
  <!-- Standardized footer component -->
  <ez-footer></ez-footer>

  <!-- EzEdit UI Components -->
  <script src="js/ui-components.js"></script>
  <script src="components/header.js"></script>
  <script src="components/footer.js"></script>

  <script>
    // Initialize UI components
    document.addEventListener('DOMContentLoaded', () => {
      // Initialize authentication services
      window.ezEdit = window.ezEdit || {};
      window.ezEdit.memory = window.ezEdit.memory || new MemoryService();
      window.ezEdit.supabase = window.ezEdit.supabase || new SupabaseService();
      window.ezEdit.phpAuth = window.ezEdit.phpAuth || new PhpAuthService();
      window.ezEdit.auth = window.ezEdit.auth || new AuthService();
      
      // Initialize auth services
      Promise.all([
        window.ezEdit.supabase.init(),
        window.ezEdit.auth.init()
      ]).then(() => {
        // Check if user is already logged in after initialization
        if (window.ezEdit.auth.isAuthenticated()) {
          window.location.href = 'dashboard.html';
        }
      }).catch(err => {
        console.error('Failed to initialize authentication services:', err);
      });
      
      // Check if we have a redirect error from OAuth
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      
      if (error && errorDescription) {
        const errorContainer = document.querySelector('.error-container');
        const errorMessage = document.querySelector('.error-message');
        if (errorContainer && errorMessage) {
          errorMessage.textContent = errorDescription;
          errorContainer.style.display = 'block';
        }
      }
      
      // Authentication check moved to after initialization
      
      // Initialize password toggle
      const passwordToggle = document.querySelector('.password-toggle');
      if (passwordToggle) {
        passwordToggle.addEventListener('click', togglePasswordVisibility);
      }
      
      // Password strength meter removed to simplify login process
      
      // Initialize form submission
      const signupForm = document.getElementById('signup-form');
      if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
      }
      
      // Initialize social login buttons
      const googleLoginBtn = document.querySelector('.btn-google');
      const githubLoginBtn = document.querySelector('.btn-github');
      
      if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => handleSocialLogin('google'));
      }
      
      if (githubLoginBtn) {
        githubLoginBtn.addEventListener('click', () => handleSocialLogin('github'));
      }
      
      // Pre-fill email from localStorage if available
      const signupEmail = document.getElementById('signup-email');
      if (signupEmail) {
        const savedEmail = localStorage.getItem('ezEditSignupEmail');
        if (savedEmail) {
          signupEmail.value = savedEmail;
          // Clear the stored email after using it
          localStorage.removeItem('ezEditSignupEmail');
        }
      }
    });
  </script>
</body>
</html>
