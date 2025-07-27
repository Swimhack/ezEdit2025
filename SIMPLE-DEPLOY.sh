#!/bin/bash

# Simple deployment script for EzEdit.co
# Run this if you have SSH access to 159.65.224.175

echo "🚀 EzEdit.co Simple Deployment"
echo "==============================="

# Check if deployment package exists
if [ ! -f "ezedit-complete-deployment.tar.gz" ]; then
    echo "❌ Deployment package not found!"
    exit 1
fi

echo "📦 Deployment package found: ezedit-complete-deployment.tar.gz"
echo "📏 Package size: $(du -h ezedit-complete-deployment.tar.gz | cut -f1)"
echo ""

# Try different SSH connection methods
echo "🔑 Attempting deployment to 159.65.224.175..."
echo ""

# Method 1: Try with SSH key
echo "Method 1: Using SSH key..."
if scp -o ConnectTimeout=10 -o StrictHostKeyChecking=no ezedit-complete-deployment.tar.gz root@159.65.224.175:/tmp/ 2>/dev/null; then
    echo "✅ Upload successful!"
    
    # Deploy on server
    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@159.65.224.175 "
        cd /var/www/html
        tar -xzf /tmp/ezedit-complete-deployment.tar.gz --strip-components=1
        chown -R www-data:www-data /var/www/html
        chmod -R 755 /var/www/html
        rm /tmp/ezedit-complete-deployment.tar.gz
        echo '✅ Deployment complete!'
    "
    
    echo "🎉 SUCCESS! EzEdit.co deployed to http://159.65.224.175/"
    exit 0
fi

# Method 2: Password authentication
echo "Method 1 failed. Trying password authentication..."
if scp -o ConnectTimeout=10 -o PreferredAuthentications=password -o PubkeyAuthentication=no ezedit-complete-deployment.tar.gz root@159.65.224.175:/tmp/ 2>/dev/null; then
    echo "✅ Upload successful!"
    
    ssh -o ConnectTimeout=10 -o PreferredAuthentications=password -o PubkeyAuthentication=no root@159.65.224.175 "
        cd /var/www/html
        tar -xzf /tmp/ezedit-complete-deployment.tar.gz --strip-components=1
        chown -R www-data:www-data /var/www/html
        chmod -R 755 /var/www/html
        rm /tmp/ezedit-complete-deployment.tar.gz
        echo '✅ Deployment complete!'
    "
    
    echo "🎉 SUCCESS! EzEdit.co deployed to http://159.65.224.175/"
    exit 0
fi

echo "❌ SSH deployment failed. Please use manual deployment:"
echo ""
echo "MANUAL DEPLOYMENT STEPS:"
echo "========================"
echo "1. Upload ezedit-complete-deployment.tar.gz to your server"
echo "2. Extract it in /var/www/html/"
echo "3. Set permissions: chown -R www-data:www-data /var/www/html"
echo ""
echo "OR use the FTP deployment:"
echo "php deploy-via-ftp.php"
echo ""
echo "📋 The deployment package contains:"
echo "   - Complete EzEdit.co application"
echo "   - All navigation fixes"
echo "   - Complete UI/UX"
echo "   - All JavaScript files"
echo "   - Mobile responsive design"