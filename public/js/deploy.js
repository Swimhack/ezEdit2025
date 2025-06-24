/**
 * ezEdit - Digital Ocean Deployment JavaScript
 * Handles the deployment UI interactions and API calls
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize services
  window.ezEdit = window.ezEdit || {};
  window.ezEdit.memory = window.ezEdit.memory || new MemoryService();
  window.ezEdit.digitalOcean = window.ezEdit.digitalOcean || new DigitalOceanService();
  
  // Initialize UI elements
  const connectBtn = document.getElementById('connect-do-btn');
  const connectionStatus = document.getElementById('do-connection-status');
  const deployBtns = document.querySelectorAll('.deploy-btn');
  const connectModal = document.getElementById('connect-do-modal');
  const appPlatformModal = document.getElementById('app-platform-modal');
  const dropletModal = document.getElementById('droplet-modal');
  const spacesModal = document.getElementById('spaces-modal');
  const successModal = document.getElementById('deploy-success-modal');
  const closeModalBtns = document.querySelectorAll('.close-modal');
  const historyEmpty = document.getElementById('history-empty');
  const historyTable = document.getElementById('history-table');
  const historyTbody = document.getElementById('history-tbody');
  
  // Check if already connected to Digital Ocean
  checkDigitalOceanConnection();
  
  // Event listeners
  connectBtn.addEventListener('click', openConnectModal);
  closeModalBtns.forEach(btn => btn.addEventListener('click', closeAllModals));
  
  // Set up form submissions
  setupConnectForm();
  setupAppPlatformForm();
  setupDropletForm();
  setupSpacesForm();
  
  // Set up deployment buttons
  deployBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const deployType = e.target.dataset.type;
      openDeployModal(deployType);
    });
  });
  
  /**
   * Check if connected to Digital Ocean
   */
  async function checkDigitalOceanConnection() {
    try {
      // Initialize from memory
      window.ezEdit.digitalOcean.initializeFromMemory();
      
      // Check if token exists
      const hasToken = window.ezEdit.digitalOcean.hasToken();
      
      if (hasToken) {
        // Validate token by fetching account info
        const accountInfo = await window.ezEdit.digitalOcean.getAccountInfo();
        
        if (accountInfo && accountInfo.account) {
          // Update UI to show connected state
          updateConnectionStatus(true, accountInfo.account.email);
          enableDeploymentOptions();
          loadDeploymentHistory();
        } else {
          updateConnectionStatus(false);
        }
      } else {
        updateConnectionStatus(false);
      }
    } catch (error) {
      console.error('Error checking Digital Ocean connection:', error);
      updateConnectionStatus(false);
    }
  }
  
  /**
   * Update connection status UI
   */
  function updateConnectionStatus(isConnected, email = '') {
    if (isConnected) {
      connectionStatus.classList.remove('not-connected');
      connectionStatus.classList.add('connected');
      connectionStatus.querySelector('.status-text').textContent = `Connected to DigitalOcean as ${email}`;
      connectBtn.textContent = 'Disconnect';
      connectBtn.classList.remove('primary');
      connectBtn.classList.add('secondary');
    } else {
      connectionStatus.classList.remove('connected');
      connectionStatus.classList.add('not-connected');
      connectionStatus.querySelector('.status-text').textContent = 'Not connected to DigitalOcean';
      connectBtn.textContent = 'Connect Account';
      connectBtn.classList.remove('secondary');
      connectBtn.classList.add('primary');
    }
  }
  
  /**
   * Enable deployment options
   */
  function enableDeploymentOptions() {
    deployBtns.forEach(btn => {
      btn.disabled = false;
    });
  }
  
  /**
   * Open connect modal
   */
  function openConnectModal() {
    // If already connected, disconnect instead of opening modal
    if (connectionStatus.classList.contains('connected')) {
      disconnectDigitalOcean();
      return;
    }
    
    // Otherwise open the connect modal
    connectModal.style.display = 'flex';
    
    // Pre-fill token if exists
    const tokenInput = document.getElementById('do-api-token');
    if (tokenInput && window.ezEdit.digitalOcean.token) {
      tokenInput.value = window.ezEdit.digitalOcean.token;
    }
  }
  
  /**
   * Open deployment modal based on type
   */
  function openDeployModal(type) {
    switch (type) {
      case 'app-platform':
        appPlatformModal.style.display = 'flex';
        break;
      case 'droplet':
        dropletModal.style.display = 'flex';
        break;
      case 'spaces':
        spacesModal.style.display = 'flex';
        break;
    }
  }
  
  /**
   * Close all modals
   */
  function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.style.display = 'none';
    });
  }
  
  /**
   * Disconnect from Digital Ocean
   */
  function disconnectDigitalOcean() {
    window.ezEdit.digitalOcean.clearToken();
    updateConnectionStatus(false);
    
    // Disable deployment options
    deployBtns.forEach(btn => {
      btn.disabled = true;
    });
    
    // Clear deployment history
    clearDeploymentHistory();
  }
  
  /**
   * Set up connect form submission
   */
  function setupConnectForm() {
    const connectForm = document.getElementById('connect-do-form');
    if (!connectForm) return;
    
    connectForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const tokenInput = document.getElementById('do-api-token');
      const token = tokenInput.value.trim();
      
      if (!token) {
        showFormError(connectForm, 'Please enter a valid API token');
        return;
      }
      
      // Show loading state
      const submitBtn = connectForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Connecting...';
      
      try {
        // Set token and validate
        window.ezEdit.digitalOcean.setToken(token);
        const accountInfo = await window.ezEdit.digitalOcean.getAccountInfo();
        
        if (accountInfo && accountInfo.account) {
          // Save token to memory
          window.ezEdit.digitalOcean.saveTokenToMemory();
          
          // Update UI
          updateConnectionStatus(true, accountInfo.account.email);
          enableDeploymentOptions();
          loadDeploymentHistory();
          
          // Close modal
          closeAllModals();
        } else {
          showFormError(connectForm, 'Invalid API token');
        }
      } catch (error) {
        console.error('Error connecting to Digital Ocean:', error);
        showFormError(connectForm, 'Failed to connect: ' + error.message);
      } finally {
        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
  
  /**
   * Set up App Platform form submission
   */
  function setupAppPlatformForm() {
    const appPlatformForm = document.getElementById('app-platform-form');
    if (!appPlatformForm) return;
    
    appPlatformForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const appName = document.getElementById('app-name').value.trim();
      const appRegion = document.getElementById('app-region').value;
      const appTier = document.getElementById('app-tier').value;
      
      if (!appName) {
        showFormError(appPlatformForm, 'Please enter an app name');
        return;
      }
      
      // Show loading state
      const submitBtn = appPlatformForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Deploying...';
      
      try {
        // Deploy to App Platform
        const deployResult = await window.ezEdit.digitalOcean.deployToAppPlatform({
          name: appName,
          region: appRegion,
          tier: appTier
        });
        
        // Show success modal
        showDeploymentSuccess('app-platform', deployResult);
        
        // Add to deployment history
        addDeploymentToHistory({
          type: 'App Platform',
          name: appName,
          region: appRegion,
          status: 'Deploying',
          date: new Date().toISOString(),
          url: deployResult.liveUrl || '#'
        });
        
        // Close modal
        closeAllModals();
        
        // Open success modal
        successModal.style.display = 'flex';
      } catch (error) {
        console.error('Error deploying to App Platform:', error);
        showFormError(appPlatformForm, 'Deployment failed: ' + error.message);
      } finally {
        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
  
  /**
   * Set up Droplet form submission
   */
  function setupDropletForm() {
    const dropletForm = document.getElementById('droplet-form');
    if (!dropletForm) return;
    
    dropletForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const dropletName = document.getElementById('droplet-name').value.trim();
      const dropletRegion = document.getElementById('droplet-region').value;
      const dropletSize = document.getElementById('droplet-size').value;
      const dropletImage = document.getElementById('droplet-image').value;
      
      if (!dropletName) {
        showFormError(dropletForm, 'Please enter a droplet name');
        return;
      }
      
      // Show loading state
      const submitBtn = dropletForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating...';
      
      try {
        // Create droplet
        const dropletResult = await window.ezEdit.digitalOcean.createDroplet({
          name: dropletName,
          region: dropletRegion,
          size: dropletSize,
          image: dropletImage
        });
        
        // Show success modal
        showDeploymentSuccess('droplet', dropletResult);
        
        // Add to deployment history
        addDeploymentToHistory({
          type: 'Droplet',
          name: dropletName,
          region: dropletRegion,
          status: 'Creating',
          date: new Date().toISOString(),
          id: dropletResult.id
        });
        
        // Close modal
        closeAllModals();
        
        // Open success modal
        successModal.style.display = 'flex';
      } catch (error) {
        console.error('Error creating droplet:', error);
        showFormError(dropletForm, 'Droplet creation failed: ' + error.message);
      } finally {
        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
  
  /**
   * Set up Spaces form submission
   */
  function setupSpacesForm() {
    const spacesForm = document.getElementById('spaces-form');
    if (!spacesForm) return;
    
    spacesForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const spaceName = document.getElementById('space-name').value.trim();
      const spaceRegion = document.getElementById('space-region').value;
      const cdnEnabled = document.getElementById('cdn-enabled').checked;
      
      if (!spaceName) {
        showFormError(spacesForm, 'Please enter a space name');
        return;
      }
      
      // Show loading state
      const submitBtn = spacesForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating...';
      
      try {
        // Create space
        const spaceResult = await window.ezEdit.digitalOcean.createSpace({
          name: spaceName,
          region: spaceRegion,
          cdnEnabled: cdnEnabled
        });
        
        // Show success modal
        showDeploymentSuccess('space', spaceResult);
        
        // Add to deployment history
        addDeploymentToHistory({
          type: 'Space',
          name: spaceName,
          region: spaceRegion,
          status: 'Active',
          date: new Date().toISOString(),
          url: spaceResult.url || '#'
        });
        
        // Close modal
        closeAllModals();
        
        // Open success modal
        successModal.style.display = 'flex';
      } catch (error) {
        console.error('Error creating space:', error);
        showFormError(spacesForm, 'Space creation failed: ' + error.message);
      } finally {
        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
  
  /**
   * Show form error
   */
  function showFormError(form, message) {
    let errorElement = form.querySelector('.form-error');
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'form-error';
      form.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  }
  
  /**
   * Show deployment success
   */
  function showDeploymentSuccess(type, data) {
    const successDetails = document.getElementById('success-details');
    const deploymentInfo = document.getElementById('deployment-info');
    const viewDeploymentBtn = document.getElementById('view-deployment-btn');
    
    // Set success message based on type
    switch (type) {
      case 'app-platform':
        successDetails.textContent = 'Your application is now being deployed to DigitalOcean App Platform. This process may take a few minutes to complete.';
        deploymentInfo.innerHTML = `
          <p><strong>App Name:</strong> ${data.name}</p>
          <p><strong>Region:</strong> ${data.region}</p>
          <p><strong>Status:</strong> ${data.status}</p>
          ${data.liveUrl ? `<p><strong>URL:</strong> <a href="${data.liveUrl}" target="_blank">${data.liveUrl}</a></p>` : ''}
        `;
        
        if (data.liveUrl) {
          viewDeploymentBtn.addEventListener('click', () => {
            window.open(data.liveUrl, '_blank');
          });
        } else {
          viewDeploymentBtn.style.display = 'none';
        }
        break;
        
      case 'droplet':
        successDetails.textContent = 'Your droplet is being created. Once active, ezEdit will be automatically deployed to it.';
        deploymentInfo.innerHTML = `
          <p><strong>Droplet Name:</strong> ${data.name}</p>
          <p><strong>Region:</strong> ${data.region && data.region.name || data.region}</p>
          <p><strong>Size:</strong> ${data.size_slug || data.size}</p>
          <p><strong>Status:</strong> ${data.status}</p>
          ${data.ip_address ? `<p><strong>IP Address:</strong> ${data.ip_address}</p>` : ''}
        `;
        
        if (data.ip_address) {
          viewDeploymentBtn.addEventListener('click', () => {
            window.open(`http://${data.ip_address}`, '_blank');
          });
        } else {
          viewDeploymentBtn.style.display = 'none';
        }
        break;
        
      case 'space':
        successDetails.textContent = 'Your Space has been created successfully.';
        deploymentInfo.innerHTML = `
          <p><strong>Space Name:</strong> ${data.name}</p>
          <p><strong>Region:</strong> ${data.region}</p>
          <p><strong>CDN Enabled:</strong> ${data.cdnEnabled ? 'Yes' : 'No'}</p>
          ${data.url ? `<p><strong>URL:</strong> <a href="${data.url}" target="_blank">${data.url}</a></p>` : ''}
        `;
        
        if (data.url) {
          viewDeploymentBtn.addEventListener('click', () => {
            window.open(data.url, '_blank');
          });
        } else {
          viewDeploymentBtn.style.display = 'none';
        }
        break;
    }
  }
  
  /**
   * Load deployment history
   */
  function loadDeploymentHistory() {
    // Get deployment history from memory
    const deployments = window.ezEdit.memory.getDeployments?.() || [];
    
    if (deployments.length === 0) {
      historyEmpty.style.display = 'block';
      historyTable.style.display = 'none';
      return;
    }
    
    historyEmpty.style.display = 'none';
    historyTable.style.display = 'table';
    
    // Clear existing rows
    historyTbody.innerHTML = '';
    
    // Add rows for each deployment
    deployments.forEach(deployment => {
      const row = document.createElement('tr');
      
      // Format date
      const date = new Date(deployment.date);
      const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      
      // Create row
      row.innerHTML = `
        <td>${deployment.type}</td>
        <td>${deployment.name}</td>
        <td>${deployment.region}</td>
        <td><span class="status-pill ${deployment.status.toLowerCase()}">${deployment.status}</span></td>
        <td>${formattedDate}</td>
        <td>
          ${deployment.url ? `<a href="${deployment.url}" target="_blank" class="btn small">View</a>` : ''}
          ${deployment.id ? `<button class="btn small secondary view-details" data-id="${deployment.id}">Details</button>` : ''}
        </td>
      `;
      
      historyTbody.appendChild(row);
    });
    
    // Add event listeners to view details buttons
    const viewDetailsBtns = historyTbody.querySelectorAll('.view-details');
    viewDetailsBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        viewDeploymentDetails(id);
      });
    });
  }
  
  /**
   * Add deployment to history
   */
  function addDeploymentToHistory(deployment) {
    // Get existing deployments
    const deployments = window.ezEdit.memory.getDeployments?.() || [];
    
    // Add new deployment
    deployments.unshift(deployment);
    
    // Save to memory
    if (window.ezEdit.memory.setDeployments) {
      window.ezEdit.memory.setDeployments(deployments);
    }
    
    // Update UI
    loadDeploymentHistory();
  }
  
  /**
   * Clear deployment history
   */
  function clearDeploymentHistory() {
    if (window.ezEdit.memory.setDeployments) {
      window.ezEdit.memory.setDeployments([]);
    }
    
    historyEmpty.style.display = 'block';
    historyTable.style.display = 'none';
    historyTbody.innerHTML = '';
  }
  
  /**
   * View deployment details
   */
  async function viewDeploymentDetails(id) {
    try {
      // Get deployment details
      const details = await window.ezEdit.digitalOcean.getDroplet(id);
      
      if (details && details.droplet) {
        // Show details in success modal
        showDeploymentSuccess('droplet', details.droplet);
        successModal.style.display = 'flex';
      }
    } catch (error) {
      console.error('Error getting deployment details:', error);
      alert('Failed to get deployment details: ' + error.message);
    }
  }
  
  // Initialize deployment functionality by checking connection
  checkDigitalOceanConnection();
});

// Add deployment methods to MemoryService if not exists
if (window.MemoryService && !MemoryService.prototype.getDeployments) {
  MemoryService.prototype.getDeployments = function() {
    if (!this.memory.deployments) {
      this.memory.deployments = [];
      this.saveMemory();
    }
    return this.memory.deployments;
  };
  
  MemoryService.prototype.setDeployments = function(deployments) {
    this.memory.deployments = deployments;
    this.saveMemory();
  };
}
