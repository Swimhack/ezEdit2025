/**
 * EzEdit.co Editor JavaScript - Fixed Version
 * Monaco Editor integration and file management
 */

class EzEditor {
    constructor() {
        this.monaco = null;
        this.editor = null;
        this.currentFile = null;
        this.currentSite = null;
        this.openTabs = [];
        this.ftpService = null;
        this.init();
    }
    
    async init() {
        try {
            // Load current site from session storage
            this.loadCurrentSite();
            
            // Initialize Monaco Editor
            await this.initMonacoEditor();
            
            // Initialize FTP service
            this.initFTPService();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup layout
            this.setupLayout();
            
            console.log('EzEditor initialized successfully');
        } catch (error) {
            console.error('Failed to initialize EzEditor:', error);
            this.showError('Failed to initialize editor: ' + error.message);
        }
    }
    
    loadCurrentSite() {
        try {
            const siteData = sessionStorage.getItem('ezedit_current_site');
            if (siteData) {
                this.currentSite = JSON.parse(siteData);
                this.updateConnectionStatus();
            }
        } catch (error) {
            console.error('Error loading current site:', error);
        }
    }
    
    async initMonacoEditor() {
        return new Promise((resolve, reject) => {
            // Check if Monaco loader is available
            if (typeof window.require === 'undefined') {
                reject(new Error('Monaco Editor loader not found'));
                return;
            }
            
            // Configure Monaco Editor paths
            window.require.config({
                paths: {
                    'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
                }
            });
            
            // Load Monaco Editor
            window.require(['vs/editor/editor.main'], () => {
                try {
                    this.monaco = window.monaco;
                    
                    // Create editor instance
                    const editorContainer = document.getElementById('monacoEditor');
                    if (!editorContainer) {
                        reject(new Error('Editor container not found'));
                        return;
                    }
                    
                    this.editor = this.monaco.editor.create(editorContainer, {
                        value: '// Welcome to EzEdit.co\n// Connect to your FTP server and select a file to start editing',
                        language: 'javascript',
                        theme: 'vs-dark',
                        fontSize: 14,
                        lineNumbers: 'on',
                        minimap: { enabled: true },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        wordWrap: 'on',
                        tabSize: 4,
                        insertSpaces: true
                    });
                    
                    // Setup editor event listeners
                    this.setupEditorEventListeners();
                    
                    // Hide placeholder
                    this.hidePlaceholder();
                    
                    resolve();
                    
                } catch (error) {
                    reject(error);
                }
            }, (error) => {
                reject(new Error('Failed to load Monaco Editor: ' + error));
            });
        });
    }
    
    setupEditorEventListeners() {
        if (!this.editor) return;
        
        // File change detection
        this.editor.onDidChangeModelContent(() => {
            if (this.currentFile) {
                this.markTabAsModified(this.currentFile.path);
            }
        });
        
        // Keyboard shortcuts
        this.editor.addCommand(this.monaco.KeyMod.CtrlCmd | this.monaco.KeyCode.KeyS, () => {
            this.saveCurrentFile();
        });
        
        // Context menu customization
        this.editor.onContextMenu((e) => {
            // You can customize the context menu here
        });
    }
    
    initFTPService() {
        // Initialize FTP service (will be implemented in ftp-client.js)
        if (window.FTPService) {
            this.ftpService = new window.FTPService();
        } else {
            console.warn('FTP Service not available');
        }
    }
    
