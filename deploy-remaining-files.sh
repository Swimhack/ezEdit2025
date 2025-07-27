#!/bin/bash
# PART 2: Deploy remaining critical files
# Run this AFTER the first script completes

# Deploy login.php
cat > /var/www/html/auth/login.php << 'EOFLOGIN'
<?php
session_start();

// Redirect if already logged in
if (isset($_SESSION['user_id'])) {
    header('Location: ../dashboard.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $password = $_POST['password'] ?? '';
    
    // For demo purposes - in production, verify against database
    if ($email === 'demo@ezedit.co' && $password === 'demo123') {
        $_SESSION['user_id'] = 1;
        $_SESSION['email'] = $email;
        header('Location: ../dashboard.php');
        exit;
    } else {
        $error = 'Invalid email or password';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - EzEdit.co</title>
    <link rel="stylesheet" href="../css/main.css">
    <link rel="stylesheet" href="../css/auth.css">
</head>
<body>
    <div class="auth-container">
        <div class="auth-box">
            <h1>Welcome Back</h1>
            <p class="auth-subtitle">Login to access your FTP editor</p>
            
            <?php if ($error): ?>
                <div class="alert alert-error"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>
            
            <form method="POST" class="auth-form">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required autofocus>
                </div>
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required>
                </div>
                
                <div class="form-group">
                    <label class="checkbox">
                        <input type="checkbox" name="remember"> Remember me
                    </label>
                </div>
                
                <button type="submit" class="btn btn-primary btn-block">Login</button>
            </form>
            
            <div class="auth-links">
                <a href="reset-password.php">Forgot password?</a>
                <span>•</span>
                <a href="register.php">Create account</a>
            </div>
            
            <div class="demo-info">
                <p><strong>Demo Account:</strong></p>
                <p>Email: demo@ezedit.co<br>Password: demo123</p>
            </div>
        </div>
    </div>
</body>
</html>
EOFLOGIN

# Deploy dashboard.php
cat > /var/www/html/dashboard.php << 'EOFDASH'
<?php
session_start();

// Redirect if not logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: auth/login.php');
    exit;
}

// Sample FTP sites for demo
$sites = [
    [
        'id' => 1,
        'name' => 'Main Website',
        'host' => 'ftp.example.com',
        'username' => 'user123',
        'last_accessed' => '2024-01-15 10:30:00'
    ],
    [
        'id' => 2,
        'name' => 'Development Server',
        'host' => 'dev.example.com',
        'username' => 'devuser',
        'last_accessed' => '2024-01-14 15:45:00'
    ]
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - EzEdit.co</title>
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/dashboard.css">
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <a href="index.php" class="nav-brand">EzEdit.co</a>
            <button class="nav-toggle" id="navToggle">
                <span></span>
                <span></span>
                <span></span>
            </button>
            <div class="nav-menu" id="navMenu">
                <a href="dashboard.php" class="nav-link active">Dashboard</a>
                <a href="docs.php" class="nav-link">Documentation</a>
                <a href="settings.php" class="nav-link">Settings</a>
                <a href="auth/logout.php" class="nav-link btn btn-secondary">Logout</a>
            </div>
        </div>
    </nav>

    <div class="dashboard-container">
        <div class="dashboard-header">
            <h1>My FTP Sites</h1>
            <button class="btn btn-primary" onclick="showAddSiteModal()">
                <span class="btn-icon">+</span> Add New Site
            </button>
        </div>

        <div class="sites-grid">
            <?php foreach ($sites as $site): ?>
            <div class="site-card">
                <div class="site-header">
                    <h3><?php echo htmlspecialchars($site['name']); ?></h3>
                    <div class="site-actions">
                        <button class="btn-icon" onclick="editSite(<?php echo $site['id']; ?>)">✏️</button>
                        <button class="btn-icon" onclick="deleteSite(<?php echo $site['id']; ?>)">🗑️</button>
                    </div>
                </div>
                <div class="site-info">
                    <p><strong>Host:</strong> <?php echo htmlspecialchars($site['host']); ?></p>
                    <p><strong>Username:</strong> <?php echo htmlspecialchars($site['username']); ?></p>
                    <p><strong>Last accessed:</strong> <?php echo date('M j, Y', strtotime($site['last_accessed'])); ?></p>
                </div>
                <div class="site-footer">
                    <a href="editor.php?site=<?php echo $site['id']; ?>" class="btn btn-primary btn-block">
                        Open Editor
                    </a>
                </div>
            </div>
            <?php endforeach; ?>
            
            <!-- Empty state for new users -->
            <?php if (empty($sites)): ?>
            <div class="empty-state">
                <div class="empty-icon">📁</div>
                <h3>No FTP sites yet</h3>
                <p>Add your first FTP site to start editing</p>
                <button class="btn btn-primary" onclick="showAddSiteModal()">Add FTP Site</button>
            </div>
            <?php endif; ?>
        </div>
    </div>

    <!-- Add Site Modal -->
    <div id="addSiteModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add FTP Site</h2>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <form id="addSiteForm" class="modal-form">
                <div class="form-group">
                    <label for="siteName">Site Name</label>
                    <input type="text" id="siteName" name="name" required>
                </div>
                <div class="form-group">
                    <label for="siteHost">FTP Host</label>
                    <input type="text" id="siteHost" name="host" placeholder="ftp.example.com" required>
                </div>
                <div class="form-group">
                    <label for="sitePort">Port</label>
                    <input type="number" id="sitePort" name="port" value="21" required>
                </div>
                <div class="form-group">
                    <label for="siteUsername">Username</label>
                    <input type="text" id="siteUsername" name="username" required>
                </div>
                <div class="form-group">
                    <label for="sitePassword">Password</label>
                    <input type="password" id="sitePassword" name="password" required>
                </div>
                <div class="form-group">
                    <label class="checkbox">
                        <input type="checkbox" name="passive" checked> Use passive mode
                    </label>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Site</button>
                </div>
            </form>
        </div>
    </div>

    <script src="js/main.js"></script>
    <script src="js/dashboard.js"></script>
</body>
</html>
EOFDASH

# Deploy auth.css
cat > /var/www/html/css/auth.css << 'EOFAUTHCSS'
.auth-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
}

.auth-box {
    background: white;
    padding: 2.5rem;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
}

.auth-box h1 {
    margin-bottom: 0.5rem;
    color: var(--dark);
}

.auth-subtitle {
    color: var(--secondary);
    margin-bottom: 2rem;
}

.auth-form {
    margin-top: 2rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--dark);
    font-weight: 500;
}

.form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 1rem;
    transition: border-color 0.3s;
}

