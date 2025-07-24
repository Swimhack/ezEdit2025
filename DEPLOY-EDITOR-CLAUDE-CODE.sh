#!/bin/bash
# Deploy the complete Claude Code Editor to DigitalOcean

echo "🚀 Deploying Claude Code Editor..."

cat > /var/www/html/editor.php << 'EDITOR_EOF'
<?php
session_start();
$authenticated = isset($_SESSION['user_logged_in']) && $_SESSION['user_logged_in'];
$user_name = $_SESSION['user_name'] ?? 'User';
$user_email = $_SESSION['user_email'] ?? '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Code Editor - EzEdit.co</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #1e1e1e; color: #cccccc; overflow: hidden; }
        .editor-layout { display: flex; flex-direction: column; height: 100vh; }
        
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
        
        .editor-main { display: flex; flex: 1; overflow: hidden; }
        
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
        .empty-state { text-align: center; padding: 40px 20px; color: #999; }
        .empty-state p { margin-bottom: 16px; font-size: 0.9rem; }
        .file-item { 
            padding: 6px 8px; cursor: pointer; border-radius: 4px; font-size: 0.85rem;
            display: flex; align-items: center; gap: 8px;
        }
        .file-item:hover { background: #2a2d2e; }
        .file-item.selected { background: #094771; }
        .file-icon { width: 16px; height: 16px; }
        
        .editor-container { flex: 1; display: flex; flex-direction: column; position: relative; }
        .editor-wrapper { flex: 1; position: relative; }
        .monaco-editor-container { width: 100%; height: 100%; position: absolute; top: 0; left: 0; }
        .editor-placeholder { 
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            display: flex; align-items: center; justify-content: center; background: #1e1e1e;
        }
        .placeholder-content { text-align: center; max-width: 400px; }
        .placeholder-content h2 { margin-bottom: 12px; color: #ffffff; font-size: 1.5rem; }
        .placeholder-content p { margin-bottom: 24px; color: #999; }
        .quick-actions { display: flex; gap: 12px; justify-content: center; }
        
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
        .message-content h2, .message-content h3, .message-content h4 { margin: 12px 0 8px 0; color: #ffffff; }
        .message-content p { margin: 8px 0; }
        .message-content strong { color: #ffffff; font-weight: 600; }
        .code-block { 
            background: #1e1e1e; border: 1px solid #404040; border-radius: 4px; 
            padding: 12px; margin: 8px 0; overflow-x: auto; position: relative;
        }
        .code-block code { font-family: 'Courier New', monospace; font-size: 0.8rem; color: #d4d4d4; }
        .inline-code { 
            background: #3c3c3c; color: #e6db74; padding: 2px 4px; border-radius: 3px; 
            font-family: 'Courier New', monospace; font-size: 0.8rem;
        }
        .copy-code-btn { 
            position: absolute; top: 8px; right: 8px; background: #404040; border: none; 
            color: #cccccc; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 0.7rem;
        }
        .copy-code-btn:hover { background: #505050; }
        .typing-indicator { opacity: 0.8; }
        .typing-dots { display: inline-flex; gap: 4px; margin-right: 8px; }
        .typing-dots span { 
            width: 6px; height: 6px; background: #0078d4; border-radius: 50%; 
            animation: typingPulse 1.4s infinite ease-in-out both;
        }
        .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typingPulse { 0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
        .chat-input { 
            padding: 12px; border-top: 1px solid #3e3e42; display: flex; gap: 8px; align-items: flex-end;
        }
        #chatInput { 
            flex: 1; background: #3c3c3c; border: 1px solid #555; color: #cccccc; 
            padding: 8px 12px; border-radius: 4px; resize: none; min-height: 36px; max-height: 100px;
        }
        #chatInput:focus { outline: none; border-color: #0078d4; }
        #chatInput:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        
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
        
        @media (max-width: 768px) {
            .file-explorer, .ai-assistant { width: 250px; }
            .header-center { display: none; }
        }
        
        .loading { opacity: 0.6; pointer-events: none; }
        .spinner { 
            border: 2px solid #3e3e42; border-top: 2px solid #0078d4; border-radius: 50%; 
            width: 16px; height: 16px; animation: spin 1s linear infinite; display: inline-block;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
    
    <script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js"></script>
</head>
<body class="editor-layout">
    <header class="editor-header">
        <div class="header-left">
            <a href="index.php" class="logo">EzEdit.co</a>
            <div class="connection-status" id="connectionStatus">
                <span class="status-dot"></span>
                <span class="status-text">Not Connected</span>
            </div>
        </div>
        <div class="header-center">
            <div class="file-tabs" id="fileTabs"></div>
        </div>
        <div class="header-right">
            <button class="btn-icon" id="saveFile" title="Save (Ctrl+S)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17,21 17,13 7,13 7,21"></polyline>
                    <polyline points="7,3 7,8 15,8"></polyline>
                </svg>
            </button>
            <?php if ($authenticated): ?>
                <button class="btn-secondary" id="userMenu"><?php echo htmlspecialchars($user_name); ?></button>
                <a href="dashboard.php" class="btn-icon" title="Dashboard">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                </a>
            <?php else: ?>
                <a href="auth/login.php" class="btn-secondary">Login</a>
            <?php endif; ?>
        </div>
    </header>

    <main class="editor-main">
        <aside class="file-explorer" id="fileExplorer">
            <div class="explorer-header">
                <h3>Explorer</h3>
                <div class="explorer-actions">
                    <button class="btn-icon" id="connectFTP" title="Connect to FTP">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                            <polyline points="16,6 12,2 8,6"></polyline>
                            <line x1="12" y1="2" x2="12" y2="15"></line>
                        </svg>
                    </button>
                    <button class="btn-icon" id="refreshFiles" title="Refresh">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <polyline points="1 20 1 14 7 14"></polyline>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="file-tree" id="fileTree">
                <div class="empty-state">
                    <p>Connect to FTP server to browse files</p>
                    <button class="btn-primary" id="connectButton">Connect</button>
                </div>
            </div>
        </aside>

        <section class="editor-container">
            <div class="editor-wrapper">
                <div id="monacoEditor" class="monaco-editor-container"></div>
                <div class="editor-placeholder" id="editorPlaceholder">
                    <div class="placeholder-content">
                        <h2>Welcome to Claude Code Editor</h2>
                        <p>Connect to your FTP server and select a file to start editing with AI assistance</p>
                        <div class="quick-actions">
                            <button class="btn-primary" id="quickConnect">Connect to FTP</button>
                            <button class="btn-secondary" id="openDemo">Try Demo</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <aside class="ai-assistant" id="aiAssistant">
            <div class="assistant-header">
                <h3>Claude Code</h3>
                <div class="assistant-actions">
                    <button class="btn-icon" id="clearChat" title="Clear Chat">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                    <button class="btn-icon" id="toggleAssistant" title="Toggle Assistant">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9,18 15,12 9,6"></polyline>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="chat-container" id="chatContainer">
                <div class="chat-messages" id="chatMessages">
                    <div class="ai-message">
                        <div class="message-content">
                            <p>Hello! I'm <strong>Claude Code</strong>, your AI coding assistant. I can help you:</p>
                            <ul>
                                <li>🔍 Analyze and explain code</li>
                                <li>🐛 Find and fix bugs</li>
                                <li>⚡ Optimize performance</li>
                                <li>📝 Generate code snippets</li>
                                <li>🔒 Review security practices</li>
                                <li>📚 Add documentation</li>
                            </ul>
                            <p>Just select some code or ask me a question!</p>
                        </div>
                    </div>
                </div>
                <div class="chat-input">
                    <textarea id="chatInput" placeholder="Ask Claude Code about your code..."></textarea>
                    <button class="btn-primary" id="sendMessage">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                        </svg>
                    </button>
                </div>
            </div>
        </aside>
    </main>

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
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="ftpSecure"> Use FTPS (Secure)
                        </label>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" id="cancelConnect">Cancel</button>
                        <button type="submit" class="btn-primary">Connect</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script>
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
                console.log('✅ Claude Code Editor initialized successfully');
            }
            
            async initMonaco() {
                return new Promise((resolve) => {
                    require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
                    require(['vs/editor/editor.main'], () => {
                        this.monaco = monaco.editor.create(document.getElementById('monacoEditor'), {
                            value: '// Welcome to Claude Code Editor!\n// Connect to your FTP server and start editing files with AI assistance.\n\nfunction welcomeMessage() {\n    console.log("Hello from Claude Code!");\n    return "Ready to edit your legacy websites with AI!";\n}',
                            language: 'javascript',
                            theme: 'vs-dark',
                            fontSize: 14,
                            minimap: { enabled: true },
                            wordWrap: 'on',
                            automaticLayout: true,
                            scrollBeyondLastLine: false,
                            renderWhitespace: 'selection',
                            rulers: [80, 120],
                            bracketPairColorization: { enabled: true },
                            guides: { bracketPairs: true, indentation: true }
                        });
                        
                        this.monaco.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => this.saveFile());
                        this.monaco.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyO, () => this.openFTPModal());
                        
                        document.getElementById('editorPlaceholder').style.display = 'none';
                        resolve();
                    });
                });
            }
            
            initEventListeners() {
                document.getElementById('connectFTP').addEventListener('click', () => this.openFTPModal());
                document.getElementById('connectButton').addEventListener('click', () => this.openFTPModal());
                document.getElementById('quickConnect').addEventListener('click', () => this.openFTPModal());
                document.getElementById('openDemo').addEventListener('click', () => this.loadDemoFiles());
                
                document.getElementById('closeFtpModal').addEventListener('click', () => this.closeFTPModal());
                document.getElementById('cancelConnect').addEventListener('click', () => this.closeFTPModal());
                document.getElementById('ftpForm').addEventListener('submit', (e) => this.connectFTP(e));
                
                document.getElementById('saveFile').addEventListener('click', () => this.saveFile());
                document.getElementById('refreshFiles').addEventListener('click', () => this.refreshFileTree());
                
                document.getElementById('sendMessage').addEventListener('click', () => this.sendAIMessage());
                document.getElementById('chatInput').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && e.ctrlKey) this.sendAIMessage();
                });
                document.getElementById('clearChat').addEventListener('click', () => this.clearChat());
                document.getElementById('toggleAssistant').addEventListener('click', () => this.toggleAssistant());
                
                window.addEventListener('resize', () => this.handleResize());
            }
            
            initUI() {
                this.updateConnectionStatus(false);
                this.addWelcomeTab();
            }
            
            openFTPModal() { document.getElementById('ftpModal').classList.add('active'); }
            closeFTPModal() { document.getElementById('ftpModal').classList.remove('active'); }
            
            async connectFTP(e) {
                e.preventDefault();
                const form = e.target;
                const formData = new FormData(form);
                const connection = {
                    host: formData.get('ftpHost'),
                    port: formData.get('ftpPort'),
                    username: formData.get('ftpUsername'),
                    password: formData.get('ftpPassword'),
                    secure: formData.get('ftpSecure') === 'on'
                };
                
                this.showLoading('Connecting to FTP server...');
                
                try {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    this.ftpConnection = connection;
                    this.isConnected = true;
                    this.updateConnectionStatus(true, connection.host);
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
                    <div class="file-item" data-path="/" data-type="folder">
                        <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span>public_html</span>
                    </div>
                    <div class="file-item" data-path="/index.html" data-type="file" style="margin-left: 20px;">
                        <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                        </svg>
                        <span>index.html</span>
                    </div>
                    <div class="file-item" data-path="/style.css" data-type="file" style="margin-left: 20px;">
                        <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                        </svg>
                        <span>style.css</span>
                    </div>
                    <div class="file-item" data-path="/script.js" data-type="file" style="margin-left: 20px;">
                        <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                        </svg>
                        <span>script.js</span>
                    </div>
                `;
                
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
                await new Promise(resolve => setTimeout(resolve, 500));
                
                let content = '', language = 'plaintext';
                
                if (filename.endsWith('.html')) {
                    language = 'html';
                    content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>Welcome to My Website</h1>
        <nav>
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
        </nav>
    </header>
    <main>
        <section id="home">
            <h2>Home Page</h2>
            <p>This is a sample HTML file. Ask Claude Code to help optimize it!</p>
        </section>
    </main>
    <script src="script.js"></script>
</body>
</html>`;
                } else if (filename.endsWith('.css')) {
                    language = 'css';
                    content = `/* Website Styles - Ask Claude Code for improvements! */
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    color: #333;
}

header {
    background: #2c3e50;
    color: white;
    padding: 2rem 0;
    text-align: center;
}

nav a {
    color: white;
    text-decoration: none;
    margin: 0 1rem;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: background 0.3s;
}

nav a:hover { background: rgba(255,255,255,0.2); }`;
                } else if (filename.endsWith('.js')) {
                    language = 'javascript';
                    content = `// Website JavaScript - Let Claude Code help optimize this!
document.addEventListener('DOMContentLoaded', function() {
    console.log('Website loaded successfully!');
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Example function - ask Claude Code to improve this!
    function updateContent(newContent) {
        const mainSection = document.querySelector('main section');
        if (mainSection) {
            mainSection.innerHTML = newContent;
        }
    }
});`;
                }
                
                this.openFiles.set(path, { filename, content, language, modified: false });
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
                tab.innerHTML = `<span>${filename}</span><button class="file-tab-close" onclick="editor.closeTab('${path}')">&times;</button>`;
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
                    this.monaco.setValue('// Welcome to Claude Code Editor!\n// Connect to your FTP server and start editing files with AI assistance.\n\nfunction welcomeMessage() {\n    console.log("Hello from Claude Code!");\n    return "Ready to edit your legacy websites with AI!";\n}');
                    this.monaco.getModel().updateOptions({ language: 'javascript' });
                } else if (this.openFiles.has(path)) {
                    const file = this.openFiles.get(path);
                    this.monaco.setValue(file.content);
                    this.monaco.getModel().updateOptions({ language: file.language });
                }
                this.currentFile = path;
            }
            
            closeTab(path) {
                if (this.openFiles.has(path)) this.openFiles.delete(path);
                const tab = document.querySelector(`[data-path="${path}"]`);
                if (tab) tab.remove();
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
            
            async sendAIMessage() {
                const input = document.getElementById('chatInput');
                const sendButton = document.getElementById('sendMessage');
                const message = input.value.trim();
                
                if (!message) return;
                
                input.disabled = true;
                sendButton.disabled = true;
                
                this.addChatMessage(message, 'user');
                input.value = '';
                this.addTypingIndicator();
                
                try {
                    const currentCode = this.monaco ? this.monaco.getValue() : '';
                    const currentLanguage = this.currentFile && this.openFiles.has(this.currentFile) 
                        ? this.openFiles.get(this.currentFile).language : 'plaintext';
                    const currentFilename = this.currentFile && this.openFiles.has(this.currentFile)
                        ? this.openFiles.get(this.currentFile).filename : '';
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 30000);
                    
                    const response = await fetch('api/ai-assistant.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: message,
                            code: currentCode,
                            language: currentLanguage,
                            filename: currentFilename
                        }),
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        if (response.status === 429) {
                            throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
                        } else if (response.status === 500) {
                            throw new Error('Server error. Please try again later.');
                        } else {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                    }
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        this.removeTypingIndicator();
                        this.addChatMessage(data.response, 'ai');
                    } else {
                        throw new Error(data.error || 'Unknown error occurred');
                    }
                    
                } catch (error) {
                    console.error('Claude Code Error:', error);
                    this.removeTypingIndicator();
                    
                    let errorMessage = '❌ Sorry, I encountered an error while processing your request.';
                    
                    if (error.name === 'AbortError') {
                        errorMessage = '⏱️ Request timed out. Please try again with a shorter message.';
                    } else if (error.message.includes('Rate limit')) {
                        errorMessage = '⏳ Rate limit exceeded. Please wait a moment before trying again.';
                    } else if (error.message.includes('Server error')) {
                        errorMessage = '🔧 Server is temporarily unavailable. Please try again in a few minutes.';
                    } else if (!navigator.onLine) {
                        errorMessage = '🌐 No internet connection. Please check your connection and try again.';
                    }
                    
                    this.addChatMessage(errorMessage, 'ai');
                } finally {
                    input.disabled = false;
                    sendButton.disabled = false;
                    input.focus();
                }
            }
            
            addChatMessage(content, type) {
                const chatMessages = document.getElementById('chatMessages');
                const message = document.createElement('div');
                message.className = `${type}-message`;
                
                const formattedContent = this.formatMessageContent(content);
                message.innerHTML = `<div class="message-content">${formattedContent}</div>`;
                
                chatMessages.appendChild(message);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                this.highlightCodeBlocks(message);
            }
            
            formatMessageContent(content) {
                let formatted = content
                    .replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
                        const language = lang || 'text';
                        return `<pre class="code-block" data-language="${language}"><code>${this.escapeHtml(code.trim())}</code></pre>`;
                    })
                    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
                    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                    .replace(/^• (.+)$/gm, '<li>$1</li>')
                    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
                    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
                    .replace(/^# (.+)$/gm, '<h2>$1</h2>');
                
                formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
                
                const paragraphs = formatted.split('\n\n').filter(p => p.trim());
                if (paragraphs.length > 1) {
                    formatted = paragraphs.map(p => {
                        if (p.includes('<pre>') || p.includes('<h2>') || p.includes('<h3>') || p.includes('<h4>') || p.includes('<ul>')) {
                            return p;
                        }
                        return `<p>${p}</p>`;
                    }).join('');
                } else if (!formatted.includes('<pre>') && !formatted.includes('<ul>') && !formatted.includes('<h')) {
                    formatted = `<p>${formatted}</p>`;
                }
                
                return formatted;
            }
            
            escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }
            
            highlightCodeBlocks(messageElement) {
                const codeBlocks = messageElement.querySelectorAll('.code-block code');
                codeBlocks.forEach(block => {
                    const copyBtn = document.createElement('button');
                    copyBtn.className = 'copy-code-btn';
                    copyBtn.innerHTML = '📋';
                    copyBtn.title = 'Copy code';
                    copyBtn.onclick = () => this.copyToClipboard(block.textContent);
                    
                    const pre = block.parentElement;
                    pre.style.position = 'relative';
                    pre.appendChild(copyBtn);
                });
            }
            
            addTypingIndicator() {
                const chatMessages = document.getElementById('chatMessages');
                const indicator = document.createElement('div');
                indicator.className = 'ai-message typing-indicator';
                indicator.id = 'typingIndicator';
                indicator.innerHTML = `
                    <div class="message-content">
                        <div class="typing-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <span style="font-size: 0.8rem; color: #999;">Claude Code is thinking...</span>
                    </div>
                `;
                chatMessages.appendChild(indicator);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            
            removeTypingIndicator() {
                const indicator = document.getElementById('typingIndicator');
                if (indicator) indicator.remove();
            }
            
            copyToClipboard(text) {
                navigator.clipboard.writeText(text).then(() => {
                    this.showNotification('✅ Code copied to clipboard!', 'success');
                }).catch(() => {
                    this.showNotification('❌ Failed to copy code', 'error');
                });
            }
            
            clearChat() {
                const chatMessages = document.getElementById('chatMessages');
                chatMessages.innerHTML = `
                    <div class="ai-message">
                        <div class="message-content">
                            <p>Hello! I'm <strong>Claude Code</strong>, your AI coding assistant. I can help you:</p>
                            <ul>
                                <li>🔍 Analyze and explain code</li>
                                <li>🐛 Find and fix bugs</li>
                                <li>⚡ Optimize performance</li>
                                <li>📝 Generate code snippets</li>
                                <li>🔒 Review security practices</li>
                                <li>📚 Add documentation</li>
                            </ul>
                            <p>Just select some code or ask me a question!</p>
                        </div>
                    </div>
                `;
            }
            
            toggleAssistant() {
                const assistant = document.getElementById('aiAssistant');
                assistant.style.display = assistant.style.display === 'none' ? 'flex' : 'none';
            }
            
            updateConnectionStatus(connected, host = '') {
                const statusDot = document.querySelector('.status-dot');
                const statusText = document.querySelector('.status-text');
                statusDot.classList.toggle('connected', connected);
                statusText.textContent = connected ? `Connected to ${host}` : 'Not Connected';
            }
            
            showLoading(message) { console.log('Loading:', message); }
            hideLoading() { console.log('Loading complete'); }
            
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
                setTimeout(() => notification.remove(), 3000);
            }
            
            handleResize() {
                if (this.monaco) this.monaco.layout();
            }
        }
        
        let editor;
        document.addEventListener('DOMContentLoaded', function() {
            editor = new EzEditor();
        });
    </script>
</body>
</html>
EDITOR_EOF

echo "✅ Claude Code Editor deployed successfully!"
echo "📅 Deployed at: $(date)"
echo "🌐 Available at: http://159.65.224.175/editor.php"