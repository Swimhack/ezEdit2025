#\!/bin/bash
# EzEdit.co Editor Deployment via DigitalOcean API

# Create the editor.php file
cat > /var/www/html/editor.php << 'EDITOR_EOF'
<?php
session_start();
$authenticated = isset($_SESSION['user_logged_in']) && $_SESSION['user_logged_in'];
$user_name = $_SESSION['user_name'] ?? 'User';
?>
<\!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editor - EzEdit.co</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #1e1e1e; color: #cccccc; overflow: hidden; }
        .editor-layout { display: flex; flex-direction: column; height: 100vh; }
        .editor-header { background: #2d2d30; border-bottom: 1px solid #3e3e42; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; height: 48px; }
        .logo { color: #ffffff; text-decoration: none; font-weight: 600; font-size: 1.1rem; }
        .editor-main { display: flex; flex: 1; overflow: hidden; }
        .file-explorer { width: 280px; background: #252526; border-right: 1px solid #3e3e42; display: flex; flex-direction: column; }
        .editor-container { flex: 1; display: flex; flex-direction: column; position: relative; }
        .monaco-editor-container { width: 100%; height: 100%; }
        .ai-assistant { width: 320px; background: #252526; border-left: 1px solid #3e3e42; display: flex; flex-direction: column; }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js"></script>
</head>
<body class="editor-layout">
    <header class="editor-header">
        <a href="index.php" class="logo">EzEdit.co</a>
        <div>Editor Interface Active</div>
    </header>
    <main class="editor-main">
        <aside class="file-explorer">
            <div style="padding: 20px; text-align: center;">
                <h3>File Explorer</h3>
                <p>Connect to FTP to browse files</p>
            </div>
        </aside>
        <section class="editor-container">
            <div id="editor" class="monaco-editor-container"></div>
        </section>
        <aside class="ai-assistant">
            <div style="padding: 20px; text-align: center;">
                <h3>AI Assistant</h3>
                <p>Ask me about your code\!</p>
            </div>
        </aside>
    </main>
    <script>
        require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
        require(['vs/editor/editor.main'], function () {
            monaco.editor.create(document.getElementById('editor'), {
                value: '// Welcome to EzEdit.co\!\n// Your complete web-based IDE is now ready\!\n\nfunction init() {\n    console.log("EzEdit.co Editor loaded successfully\!");\n}',
                language: 'javascript',
                theme: 'vs-dark'
            });
        });
    </script>
</body>
</html>
EDITOR_EOF

# Set proper permissions
chown www-data:www-data /var/www/html/editor.php
chmod 644 /var/www/html/editor.php

# Create a success flag
echo "EzEdit.co Editor deployed successfully via DigitalOcean API at $(date)" > /var/log/ezedit-deploy.log
EOF < /dev/null