.form-group input:focus {
    outline: none;
    border-color: var(--primary);
}

.checkbox {
    display: flex;
    align-items: center;
    cursor: pointer;
}

.checkbox input {
    width: auto;
    margin-right: 0.5rem;
}

.alert {
    padding: 1rem;
    border-radius: var(--radius);
    margin-bottom: 1.5rem;
}

.alert-error {
    background: #fee;
    color: #c33;
    border: 1px solid #fcc;
}

.alert-success {
    background: #efe;
    color: #3c3;
    border: 1px solid #cfc;
}

.auth-links {
    text-align: center;
    margin-top: 1.5rem;
    color: var(--secondary);
}

.auth-links a {
    color: var(--primary);
    text-decoration: none;
}

.auth-links a:hover {
    text-decoration: underline;
}

.auth-links span {
    margin: 0 0.5rem;
}

.demo-info {
    background: var(--light);
    padding: 1rem;
    border-radius: var(--radius);
    margin-top: 2rem;
    text-align: center;
    font-size: 0.875rem;
}

.demo-info p {
    margin: 0.25rem 0;
}
EOFAUTHCSS

# Deploy dashboard.css
cat > /var/www/html/css/dashboard.css << 'EOFDASHCSS'
.dashboard-container {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 0 20px;
}

.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.dashboard-header h1 {
    color: var(--dark);
}

.btn-icon {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.sites-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
}

.site-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.5rem;
    transition: box-shadow 0.3s;
}

.site-card:hover {
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.site-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 1rem;
}

.site-header h3 {
    margin: 0;
    color: var(--dark);
}

.site-actions {
    display: flex;
    gap: 0.5rem;
}

.site-actions .btn-icon {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    font-size: 1.2rem;
    opacity: 0.7;
    transition: opacity 0.3s;
}

.site-actions .btn-icon:hover {
    opacity: 1;
}

.site-info {
    margin-bottom: 1.5rem;
}

.site-info p {
    margin: 0.5rem 0;
    color: var(--secondary);
    font-size: 0.875rem;
}

.site-info strong {
    color: var(--dark);
}

.site-footer {
    margin-top: 1rem;
}

.empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 4rem 2rem;
}

.empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.empty-state h3 {
    color: var(--dark);
    margin-bottom: 0.5rem;
}

.empty-state p {
    color: var(--secondary);
    margin-bottom: 1.5rem;
}

/* Modal */
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 2000;
    align-items: center;
    justify-content: center;
}

.modal.active {
    display: flex;
}

