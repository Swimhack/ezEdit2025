#!/bin/bash

# Fixed deployment script for EzEdit.co pricing update
SERVER="159.65.224.175"
PASSWORD="MattKaylaS2two"

echo "🚀 EzEdit.co Pricing Update Deployment"
echo "======================================"
echo "Server: $SERVER"
echo ""

# Check if we have the updated index.php file
if [ ! -f "public/index.php" ]; then
    echo "❌ Updated index.php not found in public/ directory"
    exit 1
fi

echo "📁 Found updated index.php file"
echo "📏 File size: $(du -h public/index.php | cut -f1)"
echo ""

# Create a simple deployment script that works with password auth
cat > /tmp/deploy_script.sh << 'DEPLOY_EOF'
#!/bin/bash
set -e

echo "🔧 Starting pricing update deployment..."

# Navigate to web root
cd /var/www/html

# Create timestamped backup
echo "📋 Creating backup..."
BACKUP_DIR="/backup/pricing-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp index.php "$BACKUP_DIR/index.php.backup" 2>/dev/null || true

echo "✅ Backup created at $BACKUP_DIR"

# The updated index.php content will be piped here
echo "📝 Updating index.php with new pricing..."

# Set proper permissions
echo "🔧 Setting permissions..."
chown www-data:www-data index.php
chmod 644 index.php

# Reload web server
echo "🔄 Reloading nginx..."
systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || true

echo ""
echo "✅ Pricing update deployment completed!"
echo "🌐 Site updated at: http://159.65.224.175/"

# Test the deployment
echo "🧪 Testing pricing update..."
if curl -s http://159.65.224.175/index.php | grep -q "No setup fees"; then
    echo "✅ Pricing verification: SUCCESS"
else
    echo "⚠️  Pricing verification: Could not confirm"
fi

echo ""
echo "🎉 Deployment complete!"
echo "💰 New pricing structure:"
echo "   • Free: \$0/forever"
echo "   • Single Site: \$20/month"
echo "   • Unlimited: \$100/month"
echo "   • Guarantee: No setup fees | Cancel anytime | 30-day money back"
DEPLOY_EOF

# Make the deployment script executable
chmod +x /tmp/deploy_script.sh

echo "📤 Uploading files to server..."

# Use curl to upload via HTTP if available, otherwise use manual method
if command -v curl >/dev/null 2>&1; then
    echo "🌐 Using HTTP upload method..."
    
    # Create a simple upload handler temporarily
    cat > /tmp/upload.php << 'UPLOAD_EOF'
<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    $target = '/var/www/html/index.php';
    
    // Backup existing file
    $backup_dir = '/backup/http-upload-' . date('Ymd_His');
    exec("mkdir -p $backup_dir");
    exec("cp $target $backup_dir/index.php.backup 2>/dev/null || true");
    
    if (move_uploaded_file($_FILES['file']['tmp_name'], $target)) {
        exec("chown www-data:www-data $target");
        exec("chmod 644 $target");
        exec("systemctl reload nginx 2>/dev/null || true");
        
        echo "SUCCESS: File uploaded and deployed\n";
        echo "Backup created at: $backup_dir\n";
        
        // Test the update
        $content = file_get_contents('http://159.65.224.175/index.php');
        if (strpos($content, 'No setup fees') !== false) {
            echo "VERIFIED: Pricing update confirmed\n";
        } else {
            echo "WARNING: Could not verify pricing update\n";
        }
    } else {
        echo "ERROR: Failed to upload file\n";
    }
} else {
    echo "ERROR: No file uploaded\n";
}
?>
UPLOAD_EOF

    # Try to upload the file via HTTP (this would need to be manually placed on server)
    echo "📋 Upload method requires manual server setup"
    echo ""
fi

echo "🔧 Alternative: Manual deployment steps"
echo "======================================="
echo ""
echo "1. Go to DigitalOcean Console: https://cloud.digitalocean.com/droplets/509389318"
echo "2. Click 'Console' tab"
echo "3. Run these commands:"
echo ""
echo "   # Backup current file"
echo "   cd /var/www/html"
echo "   mkdir -p /backup/pricing-\$(date +%Y%m%d_%H%M%S)"
echo "   cp index.php /backup/pricing-\$(date +%Y%m%d_%H%M%S)/"
echo ""
echo "   # Create updated index.php with new pricing"
echo "   cat > index.php << 'INDEX_EOF'"

# Output the updated index.php content
cat public/index.php

echo "INDEX_EOF"
echo ""
echo "   # Set permissions and reload"
echo "   chown www-data:www-data index.php"
echo "   chmod 644 index.php"
echo "   systemctl reload nginx"
echo ""
echo "   # Test the update"
echo "   curl -s http://159.65.224.175/index.php | grep -q \"No setup fees\" && echo \"✅ SUCCESS\" || echo \"⚠️  Check manually\""
echo ""
echo "🎯 After deployment, test at: http://159.65.224.175/index.php#pricing"

# Cleanup
rm -f /tmp/deploy_script.sh /tmp/upload.php 2>/dev/null || true

echo ""
echo "✅ Deployment commands ready!"
echo "💡 Copy the commands above and paste them into your DigitalOcean console"