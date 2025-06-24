<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EzEdit - Test Auth & FTP</title>
  <!-- Design tokens and core styles -->
  <link rel="stylesheet" href="css/design-tokens.css">
  <link rel="stylesheet" href="css/ui-components.css">
  <link rel="stylesheet" href="css/toast.css">
  <link rel="stylesheet" href="css/dark-mode.css">
  <link rel="stylesheet" href="css/styles.css">
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="icon" type="image/svg+xml" href="img/logo.svg">
  <!-- Supabase Client Library -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>EzEdit Authentication and FTP Test</h1>
      <p>This page tests the authentication and FTP functionality of EzEdit.</p>
      
      <div class="test-instructions">
        <h2>Testing Instructions</h2>
        <ol>
          <li><strong>Step 1:</strong> Click "Initialize Supabase" to set up the authentication client</li>
          <li><strong>Step 2:</strong> Test login with your Supabase credentials</li>
          <li><strong>Step 3:</strong> Test FTP connection to demo server: <code>ftp.test.rebex.net</code> with username: <code>demo</code> and password: <code>password</code></li>
          <li><strong>Step 4:</strong> Try listing directories and downloading files</li>
        </ol>
        <p><em>Note: This test page requires a running PHP server to handle FTP operations and a valid Supabase project for authentication.</em></p>
      </div>
    </header>

    <div class="card">
      <h2>Authentication Test</h2>
      <div class="test-section">
        <h3>1. Initialize Supabase</h3>
        <button id="init-supabase" class="btn btn-primary">Initialize</button>
        <div id="init-result" class="result-box"></div>
      </div>

      <div class="test-section">
        <h3>2. Test Login</h3>
        <form id="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" class="form-input" value="test@example.com">
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" class="form-input" value="password123">
          </div>
          <button type="submit" class="btn btn-primary">Login</button>
        </form>
        <div id="login-result" class="result-box"></div>
      </div>

      <div class="test-section">
        <h3>3. Test Social Login</h3>
        <button id="google-login" class="btn btn-social btn-google">Login with Google</button>
        <button id="github-login" class="btn btn-social btn-github">Login with GitHub</button>
        <div id="social-result" class="result-box"></div>
      </div>
    </div>

    <div class="card">
      <h2>FTP Test</h2>
      <div class="test-section">
        <h3>1. Initialize FTP Service</h3>
        <button id="init-ftp" class="btn btn-primary">Initialize</button>
        <div id="ftp-init-result" class="result-box"></div>
      </div>

      <div class="test-section">
        <h3>2. Connect to Demo FTP</h3>
        <button id="connect-ftp" class="btn btn-primary">Connect</button>
        <div id="connect-result" class="result-box"></div>
      </div>

      <div class="test-section">
        <h3>3. List Directory</h3>
        <div class="form-group">
          <label for="list-path">Path</label>
          <input type="text" id="list-path" class="form-input" value="/">
        </div>
        <button id="list-dir" class="btn btn-primary">List Directory</button>
        <div id="list-result" class="result-box"></div>
      </div>

      <div class="test-section">
        <h3>4. Get File</h3>
        <div class="form-group">
          <label for="file-path">File Path</label>
          <input type="text" id="file-path" class="form-input" value="/readme.txt">
        </div>
        <button id="get-file" class="btn btn-primary">Get File</button>
        <div id="file-result" class="result-box"></div>
      </div>

      <div class="test-section">
        <h3>5. Disconnect</h3>
        <button id="disconnect-ftp" class="btn btn-primary">Disconnect</button>
        <div id="disconnect-result" class="result-box"></div>
      </div>
    </div>
  </div>

  <style>
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Inter', sans-serif;
      color: var(--text);
    }
    
    .header {
      margin-bottom: 30px;
      text-align: center;
    }
    
    .header h1 {
      color: var(--primary);
      font-size: 2.2rem;
      margin-bottom: 0.5rem;
    }
    
    .test-instructions {
      background-color: rgba(37, 99, 235, 0.1);
      border-left: 4px solid var(--primary);
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 4px 4px 0;
    }
    
    .test-instructions h2 {
      margin-top: 0;
      font-size: 1.2rem;
      color: var(--primary);
    }
    
    .test-instructions code {
      background: rgba(0,0,0,0.05);
      padding: 2px 4px;
      border-radius: 3px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9em;
    }
    
    .card {
      background: var(--surface);
      border-radius: 8px;
      padding: 25px;
      margin-bottom: 25px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }
    
    .card:hover {
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08), 0 3px 6px rgba(0, 0, 0, 0.12);
    }
    
    .card h2 {
      color: var(--primary);
      font-size: 1.5rem;
      margin-top: 0;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border);
    }
    
    .test-section {
      margin-bottom: 25px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
    }
    
    .test-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
    
    .test-section h3 {
      font-size: 1.1rem;
      margin-bottom: 15px;
      color: var(--text);
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      font-size: 0.9rem;
    }
    
    .form-input {
      width: 100%;
      padding: 10px;
      border: 1px solid var(--border);
      border-radius: 4px;
      font-family: 'Inter', sans-serif;
      font-size: 0.95rem;
      transition: border-color 0.2s ease;
    }
    
    .form-input:focus {
      border-color: var(--primary);
      outline: none;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
    }
    
    .btn {
      padding: 10px 16px;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: 'Inter', sans-serif;
    }
    
    .btn-primary {
      background-color: var(--primary);
      color: white;
    }
    
    .btn-primary:hover {
      background-color: #1e40af; /* Darker blue */
    }
    
    .btn-secondary {
      background-color: #6b7280;
      color: white;
    }
    
    .btn-secondary:hover {
      background-color: #4b5563;
    }
    
    .btn-social {
      display: inline-flex;
      align-items: center;
      padding: 10px 16px;
      margin-right: 10px;
      margin-bottom: 10px;
    }
    
    .btn-google {
      background-color: #DB4437;
      color: white;
    }
    
    .btn-github {
      background-color: #24292e;
      color: white;
    }
    
    .btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    .result-box {
      margin-top: 15px;
      padding: 15px;
      background: var(--background);
      border-radius: 6px;
      min-height: 40px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      white-space: pre-wrap;
      overflow-wrap: break-word;
    }
    
    .status {
      padding: 10px 15px;
      border-radius: 4px;
      margin-top: 10px;
    }
    
    .status-success {
      background-color: rgba(20, 184, 166, 0.1);
      border-left: 4px solid var(--accent);
      color: #065f46;
    }
    
    .status-error {
      background-color: rgba(239, 68, 68, 0.1);
      border-left: 4px solid #ef4444;
      color: #b91c1c;
    }
    
    .status-info {
      background-color: rgba(59, 130, 246, 0.1);
      border-left: 4px solid #3b82f6;
      color: #1e40af;
    }
    
    .spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s linear infinite;
      margin-right: 8px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .file-list {
      list-style: none;
      padding: 0;
      margin: 15px 0 0 0;
    }
    
    .file-list li {
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 4px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    
    .file-list li:hover {
      background-color: rgba(37, 99, 235, 0.1);
    }
    
    .file-list .directory {
      color: var(--primary);
      font-weight: 500;
    }
    
    .file-list .directory:before {
      content: '📁 ';
    }
    
    .file-list .file:before {
      content: '📄 ';
    }
    
    .file-preview {
      margin-top: 15px;
    }
    
    .content-preview {
      background-color: rgba(0,0,0,0.03);
      padding: 15px;
      border-radius: 4px;
      max-height: 300px;
      overflow-y: auto;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      line-height: 1.5;
      margin-bottom: 15px;
    }
    
    .tips-list {
      margin-top: 10px;
      padding-left: 20px;
      font-size: 0.9rem;
    }
    
    .tips-list li {
      margin-bottom: 5px;
    }
    
    .hidden {
      display: none;
    }
  </style>

  <!-- Core Scripts -->
  <script src="js/config.js"></script>
  <!-- Supabase JS library -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/dist/umd/supabase.min.js"></script>
  <script src="js/memory-service.js"></script>
  <script src="js/supabase-service.js"></script>
  <script src="js/ftp-service.js"></script>
  <script src="js/ui-components.js"></script>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // Helper function to display results
      function displayResult(elementId, result, success = true) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // Clear previous content
        element.innerHTML = '';
        
        // Handle string results
        if (typeof result === 'string') {
          element.textContent = result;
          element.className = success ? 'status status-info' : 'status status-error';
          return;
        }
        
        // Handle error results
        if (result.error) {
          const errorDiv = document.createElement('div');
          errorDiv.className = 'status status-error';
          
          const errorTitle = document.createElement('strong');
          errorTitle.textContent = 'Error: ';
          errorDiv.appendChild(errorTitle);
          errorDiv.appendChild(document.createTextNode(result.error));
          
          if (result.details) {
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'error-details';
            detailsDiv.textContent = result.details;
            errorDiv.appendChild(detailsDiv);
          }
          
          if (result.suggestion) {
            const suggestionDiv = document.createElement('div');
            suggestionDiv.className = 'suggestion';
            suggestionDiv.textContent = `Suggestion: ${result.suggestion}`;
            errorDiv.appendChild(suggestionDiv);
          }
          
          element.appendChild(errorDiv);
          return;
        }
        
        // Handle success results
        if (result.success) {
          const successDiv = document.createElement('div');
          successDiv.className = 'status status-success';
          
          if (result.user) {
            const userInfo = typeof result.user === 'string' ? result.user : 
              `User: ${result.user.email || 'Unknown'} (ID: ${result.user.id || 'Unknown'})`;
            
            const userDiv = document.createElement('div');
            userDiv.innerHTML = `<strong>✓ Authentication successful</strong><br>${userInfo}`;
            successDiv.appendChild(userDiv);
            
            if (result.message) {
              const messageDiv = document.createElement('div');
              messageDiv.textContent = result.message;
              successDiv.appendChild(messageDiv);
            }
          } else {
            successDiv.textContent = result.message || 'Operation successful';
          }
          
          element.appendChild(successDiv);
          return;
        }
        
        // Handle initialization results
        if (result.initialized) {
          const initDiv = document.createElement('div');
          initDiv.className = 'status status-success';
          initDiv.innerHTML = `<strong>✓ Initialization successful</strong>`;
          
          if (result.config) {
            const configDiv = document.createElement('div');
            configDiv.className = 'config-info';
            
            const configList = document.createElement('ul');
            for (const [key, value] of Object.entries(result.config)) {
              const item = document.createElement('li');
              item.textContent = `${key}: ${value}`;
              configList.appendChild(item);
            }
            
            configDiv.appendChild(configList);
            initDiv.appendChild(configDiv);
          }
          
          if (result.status) {
            const statusDiv = document.createElement('div');
            statusDiv.textContent = `Status: ${result.status}`;
            initDiv.appendChild(statusDiv);
          }
          
          if (result.session) {
            const sessionDiv = document.createElement('div');
            sessionDiv.textContent = result.session;
            initDiv.appendChild(sessionDiv);
          }
          
          element.appendChild(initDiv);
          return;
        }
        
        // Handle file listing results
        if (result.files || result.path) {
          const listingDiv = document.createElement('div');
          listingDiv.className = 'status status-success';
          
          const pathDiv = document.createElement('div');
          pathDiv.innerHTML = `<strong>Directory:</strong> ${result.path || '/'}`;
          listingDiv.appendChild(pathDiv);
          
          if (result.count !== undefined) {
            const countDiv = document.createElement('div');
            countDiv.textContent = `${result.count} items found`;
            listingDiv.appendChild(countDiv);
          }
          
          element.appendChild(listingDiv);
          return;
        }
        
        // Handle file content results
        if (result.fileName) {
          const fileDiv = document.createElement('div');
          fileDiv.className = 'status status-success';
          
          const fileNameDiv = document.createElement('div');
          fileNameDiv.innerHTML = `<strong>File:</strong> ${result.fileName}`;
          fileDiv.appendChild(fileNameDiv);
          
          if (result.size !== undefined) {
            const sizeDiv = document.createElement('div');
            sizeDiv.textContent = `Size: ${result.size} bytes`;
            fileDiv.appendChild(sizeDiv);
          }
          
          element.appendChild(fileDiv);
          return;
        }
        
        // Handle connection results
        if (result.connected !== undefined) {
          const connectionDiv = document.createElement('div');
          connectionDiv.className = result.connected ? 'status status-success' : 'status status-error';
          
          const statusDiv = document.createElement('div');
          statusDiv.innerHTML = result.connected ? 
            '<strong>✓ Connected successfully</strong>' : 
            '<strong>✗ Connection failed</strong>';
          connectionDiv.appendChild(statusDiv);
          
          if (result.message) {
            const messageDiv = document.createElement('div');
            messageDiv.textContent = result.message;
            connectionDiv.appendChild(messageDiv);
          }
          
          element.appendChild(connectionDiv);
          return;
        }
        
        // Handle disconnection results
        if (result.disconnected !== undefined) {
          const disconnectDiv = document.createElement('div');
          disconnectDiv.className = 'status status-info';
          disconnectDiv.innerHTML = '<strong>Disconnected from FTP server</strong>';
          
          if (result.message) {
            const messageDiv = document.createElement('div');
            messageDiv.textContent = result.message;
            disconnectDiv.appendChild(messageDiv);
          }
          
          element.appendChild(disconnectDiv);
          return;
        }
        
        // Default: just stringify the object
        const defaultDiv = document.createElement('pre');
        defaultDiv.className = success ? 'status status-success' : 'status status-error';
        defaultDiv.textContent = JSON.stringify(result, null, 2);
        element.appendChild(defaultDiv);
      }

      // Initialize Supabase
      document.getElementById('init-supabase').addEventListener('click', async () => {
        try {
          // Initialize global objects
          window.ezEdit = window.ezEdit || {};
          window.ezEdit.memory = window.ezEdit.memory || new MemoryService();
          
          // Check if Supabase JS is loaded
          if (typeof supabase === 'undefined') {
            throw new Error('Supabase JS library not loaded. Check network connection.');
          }
          
          // Get Supabase config
          const supabaseConfig = window.ezEdit.memory.getApiKey('supabase');
          
          // Validate Supabase config
          if (!supabaseConfig || !supabaseConfig.url || !supabaseConfig.anonKey) {
            throw new Error('Invalid Supabase configuration. URL or anon key is missing.');
          }
          
          // Display config for debugging
          console.log('Initializing Supabase with:', {
            url: supabaseConfig.url,
            keyLength: supabaseConfig.anonKey.length
          });
          
          // Create a test client to verify connection
          const testClient = supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
          
          // Test the connection with a simple API call
          try {
            const { data, error } = await testClient.auth.getSession();
            if (error) {
              console.warn('Supabase connection warning:', error.message);
            } else {
              console.log('Supabase connection test successful');
            }
          } catch (apiError) {
            console.error('Supabase API test failed:', apiError);
            // Continue anyway, as this might be due to network issues
          }
          
          // Initialize the service
          window.ezEdit.supabase = new SupabaseService();
          
          // Display success
          displayResult('init-result', {
            initialized: true,
            url: supabaseConfig.url,
            keyLength: supabaseConfig.anonKey.length,
            clientCreated: !!window.ezEdit.supabase.client
          });
        } catch (error) {
          console.error('Supabase initialization error:', error);
          displayResult('init-result', { 
            error: error.message,
            suggestion: 'Try using a demo account or check Supabase configuration'
          }, false);
        }
      });

      // Handle login form submission
      document.getElementById('login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const resultElement = document.getElementById('login-result');
        const loginButton = document.querySelector('#login-form button[type="submit"]');
        
        // Validate inputs
        if (!email || !password) {
          resultElement.textContent = 'Please enter both email and password';
          resultElement.className = 'status status-error';
          return;
        }
        
        try {
          // Disable button and show loading state
          loginButton.disabled = true;
          loginButton.innerHTML = '<span class="spinner"></span> Logging in...';
          resultElement.textContent = 'Authenticating...';
          resultElement.className = 'status status-info';
          
          // Check if Supabase is initialized
          if (!window.ezEdit || !window.ezEdit.supabase) {
            throw new Error('Supabase client not initialized. Click "Initialize Supabase" first.');
          }
          
          // Use the signInWithPassword method
          const result = await window.ezEdit.supabase.signInWithPassword(email, password);
          
          if (result.error) {
            console.error('Login error:', result.error);
            displayResult('login-result', {
              error: `Authentication failed: ${result.error.message}`,
              suggestion: 'Check your credentials or Supabase configuration'
            }, false);
          } else {
            console.log('Login successful:', result.data);
            displayResult('login-result', {
              success: true,
              user: result.data.user ? {
                email: result.data.user.email,
                id: result.data.user.id
              } : 'User authenticated'
            });
            
            // Update UI to show logged in state
            document.getElementById('ftp-section').classList.remove('hidden');
          }
        } catch (error) {
          console.error('Login error:', error);
          
          // Detailed error handling
          if (error.message.includes('fetch')) {
            displayResult('login-result', { 
              error: 'Network error: Failed to connect to Supabase',
              details: 'Check if the Supabase URL is correct and accessible.'
            }, false);
          } else {
            displayResult('login-result', { 
              error: error.message,
              suggestion: 'Try initializing Supabase first'
            }, false);
          }
        } finally {
          // Re-enable button
          loginButton.disabled = false;
          loginButton.textContent = 'Login';
        }
      });

      // Social Login Handlers
      document.getElementById('google-login').addEventListener('click', async () => {
        try {
          // Check if Supabase is initialized
          if (!window.ezEdit || !window.ezEdit.supabase) {
            throw new Error('Supabase client not initialized. Click "Initialize Supabase" first.');
          }
          
          displayResult('social-result', 'Redirecting to Google login...');
          await window.ezEdit.supabase.signInWithProvider('google');
        } catch (error) {
          console.error('Google login error:', error);
          displayResult('social-result', { 
            error: error.message,
            suggestion: 'Make sure Supabase is initialized and Google OAuth is configured in your Supabase project'
          }, false);
        }
      });

      document.getElementById('github-login').addEventListener('click', async () => {
        try {
          // Check if Supabase is initialized
          if (!window.ezEdit || !window.ezEdit.supabase) {
            throw new Error('Supabase client not initialized. Click "Initialize Supabase" first.');
          }
          
          displayResult('social-result', 'Redirecting to GitHub login...');
          await window.ezEdit.supabase.signInWithProvider('github');
        } catch (error) {
          console.error('GitHub login error:', error);
          displayResult('social-result', { 
            error: error.message,
            suggestion: 'Make sure Supabase is initialized and GitHub OAuth is configured in your Supabase project'
          }, false);
        }
      });

      // Initialize Supabase
      document.getElementById('init-supabase').addEventListener('click', async () => {
        try {
          const initButton = document.getElementById('init-supabase');
          initButton.disabled = true;
          initButton.innerHTML = '<span class="spinner"></span> Initializing...';
          displayResult('supabase-init-result', 'Initializing Supabase client...');
          
          // Create global ezEdit object if not exists
          if (!window.ezEdit) window.ezEdit = {};
          
          // Create memory service if not exists
          if (!window.ezEdit.memory) {
            window.ezEdit.memory = new MemoryService();
            console.log('Memory service created');
          }
          
          // Get Supabase configuration
          let supabaseConfig = window.ezEdit.memory.getApiKey('supabase');
          
          // If no config found, use default test configuration
          if (!supabaseConfig || !supabaseConfig.url || !supabaseConfig.anonKey) {
            console.warn('Supabase config not found in memory service, using default test configuration');
            supabaseConfig = {
              url: 'https://your-supabase-project.supabase.co',
              anonKey: 'your-anon-key'
            };
            
            // Save to memory service for future use
            window.ezEdit.memory.setApiKey('supabase', supabaseConfig);
          }
          
          // Create Supabase service
          if (!window.ezEdit.supabase) {
            window.ezEdit.supabase = new SupabaseService(supabaseConfig);
            console.log('Supabase service created with config:', supabaseConfig);
          }
          
          // Initialize Supabase client
          await window.ezEdit.supabase.initializeClient();
          
          // Check if session exists
          const session = await window.ezEdit.supabase.getSession();
          
          displayResult('supabase-init-result', {
            initialized: true,
            config: {
              url: supabaseConfig.url,
              anonKey: supabaseConfig.anonKey ? '***' + supabaseConfig.anonKey.substring(supabaseConfig.anonKey.length - 4) : 'not set'
            },
            session: session ? 'Active session found' : 'No active session'
          });
          
          // If session exists, show user info
          if (session && session.user) {
            displayResult('login-result', {
              success: true,
              user: {
                email: session.user.email,
                id: session.user.id
              },
              message: 'User already logged in'
            });
            
            // Show FTP section
            document.getElementById('ftp-section').classList.remove('hidden');
          }
        } catch (error) {
          console.error('Supabase initialization error:', error);
          displayResult('supabase-init-result', { 
            error: error.message,
            suggestion: 'Check if Supabase JS library is loaded and configuration is correct'
          }, false);
        } finally {
          // Reset button state
          const initButton = document.getElementById('init-supabase');
          initButton.disabled = false;
          initButton.textContent = 'Initialize Supabase';
        }
      });

      // Initialize FTP Service
      document.getElementById('init-ftp').addEventListener('click', () => {
        try {
          // Initialize FTP service if not already done
          if (!window.ezEdit) window.ezEdit = {};
          
          // Create FTP service
          if (!window.ezEdit.ftpService) {
            window.ezEdit.ftpService = new FTPService();
            console.log('FTP Service created');
          }
          
          displayResult('ftp-init-result', {
            initialized: true,
            status: window.ezEdit.ftpService.getConnectionStatus() || 'disconnected'
          });
        } catch (error) {
          console.error('FTP initialization error:', error);
          displayResult('ftp-init-result', { 
            error: error.message,
            suggestion: 'Check if FTP service JavaScript is loaded correctly'
          }, false);
        }
      });

      // Connect to FTP
      document.getElementById('connect-ftp').addEventListener('click', async () => {
        try {
          // Check if FTP service is initialized
          if (!window.ezEdit || !window.ezEdit.ftpService) {
            throw new Error('FTP Service not initialized. Click "Initialize FTP Service" first.');
          }
          
          // Get FTP configuration from memory service
          let ftpConfig = window.ezEdit.memory.getApiKey('ftp');
          if (!ftpConfig || !ftpConfig.demoHost) {
            // Use hardcoded demo FTP credentials if not available in memory service
            console.warn('FTP config not found in memory service, using default demo credentials');
            ftpConfig = {
              demoHost: 'ftp.test.rebex.net',
              demoUser: 'demo',
              demoPassword: 'password'
            };
          }
          
          const credentials = {
            host: ftpConfig.demoHost,
            username: ftpConfig.demoUser,
            password: ftpConfig.demoPassword,
            port: 21,
            passive: true
          };
          
          // Show connecting status
          const connectButton = document.getElementById('connect-ftp');
          connectButton.disabled = true;
          connectButton.innerHTML = '<span class="spinner"></span> Connecting...';
          displayResult('connect-result', 'Connecting to FTP server...');
          
          // Connect to FTP
          const result = await window.ezEdit.ftpService.connect(credentials);
          displayResult('connect-result', result);
          
          // If connection successful, enable directory listing section
          if (result.connected) {
            document.getElementById('list-dir').disabled = false;
            document.getElementById('get-file').disabled = false;
          }
        } catch (error) {
          console.error('FTP connection error:', error);
          displayResult('connect-result', { 
            error: error.message,
            suggestion: 'Check if the FTP server is accessible and credentials are correct'
          }, false);
        } finally {
          // Re-enable connect button
          const connectButton = document.getElementById('connect-ftp');
          connectButton.disabled = false;
          connectButton.textContent = 'Connect';
        }
      });

      // List Directory
      document.getElementById('list-dir').addEventListener('click', async () => {
        try {
          // Check if FTP service is initialized and connected
          if (!window.ezEdit || !window.ezEdit.ftpService) {
            throw new Error('FTP Service not initialized. Click "Initialize FTP Service" first.');
          }
          
          // Get path and validate
          const path = document.getElementById('list-path').value || '/';
          
          // Show loading state
          const listButton = document.getElementById('list-dir');
          listButton.disabled = true;
          listButton.innerHTML = '<span class="spinner"></span> Listing...';
          displayResult('list-result', 'Listing directory contents...');
          
          // List directory
          const result = await window.ezEdit.ftpService.listDirectory(path);
          
          // Format and display result
          if (result.error) {
            throw new Error(result.error);
          } else if (result.files && Array.isArray(result.files)) {
            // Format files for display
            const formattedResult = {
              path: path,
              count: result.files.length,
              files: result.files.map(file => ({
                name: file.name,
                type: file.type,
                size: file.size ? `${(file.size / 1024).toFixed(2)} KB` : '-',
                modified: file.modified || '-'
              }))
            };
            displayResult('list-result', formattedResult);
            
            // Create clickable file list
            const fileList = document.createElement('ul');
            fileList.className = 'file-list';
            result.files.forEach(file => {
              const fileItem = document.createElement('li');
              fileItem.className = file.type === 'directory' ? 'directory' : 'file';
              fileItem.textContent = file.name;
              
              // Add click handler for directories
              if (file.type === 'directory') {
                fileItem.addEventListener('click', () => {
                  const newPath = path === '/' ? `/${file.name}` : `${path}/${file.name}`;
                  document.getElementById('list-path').value = newPath;
                  document.getElementById('list-dir').click();
                });
              }
              // Add click handler for files
              else {
                fileItem.addEventListener('click', () => {
                  const filePath = path === '/' ? `/${file.name}` : `${path}/${file.name}`;
                  document.getElementById('file-path').value = filePath;
                });
              }
              
              fileList.appendChild(fileItem);
            });
            
            // Clear previous list and append new one
            const resultBox = document.getElementById('list-result');
            const existingList = resultBox.querySelector('.file-list');
            if (existingList) {
              resultBox.removeChild(existingList);
            }
            resultBox.appendChild(fileList);
          } else {
            displayResult('list-result', { message: 'Directory is empty or not accessible' });
          }
        } catch (error) {
          console.error('List directory error:', error);
          displayResult('list-result', { 
            error: error.message,
            suggestion: 'Check if you are connected to the FTP server and the path is valid'
          }, false);
        } finally {
          // Reset button state
          const listButton = document.getElementById('list-dir');
          listButton.disabled = false;
          listButton.textContent = 'List Directory';
        }
      });

      // Get File
      document.getElementById('get-file').addEventListener('click', async () => {
        try {
          // Check if FTP service is initialized and connected
          if (!window.ezEdit || !window.ezEdit.ftpService) {
            throw new Error('FTP Service not initialized. Click "Initialize FTP Service" first.');
          }
          
          // Get file path and validate
          const path = document.getElementById('file-path').value;
          if (!path) {
            throw new Error('Please enter a valid file path');
          }
          
          // Show loading state
          const getFileButton = document.getElementById('get-file');
          getFileButton.disabled = true;
          getFileButton.innerHTML = '<span class="spinner"></span> Downloading...';
          displayResult('file-result', 'Downloading file...');
          
          // Get file
          const result = await window.ezEdit.ftpService.getFile(path);
          
          // Format and display result
          if (result.error) {
            throw new Error(result.error);
          } else if (result.content) {
            // Create a formatted result with file info
            const formattedResult = {
              path: path,
              fileName: path.split('/').pop(),
              size: result.content.length,
              preview: result.content.length > 1000 ? 
                result.content.substring(0, 1000) + '...' : 
                result.content
            };
            
            displayResult('file-result', formattedResult);
            
            // Create a preview container
            const previewContainer = document.createElement('div');
            previewContainer.className = 'file-preview';
            
            // Create file content preview
            const contentPreview = document.createElement('pre');
            contentPreview.className = 'content-preview';
            contentPreview.textContent = result.content.substring(0, 2000) + 
              (result.content.length > 2000 ? '\n[Content truncated...]' : '');
            
            // Add download button
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'btn btn-secondary';
            downloadBtn.textContent = 'Download File';
            downloadBtn.addEventListener('click', () => {
              const blob = new Blob([result.content], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = path.split('/').pop();
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            });
            
            previewContainer.appendChild(contentPreview);
            previewContainer.appendChild(downloadBtn);
            
            // Clear previous preview and append new one
            const resultBox = document.getElementById('file-result');
            const existingPreview = resultBox.querySelector('.file-preview');
            if (existingPreview) {
              resultBox.removeChild(existingPreview);
            }
            resultBox.appendChild(previewContainer);
          } else {
            displayResult('file-result', { message: 'File is empty or not accessible' });
          }
        } catch (error) {
          console.error('Get file error:', error);
          displayResult('file-result', { 
            error: error.message,
            suggestion: 'Check if you are connected to the FTP server and the file path is valid'
          }, false);
        } finally {
          // Reset button state
          const getFileButton = document.getElementById('get-file');
          getFileButton.disabled = false;
          getFileButton.textContent = 'Get File';
        }
      });

      // Disconnect
      document.getElementById('disconnect-ftp').addEventListener('click', async () => {
        try {
          // Check if FTP service is initialized
          if (!window.ezEdit || !window.ezEdit.ftpService) {
            throw new Error('FTP Service not initialized. Click "Initialize FTP Service" first.');
          }
          
          // Show disconnecting state
          const disconnectButton = document.getElementById('disconnect-ftp');
          disconnectButton.disabled = true;
          disconnectButton.innerHTML = '<span class="spinner"></span> Disconnecting...';
          displayResult('disconnect-result', 'Disconnecting from FTP server...');
          
          // Disconnect from FTP
          const result = await window.ezEdit.ftpService.disconnect();
          displayResult('disconnect-result', result);
          
          // Disable directory listing and file download buttons
          document.getElementById('list-dir').disabled = true;
          document.getElementById('get-file').disabled = true;
        } catch (error) {
          console.error('FTP disconnect error:', error);
          displayResult('disconnect-result', { 
            error: error.message,
            suggestion: 'Check if you were connected to the FTP server'
          }, false);
        } finally {
          // Reset button state
          const disconnectButton = document.getElementById('disconnect-ftp');
          disconnectButton.disabled = false;
          disconnectButton.textContent = 'Disconnect';
        }
      });
    });
  </script>
</body>
</html>