    setupEventListeners() {
        // Save button
        const saveButton = document.getElementById('saveFile');
        if (saveButton) {
            saveButton.addEventListener('click', () => this.saveCurrentFile());
        }
        
        // Connect FTP button
        const connectFTPButton = document.getElementById('connectFTP');
        if (connectFTPButton) {
            connectFTPButton.addEventListener('click', () => this.openFTPModal());
        }
        
        // Quick connect buttons
        const quickConnectButton = document.getElementById('quickConnect');
        if (quickConnectButton) {
            quickConnectButton.addEventListener('click', () => this.openFTPModal());
        }
        
        // Refresh files button
        const refreshButton = document.getElementById('refreshFiles');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => this.refreshFileTree());
        }
        
        // Demo button
        const openDemoButton = document.getElementById('openDemo');
        if (openDemoButton) {
            openDemoButton.addEventListener('click', () => this.loadDemoFile());
        }
        
        // FTP Modal events
        this.setupFTPModalEvents();
        
        // Window resize handler
        window.addEventListener('resize', () => {
            if (this.editor) {
                this.editor.layout();
            }
        });
    }
    
    setupFTPModalEvents() {
        const ftpModal = document.getElementById('ftpModal');
        const closeFtpModal = document.getElementById('closeFtpModal');
        const cancelConnect = document.getElementById('cancelConnect');
        const ftpForm = document.getElementById('ftpForm');
        
        if (closeFtpModal) {
            closeFtpModal.addEventListener('click', () => this.closeFTPModal());
        }
        
        if (cancelConnect) {
            cancelConnect.addEventListener('click', () => this.closeFTPModal());
        }
        
        if (ftpModal) {
            ftpModal.addEventListener('click', (e) => {
                if (e.target === ftpModal) {
                    this.closeFTPModal();
                }
            });
        }
        
        if (ftpForm) {
            ftpForm.addEventListener('submit', (e) => this.handleFTPConnect(e));
        }
    }
    
    setupLayout() {
        // Setup resizable panels if needed
        this.setupResizablePanels();
        
        // Setup AI assistant toggle
        const toggleAssistant = document.getElementById('toggleAssistant');
        if (toggleAssistant) {
            toggleAssistant.addEventListener('click', () => this.toggleAIAssistant());
        }
    }
    
    setupResizablePanels() {
        // Basic panel resizing functionality
        // This could be enhanced with a proper resizing library
        const editorMain = document.querySelector('.editor-main');
        if (editorMain) {
            // Set initial layout
            editorMain.style.gridTemplateColumns = '250px 1fr 300px';
        }
    }
    
    updateConnectionStatus() {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (this.currentSite && statusDot && statusText) {
            statusDot.classList.add('connected');
            statusText.textContent = `Connected to ${this.currentSite.name}`;
        } else if (statusDot && statusText) {
            statusDot.classList.remove('connected');
            statusText.textContent = 'Not Connected';
        }
    }
    
    openFTPModal() {
        const modal = document.getElementById('ftpModal');
        if (modal) {
            modal.classList.add('active');
            
            // Pre-fill form if current site exists
            if (this.currentSite) {
                this.populateFTPForm(this.currentSite);
            }
            
            // Focus first input
            const firstInput = modal.querySelector('input[type="text"]');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }
    
    closeFTPModal() {
        const modal = document.getElementById('ftpModal');
        if (modal) {
            modal.classList.remove('active');
            
            // Reset form
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
            }
        }
    }
    
    populateFTPForm(site) {
        const form = document.getElementById('ftpForm');
        if (!form) return;
        
        const fields = {
            'ftpHost': site.host,
            'ftpPort': site.port,
            'ftpUsername': site.username,
            'ftpPassword': '', // Don't pre-fill password
            'ftpSecure': site.secure || false
        };
        
        Object.entries(fields).forEach(([fieldId, value]) => {
            const field = form.querySelector('#' + fieldId);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = value;
                } else {
                    field.value = value;
                }
            }
        });
    }
    
    async handleFTPConnect(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        const connectionData = {
            host: formData.get('ftpHost') || form.querySelector('#ftpHost').value,
            port: formData.get('ftpPort') || form.querySelector('#ftpPort').value,
            username: formData.get('ftpUsername') || form.querySelector('#ftpUsername').value,
            password: formData.get('ftpPassword') || form.querySelector('#ftpPassword').value,
            secure: formData.get('ftpSecure') || form.querySelector('#ftpSecure').checked
        };
        
        // Validate connection data
        if (!this.validateConnectionData(connectionData)) {
            return;
        }
        
        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Connecting...';
        submitButton.disabled = true;
        
        try {
            // Attempt FTP connection
            const success = await this.connectToFTP(connectionData);
            
            if (success) {
                // Store connection info
                this.currentSite = {
                    name: connectionData.host,
                    ...connectionData
                };
                
                // Update UI
                this.updateConnectionStatus();
                this.loadFileTree();
                
                // Close modal
                this.closeFTPModal();
                
                this.showNotification('Connected successfully!', 'success');
            } else {
                throw new Error('Connection failed. Please check your credentials.');
            }
            
        } catch (error) {
            this.showError(error.message);
        } finally {
            // Reset button
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }
    
    validateConnectionData(data) {
        if (!data.host || data.host.trim().length < 3) {
            this.showError('Please enter a valid FTP host.');
            return false;
        }
        
        if (!data.port || isNaN(data.port) || data.port < 1 || data.port > 65535) {
            this.showError('Please enter a valid port number (1-65535).');
            return false;
        }
        
        if (!data.username || data.username.trim().length < 1) {
            this.showError('Please enter a username.');
            return false;
        }
        
        if (!data.password || data.password.length < 1) {
            this.showError('Please enter a password.');
            return false;
        }
        
        return true;
    }
    
    async connectToFTP(connectionData) {
        // Simulate FTP connection for demo
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // For demo purposes, always succeed
        const success = true;
        
        if (this.ftpService) {
            // Use actual FTP service when available
            return await this.ftpService.connect(connectionData);
        }
        
        return success;
    }
    
    async loadFileTree() {
        const fileTree = document.getElementById('fileTree');
        if (!fileTree) return;
        
        // Clear existing content
        fileTree.innerHTML = '<div class="loading">Loading files...</div>';
        
        try {
            // Simulate loading file tree
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Demo file structure
            const demoFiles = this.createDemoFileStructure();
            fileTree.innerHTML = demoFiles;
            
            // Setup file click handlers
            this.setupFileTreeHandlers();
            
        } catch (error) {
            fileTree.innerHTML = '<div class="error">Failed to load files</div>';
            console.error('Error loading file tree:', error);
        }
    }
    
    createDemoFileStructure() {
        return `
            <div class="file-item folder" data-path="/">
                <svg class="file-icon folder-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>public_html</span>
            </div>
            <div class="file-item" data-path="/index.php" data-type="php">
                <svg class="file-icon php" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span>index.php</span>
            </div>
            <div class="file-item" data-path="/style.css" data-type="css">
                <svg class="file-icon css" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span>style.css</span>
            </div>
            <div class="file-item" data-path="/script.js" data-type="js">
                <svg class="file-icon js" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span>script.js</span>
            </div>
        `;
    }
    
    setupFileTreeHandlers() {
        const fileItems = document.querySelectorAll('.file-item');
        fileItems.forEach(item => {
            if (!item.classList.contains('folder')) {
                item.addEventListener('click', () => {
                    const path = item.dataset.path;
                    const type = item.dataset.type;
                    if (path) {
                        this.openFile(path, type);
                    }
                });
                
                item.addEventListener('dblclick', () => {
                    const path = item.dataset.path;
                    if (path) {
                        this.openFile(path);
                    }
                });
            }
        });
    }
    
    async openFile(path, type = 'text') {
        try {
            // Show loading
            this.showNotification('Opening file...', 'info');
            
            // Get file content (demo)
            const content = await this.getFileContent(path, type);
            
            // Detect language from file extension
            const language = this.detectLanguage(path);
            
            // Create or update tab
            this.createTab(path, type);
            
            // Set editor content
            if (this.editor) {
                const model = this.monaco.editor.createModel(content, language);
                this.editor.setModel(model);
            }
            
            // Update current file
            this.currentFile = { path, type, content, modified: false };
            
            // Hide placeholder
            this.hidePlaceholder();
            
            this.showNotification('File opened successfully', 'success');
            
        } catch (error) {
            this.showError('Failed to open file: ' + error.message);
        }
    }
    
    async getFileContent(path, type) {
        // Simulate file loading
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Return demo content based on file type
        const demoContent = {
            '/index.php': '<?php\n// Demo PHP file\necho "Hello, World!";\n?>',
            '/style.css': '/* Demo CSS file */\nbody {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}\n\nh1 {\n    color: #333;\n}',
            '/script.js': '// Demo JavaScript file\nconsole.log("Hello, World!");\n\nfunction greet(name) {\n    return `Hello, ${name}!`;\n}\n\ngreet("EzEdit");'
        };
        
        return demoContent[path] || `// File: ${path}\n// Content loaded from FTP server`;
    }
    
    detectLanguage(path) {
        const extension = path.split('.').pop().toLowerCase();
        
        const languageMap = {
            'php': 'php',
            'js': 'javascript',
            'css': 'css',
            'html': 'html',
            'htm': 'html',
            'json': 'json',
            'xml': 'xml',
            'sql': 'sql',
            'py': 'python',
            'rb': 'ruby',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'cs': 'csharp',
            'go': 'go',
            'rs': 'rust',
            'ts': 'typescript',
            'tsx': 'typescript',
            'jsx': 'javascript',
            'vue': 'html',
            'md': 'markdown',
            'yaml': 'yaml',
            'yml': 'yaml',
            'sh': 'shell',
            'bash': 'shell'
        };
        
        return languageMap[extension] || 'plaintext';
    }
    
    createTab(path, type) {
        const fileTabs = document.getElementById('fileTabs');
        if (!fileTabs) return;
        
        // Check if tab already exists
        const existingTab = fileTabs.querySelector(`[data-path="${path}"]`);
        if (existingTab) {
            this.selectTab(existingTab);
            return;
        }
        
        // Create new tab
        const tab = document.createElement('div');
        tab.className = 'file-tab active';
        tab.dataset.path = path;
        
        const fileName = path.split('/').pop();
        tab.innerHTML = `
            <span>${fileName}</span>
            <button class="close-tab" onclick="window.ezEditor.closeTab('${path}')">&times;</button>
        `;
        
        // Deactivate other tabs
        fileTabs.querySelectorAll('.file-tab').forEach(t => t.classList.remove('active'));
        
        // Add new tab
        fileTabs.appendChild(tab);
        
        // Add to open tabs
        this.openTabs.push({ path, type });
    }
    
    selectTab(tab) {
        // Deactivate all tabs
        const fileTabs = document.getElementById('fileTabs');
        if (fileTabs) {
            fileTabs.querySelectorAll('.file-tab').forEach(t => t.classList.remove('active'));
        }
        
        // Activate selected tab
        tab.classList.add('active');
        
        // Load file content
        const path = tab.dataset.path;
        if (path) {
            this.openFile(path);
        }
    }
    
    closeTab(path) {
        const fileTabs = document.getElementById('fileTabs');
        if (!fileTabs) return;
        
        const tab = fileTabs.querySelector(`[data-path="${path}"]`);
        if (tab) {
            // Check if file is modified
            if (this.currentFile && this.currentFile.path === path && this.currentFile.modified) {
                if (!confirm('File has unsaved changes. Close anyway?')) {
                    return;
                }
            }
            
            // Remove tab
            tab.remove();
            
            // Remove from open tabs
            this.openTabs = this.openTabs.filter(t => t.path !== path);
            
            // If this was the active tab, activate another
            if (this.currentFile && this.currentFile.path === path) {
                const remainingTabs = fileTabs.querySelectorAll('.file-tab');
                if (remainingTabs.length > 0) {
                    this.selectTab(remainingTabs[remainingTabs.length - 1]);
                } else {
                    // No tabs left, show placeholder
                    this.showPlaceholder();
                    this.currentFile = null;
                }
            }
        }
    }
    
    markTabAsModified(path) {
        const fileTabs = document.getElementById('fileTabs');
        if (!fileTabs) return;
        
        const tab = fileTabs.querySelector(`[data-path="${path}"]`);
        if (tab && !tab.classList.contains('modified')) {
            tab.classList.add('modified');
            const fileName = tab.querySelector('span');
            if (fileName && !fileName.textContent.includes('●')) {
                fileName.textContent = '● ' + fileName.textContent;
            }
        }
        
        // Update current file status
        if (this.currentFile && this.currentFile.path === path) {
            this.currentFile.modified = true;
        }
    }
    
    async saveCurrentFile() {
        if (!this.currentFile || !this.editor) {
            this.showNotification('No file open to save', 'warning');
            return;
        }
        
        try {
            const content = this.editor.getValue();
            
            // Show saving state
            this.showNotification('Saving file...', 'info');
            
            // Simulate save (in real app, this would call FTP service)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Update file status
            this.currentFile.content = content;
            this.currentFile.modified = false;
            
            // Update tab (remove modified indicator)
            const fileTabs = document.getElementById('fileTabs');
            if (fileTabs) {
                const tab = fileTabs.querySelector(`[data-path="${this.currentFile.path}"]`);
                if (tab) {
                    tab.classList.remove('modified');
                    const fileName = tab.querySelector('span');
                    if (fileName) {
                        fileName.textContent = fileName.textContent.replace('● ', '');
                    }
                }
            }
            
            this.showNotification('File saved successfully!', 'success');
            
        } catch (error) {
            this.showError('Failed to save file: ' + error.message);
        }
    }
    
    loadDemoFile() {
        // Load a demo file to showcase the editor
        this.openFile('/index.php', 'php');
    }
    
    refreshFileTree() {
        if (this.currentSite) {
            this.loadFileTree();
        } else {
            this.showNotification('Connect to FTP server first', 'warning');
        }
    }
    
    toggleAIAssistant() {
        const aiAssistant = document.getElementById('aiAssistant');
        if (aiAssistant) {
            aiAssistant.classList.toggle('collapsed');
        }
    }
    
    hidePlaceholder() {
        const placeholder = document.getElementById('editorPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
    }
    
    showPlaceholder() {
        const placeholder = document.getElementById('editorPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'flex';
        }
    }
    
    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 9999;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white; padding: 12px 20px; border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
}

// Initialize editor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.ezEditor = new EzEditor();
});

// Export for global access
window.EzEditor = EzEditor;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EzEditor;
}