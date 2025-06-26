<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Google OAuth - ezEdit</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!-- Supabase Client Library -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
  <style>
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      margin-bottom: 2rem;
    }
    .btn-container {
      display: flex;
      gap: 1rem;
      margin: 1rem 0;
    }
    .result {
      background: #f3f4f6;
      border-radius: 4px;
      padding: 1rem;
      margin-top: 1rem;
      white-space: pre-wrap;
      font-family: monospace;
      max-height: 300px;
      overflow: auto;
    }
    .status {
      padding: 0.5rem;
      border-radius: 4px;
      margin-top: 1rem;
    }
    .status.success {
      background: rgba(20, 184, 166, 0.1);
      color: #14b8a6;
    }
    .status.error {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
    .logo {
      display: flex;
      align-items: center;
      font-weight: 700;
      font-size: 1.5rem;
      margin-bottom: 2rem;
    }
    .logo-icon {
      color: #2563EB;
      margin-right: 0.25rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <span class="logo-icon">Ez</span><span>Edit.co</span>
    </div>
    
    <div class="card">
      <h1>Google OAuth Integration Test</h1>
      <p>This page tests the Google OAuth integration with Supabase for ezEdit.</p>
      
      <div class="btn-container">
        <button id="google-login" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>
        <button id="check-session" class="btn btn-secondary">Check Session</button>
        <button id="logout" class="btn btn-outline">Logout</button>
      </div>
      
      <div id="status" class="status" style="display: none;"></div>
      
      <h2>Session Information</h2>
      <div id="session-result" class="result">No session information available</div>
      
      <h2>User Profile</h2>
      <div id="profile-result" class="result">No profile information available</div>
    </div>
  </div>

  <!-- Core Scripts -->
  <script src="js/config.js"></script>
  <script src="js/memory-service.js"></script>
  <script src="js/supabase-service.js"></script>
  <script>
    // Initialize services
    window.ezEdit = window.ezEdit || {};
    window.ezEdit.memory = window.ezEdit.memory || new MemoryService();
    window.ezEdit.supabase = window.ezEdit.supabase || new SupabaseService(window.ezEdit.memory);
    
    // DOM Elements
    const googleLoginBtn = document.getElementById('google-login');
    const checkSessionBtn = document.getElementById('check-session');
    const logoutBtn = document.getElementById('logout');
    const statusEl = document.getElementById('status');
    const sessionResultEl = document.getElementById('session-result');
    const profileResultEl = document.getElementById('profile-result');
    
    // Helper functions
    function showStatus(message, type) {
      statusEl.textContent = message;
      statusEl.className = `status ${type}`;
      statusEl.style.display = 'block';
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        statusEl.style.display = 'none';
      }, 5000);
    }
    
    function displayJson(element, data) {
      element.textContent = JSON.stringify(data, null, 2);
    }
    
    // Event listeners
    googleLoginBtn.addEventListener('click', async () => {
      try {
        googleLoginBtn.disabled = true;
        googleLoginBtn.innerHTML = '<span class="loading-spinner"></span> Connecting...';
        
        await window.ezEdit.supabase.signInWithProvider('google', {
          redirectTo: window.location.origin + '/auth-callback.html',
          scopes: 'email profile'
        });
        
        // The page will be redirected by Supabase
      } catch (error) {
        console.error('Google login error:', error);
        showStatus(`Error: ${error.message}`, 'error');
        googleLoginBtn.disabled = false;
        googleLoginBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Sign in with Google';
      }
    });
    
    checkSessionBtn.addEventListener('click', async () => {
      try {
        checkSessionBtn.disabled = true;
        
        // Get current session
        const { data: { session }, error } = await window.ezEdit.supabase.client.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          showStatus('Active session found', 'success');
          displayJson(sessionResultEl, {
            user: {
              id: session.user.id,
              email: session.user.email,
              user_metadata: session.user.user_metadata
            },
            expires_at: new Date(session.expires_at * 1000).toLocaleString(),
            provider: session.user.app_metadata?.provider || 'email'
          });
          
          // Get user profile
          const { data: profile, error: profileError } = await window.ezEdit.supabase.client
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) {
            displayJson(profileResultEl, { error: profileError.message });
          } else {
            displayJson(profileResultEl, profile);
          }
        } else {
          showStatus('No active session', 'error');
          sessionResultEl.textContent = 'No session information available';
          profileResultEl.textContent = 'No profile information available';
        }
      } catch (error) {
        console.error('Check session error:', error);
        showStatus(`Error: ${error.message}`, 'error');
      } finally {
        checkSessionBtn.disabled = false;
      }
    });
    
    logoutBtn.addEventListener('click', async () => {
      try {
        logoutBtn.disabled = true;
        logoutBtn.textContent = 'Logging out...';
        
        const { error } = await window.ezEdit.supabase.client.auth.signOut();
        
        if (error) throw error;
        
        showStatus('Logged out successfully', 'success');
        sessionResultEl.textContent = 'No session information available';
        profileResultEl.textContent = 'No profile information available';
      } catch (error) {
        console.error('Logout error:', error);
        showStatus(`Error: ${error.message}`, 'error');
      } finally {
        logoutBtn.disabled = false;
        logoutBtn.textContent = 'Logout';
      }
    });
    
    // Check session on page load
    document.addEventListener('DOMContentLoaded', async () => {
      try {
        const { data: { session }, error } = await window.ezEdit.supabase.client.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          showStatus('Active session found', 'success');
          displayJson(sessionResultEl, {
            user: {
              id: session.user.id,
              email: session.user.email,
              user_metadata: session.user.user_metadata
            },
            expires_at: new Date(session.expires_at * 1000).toLocaleString(),
            provider: session.user.app_metadata?.provider || 'email'
          });
          
          // Get user profile
          const { data: profile, error: profileError } = await window.ezEdit.supabase.client
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) {
            displayJson(profileResultEl, { error: profileError.message });
          } else {
            displayJson(profileResultEl, profile);
          }
        }
      } catch (error) {
        console.error('Initial session check error:', error);
      }
    });
  </script>
</body>
</html>
