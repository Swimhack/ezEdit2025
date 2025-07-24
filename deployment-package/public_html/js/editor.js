/**
 * EzEdit.co Editor JavaScript
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
    
    async initMonacoEditor() {\n        return new Promise((resolve, reject) => {\n            // Check if Monaco loader is available\n            if (typeof window.require === 'undefined') {\n                reject(new Error('Monaco Editor loader not found'));\n                return;\n            }\n            \n            // Configure Monaco Editor paths\n            window.require.config({\n                paths: {\n                    'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'\n                }\n            });\n            \n            // Load Monaco Editor\n            window.require(['vs/editor/editor.main'], () => {\n                try {\n                    this.monaco = window.monaco;\n                    \n                    // Create editor instance\n                    const editorContainer = document.getElementById('monacoEditor');\n                    if (!editorContainer) {\n                        reject(new Error('Editor container not found'));\n                        return;\n                    }\n                    \n                    this.editor = this.monaco.editor.create(editorContainer, {\n                        value: '// Welcome to EzEdit.co\\n// Connect to your FTP server and select a file to start editing',\n                        language: 'javascript',\n                        theme: 'vs-dark',\n                        fontSize: 14,\n                        lineNumbers: 'on',\n                        minimap: { enabled: true },\n                        scrollBeyondLastLine: false,\n                        automaticLayout: true,\n                        wordWrap: 'on',\n                        tabSize: 4,\n                        insertSpaces: true\n                    });\n                    \n                    // Setup editor event listeners\n                    this.setupEditorEventListeners();\n                    \n                    // Hide placeholder\n                    this.hidePlaceholder();\n                    \n                    resolve();\n                    \n                } catch (error) {\n                    reject(error);\n                }\n            }, (error) => {\n                reject(new Error('Failed to load Monaco Editor: ' + error));\n            });\n        });\n    }
    
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
        if (openDemoButton) {\n            openDemoButton.addEventListener('click', () => this.loadDemoFile());\n        }\n        \n        // FTP Modal events\n        this.setupFTPModalEvents();\n        \n        // Window resize handler\n        window.addEventListener('resize', () => {\n            if (this.editor) {\n                this.editor.layout();\n            }\n        });\n    }\n    \n    setupFTPModalEvents() {\n        const ftpModal = document.getElementById('ftpModal');\n        const closeFtpModal = document.getElementById('closeFtpModal');\n        const cancelConnect = document.getElementById('cancelConnect');\n        const ftpForm = document.getElementById('ftpForm');\n        \n        if (closeFtpModal) {\n            closeFtpModal.addEventListener('click', () => this.closeFTPModal());\n        }\n        \n        if (cancelConnect) {\n            cancelConnect.addEventListener('click', () => this.closeFTPModal());\n        }\n        \n        if (ftpModal) {\n            ftpModal.addEventListener('click', (e) => {\n                if (e.target === ftpModal) {\n                    this.closeFTPModal();\n                }\n            });\n        }\n        \n        if (ftpForm) {\n            ftpForm.addEventListener('submit', (e) => this.handleFTPConnect(e));\n        }\n    }\n    \n    setupLayout() {\n        // Setup resizable panels if needed\n        this.setupResizablePanels();\n        \n        // Setup AI assistant toggle\n        const toggleAssistant = document.getElementById('toggleAssistant');\n        if (toggleAssistant) {\n            toggleAssistant.addEventListener('click', () => this.toggleAIAssistant());\n        }\n    }\n    \n    setupResizablePanels() {\n        // Basic panel resizing functionality\n        // This could be enhanced with a proper resizing library\n        const editorMain = document.querySelector('.editor-main');\n        if (editorMain) {\n            // Set initial layout\n            editorMain.style.gridTemplateColumns = '250px 1fr 300px';\n        }\n    }
    
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
            modal.classList.add('show');
            
            // Pre-fill form if current site exists
            if (this.currentSite) {
                this.populateFTPForm(this.currentSite);
            }
            
            // Focus first input
            const firstInput = modal.querySelector('input[type=\"text\"]');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }
    
    closeFTPModal() {
        const modal = document.getElementById('ftpModal');
        if (modal) {
            modal.classList.remove('show');
            
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
        
        const fields = {\n            'ftpHost': site.host,\n            'ftpPort': site.port,\n            'ftpUsername': site.username,\n            'ftpPassword': '', // Don't pre-fill password\n            'ftpSecure': site.secure || false\n        };\n        \n        Object.entries(fields).forEach(([fieldId, value]) => {\n            const field = form.querySelector('#' + fieldId);\n            if (field) {\n                if (field.type === 'checkbox') {\n                    field.checked = value;\n                } else {\n                    field.value = value;\n                }\n            }\n        });\n    }\n    \n    async handleFTPConnect(e) {\n        e.preventDefault();\n        \n        const form = e.target;\n        const formData = new FormData(form);\n        \n        const connectionData = {\n            host: formData.get('ftpHost') || form.querySelector('#ftpHost').value,\n            port: formData.get('ftpPort') || form.querySelector('#ftpPort').value,\n            username: formData.get('ftpUsername') || form.querySelector('#ftpUsername').value,\n            password: formData.get('ftpPassword') || form.querySelector('#ftpPassword').value,\n            secure: formData.get('ftpSecure') || form.querySelector('#ftpSecure').checked\n        };\n        \n        // Validate connection data\n        if (!this.validateConnectionData(connectionData)) {\n            return;\n        }\n        \n        // Show loading state\n        const submitButton = form.querySelector('button[type=\"submit\"]');\n        const originalText = submitButton.textContent;\n        submitButton.textContent = 'Connecting...';\n        submitButton.disabled = true;\n        \n        try {\n            // Attempt FTP connection\n            const success = await this.connectToFTP(connectionData);\n            \n            if (success) {\n                // Store connection info\n                this.currentSite = {\n                    name: connectionData.host,\n                    ...connectionData\n                };\n                \n                // Update UI\n                this.updateConnectionStatus();\n                this.loadFileTree();\n                \n                // Close modal\n                this.closeFTPModal();\n                \n                this.showNotification('Connected successfully!', 'success');\n            } else {\n                throw new Error('Connection failed. Please check your credentials.');\n            }\n            \n        } catch (error) {\n            this.showError(error.message);\n        } finally {\n            // Reset button\n            submitButton.textContent = originalText;\n            submitButton.disabled = false;\n        }\n    }\n    \n    validateConnectionData(data) {\n        if (!data.host || data.host.trim().length < 3) {\n            this.showError('Please enter a valid FTP host.');\n            return false;\n        }\n        \n        if (!data.port || isNaN(data.port) || data.port < 1 || data.port > 65535) {\n            this.showError('Please enter a valid port number (1-65535).');\n            return false;\n        }\n        \n        if (!data.username || data.username.trim().length < 1) {\n            this.showError('Please enter a username.');\n            return false;\n        }\n        \n        if (!data.password || data.password.length < 1) {\n            this.showError('Please enter a password.');\n            return false;\n        }\n        \n        return true;\n    }\n    \n    async connectToFTP(connectionData) {\n        // Simulate FTP connection for demo\n        await new Promise(resolve => setTimeout(resolve, 2000));\n        \n        // For demo purposes, randomly succeed or fail\n        const success = Math.random() > 0.2; // 80% success rate\n        \n        if (this.ftpService) {\n            // Use actual FTP service when available\n            return await this.ftpService.connect(connectionData);\n        }\n        \n        return success;\n    }
    
    async loadFileTree() {
        const fileTree = document.getElementById('fileTree');
        if (!fileTree) return;
        
        // Clear existing content
        fileTree.innerHTML = '<div class=\"loading\">Loading files...</div>';
        
        try {
            // Simulate loading file tree
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Demo file structure
            const demoFiles = this.createDemoFileStructure();
            fileTree.innerHTML = demoFiles;
            
            // Setup file click handlers
            this.setupFileTreeHandlers();
            
        } catch (error) {
            fileTree.innerHTML = '<div class=\"error\">Failed to load files</div>';
            console.error('Error loading file tree:', error);
        }
    }
    
    createDemoFileStructure() {
        return `
            <div class=\"file-item folder\" data-path=\"/\">
                <svg class=\"file-icon folder-icon\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">
                    <path d=\"M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z\"></path>
                </svg>
                <span>public_html</span>
            </div>
            <div class=\"file-item\" data-path=\"/index.php\" data-type=\"php\">
                <svg class=\"file-icon php\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">
                    <path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"></path>
                    <polyline points=\"14 2 14 8 20 8\"></polyline>
                </svg>
                <span>index.php</span>
            </div>
            <div class=\"file-item\" data-path=\"/style.css\" data-type=\"css\">
                <svg class=\"file-icon css\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">
                    <path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"></path>
                    <polyline points=\"14 2 14 8 20 8\"></polyline>
                </svg>
                <span>style.css</span>
            </div>
            <div class=\"file-item\" data-path=\"/script.js\" data-type=\"js\">
                <svg class=\"file-icon js\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">
                    <path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"></path>
                    <polyline points=\"14 2 14 8 20 8\"></polyline>
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
            
            // Hide placeholder\n            this.hidePlaceholder();\n            \n            this.showNotification('File opened successfully', 'success');\n            \n        } catch (error) {\n            this.showError('Failed to open file: ' + error.message);\n        }\n    }\n    \n    async getFileContent(path, type) {\n        // Simulate file loading\n        await new Promise(resolve => setTimeout(resolve, 500));\n        \n        // Return demo content based on file type\n        const demoContent = {\n            '/index.php': '<?php\\n// Demo PHP file\\necho \"Hello, World!\";\\n?>',\n            '/style.css': '/* Demo CSS file */\\nbody {\\n    font-family: Arial, sans-serif;\\n    margin: 0;\\n    padding: 20px;\\n}\\n\\nh1 {\\n    color: #333;\\n}',\n            '/script.js': '// Demo JavaScript file\\nconsole.log(\"Hello, World!\");\\n\\nfunction greet(name) {\\n    return `Hello, ${name}!`;\\n}\\n\\ngreet(\"EzEdit\");'\n        };\n        \n        return demoContent[path] || `// File: ${path}\\n// Content loaded from FTP server`;\n    }\n    \n    detectLanguage(path) {\n        const extension = path.split('.').pop().toLowerCase();\n        \n        const languageMap = {\n            'php': 'php',\n            'js': 'javascript',\n            'css': 'css',\n            'html': 'html',\n            'htm': 'html',\n            'json': 'json',\n            'xml': 'xml',\n            'sql': 'sql',\n            'py': 'python',\n            'rb': 'ruby',\n            'java': 'java',\n            'cpp': 'cpp',\n            'c': 'c',\n            'cs': 'csharp',\n            'go': 'go',\n            'rs': 'rust',\n            'ts': 'typescript',\n            'tsx': 'typescript',\n            'jsx': 'javascript',\n            'vue': 'html',\n            'md': 'markdown',\n            'yaml': 'yaml',\n            'yml': 'yaml',\n            'sh': 'shell',\n            'bash': 'shell'\n        };\n        \n        return languageMap[extension] || 'plaintext';\n    }\n    \n    createTab(path, type) {\n        const fileTabs = document.getElementById('fileTabs');\n        if (!fileTabs) return;\n        \n        // Check if tab already exists\n        const existingTab = fileTabs.querySelector(`[data-path=\"${path}\"]`);\n        if (existingTab) {\n            this.selectTab(existingTab);\n            return;\n        }\n        \n        // Create new tab\n        const tab = document.createElement('div');\n        tab.className = 'file-tab active';\n        tab.dataset.path = path;\n        \n        const fileName = path.split('/').pop();\n        tab.innerHTML = `\n            <span>${fileName}</span>\n            <button class=\"close-tab\" onclick=\"ezEditor.closeTab('${path}')\">&times;</button>\n        `;\n        \n        // Deactivate other tabs\n        fileTabs.querySelectorAll('.file-tab').forEach(t => t.classList.remove('active'));\n        \n        // Add new tab\n        fileTabs.appendChild(tab);\n        \n        // Add to open tabs\n        this.openTabs.push({ path, type });\n    }\n    \n    selectTab(tab) {\n        // Deactivate all tabs\n        const fileTabs = document.getElementById('fileTabs');\n        if (fileTabs) {\n            fileTabs.querySelectorAll('.file-tab').forEach(t => t.classList.remove('active'));\n        }\n        \n        // Activate selected tab\n        tab.classList.add('active');\n        \n        // Load file content\n        const path = tab.dataset.path;\n        if (path) {\n            this.openFile(path);\n        }\n    }\n    \n    closeTab(path) {\n        const fileTabs = document.getElementById('fileTabs');\n        if (!fileTabs) return;\n        \n        const tab = fileTabs.querySelector(`[data-path=\"${path}\"]`);\n        if (tab) {\n            // Check if file is modified\n            if (this.currentFile && this.currentFile.path === path && this.currentFile.modified) {\n                if (!confirm('File has unsaved changes. Close anyway?')) {\n                    return;\n                }\n            }\n            \n            // Remove tab\n            tab.remove();\n            \n            // Remove from open tabs\n            this.openTabs = this.openTabs.filter(t => t.path !== path);\n            \n            // If this was the active tab, activate another\n            if (this.currentFile && this.currentFile.path === path) {\n                const remainingTabs = fileTabs.querySelectorAll('.file-tab');\n                if (remainingTabs.length > 0) {\n                    this.selectTab(remainingTabs[remainingTabs.length - 1]);\n                } else {\n                    // No tabs left, show placeholder\n                    this.showPlaceholder();\n                    this.currentFile = null;\n                }\n            }\n        }\n    }\n    \n    markTabAsModified(path) {\n        const fileTabs = document.getElementById('fileTabs');\n        if (!fileTabs) return;\n        \n        const tab = fileTabs.querySelector(`[data-path=\"${path}\"]`);\n        if (tab && !tab.classList.contains('modified')) {\n            tab.classList.add('modified');\n            const fileName = tab.querySelector('span');\n            if (fileName && !fileName.textContent.includes('●')) {\n                fileName.textContent = '● ' + fileName.textContent;\n            }\n        }\n        \n        // Update current file status\n        if (this.currentFile && this.currentFile.path === path) {\n            this.currentFile.modified = true;\n        }\n    }\n    \n    async saveCurrentFile() {\n        if (!this.currentFile || !this.editor) {\n            this.showNotification('No file open to save', 'warning');\n            return;\n        }\n        \n        try {\n            const content = this.editor.getValue();\n            \n            // Show saving state\n            this.showNotification('Saving file...', 'info');\n            \n            // Simulate save (in real app, this would call FTP service)\n            await new Promise(resolve => setTimeout(resolve, 1000));\n            \n            // Update file status\n            this.currentFile.content = content;\n            this.currentFile.modified = false;\n            \n            // Update tab (remove modified indicator)\n            const fileTabs = document.getElementById('fileTabs');\n            if (fileTabs) {\n                const tab = fileTabs.querySelector(`[data-path=\"${this.currentFile.path}\"]`);\n                if (tab) {\n                    tab.classList.remove('modified');\n                    const fileName = tab.querySelector('span');\n                    if (fileName) {\n                        fileName.textContent = fileName.textContent.replace('● ', '');\n                    }\n                }\n            }\n            \n            this.showNotification('File saved successfully!', 'success');\n            \n        } catch (error) {\n            this.showError('Failed to save file: ' + error.message);\n        }\n    }\n    \n    loadDemoFile() {\n        // Load a demo file to showcase the editor\n        this.openFile('/index.php', 'php');\n    }\n    \n    refreshFileTree() {\n        if (this.currentSite) {\n            this.loadFileTree();\n        } else {\n            this.showNotification('Connect to FTP server first', 'warning');\n        }\n    }\n    \n    toggleAIAssistant() {\n        const aiAssistant = document.getElementById('aiAssistant');\n        if (aiAssistant) {\n            aiAssistant.classList.toggle('collapsed');\n        }\n    }\n    \n    hidePlaceholder() {\n        const placeholder = document.getElementById('editorPlaceholder');\n        if (placeholder) {\n            placeholder.classList.add('hidden');\n        }\n    }\n    \n    showPlaceholder() {\n        const placeholder = document.getElementById('editorPlaceholder');\n        if (placeholder) {\n            placeholder.classList.remove('hidden');\n        }\n    }\n    \n    showNotification(message, type = 'info') {\n        if (window.EzEdit && window.EzEdit.utils && window.EzEdit.utils.showNotification) {\n            window.EzEdit.utils.showNotification(message, type);\n        } else {\n            console.log(`${type.toUpperCase()}: ${message}`);\n        }\n    }\n    \n    showError(message) {\n        this.showNotification(message, 'error');\n    }\n}\n\n// Initialize editor when DOM is ready\ndocument.addEventListener('DOMContentLoaded', () => {\n    window.ezEditor = new EzEditor();\n});\n\n// Export for global access\nwindow.EzEditor = EzEditor;\n\n// Export for module systems\nif (typeof module !== 'undefined' && module.exports) {\n    module.exports = EzEditor;\n}"}, {"old_string": "    async initMonacoEditor() {\n        return new Promise((resolve, reject) => {\n            // Check if Monaco loader is available\n            if (typeof window.require === 'undefined') {\n                reject(new Error('Monaco Editor loader not found'));\n                return;\n            }\n            \n            // Configure Monaco Editor paths\n            window.require.config({\n                paths: {\n                    'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'\n                }\n            });\n            \n            // Load Monaco Editor\n            window.require(['vs/editor/editor.main'], () => {\n                try {\n                    this.monaco = window.monaco;\n                    \n                    // Create editor instance\n                    const editorContainer = document.getElementById('monacoEditor');\n                    if (!editorContainer) {\n                        reject(new Error('Editor container not found'));\n                        return;\n                    }\n                    \n                    this.editor = this.monaco.editor.create(editorContainer, {\n                        value: '// Welcome to EzEdit.co\\n// Connect to your FTP server and select a file to start editing',\n                        language: 'javascript',\n                        theme: 'vs-dark',\n                        fontSize: 14,\n                        lineNumbers: 'on',\n                        minimap: { enabled: true },\n                        scrollBeyondLastLine: false,\n                        automaticLayout: true,\n                        wordWrap: 'on',\n                        tabSize: 4,\n                        insertSpaces: true\n                    });\n                    \n                    // Setup editor event listeners\n                    this.setupEditorEventListeners();\n                    \n                    // Hide placeholder\n                    this.hidePlaceholder();\n                    \n                    resolve();\n                    \n                } catch (error) {\n                    reject(error);\n                }\n            }, (error) => {\n                reject(new Error('Failed to load Monaco Editor: ' + error));\n            });\n        });\n    }"}]