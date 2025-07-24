/**
 * EzEdit.co FTP Client JavaScript
 * Handles FTP connections, file operations, and server communication
 */

class FTPService {
    constructor() {
        this.currentConnection = null;
        this.isConnected = false;
        this.baseUrl = '/ftp/ftp-handler.php';
        this.timeout = 30000; // 30 seconds
    }
    
    /**
     * Connect to FTP server
     * @param {Object} credentials - FTP connection details
     * @returns {Promise<boolean>} - Connection success status
     */
    async connect(credentials) {
        try {
            const response = await this.makeRequest('connect', credentials);
            
            if (response.success) {
                this.currentConnection = credentials;
                this.isConnected = true;
                this.notifyConnectionStatus('connected');
                return true;
            } else {
                throw new Error(response.error || 'Connection failed');
            }
        } catch (error) {
            console.error('FTP Connection Error:', error);
            this.isConnected = false;
            this.notifyConnectionStatus('disconnected');
            throw error;
        }
    }
    
    /**
     * Disconnect from FTP server
     * @returns {Promise<boolean>}
     */
    async disconnect() {
        try {
            if (this.isConnected) {
                await this.makeRequest('disconnect');
            }
            
            this.currentConnection = null;
            this.isConnected = false;
            this.notifyConnectionStatus('disconnected');
            
            return true;
        } catch (error) {
            console.error('FTP Disconnect Error:', error);
            return false;
        }
    }
    
    /**
     * List files in directory
     * @param {string} directory - Directory path
     * @returns {Promise<Array>} - Array of file objects
     */
    async listFiles(directory = '/') {
        this.ensureConnected();
        
        try {
            const response = await this.makeRequest('list', {
                directory: directory
            });
            
            if (response.success) {
                return response.files || [];
            } else {
                throw new Error(response.error || 'Failed to list files');
            }
        } catch (error) {
            console.error('FTP List Files Error:', error);
            throw error;
        }
    }
    
    /**
     * Get file content
     * @param {string} filePath - Path to file
     * @returns {Promise<string>} - File content
     */
    async getFile(filePath) {
        this.ensureConnected();
        
        try {
            const response = await this.makeRequest('get', {
                file_path: filePath
            });
            
            if (response.success) {
                return response.content || '';
            } else {
                throw new Error(response.error || 'Failed to get file content');
            }
        } catch (error) {
            console.error('FTP Get File Error:', error);
            throw error;
        }
    }
    
    /**
     * Upload/Save file content
     * @param {string} filePath - Path to file
     * @param {string} content - File content
     * @returns {Promise<boolean>} - Success status
     */
    async putFile(filePath, content) {
        this.ensureConnected();
        
        try {
            const response = await this.makeRequest('put', {
                file_path: filePath,
                content: content
            });
            
            if (response.success) {
                return true;
            } else {
                throw new Error(response.error || 'Failed to save file');
            }
        } catch (error) {
            console.error('FTP Put File Error:', error);
            throw error;
        }
    }
    
    /**
     * Create directory
     * @param {string} directory - Directory path
     * @returns {Promise<boolean>} - Success status
     */
    async createDirectory(directory) {
        this.ensureConnected();
        
        try {
            const response = await this.makeRequest('mkdir', {
                directory: directory
            });
            
            return response.success;
        } catch (error) {
            console.error('FTP Create Directory Error:', error);
            throw error;
        }
    }
    
    /**
     * Delete file
     * @param {string} filePath - Path to file
     * @returns {Promise<boolean>} - Success status
     */
    async deleteFile(filePath) {
        this.ensureConnected();
        
        try {
            const response = await this.makeRequest('delete', {
                file_path: filePath
            });
            
            return response.success;
        } catch (error) {
            console.error('FTP Delete File Error:', error);
            throw error;
        }
    }
    
    /**
     * Rename/move file
     * @param {string} oldPath - Current file path
     * @param {string} newPath - New file path
     * @returns {Promise<boolean>} - Success status
     */
    async renameFile(oldPath, newPath) {
        this.ensureConnected();
        
        try {
            const response = await this.makeRequest('rename', {
                old_path: oldPath,
                new_path: newPath
            });
            
            return response.success;
        } catch (error) {
            console.error('FTP Rename File Error:', error);
            throw error;
        }
    }
    
