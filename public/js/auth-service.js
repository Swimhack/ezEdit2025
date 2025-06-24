/**
 * EzEdit Authentication Service Factory
 * 
 * Provides a unified interface for authentication using both Supabase and PHP backends
 * Handles automatic fallback between authentication methods
 * Maintains session persistence and token management
 */

class AuthService {
  constructor(memoryService) {
    // Store memory service reference
    this.memoryService = memoryService || (window.ezEdit && window.ezEdit.memory);
    
    // Initialize authentication services
    this.supabase = new SupabaseService(this.memoryService);
    this.php = new PhpAuthService(this.memoryService);
    
    // Default to Supabase auth for Netlify deployment compatibility
    this.preferredAuthMethod = localStorage.getItem('ezEditPreferredAuth') || 'supabase';
    
    // Auth storage key
    this.storageKey = 'ezEditAuth';
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize the Auth service
   * @returns {Promise<Object>} Initialization result
   */
  async init() {
    try {
      // Initialize both auth services
      const supabaseInit = await this.supabase.init();
      const phpInit = await this.php.init();
      
      // Determine which auth service to use
      if (this.preferredAuthMethod === 'supabase' && supabaseInit.success) {
        this.activeAuthService = 'supabase';
      } else if (phpInit.success) {
        this.activeAuthService = 'php';
      } else if (supabaseInit.success) {
        this.activeAuthService = 'supabase';
      } else {
        this.activeAuthService = null;
      }
      
      console.log(`Using ${this.activeAuthService || 'no'} auth service`);
      
      return { 
        success: !!this.activeAuthService,
        activeAuthService: this.activeAuthService
      };
    } catch (error) {
      console.error('Error initializing Auth service:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Get the active authentication service
   * @returns {Object} Active authentication service
   */
  getActiveService() {
    return this.activeAuthService === 'php' ? this.php : this.supabase;
  }
  
  /**
   * Set preferred authentication method
   * @param {string} method Authentication method ('supabase' or 'php')
   */
  setPreferredAuthMethod(method) {
    if (method === 'supabase' || method === 'php') {
      this.preferredAuthMethod = method;
      localStorage.setItem('ezEditPreferredAuth', method);
    }
  }
  
  /**
   * Sign in with email and password
   * @param {string} email User email
   * @param {string} password User password
   * @param {Object} options Additional options
   * @param {string} options.authMethod Force specific auth method ('supabase' or 'php')
   * @returns {Promise<Object>} Sign in result
   */
  async signIn(email, password, options = {}) {
    // Determine which auth service to use
    const authMethod = options.authMethod || this.preferredAuthMethod;
    
    try {
      let result;
      
      // Try primary auth method
      if (authMethod === 'php') {
        result = await this.php.signIn(email, password);
        
        // Log the attempt
        this.logAuthAttempt('signin', email, result.success, 'php', result.error);
        
        // If PHP auth fails, try Supabase as fallback
        if (!result.success) {
          console.log('PHP auth failed, trying Supabase');
          result = await this.supabase.signInWithPassword(email, password);
          
          // Log the fallback attempt
          this.logAuthAttempt('signin_fallback', email, result.success, 'supabase', result.error);
          
          if (result.success) {
            this.activeAuthService = 'supabase';
          }
        } else {
          this.activeAuthService = 'php';
        }
      } else {
        result = await this.supabase.signInWithPassword(email, password);
        
        // Log the attempt
        this.logAuthAttempt('signin', email, result.success, 'supabase', result.error);
        
        // If Supabase auth fails, try PHP as fallback
        if (!result.success) {
          console.log('Supabase auth failed, trying PHP');
          result = await this.php.signIn(email, password);
          
          // Log the fallback attempt
          this.logAuthAttempt('signin_fallback', email, result.success, 'php', result.error);
          
          if (result.success) {
            this.activeAuthService = 'php';
          }
        } else {
          this.activeAuthService = 'supabase';
        }
      }
      
      // Store auth data in localStorage
      if (result.success) {
        this._storeAuthData(result);
      }
      
      return result;
    } catch (error) {
      console.error('Auth sign in error:', error);
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
   * @param {Object} options Additional options
   * @param {string} options.authMethod Force specific auth method ('supabase' or 'php')
   * @returns {Promise<Object>} Sign up result
   */
  async signUp(userData, options = {}) {
    // Determine which auth service to use
    const authMethod = options.authMethod || this.preferredAuthMethod;
    
    try {
      let result;
      
      // Try primary auth method
      if (authMethod === 'php') {
        result = await this.php.signUp(userData);
        
        // Log the attempt
        this.logAuthAttempt('signup', userData.email, result.success, 'php', result.error);
        
        // If PHP auth fails, try Supabase as fallback
        if (!result.success) {
          console.log('PHP signup failed, trying Supabase');
          result = await this.supabase.signUp(userData);
          
          // Log the fallback attempt
          this.logAuthAttempt('signup_fallback', userData.email, result.success, 'supabase', result.error);
          
          if (result.success) {
            this.activeAuthService = 'supabase';
          }
        } else {
          this.activeAuthService = 'php';
        }
      } else {
        result = await this.supabase.signUp(userData);
        
        // Log the attempt
        this.logAuthAttempt('signup', userData.email, result.success, 'supabase', result.error);
        
        // If Supabase auth fails, try PHP as fallback
        if (!result.success) {
          console.log('Supabase signup failed, trying PHP');
          result = await this.php.signUp(userData);
          
          // Log the fallback attempt
          this.logAuthAttempt('signup_fallback', userData.email, result.success, 'php', result.error);
          
          if (result.success) {
            this.activeAuthService = 'php';
          }
        } else {
          this.activeAuthService = 'supabase';
        }
      }
      
      // Store auth data in localStorage if we have a session
      if (result.success && result.session) {
        this._storeAuthData(result);
      }
      
      return result;
    } catch (error) {
      console.error('Auth sign up error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }
  
  /**
   * Sign in with a third-party provider (Google, GitHub, etc.)
   * @param {string} provider Provider name (github, google, etc.)
   * @param {Object} options Additional options
   * @returns {Promise<Object>} OAuth sign in result
   */
  async signInWithProvider(provider, options = {}) {
    try {
      // Always use Supabase for OAuth
      const result = await this.supabase.signInWithProvider(provider, options);
      
      // Log the attempt
      this.logAuthAttempt('oauth', null, result.success, provider, result.error);
      
      if (!result.error) {
        this.activeAuthService = 'supabase';
      }
      
      return result;
    } catch (error) {
      console.error(`Auth sign in with ${provider} error:`, error);
      return {
        success: false,
        error: error.message || `Failed to sign in with ${provider}`
      };
    }
  }
  
  /**
   * Sign out
   * @returns {Promise<Object>} Sign out result
   */
  async signOut() {
    try {
      // Sign out from both services
      const supabaseSignOut = this.supabase.signOut();
      const phpSignOut = this.php.signOut();
      
      await Promise.all([supabaseSignOut, phpSignOut]);
      
      // Clear stored auth data
      localStorage.removeItem(this.storageKey);
      
      // Reset active auth service
      this.activeAuthService = null;
      
      // Log the sign out
      this.logAuthAttempt('signout', null, true, null);
      
      return { success: true };
    } catch (error) {
      console.error('Auth sign out error:', error);
      
      // Clear stored auth data even if sign out fails
      localStorage.removeItem(this.storageKey);
      
      // Log the sign out failure
      this.logAuthAttempt('signout', null, false, null, error.message);
      
      return {
        success: false,
        error: error.message || 'Sign out failed'
      };
    }
  }
  
  /**
   * Check if user is authenticated
   * @returns {boolean} Whether user is authenticated
   */
  isAuthenticated() {
    // Check if any auth service is authenticated
    return this.supabase.isAuthenticated() || this.php.isAuthenticated();
  }
  
  /**
   * Get current session
   * @returns {Object|null} Current session or null if not authenticated
   */
  getSession() {
    // Get session from active auth service
    if (this.activeAuthService) {
      return this.getActiveService().getSession();
    }
    
    // Try to get session from any auth service
    return this.supabase.getSession() || this.php.getSession();
  }
  
  /**
   * Get current user
   * @returns {Object|null} Current user or null if not authenticated
   */
  getUser() {
    // Get user from active auth service
    if (this.activeAuthService) {
      return this.getActiveService().getUser();
    }
    
    // Try to get user from any auth service
    return this.supabase.getUser() || this.php.getUser();
  }
  
  /**
   * Get authentication token
   * @returns {string|null} Authentication token or null if not authenticated
   */
  getToken() {
    const session = this.getSession();
    return session ? (session.access_token || session.token) : null;
  }
  
  /**
   * Store authentication data in localStorage
   * @param {Object} authData Authentication data
   * @private
   */
  _storeAuthData(authData) {
    try {
      const { user, session, profile } = authData;
      
      const authStorage = {
        isAuthenticated: true,
        authMethod: this.activeAuthService,
        user: user || null,
        profile: profile || null,
        session: session || null,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(authStorage));
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  }
  
  /**
   * Log authentication attempt for debugging
   * @private
   * @param {string} action Action type (signin, signup, etc.)
   * @param {string} email User email
   * @param {boolean} success Whether the attempt was successful
   * @param {string} method Auth method used (supabase, php, oauth)
   * @param {string} error Error message if failed
   */
  logAuthAttempt(action, email, success, method, error = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      email: email || 'unknown',
      success,
      method,
      error,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.generateSessionId()
    };
    
    // Store in localStorage for debugging (limit to last 50 entries)
    const authLogs = JSON.parse(localStorage.getItem('ezEditAuthLogs') || '[]');
    authLogs.unshift(logEntry);
    if (authLogs.length > 50) {
      authLogs.splice(50);
    }
    localStorage.setItem('ezEditAuthLogs', JSON.stringify(authLogs));
    
    // Also log to console in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('🔐 Auth Log:', logEntry);
    }
    
    // Send to server for comprehensive logging (non-blocking)
    this.sendAuthLogToServer(logEntry).catch(err => {
      console.warn('Failed to send auth log to server:', err);
    });
  }
  
  /**
   * Generate a session ID for tracking
   * @private
   * @returns {string} Session ID
   */
  generateSessionId() {
    if (!this.sessionId) {
      this.sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    return this.sessionId;
  }
  
  /**
   * Send auth log to server
   * @private
   * @param {Object} logEntry Log entry to send
   */
  async sendAuthLogToServer(logEntry) {
    try {
      const response = await fetch('/auth/auth-handler.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'log_client_auth',
          log_data: logEntry
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      // Fail silently for logging to avoid disrupting user experience
      console.debug('Client auth logging failed:', error);
    }
  }
}