.modal-content {
    background: white;
    border-radius: var(--radius);
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
}

.modal-header h2 {
    margin: 0;
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--secondary);
    padding: 0.5rem;
}

.modal-form {
    padding: 1.5rem;
}

.modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
}

.nav-link.active {
    color: var(--primary);
    font-weight: 500;
}

@media (max-width: 768px) {
    .dashboard-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }
    
    .sites-grid {
        grid-template-columns: 1fr;
    }
}
EOFDASHCSS

# Deploy editor.php
cat > /var/www/html/editor.php << 'EOFEDITOR'
<?php
session_start();

// Redirect if not logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: auth/login.php');
    exit;
}

$site_id = $_GET['site'] ?? 1;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editor - EzEdit.co</title>
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/editor.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/editor/editor.main.min.css">
</head>
<body>
    <div class="editor-container">
        <div class="editor-header">
            <div class="editor-brand">
                <a href="dashboard.php" class="back-link">← Back to Dashboard</a>
                <span class="site-name">Main Website</span>
            </div>
            <div class="editor-actions">
                <button class="btn btn-secondary" onclick="saveFile()">💾 Save</button>
                <button class="btn btn-secondary" onclick="toggleAI()">🤖 AI Assistant</button>
            </div>
        </div>
        
        <div class="editor-main">
            <div class="file-explorer" id="fileExplorer">
                <div class="explorer-header">
                    <h3>Files</h3>
                    <button class="btn-icon" onclick="refreshFiles()">🔄</button>
                </div>
                <div class="file-tree" id="fileTree">
                    <div class="file-item folder">
                        <span class="file-icon">📁</span>
                        <span class="file-name">public_html</span>
                    </div>
                    <div class="file-item file" style="padding-left: 20px;">
                        <span class="file-icon">📄</span>
                        <span class="file-name">index.html</span>
                    </div>
                    <div class="file-item file" style="padding-left: 20px;">
                        <span class="file-icon">📄</span>
                        <span class="file-name">style.css</span>
                    </div>
                    <div class="file-item file" style="padding-left: 20px;">
                        <span class="file-icon">📄</span>
                        <span class="file-name">script.js</span>
                    </div>
                </div>
            </div>
            
            <div class="code-editor" id="codeEditor">
                <div class="editor-tabs">
                    <div class="tab active">
                        <span>index.html</span>
                        <button class="tab-close">×</button>
                    </div>
                </div>
                <div id="monacoEditor"></div>
            </div>
            
            <div class="ai-assistant" id="aiAssistant" style="display: none;">
                <div class="ai-header">
                    <h3>AI Assistant</h3>
                    <button class="btn-icon" onclick="toggleAI()">×</button>
                </div>
                <div class="ai-messages" id="aiMessages">
                    <div class="ai-message ai">
                        <p>Hello! I\'m your AI coding assistant. How can I help you today?</p>
                    </div>
                </div>
                <div class="ai-input">
                    <textarea id="aiInput" placeholder="Ask me anything about your code..."></textarea>
                    <button class="btn btn-primary" onclick="sendAIMessage()">Send</button>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js"></script>
    <script src="js/editor.js"></script>
</body>
</html>
EOFEDITOR

# Deploy editor.css
cat > /var/www/html/css/editor.css << 'EOFEDITORCSS'
body {
    overflow: hidden;
}

.editor-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
}

