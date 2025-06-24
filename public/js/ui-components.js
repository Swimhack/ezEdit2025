/**
 * EzEdit UI Components
 * Main JavaScript file for loading components and ensuring UI consistency
 */

// Initialize the EzEdit namespace if it doesn't exist
window.ezEdit = window.ezEdit || {};

// UI Components module
window.ezEdit.ui = (function() {
  // Private variables
  let initialized = false;
  
  /**
   * Initialize UI components
   */
  function init() {
    if (initialized) return;
    
    // Load components
    loadComponents();
    
    // Apply consistent styling
    applyConsistentStyling();
    
    // Initialize theme
    initializeTheme();
    
    // Mark as initialized
    initialized = true;
    console.log('EzEdit UI components initialized');
  }
  
  /**
   * Load Web Components
   */
  function loadComponents() {
    // Check if components are already loaded
    if (customElements.get('ez-header') && customElements.get('ez-footer')) {
      return;
    }
    
    // Dynamically load component scripts if not already loaded
    const componentScripts = [
      'components/header.js',
      'components/footer.js'
    ];
    
    componentScripts.forEach(src => {
      if (!document.querySelector(`script[src="${src}"]`)) {
        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        document.head.appendChild(script);
      }
    });
  }
  
  /**
   * Apply consistent styling to the page
   */
  function applyConsistentStyling() {
    // Ensure all buttons have proper hover effects
    const buttons = document.querySelectorAll('.btn, .btn-outline, .btn-accent');
    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        button.style.transition = 'all var(--transition-fast)';
      });
    });
    
    // Ensure all form inputs have consistent focus styles
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        input.style.borderColor = 'var(--clr-primary)';
        input.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.2)';
      });
      
      input.addEventListener('blur', () => {
        input.style.boxShadow = 'none';
        if (!input.value) {
          input.style.borderColor = 'var(--clr-border)';
        }
      });
    });
    
    // Ensure all cards have consistent hover effects
    const cards = document.querySelectorAll('.card, .pricing-card');
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow = 'var(--shadow-md)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'var(--shadow-sm)';
      });
    });
  }
  
  /**
   * Initialize theme (light/dark mode)
   */
  function initializeTheme() {
    // Check for saved theme preference
    const isDarkMode = localStorage.getItem('ezEditDarkMode') === 'true';
    
    // Apply theme
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    // Add theme toggle functionality to any theme toggle buttons
    const themeToggles = document.querySelectorAll('.theme-toggle');
    themeToggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('ezEditDarkMode', isDarkMode ? 'true' : 'false');
      });
    });
  }
  
  /**
   * Show a toast notification
   * @param {string} message - Message to display
   * @param {string} type - Type of toast (success, error, warning)
   * @param {number} duration - Duration in milliseconds
   */
  function showToast(message, type = 'success', duration = 3000) {
    // Remove any existing toasts
    const existingToast = document.querySelector('.ez-toast');
    if (existingToast) {
      existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `ez-toast toast-${type}`;
    toast.textContent = message;
    
    // Add to document
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Hide and remove after duration
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  }
  
  // Public API
  return {
    init,
    showToast
  };
})();

// Initialize UI components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.ezEdit.ui.init();
});
