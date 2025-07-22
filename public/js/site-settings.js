// Site Settings Management
class SiteSettingsManager {
  constructor() {
    this.siteId = this.getSiteIdFromUrl();
    this.form = document.getElementById('site-settings-form');
    this.deleteModal = document.getElementById('delete-modal');
    this.isLoading = false;
    
    this.init();
  }

  init() {
    if (!this.siteId) {
      window.ezEdit.ui.showToast('No site ID provided', 'error');
      setTimeout(() => window.location.href = '/dashboard.php', 2000);
      return;
    }

    this.setupEventListeners();
    this.loadSiteSettings();
  }

  getSiteIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('site');
  }

  setupEventListeners() {
    // Form submission
    this.form.addEventListener('submit', (e) => this.handleSaveSettings(e));
    
    // Test connection button
    const testBtn = document.getElementById('test-connection');
    testBtn.addEventListener('click', () => this.testConnection());
    
    // Password toggle
    const togglePassword = document.querySelector('.toggle-password');
    togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
    
    // Site actions
    document.getElementById('backup-site').addEventListener('click', () => this.downloadBackup());
    document.getElementById('delete-site').addEventListener('click', () => this.showDeleteModal());
    
    // Delete modal handlers
    document.getElementById('close-delete-modal').addEventListener('click', () => this.hideDeleteModal());
    document.getElementById('cancel-delete').addEventListener('click', () => this.hideDeleteModal());
    document.getElementById('confirm-delete').addEventListener('click', () => this.deleteSite());
    
    // Delete confirmation input
    const deleteInput = document.getElementById('delete-confirmation');
    deleteInput.addEventListener('input', (e) => {
      const confirmBtn = document.getElementById('confirm-delete');
      confirmBtn.disabled = e.target.value !== 'DELETE';
    });
  }

  async loadSiteSettings() {
    try {
      this.setLoading(true);
      
      const authToken = window.ezEdit.authService.getToken();
      const response = await fetch(`/api/sites/${this.siteId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load site settings');
      }

      this.populateForm(result.data.site);
      
    } catch (error) {
      console.error('Error loading site settings:', error);
      window.ezEdit.ui.showToast('Failed to load site settings', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  populateForm(site) {
    document.getElementById('site-name').value = site.name || '';
    document.getElementById('ftp-host').value = site.host || '';
    document.getElementById('ftp-port').value = site.port || 21;
    document.getElementById('ftp-username').value = site.username || '';
    document.getElementById('ftp-password').value = site.password || '';
    document.getElementById('root-path').value = site.root_path || '/';
    document.getElementById('ftp-passive').checked = site.passive_mode !== false;
  }

  async handleSaveSettings(e) {
    e.preventDefault();
    
    if (this.isLoading) return;
    
    try {
      this.setLoading(true);
      
      const formData = this.getFormData();
      const authToken = window.ezEdit.authService.getToken();
      
      const response = await fetch(`/api/sites/${this.siteId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save settings');
      }

      window.ezEdit.ui.showToast('Site settings saved successfully', 'success');
      
    } catch (error) {
      console.error('Error saving site settings:', error);
      window.ezEdit.ui.showToast('Failed to save site settings', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  getFormData() {
    return {
      name: document.getElementById('site-name').value,
      host: document.getElementById('ftp-host').value,
      port: parseInt(document.getElementById('ftp-port').value),
      username: document.getElementById('ftp-username').value,
      password: document.getElementById('ftp-password').value,
      root_path: document.getElementById('root-path').value,
      passive_mode: document.getElementById('ftp-passive').checked
    };
  }

  async testConnection() {
    if (this.isLoading) return;
    
    try {
      this.setLoading(true);
      
      const formData = this.getFormData();
      const authToken = window.ezEdit.authService.getToken();
      
      const response = await fetch('/api/ftp/test-connection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        window.ezEdit.ui.showToast('Connection successful!', 'success');
      } else {
        throw new Error(result.error || 'Connection failed');
      }
      
    } catch (error) {
      console.error('Error testing connection:', error);
      window.ezEdit.ui.showToast('Connection failed: ' + error.message, 'error');
    } finally {
      this.setLoading(false);
    }
  }

  togglePasswordVisibility() {
    const passwordInput = document.getElementById('ftp-password');
    const toggleBtn = document.querySelector('.toggle-password');
    
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      toggleBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
      `;
    } else {
      passwordInput.type = 'password';
      toggleBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
      `;
    }
  }

  async downloadBackup() {
    try {
      this.setLoading(true);
      
      const authToken = window.ezEdit.authService.getToken();
      const response = await fetch(`/api/sites/${this.siteId}/backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create backup');
      }

      // Get the blob and create download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `site-backup-${this.siteId}-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      window.ezEdit.ui.showToast('Backup downloaded successfully', 'success');
      
    } catch (error) {
      console.error('Error downloading backup:', error);
      window.ezEdit.ui.showToast('Failed to download backup', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  showDeleteModal() {
    this.deleteModal.style.display = 'block';
    document.getElementById('delete-confirmation').value = '';
    document.getElementById('confirm-delete').disabled = true;
  }

  hideDeleteModal() {
    this.deleteModal.style.display = 'none';
  }

  async deleteSite() {
    const confirmInput = document.getElementById('delete-confirmation');
    if (confirmInput.value !== 'DELETE') {
      window.ezEdit.ui.showToast('Please type DELETE to confirm', 'error');
      return;
    }

    try {
      this.setLoading(true);
      
      const authToken = window.ezEdit.authService.getToken();
      const response = await fetch(`/api/sites/${this.siteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete site');
      }

      window.ezEdit.ui.showToast('Site deleted successfully', 'success');
      setTimeout(() => window.location.href = '/dashboard.php', 1500);
      
    } catch (error) {
      console.error('Error deleting site:', error);
      window.ezEdit.ui.showToast('Failed to delete site', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  setLoading(loading) {
    this.isLoading = loading;
    const submitBtn = this.form.querySelector('button[type="submit"]');
    const testBtn = document.getElementById('test-connection');
    
    if (loading) {
      submitBtn.disabled = true;
      testBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><circle cx="12" cy="12" r="10"></circle><path d="M8 12l2 2 4-4"></path></svg>
        Saving...
      `;
    } else {
      submitBtn.disabled = false;
      testBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
        Save Settings
      `;
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize authentication
  window.ezEdit = window.ezEdit || {};
  
  // Initialize auth service if it exists
  if (window.ezEdit.authService && typeof window.ezEdit.authService.init === 'function') {
    window.ezEdit.authService.init().then(() => {
      new SiteSettingsManager();
    });
  } else if (window.PhpAuthService) {
    window.ezEdit.authService = new window.PhpAuthService();
    window.ezEdit.authService.init().then(() => {
      new SiteSettingsManager();
    });
  } else {
    new SiteSettingsManager();
  }
});