.editor-header {
    background: var(--dark);
    color: white;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.editor-brand {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.back-link {
    color: #94a3b8;
    text-decoration: none;
    transition: color 0.3s;
}

.back-link:hover {
    color: white;
}

.site-name {
    font-weight: 500;
}

.editor-actions {
    display: flex;
    gap: 0.5rem;
}

.editor-main {
    flex: 1;
    display: flex;
    overflow: hidden;
}

.file-explorer {
    width: 250px;
    background: #f8fafc;
    border-right: 1px solid var(--border);
    overflow-y: auto;
}

.explorer-header {
    padding: 1rem;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.explorer-header h3 {
    margin: 0;
    font-size: 1rem;
}

.file-tree {
    padding: 0.5rem;
}

.file-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.2s;
}

.file-item:hover {
    background: #e5e7eb;
}

.file-item.active {
    background: var(--primary);
    color: white;
}

.file-icon {
    font-size: 1rem;
}

.code-editor {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.editor-tabs {
    background: #e5e7eb;
    display: flex;
    gap: 1px;
    padding: 0;
    overflow-x: auto;
}

.tab {
    background: white;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    border-top: 2px solid transparent;
    white-space: nowrap;
}

.tab.active {
    border-top-color: var(--primary);
}

.tab-close {
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0.5;
    font-size: 1.2rem;
    padding: 0 0.25rem;
}

.tab-close:hover {
    opacity: 1;
}

#monacoEditor {
    flex: 1;
}

.ai-assistant {
    width: 350px;
    background: white;
    border-left: 1px solid var(--border);
    display: flex;
    flex-direction: column;
}

.ai-header {
    padding: 1rem;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.ai-header h3 {
    margin: 0;
    font-size: 1rem;
}

.ai-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
}

.ai-message {
    margin-bottom: 1rem;
    padding: 0.75rem;
    border-radius: var(--radius);
}

.ai-message.user {
    background: var(--primary);
    color: white;
    margin-left: 2rem;
}

.ai-message.ai {
    background: #f8fafc;
    margin-right: 2rem;
}

.ai-input {
    padding: 1rem;
    border-top: 1px solid var(--border);
}

.ai-input textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    resize: vertical;
    min-height: 80px;
    margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
    .file-explorer {
        display: none;
    }
    
    .ai-assistant {
        position: fixed;
        right: 0;
        top: 60px;
        height: calc(100vh - 60px);
        box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
    }
}
EOFEDITORCSS

# Deploy logout.php
cat > /var/www/html/auth/logout.php << 'EOFLOGOUT'
<?php
session_start();
session_destroy();
header('Location: ../index.php');
exit;
EOFLOGOUT

# Deploy basic dashboard.js
cat > /var/www/html/js/dashboard.js << 'EOFDASHJS'
function showAddSiteModal() {
    document.getElementById('addSiteModal').classList.add('active');
}

function closeModal() {
    document.getElementById('addSiteModal').classList.remove('active');
}

function editSite(id) {
    alert('Edit functionality coming soon!');
}

function deleteSite(id) {
    if (confirm('Are you sure you want to delete this site?')) {
        alert('Delete functionality coming soon!');
    }
}

// Handle form submission
document.getElementById('addSiteForm').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('FTP site connection functionality coming soon!');
    closeModal();
});

// Close modal on outside click
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal();
    }
}
EOFDASHJS

# Deploy basic editor.js
cat > /var/www/html/js/editor.js << 'EOFEDITORJS'
// Initialize Monaco Editor
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});

require(['vs/editor/editor.main'], function() {
    window.editor = monaco.editor.create(document.getElementById('monacoEditor'), {
        value: '<!DOCTYPE html>\n<html>\n<head>\n    <title>My Website</title>\n</head>\n<body>\n    <h1>Welcome to EzEdit.co</h1>\n    <p>Start editing your files!</p>\n</body>\n</html>',
        language: 'html',
        theme: 'vs',
        automaticLayout: true,
        minimap: { enabled: false }
    });
});

function saveFile() {
    alert('Save functionality will connect to your FTP server');
}

function toggleAI() {
    const aiPanel = document.getElementById('aiAssistant');
    aiPanel.style.display = aiPanel.style.display === 'none' ? 'flex' : 'none';
}

function refreshFiles() {
    alert('Refreshing file list...');
}

function sendAIMessage() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();
    
    if (message) {
        // Add user message
        const messagesDiv = document.getElementById('aiMessages');
        messagesDiv.innerHTML += `
            <div class="ai-message user">
                <p>${message}</p>
            </div>
        `;
        
        // Simulate AI response
        setTimeout(() => {
            messagesDiv.innerHTML += `
                <div class="ai-message ai">
                    <p>I'll help you with that! This feature will be connected to AI assistance soon.</p>
                </div>
            `;
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }, 1000);
        
        input.value = '';
    }
}

// Handle file clicks
document.querySelectorAll('.file-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.file-item').forEach(f => f.classList.remove('active'));
        this.classList.add('active');
    });
});
EOFEDITORJS

# Final permission check
chown -R www-data:www-data /var/www/html
find /var/www/html -type f -exec chmod 644 {} \;
find /var/www/html -type d -exec chmod 755 {} \;

# Test all pages
echo ""
echo "Testing deployed pages..."
echo "========================"
curl -s -o /dev/null -w "index.php: %{http_code}\n" "http://localhost/index.php"
curl -s -o /dev/null -w "dashboard.php: %{http_code}\n" "http://localhost/dashboard.php"
curl -s -o /dev/null -w "editor.php: %{http_code}\n" "http://localhost/editor.php"
curl -s -o /dev/null -w "login.php: %{http_code}\n" "http://localhost/auth/login.php"
curl -s -o /dev/null -w "health.php: %{http_code}\n" "http://localhost/health.php"

echo ""
echo "Part 2 deployment complete!"