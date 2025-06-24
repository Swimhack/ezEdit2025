<?php
/**
 * EzEdit Code Editor - PHP Version
 * Handles hybrid authentication with both Supabase client-side and PHP backend
 */

// Start session
session_start();

// Check if user is authenticated via PHP session
$phpAuthenticated = isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);

// We'll let the client-side JS handle authentication if PHP session is not available
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Editor - EzEdit</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="css/editor.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!-- Monaco Editor -->
  <script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.34.0/min/vs/loader.js"></script>
  <!-- Supabase Client Library -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
</head>
<body class="editor-page">
  <!-- Standardized header component -->
  <ez-header></ez-header>

  <div class="editor-layout">
    <!-- File Explorer Sidebar -->
    <aside class="file-explorer" id="file-explorer">
      <div class="file-explorer-header">
        <h3>Files</h3>
        <div class="file-actions">
          <button class="btn-icon" id="new-file" title="New File">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
          </button>
          <button class="btn-icon" id="new-folder" title="New Folder">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
          </button>
          <button class="btn-icon" id="refresh-files" title="Refresh">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          </button>
        </div>
      </div>
      <div class="file-explorer-content" id="file-tree">
        <!-- File tree will be loaded here -->
        <div class="loading-spinner">Loading files...</div>
      </div>
    </aside>

    <!-- Main Editor Area -->
    <main class="editor-main">
      <!-- Editor Tabs -->
      <div class="editor-tabs" id="editor-tabs">
        <!-- Tabs will be added dynamically -->
      </div>

      <!-- Editor Container -->
      <div class="editor-container">
        <!-- Split Editor View -->
        <div class="editor-split">
          <!-- Original Code -->
          <div class="editor-pane" id="editor-original"></div>
          <!-- Modified Code -->
          <div class="editor-pane" id="editor-modified"></div>
        </div>
      </div>

      <!-- Editor Actions -->
      <div class="editor-actions">
        <div class="editor-status">
          <span id="file-status">No file open</span>
        </div>
        <div class="editor-buttons">
          <button class="btn btn-outline" id="discard-changes" disabled>Discard Changes</button>
          <button class="btn btn-primary" id="save-changes" disabled>Save Changes</button>
        </div>
      </div>
    </main>

    <!-- AI Assistant Sidebar -->
    <aside class="ai-assistant" id="ai-assistant">
      <div class="ai-assistant-header">
        <h3>Klein Assistant</h3>
        <button class="btn-icon" id="toggle-ai" title="Toggle AI Assistant">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
        </button>
      </div>
      <div class="ai-assistant-content">
        <div class="ai-chat" id="ai-chat">
          <div class="ai-message system">
            <div class="ai-message-content">
              <p>Hello! I'm Klein, your AI coding assistant. How can I help you with your code today?</p>
            </div>
          </div>
        </div>
        <div class="ai-input">
          <textarea id="ai-prompt" placeholder="Ask Klein for help..."></textarea>
          <button class="btn-icon" id="send-prompt">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    </aside>
  </div>

  <!-- Preview Modal -->
  <div class="modal" id="preview-modal">
    <div class="modal-content preview-modal-content">
      <div class="modal-header">
        <h2>Preview</h2>
        <button class="modal-close" id="close-preview">×</button>
      </div>
      <div class="modal-body preview-modal-body">
        <iframe id="preview-iframe" src="about:blank"></iframe>
      </div>
    </div>
  </div>

  <!-- Save Error Modal -->
  <div class="modal" id="save-error-modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Save Error</h2>
        <button class="modal-close" id="close-save-error">×</button>
      </div>
      <div class="modal-body">
        <div class="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <div>
            <h4>Unable to Save Changes</h4>
            <p id="save-error-message">You need to upgrade to save changes.</p>
          </div>
        </div>
        <div class="subscription-upsell" id="subscription-upsell">
          <h3>Upgrade to Pro</h3>
          <p>Unlock the ability to save and publish changes to your sites.</p>
          <ul class="feature-list">
            <li>Save and publish changes</li>
            <li>Unlimited sites</li>
            <li>Unlimited AI assistance</li>
            <li>Team collaboration</li>
          </ul>
          <button class="btn btn-primary" id="upgrade-btn">Upgrade Now</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Core Scripts -->
  <script src="js/config.js"></script>
  <script src="js/memory-service.js"></script>
  <script src="js/supabase-service.js"></script>
  <script src="js/php-auth-service.js"></script>
  <script src="js/auth-service.js"></script>
  <script src="js/subscription.js"></script>
  <script src="js/editor.js" defer></script>

  <!-- EzEdit UI Components -->
  <script src="js/ui-components.js"></script>
  <script src="components/header.js"></script>
  <script src="components/footer.js"></script>

  <script>
    // Initialize UI components
    document.addEventListener('DOMContentLoaded', async () => {
      // Initialize services
      window.ezEdit = window.ezEdit || {};
      window.ezEdit.memory = window.ezEdit.memory || new MemoryService();
      window.ezEdit.supabase = window.ezEdit.supabase || new SupabaseService();
      window.ezEdit.phpAuth = window.ezEdit.phpAuth || new PhpAuthService();
      window.ezEdit.auth = window.ezEdit.auth || new AuthService();
      window.ezEdit.subscription = window.ezEdit.subscription || new SubscriptionService();
      
      try {
        // Initialize auth services
        await Promise.all([
          window.ezEdit.supabase.init(),
          window.ezEdit.auth.init()
        ]);
        console.log('Authentication services initialized successfully');
      } catch (err) {
        console.error('Failed to initialize authentication services:', err);
        window.ezEdit.ui.showToast('Authentication service error. Please try again later.', 'error');
      }
      
      // Check if user is authenticated
      if (!window.ezEdit.auth.isAuthenticated()) {
        // Redirect to login page if not authenticated
        window.location.href = 'login.html';
        return;
      }
      
      // Get user data
      const user = window.ezEdit.auth.getUser();
      if (user) {
        // Update user email display
        const userEmailElements = document.querySelectorAll('.user-email');
        userEmailElements.forEach(el => {
          el.textContent = user.email;
        });
      }
      
      // Initialize Monaco Editor
      require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.34.0/min/vs' }});
      require(['vs/editor/editor.main'], function() {
        // Editor initialization will be handled in editor.js
      });
    });
  </script>
</body>
</html>