    /**
     * Get file permissions
     * @param {string} filePath - Path to file
     * @returns {Promise<string>} - File permissions
     */
    async getPermissions(filePath) {
        this.ensureConnected();
        
        try {
            const response = await this.makeRequest('permissions', {
                file_path: filePath
            });
            
            if (response.success) {
                return response.permissions || '644';
            } else {
                throw new Error(response.error || 'Failed to get permissions');
            }
        } catch (error) {
            console.error('FTP Get Permissions Error:', error);
            throw error;
        }
    }
    
    /**
     * Set file permissions
     * @param {string} filePath - Path to file
     * @param {string} permissions - Octal permissions (e.g., '644', '755')
     * @returns {Promise<boolean>} - Success status
     */
    async setPermissions(filePath, permissions) {
        this.ensureConnected();
        
        try {
            const response = await this.makeRequest('chmod', {
                file_path: filePath,
                permissions: permissions
            });
            
            return response.success;
        } catch (error) {
            console.error('FTP Set Permissions Error:', error);
            throw error;
        }
    }
    
    /**
     * Test FTP connection without storing credentials
     * @param {Object} credentials - FTP connection details
     * @returns {Promise<Object>} - Test result
     */
    async testConnection(credentials) {
        try {
            const response = await this.makeRequest('test', credentials);
            
            return {
                success: response.success,
                message: response.message || (response.success ? 'Connection successful' : 'Connection failed'),
                serverInfo: response.server_info || null
            };
        } catch (error) {
            console.error('FTP Test Connection Error:', error);
            return {
                success: false,
                message: error.message || 'Connection test failed',
                serverInfo: null
            };
        }
    }
    
    /**
     * Get current connection status
     * @returns {Object} - Connection status info
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            currentConnection: this.currentConnection ? {
                host: this.currentConnection.host,
                port: this.currentConnection.port,
                username: this.currentConnection.username
            } : null
        };
    }
    
    /**
     * Make HTTP request to FTP handler
     * @private
     * @param {string} action - FTP action
     * @param {Object} data - Request data
     * @returns {Promise<Object>} - Response data
     */
    async makeRequest(action, data = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        try {
            const formData = new FormData();
            formData.append('action', action);
            
            // Add connection data for most operations
            if (this.currentConnection && action !== 'connect' && action !== 'test') {
                Object.entries(this.currentConnection).forEach(([key, value]) => {
                    formData.append(key, value);
                });
            }
            
            // Add specific operation data
            Object.entries(data).forEach(([key, value]) => {
                formData.append(key, value);
            });
            
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                body: formData,
                signal: controller.signal,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                const text = await response.text();
                // Try to parse as JSON, fallback to error
                try {
                    return JSON.parse(text);
                } catch {
                    throw new Error('Invalid response format: ' + text.substring(0, 100));
                }
            }
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - server took too long to respond');
            }
            
            throw error;
        }
    }
    
    /**
     * Ensure FTP connection is active
     * @private
     * @throws {Error} - If not connected
     */
    ensureConnected() {
        if (!this.isConnected || !this.currentConnection) {
            throw new Error('Not connected to FTP server. Please connect first.');
        }
    }
    
    /**
     * Notify UI of connection status changes
     * @private
     * @param {string} status - Connection status
     */
    notifyConnectionStatus(status) {
        // Dispatch custom event for UI updates
        const event = new CustomEvent('ftpConnectionStatusChanged', {
            detail: {
                status: status,
                isConnected: this.isConnected,
                connection: this.currentConnection ? {
                    host: this.currentConnection.host,
                    port: this.currentConnection.port
                } : null
            }
        });
        
        document.dispatchEvent(event);
    }
    
    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} - Formatted size
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Get file type from extension
     * @param {string} fileName - File name
     * @returns {string} - File type
     */
    static getFileType(fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        
        const typeMap = {
            // Web files
            'html': 'html',
            'htm': 'html',
            'php': 'php',
            'css': 'css',
            'js': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'jsx': 'javascript',
            'vue': 'vue',
            
            // Images
            'jpg': 'image',
            'jpeg': 'image',
            'png': 'image',
            'gif': 'image',
            'svg': 'image',
            'webp': 'image',
            
            // Documents
            'txt': 'text',
            'md': 'markdown',
            'pdf': 'pdf',
            'doc': 'document',
            'docx': 'document',
            
            // Data
            'json': 'json',
            'xml': 'xml',
            'csv': 'csv',
            'sql': 'sql',
            
            // Archives
            'zip': 'archive',
            'tar': 'archive',
            'gz': 'archive',
            '7z': 'archive',
            
            // Other
            'log': 'log'
        };
        
        return typeMap[extension] || 'file';
    }
}

// Initialize FTP service globally
window.FTPService = FTPService;

// For module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FTPService;
}