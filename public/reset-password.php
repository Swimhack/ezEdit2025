<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - ezEdit</title>
  <link rel="stylesheet" href="css/design-tokens.css">
  <link rel="stylesheet" href="css/ui-components.css">
  <link rel="stylesheet" href="css/toast.css">
  <link rel="stylesheet" href="css/dark-mode.css">
  <link rel="stylesheet" href="css/styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="icon" type="image/png" href="favicon.png">
  <!-- Supabase Client Library -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
</head>
<body class="auth-page">
  <header class="auth-header">
    <div class="container">
      <div class="flex justify-between items-center">
        <h1 class="logo">
          <a href="/">
            <span class="logo-icon">Ez</span> <span class="logo-text">Edit.co</span>
          </a>
        </h1>
        <nav class="nav-auth-links">
          <a href="/">Home</a>
          <a href="/#features">Features</a>
          <a href="/#pricing">Pricing</a>
          <a href="/docs/index.html">Docs</a>
        </nav>
      </div>
    </div>
  </header>

  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1 class="logo">
          <a href="/">
            <span class="logo-icon">Ez</span> <span class="logo-text">Edit.co</span>
          </a>
        </h1>
        <h2>Reset your password</h2>
        <p>Enter your email and we'll send you a reset link</p>
      </div>
      
      <form id="reset-form" class="auth-form">
        <div class="form-group">
          <label for="reset-email">Email</label>
          <input type="email" id="reset-email" class="form-input" placeholder="your@email.com" required>
        </div>
        
        <button type="submit" class="btn btn-primary btn-block">Send Reset Link</button>
        
        <div class="auth-footer mt-4">
          <p>Remember your password? <a href="/login.html" class="text-primary">Log in</a></p>
        </div>
      </form>
      
      <div id="error-container" class="error-container" style="display: none;">
        <div class="error-message"></div>
      </div>
      
      <div id="success-container" class="success-container" style="display: none;">
        <div class="success-message">Password reset link sent! Please check your email.</div>
      </div>
    </div>
    
    <div class="auth-help">
      <div class="help-card">
        <h3>Need Help?</h3>
        <ul class="help-links">
          <li><a href="/docs/authentication.html">Authentication Guide</a></li>
          <li><a href="/contact.html">Contact Support</a></li>
        </ul>
      </div>
      
      <div class="help-card">
        <h3>Other Sign-in Options</h3>
        <p>You can also use social login with Google or GitHub to access your account.</p>
        <div class="help-buttons">
          <a href="/login.html" class="btn btn-sm btn-outline">Back to Login</a>
          <a href="/signup.html" class="btn btn-sm btn-outline">Create Account</a>
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
          <a href="/#pricing">Pricing</a>
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
  <script src="js/auth.js" defer></script>
  
  <script>
    // Initialize services when the DOM is loaded
    document.addEventListener('DOMContentLoaded', async () => {
      // Initialize services
      window.ezEdit = window.ezEdit || {};
      window.ezEdit.memory = window.ezEdit.memory || new MemoryService();
      
      // Ensure EzEditConfig is loaded with authentication credentials
      if (!window.EzEditConfig || !window.EzEditConfig.apiKeys || !window.EzEditConfig.apiKeys.supabase) {
        console.error('EzEditConfig is not properly loaded with authentication credentials');
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
          errorContainer.style.display = 'block';
          errorContainer.querySelector('.error-message').textContent = 'Authentication service configuration error. Please contact support.';
        }
        return;
      }
      
      // Initialize authentication services
      window.ezEdit.supabase = window.ezEdit.supabase || new SupabaseService();
      window.ezEdit.phpAuth = window.ezEdit.phpAuth || new PhpAuthService();
      window.ezEdit.auth = window.ezEdit.auth || new AuthService();
      
      try {
        // Initialize both auth services
        await Promise.all([
          window.ezEdit.supabase.init(),
          window.ezEdit.auth.init()
        ]);
        console.log('Authentication services initialized successfully');
        
        // Check if user is already authenticated using the unified AuthService
        if (window.ezEdit.auth.isAuthenticated()) {
          // Redirect to dashboard if already logged in
          window.location.href = 'dashboard.html';
          return;
        }
      } catch (err) {
        console.error('Failed to initialize authentication services:', err);
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
          errorContainer.style.display = 'block';
          errorContainer.querySelector('.error-message').textContent = 'Authentication service error. Please try again later.';
        }
      }
      
      // Check if reset form exists
      const resetForm = document.getElementById('reset-form');
      if (resetForm) {
        resetForm.addEventListener('submit', handleReset);
      }
    });
  </script>
</body>
</html>
