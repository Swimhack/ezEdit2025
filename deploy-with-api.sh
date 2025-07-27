#!/bin/bash

# EzEdit.co DigitalOcean API Deployment Script
DROPLET_ID="509389318"
DROPLET_IP="159.65.224.175"
API_TOKEN="dop_v1_f5fb7c9657fa9470aec45e4f40907bf5fa41bdba0eab928704be54d2368995c4"

echo "🚀 EzEdit.co DigitalOcean API Deployment"
echo "========================================"
echo "Droplet ID: $DROPLET_ID"
echo "IP Address: $DROPLET_IP"
echo "Package: ezedit-complete-deployment.tar.gz"
echo ""

# Create a deployment script on the server
DEPLOY_SCRIPT='#!/bin/bash
echo "Starting deployment on server..."

# Create backup
mkdir -p /backup/$(date +%Y%m%d_%H%M%S)
cp -r /var/www/html/* /backup/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true

# Navigate to web root
cd /var/www/html

# Download the deployment package (we will upload it first)
# Extract the deployment
tar -xzf /tmp/ezedit-complete-deployment.tar.gz --strip-components=1

# Set proper permissions
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html
find /var/www/html -name "*.php" -exec chmod 644 {} \;
find /var/www/html -name "*.css" -exec chmod 644 {} \;
find /var/www/html -name "*.js" -exec chmod 644 {} \;

# Clean up
rm -f /tmp/ezedit-complete-deployment.tar.gz

# Restart nginx
systemctl reload nginx 2>/dev/null || true

echo "✅ Deployment completed successfully!"
echo "🌐 Site available at: http://159.65.224.175/"
'

# Try to create and execute the deployment script on the server
echo "📤 Attempting deployment via DigitalOcean API..."

# Create a droplet action to run the deployment
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{
    "type": "run_script",
    "script": "'"$(echo "$DEPLOY_SCRIPT" | base64 -w 0)"'"
  }' \
  "https://api.digitalocean.com/v2/droplets/$DROPLET_ID/actions"

echo ""
echo "📋 Deployment initiated via API"
echo "⏱️  This may take a few minutes to complete"
echo ""
echo "Alternative: Run manual upload:"
echo "scp ezedit-complete-deployment.tar.gz root@$DROPLET_IP:/tmp/"
echo "ssh root@$DROPLET_IP 'bash -s' < deploy-script.sh"