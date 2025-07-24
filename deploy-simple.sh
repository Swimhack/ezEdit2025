#!/bin/bash

# Simple password-based deployment
DROPLET_IP="159.65.224.175"
PASSWORD="MattKaylaS2two"

echo "🚀 EzEdit.co Deployment to DigitalOcean"
echo "====================================="
echo "Server: $DROPLET_IP"
echo "Package: ezedit-complete-deployment.tar.gz"
echo ""

# Check if deployment package exists
if [ ! -f "ezedit-complete-deployment.tar.gz" ]; then
    echo "❌ Deployment package not found!"
    exit 1
fi

echo "📦 Package size: $(du -h ezedit-complete-deployment.tar.gz | cut -f1)"
echo ""

# Upload using password authentication
echo "📤 Uploading deployment package..."
echo "$PASSWORD" | scp -o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no ezedit-complete-deployment.tar.gz root@$DROPLET_IP:/tmp/

if [ $? -eq 0 ]; then
    echo "✅ Upload successful!"
    
    # Deploy on server
    echo "🚀 Deploying application..."
    echo "$PASSWORD" | ssh -o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no root@$DROPLET_IP << 'ENDSSH'
cd /var/www/html
echo "Creating backup..."
mkdir -p /backup/$(date +%Y%m%d_%H%M%S)
cp -r * /backup/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
echo "Extracting deployment..."
tar -xzf /tmp/ezedit-complete-deployment.tar.gz --strip-components=1
echo "Setting permissions..."
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html
find /var/www/html -name "*.php" -exec chmod 644 {} \;
echo "Cleaning up..."
rm /tmp/ezedit-complete-deployment.tar.gz
echo "Restarting web server..."
systemctl reload nginx 2>/dev/null || true
echo "✅ Deployment completed!"
ENDSSH
    
    echo ""
    echo "🎉 SUCCESS! EzEdit.co deployed to http://$DROPLET_IP/"
    echo ""
    echo "Test these URLs:"
    echo "  Homepage:     http://$DROPLET_IP/index.php"
    echo "  Dashboard:    http://$DROPLET_IP/dashboard.php"
    echo "  Editor:       http://$DROPLET_IP/editor.php"
    echo "  Login:        http://$DROPLET_IP/auth/login.php"
    
else
    echo "❌ Upload failed!"
    exit 1
fi