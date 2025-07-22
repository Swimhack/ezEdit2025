/**
 * EzEdit Authentication Service
 * Handles authentication using Supabase and fallback PHP backend
 */

class AuthService {
  constructor() {
    this.supabase = null;
    this.phpAuth = null;
    this.activeAuthService = null;
    this.storageKey = 'ezEditAuthData';
    this.sessionId = null;
    this.initialized = false;
  }

  async init() {
    try {
      // Initialize Supabase service
      if (window.ezEdit && window.ezEdit.supabase) {
        this.supabase = window.ezEdit.supabase;
        const supabaseInit = await this.supabase.init();
        this.activeAuthService = supabaseInit.success ? 'supabase' : null;
      }

      // Fallback to PHP auth service if Supabase isn't available
      if (!this.activeAuthService && window.ezEdit && window.ezEdit.phpAuth) {
        this.phpAuth = window.ezEdit.phpAuth;
        await this.phpAuth.init();
        this.activeAuthService = 'php';
      }

      // If neither service is available, create a basic JWT service
      if (!this.activeAuthService) {
        this.activeAuthService = 'jwt';
        this.initJWTService();
      }

      this.initialized = true;
      console.log(`AuthService initialized with: ${this.activeAuthService}`);
      
      return {
        success: true,
        activeAuthService: this.activeAuthService
      };
    } catch (error) {
      console.error('Error initializing Auth service:', error);
      return { success: false, error };
    }
  }

  initJWTService() {
    // Basic JWT authentication fallback
    this.jwtService = {
      token: localStorage.getItem('ezedit_auth_token'),
      user: JSON.parse(localStorage.getItem('ezedit_user_data') || 'null')
    };
  }

  getActiveService() {
    if (this.activeAuthService === 'supabase') return this.supabase;
    if (this.activeAuthService === 'php') return this.phpAuth;
    return this.jwtService;
  }

  async signIn(email, password) {
    try {
      let result;

      if (this.activeAuthService === 'supabase' && this.supabase) {
        result = await this.supabase.signInWithPassword(email, password);
      } else if (this.activeAuthService === 'php' && this.phpAuth) {
        result = await this.phpAuth.signInWithPassword(email, password);
      } else {
        // Fallback JWT authentication
        result = await this.jwtSignIn(email, password);
      }

      this.logAuthAttempt('signin', email, result.success, this.activeAuthService, result.error);
      
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

  async jwtSignIn(email, password) {
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.success && data.token) {
        localStorage.setItem('ezedit_auth_token', data.token);
        localStorage.setItem('ezedit_user_data', JSON.stringify(data.user));
        this.jwtService.token = data.token;
        this.jwtService.user = data.user;
        
        return {
          success: true,
          user: data.user,
          session: { access_token: data.token }
        };
      } else {
        throw new Error(data.error || 'Invalid response from server');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  async signUp(userData) {
    try {
      let result;

      if (this.activeAuthService === 'supabase' && this.supabase) {
        result = await this.supabase.signUp(userData);
      } else if (this.activeAuthService === 'php' && this.phpAuth) {
        result = await this.phpAuth.signUp(userData);
      } else {
        // Fallback JWT signup
        result = await this.jwtSignUp(userData);
      }

      this.logAuthAttempt('signup', userData.email, result.success, this.activeAuthService, result.error);
      
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

  async jwtSignUp(userData) {
    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      if (data.success) {
        return {
          success: true,
          user: data.user,
          session: data.token ? { access_token: data.token } : null
        };
      } else {
        throw new Error(data.error || 'Invalid response from server');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  async signInWithProvider(provider, options = {}) {
    try {
      if (this.activeAuthService === 'supabase' && this.supabase) {
        const result = await this.supabase.signInWithProvider(provider, options);
        this.logAuthAttempt('oauth', null, result.success, provider, result.error);
        return result;
      } else {
        throw new Error('Social login only available with Supabase');
      }
    } catch (error) {
      console.error(`Auth sign in with ${provider} error:`, error);
      return {
        success: false,
        error: error.message || `Failed to sign in with ${provider}`
      };
    }
  }

  async signOut() {
    try {
      let result = { success: true };

      if (this.activeAuthService === 'supabase' && this.supabase) {
        result = await this.supabase.signOut();
      } else if (this.activeAuthService === 'php' && this.phpAuth) {
        result = await this.phpAuth.signOut();
      } else {
        // JWT signout
        localStorage.removeItem('ezedit_auth_token');
        localStorage.removeItem('ezedit_user_data');
        this.jwtService.token = null;
        this.jwtService.user = null;
      }

      localStorage.removeItem(this.storageKey);
      this.logAuthAttempt('signout', null, result.success, this.activeAuthService, result.error);
      return result;
    } catch (error) {
      console.error('Auth sign out error:', error);
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem('ezedit_auth_token');
      localStorage.removeItem('ezedit_user_data');
      this.logAuthAttempt('signout', null, false, null, error.message);
      return {
        success: false,
        error: error.message || 'Sign out failed'
      };
    }
  }

  isAuthenticated() {
    if (this.activeAuthService === 'supabase' && this.supabase) {
      return this.supabase.isAuthenticated();
    } else if (this.activeAuthService === 'php' && this.phpAuth) {
      return this.phpAuth.checkAuth();
    } else {
      // JWT check
      const token = localStorage.getItem('ezedit_auth_token');
      return !!token;
    }
  }

  getSession() {
    if (this.activeAuthService === 'supabase' && this.supabase) {
      return this.supabase.getSession();
    } else if (this.activeAuthService === 'php' && this.phpAuth) {
      return this.phpAuth.getSession();
    } else {
      // JWT session
      const token = localStorage.getItem('ezedit_auth_token');
      return token ? { access_token: token } : null;
    }
  }

  getUser() {
    if (this.activeAuthService === 'supabase' && this.supabase) {
      return this.supabase.getUser();
    } else if (this.activeAuthService === 'php' && this.phpAuth) {
      return this.phpAuth.getCurrentUser();
    } else {
      // JWT user
      const userData = localStorage.getItem('ezedit_user_data');
      return userData ? JSON.parse(userData) : null;
    }
  }

  getCurrentUser() {
    return this.getUser();
  }

  checkAuth() {
    return this.isAuthenticated();
  }

  getToken() {
    const session = this.getSession();
    if (session && session.access_token) {
      return session.access_token;
    }
    // Fallback to direct token storage
    return localStorage.getItem('ezedit_auth_token');
  }

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
    
    try {
      const authLogs = JSON.parse(localStorage.getItem('ezEditAuthLogs') || '[]');
      authLogs.unshift(logEntry);
      if (authLogs.length > 50) {
        authLogs.splice(50);
      }
      localStorage.setItem('ezEditAuthLogs', JSON.stringify(authLogs));
    } catch (error) {
      console.warn('Failed to store auth log:', error);
    }
    
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('🔐 Auth Log:', logEntry);
    }
  }
  
  generateSessionId() {
    if (!this.sessionId) {
      this.sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    return this.sessionId;
  }
}

// Make AuthService available globally
window.AuthService = AuthService;