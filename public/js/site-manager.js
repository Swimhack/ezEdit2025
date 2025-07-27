/**
 * Simple Site Manager for EzEdit.co
 */

class SiteManager {
    constructor() {
        this.baseUrl = '../api/sites.php';
        this.sites = [];
        this.init();
    }
    
    async init() {
        await this.loadSites();
        this.renderSites();
        this.setupEventListeners();
    }
    
    async loadSites() {
        try {
            const response = await fetch(this.baseUrl);
            const data = await response.json();
            if (data.success) {
                this.sites = data.data || [];
            }
        } catch (error) {
            console.error('Failed to load sites:', error);
            this.sites = [];
        }
    }
    
    renderSites() {
        const sitesGrid = document.getElementById('sitesGrid');
        if (!sitesGrid) return;
        
        sitesGrid.innerHTML = '';
        
        this.sites.forEach(site => {
            const siteCard = document.createElement('div');
            siteCard.className = 'site-card';
            siteCard.innerHTML = `
                <div class="site-header">
                    <h3>${this.escapeHtml(site.site_name)}</h3>
                    <div class="site-actions">
                        <button onclick="siteManager.editSite('${site.id}')">Edit</button>
                        <button onclick="siteManager.deleteSite('${site.id}')">Delete</button>
                    </div>
                </div>
                <div class="site-info">
                    <p><strong>Host:</strong> ${this.escapeHtml(site.host)}:${site.port}</p>
                    <p><strong>Username:</strong> ${this.escapeHtml(site.username)}</p>
                    ${site.web_url ? `<p><strong>URL:</strong> <a href="${site.web_url}" target="_blank">${site.web_url}</a></p>` : ''}
                </div>
                <div class="site-footer">
                    <button class="btn btn-primary" onclick="siteManager.connectToSite('${site.id}')">Connect</button>
                </div>
            `;
            sitesGrid.appendChild(siteCard);
        });
        
        // Add the "Add Site" card
        const addCard = document.createElement('div');
        addCard.className = 'site-card add-site-card';
        addCard.onclick = () => this.showAddSiteModal();
        addCard.innerHTML = `
            <div class="add-site-content">
                <div class="add-icon">+</div>
                <h3>Add New Site</h3>
                <p>Connect to your FTP server</p>
            </div>
        `;
        sitesGrid.appendChild(addCard);
    }
    
    setupEventListeners() {
        const addSiteBtn = document.getElementById('addSiteBtn');
        if (addSiteBtn) {
            addSiteBtn.onclick = () => this.showAddSiteModal();
        }
        
        const addSiteForm = document.getElementById('addSiteForm');
        if (addSiteForm) {
            addSiteForm.onsubmit = (e) => this.handleAddSite(e);
        }
        
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.onclick = () => this.closeModal();
        }
        
        const cancelAdd = document.getElementById('cancelAdd');
        if (cancelAdd) {
            cancelAdd.onclick = () => this.closeModal();
        }
    }
    
    showAddSiteModal() {
        const modal = document.getElementById('addSiteModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }
    
    closeModal() {
        const modal = document.getElementById('addSiteModal');
        if (modal) {
            modal.style.display = 'none';
            // Reset form
            const form = document.getElementById('addSiteForm');
            if (form) form.reset();
        }
    }
    
    async handleAddSite(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const siteData = {
            site_name: formData.get('siteName'),
            host: formData.get('ftpHost'),
            port: formData.get('ftpPort'),
            username: formData.get('ftpUsername'),
            password: formData.get('ftpPassword'),
            root_directory: formData.get('rootDirectory') || '/',
            web_url: formData.get('webUrl')
        };
        
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(siteData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                await this.loadSites();
                this.renderSites();
                this.closeModal();
                this.showNotification('Site added successfully!', 'success');
            } else {
                this.showNotification('Failed to add site: ' + (data.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            this.showNotification('Error adding site: ' + error.message, 'error');
        }
    }
    
    async deleteSite(siteId) {
        if (!confirm('Are you sure you want to delete this site?')) return;
        
        try {
            const response = await fetch(this.baseUrl, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: siteId })
            });
            
            const data = await response.json();
            
            if (data.success) {
                await this.loadSites();
                this.renderSites();
                this.showNotification('Site deleted successfully!', 'success');
            } else {
                this.showNotification('Failed to delete site', 'error');
            }
        } catch (error) {
            this.showNotification('Error deleting site: ' + error.message, 'error');
        }
    }
    
    connectToSite(siteId) {
        window.location.href = `editor.html?site=${siteId}`;
    }
    
    editSite(siteId) {
        const site = this.sites.find(s => s.id === siteId);
        if (!site) return;
        
        // Populate form with site data
        document.getElementById('siteName').value = site.site_name;
        document.getElementById('ftpHost').value = site.host;
        document.getElementById('ftpPort').value = site.port;
        document.getElementById('ftpUsername').value = site.username;
        
        this.showAddSiteModal();
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            z-index: 1000;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize site manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.siteManager = new SiteManager();
});