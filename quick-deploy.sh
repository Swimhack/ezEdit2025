#!/bin/bash
# Quick deployment script for missing files
# This script should be run on the droplet via web console

echo "🚀 EzEdit.co Quick Deployment"
echo "=============================="

# Create a simple way to upload the editor.php file
cat > /tmp/deploy-editor.php <<'EOF'
<?php
// Simple script to receive and deploy editor.php content via HTTP POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['content'])) {
    $content = $_POST['content'];
    if (strlen($content) > 1000) { // Basic validation
        file_put_contents('/var/www/html/editor.php', $content);
        chmod('/var/www/html/editor.php', 0644);
        chown('/var/www/html/editor.php', 'www-data:www-data');
        echo "✅ editor.php deployed successfully";
    } else {
        echo "❌ Invalid content length";
    }
} else {
    echo "📝 Ready to receive editor.php content via POST";
}
?>
EOF

# Deploy the upload script
sudo mv /tmp/deploy-editor.php /var/www/html/deploy-editor.php
sudo chown www-data:www-data /var/www/html/deploy-editor.php
sudo chmod 644 /var/www/html/deploy-editor.php

echo "✅ Upload script deployed at http://159.65.224.175/deploy-editor.php"
echo "📤 Now upload editor.php content via POST request"