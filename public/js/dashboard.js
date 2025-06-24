/**
 * EzEdit Dashboard JavaScript
 * Handles site management, modal interactions, and dashboard functionality
 * Integrated with Supabase authentication and database
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize services
  const memoryService = new MemoryService();
  const supabaseService = new SupabaseService(memoryService);
  // DOM Elements
  const addSiteBtn = document.getElementById('add-site-btn');
  const addSiteCard = document.getElementById('add-site-card');
  const addSiteModal = document.getElementById('add-site-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const addSiteForm = document.getElementById('add-site-form');
  const testConnectionBtn = document.getElementById('test-connection');
  
  // User data object to store user information
  let userData = {
    email: '',
    plan: 'free-trial',
    trialDaysLeft: 7,
    sites: []
  };

  // Load subscription status
  async function loadSubscriptionStatus() {
    try {
      const subscriptionStatusEl = document.getElementById('subscription-status');
      if (!subscriptionStatusEl) return;

      const subscription = window.ezEdit.subscription;
      const currentPlan = subscription.getCurrentPlan();
      const planDetails = subscription.getPlanDetails(currentPlan);
      
      // Check if user is admin
      const isAdmin = subscription.isAdminUser();
      
      let statusHTML = '';
      
      if (isAdmin) {
        statusHTML = `
          <div class="subscription-badge admin">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            <span>Admin</span>
          </div>
          <div class="subscription-info">
            <p>Administrator Account</p>
            <small>Unlimited access to all features</small>
          </div>
        `;
      } else {
        const maxSites = subscription.getMaxSites();
        const canSave = subscription.canSaveFiles();
        
        statusHTML = `
          <div class="subscription-badge ${currentPlan}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <span>${planDetails.name}</span>
          </div>
          <div class="subscription-info">
            <p>${planDetails.name} Plan</p>
            <small>${maxSites === Infinity ? 'Unlimited sites' : `Up to ${maxSites} sites`} • ${canSave ? 'Can save files' : 'View only'}</small>
          </div>
        `;
        
        // Add upgrade button for non-pro users
        if (currentPlan !== 'pro') {
          statusHTML += `
            <a href="pricing.html" class="btn btn-outline btn-sm">Upgrade</a>
          `;
        }
      }
      
      subscriptionStatusEl.innerHTML = statusHTML;
      
    } catch (error) {
      console.error('Error loading subscription status:', error);
      const subscriptionStatusEl = document.getElementById('subscription-status');
      if (subscriptionStatusEl) {
        subscriptionStatusEl.innerHTML = `
          <div class="subscription-badge error">
            <span>Error</span>
          </div>
        `;
      }
    }
  }

  // Initialize the dashboard
  async function initDashboard() {
    try {
      // Check if user is authenticated
      const session = await supabaseService.getSession();
      
      if (!session) {
        // Redirect to login if not authenticated
        window.location.href = '../login.html';
        return;
      }
      
      // Get user profile
      const profile = await supabaseService.getUserProfile();
      
      if (profile) {
        userData.email = profile.email;
        userData.plan = profile.plan || 'free-trial';
        userData.trialDaysLeft = profile.trial_days_left || 7;
        
        // Set user email in header
        const userEmailElements = document.querySelectorAll('.user-email');
        userEmailElements.forEach(el => {
          el.textContent = userData.email;
        });
        
        // Load user sites
        await loadUserSites();
        
        // Load subscription status
        await loadSubscriptionStatus();
        
        // Render site cards
        renderSiteCards();
      } else {
        showNotification('Error loading user profile', 'error');
      }
    } catch (error) {
      console.error('Dashboard initialization error:', error);
      showNotification('Error initializing dashboard', 'error');
    }
    
    // Set up event listeners
    setupEventListeners();
  }

  // Render site cards based on user data
  function renderSiteCards() {
    // Get container for site cards
    const container = document.querySelector('.grid');
    
    // Clear existing cards except the add site card
    const existingCards = container.querySelectorAll('.site-card:not(.add-site-card)');
    existingCards.forEach(card => card.remove());
    
    // Get the add site card so we can insert before it
    const addSiteCard = document.getElementById('add-site-card');
    
    // Create cards for each site
    userData.sites.forEach(site => {
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
          <a href="/editor.html?site=${encodeURIComponent(site.id)}" class="btn">Open Editor</a>
          <button class="btn-icon site-settings" data-site-id="${site.id}" aria-label="Site settings">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </button>
        </div>
      `;
      
      // Insert before the add site card
      container.insertBefore(card, addSiteCard);
      
      // Add event listener to settings button
      const settingsBtn = card.querySelector('.site-settings');
      settingsBtn.addEventListener('click', () => {
        // Handle site settings - would open a modal in a full implementation
        showNotification('Site settings coming soon!', 'info');
      });
    });
  }

  // Set up event listeners
  function setupEventListeners() {
    // Open add site modal
    addSiteBtn.addEventListener('click', () => {
      openModal(addSiteModal);
    });

    // Add site card click also opens modal
    addSiteCard.addEventListener('click', () => {
      openModal(addSiteModal);
    });

    // Close modal
    closeModalBtn.addEventListener('click', () => {
      closeModal(addSiteModal);
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target === addSiteModal) {
        closeModal(addSiteModal);
      }
    });

    // Handle form submission
    addSiteForm.addEventListener('submit', handleAddSite);

    // Test connection button
    testConnectionBtn.addEventListener('click', testFtpConnection);

    // Theme toggle
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }
  }

  // Open modal
  function openModal(modal) {
    modal.classList.add('active');
    document.body.classList.add('modal-open');
  }

  // Close modal
  function closeModal(modal) {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }

  // Handle add site form submission
  async function handleAddSite(e) {
    e.preventDefault();
    
    // Get form values
    const siteName = document.getElementById('site-name').value;
    const ftpHost = document.getElementById('ftp-host').value;
    const ftpPort = document.getElementById('ftp-port').value;
    const ftpPassive = document.getElementById('ftp-passive').checked;
    const ftpUsername = document.getElementById('ftp-username').value;
    const ftpPassword = document.getElementById('ftp-password').value;
    
    // Validate form (basic validation)
    if (!siteName || !ftpHost || !ftpUsername || !ftpPassword) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    
    // Show loading notification
    showNotification('Adding site...', 'info');
    
    try {
      // Create new site using Supabase service
      const newSite = await supabaseService.createSite({
        name: siteName,
        host: ftpHost,
        port: parseInt(ftpPort, 10),
        username: ftpUsername,
        password: ftpPassword,
        passive: ftpPassive,
        secure: false // Default to non-secure FTP
      });
      
      if (newSite) {
        // Show success message
        showNotification('Site added successfully!', 'success');
        
        // Close modal and reset form
        closeModal(addSiteModal);
        addSiteForm.reset();
        
        // Reload sites and refresh site cards
        await loadUserSites();
        renderSiteCards();
        
        // Redirect to the editor
        setTimeout(() => {
          window.location.href = `/editor.html?site=${encodeURIComponent(newSite.id)}`;
        }, 1000);
      } else {
        showNotification('Error adding site', 'error');
      }
    } catch (error) {
      console.error('Error adding site:', error);
      showNotification('Error adding site: ' + (error.message || 'Unknown error'), 'error');
    }
  }

  // Test FTP connection
  async function testFtpConnection() {
    // Get form values
    const ftpHost = document.getElementById('ftp-host').value;
    const ftpPort = document.getElementById('ftp-port').value;
    const ftpUsername = document.getElementById('ftp-username').value;
    const ftpPassword = document.getElementById('ftp-password').value;
    const ftpPassive = document.getElementById('ftp-passive').checked;
    
    // Validate form (basic validation)
    if (!ftpHost || !ftpUsername || !ftpPassword) {
      showNotification('Please fill in host, username, and password', 'error');
      return;
    }
    
    // Show testing message
    showNotification('Testing connection...', 'info');
    
    try {
      // Make API call to test the connection
      const response = await fetch('/api.php?action=ftp&method=test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          host: ftpHost,
          port: parseInt(ftpPort, 10),
          username: ftpUsername,
          password: ftpPassword,
          passive: ftpPassive
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showNotification('Connection successful!', 'success');
      } else {
        showNotification(`Connection failed: ${result.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      showNotification('Connection test failed. Please try again.', 'error');
    }
  }

  // Show notification
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

  // Toggle theme (light/dark)
  function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    // Save preference to localStorage
    const isDarkTheme = document.body.classList.contains('dark-theme');
    localStorage.setItem('darkTheme', isDarkTheme);
  }

  // Check for saved theme preference
  function loadThemePreference() {
    const isDarkTheme = localStorage.getItem('darkTheme') === 'true';
    if (isDarkTheme) {
      document.body.classList.add('dark-theme');
    }
  }

  // Load user sites from Supabase
  async function loadUserSites() {
    try {
      const sites = await supabaseService.getUserSites();
      if (sites) {
        userData.sites = sites;
      } else {
        userData.sites = [];
        showNotification('No sites found or error loading sites', 'info');
      }
    } catch (error) {
      console.error('Error loading sites:', error);
      userData.sites = [];
      showNotification('Error loading sites', 'error');
    }
  }
  
  // Handle user logout
  async function handleLogout() {
    try {
      await supabaseService.signOut();
      window.location.href = '../login.html';
    } catch (error) {
      console.error('Error signing out:', error);
      showNotification('Error signing out', 'error');
    }
  }
  
  // Add logout button to user menu
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
  
  // Setup event listeners
  function setupEventListeners() {
    // Open add site modal
    addSiteBtn.addEventListener('click', () => {
      openModal(addSiteModal);
    });

    // Add site card click also opens modal
    addSiteCard.addEventListener('click', () => {
      openModal(addSiteModal);
    });

    // Close modal
    closeModalBtn.addEventListener('click', () => {
      closeModal(addSiteModal);
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target === addSiteModal) {
        closeModal(addSiteModal);
      }
    });

    // Handle form submission
    addSiteForm.addEventListener('submit', handleAddSite);

    // Test connection button
    testConnectionBtn.addEventListener('click', testFtpConnection);

    // Theme toggle
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Setup user menu with logout button
    setupUserMenu();
  }
  
  // Initialize dashboard
  loadThemePreference();
  await initDashboard();
});
