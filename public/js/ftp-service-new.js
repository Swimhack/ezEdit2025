/**
 * EzEdit FTP Service
 * Handles FTP operations for the EzEdit application
 * @version 1.1.0
 */

window.ezEdit = window.ezEdit || {};

window.ezEdit.ftpService = (function() {
    // Private variables
    let currentPath = '/';
    let currentSiteId = null;
    let connectionId = null;
    let isConnected = false;
    let connectionStatus = 'disconnected'; // 'disconnected', 'connecting', 'connected', 'error'
    let lastError = null;
    
    // Base URL for FTP API - detect environment and use appropriate path
    const API_BASE_URL = (function() {
        // Check if we're running on a production domain
        const isProduction = window.location.hostname !== 'localhost' && 
                          !window.location.hostname.includes('127.0.0.1');
        
        // Get the base URL of the current page
        const getBaseUrl = () => {
            const baseUrl = window.location.pathname.split('/');
            // Remove the last part (current file)
            baseUrl.pop();
            return baseUrl.join('/');
        };
        
        // In production, use absolute path
        if (isProduction) {
            return '/ftp/ftp-handler.php';
        }
        
        // In development, use path relative to the current page
        return `${getBaseUrl()}/ftp/ftp-handler.php`;
    })();
    
    /**
     * Connect to FTP server
     * @param {Object} credentials - FTP credentials (optional, will use site ID if not provided)
     * @returns {Promise<Object>} - Connection result
     */
    async function connect(credentials = null) {
        if (isConnected && connectionId) {
            return { success: true, connectionId, message: 'Already connected' };
        }
        
        connectionStatus = 'connecting';
        lastError = null;
        
        try {
            // If credentials not provided, use site ID
            const params = credentials ? 
                new URLSearchParams(credentials) : 
                new URLSearchParams({ site_id: currentSiteId });
            
            params.append('action', 'connect');
            
            console.log(`Connecting to FTP server via ${API_BASE_URL}`);
            const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                connectionId = data.connection_id;
                isConnected = true;
                connectionStatus = 'connected';
                console.log('FTP connection established successfully');
            } else {
                connectionStatus = 'error';
                lastError = data.error || 'Unknown connection error';
                console.error('FTP connection failed:', lastError);
            }
            
            return data;
        } catch (error) {
            connectionStatus = 'error';
            lastError = error.message || 'Connection failed';
            console.error('FTP connection error:', lastError);
            return {
                success: false,
                error: lastError
            };
        }
    }
    
    /**
     * Check connection status
     * @returns {Promise<Object>} - Connection status
     */
    async function checkStatus() {
        if (!connectionId) {
            return { 
                success: false, 
                connected: false,
                error: 'Not connected',
                status: connectionStatus
            };
        }
        
        try {
            const params = new URLSearchParams({
                action: 'status',
                connection_id: connectionId
            });
            
            const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
            const data = await response.json();
            
            // Update connection state based on result
            isConnected = data.connected === true;
            connectionStatus = isConnected ? 'connected' : 'disconnected';
            
            return data;
        } catch (error) {
            connectionStatus = 'error';
            lastError = error.message || 'Failed to check status';
            return {
                success: false,
                error: lastError
            };
        }
    }
    
    /**
     * Disconnect from FTP server
     * @returns {Promise<Object>} - Disconnect result
     */
    async function disconnect() {
        if (!connectionId) {
            return { success: true, message: 'Not connected' };
        }
        
        try {
            const params = new URLSearchParams({
                action: 'disconnect',
                connection_id: connectionId
            });
            
            const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
            const data = await response.json();
            
            // Reset connection state regardless of server response
            connectionId = null;
            isConnected = false;
            connectionStatus = 'disconnected';
            
            return data;
        } catch (error) {
            // Reset connection state even if there's an error
            connectionId = null;
            isConnected = false;
            connectionStatus = 'disconnected';
            lastError = error.message || 'Failed to disconnect';
            
            return {
                success: true, // Consider it a success since we're resetting the state anyway
                message: 'Disconnected locally, but server error occurred',
                error: lastError
            };
        }
    }
    
    /**
     * List directory contents
     * @param {string} path - Directory path
     * @returns {Promise<Object>} - Directory listing
     */
    async function listDirectory(path = '/') {
        // Update current path
        currentPath = path;
        
        // Ensure we're connected
        if (!isConnected) {
            const connectResult = await connect();
            if (!connectResult.success) {
                return connectResult;
            }
        }
        
        try {
            const params = new URLSearchParams({
                action: 'list',
                connection_id: connectionId,
                path: path
            });
            
            const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
            const data = await response.json();
            
            return data;
        } catch (error) {
            lastError = error.message || 'Failed to list directory';
            return {
                success: false,
                error: lastError
            };
        }
    }
    
    /**
     * Get file contents
     * @param {string} path - File path
     * @returns {Promise<Object>} - File contents
     */
    async function getFile(path) {
        // Ensure we're connected
        if (!isConnected) {
            const connectResult = await connect();
            if (!connectResult.success) {
                return connectResult;
            }
        }
        
        try {
            const params = new URLSearchParams({
                action: 'get',
                connection_id: connectionId,
                path: path
            });
            
            const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
            const data = await response.json();
            
            return data;
        } catch (error) {
            lastError = error.message || 'Failed to get file';
            return {
                success: false,
                error: lastError
            };
        }
    }
    
    /**
     * Save file contents
     * @param {string} path - File path
     * @param {string} content - File content
     * @returns {Promise<Object>} - Save result
     */
    async function saveFile(path, content) {
        // Ensure we're connected
        if (!isConnected) {
            const connectResult = await connect();
            if (!connectResult.success) {
                return connectResult;
            }
        }
        
        try {
            const params = new URLSearchParams({
                action: 'put',
                connection_id: connectionId,
                path: path
            });
            
            const response = await fetch(`${API_BASE_URL}?${params.toString()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream'
                },
                body: content
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            lastError = error.message || 'Failed to save file';
            return {
                success: false,
                error: lastError
            };
        }
    }
    
    /**
     * Create a new directory
     * @param {string} path - Directory path
     * @returns {Promise<Object>} - Create result
     */
    async function createDirectory(path) {
        // Ensure we're connected
        if (!isConnected) {
            const connectResult = await connect();
            if (!connectResult.success) {
                return connectResult;
            }
        }
        
        try {
            const params = new URLSearchParams({
                action: 'mkdir',
                connection_id: connectionId,
                path: path
            });
            
            const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
            const data = await response.json();
            
            return data;
        } catch (error) {
            lastError = error.message || 'Failed to create directory';
            return {
                success: false,
                error: lastError
            };
        }
    }
    
    /**
     * Delete a file or directory
     * @param {string} path - Path to delete
     * @param {boolean} isDirectory - Whether the path is a directory
     * @returns {Promise<Object>} - Delete result
     */
    async function deleteItem(path, isDirectory = false) {
        // Ensure we're connected
        if (!isConnected) {
            const connectResult = await connect();
            if (!connectResult.success) {
                return connectResult;
            }
        }
        
        try {
            const params = new URLSearchParams({
                action: 'delete',
                connection_id: connectionId,
                path: path,
                is_directory: isDirectory ? '1' : '0'
            });
            
            const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
            const data = await response.json();
            
            return data;
        } catch (error) {
            lastError = error.message || 'Failed to delete item';
            return {
                success: false,
                error: lastError
            };
        }
    }
    
    /**
     * Rename a file or directory
     * @param {string} oldPath - Original path
     * @param {string} newPath - New path
     * @returns {Promise<Object>} - Rename result
     */
    async function renameItem(oldPath, newPath) {
        // Ensure we're connected
        if (!isConnected) {
            const connectResult = await connect();
            if (!connectResult.success) {
                return connectResult;
            }
        }
        
        try {
            const params = new URLSearchParams({
                action: 'rename',
                connection_id: connectionId,
                old_path: oldPath,
                new_path: newPath
            });
            
            const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
            const data = await response.json();
            
            return data;
        } catch (error) {
            lastError = error.message || 'Failed to rename item';
            return {
                success: false,
                error: lastError
            };
        }
    }
    
    /**
     * Create a new file
     * @param {string} path - File path
     * @param {string} content - Initial content (optional)
     * @returns {Promise<Object>} - Create result
     */
    async function createFile(path, content = '') {
        // Ensure we're connected
        if (!isConnected) {
            const connectResult = await connect();
            if (!connectResult.success) {
                return connectResult;
            }
        }
        
        try {
            const params = new URLSearchParams({
                action: 'create',
                connection_id: connectionId,
                path: path
            });
            
            const response = await fetch(`${API_BASE_URL}?${params.toString()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: content
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            lastError = error.message || 'Failed to create file';
            return {
                success: false,
                error: lastError
            };
        }
    }
    
    /**
     * Set current site ID
     * @param {number} siteId - Site ID
     */
    function setSiteId(siteId) {
        // If site ID changes, disconnect first
        if (currentSiteId !== siteId && isConnected) {
            disconnect();
        }
        
        currentSiteId = siteId;
    }
    
    /**
     * Get current path
     * @returns {string} Current path
     */
    function getCurrentPath() {
        return currentPath;
    }
    
    /**
     * Get connection status
     * @returns {Object} Connection status
     */
    function getConnectionStatus() {
        return {
            isConnected: isConnected,
            connectionId: connectionId,
            status: connectionStatus,
            currentSiteId: currentSiteId,
            currentPath: currentPath
        };
    }
    
    /**
     * Get the last error message
     * @returns {string|null} Last error message
     */
    function getLastError() {
        return lastError;
    }
    
    /**
     * Reset the error state
     */
    function clearError() {
        lastError = null;
    }
    
    /**
     * Get the API base URL
     * @returns {string} API base URL
     */
    function getApiBaseUrl() {
        return API_BASE_URL;
    }
    
    // Public API
    return {
        connect,
        disconnect,
        checkStatus,
        listDirectory,
        getFile,
        saveFile,
        createDirectory,
        deleteItem,
        renameItem,
        createFile,
        setSiteId,
        getCurrentPath,
        getConnectionStatus,
        getLastError,
        clearError,
        getApiBaseUrl
    };
})();

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('FTP Service initialized');
    console.log('FTP API URL:', window.ezEdit.ftpService.getApiBaseUrl());
});
