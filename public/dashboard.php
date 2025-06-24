<?php
/**
 * EzEdit Dashboard - PHP Version
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
  <title>Dashboard - EzEdit</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="icon" type="image/svg+xml" href="img/logo.svg">
  <!-- Supabase Client Library -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
</head>
<body class="dashboard-page">
  <!-- Standardized header component -->
  <ez-header></ez-header>

  <main>
    <div class="container">
      <!-- Checkout success notification -->
      <div id="checkout-success-alert" class="alert alert-success mb-4" style="display: none;">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <div>
          <h4>Payment Successful!</h4>
          <p>Thank you for your subscription. Your account has been upgraded.</p>
        </div>
        <button class="close-alert" aria-label="Close">&times;</button>
      </div>

      <!-- Dashboard header -->
      <div class="dashboard-header">
        <h1>Dashboard</h1>
        <div class="subscription-status" id="subscription-status">
          <!-- Subscription status will be loaded here -->
          <div class="skeleton-loader"></div>
        </div>
      </div>

      <!-- Sites grid -->
      <h2 class="section-title">Your Sites</h2>
      <div class="grid">
        <!-- Add site card -->
        <div class="card add-site-card" id="add-site-card">
          <div class="add-site-content">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <h3>Add New Site</h3>
            <p>Connect to your website via FTP</p>
          </div>
          <button class="btn btn-primary" id="add-site-btn">Add Site</button>
        </div>
      </div>
    </div>
  </main>

  <div class="modal" id="add-site-modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Add New Site</h2>
        <button class="modal-close" id="close-modal">×</button>
      </div>
      <div class="modal-body">
        <form id="add-site-form">
          <div class="form-group">
            <label for="site-name">Site Name</label>
            <input type="text" id="site-name" class="form-input" placeholder="My Awesome Site" required>
          </div>
          <div class="form-group">
            <label for="ftp-host">FTP Host</label>
            <input type="text" id="ftp-host" class="form-input" placeholder="ftp.example.com" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="ftp-port">Port</label>
              <input type="number" id="ftp-port" class="form-input" value="21">
            </div>
            <div class="form-group">
              <label for="ftp-passive">Passive Mode</label>
              <div class="toggle-wrapper">
                <input type="checkbox" id="ftp-passive" checked>
                <label for="ftp-passive" class="toggle"></label>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label for="ftp-username">Username</label>
            <input type="text" id="ftp-username" class="form-input" required>
          </div>
          <div class="form-group">
            <label for="ftp-password">Password</label>
            <input type="password" id="ftp-password" class="form-input" required>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" id="test-connection">Test Connection</button>
            <button type="submit" class="btn btn-primary">Add Site</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <footer class="footer">
    <div class="container">
      <p>&copy; 2025 EzEdit • <a href="/privacy.html">Privacy</a></p>
    </div>
  </footer>

  <!-- Core Scripts -->
  <script src="js/config.js"></script>
  <script src="js/memory-service.js"></script>
  <script src="js/supabase-service.js"></script>
  <script src="js/php-auth-service.js"></script>
  <script src="js/auth-service.js"></script>
  <script src="js/subscription.js"></script>
  <script src="js/dashboard.js" defer></script>
  <!-- Standardized footer component -->
  <ez-footer></ez-footer>

  <!-- EzEdit UI Components -->
  <script src="js/memory-service.js"></script>
  <script src="js/supabase-service.js"></script>
  <script src="js/php-auth-service.js"></script>
  <script src="js/auth-service.js"></script>
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
      
      // Check for checkout success parameter in URL
      const urlParams = new URLSearchParams(window.location.search);
      const checkoutStatus = urlParams.get('checkout');
      
      if (checkoutStatus === 'success') {
        // Show success message
        const successAlert = document.getElementById('checkout-success-alert');
        if (successAlert) {
          successAlert.style.display = 'flex';
          
          // Add event listener to close button
          const closeBtn = successAlert.querySelector('.close-alert');
          if (closeBtn) {
            closeBtn.addEventListener('click', () => {
              successAlert.style.display = 'none';
              
              // Remove checkout parameter from URL
              const newUrl = window.location.pathname;
              window.history.replaceState({}, document.title, newUrl);
            });
          }
          
          // Auto-hide after 10 seconds
          setTimeout(() => {
            successAlert.style.display = 'none';
            
            // Remove checkout parameter from URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          }, 10000);
        }
      }
      
      // Load subscription status
      loadSubscriptionStatus();
      
      
      // Add site button functionality
      const addSiteBtn = document.getElementById('add-site-btn');
      if (addSiteBtn) {
        addSiteBtn.addEventListener('click', () => {
          // Show add site modal or redirect to add site page
          window.location.href = 'add-site.html';
        });
      }
      
      // Load sites from Supabase
      loadSites();
    });
    
    // Function to load sites from Supabase
    async function loadSites() {
      try {
        // Show loading state
        const sitesContainer = document.querySelector('.grid');
        sitesContainer.innerHTML = '<div class="loading-spinner">Loading sites...</div>';
        
        // Get sites from Supabase (still using Supabase for data storage)
        const sites = await window.ezEdit.supabase.getSites();
        
        // Clear loading state
        sitesContainer.innerHTML = '';
        
        // If no sites, show empty state
        if (!sites || sites.length === 0) {
          sitesContainer.innerHTML = `
            <div class="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
              <h3>No sites yet</h3>
              <p>Add your first site to get started</p>
              <button class="btn mt-3" id="empty-add-site-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Add Site
              </button>
            </div>
          `;
          
          // Add event listener to empty state add site button
          const emptyAddSiteBtn = document.getElementById('empty-add-site-btn');
          if (emptyAddSiteBtn) {
            emptyAddSiteBtn.addEventListener('click', () => {
              window.location.href = 'add-site.html';
            });
          }
        } else {
          // Add site card (always first)
          sitesContainer.innerHTML = `
            <div class="card add-site-card" id="add-site-card">
              <div class="add-site-content">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                <h3>Add New Site</h3>
                <p>Connect to your website via FTP</p>
              </div>
              <button class="btn btn-primary" id="add-site-btn">Add Site</button>
            </div>
          `;
          
          // Add event listener to add site button
          const addSiteBtn = document.getElementById('add-site-btn');
          if (addSiteBtn) {
            addSiteBtn.addEventListener('click', () => {
              window.location.href = 'add-site.html';
            });
          }
          
          // Add site cards
          sites.forEach(site => {
            const card = document.createElement('div');
            card.className = 'card site-card';
            card.dataset.siteId = site.id;
            
            const statusClass = site.status === 'connected' ? 'status-success' : 'status-warning';
            const statusText = site.status === 'connected' ? 'Connected' : 'Disconnected';
            
            // Format date
            const lastEdited = new Date(site.lastEdited || site.updated_at || site.created_at);
            const formattedDate = lastEdited.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
            
            card.innerHTML = `
              <div class="site-card-header">
                <h3>${site.name}</h3>
                <span class="status ${statusClass}">${statusText}</span>
              </div>
              <p class="text-muted mb-3">Last edited: ${formattedDate}</p>
              <div class="site-card-actions">
                <a href="/editor.php?site=${encodeURIComponent(site.id)}" class="btn">Open Editor</a>
                <button class="btn-icon site-settings" data-site-id="${site.id}" aria-label="Site settings">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </button>
              </div>
            `;
            
            sitesContainer.appendChild(card);
          });
        }
      } catch (error) {
        console.error('Error loading sites:', error);
        const sitesContainer = document.querySelector('.grid');
        sitesContainer.innerHTML = `
          <div class="error-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <h3>Error loading sites</h3>
            <p>Please try again later</p>
            <button class="btn mt-3" id="retry-load-sites">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
              Retry
            </button>
          </div>
        `;
        
        // Add event listener to retry button
        const retryBtn = document.getElementById('retry-load-sites');
        if (retryBtn) {
          retryBtn.addEventListener('click', loadSites);
        }
      }
    }
  </script>
</body>
</html>
