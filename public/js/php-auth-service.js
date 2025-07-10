/**
 * PHP Authentication Service
 * Compatibility layer for legacy PHP authentication
 */

class PhpAuthService {
  constructor() {
    this.initialized = false;
    this.authEndpoint = '/auth';
  }

  async init() {
    this.initialized = true;
    return { success: true, service: 'php-auth' };
  }

  async signInWithPassword(email, password) {
    try {
      const response = await fetch(`${this.authEndpoint}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (data.success) {
        // Store auth data in localStorage for compatibility
        localStorage.setItem('ezEditAuth', JSON.stringify({
          user: data.data.user,
          token: data.data.token,
          session: { access_token: data.data.token }
        }));
        
        return {
          success: true,
          user: data.data.user,
          session: { access_token: data.data.token }
        };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('PHP Auth login error:', error);
      return { success: false, error: error.message };
    }
  }

  async signUp(userData) {
    try {
      const response = await fetch('/signup.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          user: data.user,
          needsConfirmation: data.needsConfirmation || false
        };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('PHP Auth signup error:', error);
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      // Clear local storage
      localStorage.removeItem('ezEditAuth');
      
      // Call logout endpoint if available
      await fetch('/logout.php', { method: 'POST' });
      
      return { success: true };
    } catch (error) {
      console.error('PHP Auth logout error:', error);
      return { success: false, error: error.message };
    }
  }

  isAuthenticated() {
    const authData = localStorage.getItem('ezEditAuth');
    if (!authData) return false;
    
    try {
      const parsed = JSON.parse(authData);
      return !!(parsed.user && parsed.token);
    } catch {
      return false;
    }
  }

  checkAuth() {
    return this.isAuthenticated();
  }

  getCurrentUser() {
    return this.getUser();
  }

  getSession() {
    const authData = localStorage.getItem('ezEditAuth');
    if (!authData) return null;
    
    try {
      const parsed = JSON.parse(authData);
      return parsed.session || null;
    } catch {
      return null;
    }
  }

  getUser() {
    const authData = localStorage.getItem('ezEditAuth');
    if (!authData) return null;
    
    try {
      const parsed = JSON.parse(authData);
      return parsed.user || null;
    } catch {
      return null;
    }
  }

  getToken() {
    const authData = localStorage.getItem('ezEditAuth');
    if (!authData) return null;
    
    try {
      const parsed = JSON.parse(authData);
      return parsed.token || null;
    } catch {
      return null;
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PhpAuthService;
} else {
  window.PhpAuthService = PhpAuthService;
}