<?php
session_start();

// Check authentication
if (!isset($_SESSION['user_logged_in']) || !$_SESSION['user_logged_in']) {
    header('Location: auth/login.php');
    exit();
}

$user_name = $_SESSION['user_name'] ?? 'User';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EzEdit.co - Professional Editor</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/editor/editor.main.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #1e1e1e; color: #cccccc; overflow: hidden; }
        
        .editor-layout { display: flex; height: 100vh; }
        .sidebar { width: 300px; background: #252526; border-right: 1px solid #3e3e42; display: flex; flex-direction: column; }
        .sidebar-header { padding: 1rem; border-bottom: 1px solid #3e3e42; display: flex; justify-content: space-between; align-items: center; }
        .sidebar-title { font-weight: 600; color: #ffffff; }
        .btn-icon { background: none; border: none; color: #cccccc; cursor: pointer; padding: 0.25rem; border-radius: 4px; }
        .btn-icon:hover { background: #3e3e42; }
        
        .site-manager { flex: 1; overflow-y: auto; }
        .site-list { padding: 1rem; }
        .site-item { padding: 0.75rem; margin-bottom: 0.5rem; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
        .site-item:hover { background: #2d2d30; }
        .site-item.active { background: #094771; border-left: 3px solid #007acc; }
        .site-name { display: block; font-weight: 500; color: #ffffff; }
        .site-url { display: block; font-size: 0.875rem; color: #999999; margin-top: 0.25rem; }
        .add-site-btn { width: 100%; padding: 0.75rem; background: #0e639c; color: white; border: none; border-radius: 6px; cursor: pointer; margin-bottom: 1rem; }
        .add-site-btn:hover { background: #1177bb; }
        
        .file-explorer { border-top: 1px solid #3e3e42; }
        .explorer-header { padding: 0.75rem 1rem; background: #2d2d30; font-weight: 500; display: flex; justify-content: space-between; align-items: center; }
        .file-tree { padding: 0.5rem; max-height: 400px; overflow-y: auto; }
        .file-item { padding: 0.5rem; cursor: pointer; border-radius: 4px; display: flex; align-items: center; gap: 0.5rem; }
        .file-item:hover { background: #2d2d30; }
        .file-item.selected { background: #094771; }
        .file-icon { font-size: 1rem; }
        .file-name { font-size: 0.875rem; }
        
        .editor-main { flex: 1; display: flex; flex-direction: column; }
        .editor-header { height: 60px; background: #2d2d30; border-bottom: 1px solid #3e3e42; display: flex; justify-content: space-between; align-items: center; padding: 0 1rem; }
        .editor-nav { display: flex; align-items: center; gap: 1rem; }
        .breadcrumb { color: #999999; font-size: 0.875rem; }
        .editor-actions { display: flex; gap: 0.5rem; }
        .btn { padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; text-decoration: none; display: inline-block; }
        .btn-primary { background: #0e639c; color: white; }
        .btn-primary:hover { background: #1177bb; }
        .btn-secondary { background: #3e3e42; color: #cccccc; }
        .btn-secondary:hover { background: #4e4e52; }
        
        .editor-tabs { height: 40px; background: #252526; border-bottom: 1px solid #3e3e42; display: flex; overflow-x: auto; }
        .tab { height: 100%; padding: 0.5rem 1rem; background: #2d2d30; border-right: 1px solid #3e3e42; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; white-space: nowrap; }
        .tab.active { background: #1e1e1e; }
        .tab-close { background: none; border: none; color: #999999; cursor: pointer; }
        .tab-close:hover { color: #ffffff; }
        
        .view-controls { display: flex; background: #2d2d30; border-bottom: 1px solid #3e3e42; }
        .view-btn { padding: 0.5rem 1rem; background: none; border: none; color: #cccccc; cursor: pointer; border-right: 1px solid #3e3e42; }
        .view-btn.active { background: #1e1e1e; color: #ffffff; }
        .view-btn:hover { background: #3e3e42; }
        
        .editor-content { flex: 1; display: flex; position: relative; }
        .editor-pane { flex: 1; position: relative; }
        .editor-split { display: flex; }
        .editor-split .editor-pane { flex: 1; border-right: 1px solid #3e3e42; }
        .editor-split .editor-pane:last-child { border-right: none; }
        
        #monacoEditor { height: 100%; }
        
        .ai-drawer { position: fixed; right: -400px; top: 0; width: 400px; height: 100vh; background: #252526; border-left: 1px solid #3e3e42; transition: right 0.3s ease; z-index: 1000; display: flex; flex-direction: column; }
        .ai-drawer.open { right: 0; }
        .ai-header { padding: 1rem; border-bottom: 1px solid #3e3e42; display: flex; justify-content: space-between; align-items: center; }
        .ai-header h3 { color: #ffffff; }
        .ai-content { flex: 1; display: flex; flex-direction: column; }
        .ai-messages { flex: 1; padding: 1rem; overflow-y: auto; }
        .ai-message { margin-bottom: 1rem; }
        .ai-message.user { text-align: right; }
        .ai-message.assistant { text-align: left; }
        .message-bubble { display: inline-block; padding: 0.75rem; border-radius: 12px; max-width: 80%; }
        .user .message-bubble { background: #0e639c; color: white; }
        .assistant .message-bubble { background: #3e3e42; color: #cccccc; }
        .ai-input-area { padding: 1rem; border-top: 1px solid #3e3e42; }
        .ai-input { width: 100%; padding: 0.75rem; background: #3e3e42; border: 1px solid #555555; border-radius: 6px; color: #cccccc; resize: vertical; min-height: 80px; }
        .ai-send-btn { width: 100%; margin-top: 0.5rem; padding: 0.75rem; background: #0e639c; color: white; border: none; border-radius: 6px; cursor: pointer; }
        .ai-send-btn:hover { background: #1177bb; }
        
        .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: none; align-items: center; justify-content: center; z-index: 2000; }
        .modal.show { display: flex; }
        .modal-content { background: #2d2d30; padding: 2rem; border-radius: 8px; width: 500px; max-width: 90vw; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .modal-title { color: #ffffff; font-size: 1.25rem; font-weight: 600; }
        .modal-close { background: none; border: none; color: #999999; font-size: 1.5rem; cursor: pointer; }
        .form-group { margin-bottom: 1rem; }
        .form-label { display: block; margin-bottom: 0.5rem; color: #cccccc; font-weight: 500; }
        .form-input { width: 100%; padding: 0.75rem; background: #3e3e42; border: 1px solid #555555; border-radius: 4px; color: #cccccc; }
        .form-input:focus { outline: none; border-color: #007acc; }
        
        .loading { display: flex; align-items: center; justify-content: center; padding: 2rem; }
        .spinner { width: 32px; height: 32px; border: 3px solid #3e3e42; border-top: 3px solid #007acc; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        .success-message { background: #28a745; color: white; padding: 0.75rem 1rem; border-radius: 4px; margin: 1rem; }
        .error-message { background: #dc3545; color: white; padding: 0.75rem 1rem; border-radius: 4px; margin: 1rem; }
        
        @media (max-width: 768px) {
            .sidebar { width: 100%; position: absolute; left: -100%; z-index: 500; transition: left 0.3s ease; }
            .sidebar.open { left: 0; }
            .ai-drawer { width: 100%; right: -100%; }
        }
    </style>
</head>
<body>
    <div class="editor-layout">
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-title">My Sites</div>
                <div class="sidebar-actions">
                    <button class="btn-icon" onclick="showAddSiteModal()" title="Add New Site">+</button>
                    <button class="btn-icon" onclick="refreshSites()" title="Refresh">🔄</button>
                </div>
            </div>
            
            <div class="site-manager">
                <div class="site-list" id="siteList">
                    <button class="add-site-btn" onclick="showAddSiteModal()">+ Add New Site</button>
                </div>
            </div>
            
            <div class="file-explorer">
                <div class="explorer-header">
                    <span>Files</span>
                    <button class="btn-icon" onclick="refreshFiles()" title="Refresh Files">🔄</button>
                </div>
                <div class="file-tree" id="fileTree">
                    <div class="loading" id="fileLoading" style="display: none;">
                        <div class="spinner"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="editor-main">
            <div class="editor-header">
                <div class="editor-nav">
                    <button class="btn-icon" onclick="toggleSidebar()" title="Toggle Sidebar">☰</button>
                    <div class="breadcrumb" id="breadcrumb">Select a file to edit</div>
                </div>
                <div class="editor-actions">
                    <button class="btn btn-secondary" onclick="saveFile()" id="saveBtn" disabled>💾 Save</button>
                    <button class="btn btn-secondary" onclick="toggleAI()">🤖 AI Assistant</button>
                    <a href="dashboard.php" class="btn btn-secondary">← Dashboard</a>
                </div>
            </div>
            
            <div class="editor-tabs" id="editorTabs" style="display: none;"></div>
            
            <div class="view-controls" id="viewControls" style="display: none;">
                <button class="view-btn active" data-view="code" onclick="switchView('code')">Code</button>
                <button class="view-btn" data-view="split" onclick="switchView('split')">Split</button>
            </div>
            
            <div class="editor-content" id="editorContent">
                <div class="editor-pane" id="codePane">
                    <div id="monacoEditor"></div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="ai-drawer" id="aiDrawer">
        <div class="ai-header">
            <h3>🤖 AI Assistant</h3>
            <button class="btn-icon" onclick="toggleAI()">×</button>
        </div>
        <div class="ai-content">
            <div class="ai-messages" id="aiMessages">
                <div class="ai-message assistant">
                    <div class="message-bubble">
                        Hi! I'm your AI coding assistant. I can help you:
                        <br>• Edit and improve your code
                        <br>• Fix bugs and errors
                        <br>• Add new features
                        <br>• Explain code functionality
                        <br><br>Just describe what you'd like to do!
                    </div>
                </div>
            </div>
            <div class="ai-input-area">
                <textarea id="aiInput" class="ai-input" placeholder="Describe what you'd like to do with your code..."></textarea>
                <button class="ai-send-btn" onclick="sendAIMessage()">Send Message</button>
            </div>
        </div>
    </div>
    
    <div class="modal" id="addSiteModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Add New Site</h3>
                <button class="modal-close" onclick="closeAddSiteModal()">×</button>
            </div>
            <form id="addSiteForm">
                <div class="form-group">
                    <label class="form-label">Site Name</label>
                    <input type="text" class="form-input" id="siteName" placeholder="My Website" required>
                </div>
                <div class="form-group">
                    <label class="form-label">FTP Host</label>
                    <input type="text" class="form-input" id="ftpHost" placeholder="ftp.example.com" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Port</label>
                    <input type="number" class="form-input" id="ftpPort" value="21" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Username</label>
                    <input type="text" class="form-input" id="ftpUsername" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-input" id="ftpPassword" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Remote Path (optional)</label>
                    <input type="text" class="form-input" id="ftpPath" placeholder="/public_html">
                </div>
                <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                    <button type="button" class="btn btn-secondary" onclick="closeAddSiteModal()" style="flex: 1;">Cancel</button>
                    <button type="submit" class="btn btn-primary" style="flex: 1;">Connect & Save</button>
                </div>
            </form>
        </div>
    </div>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js"></script>
    <script>
        let monacoEditor = null;
        let currentSite = null;
        let currentFile = null;
        let openTabs = [];
        let activeTab = null;
        let currentView = 'code';
        let sites = JSON.parse(localStorage.getItem('ezEdit_sites') || '[]');
        
        document.addEventListener('DOMContentLoaded', function() {
            initializeMonaco();
            loadSites();
            
            document.getElementById('addSiteForm').addEventListener('submit', handleAddSite);
            document.getElementById('aiInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && e.ctrlKey) {
                    sendAIMessage();
                }
            });
        });
        
        function initializeMonaco() {
            require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});
            require(['vs/editor/editor.main'], function () {
                monacoEditor = monaco.editor.create(document.getElementById('monacoEditor'), {
                    value: '// Welcome to EzEdit.co Professional Editor\\n// 1. Click "Add New Site" to connect to your FTP server\\n// 2. Browse and select files to edit\\n// 3. Use the AI Assistant for help with your code\\n\\n// Features:\\n// - Full Monaco Editor with syntax highlighting\\n// - FTP/SFTP integration\\n// - AI-powered code assistance\\n// - Multi-tab editing\\n// - Real-time file synchronization',
                    language: 'javascript',
                    theme: 'vs-dark',
                    automaticLayout: true,
                    fontSize: 14,
                    lineNumbers: 'on',
                    minimap: { enabled: true },
                    wordWrap: 'on'
                });
                
                monacoEditor.onDidChangeModelContent(function() {
                    if (currentFile) {
                        document.getElementById('saveBtn').disabled = false;
                        updateTabTitle(currentFile.path, true);
                    }
                });
            });
        }
        
        function loadSites() {
            const siteList = document.getElementById('siteList');
            const addBtn = siteList.querySelector('.add-site-btn');
            
            siteList.innerHTML = '';
            siteList.appendChild(addBtn);
            
            sites.forEach(site => {
                const siteElement = createSiteElement(site);
                siteList.appendChild(siteElement);
            });
        }
        
        function createSiteElement(site) {
            const div = document.createElement('div');
            div.className = 'site-item';
            div.innerHTML = '<span class="site-name">' + site.name + '</span><span class="site-url">' + site.host + ':' + site.port + '</span>';
            div.onclick = () => selectSite(site);
            return div;
        }
        
        function selectSite(site) {
            document.querySelectorAll('.site-item').forEach(item => item.classList.remove('active'));
            event.currentTarget.classList.add('active');
            
            currentSite = site;
            document.getElementById('breadcrumb').textContent = site.name + ' - Loading files...';
            
            loadSiteFiles(site);
        }
        
        async function loadSiteFiles(site) {
            const fileTree = document.getElementById('fileTree');
            const loading = document.getElementById('fileLoading');
            
            fileTree.innerHTML = '';
            loading.style.display = 'block';
            
            try {
                const response = await fetch('/api/ftp/files.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(site)
                });
                
                const files = await response.json();
                loading.style.display = 'none';
                
                if (files.error) {
                    fileTree.innerHTML = '<div style="padding: 1rem; color: #ff6b6b;">' + files.error + '</div>';
                } else {
                    renderFileTree(files, fileTree);
                    document.getElementById('breadcrumb').textContent = site.name;
                }
            } catch (error) {
                loading.style.display = 'none';
                fileTree.innerHTML = '<div style="padding: 1rem; color: #ff6b6b;">Connection failed</div>';
                console.error('Error loading files:', error);
            }
        }
        
        function renderFileTree(files, container, depth = 0) {
            files.forEach(file => {
                const fileElement = document.createElement('div');
                fileElement.className = 'file-item';
                fileElement.style.paddingLeft = (depth * 20 + 8) + 'px';
                
                if (file.type === 'directory') {
                    fileElement.innerHTML = '<span class="file-icon">📁</span><span class="file-name">' + file.name + '</span>';
                } else {
                    fileElement.innerHTML = '<span class="file-icon">' + getFileIcon(file.name) + '</span><span class="file-name">' + file.name + '</span>';
                    fileElement.onclick = () => openFile(file);
                }
                
                container.appendChild(fileElement);
            });
        }
        
        function getFileIcon(filename) {
            const ext = filename.split('.').pop().toLowerCase();
            const icons = {
                'html': '🌐', 'css': '🎨', 'js': '⚡', 'php': '🐘',
                'jpg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'svg': '🖼️',
                'pdf': '📄', 'txt': '📝', 'md': '📖'
            };
            return icons[ext] || '📄';
        }
        
        async function openFile(file) {
            if (!currentSite) return;
            
            document.getElementById('breadcrumb').textContent = currentSite.name + ' > ' + file.path;
            
            try {
                const response = await fetch('/api/ftp/file-content.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...currentSite,
                        filePath: file.path
                    })
                });
                
                const content = await response.text();
                
                addTab(file);
                
                const language = getLanguageFromFilename(file.name);
                monacoEditor.setValue(content);
                monaco.editor.setModelLanguage(monacoEditor.getModel(), language);
                
                currentFile = file;
                document.getElementById('saveBtn').disabled = true;
                
                document.getElementById('editorTabs').style.display = 'flex';
                document.getElementById('viewControls').style.display = 'flex';
                
            } catch (error) {
                console.error('Error loading file:', error);
                showMessage('Failed to load file content', 'error');
            }
        }
        
        function getLanguageFromFilename(filename) {
            const ext = filename.split('.').pop().toLowerCase();
            const languages = {
                'html': 'html', 'css': 'css', 'js': 'javascript',
                'php': 'php', 'json': 'json', 'xml': 'xml',
                'md': 'markdown', 'txt': 'plaintext'
            };
            return languages[ext] || 'plaintext';
        }
        
        function addTab(file) {
            if (openTabs.find(tab => tab.path === file.path)) {
                switchToTab(file.path);
                return;
            }
            
            openTabs.push(file);
            activeTab = file.path;
            renderTabs();
        }
        
        function renderTabs() {
            const tabsContainer = document.getElementById('editorTabs');
            tabsContainer.innerHTML = '';
            
            openTabs.forEach(tab => {
                const tabElement = document.createElement('div');
                tabElement.className = 'tab' + (tab.path === activeTab ? ' active' : '');
                tabElement.innerHTML = '<span>' + tab.name + '</span><button class="tab-close" onclick="closeTab(\'' + tab.path + '\', event)">×</button>';
                tabElement.onclick = (e) => {
                    if (e.target.classList.contains('tab-close')) return;
                    switchToTab(tab.path);
                };
                tabsContainer.appendChild(tabElement);
            });
        }
        
        function switchToTab(path) {
            const tab = openTabs.find(t => t.path === path);
            if (!tab) return;
            
            activeTab = path;
            currentFile = tab;
            renderTabs();
            openFile(tab);
        }
        
        function closeTab(path, event) {
            event.stopPropagation();
            openTabs = openTabs.filter(tab => tab.path !== path);
            
            if (activeTab === path) {
                activeTab = openTabs.length > 0 ? openTabs[0].path : null;
                currentFile = openTabs.length > 0 ? openTabs[0] : null;
            }
            
            renderTabs();
            
            if (openTabs.length === 0) {
                document.getElementById('editorTabs').style.display = 'none';
                document.getElementById('viewControls').style.display = 'none';
                monacoEditor.setValue('// Select a file to start editing');
                document.getElementById('breadcrumb').textContent = 'Select a file to edit';
            }
        }
        
        function updateTabTitle(path, hasChanges) {
            const tabs = document.querySelectorAll('.tab');
            tabs.forEach(tab => {
                const span = tab.querySelector('span');
                if (span && tab.onclick.toString().includes(path)) {
                    const baseName = path.split('/').pop();
                    span.textContent = hasChanges ? baseName + ' •' : baseName;
                }
            });
        }
        
        function switchView(view) {
            currentView = view;
            
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === view);
            });
            
            if (monacoEditor) {
                setTimeout(() => monacoEditor.layout(), 100);
            }
        }
        
        async function saveFile() {
            if (!currentFile || !currentSite) return;
            
            const content = monacoEditor.getValue();
            
            try {
                const response = await fetch('/api/ftp/save-file.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...currentSite,
                        filePath: currentFile.path,
                        content: content
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    document.getElementById('saveBtn').disabled = true;
                    updateTabTitle(currentFile.path, false);
                    showMessage('File saved successfully!', 'success');
                } else {
                    throw new Error(result.error || 'Save failed');
                }
            } catch (error) {
                console.error('Error saving file:', error);
                showMessage('Failed to save file: ' + error.message, 'error');
            }
        }
        
        function showAddSiteModal() {
            document.getElementById('addSiteModal').classList.add('show');
        }
        
        function closeAddSiteModal() {
            document.getElementById('addSiteModal').classList.remove('show');
            document.getElementById('addSiteForm').reset();
        }
        
        async function handleAddSite(event) {
            event.preventDefault();
            
            const site = {
                id: Date.now(),
                name: document.getElementById('siteName').value,
                host: document.getElementById('ftpHost').value,
                port: parseInt(document.getElementById('ftpPort').value),
                username: document.getElementById('ftpUsername').value,
                password: document.getElementById('ftpPassword').value,
                path: document.getElementById('ftpPath').value || '/'
            };
            
            try {
                const response = await fetch('/api/ftp/test-connection.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(site)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    sites.push(site);
                    localStorage.setItem('ezEdit_sites', JSON.stringify(sites));
                    loadSites();
                    closeAddSiteModal();
                    showMessage('Site connected successfully!', 'success');
                    
                    // Auto-select the new site
                    setTimeout(() => selectSite(site), 500);
                } else {
                    throw new Error(result.error || 'Connection failed');
                }
            } catch (error) {
                showMessage('Failed to connect: ' + error.message, 'error');
            }
        }
        
        function toggleAI() {
            document.getElementById('aiDrawer').classList.toggle('open');
        }
        
        async function sendAIMessage() {
            const input = document.getElementById('aiInput');
            const message = input.value.trim();
            if (!message) return;
            
            addAIMessage(message, 'user');
            input.value = '';
            
            const currentCode = monacoEditor ? monacoEditor.getValue() : '';
            const fileName = currentFile ? currentFile.name : '';
            
            try {
                const response = await fetch('/api/ai/chat.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: message,
                        code: currentCode,
                        fileName: fileName,
                        language: currentFile ? getLanguageFromFilename(currentFile.name) : 'text'
                    })
                });
                
                const result = await response.json();
                addAIMessage(result.response, 'assistant');
                
                if (result.codeChanges) {
                    addAIMessage('<button onclick="applyAIChanges(\'' + btoa(result.codeChanges) + '\')" class="btn btn-primary" style="margin-top: 0.5rem;">Apply Changes</button>', 'assistant');
                }
                
            } catch (error) {
                addAIMessage('Sorry, I encountered an error. Please try again.', 'assistant');
            }
        }
        
        function addAIMessage(message, sender) {
            const messagesContainer = document.getElementById('aiMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'ai-message ' + sender;
            messageDiv.innerHTML = '<div class="message-bubble">' + message + '</div>';
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        function applyAIChanges(encodedCode) {
            const code = atob(encodedCode);
            if (monacoEditor) {
                monacoEditor.setValue(code);
                document.getElementById('saveBtn').disabled = false;
                showMessage('AI changes applied!', 'success');
            }
        }
        
        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('open');
        }
        
        function refreshSites() {
            loadSites();
        }
        
        function refreshFiles() {
            if (currentSite) {
                loadSiteFiles(currentSite);
            }
        }
        
        function showMessage(message, type) {
            const messageDiv = document.createElement('div');
            messageDiv.className = type + '-message';
            messageDiv.textContent = message;
            document.body.appendChild(messageDiv);
            
            setTimeout(() => {
                messageDiv.remove();
            }, 3000);
        }
        
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        saveFile();
                        break;
                    case 'o':
                        e.preventDefault();
                        showAddSiteModal();
                        break;
                }
            }
        });
    </script>
</body>
</html>
