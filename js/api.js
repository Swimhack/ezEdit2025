// API client for EzEdit.co Netlify Functions
class EzEditAPI {
  constructor() {
    this.baseURL = '';
    this.token = localStorage.getItem('ezEdit_token');
  }

  async request(endpoint, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    const data = await response.json();
    
    if (!data.success && response.status >= 400) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    
    return data;
  }

  // Authentication methods
  async login(email, password) {
    try {
      const data = await this.request('/api/auth', {
        method: 'POST',
        body: { action: 'login', email, password }
      });
      
      if (data.success) {
        this.token = data.token;
        localStorage.setItem('ezEdit_token', this.token);
        localStorage.setItem('ezEdit_user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async register(email, password, name) {
    try {
      return await this.request('/api/auth', {
        method: 'POST',
        body: { action: 'register', email, password, name }
      });
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  async logout() {
    try {
      await this.request('/api/auth', {
        method: 'POST',
        body: { action: 'logout' }
      });
      
      this.token = null;
      localStorage.removeItem('ezEdit_token');
      localStorage.removeItem('ezEdit_user');
      
      return { success: true };
    } catch (error) {
      // Clear local data even if API call fails
      this.token = null;
      localStorage.removeItem('ezEdit_token');
      localStorage.removeItem('ezEdit_user');
      
      return { success: true };
    }
  }

  // FTP operations
  async connectFTP(host, username, password, port = 21) {
    try {
      return await this.request('/api/ftp', {
        method: 'POST',
        body: { action: 'connect', host, username, password, port }
      });
    } catch (error) {
      throw new Error(`FTP connection failed: ${error.message}`);
    }
  }

  async listFiles(path = '/') {
    try {
      return await this.request('/api/ftp', {
        method: 'POST',
        body: { action: 'list', path }
      });
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  async readFile(path) {
    try {
      return await this.request('/api/ftp', {
        method: 'POST',
        body: { action: 'read', path }
      });
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  async writeFile(path, content) {
    try {
      return await this.request('/api/ftp', {
        method: 'POST',
        body: { action: 'write', path, content }
      });
    } catch (error) {
      throw new Error(`Failed to write file: ${error.message}`);
    }
  }

  async deleteFile(path) {
    try {
      return await this.request('/api/ftp', {
        method: 'POST',
        body: { action: 'delete', path }
      });
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  // AI Assistant
  async getAIAssistance(message, code = '', language = 'javascript') {
    try {
      return await this.request('/api/ai-assistant', {
        method: 'POST',
        body: { message, code, language }
      });
    } catch (error) {
      throw new Error(`AI assistance failed: ${error.message}`);
    }
  }

  // Health check
  async healthCheck() {
    try {
      return await this.request('/api/health');
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  // Utility methods
  isAuthenticated() {
    return !!this.token;
  }

  getCurrentUser() {
    const userData = localStorage.getItem('ezEdit_user');
    return userData ? JSON.parse(userData) : null;
  }
}

// Global API instance
window.ezEditAPI = new EzEditAPI();

// Auto-login check on page load
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('ezEdit_token');
  if (token) {
    // User is logged in, update UI accordingly
    const user = window.ezEditAPI.getCurrentUser();
    if (user) {
      console.log('User logged in:', user.email);
      // Update navigation or show user info
      updateAuthUI(true, user);
    }
  }
});

// Update authentication UI
function updateAuthUI(isLoggedIn, user = null) {
  const loginLinks = document.querySelectorAll('.auth-login');
  const userLinks = document.querySelectorAll('.auth-user');
  
  if (isLoggedIn && user) {
    loginLinks.forEach(link => link.style.display = 'none');
    userLinks.forEach(link => {
      link.style.display = 'block';
      if (link.textContent.includes('Login')) {
        link.textContent = `Welcome, ${user.name || user.email}`;
        link.href = '/dashboard.html';
      }
    });
  } else {
    loginLinks.forEach(link => link.style.display = 'block');
    userLinks.forEach(link => link.style.display = 'none');
  }
}