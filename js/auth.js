/**
 * EzEdit.co Authentication JavaScript
 * Handles login, registration, and authentication flows
 */

class AuthService {
    constructor() {
        this.supabase = null;
        this.init();
    }
    
    async init() {
        // Initialize Supabase if available
        if (typeof window.supabase !== 'undefined') {
            const supabaseUrl = 'https://sctsykgcfkhadowygcrj.supabase.co';
            const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdHN5a2djZmtoYWRvd3lnY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NzE4NzAsImV4cCI6MjA1MjU0Nzg3MH0.kLo2WzWF_yJRxS9WKEy35zt7NaGNFOp8TCkS_pCdNRs';
            
            try {
                this.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
                console.log('Supabase initialized successfully');
            } catch (error) {
                console.error('Failed to initialize Supabase:', error);
            }
        }
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Handle login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            this.setupLoginForm(loginForm);
        }
        
        // Handle registration form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            this.setupRegisterForm(registerForm);
        }
        
        // Handle password toggles
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            this.setupPasswordToggle(toggle);
        });
        
        // Handle error message close buttons
        document.querySelectorAll('.error-close').forEach(button => {
            button.addEventListener('click', () => {
                button.closest('.error-message').style.display = 'none';
            });
        });
    }
    
    setupLoginForm(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = form.querySelector('#email').value;
            const password = form.querySelector('#password').value;
            const remember = form.querySelector('#remember')?.checked || false;
            
            await this.handleLogin(email, password, remember);
        });
    }
    
    setupRegisterForm(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fullName = form.querySelector('#fullName')?.value || '';
            const email = form.querySelector('#email').value;
            const password = form.querySelector('#password').value;
            
            await this.handleRegister(fullName, email, password);
        });
    }
    
    setupPasswordToggle(toggle) {
        toggle.addEventListener('click', () => {
            const passwordInput = toggle.parentElement.querySelector('input[type="password"], input[type="text"]');
            if (passwordInput) {
                const isPassword = passwordInput.type === 'password';
                passwordInput.type = isPassword ? 'text' : 'password';
                
                // Update button appearance
                toggle.style.opacity = isPassword ? '0.7' : '1';
                
                // Update icon if needed
                const icon = toggle.querySelector('svg');
                if (icon) {
                    // Toggle eye icon appearance (you could swap icons here)
                    icon.style.opacity = isPassword ? '0.7' : '1';
                }
            }
        });
    }
    
    async handleLogin(email, password, remember) {
        this.showLoading(true);
        this.hideError();
        
        try {
            // Validate inputs
            if (!this.validateLoginInputs(email, password)) {
                return;
            }
            
            let result;
            
            if (this.supabase) {
                // Use Supabase authentication
                result = await this.supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (result.error) {
                    throw new Error(result.error.message);
                }
                
                // Store session info if remember is checked
                if (remember) {
                    localStorage.setItem('ezedit_remember', 'true');
                }
                
                // Redirect to dashboard
                window.location.href = '/dashboard.php';
                
            } else {
                // Fallback demo authentication
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                if (email && password.length >= 6) {
                    // Demo success
                    if (remember) {
                        localStorage.setItem('ezedit_demo_user', email);
                    }
                    sessionStorage.setItem('ezedit_logged_in', 'true');
                    window.location.href = '/dashboard.php';
                } else {
                    throw new Error('Invalid email or password. Please check your credentials and try again.');
                }
            }
            
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    async handleRegister(fullName, email, password) {
        this.showLoading(true);
        this.hideError();
        
        try {
            // Validate inputs
            if (!this.validateRegisterInputs(fullName, email, password)) {
                return;
            }
            
            if (this.supabase) {
                // Use Supabase authentication
                const result = await this.supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: fullName
                        }
                    }
                });
                
                if (result.error) {
                    throw new Error(result.error.message);
                }
                
                // Show success message
                this.showSuccess('Account created successfully! Please check your email to verify your account.');
                
                // Redirect to login after delay
                setTimeout(() => {
                    window.location.href = '/auth/login.php';
                }, 3000);
                
            } else {
                // Fallback demo registration
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Demo success
                sessionStorage.setItem('ezedit_logged_in', 'true');
                this.showSuccess('Account created successfully! (Demo mode)');
                
                setTimeout(() => {
                    window.location.href = '/dashboard.php';
                }, 2000);
            }
            
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    validateLoginInputs(email, password) {
        if (!email) {
            this.showError('Please enter your email address.');
            return false;
        }
        
        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address.');
            return false;
        }
        
        if (!password) {
            this.showError('Please enter your password.');
            return false;
        }
        
        if (password.length < 6) {
            this.showError('Password must be at least 6 characters long.');
            return false;
        }
        
        return true;
    }
    
    validateRegisterInputs(fullName, email, password) {
        if (!fullName || fullName.trim().length < 2) {
            this.showError('Please enter your full name (at least 2 characters).');
            return false;
        }
        
        if (!email) {
            this.showError('Please enter your email address.');
            return false;
        }
        
        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address.');
            return false;
        }
        
        if (!password) {
            this.showError('Please enter a password.');
            return false;
        }
        
        if (password.length < 8) {
            this.showError('Password must be at least 8 characters long.');
            return false;
        }
        
        if (!this.isStrongPassword(password)) {
            this.showError('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
            return false;
        }
        
        return true;
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    isStrongPassword(password) {
        // At least 8 characters, one uppercase, one lowercase, one number
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
        return strongRegex.test(password);
    }
    
    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }
        
        // Disable form buttons during loading
        const submitButtons = document.querySelectorAll('button[type="submit"]');
        submitButtons.forEach(button => {
            button.disabled = show;
            if (show) {
                button.dataset.originalText = button.textContent;
                button.textContent = 'Please wait...';
            } else {
                button.textContent = button.dataset.originalText || button.textContent;
            }
        });
    }
    
    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        if (errorMessage && errorText) {
            errorText.textContent = message;
            errorMessage.style.display = 'flex';
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                this.hideError();
            }, 10000);
        } else {
            // Fallback to alert if error elements don't exist
            alert('Error: ' + message);
        }
    }
    
    showSuccess(message) {
        // Create success message if it doesn't exist
        let successMessage = document.getElementById('successMessage');
        if (!successMessage) {
            successMessage = document.createElement('div');
            successMessage.id = 'successMessage';
            successMessage.className = 'success-message';
            successMessage.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 12l2 2 4-4"></path>
                    <circle cx="12" cy="12" r="10"></circle>
                </svg>
                <span id="successText">${message}</span>
            `;
            document.querySelector('.auth-card').appendChild(successMessage);
        }
        
        const successText = document.getElementById('successText');
        if (successText) {
            successText.textContent = message;
        }
        
        successMessage.style.display = 'flex';
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 8000);
    }
    
    hideError() {
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    }
    
    // Utility method to check if user is logged in
    isLoggedIn() {
        if (this.supabase) {
            // Check Supabase session
            return this.supabase.auth.getSession().then(({ data: { session } }) => {
                return !!session;
            });
        } else {
            // Check demo session
            return sessionStorage.getItem('ezedit_logged_in') === 'true';
        }
    }
    
    // Logout method
    async logout() {
        if (this.supabase) {
            await this.supabase.auth.signOut();
        }
        
        // Clear all stored data
        sessionStorage.clear();
        localStorage.removeItem('ezedit_demo_user');
        localStorage.removeItem('ezedit_remember');
        
        // Redirect to home page
        window.location.href = '/index.php';
    }
}

// Initialize auth service when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.authService = new AuthService();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthService;
}