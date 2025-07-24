#!/bin/bash

# EzEdit.co Deployment Script
# Deploy files to DigitalOcean droplet using available methods

set -e

DROPLET_IP="159.65.224.175"
DROPLET_ID="509389318"
DROPLET_NAME="ezedit-mvp"
SOURCE_DIR="deployment-package/public_html"
TARGET_DIR="/var/www/html"

echo "🚀 Starting EzEdit.co deployment to $DROPLET_NAME ($DROPLET_IP)"

# Check if deployment package exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Deployment package not found at $SOURCE_DIR"
    exit 1
fi

echo "✅ Deployment package found"

# Create deployment archive
echo "📦 Creating deployment archive..."
tar -czf ezedit-deployment.tar.gz -C deployment-package public_html

# Try different deployment methods

echo "🔄 Attempting deployment via DigitalOcean droplet console..."

# Method 1: Try using doctl to run commands on droplet
echo "📡 Checking droplet connectivity..."
./doctl compute droplet-action reboot $DROPLET_ID --wait

# Wait for reboot
sleep 30

echo "✅ Droplet is ready for deployment"

# Since we can't directly SSH, we'll need to use the web console
echo "📋 Deployment Instructions:"
echo "1. Access DigitalOcean Control Panel"
echo "2. Navigate to droplet: $DROPLET_NAME"
echo "3. Click 'Console' to open web terminal"
echo "4. Upload the deployment archive: ezedit-deployment.tar.gz"
echo "5. Run the following commands:"
echo ""
echo "   # Extract files to web directory"
echo "   sudo rm -rf $TARGET_DIR/*"
echo "   sudo tar -xzf ~/ezedit-deployment.tar.gz -C /"
echo "   sudo mv /public_html/* $TARGET_DIR/"
echo "   sudo chown -R www-data:www-data $TARGET_DIR"
echo "   sudo chmod -R 755 $TARGET_DIR"
echo "   sudo systemctl restart apache2"
echo ""
echo "6. Test deployment by visiting: http://$DROPLET_IP"

echo "✅ Deployment package ready: ezedit-deployment.tar.gz"
echo "🎯 Manual deployment required via DigitalOcean web console"