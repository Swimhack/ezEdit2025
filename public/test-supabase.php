<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authentication Test - EzEdit</title>
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
    .test-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      background-color: #f9fafb;
    }
    .test-section h2 {
      margin-top: 0;
      margin-bottom: 1rem;
      color: #2563eb;
    }
    .result-box {
      margin-top: 1rem;
      padding: 1rem;
      background-color: #f3f4f6;
      border-radius: 0.375rem;
      font-family: monospace;
      white-space: pre-wrap;
      max-height: 200px;
      overflow-y: auto;
    }
    .success {
      color: #059669;
    }
    .error {
      color: #dc2626;
    }
    .btn-group {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="container">
      <div class="flex justify-between items-center">
        <h1 class="logo">
          <a href="dashboard.php">
            <span class="logo-icon">Ez</span> <span class="logo-text">Edit.co</span>
          </a>
        </h1>
        <nav class="nav-main">
          <a href="dashboard.php">Dashboard</a>
          <a href="editor.php">Editor</a>
          <a href="settings.php">Settings</a>
          <a href="test-supabase.html" class="active">Test Authentication</a>
        </nav>
      </div>
    </div>
  </header>

  <main>
    <div class="container">
      <h1>Authentication Integration Test</h1>
      <p>This page tests the hybrid authentication system (Supabase + PHP) for authentication and database operations.</p>
      
      <div class="test-section">
        <h2>1. Configuration Test</h2>
        <p>Checks if authentication services are properly configured.</p>
        <button id="test-config" class="btn btn-primary">Test Configuration</button>
        <div id="config-result" class="result-box">Results will appear here...</div>
      </div>
      
      <div class="test-section">
        <h2>2. Authentication Test</h2>
        <p>Tests authentication functionality.</p>
        <div class="btn-group">
          <button id="test-signup" class="btn btn-outline">Test Sign Up</button>
          <button id="test-signin" class="btn btn-outline">Test Sign In</button>
          <button id="test-signout" class="btn btn-outline">Test Sign Out</button>
          <button id="test-session" class="btn btn-primary">Check Session</button>
        </div>
        <div id="auth-result" class="result-box">Results will appear here...</div>
      </div>
      
      <div class="test-section">
        <h2>3. Database Test</h2>
        <p>Tests database operations for sites table.</p>
        <div class="btn-group">
          <button id="test-get-sites" class="btn btn-outline">Get Sites</button>
          <button id="test-add-site" class="btn btn-outline">Add Test Site</button>
          <button id="test-update-site" class="btn btn-outline">Update Site</button>
          <button id="test-delete-site" class="btn btn-outline">Delete Site</button>
        </div>
        <div id="db-result" class="result-box">Results will appear here...</div>
      </div>
      
      <div class="test-section">
        <h2>4. User Profile Test</h2>
        <p>Tests user profile operations.</p>
        <div class="btn-group">
          <button id="test-get-profile" class="btn btn-outline">Get Profile</button>
          <button id="test-update-profile" class="btn btn-outline">Update Profile</button>
        </div>
        <div id="profile-result" class="result-box">Results will appear here...</div>
      </div>
    </div>
  </main>

  <footer class="footer">
    <div class="container">
      <p>&copy; 2025 EzEdit • <a href="dashboard.html">Back to Dashboard</a></p>
    </div>
  </footer>

  <!-- Core Scripts -->
  <script src="js/config.js"></script>
  <script src="js/memory-service.js"></script>
  <script src="js/supabase-service.js"></script>
  <script src="js/php-auth-service.js"></script>
  <script src="js/auth-service.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', async () => {
      // Initialize services
      const memoryService = new MemoryService();
      const supabaseService = new SupabaseService(memoryService);
      const phpAuthService = new PhpAuthService();
      const authService = new AuthService();
      
      try {
        // Initialize auth services
        await Promise.all([
          supabaseService.init(),
          authService.init()
        ]);
        console.log('Authentication services initialized successfully');
      } catch (err) {
        console.error('Failed to initialize authentication services:', err);
      }
      
      // Test data
      let testSiteId = null;
      
      // Helper function to display results
      function displayResult(elementId, result, isError = false) {
        const element = document.getElementById(elementId);
        if (isError) {
          element.innerHTML = `<span class="error">ERROR: ${result}</span>`;
        } else {
          element.innerHTML = `<span class="success">SUCCESS:</span>\n${JSON.stringify(result, null, 2)}`;
        }
      }
      
      // 1. Configuration Test
      document.getElementById('test-config').addEventListener('click', () => {
        try {
          const configResult = {
            supabase: {
              url: supabaseService.config.url || 'Not configured',
              anonKey: supabaseService.config.anonKey ? 'Configured (hidden)' : 'Not configured',
              clientInitialized: !!supabaseService.client
            },
            phpAuth: {
              initialized: !!phpAuthService.initialized,
              endpointUrl: phpAuthService.apiUrl || 'Not configured'
            },
            authService: {
              initialized: !!authService.initialized,
              preferredMethod: authService.preferredMethod || 'Not configured'
            }
          };
          
          displayResult('config-result', configResult);
        } catch (error) {
          displayResult('config-result', error.message, true);
        }
      });
      
      // 2. Authentication Tests
      document.getElementById('test-signup').addEventListener('click', async () => {
        try {
          const testEmail = `test-${Date.now()}@example.com`;
          const testPassword = 'Password123!';
          
          const result = await authService.signUp({
            email: testEmail,
            password: testPassword,
            metadata: {
              firstName: 'Test',
              lastName: 'User'
            }
          });
          
          displayResult('auth-result', {
            action: 'Sign Up',
            email: testEmail,
            userId: result.user?.id || 'Not available',
            method: result.method || 'Not available',
            message: 'User created successfully'
          });
        } catch (error) {
          displayResult('auth-result', error.message, true);
        }
      });
      
      document.getElementById('test-signin').addEventListener('click', async () => {
        try {
          // Use demo credentials for testing
          const result = await authService.signIn('demo@ezedit.co', 'Password123!');
          
          displayResult('auth-result', {
            action: 'Sign In',
            email: result.user?.email || 'demo@ezedit.co',
            userId: result.user?.id || 'Not available',
            method: result.method || 'Not available',
            message: 'User signed in successfully'
          });
        } catch (error) {
          displayResult('auth-result', error.message, true);
        }
      });
      
      document.getElementById('test-signout').addEventListener('click', async () => {
        try {
          await authService.signOut();
          
          displayResult('auth-result', {
            action: 'Sign Out',
            message: 'User signed out successfully'
          });
        } catch (error) {
          displayResult('auth-result', error.message, true);
        }
      });
      
      document.getElementById('test-session').addEventListener('click', async () => {
        try {
          const isAuthenticated = authService.isAuthenticated();
          const user = authService.getUser();
          const session = authService.getSession();
          const authMethod = authService.getCurrentAuthMethod();
          
          if (isAuthenticated) {
            displayResult('auth-result', {
              action: 'Check Session',
              authenticated: true,
              userId: user?.id || 'Not available',
              email: user?.email || 'Not available',
              authMethod: authMethod || 'Not available',
              expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'Not available'
            });
          } else {
            displayResult('auth-result', {
              action: 'Check Session',
              authenticated: false,
              message: 'No active session'
            });
          }
        } catch (error) {
          displayResult('auth-result', error.message, true);
        }
      });
      
      // 3. Database Tests
      document.getElementById('test-get-sites').addEventListener('click', async () => {
        try {
          const sites = await supabaseService.getSites();
          
          displayResult('db-result', {
            action: 'Get Sites',
            count: sites.length,
            sites: sites.map(site => ({
              id: site.id,
              name: site.name,
              host: site.host
            }))
          });
        } catch (error) {
          displayResult('db-result', error.message, true);
        }
      });
      
      document.getElementById('test-add-site').addEventListener('click', async () => {
        try {
          const testSite = {
            name: `Test Site ${Date.now()}`,
            host: 'ftp.test.rebex.net',
            port: 21,
            username: 'demo',
            password: 'password',
            passive: true,
            root_path: '/'
          };
          
          const result = await supabaseService.addSite(testSite);
          testSiteId = result.id;
          
          displayResult('db-result', {
            action: 'Add Site',
            siteId: result.id,
            name: result.name,
            message: 'Site added successfully'
          });
        } catch (error) {
          displayResult('db-result', error.message, true);
        }
      });
      
      document.getElementById('test-update-site').addEventListener('click', async () => {
        try {
          if (!testSiteId) {
            throw new Error('No test site ID available. Please add a test site first.');
          }
          
          const updateData = {
            name: `Updated Site ${Date.now()}`
          };
          
          const result = await supabaseService.updateSite(testSiteId, updateData);
          
          displayResult('db-result', {
            action: 'Update Site',
            siteId: result.id,
            name: result.name,
            message: 'Site updated successfully'
          });
        } catch (error) {
          displayResult('db-result', error.message, true);
        }
      });
      
      document.getElementById('test-delete-site').addEventListener('click', async () => {
        try {
          if (!testSiteId) {
            throw new Error('No test site ID available. Please add a test site first.');
          }
          
          const result = await supabaseService.deleteSite(testSiteId);
          
          displayResult('db-result', {
            action: 'Delete Site',
            siteId: testSiteId,
            success: result,
            message: 'Site deleted successfully'
          });
          
          // Clear the test site ID
          testSiteId = null;
        } catch (error) {
          displayResult('db-result', error.message, true);
        }
      });
      
      // 4. User Profile Tests
      document.getElementById('test-get-profile').addEventListener('click', async () => {
        try {
          const user = authService.getUser();
          
          if (!user) {
            throw new Error('No authenticated user. Please sign in first.');
          }
          
          const { data: profile, error } = await supabaseService.client
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (error) throw error;
          
          displayResult('profile-result', {
            action: 'Get Profile',
            userId: profile.id,
            firstName: profile.first_name,
            lastName: profile.last_name,
            plan: profile.plan,
            trialDaysLeft: profile.trial_days_left
          });
        } catch (error) {
          displayResult('profile-result', error.message, true);
        }
      });
      
      document.getElementById('test-update-profile').addEventListener('click', async () => {
        try {
          const user = authService.getUser();
          
          if (!user) {
            throw new Error('No authenticated user. Please sign in first.');
          }
          
          const updateData = {
            first_name: 'Updated',
            last_name: 'User'
          };
          
          const result = await supabaseService.updateProfile(updateData);
          
          displayResult('profile-result', {
            action: 'Update Profile',
            userId: result.id,
            firstName: result.first_name,
            lastName: result.last_name,
            message: 'Profile updated successfully'
          });
        } catch (error) {
          displayResult('profile-result', error.message, true);
        }
      });
    });
  </script>
</body>
</html>
