/**
 * FTP Connector Module
 * Handles FTP site management and connections for ezEdit
 */

window.ezEdit = window.ezEdit || {};

window.ezEdit.ftpConnector = (function() {
  // Private variables
  const ftpService = window.ezEdit.ftpService;
  const memoryService = window.ezEdit.memoryService;
  const SITES_STORAGE_KEY = 'ezEdit_ftp_sites';
  
  // Site management
  async function getAllSites() {
    try {
      const sites = await memoryService.get(SITES_STORAGE_KEY) || [];
      return sites;
    } catch (error) {
      console.error('Error loading FTP sites:', error);
      return [];
    }
  }
  
  async function addSite(siteData) {
    try {
      // Validate required fields
      if (!siteData.name || !siteData.host || !siteData.username || !siteData.password) {
        throw new Error('Missing required site information');
      }
      
      // Generate unique ID for the site
      siteData.id = 'site_' + Date.now();
      siteData.createdAt = new Date().toISOString();
      siteData.lastConnected = null;
      
      // Set defaults if not provided
      siteData.port = siteData.port || 21;
      siteData.passive = siteData.passive !== false;
      siteData.rootDir = siteData.rootDir || '/';
      
      // Encrypt sensitive data
      const encryptedPassword = await memoryService.encrypt(siteData.password);
      siteData.password = encryptedPassword;
      
      // Get existing sites and add new one
      const sites = await getAllSites();
      sites.push(siteData);
      
      // Save updated sites list
      await memoryService.set(SITES_STORAGE_KEY, sites);
      
      return {
        success: true,
        siteId: siteData.id,
        message: `Site ${siteData.name} added successfully`
      };
    } catch (error) {
      console.error('Error adding FTP site:', error);
      return {
        success: false,
        error: error.message || 'Failed to add site'
      };
    }
  }
  
  async function updateSite(siteId, updatedData) {
    try {
      const sites = await getAllSites();
      const siteIndex = sites.findIndex(site => site.id === siteId);
      
      if (siteIndex === -1) {
        throw new Error('Site not found');
      }
      
      // Get the existing site
      const existingSite = sites[siteIndex];
      
      // Update fields
      const updatedSite = {
        ...existingSite,
        name: updatedData.name || existingSite.name,
        host: updatedData.host || existingSite.host,
        port: updatedData.port || existingSite.port,
        username: updatedData.username || existingSite.username,
        rootDir: updatedData.rootDir || existingSite.rootDir,
        passive: updatedData.passive !== undefined ? updatedData.passive : existingSite.passive,
        updatedAt: new Date().toISOString()
      };
      
      // Update password if provided
      if (updatedData.password) {
        updatedSite.password = await memoryService.encrypt(updatedData.password);
      }
      
      // Update in array
      sites[siteIndex] = updatedSite;
      
      // Save updated sites
      await memoryService.set(SITES_STORAGE_KEY, sites);
      
      return {
        success: true,
        message: `Site ${updatedSite.name} updated successfully`
      };
    } catch (error) {
      console.error('Error updating FTP site:', error);
      return {
        success: false,
        error: error.message || 'Failed to update site'
      };
    }
  }
  
  async function deleteSite(siteId) {
    try {
      const sites = await getAllSites();
      const updatedSites = sites.filter(site => site.id !== siteId);
      
      if (sites.length === updatedSites.length) {
        throw new Error('Site not found');
      }
      
      await memoryService.set(SITES_STORAGE_KEY, updatedSites);
      
      return {
        success: true,
        message: 'Site deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting FTP site:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete site'
      };
    }
  }
  
  async function getSiteById(siteId) {
    try {
      const sites = await getAllSites();
      const site = sites.find(site => site.id === siteId);
      
      if (!site) {
        throw new Error('Site not found');
      }
      
      // Create a copy without exposing the encrypted password
      const siteCopy = { ...site };
      delete siteCopy.password;
      
      return {
        success: true,
        site: siteCopy
      };
    } catch (error) {
      console.error('Error getting FTP site:', error);
      return {
        success: false,
        error: error.message || 'Failed to get site'
      };
    }
  }
  
  // Connection management
  async function connectToSite(siteId) {
    try {
      const sites = await getAllSites();
      const site = sites.find(site => site.id === siteId);
      
      if (!site) {
        throw new Error('Site not found');
      }
      
      // Decrypt password
      const decryptedPassword = await memoryService.decrypt(site.password);
      
      // Connect using FTP service
      const connectionResult = await ftpService.connect({
        host: site.host,
        port: site.port,
        user: site.username,
        password: decryptedPassword,
        passive: site.passive
      });
      
      if (!connectionResult.success) {
        throw new Error(connectionResult.error || 'Connection failed');
      }
      
      // Update last connected timestamp
      const siteIndex = sites.findIndex(s => s.id === siteId);
      sites[siteIndex].lastConnected = new Date().toISOString();
      await memoryService.set(SITES_STORAGE_KEY, sites);
      
      // Store connection info in session storage for current session
      sessionStorage.setItem('currentSiteId', siteId);
      sessionStorage.setItem('connectionId', connectionResult.connectionId);
      
      return {
        success: true,
        connectionId: connectionResult.connectionId,
        message: `Connected to ${site.name} successfully`
      };
    } catch (error) {
      console.error('Error connecting to FTP site:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect to site'
      };
    }
  }
  
  async function testConnection(connectionData) {
    try {
      // Connect using FTP service
      const connectionResult = await ftpService.connect({
        host: connectionData.host,
        port: connectionData.port || 21,
        user: connectionData.username,
        password: connectionData.password,
        passive: connectionData.passive !== false
      });
      
      if (!connectionResult.success) {
        throw new Error(connectionResult.error || 'Test connection failed');
      }
      
      // Disconnect after successful test
      await ftpService.disconnect(connectionResult.connectionId);
      
      return {
        success: true,
        message: 'Connection test successful'
      };
    } catch (error) {
      console.error('Error testing FTP connection:', error);
      return {
        success: false,
        error: error.message || 'Connection test failed'
      };
    }
  }
  
  // Public API
  return {
    getAllSites,
    addSite,
    updateSite,
    deleteSite,
    getSiteById,
    connectToSite,
    testConnection
  };
})();
