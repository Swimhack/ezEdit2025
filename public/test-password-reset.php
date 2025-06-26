<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Test - ezEdit</title>
  <link rel="stylesheet" href="css/design-tokens.css">
  <link rel="stylesheet" href="css/ui-components.css">
  <link rel="stylesheet" href="css/toast.css">
  <link rel="stylesheet" href="css/dark-mode.css">
  <link rel="stylesheet" href="css/styles.css">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
</head>
<body style="padding: 2rem;">
  <div class="container">
    <h1>Password Reset Flow Test</h1>
    <p>This page tests the complete password reset functionality with Supabase.</p>
    
    <div class="card" style="padding: 1.5rem; margin-bottom: 2rem;">
      <h2>Step 1: Request Password Reset</h2>
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" class="form-input" value="james@ekaty.com">
      </div>
      <button id="request-btn" class="btn btn-primary">Send Reset Link</button>
      <div id="request-result" class="mt-3" style="display: none;"></div>
    </div>
    
    <div class="card" style="padding: 1.5rem; margin-bottom: 2rem;">
      <h2>Step 2: Verify Reset Link</h2>
      <p>Check your email for the reset link. The link should redirect you to:</p>
      <code>reset-password-confirm.html</code>
      <div class="mt-3">
        <button id="verify-btn" class="btn btn-primary">Manually Test Reset Page</button>
      </div>
    </div>
    
    <div class="card" style="padding: 1.5rem;">
      <h2>Step 3: Test Authentication After Reset</h2>
      <p>After resetting your password, test logging in with the new password:</p>
      <div class="form-group">
        <label for="test-email">Email</label>
        <input type="email" id="test-email" class="form-input" value="james@ekaty.com">
      </div>
      <div class="form-group">
        <label for="test-password">New Password</label>
        <input type="password" id="test-password" class="form-input" placeholder="Your new password">
      </div>
      <button id="login-btn" class="btn btn-primary">Test Login</button>
      <div id="login-result" class="mt-3" style="display: none;"></div>
    </div>
    
    <div id="debug-info" class="card" style="padding: 1.5rem; margin-top: 2rem; display: none;">
      <h2>Debug Information</h2>
      <pre id="debug-content" style="background: #f5f5f5; padding: 1rem; overflow: auto; max-height: 300px;"></pre>
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
      
      // Ensure EzEditConfig is loaded with Supabase credentials
      if (!window.EzEditConfig || !window.EzEditConfig.apiKeys || !window.EzEditConfig.apiKeys.supabase) {
        showDebug('EzEditConfig is not properly loaded with Supabase credentials', 'error');
        return;
      }
      
      // Log Supabase configuration (without showing the full key)
      const supabaseConfig = window.EzEditConfig.apiKeys.supabase;
      showDebug(`Using Supabase URL: ${supabaseConfig.url}`);
      showDebug(`Using Supabase key: ${supabaseConfig.anonKey.substring(0, 10)}...`);
      
      // Initialize Supabase service
      window.ezEdit.supabase = window.ezEdit.supabase || new SupabaseService();
      
      try {
        await window.ezEdit.supabase.init();
        showDebug('Supabase client initialized successfully');
      } catch (err) {
        console.error('Failed to initialize Supabase:', err);
        showDebug('Failed to initialize Supabase: ' + err.message, 'error');
      }
      
      // Request password reset
      document.getElementById('request-btn').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const requestResult = document.getElementById('request-result');
        const requestBtn = document.getElementById('request-btn');
        
        if (!email) {
          showResult(requestResult, 'Please enter an email address', 'error');
          return;
        }
        
        // Show loading state
        requestBtn.disabled = true;
        requestBtn.textContent = 'Sending...';
        
        try {
          const { error } = await window.ezEdit.supabase.client.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password-confirm.html'
          });
          
          if (error) throw error;
          
          showResult(requestResult, `Reset link sent to ${email}. Check your inbox.`, 'success');
          showDebug(`Password reset email requested for ${email}`);
        } catch (err) {
          showResult(requestResult, 'Error: ' + err.message, 'error');
          showDebug('Password reset request failed: ' + err.message, 'error');
        } finally {
          requestBtn.disabled = false;
          requestBtn.textContent = 'Send Reset Link';
        }
      });
      
      // Verify reset link
      document.getElementById('verify-btn').addEventListener('click', () => {
        window.open('reset-password-confirm.html', '_blank');
      });
      
      // Test login with new password
      document.getElementById('login-btn').addEventListener('click', async () => {
        const email = document.getElementById('test-email').value;
        const password = document.getElementById('test-password').value;
        const loginResult = document.getElementById('login-result');
        const loginBtn = document.getElementById('login-btn');
        
        if (!email || !password) {
          showResult(loginResult, 'Please enter both email and password', 'error');
          return;
        }
        
        // Show loading state
        loginBtn.disabled = true;
        loginBtn.textContent = 'Testing...';
        
        try {
          const { data, error } = await window.ezEdit.supabase.client.auth.signInWithPassword({
            email,
            password
          });
          
          if (error) throw error;
          
          showResult(loginResult, 'Login successful! Password reset worked correctly.', 'success');
          showDebug('Login successful with new password. User data: ' + JSON.stringify(data.user, null, 2));
          
          // Sign out after successful test
          await window.ezEdit.supabase.client.auth.signOut();
        } catch (err) {
          showResult(loginResult, 'Login failed: ' + err.message, 'error');
          showDebug('Login test failed: ' + err.message, 'error');
        } finally {
          loginBtn.disabled = false;
          loginBtn.textContent = 'Test Login';
        }
      });
      
      function showResult(element, message, type = 'info') {
        element.style.display = 'block';
        element.textContent = message;
        
        // Reset classes
        element.className = 'mt-3';
        
        // Add styling based on result type
        if (type === 'error') {
          element.classList.add('text-danger');
        } else if (type === 'success') {
          element.classList.add('text-success');
        } else {
          element.classList.add('text-info');
        }
      }
      
      function showDebug(message, type = 'info') {
        const debugInfo = document.getElementById('debug-info');
        const debugContent = document.getElementById('debug-content');
        
        debugInfo.style.display = 'block';
        
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        if (type === 'error') {
          logEntry.style.color = '#dc3545';
        } else if (type === 'success') {
          logEntry.style.color = '#28a745';
        }
        
        debugContent.appendChild(logEntry);
      }
    });
  </script>
</body>
</html>
