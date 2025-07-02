/**
 * EzEdit Authentication Service Factory
 * 
 * Provides a unified interface for authentication using Supabase.
 * Maintains session persistence and token management.
 */

class AuthService {
  constructor(memoryService) {
    this.memoryService = memoryService || (window.ezEdit && window.ezEdit.memory);
    this.supabase = new SupabaseService(this.memoryService);
    this.storageKey = 'ezEditAuth';
    this.init();
  }

  async init() {
    try {
      const supabaseInit = await this.supabase.init();
      this.activeAuthService = supabaseInit.success ? 'supabase' : null;
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

  getActiveService() {
    return this.supabase;
  }

  async signIn(email, password) {
    try {
      const result = await this.supabase.signInWithPassword(email, password);
      this.logAuthAttempt('signin', email, result.success, 'supabase', result.error);
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

  async signUp(userData) {
    try {
      const result = await this.supabase.signUp(userData);
      this.logAuthAttempt('signup', userData.email, result.success, 'supabase', result.error);
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

  async signInWithProvider(provider, options = {}) {
    try {
      const result = await this.supabase.signInWithProvider(provider, options);
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

  async signOut() {
    try {
      const result = await this.supabase.signOut();
      localStorage.removeItem(this.storageKey);
      this.activeAuthService = null;
      this.logAuthAttempt('signout', null, result.success, 'supabase', result.error);
      return result;
    } catch (error) {
      console.error('Auth sign out error:', error);
      localStorage.removeItem(this.storageKey);
      this.logAuthAttempt('signout', null, false, null, error.message);
      return {
        success: false,
        error: error.message || 'Sign out failed'
      };
    }
  }

  isAuthenticated() {
    return this.supabase.isAuthenticated();
  }

  getSession() {
    return this.supabase.getSession();
  }

  getUser() {
    return this.supabase.getUser();
  }

  getToken() {
    const session = this.getSession();
    return session ? session.access_token : null;
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
    const authLogs = JSON.parse(localStorage.getItem('ezEditAuthLogs') || '[]');
    authLogs.unshift(logEntry);
    if (authLogs.length > 50) {
      authLogs.splice(50);
    }
    localStorage.setItem('ezEditAuthLogs', JSON.stringify(authLogs));
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
