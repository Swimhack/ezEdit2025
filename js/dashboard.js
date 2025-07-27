/**
 * EzEdit.co Dashboard JavaScript
 * Handles dashboard functionality, site management, and FTP connections
 */

class DashboardManager {
    constructor() {
        this.sites = [];
        this.currentModal = null;
        this.init();
    }
    
    init() {
        this.loadStoredSites();
        this.setupEventListeners();
        this.renderSites();
        this.checkAuthStatus();
    }
    
    setupEventListeners() {
        // Add site buttons
        const addSiteBtn = document.getElementById('addSiteBtn');
        const addSiteCard = document.getElementById('addSiteCard');
        
        if (addSiteBtn) {
            addSiteBtn.addEventListener('click', () => this.openAddSiteModal());
        }
        
        if (addSiteCard) {
            addSiteCard.addEventListener('click', () => this.openAddSiteModal());
        }
        
        // Modal controls
        const modal = document.getElementById('addSiteModal');
        const closeModal = document.getElementById('closeModal');
        const cancelAdd = document.getElementById('cancelAdd');
        
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeModal());
        }
        
        if (cancelAdd) {
            cancelAdd.addEventListener('click', () => this.closeModal());
        }
        
        // Close modal on backdrop click
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
        
        // Form submission
        const addSiteForm = document.getElementById('addSiteForm');
        if (addSiteForm) {
            addSiteForm.addEventListener('submit', (e) => this.handleAddSite(e));
        }
        
        // Test connection button
        const testConnection = document.getElementById('testConnection');
        if (testConnection) {
            testConnection.addEventListener('click', () => this.testFTPConnection());
        }
        
        // Mobile sidebar toggle (if implemented)
        this.setupMobileSidebar();
        
        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal) {
                this.closeModal();
            }
        });
    }
    
    setupMobileSidebar() {
        // Add mobile menu toggle functionality
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.dashboard-sidebar');
        
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('mobile-open');
            });
        }
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                const sidebar = document.querySelector('.dashboard-sidebar');
                const sidebarToggle = document.querySelector('.sidebar-toggle');
                
                if (sidebar && sidebar.classList.contains('mobile-open')) {
                    if (!sidebar.contains(e.target) && !sidebarToggle?.contains(e.target)) {
                        sidebar.classList.remove('mobile-open');
                    }
                }
            }
        });
    }
    
    async checkAuthStatus() {
        // Check if user is authenticated
        const isLoggedIn = sessionStorage.getItem('ezedit_logged_in') === 'true' || 
                          localStorage.getItem('ezedit_demo_user');
        
        if (!isLoggedIn) {
            // For demo purposes, don't redirect immediately
            console.log('User not authenticated, but allowing demo access');
        }
        
        // Load user info if available
        const userEmail = localStorage.getItem('ezedit_demo_user') || 'demo@ezedit.co';
        this.updateUserDisplay(userEmail);
    }
    
    updateUserDisplay(email) {
        // Update any user display elements
        const userElements = document.querySelectorAll('.user-email');
        userElements.forEach(element => {
            element.textContent = email;
        });
    }
    
    openAddSiteModal() {
        const modal = document.getElementById('addSiteModal');
        if (modal) {
            modal.classList.add('show');
            this.currentModal = modal;
            
            // Focus first input
            const firstInput = modal.querySelector('input[type="text"]');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }
    
    closeModal() {
        const modal = document.getElementById('addSiteModal');
        if (modal) {
            modal.classList.remove('show');
            
            // Reset form
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
            }
            
            // Reset test connection button
            this.resetTestConnectionButton();
        }
        this.currentModal = null;
    }
    
    async handleAddSite(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        const siteData = {
            id: Date.now().toString(),
            name: formData.get('siteName') || form.querySelector('#siteName').value,
            host: formData.get('ftpHost') || form.querySelector('#siteHost')?.value || '',
            port: formData.get('ftpPort') || form.querySelector('#sitePort')?.value || '',
            username: formData.get('ftpUsername') || form.querySelector('#siteUsername')?.value || '',
            password: formData.get('ftpPassword') || form.querySelector('#sitePassword')?.value || '',
            rootDirectory: formData.get('rootDirectory') || form.querySelector('#rootDirectory').value,
            webUrl: formData.get('webUrl') || form.querySelector('#webUrl').value,
            dateAdded: new Date().toISOString(),
            status: 'disconnected'
        };
        
        // Validate required fields
        if (!this.validateSiteData(siteData)) {
            return;
        }
        
        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Adding Site...';
        submitButton.disabled = true;
        
        try {
            // Simulate adding site (in real app, this would call API)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Add to sites array
            this.sites.push(siteData);
            
            // Save to localStorage
            this.saveSites();
            
            // Re-render sites
            this.renderSites();
            
            // Close modal
            this.closeModal();
            
            // Show success message
            this.showNotification('Site added successfully!', 'success');
            
        } catch (error) {
            console.error('Error adding site:', error);
            this.showNotification('Failed to add site. Please try again.', 'error');
        } finally {
            // Reset button
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }
    
    validateSiteData(data) {
        if (!data.name || data.name.trim().length < 2) {
            this.showNotification('Please enter a site name (at least 2 characters).', 'error');
            return false;
        }
        
        if (!data.host || data.host.trim().length < 3) {
            this.showNotification('Please enter a valid FTP host.', 'error');
            return false;
        }
        
        if (!data.port || isNaN(data.port) || data.port < 1 || data.port > 65535) {
            this.showNotification('Please enter a valid port number (1-65535).', 'error');
            return false;
        }
        
        if (!data.username || data.username.trim().length < 1) {
            this.showNotification('Please enter a username.', 'error');
            return false;
        }
        
        if (!data.password || data.password.length < 1) {
            this.showNotification('Please enter a password.', 'error');
            return false;
        }
        
        // Validate web URL if provided
        if (data.webUrl && data.webUrl.trim()) {
            try {
                new URL(data.webUrl);
            } catch {
                this.showNotification('Please enter a valid web URL (including http:// or https://).', 'error');
                return false;
            }
        }
        
        return true;
    }
    
    async testFTPConnection() {
        const form = document.getElementById('addSiteForm');
        if (!form) return;
        
        const host = form.querySelector('#siteHost')?.value || '';
        const port = form.querySelector('#sitePort')?.value || '';
        const username = form.querySelector('#siteUsername')?.value || '';
        const password = form.querySelector('#sitePassword')?.value || '';
        
        if (!host || !username || !password) {
            this.showNotification('Please fill in host, username, and password before testing.', 'error');
            return;
        }
        
        const button = document.getElementById('testConnection');
        const originalText = button.textContent;
        const originalColor = button.style.backgroundColor;
        
        // Show testing state
        button.textContent = 'Testing Connection...';
        button.disabled = true;
        button.style.backgroundColor = '#f59e0b';
        
        try {
            // Simulate FTP connection test
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // For demo purposes, randomly succeed or fail
            const success = Math.random() > 0.3; // 70% success rate
            
            if (success) {
                button.textContent = 'Connection Successful!';
                button.style.backgroundColor = '#10b981';
                button.style.color = 'white';
                
                this.showNotification('FTP connection test successful!', 'success');
            } else {
                throw new Error('Connection failed - please check your credentials.');
            }
            
        } catch (error) {
            button.textContent = 'Connection Failed';
            button.style.backgroundColor = '#ef4444';
            button.style.color = 'white';
            
            this.showNotification(error.message, 'error');
        }
        
        // Reset button after 3 seconds
        setTimeout(() => {
            this.resetTestConnectionButton();
        }, 3000);
    }
    
    resetTestConnectionButton() {
        const button = document.getElementById('testConnection');
        if (button) {
            button.textContent = 'Test Connection';
            button.disabled = false;
            button.style.backgroundColor = '';
            button.style.color = '';
        }
    }
    
    loadStoredSites() {
        try {
            const stored = localStorage.getItem('ezedit_sites');
            if (stored) {
                this.sites = JSON.parse(stored);
            } else {
                // Add demo site
                this.sites = [{
                    id: 'demo-1',
                    name: 'Eastga...',
                    host: '72.167.42.141',
                    port: '21',
                    username: 'demo_user',
                    password: '••••••••',
                    rootDirectory: '/public_html',
                    webUrl: 'http://eastgateministrie...',
                    dateAdded: new Date().toISOString(),
                    status: 'connected'
                }];
            }
        } catch (error) {
            console.error('Error loading sites:', error);
            this.sites = [];
        }
    }
    
    saveSites() {
        try {
            localStorage.setItem('ezedit_sites', JSON.stringify(this.sites));
        } catch (error) {
            console.error('Error saving sites:', error);
        }
    }
    
    renderSites() {
        const sitesGrid = document.getElementById('sitesGrid');
        if (!sitesGrid) return;
        
        // Clear existing sites (keep add card)
        const addCard = sitesGrid.querySelector('.site-card-add');
        sitesGrid.innerHTML = '';
        
        // Render sites
        this.sites.forEach(site => {
            const siteCard = this.createSiteCard(site);
            sitesGrid.appendChild(siteCard);
        });
        
        // Re-add the add card
        if (addCard) {
            sitesGrid.appendChild(addCard);
        }
    }
    
    createSiteCard(site) {
        const card = document.createElement('div');
        card.className = 'site-card';
        card.dataset.siteId = site.id;
        
        const statusClass = site.status === 'connected' ? 'status-connected' : 'status-disconnected';
        const statusText = site.status === 'connected' ? 'Connected' : 'Disconnected';
        
        card.innerHTML = `
            <div class="site-header">
                <div class="site-info">
                    <h3 class="site-name">${this.escapeHtml(site.name)}</h3>
                    <p class="site-host">Host: ${this.escapeHtml(site.host)}</p>
                    ${site.webUrl ? `
                        <a href="${this.escapeHtml(site.webUrl)}" class="site-url" target="_blank" rel="noopener">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15,3 21,3 21,9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                            ${this.truncateUrl(site.webUrl)}
                        </a>
                    ` : ''}
                </div>
                <div class="site-actions">
                    <button class="btn-icon" title="Edit Connection" onclick="dashboard.editSite('${site.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon btn-icon-danger" title="Delete Site" onclick="dashboard.deleteSite('${site.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                    <div class="site-menu-toggle" onclick="dashboard.toggleSiteMenu('${site.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="19" cy="12" r="1"></circle>
                            <circle cx="5" cy="12" r="1"></circle>
                        </svg>
                    </div>
                </div>
            </div>
            <div class="site-footer">
                <div class="site-status">
                    <div class="status-dot ${statusClass}"></div>
                    <span>${statusText}</span>
                </div>
                <button class="btn-secondary site-connect-btn" onclick="dashboard.openEditor('${site.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 12l2 2 4-4"></path>
                        <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1"></path>
                    </svg>
                    Open Editor
                </button>
            </div>
        `;
        
        return card;
    }
    
    editSite(siteId) {
        const site = this.sites.find(s => s.id === siteId);
        if (!site) return;
        
        // Populate form with site data
        const form = document.getElementById('addSiteForm');
        if (form) {
            form.querySelector('#siteName').value = site.name;
            form.querySelector('#siteHost')?.value = site.host;
            form.querySelector('#sitePort')?.value = site.port;
            form.querySelector('#siteUsername')?.value = site.username;
            form.querySelector('#sitePassword')?.value = ''; // Don't pre-fill password
            form.querySelector('#rootDirectory').value = site.rootDirectory || '';
            form.querySelector('#webUrl').value = site.webUrl || '';
            
            // Change form behavior to edit mode
            form.dataset.editingSiteId = siteId;
            
            // Update modal title
            const modalTitle = document.querySelector('#addSiteModal .modal-header h3');
            if (modalTitle) {
                modalTitle.textContent = 'Edit FTP Site';
            }
            
            // Update submit button text
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.textContent = 'Update Site';
            }
        }
        
        this.openAddSiteModal();
    }
    
    deleteSite(siteId) {
        const site = this.sites.find(s => s.id === siteId);
        if (!site) return;
        
        if (confirm(`Are you sure you want to delete the site "${site.name}"? This action cannot be undone.`)) {
            this.sites = this.sites.filter(s => s.id !== siteId);
            this.saveSites();
            this.renderSites();
            this.showNotification('Site deleted successfully.', 'success');
        }
    }
    
    toggleSiteMenu(siteId) {
        // Implementation for site context menu
        console.log('Toggle menu for site:', siteId);
    }
    
    openEditor(siteId) {
        const site = this.sites.find(s => s.id === siteId);
        if (!site) return;
        
        // Store current site info for editor
        sessionStorage.setItem('ezedit_current_site', JSON.stringify(site));
        
        // Navigate to editor
        window.location.href = '/editor.php';
    }
    
    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    truncateUrl(url, maxLength = 25) {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength) + '...';
    }
    
    showNotification(message, type = 'info') {
        // Use the global notification system
        if (window.EzEdit && window.EzEdit.utils && window.EzEdit.utils.showNotification) {
            window.EzEdit.utils.showNotification(message, type);
        } else {
            // Fallback to alert
            alert(message);
        }
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardManager;
}