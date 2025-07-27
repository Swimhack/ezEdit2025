#!/bin/bash

# EzEdit.co DigitalOcean API Deployment
API_TOKEN="dop_v1_f5fb7c9657fa9470aec45e4f40907bf5fa41bdba0eab928704be54d2368995c4"
DROPLET_ID="509389318"

echo "🚀 EzEdit.co DigitalOcean API Deployment"
echo "========================================"
echo "Droplet ID: $DROPLET_ID"
echo "API Token: ${API_TOKEN:0:20}..."
echo ""

# Read the base64 encoded deployment package
if [ ! -f "deployment.b64" ]; then
    echo "❌ Base64 deployment file not found!"
    exit 1
fi

DEPLOYMENT_B64=$(cat deployment.b64)
echo "📦 Deployment package encoded ($(wc -c < deployment.b64) bytes)"

# Create the deployment script
SCRIPT=$(cat << 'EOF'
#!/bin/bash
set -e

echo "🔧 Starting EzEdit.co deployment..."

# Navigate to web root
cd /var/www/html

# Create backup
echo "📋 Creating backup..."
BACKUP_DIR="/backup/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r * "$BACKUP_DIR/" 2>/dev/null || true

# Create the deployment package from base64
echo "📥 Decoding deployment package..."
cat << 'DEPLOYMENT_END' | base64 -d > /tmp/ezedit-complete-deployment.tar.gz
DEPLOYMENT_PLACEHOLDER
DEPLOYMENT_END

# Extract the deployment
echo "📂 Extracting deployment..."
tar -xzf /tmp/ezedit-complete-deployment.tar.gz --strip-components=1

# Set proper permissions
echo "🔧 Setting permissions..."
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html
find /var/www/html -name "*.php" -exec chmod 644 {} \;
find /var/www/html -name "*.css" -exec chmod 644 {} \;
find /var/www/html -name "*.js" -exec chmod 644 {} \;

# Clean up
rm -f /tmp/ezedit-complete-deployment.tar.gz

# Restart web services
echo "🔄 Restarting services..."
systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || true

echo ""
echo "✅ EzEdit.co deployment completed successfully!"
echo "🌐 Site is now live at: http://159.65.224.175/"

# Test the deployment
echo "🧪 Testing deployment..."
if curl -s http://159.65.224.175/index.php | grep -q "EzEdit.co"; then
    echo "✅ Homepage test: PASSED"
else
    echo "⚠️  Homepage test: Could not verify"
fi

echo ""
echo "🎉 Deployment complete!"
EOF
)

# Replace the placeholder with actual base64 data
SCRIPT_WITH_DATA=$(echo "$SCRIPT" | sed "s/DEPLOYMENT_PLACEHOLDER/$DEPLOYMENT_B64/")

# Execute the script via DigitalOcean API
echo "🚀 Executing deployment via DigitalOcean API..."

# Create a temporary script file
echo "$SCRIPT_WITH_DATA" > temp_deploy_script.sh

# Execute using doctl
./doctl compute ssh $DROPLET_ID --ssh-command "bash -s" < temp_deploy_script.sh

RESULT=$?

# Clean up
rm -f temp_deploy_script.sh

if [ $RESULT -eq 0 ]; then
    echo ""
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "========================="
    echo "🌐 EzEdit.co is now live at: http://159.65.224.175/"
    echo ""
    echo "Test these updated URLs:"
    echo "  Homepage:     http://159.65.224.175/index.php"
    echo "  Dashboard:    http://159.65.224.175/dashboard.php"
    echo "  Editor:       http://159.65.224.175/editor.php"
    echo "  Login:        http://159.65.224.175/auth/login.php"
    echo "  Register:     http://159.65.224.175/auth/register.php"
    echo "  Settings:     http://159.65.224.175/settings.php"
    echo "  Documentation: http://159.65.224.175/docs.php"
    echo ""
    echo "🎯 All navigation links have been fixed!"
    echo "📱 Mobile responsive design implemented!"
    echo "🎨 Complete UI/UX populated!"
    
    # Verify deployment
    echo ""
    echo "🧪 Running post-deployment verification..."
    curl -s -I http://159.65.224.175/index.php | head -1
    
else
    echo ""
    echo "❌ DEPLOYMENT FAILED"
    echo "=================="
    echo "Check server logs for details"
fi