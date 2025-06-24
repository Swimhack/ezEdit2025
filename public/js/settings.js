/**
 * EzEdit Settings JavaScript
 * Handles user settings, preferences, and account management
 * Integrated with Supabase authentication and database
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize services
  const memoryService = new MemoryService();
  const supabaseService = new SupabaseService(memoryService);
  
  // DOM Elements
  const settingsNavItems = document.querySelectorAll('.settings-nav-item');
  const settingsTabs = document.querySelectorAll('.settings-tab');
  const profileForm = document.getElementById('profile-form');
  const passwordForm = document.getElementById('password-form');
  const editorPrefsForm = document.getElementById('editor-prefs-form');
  const aiPrefsForm = document.getElementById('ai-prefs-form');
  const firstNameInput = document.getElementById('first-name');
  const lastNameInput = document.getElementById('last-name');
  const emailInput = document.getElementById('email');
  const themeToggle = document.querySelector('.theme-toggle');
  const upgradeBtn = document.getElementById('upgrade-btn-settings');
  
  // User data object
  let userData = {
    id: '',
    email: '',
    firstName: '',
    lastName: '',
    plan: 'free-trial',
    trialDaysLeft: 7,
    subscription: null
  };
  
  /**
   * Initialize the settings page
   */
  async function initSettings() {
    try {
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabaseService.supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }
      
      if (!session) {
        // Redirect to login if not authenticated
        window.location.href = '../login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.hash);
        return;
      }
      
      // Get user data from session
      const user = session.user;
      
      if (!user) {
        throw new Error('No user found in session');
      }
      
      // Get user profile from profiles table
      const { data: profile, error: profileError } = await supabaseService.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
        throw profileError;
      }
      
      // If profile doesn't exist, create it
      if (!profile) {
        // Extract name from user metadata if available
        const firstName = user.user_metadata?.first_name || '';
        const lastName = user.user_metadata?.last_name || '';
        
        const { data: newProfile, error: createError } = await supabaseService.supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              email: user.email,
              first_name: firstName,
              last_name: lastName,
              plan: 'free-trial',
              trial_start_date: new Date().toISOString(),
              trial_days_left: 7,
              auth_provider: user.app_metadata?.provider || 'email'
            }
          ])
          .select()
          .single();
        
        if (createError) {
          throw createError;
        }
        
        userData = {
          id: newProfile.id,
          email: newProfile.email,
          firstName: newProfile.first_name || '',
          lastName: newProfile.last_name || '',
          plan: newProfile.plan || 'free-trial',
          trialDaysLeft: newProfile.trial_days_left || 7,
          subscription: newProfile.subscription_status || null,
          authProvider: newProfile.auth_provider
        };
      } else {
        // Calculate remaining trial days if on free trial
        let trialDaysLeft = 7;
        if (profile.plan === 'free-trial' && profile.trial_start_date) {
          const trialStart = new Date(profile.trial_start_date);
          const today = new Date();
          const daysPassed = Math.floor((today - trialStart) / (1000 * 60 * 60 * 24));
          trialDaysLeft = Math.max(0, 7 - daysPassed);
          
          // Update trial days left in database if it has changed
          if (trialDaysLeft !== profile.trial_days_left) {
            await supabaseService.supabase
              .from('profiles')
              .update({ trial_days_left: trialDaysLeft })
              .eq('id', user.id);
          }
        }
        
        userData = {
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          plan: profile.plan || 'free-trial',
          trialDaysLeft: trialDaysLeft,
          subscription: profile.subscription_status || null,
          authProvider: profile.auth_provider
        };
      }
      
      // Update UI with user data
      updateUserInterface();
      
      // Set up auth state change listener
      supabaseService.supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          // Redirect to login page
          window.location.href = '../login.html';
        }
      });
      
    } catch (error) {
      console.error('Settings initialization error:', error);
      showNotification(error.message || 'Error initializing settings', 'error');
      // After a delay, redirect to login
      setTimeout(() => {
        window.location.href = '../login.html';
      }, 3000);
      return;
    }
    
    // Set up event listeners
    setupEventListeners();
  }
  
  /**
   * Update UI elements with user data
   */
  function updateUserInterface() {
    // Set user email in header
    const userEmailElements = document.querySelectorAll('.user-email');
    userEmailElements.forEach(el => {
      el.textContent = userData.email;
    });
    
    // Set form values
    if (firstNameInput) firstNameInput.value = userData.firstName;
    if (lastNameInput) lastNameInput.value = userData.lastName;
    if (emailInput) emailInput.value = userData.email;
    
    // Update subscription info
    updateSubscriptionUI();
    
    // Load preferences
    loadPreferences();
  }
  
  /**
   * Update subscription UI based on user's plan
   */
  function updateSubscriptionUI() {
    const planStatus = document.querySelector('.plan-status');
    if (!planStatus) return;
    
    // Clear existing content
    planStatus.innerHTML = '';
    
    if (userData.plan === 'pro') {
      // Pro plan UI
      planStatus.innerHTML = `
        <div class="plan-badge pro">Pro Plan</div>
        <p>You're on the Pro plan with unlimited sites and all features.</p>
        <div class="subscription-details">
          <p>Subscription renews on ${getNextBillingDate()}</p>
          <button class="btn btn-sm btn-outline" id="manage-subscription">Manage Subscription</button>
        </div>
      `;
      
      // Hide upgrade button
      if (upgradeBtn) upgradeBtn.style.display = 'none';
      
      // Add event listener to manage subscription button
      const manageSubBtn = document.getElementById('manage-subscription');
      if (manageSubBtn) {
        manageSubBtn.addEventListener('click', handleManageSubscription);
      }
    } else {
      // Free trial UI
      planStatus.innerHTML = `
        <div class="plan-badge trial">Free Trial</div>
        <p>You have ${userData.trialDaysLeft} days left in your trial.</p>
        <div class="trial-limitations">
          <p>Current limitations:</p>
          <ul>
            <li>View and preview only (no saving)</li>
            <li>Limited to 3 sites</li>
            <li>10 AI queries per day</li>
          </ul>
        </div>
      `;
      
      // Show upgrade button
      if (upgradeBtn) {
        upgradeBtn.style.display = 'block';
        upgradeBtn.addEventListener('click', handleUpgradeClick);
      }
    }
  }
  
  /**
   * Get formatted next billing date (placeholder)
   */
  function getNextBillingDate() {
    // In a real implementation, this would come from the subscription data
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
  
  /**
   * Handle profile form submission
   * @param {Event} e - Form submit event
   */
  async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    
    if (!firstName || !lastName) {
      showNotification('Please enter both first and last name', 'warning');
      return;
    }
    
    // Show loading state
    const submitBtn = profileForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    
    try {
      // Update profile in Supabase
      const { data, error } = await supabaseService.supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id)
        .select();
      
      if (error) throw error;
      
      // Update local user data
      userData.firstName = firstName;
      userData.lastName = lastName;
      
      // Update user display in header
      const userNameDisplay = document.querySelector('.user-name');
      if (userNameDisplay) {
        userNameDisplay.textContent = `${firstName} ${lastName}`;
      }
      
      showNotification('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Profile update error:', error);
      showNotification(error.message || 'Failed to update profile', 'error');
    } finally {
      // Reset button state
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  }
  
  /**
   * Handle password form submission
   * @param {Event} e - Form submit event
   */
  async function handlePasswordUpdate(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validate passwords
    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotification('All password fields are required', 'warning');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showNotification('New passwords do not match', 'warning');
      return;
    }
    
    if (newPassword.length < 8) {
      showNotification('Password must be at least 8 characters', 'warning');
      return;
    }
    
    // Check password strength
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
    
    if (!(hasLowercase && hasUppercase && hasNumber && hasSpecial)) {
      showNotification('Password must include uppercase, lowercase, number, and special character', 'warning');
      return;
    }
    
    // Show loading state
    const submitBtn = passwordForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';
    
    try {
      // First verify the current password by signing in
      const { error: signInError } = await supabaseService.supabase.auth.signInWithPassword({
        email: userData.email,
        password: currentPassword
      });
      
      if (signInError) {
        throw new Error('Current password is incorrect');
      }
      
      // Update password in Supabase
      const { error: updateError } = await supabaseService.supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) throw updateError;
      
      // Clear form
      document.getElementById('current-password').value = '';
      document.getElementById('new-password').value = '';
      document.getElementById('confirm-password').value = '';
      
      showNotification('Password updated successfully', 'success');
    } catch (error) {
      console.error('Password update error:', error);
      showNotification(error.message || 'Failed to update password', 'error');
    } finally {
      // Reset button state
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  }
  
  /**
   * Handle editor preferences form submission
   */
  function handleEditorPrefsUpdate(e) {
    e.preventDefault();
    
    const theme = document.getElementById('theme').value;
    const fontSize = document.getElementById('font-size').value;
    const tabSize = document.getElementById('tab-size').value;
    const autoSave = document.getElementById('auto-save').checked;
    
    // Save preferences to localStorage
    const prefs = {
      theme,
      fontSize: parseInt(fontSize, 10),
      tabSize: parseInt(tabSize, 10),
      autoSave
    };
    
    localStorage.setItem('editorPreferences', JSON.stringify(prefs));
    showNotification('Editor preferences saved', 'success');
  }
  
  /**
   * Handle AI preferences form submission
   */
  function handleAIPrefsUpdate(e) {
    e.preventDefault();
    
    const aiModel = document.getElementById('ai-model').value;
    const autoSuggest = document.getElementById('auto-suggest').checked;
    
    // Save preferences to localStorage
    const prefs = {
      aiModel,
      autoSuggest
    };
    
    localStorage.setItem('aiPreferences', JSON.stringify(prefs));
    showNotification('AI preferences saved', 'success');
  }
  
  /**
   * Load user preferences from localStorage
   */
  function loadPreferences() {
    // Load editor preferences
    try {
      const editorPrefs = JSON.parse(localStorage.getItem('editorPreferences')) || {};
      
      if (document.getElementById('theme')) {
        document.getElementById('theme').value = editorPrefs.theme || 'light';
      }
      
      if (document.getElementById('font-size')) {
        document.getElementById('font-size').value = editorPrefs.fontSize || 14;
      }
      
      if (document.getElementById('tab-size')) {
        document.getElementById('tab-size').value = editorPrefs.tabSize || 2;
      }
      
      if (document.getElementById('auto-save')) {
        document.getElementById('auto-save').checked = editorPrefs.autoSave !== false;
      }
    } catch (error) {
      console.error('Error loading editor preferences:', error);
    }
    
    // Load AI preferences
    try {
      const aiPrefs = JSON.parse(localStorage.getItem('aiPreferences')) || {};
      
      if (document.getElementById('ai-model')) {
        document.getElementById('ai-model').value = aiPrefs.aiModel || 'default';
      }
      
      if (document.getElementById('auto-suggest')) {
        document.getElementById('auto-suggest').checked = aiPrefs.autoSuggest !== false;
      }
    } catch (error) {
      console.error('Error loading AI preferences:', error);
    }
  }
  
  /**
   * Handle tab switching
   */
  function handleTabClick(e) {
    e.preventDefault();
    
    const tabId = e.currentTarget.getAttribute('data-tab');
    
    // Update active tab in nav
    settingsNavItems.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-tab') === tabId) {
        item.classList.add('active');
      }
    });
    
    // Show active tab content
    settingsTabs.forEach(tab => {
      tab.classList.remove('active');
      if (tab.id === tabId) {
        tab.classList.add('active');
      }
    });
    
    // Update URL hash
    window.location.hash = tabId;
  }
  
  /**
   * Handle upgrade button click
   */
  function handleUpgradeClick() {
    // Redirect to upgrade page or show upgrade modal
    window.location.href = '../upgrade.html';
  }
  
  /**
   * Handle manage subscription click
   */
  function handleManageSubscription() {
    // In a real implementation, this would redirect to a Stripe customer portal
    showNotification('Subscription management coming soon', 'info');
  }
  
  /**
   * Handle user logout
   */
  async function handleLogout() {
    try {
      // Show loading state
      const logoutBtn = document.querySelector('.logout-btn');
      if (logoutBtn) {
        logoutBtn.disabled = true;
        logoutBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M16 12h2"></path>
            <path d="M8 12h2"></path>
            <path d="M12 16v2"></path>
            <path d="M12 8v2"></path>
          </svg>
        `;
      }
      
      // Clear any stored tokens or user data from localStorage
      memoryService.remove('userSession');
      memoryService.remove('userProfile');
      
      // Sign out from Supabase
      const { error } = await supabaseService.supabase.auth.signOut();
      
      if (error) throw error;
      
      // Redirect to login page
      window.location.href = '../login.html';
    } catch (error) {
      console.error('Logout error:', error);
      showNotification(error.message || 'Failed to log out', 'error');
      
      // Re-enable logout button if there was an error
      const logoutBtn = document.querySelector('.logout-btn');
      if (logoutBtn) {
        logoutBtn.disabled = false;
        logoutBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        `;
      }
    }
  }
  
  /**
   * Toggle theme (light/dark)
   */
  function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    // Save preference to localStorage
    const isDarkTheme = document.body.classList.contains('dark-theme');
    localStorage.setItem('darkTheme', isDarkTheme);
  }
  
  /**
   * Load theme preference
   */
  function loadThemePreference() {
    const isDarkTheme = localStorage.getItem('darkTheme') === 'true';
    if (isDarkTheme) {
      document.body.classList.add('dark-theme');
    }
  }
  
  /**
   * Add logout button to user menu
   */
  function setupUserMenu() {
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
      const logoutButton = document.createElement('button');
      logoutButton.className = 'btn-icon logout-btn';
      logoutButton.setAttribute('aria-label', 'Log out');
      logoutButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      `;
      userMenu.appendChild(logoutButton);
      
      logoutButton.addEventListener('click', handleLogout);
    }
  }
  
  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    // Tab navigation
    settingsNavItems.forEach(item => {
      item.addEventListener('click', handleTabClick);
    });
    
    // Form submissions
    if (profileForm) {
      profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    if (passwordForm) {
      passwordForm.addEventListener('submit', handlePasswordUpdate);
    }
    
    if (editorPrefsForm) {
      editorPrefsForm.addEventListener('submit', handleEditorPrefsUpdate);
    }
    
    if (aiPrefsForm) {
      aiPrefsForm.addEventListener('submit', handleAIPrefsUpdate);
    }
    
    // Theme toggle
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Setup user menu with logout button
    setupUserMenu();
    
    // Check URL hash for active tab
    if (window.location.hash) {
      const tabId = window.location.hash.substring(1);
      const tabLink = document.querySelector(`.settings-nav-item[data-tab="${tabId}"]`);
      if (tabLink) {
        tabLink.click();
      }
    }
  }
  
  /**
   * Show notification
   */
  function showNotification(message, type = 'info') {
    // Check if notification container exists, create if not
    let notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.className = 'notification-container';
      document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
      </div>
      <button class="notification-close">&times;</button>
    `;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Add close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.classList.add('notification-hiding');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.add('notification-hiding');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 5000);
  }
  
  // Initialize
  loadThemePreference();
  initSettings();
});
