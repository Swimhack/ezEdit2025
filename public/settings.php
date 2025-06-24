<?php
/**
 * EzEdit Settings - PHP Version
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
  <title>Settings - EzEdit</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="icon" type="image/svg+xml" href="img/logo.svg">
  <!-- Supabase Client Library -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
</head>
<body class="settings-page">
  <!-- Standardized header component -->
  <ez-header></ez-header>

  <main>
    <div class="container">
      <!-- Settings header -->
      <div class="settings-header">
        <h1>Settings</h1>
        <p class="text-muted">Manage your account preferences and subscription</p>
      </div>

      <!-- Settings tabs -->
      <div class="tabs" id="settings-tabs">
        <button class="tab active" data-tab="account">Account</button>
        <button class="tab" data-tab="subscription">Subscription</button>
        <button class="tab" data-tab="sites">Sites</button>
        <button class="tab" data-tab="preferences">Preferences</button>
      </div>

      <!-- Tab content -->
      <div class="tab-content">
        <!-- Account Tab -->
        <div class="tab-pane active" id="account-tab">
          <div class="card">
            <div class="card-header">
              <h3>Account Information</h3>
              <p class="text-muted">Update your account details</p>
            </div>
            <div class="card-body">
              <form id="account-form">
                <div class="form-group">
                  <label for="user-email">Email Address</label>
                  <input type="email" id="user-email" class="form-input" readonly>
                  <small class="text-muted">Email address cannot be changed</small>
                </div>
                <div class="form-group">
                  <label for="user-name">Display Name</label>
                  <input type="text" id="user-name" class="form-input" placeholder="Your display name">
                </div>
                <div class="form-group">
                  <label for="user-timezone">Timezone</label>
                  <select id="user-timezone" class="form-input">
                    <option value="America/New_York">Eastern Time (UTC-5)</option>
                    <option value="America/Chicago">Central Time (UTC-6)</option>
                    <option value="America/Denver">Mountain Time (UTC-7)</option>
                    <option value="America/Los_Angeles">Pacific Time (UTC-8)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <button type="submit" class="btn btn-primary">Save Changes</button>
              </form>
            </div>
          </div>

          <!-- Change Password -->
          <div class="card mt-4">
            <div class="card-header">
              <h3>Change Password</h3>
              <p class="text-muted">Update your account password</p>
            </div>
            <div class="card-body">
              <form id="password-form">
                <div class="form-group">
                  <label for="current-password">Current Password</label>
                  <input type="password" id="current-password" class="form-input" required>
                </div>
                <div class="form-group">
                  <label for="new-password">New Password</label>
                  <input type="password" id="new-password" class="form-input" required>
                </div>
                <div class="form-group">
                  <label for="confirm-password">Confirm New Password</label>
                  <input type="password" id="confirm-password" class="form-input" required>
                </div>
                <button type="submit" class="btn btn-primary">Update Password</button>
              </form>
            </div>
          </div>

          <!-- Delete Account -->
          <div class="card mt-4 border-danger">
            <div class="card-header">
              <h3 class="text-danger">Danger Zone</h3>
              <p class="text-muted">Irreversible actions</p>
            </div>
            <div class="card-body">
              <div class="alert alert-warning">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <div>
                  <strong>Warning:</strong> Deleting your account is permanent and cannot be undone.
                </div>
              </div>
              <button type="button" class="btn btn-danger" id="delete-account-btn">Delete Account</button>
            </div>
          </div>
        </div>

        <!-- Subscription Tab -->
        <div class="tab-pane" id="subscription-tab">
          <div class="card">
            <div class="card-header">
              <h3>Current Plan</h3>
              <p class="text-muted">Manage your subscription and billing</p>
            </div>
            <div class="card-body">
              <div id="subscription-info">
                <!-- Subscription info will be loaded here -->
                <div class="skeleton-loader"></div>
              </div>
            </div>
          </div>

          <!-- Billing History -->
          <div class="card mt-4">
            <div class="card-header">
              <h3>Billing History</h3>
              <p class="text-muted">View your past invoices and payments</p>
            </div>
            <div class="card-body">
              <div id="billing-history">
                <!-- Billing history will be loaded here -->
                <div class="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                  <p>No billing history available</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sites Tab -->
        <div class="tab-pane" id="sites-tab">
          <div class="card">
            <div class="card-header">
              <h3>Site Management</h3>
              <p class="text-muted">Manage your connected sites</p>
            </div>
            <div class="card-body">
              <div id="sites-list">
                <!-- Sites list will be loaded here -->
                <div class="skeleton-loader"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Preferences Tab -->
        <div class="tab-pane" id="preferences-tab">
          <div class="card">
            <div class="card-header">
              <h3>Editor Preferences</h3>
              <p class="text-muted">Customize your code editor experience</p>
            </div>
            <div class="card-body">
              <form id="preferences-form">
                <div class="form-group">
                  <label for="editor-theme">Editor Theme</label>
                  <select id="editor-theme" class="form-input">
                    <option value="vs-dark">Dark</option>
                    <option value="vs">Light</option>
                    <option value="hc-black">High Contrast</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="font-size">Font Size</label>
                  <select id="font-size" class="form-input">
                    <option value="12">12px</option>
                    <option value="14">14px</option>
                    <option value="16">16px</option>
                    <option value="18">18px</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="tab-size">Tab Size</label>
                  <select id="tab-size" class="form-input">
                    <option value="2">2 spaces</option>
                    <option value="4">4 spaces</option>
                    <option value="8">8 spaces</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" id="word-wrap">
                    <span class="checkmark"></span>
                    Enable word wrap
                  </label>
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" id="minimap">
                    <span class="checkmark"></span>
                    Show minimap
                  </label>
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" id="auto-save">
                    <span class="checkmark"></span>
                    Auto-save changes
                  </label>
                </div>
                <button type="submit" class="btn btn-primary">Save Preferences</button>
              </form>
            </div>
          </div>

          <!-- Notifications -->
          <div class="card mt-4">
            <div class="card-header">
              <h3>Notifications</h3>
              <p class="text-muted">Control what notifications you receive</p>
            </div>
            <div class="card-body">
              <form id="notifications-form">
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" id="email-notifications">
                    <span class="checkmark"></span>
                    Email notifications
                  </label>
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" id="security-alerts">
                    <span class="checkmark"></span>
                    Security alerts
                  </label>
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" id="product-updates">
                    <span class="checkmark"></span>
                    Product updates
                  </label>
                </div>
                <button type="submit" class="btn btn-primary">Save Notification Settings</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Delete Account Confirmation Modal -->
  <div class="modal" id="delete-account-modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Delete Account</h2>
        <button class="modal-close" id="close-delete-modal">×</button>
      </div>
      <div class="modal-body">
        <div class="alert alert-danger">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <div>
            <h4>This action cannot be undone</h4>
            <p>Deleting your account will permanently remove all your data, including sites, files, and subscription information.</p>
          </div>
        </div>
        <div class="form-group">
          <label for="delete-confirmation">Type "DELETE" to confirm:</label>
          <input type="text" id="delete-confirmation" class="form-input" placeholder="DELETE">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" id="cancel-delete">Cancel</button>
          <button type="button" class="btn btn-danger" id="confirm-delete" disabled>Delete Account</button>
        </div>
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
  <script src="js/settings.js" defer></script>

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

        // Populate account form
        const userEmailInput = document.getElementById('user-email');
        if (userEmailInput) {
          userEmailInput.value = user.email;
        }
      }
      
      // Initialize tab functionality
      initializeTabs();
      
      // Load subscription information
      loadSubscriptionInfo();
      
      // Load sites list
      loadSitesList();
      
      // Load user preferences
      loadUserPreferences();
    });

    // Initialize tab functionality
    function initializeTabs() {
      const tabButtons = document.querySelectorAll('.tab');
      const tabPanes = document.querySelectorAll('.tab-pane');
      
      tabButtons.forEach(button => {
        button.addEventListener('click', () => {
          const targetTab = button.dataset.tab;
          
          // Remove active class from all tabs and panes
          tabButtons.forEach(btn => btn.classList.remove('active'));
          tabPanes.forEach(pane => pane.classList.remove('active'));
          
          // Add active class to clicked tab and corresponding pane
          button.classList.add('active');
          const targetPane = document.getElementById(`${targetTab}-tab`);
          if (targetPane) {
            targetPane.classList.add('active');
          }
        });
      });
    }

    // Load subscription information
    async function loadSubscriptionInfo() {
      try {
        const subscriptionInfo = document.getElementById('subscription-info');
        
        // Get current plan
        const currentPlan = window.ezEdit.subscription.getCurrentPlan();
        const planDetails = window.ezEdit.subscription.getPlanDetails(currentPlan);
        
        // Check if user is admin
        const isAdmin = window.ezEdit.subscription.isAdminUser();
        
        let content = '';
        
        if (isAdmin) {
          content = `
            <div class="plan-status admin-plan">
              <div class="plan-badge admin">Admin</div>
              <h4>Administrator Account</h4>
              <p>You have unlimited access to all features.</p>
              <ul class="plan-features">
                <li>✓ Unlimited sites</li>
                <li>✓ Unlimited saves</li>
                <li>✓ Unlimited AI queries</li>
                <li>✓ Unlimited team members</li>
                <li>✓ Priority support</li>
              </ul>
            </div>
          `;
        } else {
          content = `
            <div class="plan-status">
              <div class="plan-badge ${currentPlan}">${planDetails.name}</div>
              <h4>${planDetails.name} Plan</h4>
              <p>${planDetails.description}</p>
              <ul class="plan-features">
                ${planDetails.features.map(feature => `<li>✓ ${feature}</li>`).join('')}
              </ul>
              ${currentPlan === 'free-trial' ? `
                <div class="trial-info">
                  <p><strong>Trial ends:</strong> ${getTrialEndDate()}</p>
                </div>
              ` : ''}
              ${currentPlan !== 'pro' ? `
                <button class="btn btn-primary mt-3" id="upgrade-plan-btn">Upgrade Plan</button>
              ` : ''}
            </div>
          `;
        }
        
        subscriptionInfo.innerHTML = content;
        
        // Add upgrade button functionality
        const upgradeBtn = document.getElementById('upgrade-plan-btn');
        if (upgradeBtn) {
          upgradeBtn.addEventListener('click', () => {
            window.location.href = 'pricing.html';
          });
        }
        
      } catch (error) {
        console.error('Error loading subscription info:', error);
        document.getElementById('subscription-info').innerHTML = `
          <div class="error-state">
            <p>Error loading subscription information</p>
          </div>
        `;
      }
    }

    // Get trial end date
    function getTrialEndDate() {
      const auth = JSON.parse(localStorage.getItem('ezEditAuth') || '{}');
      const trialDays = auth.user?.trial_days || 7;
      const createdAt = new Date(auth.user?.created_at || Date.now());
      const endDate = new Date(createdAt.getTime() + (trialDays * 24 * 60 * 60 * 1000));
      return endDate.toLocaleDateString();
    }

    // Load sites list
    async function loadSitesList() {
      try {
        const sitesList = document.getElementById('sites-list');
        
        // Get sites from Supabase
        const sites = await window.ezEdit.supabase.getSites();
        
        if (!sites || sites.length === 0) {
          sitesList.innerHTML = `
            <div class="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
              <p>No sites connected</p>
              <a href="dashboard.php" class="btn">Add Your First Site</a>
            </div>
          `;
        } else {
          let sitesHTML = '<div class="sites-grid">';
          
          sites.forEach(site => {
            sitesHTML += `
              <div class="site-item">
                <div class="site-info">
                  <h4>${site.name}</h4>
                  <p class="text-muted">${site.host}</p>
                  <span class="status ${site.status === 'connected' ? 'status-success' : 'status-warning'}">
                    ${site.status === 'connected' ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div class="site-actions">
                  <a href="editor.php?site=${encodeURIComponent(site.id)}" class="btn-icon" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </a>
                  <button class="btn-icon delete-site" data-site-id="${site.id}" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
            `;
          });
          
          sitesHTML += '</div>';
          sitesList.innerHTML = sitesHTML;
        }
        
      } catch (error) {
        console.error('Error loading sites:', error);
        document.getElementById('sites-list').innerHTML = `
          <div class="error-state">
            <p>Error loading sites</p>
          </div>
        `;
      }
    }

    // Load user preferences
    function loadUserPreferences() {
      const preferences = JSON.parse(localStorage.getItem('ezEditPreferences') || '{}');
      
      // Set form values
      document.getElementById('editor-theme').value = preferences.theme || 'vs-dark';
      document.getElementById('font-size').value = preferences.fontSize || '14';
      document.getElementById('tab-size').value = preferences.tabSize || '2';
      document.getElementById('word-wrap').checked = preferences.wordWrap || false;
      document.getElementById('minimap').checked = preferences.minimap || true;
      document.getElementById('auto-save').checked = preferences.autoSave || false;
      document.getElementById('email-notifications').checked = preferences.emailNotifications !== false;
      document.getElementById('security-alerts').checked = preferences.securityAlerts !== false;
      document.getElementById('product-updates').checked = preferences.productUpdates || false;
    }
  </script>
</body>
</html>
