/**
 * EzEdit Main Application
 * Initializes services and provides global functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize services
  const memoryService = new MemoryService();
  const apiService = new ApiService();
  const emailService = new EmailService();
  const subscriptionService = new SubscriptionService();
  const digitalOceanService = new DigitalOceanService();
  
  // Make services available globally
  window.ezEdit = {
    memory: memoryService,
    api: apiService,
    email: emailService,
    subscription: subscriptionService,
    digitalOcean: digitalOceanService,
    config: EzEditConfig
  };
  
  // Initialize UI
  initializeUI();
  
  // Set up global event listeners
  setupGlobalEventListeners();
  
  // Check authentication state
  checkAuthState();
});

/**
 * Initialize UI components
 */
function initializeUI() {
  // Set user email in header if authenticated
  updateUserInfo();
  
  // Initialize theme
  loadThemePreference();
  
  // Initialize modals
  initializeModals();
  
  // Initialize dropdowns
  initializeDropdowns();
}

/**
 * Update user info in UI
 */
function updateUserInfo() {
  const auth = JSON.parse(localStorage.getItem(EzEditConfig.memoryKeys.authState) || '{}');
  const isAuthenticated = auth.isAuthenticated && auth.token && auth.expiresAt > Date.now();
  
  if (isAuthenticated) {
    // Update user email display
    const userEmailElements = document.querySelectorAll('.user-email');
    userEmailElements.forEach(el => {
      el.textContent = auth.user.email;
    });
    
    // Update plan badge if exists
    const planBadge = document.querySelector('.plan-badge');
    if (planBadge) {
      planBadge.textContent = auth.user.plan === 'pro' ? 'Pro' : 
                             auth.user.plan === 'one-time' ? 'Single Site' : 'Trial';
      planBadge.className = `plan-badge ${auth.user.plan}`;
    }
    
    // Update trial days if on free trial
    if (auth.user.plan === 'free-trial') {
      const trialDaysElements = document.querySelectorAll('.trial-days');
      trialDaysElements.forEach(el => {
        el.textContent = auth.user.trialDaysLeft;
      });
    }
  }
}

/**
 * Set up global event listeners
 */
function setupGlobalEventListeners() {
  // Theme toggle
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // User menu toggle
  const userMenuToggle = document.querySelector('.user-menu-toggle');
  const userMenu = document.querySelector('.user-menu');
  if (userMenuToggle && userMenu) {
    userMenuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenu.classList.toggle('active');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', () => {
      userMenu.classList.remove('active');
    });
  }
  
  // Logout button
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Mobile menu toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('active');
    });
  }
}

/**
 * Initialize modals
 */
function initializeModals() {
  // Get all modal triggers
  const modalTriggers = document.querySelectorAll('[data-modal]');
  
  // Add click event to each trigger
  modalTriggers.forEach(trigger => {
    const modalId = trigger.dataset.modal;
    const modal = document.getElementById(modalId);
    
    if (modal) {
      // Open modal on trigger click
      trigger.addEventListener('click', () => {
        openModal(modal);
      });
      
      // Close button in modal
      const closeBtn = modal.querySelector('.close-modal');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          closeModal(modal);
        });
      }
      
      // Close on click outside
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(modal);
        }
      });
    }
  });
}

/**
 * Initialize dropdowns
 */
function initializeDropdowns() {
  // Get all dropdown triggers
  const dropdownTriggers = document.querySelectorAll('.dropdown-trigger');
  
  // Add click event to each trigger
  dropdownTriggers.forEach(trigger => {
    const dropdown = trigger.nextElementSibling;
    
    if (dropdown && dropdown.classList.contains('dropdown-menu')) {
      // Toggle dropdown on trigger click
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
      });
    }
  });
  
  // Close all dropdowns when clicking outside
  document.addEventListener('click', () => {
    const dropdowns = document.querySelectorAll('.dropdown-menu');
    dropdowns.forEach(dropdown => {
      dropdown.classList.remove('active');
    });
  });
}

/**
 * Open modal
 * @param {HTMLElement} modal - Modal element
 */
function openModal(modal) {
  modal.classList.add('active');
  document.body.classList.add('modal-open');
}

/**
 * Close modal
 * @param {HTMLElement} modal - Modal element
 */
function closeModal(modal) {
  modal.classList.remove('active');
  document.body.classList.remove('modal-open');
}

/**
 * Toggle theme (light/dark)
 */
function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  
  // Save preference to localStorage
  const isDarkTheme = document.body.classList.contains('dark-theme');
  localStorage.setItem('darkTheme', isDarkTheme);
  
  // Update Monaco editor theme if it exists
  if (window.monaco && window.editor) {
    monaco.editor.setTheme(isDarkTheme ? EzEditConfig.editor.darkTheme : EzEditConfig.editor.theme);
  }
}

/**
 * Check for saved theme preference
 */
function loadThemePreference() {
  const isDarkTheme = localStorage.getItem('darkTheme') === 'true';
  if (isDarkTheme) {
    document.body.classList.add('dark-theme');
  }
}

/**
 * Handle logout
 */
function handleLogout() {
  // Clear auth state
  localStorage.removeItem(EzEditConfig.memoryKeys.authState);
  
  // Redirect to login page
  window.location.href = 'login.html';
}

/**
 * Check authentication state
 */
function checkAuthState() {
  const auth = JSON.parse(localStorage.getItem(EzEditConfig.memoryKeys.authState) || '{}');
  const isAuthenticated = auth.isAuthenticated && auth.token && auth.expiresAt > Date.now();
  
  // Redirect if needed
  const currentPath = window.location.pathname;
  
  // If not authenticated and trying to access protected pages
  if (!isAuthenticated && (currentPath.includes('dashboard') || currentPath.includes('editor') || currentPath.includes('settings'))) {
    window.location.href = 'login.html?redirect=' + encodeURIComponent(currentPath);
  }
  
  // If authenticated and trying to access login/signup pages
  if (isAuthenticated && (currentPath.includes('login') || currentPath.includes('signup'))) {
    window.location.href = 'dashboard.html';
  }
}

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (info, success, warning, error)
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

// Make helper functions available globally
window.openModal = openModal;
window.closeModal = closeModal;
window.showNotification = showNotification;
