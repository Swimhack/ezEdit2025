<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authentication Test - ezEdit</title>
  <link rel="stylesheet" href="css/design-tokens.css">
  <link rel="stylesheet" href="css/ui-components.css">
  <link rel="stylesheet" href="css/toast.css">
  <link rel="stylesheet" href="css/dark-mode.css">
  <link rel="stylesheet" href="css/styles.css">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
</head>
<body style="padding: 2rem;">
  <div class="container">
    <h1>Authentication Test</h1>
    <p>This page tests the authentication functionality with the provided credentials.</p>
    
    <div class="card" style="padding: 1.5rem; margin-bottom: 2rem;">
      <h2>Test Login</h2>
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" class="form-input" value="james@ekaty.com">
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" class="form-input" value="jasper">
      </div>
      <button id="login-btn" class="btn btn-primary">Test Login</button>
    </div>
    
    <div class="card" style="padding: 1.5rem; margin-bottom: 2rem;">
      <h2>Test Password Reset</h2>
      <div class="form-group">
        <label for="reset-email">Email</label>
        <input type="email" id="reset-email" class="form-input" value="james@ekaty.com">
      </div>
      <button id="reset-btn" class="btn btn-primary">Test Password Reset</button>
    </div>
    
    <div class="card" style="padding: 1.5rem;">
      <h2>Test Social Login</h2>
      <button id="google-btn" class="btn btn-social btn-google">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        Google
      </button>
    </div>
    
    <div id="result" class="card" style="padding: 1.5rem; margin-top: 2rem; display: none;">
      <h2>Test Results</h2>
      <pre id="result-content" style="background: #f5f5f5; padding: 1rem; overflow: auto; max-height: 300px;"></pre>
    </div>
  </div>

  <script src="js/config.js"></script>
  <script src="js/memory-service.js"></script>
  <script src="js/supabase-service.js"></script>
  
  <script>
    document.addEventListener('DOMContentLoaded', async () => {
      // Initialize services
      window.ezEdit = window.ezEdit || {};
      window.ezEdit.memory = window.ezEdit.memory || new MemoryService();
      window.ezEdit.supabase = window.ezEdit.supabase || new SupabaseService();
      
      // Initialize Supabase service
      try {
        await window.ezEdit.supabase.init();
        console.log('Supabase initialized successfully');
        showResult('Supabase client initialized successfully', 'success');
      } catch (err) {
        console.error('Failed to initialize Supabase:', err);
        showResult('Failed to initialize Supabase: ' + err.message, 'error');
      }
      
      // Login test
      document.getElementById('login-btn').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
          const { data, error } = await window.ezEdit.supabase.client.auth.signInWithPassword({
            email,
            password
          });
          
          if (error) throw error;
          
          showResult('Login successful! User: ' + JSON.stringify(data, null, 2), 'success');
          
          // Sign out after successful login
          await window.ezEdit.supabase.client.auth.signOut();
          console.log('Signed out successfully');
        } catch (err) {
          showResult('Login failed: ' + err.message, 'error');
        }
      });
      
      // Password reset test
      document.getElementById('reset-btn').addEventListener('click', async () => {
        const email = document.getElementById('reset-email').value;
        
        try {
          const { error } = await window.ezEdit.supabase.client.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password-confirm.html'
          });
          
          if (error) throw error;
          
          showResult('Password reset email sent to ' + email, 'success');
        } catch (err) {
          showResult('Password reset failed: ' + err.message, 'error');
        }
      });
      
      // Social login test
      document.getElementById('google-btn').addEventListener('click', async () => {
        try {
          const { error } = await window.ezEdit.supabase.client.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: window.location.origin + '/auth-callback.html'
            }
          });
          
          if (error) throw error;
          
          showResult('Redirecting to Google login...', 'info');
        } catch (err) {
          showResult('Google login failed: ' + err.message, 'error');
        }
      });
      
      function showResult(message, type = 'info') {
        const resultDiv = document.getElementById('result');
        const resultContent = document.getElementById('result-content');
        
        resultDiv.style.display = 'block';
        resultContent.textContent = message;
        
        // Add styling based on result type
        resultContent.className = '';
        resultContent.classList.add('result-' + type);
        
        if (type === 'error') {
          resultContent.style.color = '#dc3545';
        } else if (type === 'success') {
          resultContent.style.color = '#28a745';
        } else {
          resultContent.style.color = '#0d6efd';
        }
      }
    });
  </script>
</body>
</html>
