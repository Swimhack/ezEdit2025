#!/bin/bash

# EzEdit.co Direct Deployment to DigitalOcean
# Best practices deployment script

set -e

echo "🚀 EzEdit.co Deployment to DigitalOcean"
echo "======================================="
echo ""

# Configuration
SERVER_IP="159.65.224.175"
REMOTE_PATH="/var/www/html"
LOCAL_PATH="public"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if public directory exists
if [ ! -d "$LOCAL_PATH" ]; then
    echo -e "${RED}❌ Error: public directory not found${NC}"
    exit 1
fi

echo "📋 Deployment Details:"
echo "  • Server: $SERVER_IP"
echo "  • Remote Path: $REMOTE_PATH"
echo "  • Local Files: $LOCAL_PATH/"
echo ""

# Create backup on server
echo "📦 Creating backup on server..."
ssh root@$SERVER_IP "mkdir -p /backup/$(date +%Y%m%d_%H%M%S) && cp -r $REMOTE_PATH/* /backup/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true"

# Deploy files using rsync
echo "🚀 Deploying files..."
rsync -avz --delete \
    --exclude '.env' \
    --exclude 'logs/' \
    --exclude 'cache/' \
    $LOCAL_PATH/ root@$SERVER_IP:$REMOTE_PATH/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Files deployed successfully${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

# Set permissions
echo "🔐 Setting permissions..."
ssh root@$SERVER_IP << 'EOF'
chown -R www-data:www-data /var/www/html
find /var/www/html -type f -exec chmod 644 {} \;
find /var/www/html -type d -exec chmod 755 {} \;
chmod 755 /var/www/html/ftp/ftp-handler.php
systemctl reload nginx
EOF

echo -e "${GREEN}✅ Permissions set${NC}"

# Quick health check
echo ""
echo "🧪 Running health checks..."
echo ""

# Test endpoints
endpoints=(
    "index.php"
    "dashboard.php"
    "editor.php"
    "auth/login.php"
    "docs.php"
    "health.php"
)

for endpoint in "${endpoints[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_IP/$endpoint")
    if [ "$response" = "200" ]; then
        echo -e "  ✅ /$endpoint ${GREEN}[OK]${NC}"
    else
        echo -e "  ❌ /$endpoint ${RED}[HTTP $response]${NC}"
    fi
done

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "📌 Your application is now live at:"
echo "   👉 http://$SERVER_IP"
echo ""
echo "🔗 Direct links:"
echo "   • Homepage: http://$SERVER_IP/index.php"
echo "   • Dashboard: http://$SERVER_IP/dashboard.php"
echo "   • Editor: http://$SERVER_IP/editor.php"
echo "   • Login: http://$SERVER_IP/auth/login.php"
echo ""
echo "📊 Server Details:"
echo "   • OS: Ubuntu 22.04 LTS"
echo "   • Web Server: Nginx"
echo "   • PHP: 8.1"
echo "   • Document Root: $REMOTE_PATH"
echo ""