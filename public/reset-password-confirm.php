<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Set New Password - ezEdit</title>
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
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1 class="logo">
          <a href="/">
            <span class="logo-icon">Ez</span> <span class="logo-text">Edit.co</span>
          </a>
        </h1>
        <h2>Set New Password</h2>
        <p>Enter your new password below</p>
      </div>
      
      <div id="loading-message" class="alert alert-info" style="display: none;">
        Verifying your reset link...
      </div>
      
      <div id="error-message" class="alert alert-danger" style="display: none;">
        Invalid or expired password reset link. Please request a new one.
      </div>
      
      <div id="success-message" class="alert alert-success" style="display: none;">
        Password updated successfully! Redirecting to login...
      </div>
      
      <form id="new-password-form" class="auth-form" style="display: none;">
        <div class="form-group">
          <label for="new-password">New Password</label>
          <div class="password-input-container">
            <input type="password" id="new-password" class="form-input" placeholder="Enter new password" required minlength="8">
            <button type="button" class="password-toggle" aria-label="Toggle password visibility">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
          <div class="password-strength-meter">
            <div class="strength-bar"></div>
          </div>
          <small class="password-feedback text-muted">Password must be at least 8 characters</small>
        </div>
        
        <div class="form-group">
          <label for="confirm-password">Confirm Password</label>
          <div class="password-input-container">
            <input type="password" id="confirm-password" class="form-input" placeholder="Confirm new password" required minlength="8">
            <button type="button" class="password-toggle" aria-label="Toggle password visibility">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
          <small class="password-match-feedback text-muted"></small>
        </div>
        
        <button type="submit" class="btn btn-primary btn-block">Update Password</button>
        
        <div class="auth-footer mt-4">
          <p>Remember your password? <a href="login.html" class="text-primary">Log in</a></p>
        </div>
      </form>
    </div>
  </div>

  <!-- Core Scripts -->
  <script src="js/config.js"></script>
  <script src="js/memory-service.js"></script>
  <script src="js/supabase-service.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', async function() {
      const loadingMessage = document.getElementById('loading-message');
      const errorMessage = document.getElementById('error-message');
      const successMessage = document.getElementById('success-message');
      const newPasswordForm = document.getElementById('new-password-form');
      const newPasswordInput = document.getElementById('new-password');
      const confirmPasswordInput = document.getElementById('confirm-password');
      const passwordFeedback = document.querySelector('.password-feedback');
      const passwordMatchFeedback = document.querySelector('.password-match-feedback');
      const strengthBar = document.querySelector('.strength-bar');
      
      // Initialize services
      if (!window.ezEdit) window.ezEdit = {};
      window.ezEdit.memory = window.ezEdit.memory || new MemoryService();
      
      // Ensure EzEditConfig is loaded with Supabase credentials
      if (!window.EzEditConfig || !window.EzEditConfig.apiKeys || !window.EzEditConfig.apiKeys.supabase) {
        console.error('EzEditConfig is not properly loaded with Supabase credentials');
        loadingMessage.style.display = 'none';
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Authentication service configuration error. Please contact support.';
        return;
      }
      
      // Initialize Supabase service
      window.ezEdit.supabase = new SupabaseService();
      
      try {
        await window.ezEdit.supabase.init();
        console.log('Supabase initialized successfully');
        
        // Check if user is already authenticated
        const session = await window.ezEdit.supabase.getSession();
        if (session) {
          window.location.href = 'dashboard.html';
          return;
        }
      } catch (err) {
        console.error('Failed to initialize Supabase:', err);
        loadingMessage.style.display = 'none';
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Authentication service error. Please try again later.';
        return;
      }
      
      // Get hash parameters from URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      
      // Show loading message
      loadingMessage.style.display = 'block';
      
      // Verify the reset token
      if (accessToken && type === 'recovery') {
        try {
          // Set the session with the recovery tokens
          const { error } = await window.ezEdit.supabase.client.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            throw new Error(error.message);
          }
          
          // Hide loading and show form
          loadingMessage.style.display = 'none';
          newPasswordForm.style.display = 'block';
        } catch (error) {
          console.error('Error verifying reset token:', error);
          loadingMessage.style.display = 'none';
          errorMessage.style.display = 'block';
          errorMessage.textContent = 'Invalid or expired password reset link. Please request a new one.';
        }
      } else {
        // No valid recovery parameters
        loadingMessage.style.display = 'none';
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Missing or invalid password reset parameters. Please request a new reset link.';
      }
      
      // Password toggle functionality
      document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', function(e) {
          // Get the button that was clicked
          const toggle = e.currentTarget;
          
          // Find the closest password input
          const container = toggle.closest('.password-input-container');
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
        });
      });
      
      // Password strength checker
      newPasswordInput.addEventListener('input', function() {
        const password = this.value;
        let strength = 0;
        let feedback = '';
        
        if (password.length >= 8) {
          strength += 25;
          feedback = 'Minimum length met. ';
        } else {
          feedback = 'Password must be at least 8 characters. ';
        }
        
        if (password.match(/[A-Z]/)) {
          strength += 25;
          feedback += 'Has uppercase. ';
        }
        
        if (password.match(/[0-9]/)) {
          strength += 25;
          feedback += 'Has number. ';
        }
        
        if (password.match(/[^A-Za-z0-9]/)) {
          strength += 25;
          feedback += 'Has special character. ';
        }
        
        // Update strength bar
        strengthBar.style.width = `${strength}%`;
        
        // Update color based on strength
        if (strength < 50) {
          strengthBar.style.backgroundColor = '#dc3545'; // red
        } else if (strength < 75) {
          strengthBar.style.backgroundColor = '#ffc107'; // yellow
        } else {
          strengthBar.style.backgroundColor = '#28a745'; // green
        }
        
        passwordFeedback.textContent = feedback;
      });
      
      // Password match checker
      confirmPasswordInput.addEventListener('input', function() {
        const password = newPasswordInput.value;
        const confirmPassword = this.value;
        
        if (password === confirmPassword) {
          passwordMatchFeedback.textContent = 'Passwords match';
          passwordMatchFeedback.classList.remove('text-danger');
          passwordMatchFeedback.classList.add('text-success');
        } else {
          passwordMatchFeedback.textContent = 'Passwords do not match';
          passwordMatchFeedback.classList.remove('text-success');
          passwordMatchFeedback.classList.add('text-danger');
        }
      });
      
      // Form submission
      newPasswordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const password = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
          passwordMatchFeedback.textContent = 'Passwords do not match';
          passwordMatchFeedback.classList.add('text-danger');
          return;
        }
        
        // Disable form and show loading
        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Updating...';
        
        try {
          // Update the password
          const { error } = await window.ezEdit.supabase.client.auth.updateUser({
            password: password
          });
          
          if (error) {
            throw new Error(error.message);
          }
          
          // Show success message
          newPasswordForm.style.display = 'none';
          successMessage.style.display = 'block';
          
          // Redirect to login after a delay
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 3000);
          
        } catch (error) {
          console.error('Error updating password:', error);
          errorMessage.style.display = 'block';
          errorMessage.textContent = `Failed to update password: ${error.message}`;
          submitButton.disabled = false;
          submitButton.textContent = 'Update Password';
        }
      });
    });
  </script>
</body>
</html>
