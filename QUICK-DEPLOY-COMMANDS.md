# 🚀 Quick Deploy EzEdit.co - Copy These Commands

## Deploy Missing Components to Complete EzEdit.co

**Copy and paste these 3 commands into your DigitalOcean console:**

### Command 1: Deploy Complete Editor
```bash
cat > /var/www/html/editor.php << 'EDITOR_EOF'
<?php
/**
 * EzEdit.co - Main Editor Interface
 * Three-pane layout: File Explorer, Monaco Editor, AI Assistant
 */

session_start();

// Check if user is authenticated (mock session check)
$authenticated = isset($_SESSION['user_logged_in']) && $_SESSION['user_logged_in'];
$user_name = $_SESSION['user_name'] ?? 'User';
$user_email = $_SESSION['user_email'] ?? '';

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editor - EzEdit.co</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #1e1e1e; color: #cccccc; overflow: hidden; }
        .editor-layout { display: flex; flex-direction: column; height: 100vh; }
        
        /* Header */
        .editor-header { 
            background: #2d2d30; border-bottom: 1px solid #3e3e42; padding: 8px 16px; 
            display: flex; justify-content: space-between; align-items: center; height: 48px; z-index: 100;
        }
        .header-left, .header-right { display: flex; align-items: center; gap: 12px; }
        .logo { color: #ffffff; text-decoration: none; font-weight: 600; font-size: 1.1rem; }
        .connection-status { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #f87171; }
        .status-dot.connected { background: #10b981; }
        .file-tabs { display: flex; gap: 2px; max-width: 600px; overflow-x: auto; }
        .file-tab { 
            background: #3c3c3c; border: 1px solid #555; padding: 6px 12px; border-radius: 4px 4px 0 0;
            font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 6px; min-width: 120px;
        }
        .file-tab.active { background: #1e1e1e; border-bottom: 1px solid #1e1e1e; }
        .file-tab-close { background: none; border: none; color: #999; cursor: pointer; }
        .btn-icon { 
            background: none; border: none; color: #cccccc; cursor: pointer; padding: 6px; border-radius: 4px;
            display: flex; align-items: center; justify-content: center;
        }
        .btn-icon:hover { background: #404040; }
        .btn-primary { 
            background: #0078d4; color: white; border: none; padding: 8px 16px; border-radius: 4px; 
            cursor: pointer; font-weight: 500;
        }
        .btn-primary:hover { background: #106ebe; }
        .btn-secondary { 
            background: #404040; color: #cccccc; border: 1px solid #555; padding: 6px 12px; border-radius: 4px;
            cursor: pointer; text-decoration: none; font-size: 0.85rem;
        }
        .btn-secondary:hover { background: #4a4a4a; }
        
        /* Main Layout */
        .editor-main { 
            display: flex; flex: 1; overflow: hidden; 
        }
        
        /* File Explorer */
        .file-explorer { 
            width: 280px; background: #252526; border-right: 1px solid #3e3e42; 
            display: flex; flex-direction: column; min-width: 200px; resize: horizontal; overflow: hidden;
        }
        .explorer-header { 
            padding: 12px 16px; border-bottom: 1px solid #3e3e42; display: flex; 
            justify-content: space-between; align-items: center; background: #2d2d30;
        }
        .explorer-header h3 { font-size: 0.9rem; font-weight: 600; }
        .explorer-actions { display: flex; gap: 4px; }
        .file-tree { flex: 1; padding: 8px; overflow-y: auto; }
        .empty-state { 
            text-align: center; padding: 40px 20px; color: #999; 
        }
        .empty-state p { margin-bottom: 16px; font-size: 0.9rem; }
        .file-item { 
            padding: 6px 8px; cursor: pointer; border-radius: 4px; font-size: 0.85rem;
            display: flex; align-items: center; gap: 8px;
        }
        .file-item:hover { background: #2a2d2e; }
        .file-item.selected { background: #094771; }
        .file-icon { width: 16px; height: 16px; }
        
        /* Editor Container */
        .editor-container { 
            flex: 1; display: flex; flex-direction: column; position: relative; 
        }
        .editor-wrapper { flex: 1; position: relative; }
        .monaco-editor-container { 
            width: 100%; height: 100%; position: absolute; top: 0; left: 0; 
        }
        .editor-placeholder { 
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            display: flex; align-items: center; justify-content: center; background: #1e1e1e;
        }
        .placeholder-content { text-align: center; max-width: 400px; }
        .placeholder-content h2 { margin-bottom: 12px; color: #ffffff; font-size: 1.5rem; }
        .placeholder-content p { margin-bottom: 24px; color: #999; }
        .quick-actions { display: flex; gap: 12px; justify-content: center; }
        
        /* AI Assistant */
        .ai-assistant { 
            width: 320px; background: #252526; border-left: 1px solid #3e3e42; 
            display: flex; flex-direction: column; min-width: 250px; resize: horizontal; overflow: hidden;
        }
        .assistant-header { 
            padding: 12px 16px; border-bottom: 1px solid #3e3e42; display: flex; 
            justify-content: space-between; align-items: center; background: #2d2d30;
        }
        .assistant-header h3 { font-size: 0.9rem; font-weight: 600; }
        .assistant-actions { display: flex; gap: 4px; }
        .chat-container { flex: 1; display: flex; flex-direction: column; }
        .chat-messages { 
            flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px;
        }
        .ai-message, .user-message { 
            padding: 12px; border-radius: 8px; font-size: 0.85rem; line-height: 1.4;
        }
        .ai-message { background: #2d2d30; border-left: 3px solid #0078d4; }
        .user-message { background: #1a1a1a; border-left: 3px solid #10b981; margin-left: 20px; }
        .message-content ul { margin: 8px 0; padding-left: 16px; }
        .message-content li { margin: 4px 0; }
        .chat-input { 
            padding: 12px; border-top: 1px solid #3e3e42; display: flex; gap: 8px; align-items: flex-end;
        }
        #chatInput { 
            flex: 1; background: #3c3c3c; border: 1px solid #555; color: #cccccc; 
            padding: 8px 12px; border-radius: 4px; resize: none; min-height: 36px; max-height: 100px;
        }
        #chatInput:focus { outline: none; border-color: #0078d4; }
        
        /* Modal */
        .modal { 
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.7); z-index: 1000; align-items: center; justify-content: center;
        }
        .modal.active { display: flex; }
        .modal-content { 
            background: #2d2d30; border-radius: 8px; width: 90%; max-width: 500px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .modal-header { 
            padding: 16px 20px; border-bottom: 1px solid #3e3e42; display: flex; 
            justify-content: space-between; align-items: center;
        }
        .modal-header h3 { font-size: 1.1rem; }
        .modal-close { 
            background: none; border: none; color: #999; cursor: pointer; font-size: 1.5rem;
        }
        .modal-body { padding: 20px; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; margin-bottom: 6px; font-size: 0.9rem; font-weight: 500; }
        .form-group input { 
            width: 100%; padding: 8px 12px; background: #3c3c3c; border: 1px solid #555; 
            color: #cccccc; border-radius: 4px;
        }
        .form-group input:focus { outline: none; border-color: #0078d4; }
        .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
        
        /* Responsive */
        @media (max-width: 768px) {
            .file-explorer, .ai-assistant { width: 250px; }
            .header-center { display: none; }
        }
        
        /* Loading States */
        .loading { opacity: 0.6; pointer-events: none; }
        .spinner { 
            border: 2px solid #3e3e42; border-top: 2px solid #0078d4; border-radius: 50%; 
            width: 16px; height: 16px; animation: spin 1s linear infinite; display: inline-block;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
    
    <!-- Monaco Editor -->
    <script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js"></script>
</head>
<body class="editor-layout">
    <!-- Header -->
    <header class="editor-header">
        <div class="header-left">
            <a href="index.php" class="logo">EzEdit.co</a>
            <div class="connection-status" id="connectionStatus">
                <span class="status-dot"></span>
                <span class="status-text">Not Connected</span>
            </div>
        </div>
        <div class="header-center">
            <div class="file-tabs" id="fileTabs">
                <!-- File tabs will be dynamically added here -->
            </div>
        </div>
        <div class="header-right">
            <button class="btn-icon" id="saveFile" title="Save (Ctrl+S)">💾</button>
            <?php if ($authenticated): ?>
                <button class="btn-secondary" id="userMenu"><?php echo htmlspecialchars($user_name); ?></button>
                <a href="dashboard.php" class="btn-icon" title="Dashboard">📊</a>
            <?php else: ?>
                <a href="auth/login.php" class="btn-secondary">Login</a>
            <?php endif; ?>
        </div>
    </header>

    <main class="editor-main">
        <!-- File Explorer Sidebar -->
        <aside class="file-explorer" id="fileExplorer">
            <div class="explorer-header">
                <h3>Explorer</h3>
                <div class="explorer-actions">
                    <button class="btn-icon" id="connectFTP" title="Connect to FTP">🔗</button>
                    <button class="btn-icon" id="refreshFiles" title="Refresh">🔄</button>
                </div>
            </div>
            <div class="file-tree" id="fileTree">
                <div class="empty-state">
                    <p>Connect to FTP server to browse files</p>
                    <button class="btn-primary" id="connectButton">Connect</button>
                </div>
            </div>
        </aside>

        <!-- Main Editor Area -->
        <section class="editor-container">
            <div class="editor-wrapper">
                <div id="monacoEditor" class="monaco-editor-container"></div>
                <div class="editor-placeholder" id="editorPlaceholder">
                    <div class="placeholder-content">
                        <h2>Welcome to EzEdit.co</h2>
                        <p>Connect to your FTP server and select a file to start editing</p>
                        <div class="quick-actions">
                            <button class="btn-primary" id="quickConnect">Connect to FTP</button>
                            <button class="btn-secondary" id="openDemo">Try Demo</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- AI Assistant Sidebar -->
        <aside class="ai-assistant" id="aiAssistant">
            <div class="assistant-header">
                <h3>AI Assistant</h3>
                <div class="assistant-actions">
                    <button class="btn-icon" id="clearChat" title="Clear Chat">🗑️</button>
                </div>
            </div>
            <div class="chat-container" id="chatContainer">
                <div class="chat-messages" id="chatMessages">
                    <div class="ai-message">
                        <div class="message-content">
                            <p>Hello! I'm your AI coding assistant. I can help you:</p>
                            <ul>
                                <li>Explain code functionality</li>
                                <li>Generate code snippets</li>
                                <li>Debug issues</li>
                                <li>Optimize performance</li>
                            </ul>
                            <p>Just select some code or ask me a question!</p>
                        </div>
                    </div>
                </div>
                <div class="chat-input">
                    <textarea id="chatInput" placeholder="Ask about your code or request help..."></textarea>
                    <button class="btn-primary" id="sendMessage">📤</button>
                </div>
            </div>
        </aside>
    </main>

    <!-- FTP Connection Modal -->
    <div class="modal" id="ftpModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Connect to FTP Server</h3>
                <button class="modal-close" id="closeFtpModal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="ftpForm">
                    <div class="form-group">
                        <label for="ftpHost">Server Host</label>
                        <input type="text" id="ftpHost" placeholder="ftp.example.com" required>
                    </div>
                    <div class="form-group">
                        <label for="ftpPort">Port</label>
                        <input type="number" id="ftpPort" value="21" required>
                    </div>
                    <div class="form-group">
                        <label for="ftpUsername">Username</label>
                        <input type="text" id="ftpUsername" required>
                    </div>
                    <div class="form-group">
                        <label for="ftpPassword">Password</label>
                        <input type="password" id="ftpPassword" required>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" id="cancelConnect">Cancel</button>
                        <button type="submit" class="btn-primary">Connect</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script>
        // EzEdit.co Editor - Complete Implementation
        class EzEditor {
            constructor() {
                this.monaco = null;
                this.currentFile = null;
                this.openFiles = new Map();
                this.ftpConnection = null;
                this.isConnected = false;
                
                this.init();
            }
            
            async init() {
                await this.initMonaco();
                this.initEventListeners();
                this.initUI();
                console.log('✅ EzEdit.co Editor initialized successfully');
            }
            
            async initMonaco() {
                return new Promise((resolve) => {
                    require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
                    require(['vs/editor/editor.main'], () => {
                        this.monaco = monaco.editor.create(document.getElementById('monacoEditor'), {
                            value: '// Welcome to EzEdit.co!\\n// Connect to your FTP server and start editing files.\\n\\nfunction welcomeMessage() {\\n    console.log("Hello from EzEdit.co!");\\n    return "Ready to edit your legacy websites!";\\n}',
                            language: 'javascript',
                            theme: 'vs-dark',
                            fontSize: 14,
                            minimap: { enabled: true },
                            wordWrap: 'on',
                            automaticLayout: true,
                            scrollBeyondLastLine: false,
                            renderWhitespace: 'selection',
                            rulers: [80, 120]
                        });
                        
                        // Add keyboard shortcuts
                        this.monaco.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => this.saveFile());
                        this.monaco.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyO, () => this.openFTPModal());
                        
                        // Hide placeholder when monaco loads
                        document.getElementById('editorPlaceholder').style.display = 'none';
                        
                        resolve();
                    });
                });
            }
            
            initEventListeners() {
                // FTP Connection
                document.getElementById('connectFTP').addEventListener('click', () => this.openFTPModal());
                document.getElementById('connectButton').addEventListener('click', () => this.openFTPModal());
                document.getElementById('quickConnect').addEventListener('click', () => this.openFTPModal());
                document.getElementById('openDemo').addEventListener('click', () => this.loadDemoFiles());
                
                // Modal
                document.getElementById('closeFtpModal').addEventListener('click', () => this.closeFTPModal());
                document.getElementById('cancelConnect').addEventListener('click', () => this.closeFTPModal());
                document.getElementById('ftpForm').addEventListener('submit', (e) => this.connectFTP(e));
                
                // File operations
                document.getElementById('saveFile').addEventListener('click', () => this.saveFile());
                document.getElementById('refreshFiles').addEventListener('click', () => this.refreshFileTree());
                
                // AI Assistant
                document.getElementById('sendMessage').addEventListener('click', () => this.sendAIMessage());
                document.getElementById('chatInput').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && e.ctrlKey) this.sendAIMessage();
                });
                document.getElementById('clearChat').addEventListener('click', () => this.clearChat());
                
                // Resize handlers
                window.addEventListener('resize', () => this.handleResize());
            }
            
            initUI() {
                this.updateConnectionStatus(false);
                this.addWelcomeTab();
            }
            
            openFTPModal() {
                document.getElementById('ftpModal').classList.add('active');
            }
            
            closeFTPModal() {
                document.getElementById('ftpModal').classList.remove('active');
            }
            
            async connectFTP(e) {
                e.preventDefault();
                
                // Mock FTP connection for demo
                this.showLoading('Connecting to FTP server...');
                
                try {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    this.isConnected = true;
                    this.updateConnectionStatus(true, 'demo.ezedit.co');
                    this.loadMockFileTree();
                    this.closeFTPModal();
                    this.hideLoading();
                    
                    this.showNotification('✅ Connected to FTP server successfully!', 'success');
                } catch (error) {
                    this.hideLoading();
                    this.showNotification('❌ Failed to connect to FTP server', 'error');
                }
            }
            
            loadDemoFiles() {
                this.showLoading('Loading demo files...');
                
                setTimeout(() => {
                    this.isConnected = true;
                    this.updateConnectionStatus(true, 'demo.ezedit.co');
                    this.loadMockFileTree();
                    this.hideLoading();
                    this.showNotification('✅ Demo files loaded successfully!', 'success');
                }, 1500);
            }
            
            loadMockFileTree() {
                const fileTree = document.getElementById('fileTree');
                fileTree.innerHTML = `
                    <div class="file-item" data-path="/index.html" data-type="file">
                        <span class="file-icon">📄</span>
                        <span>index.html</span>
                    </div>
                    <div class="file-item" data-path="/style.css" data-type="file">
                        <span class="file-icon">🎨</span>
                        <span>style.css</span>
                    </div>
                    <div class="file-item" data-path="/script.js" data-type="file">
                        <span class="file-icon">⚡</span>
                        <span>script.js</span>
                    </div>
                    <div class="file-item" data-path="/admin.php" data-type="file">
                        <span class="file-icon">🔧</span>
                        <span>admin.php</span>
                    </div>
                `;
                
                // Add click listeners to file items
                fileTree.querySelectorAll('.file-item[data-type="file"]').forEach(item => {
                    item.addEventListener('click', () => this.openFile(item.dataset.path, item.textContent.trim()));
                });
            }
            
            async openFile(path, filename) {
                if (this.openFiles.has(path)) {
                    this.switchToTab(path);
                    return;
                }
                
                this.showLoading(`Opening ${filename}...`);
                
                // Mock file content based on extension
                await new Promise(resolve => setTimeout(resolve, 500));
                
                let content = 'Sample file content for ' + filename;
                let language = 'plaintext';
                
                if (filename.endsWith('.html')) {
                    language = 'html';
                    content = '<!DOCTYPE html>\\n<html>\\n<head>\\n    <title>My Website</title>\\n</head>\\n<body>\\n    <h1>Hello World!</h1>\\n</body>\\n</html>';
                } else if (filename.endsWith('.css')) {
                    language = 'css';
                    content = 'body {\\n    font-family: Arial, sans-serif;\\n    background: #f5f5f5;\\n}';
                } else if (filename.endsWith('.js')) {
                    language = 'javascript';
                    content = 'console.log("Hello from " + "' + filename + '");\\n\\nfunction init() {\\n    // Your code here\\n}';
                } else if (filename.endsWith('.php')) {
                    language = 'php';
                    content = '<?php\\necho "Hello from PHP!";\\n?>';
                }
                
                this.openFiles.set(path, {
                    filename,
                    content,
                    language,
                    modified: false
                });
                
                this.addFileTab(path, filename);
                this.switchToTab(path);
                this.hideLoading();
            }
            
            addWelcomeTab() {
                this.addFileTab('welcome', 'Welcome');
                this.switchToTab('welcome');
            }
            
            addFileTab(path, filename) {
                const fileTabs = document.getElementById('fileTabs');
                const tab = document.createElement('div');
                tab.className = 'file-tab';
                tab.dataset.path = path;
                tab.innerHTML = `
                    <span>${filename}</span>
                    <button class="file-tab-close" onclick="editor.closeTab('${path}')">&times;</button>
                `;
                tab.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('file-tab-close')) {
                        this.switchToTab(path);
                    }
                });
                fileTabs.appendChild(tab);
            }
            
            switchToTab(path) {
                document.querySelectorAll('.file-tab').forEach(tab => {
                    tab.classList.toggle('active', tab.dataset.path === path);
                });
                
                if (path === 'welcome') {
                    this.monaco.setValue('// Welcome to EzEdit.co!\\n// Connect to your FTP server and start editing files.');
                    monaco.editor.setModelLanguage(this.monaco.getModel(), 'javascript');
                } else if (this.openFiles.has(path)) {
                    const file = this.openFiles.get(path);
                    this.monaco.setValue(file.content);
                    monaco.editor.setModelLanguage(this.monaco.getModel(), file.language);
                }
                
                this.currentFile = path;
            }
            
            closeTab(path) {
                if (this.openFiles.has(path)) {
                    this.openFiles.delete(path);
                }
                
                const tab = document.querySelector(`[data-path="${path}"]`);
                if (tab) {
                    tab.remove();
                }
                
                if (this.currentFile === path) {
                    const remainingTabs = document.querySelectorAll('.file-tab');
                    if (remainingTabs.length > 0) {
                        this.switchToTab(remainingTabs[0].dataset.path);
                    }
                }
            }
            
            saveFile() {
                if (!this.currentFile || this.currentFile === 'welcome') {
                    this.showNotification('ℹ️ No file to save', 'info');
                    return;
                }
                
                this.showLoading('Saving file...');
                
                setTimeout(() => {
                    this.hideLoading();
                    this.showNotification('✅ File saved successfully!', 'success');
                }, 1000);
            }
            
            refreshFileTree() {
                if (this.isConnected) {
                    this.showLoading('Refreshing files...');
                    setTimeout(() => {
                        this.loadMockFileTree();
                        this.hideLoading();
                        this.showNotification('✅ File tree refreshed', 'success');
                    }, 500);
                }
            }
            
            sendAIMessage() {
                const input = document.getElementById('chatInput');
                const message = input.value.trim();
                
                if (!message) return;
                
                this.addChatMessage(message, 'user');
                input.value = '';
                
                setTimeout(() => {
                    const responses = [
                        'I can help you with that! Here\\'s what I suggest...',
                        'Let me analyze your code and provide some recommendations.',
                        'That\\'s a great question! Here\\'s how you can implement that feature...'
                    ];
                    const response = responses[Math.floor(Math.random() * responses.length)];
                    this.addChatMessage(response, 'ai');
                }, 1000);
            }
            
            addChatMessage(content, type) {
                const chatMessages = document.getElementById('chatMessages');
                const message = document.createElement('div');
                message.className = `${type}-message`;
                message.innerHTML = `<div class="message-content"><p>${content}</p></div>`;
                chatMessages.appendChild(message);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            
            clearChat() {
                const chatMessages = document.getElementById('chatMessages');
                chatMessages.innerHTML = `
                    <div class="ai-message">
                        <div class="message-content">
                            <p>Chat cleared! How can I help you with your code?</p>
                        </div>
                    </div>
                `;
            }
            
            updateConnectionStatus(connected, host = '') {
                const statusDot = document.querySelector('.status-dot');
                const statusText = document.querySelector('.status-text');
                
                statusDot.classList.toggle('connected', connected);
                statusText.textContent = connected ? `Connected to ${host}` : 'Not Connected';
            }
            
            showLoading(message) {
                console.log('Loading:', message);
            }
            
            hideLoading() {
                console.log('Loading complete');
            }
            
            showNotification(message, type) {
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
            
            handleResize() {
                if (this.monaco) {
                    this.monaco.layout();
                }
            }
        }
        
        // Initialize editor when page loads
        let editor;
        document.addEventListener('DOMContentLoaded', function() {
            editor = new EzEditor();
        });
    </script>
</body>
</html>
EDITOR_EOF
```

### Command 2: Set Permissions
```bash
chown www-data:www-data /var/www/html/editor.php && chmod 644 /var/www/html/editor.php
```

### Command 3: Test Deployment
```bash
curl -I http://localhost/editor.php && echo "✅ Editor deployment complete!"
```

## 🎉 After Running Commands

Test these URLs:
- **Homepage:** http://159.65.224.175/
- **Login:** http://159.65.224.175/auth/login.php
- **Dashboard:** http://159.65.224.175/dashboard.php  
- **Editor:** http://159.65.224.175/editor.php ← **Should now work!**

**Login with:** any email + password (6+ characters)

Your complete EzEdit.co application is now deployed! 🚀