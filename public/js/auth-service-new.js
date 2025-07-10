/**
 * EzEdit Authentication Service
 * Handles JWT-based authentication for the API
 */

window.ezEdit = window.ezEdit || {};

window.ezEdit.authService = (function() {
    // Private variables
    let authToken = null;
    let currentUser = null;
    let isAuthenticated = false;
    
    const AUTH_API_URL = '/auth';
    const TOKEN_STORAGE_KEY = 'ezedit_auth_token';
    const USER_STORAGE_KEY = 'ezedit_user_data';
    
    /**
     * Initialize auth service by checking for existing token
     */
    function init() {
        // Check for existing token in localStorage
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        
        if (storedToken && storedUser) {
            try {
                authToken = storedToken;
                currentUser = JSON.parse(storedUser);
                isAuthenticated = true;
                
                // Verify token is still valid
                verifyToken().then(result => {
                    if (!result.success) {
                        logout();
                    }
                }).catch(() => {
                    logout();
                });
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                logout();
            }
        }
    }
    
    /**
     * Login with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} Login result
     */
    async function login(email, password) {
        try {
            const response = await fetch(`${AUTH_API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                authToken = data.data.token;
                currentUser = data.data.user;
                isAuthenticated = true;
                
                // Store in localStorage
                localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
                
                console.log('Login successful');
                return { success: true, user: currentUser };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Login failed: ' + error.message };
        }
    }
    
    /**
     * Demo login for testing (remove in production)
     * @returns {Promise<Object>} Login result
     */
    async function demoLogin() {
        try {
            const response = await fetch(`${AUTH_API_URL}/demo-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                authToken = data.data.token;
                currentUser = data.data.user;
                isAuthenticated = true;
                
                // Store in localStorage
                localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
                
                console.log('Demo login successful');
                return { success: true, user: currentUser };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Demo login error:', error);
            return { success: false, error: 'Demo login failed: ' + error.message };
        }
    }
    
    /**
     * Verify current token is valid
     * @returns {Promise<Object>} Verification result
     */
    async function verifyToken() {
        if (!authToken) {
            return { success: false, error: 'No token available' };
        }
        
        try {
            const response = await fetch(`${AUTH_API_URL}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: authToken })
            });
            
            const data = await response.json();
            
            if (data.success) {
                currentUser = data.data.user;
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
                return { success: true, user: currentUser };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Token verification error:', error);
            return { success: false, error: 'Token verification failed: ' + error.message };
        }
    }
    
    /**
     * Logout current user
     */
    function logout() {
        authToken = null;
        currentUser = null;
        isAuthenticated = false;
        
        // Remove from localStorage
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        
        console.log('Logged out');
    }
    
    /**
     * Get authorization header for API requests
     * @returns {Object} Headers object
     */
    function getAuthHeaders() {
        if (!authToken) {
            return {};
        }
        
        return {
            'Authorization': `Bearer ${authToken}`
        };
    }
    
    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    function checkAuth() {
        return isAuthenticated && !!authToken;
    }
    
    /**
     * Get current user data
     * @returns {Object|null} User data or null if not authenticated
     */
    function getCurrentUser() {
        return currentUser;
    }
    
    /**
     * Get current auth token
     * @returns {string|null} Auth token or null if not authenticated
     */
    function getToken() {
        return authToken;
    }
    
    /**
     * Make authenticated API request
     * @param {string} url - Request URL
     * @param {Object} options - Fetch options
     * @returns {Promise<Response>} Fetch response
     */
    async function authenticatedFetch(url, options = {}) {
        const authHeaders = getAuthHeaders();
        
        const requestOptions = {
            ...options,
            headers: {
                ...authHeaders,
                ...options.headers
            }
        };
        
        const response = await fetch(url, requestOptions);
        
        // If unauthorized, clear auth state
        if (response.status === 401) {
            logout();
        }
        
        return response;
    }
    
    // Initialize when service is created
    init();
    
    // Public API
    return {
        login,
        demoLogin,
        logout,
        verifyToken,
        checkAuth,
        getCurrentUser,
        getToken,
        getAuthHeaders,
        authenticatedFetch
    };
})();

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Auth Service initialized');
    if (window.ezEdit.authService.checkAuth()) {
        console.log('User already authenticated:', window.ezEdit.authService.getCurrentUser());
    }
});