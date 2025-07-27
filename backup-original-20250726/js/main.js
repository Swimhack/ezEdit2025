/**
 * EzEdit.co Main JavaScript
 * Core functionality for the application
 */

// Global application object
window.EzEdit = {
    config: {
        apiBaseUrl: '/api',
        supabaseUrl: '', // Will be set from environment
        supabaseKey: '', // Will be set from environment
    },
    
    // Initialize the application
    init() {
        this.setupEventListeners();
        this.initializeComponents();
    },
    
    // Set up global event listeners
    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (mobileMenuToggle && navMenu) {
            mobileMenuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMobileMenu(navMenu);
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!navMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                    navMenu.classList.remove('mobile-open');
                }
            });
            
            // Close menu when clicking on nav links
            navMenu.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('mobile-open');
                });
            });
        }
        
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    },
    
    // Initialize components
    initializeComponents() {
        // Initialize any components that need setup
        this.initializeTooltips();
        this.initializeAnimations();
    },
    
    // Initialize tooltips
    initializeTooltips() {
        // Simple tooltip implementation
        document.querySelectorAll('[title]').forEach(element => {
            element.addEventListener('mouseenter', function() {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = this.getAttribute('title');
                tooltip.style.cssText = `
                    position: absolute;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    z-index: 1000;
                    pointer-events: none;
                `;
                document.body.appendChild(tooltip);
                
                const rect = this.getBoundingClientRect();
                tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
                tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
                
                this._tooltip = tooltip;
            });
            
            element.addEventListener('mouseleave', function() {
                if (this._tooltip) {
                    document.body.removeChild(this._tooltip);
                    this._tooltip = null;
                }
            });
        });
    },
    
    // Initialize animations
    initializeAnimations() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        // Observe elements with fade-in class
        document.querySelectorAll('.fade-in').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    },
    
    // Toggle mobile menu
    toggleMobileMenu(menu) {
        if (menu) {
            menu.classList.toggle('mobile-open');
        }
    },
    
    // Utility functions
    utils: {
        // Show notification
        showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 1000;
                transform: translateX(100%);
                transition: transform 0.3s ease;
            `;
            
            // Set background color based on type
            const colors = {
                info: '#3b82f6',
                success: '#10b981',
                warning: '#f59e0b',
                error: '#ef4444'
            };
            notification.style.background = colors[type] || colors.info;
            
            document.body.appendChild(notification);
            
            // Slide in
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 100);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, 5000);
        },
        
        // Format date
        formatDate(date) {
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }).format(new Date(date));
        },
        
        // Debounce function
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        // Throttle function
        throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.EzEdit.init();
});

// Global logout function
window.logout = function() {
    sessionStorage.clear();
    localStorage.removeItem('ezedit_remember_token');
    localStorage.removeItem('ezedit_demo_user');
    window.location.href = '/auth/logout.php';
};

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.EzEdit;
}