/**
 * EzEdit Standardized Header Component
 * Provides consistent header across all pages with dynamic navigation based on auth state
 */

class EzEditHeader extends HTMLElement {
  constructor() {
    super();
    this.authService = window.ezEdit && window.ezEdit.authService;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  isAuthenticated() {
    return this.authService && this.authService.isAuthenticated();
  }

  getCurrentUser() {
    return this.authService && this.authService.getUser();
  }

  render() {
    const isAuth = this.isAuthenticated();
    const currentPath = window.location.pathname;
    const user = this.getCurrentUser();
    
    // Determine which navigation links to show based on auth state and current path
    let navLinks = '';
    
    if (isAuth) {
      // Authenticated user navigation
      navLinks = `
        <nav class="nav-links">
          <a href="dashboard.php" class="${currentPath.includes('dashboard') ? 'active' : ''}">Dashboard</a>
          <a href="editor.php" class="${currentPath.includes('editor') ? 'active' : ''}">Editor</a>
          <a href="settings.php" class="${currentPath.includes('settings') ? 'active' : ''}">Settings</a>
        </nav>
        <div class="user-menu">
          <span class="user-email text-sm text-muted">${user ? user.email : ''}</span>
          <button class="theme-toggle" aria-label="Toggle dark mode">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          </button>
          <button class="btn-outline btn-sm logout-btn">Log out</button>
        </div>
      `;
    } else if (currentPath.includes('login') || currentPath.includes('signup') || currentPath.includes('reset-password')) {
      // Auth page navigation
      navLinks = `
        <nav class="nav-links">
          <a href="index.php">Home</a>
          <a href="index.php#features">Features</a>
          <a href="index.php#pricing">Pricing</a>
          <a href="docs/index.php">Docs</a>
        </nav>
      `;
    } else {
      // Public page navigation
      navLinks = `
        <nav class="nav-links">
          <a href="index.php#features" class="${currentPath === '/' && location.hash === '#features' ? 'active' : ''}">Features</a>
          <a href="index.php#pricing" class="${currentPath === '/' && location.hash === '#pricing' ? 'active' : ''}">Pricing</a>
          <a href="docs/index.php" class="${currentPath.includes('docs') ? 'active' : ''}">Docs</a>
        </nav>
        <div class="nav-auth">
          <a href="login.php" class="btn-outline">Log in</a>
          <a href="signup.php" class="btn">Sign up</a>
        </div>
      `;
    }
    
    this.innerHTML = `
      <header class="header">
        <div class="container">
          <div class="nav-container">
            <h1 class="logo">
              <a href="${isAuth ? 'dashboard.php' : 'index.php'}">
                <span class="logo-icon">Ez</span> <span class="logo-text">Edit.co</span>
              </a>
            </h1>
            ${navLinks}
          </div>
        </div>
      </header>
    `;
  }
  
  setupEventListeners() {
    // Theme toggle
    const themeToggle = this.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('ezEditDarkMode', isDarkMode ? 'true' : 'false');
      });
    }
    
    // Logout button
    const logoutBtn = this.querySelector('.logout-btn');
    if (logoutBtn && this.authService) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await this.authService.signOut();
          window.location.href = '../';
        } catch (error) {
          console.error('Logout error:', error);
        }
      });
    }
  }
}

// Define the custom element
customElements.define('ez-header', EzEditHeader);

// Initialize dark mode from localStorage
document.addEventListener('DOMContentLoaded', () => {
  const isDarkMode = localStorage.getItem('ezEditDarkMode') === 'true';
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
  }
});
