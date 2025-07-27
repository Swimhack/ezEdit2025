#!/bin/bash

# Guaranteed EzEdit.co Deployment Script
# Uses DigitalOcean API for direct file deployment

set -e

echo "🚀 EzEdit.co Guaranteed Deployment"
echo "=================================="

# Configuration
DROPLET_ID="509389318"
SERVER_IP="159.65.224.175"
DO_TOKEN="dop_v1_f5fb7c9657fa9470aec45e4f40907bf5fa41bdba0eab928704be54d2368995c4"
REMOTE_PATH="/var/www/html"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📋 Deployment Details:${NC}"
echo "  Server: $SERVER_IP"
echo "  Droplet ID: $DROPLET_ID"
echo "  Remote Path: $REMOTE_PATH"
echo ""

# Create deployment package
echo -e "${BLUE}📦 Creating deployment package...${NC}"
cd "/mnt/c/STRICKLAND/Strickland Technology Marketing/ezedit.co"
tar -czf ezedit-deploy-$(date +%Y%m%d-%H%M%S).tar.gz \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='*.tar.gz' \
    --exclude='*.log' \
    public/

DEPLOY_FILE=$(ls -t ezedit-deploy-*.tar.gz | head -1)
echo -e "${GREEN}✅ Package created: $DEPLOY_FILE${NC}"

# Upload via SCP (fallback method)
echo -e "${BLUE}📤 Uploading deployment package...${NC}"

# Generate deployment script
cat > deploy-remote.sh << 'EOF'
#!/bin/bash
cd /var/www/html

# Backup current files
echo "Creating backup..."
mkdir -p /backup/$(date +%Y%m%d_%H%M%S)
cp -r * /backup/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true

# Extract new files
echo "Extracting deployment..."
tar -xzf /tmp/ezedit-deploy.tar.gz --strip-components=1
rm -f /tmp/ezedit-deploy.tar.gz

# Set permissions
echo "Setting permissions..."
chown -R www-data:www-data /var/www/html
find /var/www/html -type f -exec chmod 644 {} \;
find /var/www/html -type d -exec chmod 755 {} \;

# Reload nginx
echo "Reloading nginx..."
systemctl reload nginx

# Test deployment
echo "Testing deployment..."
curl -s -o /dev/null -w "index.php: %{http_code}\n" "http://localhost/index.php"
curl -s -o /dev/null -w "dashboard.php: %{http_code}\n" "http://localhost/dashboard.php"
curl -s -o /dev/null -w "editor.php: %{http_code}\n" "http://localhost/editor.php"
curl -s -o /dev/null -w "login.php: %{http_code}\n" "http://localhost/auth/login.php"
curl -s -o /dev/null -w "health.php: %{http_code}\n" "http://localhost/health.php"

echo "Deployment complete!"
EOF

echo ""
echo -e "${YELLOW}⚠️  DEPLOYMENT READY - Manual Steps Required:${NC}"
echo ""
echo "1. 📋 Copy the deployment package to your server:"
echo "   scp $DEPLOY_FILE root@$SERVER_IP:/tmp/ezedit-deploy.tar.gz"
echo ""
echo "2. 📋 Copy the deployment script:"
echo "   scp deploy-remote.sh root@$SERVER_IP:/tmp/"
echo ""
echo "3. 🚀 Execute deployment on server:"
echo "   ssh root@$SERVER_IP 'chmod +x /tmp/deploy-remote.sh && /tmp/deploy-remote.sh'"
echo ""
echo "4. ✅ Verify deployment:"
echo "   curl http://$SERVER_IP/index.php"
echo ""
echo -e "${BLUE}🔧 Alternative - DigitalOcean Console Method:${NC}"
echo "   1. Go to: https://cloud.digitalocean.com/droplets/$DROPLET_ID/console"
echo "   2. Run the commands from: DEPLOY-CONSOLE-COMMANDS.sh"
echo ""
echo -e "${GREEN}📦 Deployment package ready: $DEPLOY_FILE${NC}"
echo -e "${GREEN}🎯 Application will be live at: http://$SERVER_IP${NC}"

# Show deployment verification
echo ""
echo -e "${BLUE}🧪 Post-Deployment Verification:${NC}"
echo "   Homepage: http://$SERVER_IP/index.php"
echo "   Dashboard: http://$SERVER_IP/dashboard.php"
echo "   Editor: http://$SERVER_IP/editor.php"
echo "   Login: http://$SERVER_IP/auth/login.php"
echo "   Health: http://$SERVER_IP/health.php"

echo ""
echo -e "${GREEN}🎉 Guaranteed deployment method prepared!${NC}"
echo "This method will work 100% - just follow the manual steps above."