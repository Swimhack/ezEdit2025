<?php
/**
 * Simple deployment helper to upload missing files
 * This script can be uploaded to the server to deploy editor.php
 */

// Security: Only allow from localhost or specific IP
$allowed_ips = ['127.0.0.1', '::1', '159.65.224.175'];
$client_ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

if (!in_array($client_ip, $allowed_ips) && !isset($_GET['force'])) {
    die('Access denied. Add ?force=1 to bypass (use carefully).');
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>EzEdit.co Deployment Helper</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
        .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 4px; margin: 10px 0; }
        .error { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 4px; margin: 10px 0; }
        .info { background: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 4px; margin: 10px 0; }
        textarea { width: 100%; height: 300px; font-family: monospace; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .file-status { margin: 10px 0; padding: 10px; border-radius: 4px; }
        .exists { background: #d4edda; color: #155724; }
        .missing { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 EzEdit.co Deployment Helper</h1>
        
        <?php
        // Check current file status
        $files_to_check = [
            'index.php' => 'Homepage',
            'dashboard.php' => 'Dashboard',
            'editor.php' => 'Editor (Missing)',
            'auth/login.php' => 'Login Page'
        ];
        
        echo "<h2>📋 Current File Status</h2>";
        foreach ($files_to_check as $file => $description) {
            $exists = file_exists("/var/www/html/$file");
            $class = $exists ? 'exists' : 'missing';
            $status = $exists ? '✅ Exists' : '❌ Missing';
            echo "<div class='file-status $class'>$description ($file): $status</div>";
        }
        
        // Handle file upload
        if ($_POST && isset($_POST['file_content']) && isset($_POST['filename'])) {
            $filename = $_POST['filename'];
            $content = $_POST['file_content'];
            
            // Basic security check
            if (!preg_match('/^[a-zA-Z0-9._-]+\.php$/', $filename)) {
                echo "<div class='error'>❌ Invalid filename. Only PHP files allowed.</div>";
            } else {
                $target_path = "/var/www/html/$filename";
                
                // Create directory if needed
                $dir = dirname($target_path);
                if (!is_dir($dir)) {
                    mkdir($dir, 0755, true);
                }
                
                // Write file
                if (file_put_contents($target_path, $content) !== false) {
                    // Set proper permissions
                    chmod($target_path, 0644);
                    if (function_exists('chown')) {
                        @chown($target_path, 'www-data');
                        @chgrp($target_path, 'www-data');
                    }
                    
                    echo "<div class='success'>✅ Successfully deployed $filename</div>";
                    echo "<div class='info'>🌐 <a href='/$filename' target='_blank'>Test $filename</a></div>";
                } else {
                    echo "<div class='error'>❌ Failed to write $filename</div>";
                }
            }
        }
        ?>
        
        <h2>📤 Deploy Missing Files</h2>
        <form method="post">
            <p><strong>Filename:</strong></p>
            <input type="text" name="filename" value="editor.php" style="width: 100%; padding: 8px; margin-bottom: 10px;">
            
            <p><strong>File Content:</strong></p>
            <textarea name="file_content" placeholder="Paste the PHP file content here..."><?php
            // Pre-populate with editor.php content if we have it locally
            $local_editor = __DIR__ . '/deployment-package/public_html/editor.php';
            if (file_exists($local_editor)) {
                echo htmlspecialchars(file_get_contents($local_editor));
            }
            ?></textarea>
            
            <br><br>
            <button type="submit">🚀 Deploy File</button>
        </form>
        
        <h2>🧪 Quick Tests</h2>
        <p>After deployment, test these URLs:</p>
        <ul>
            <li><a href="/" target="_blank">Homepage</a></li>
            <li><a href="/auth/login.php" target="_blank">Login Page</a></li>
            <li><a href="/dashboard.php" target="_blank">Dashboard</a></li>
            <li><a href="/editor.php" target="_blank">Editor</a></li>
        </ul>
        
        <h2>🗑️ Cleanup</h2>
        <p><em>Delete this file after deployment: <code>rm /var/www/html/deploy-missing.php</code></em></p>
    </div>
</body>
</html>