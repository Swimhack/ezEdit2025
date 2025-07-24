#!/bin/bash

# EzEdit.co Deployment Script for DigitalOcean Server
# Deploy public/ folder contents to root directory on 159.65.224.175

echo "🚀 Deploying EzEdit.co to DigitalOcean Server"
echo "=============================================="
echo "Target: 159.65.224.175"
echo "Source: public/ directory"
echo "Date: $(date)"
echo ""

# Server details
SERVER_IP="159.65.224.175"
SERVER_USER="root"  # Assuming root access for DigitalOcean droplet
PUBLIC_DIR="/mnt/c/STRICKLAND/Strickland Technology Marketing/ezedit.co/public"

# Check if public directory exists
if [ ! -d "$PUBLIC_DIR" ]; then
    echo "❌ Error: Public directory not found at $PUBLIC_DIR"
    exit 1
fi

echo "📦 Files to deploy:"
ls -la "$PUBLIC_DIR"
echo ""

echo "🔄 Starting deployment..."

# Create a temporary directory for deployment files
TEMP_DIR="/tmp/ezedit-deploy-$(date +%s)"
mkdir -p "$TEMP_DIR"

# Copy all files from public directory to temp directory
echo "📋 Copying files to temporary directory..."
cp -r "$PUBLIC_DIR"/* "$TEMP_DIR/"

# List what we're about to deploy
echo "📁 Deployment package contents:"
find "$TEMP_DIR" -type f | head -20
echo ""

# Deploy using rsync (more efficient for updates)
echo "🚀 Deploying files to server..."

# Using rsync to deploy (assuming SSH key is set up)
# If SSH key isn't set up, this will prompt for password
rsync -avz --delete \
    "$TEMP_DIR/" \
    "$SERVER_USER@$SERVER_IP:/var/www/html/" \
    --exclude '.DS_Store' \
    --exclude '*.log' \
    --exclude 'node_modules' \
    --exclude '.git'

DEPLOY_STATUS=$?

# Clean up temporary directory
rm -rf "$TEMP_DIR"

if [ $DEPLOY_STATUS -eq 0 ]; then
    echo ""
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "========================="
    echo "EzEdit.co has been deployed to:"
    echo "🌐 http://159.65.224.175/"
    echo ""
    echo "Available pages:"
    echo "  Homepage:   http://159.65.224.175/index.php"
    echo "  Dashboard:  http://159.65.224.175/dashboard.php" 
    echo "  Editor:     http://159.65.224.175/editor.php"
    echo "  Login:      http://159.65.224.175/auth/login.php"
    echo "  Register:   http://159.65.224.175/auth/register.php"
    echo ""
    echo "🧪 Testing deployment..."
    
    # Test if homepage is accessible
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://159.65.224.175/index.php")
    if [ "$HTTP_STATUS" -eq "200" ]; then
        echo "✅ Homepage: HTTP $HTTP_STATUS (OK)"
    else
        echo "⚠️  Homepage: HTTP $HTTP_STATUS"
    fi
    
    # Test dashboard
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://159.65.224.175/dashboard.php")
    if [ "$HTTP_STATUS" -eq "200" ]; then
        echo "✅ Dashboard: HTTP $HTTP_STATUS (OK)"
    else
        echo "⚠️  Dashboard: HTTP $HTTP_STATUS"
    fi
    
    # Test editor
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://159.65.224.175/editor.php")
    if [ "$HTTP_STATUS" -eq "200" ]; then
        echo "✅ Editor: HTTP $HTTP_STATUS (OK)"
    else
        echo "⚠️  Editor: HTTP $HTTP_STATUS"
    fi
    
    echo ""
    echo "🎉 Deployment complete! EzEdit.co is now live."
    
else
    echo ""
    echo "❌ DEPLOYMENT FAILED"
    echo "==================="
    echo "Please check:"
    echo "1. SSH access to 159.65.224.175"
    echo "2. Server permissions"
    echo "3. Network connectivity"
    exit 1
fi