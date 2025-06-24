/**
 * EzEdit PHP Authentication Service
 * 
 * Provides an interface to the PHP authentication backend
 * Works alongside the existing SupabaseService
 * Handles token storage and management
 * Maintains session persistence
 */

class PhpAuthService {
  constructor(memoryService) {
    // Store memory service reference
    this.memoryService = memoryService || (window.ezEdit && window.ezEdit.memory);
    
    // Auth endpoint
    this.authEndpoint = '/auth/auth-handler.php';
    
    // Auth storage key
    this.storageKey = 'ezEditPhpAuth';
    
    // Try to restore session from localStorage
    this._restoreSessionFromLocalStorage();
  }
  
  /**
   * Initialize the PHP Auth service
   * @returns {Promise<Object>} Initialization result
   */
  async init() {
    try {
      // If we have a session, verify it
      if (this.session && this.session.access_token) {
        const verifyResult = await this.verifyToken(this.session.access_token);
        
        if (!verifyResult.success) {
          // Token is invalid, try to refresh it
          if (this.session.refresh_token) {
            const refreshResult = await this.refreshToken(this.session.refresh_token);
            
            if (refreshResult.success) {
              // Update session with new tokens
              this._updateSession(refreshResult.data);
              return { success: true };
            } else {
              // Refresh failed, clear session
              this._clearSession();
              return { success: false, error: 'Session expired' };
            }
          } else {
            // No refresh token, clear session
            this._clearSession();
            return { success: false, error: 'Session expired' };
          }
        }
        
        return { success: true };
      }
      
      return { success: false, error: 'No session' };
    } catch (error) {
      console.error('Error initializing PHP Auth service:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Sign in with email and password
   * @param {string} email User email
   * @param {string} password User password
   * @returns {Promise<Object>} Sign in result
   */
  async signIn(email, password) {
    try {
      const response = await this._apiCall('login', {
        email,
        password
      });
      
      if (response.success && response.data) {
        // Store session
        this._updateSession(response.data.session);
        
        return {
          success: true,
          user: response.data.user,
          profile: response.data.profile,
          session: response.data.session
        };
      } else {
        return {
          success: false,
          error: response.message || 'Authentication failed'
        };
      }
    } catch (error) {
      console.error('PHP Auth sign in error:', error);
      return {
        success: false,
        error: error.message || 'Authentication failed'
      };
    }
  }
  
  /**
   * Sign up with email and password
   * @param {Object} userData User data
   * @param {string} userData.email User email
   * @param {string} userData.password User password
   * @param {string} userData.firstName User first name
   * @param {string} userData.lastName User last name
   * @param {Object} userData.metadata Additional user metadata
   * @returns {Promise<Object>} Sign up result
   */
  async signUp(userData) {
    try {
      const response = await this._apiCall('register', {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName || userData.first_name,
        lastName: userData.lastName || userData.last_name,
        metadata: userData.metadata || {},
        signupSource: userData.signupSource || 'web'
      });
      
      if (response.success && response.data) {
        return {
          success: true,
          user: response.data.user,
          emailConfirmation: response.data.emailConfirmation
        };
      } else {
        return {
          success: false,
          error: response.message || 'Registration failed'
        };
      }
    } catch (error) {
      console.error('PHP Auth sign up error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }
  
  /**
   * Verify token
   * @param {string} token Access token to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyToken(token) {
    try {
      const response = await this._apiCall('verify', {
        token: token || this.session?.access_token
      });
      
      return {
        success: response.success,
        user: response.data?.user,
        profile: response.data?.profile,
        message: response.message
      };
    } catch (error) {
      console.error('PHP Auth verify token error:', error);
      return {
        success: false,
        error: error.message || 'Token verification failed'
      };
    }
  }
  
  /**
   * Refresh token
   * @param {string} refreshToken Refresh token
   * @returns {Promise<Object>} Refresh result
   */
  async refreshToken(refreshToken) {
    try {
      const response = await this._apiCall('refresh', {
        refresh_token: refreshToken || this.session?.refresh_token
      });
      
      if (response.success && response.data) {
        // Update session with new tokens
        this._updateSession(response.data);
        
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          error: response.message || 'Token refresh failed'
        };
      }
    } catch (error) {
      console.error('PHP Auth refresh token error:', error);
      return {
        success: false,
        error: error.message || 'Token refresh failed'
      };
    }
  }
  
  /**
   * Sign out
   * @returns {Promise<Object>} Sign out result
   */
  async signOut() {
    try {
      if (this.session && this.session.access_token) {
        // Call logout endpoint
        await this._apiCall('logout', {
          token: this.session.access_token
        });
      }
      
      // Clear session
      this._clearSession();
      
      return { success: true };
    } catch (error) {
      console.error('PHP Auth sign out error:', error);
      
      // Clear session even if API call fails
      this._clearSession();
      
      return {
        success: true,
        error: error.message
      };
    }
  }
  
  /**
   * Check if user is authenticated
   * @returns {boolean} Whether user is authenticated
   */
  isAuthenticated() {
    if (!this.session) return false;
    
    // Check if token is expired
    const now = Date.now();
    const expiresAt = this.session.expires_at * 1000; // Convert to milliseconds
    
    return now < expiresAt;
  }
  
  /**
   * Get current session
   * @returns {Object|null} Current session or null if not authenticated
   */
  getSession() {
    return this.isAuthenticated() ? this.session : null;
  }
  
  /**
   * Get current user
   * @returns {Object|null} Current user or null if not authenticated
   */
  getUser() {
    return this.isAuthenticated() && this.user ? this.user : null;
  }
  
  /**
   * Get authentication token
   * @returns {string|null} Authentication token or null if not authenticated
   */
  getToken() {
    return this.isAuthenticated() ? this.session.access_token : null;
  }
  
  /**
   * Make API call to auth handler
   * @param {string} action Action to perform
   * @param {Object} data Request data
   * @returns {Promise<Object>} API response
   * @private
   */
  async _apiCall(action, data = {}) {
    try {
      const response = await fetch(`${this.authEndpoint}?action=${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`PHP Auth API call error (${action}):`, error);
      throw error;
    }
  }
  
  /**
   * Update session data
   * @param {Object} sessionData Session data
   * @private
   */
  _updateSession(sessionData) {
    this.session = sessionData;
    
    // Store in localStorage
    localStorage.setItem(this.storageKey, JSON.stringify({
      session: this.session,
      timestamp: new Date().toISOString()
    }));
  }
  
  /**
   * Clear session data
   * @private
   */
  _clearSession() {
    this.session = null;
    this.user = null;
    
    // Remove from localStorage
    localStorage.removeItem(this.storageKey);
  }
  
  /**
   * Restore session from localStorage
   * @private
   */
  _restoreSessionFromLocalStorage() {
    try {
      const storedData = localStorage.getItem(this.storageKey);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        if (parsedData && parsedData.session) {
          this.session = parsedData.session;
          
          // Check if session is expired
          if (!this.isAuthenticated()) {
            this._clearSession();
          }
        }
      }
    } catch (error) {
      console.error('Error restoring session from localStorage:', error);
      this._clearSession();
    }
  }
}
