#!/bin/bash

# EzEdit.co Production Deployment Script
# Deploys all missing critical files to production server

set -e

SERVER="159.65.224.175"
PASSWORD="MattKaylaS2two"
DEPLOY_USER="root"
TARGET_DIR="/var/www/html"

echo "🚀 Starting EzEdit.co Production Deployment..."
echo "   Server: $SERVER"
echo "   Target: $TARGET_DIR"
echo ""

# Function to deploy files using different methods
deploy_file() {
    local file=$1
    local target_path=${2:-$file}
    
    echo "📤 Deploying $file..."
    
    # Method 1: Try sshpass (if available)
    if command -v sshpass &> /dev/null; then
        if sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no "$file" "$DEPLOY_USER@$SERVER:$TARGET_DIR/$target_path"; then
            echo "   ✅ Deployed via sshpass"
            return 0
        fi
    fi
    
    # Method 2: Try rsync with SSH
    if command -v rsync &> /dev/null; then
        if sshpass -p "$PASSWORD" rsync -avz --progress -e "ssh -o StrictHostKeyChecking=no" "$file" "$DEPLOY_USER@$SERVER:$TARGET_DIR/$target_path"; then
            echo "   ✅ Deployed via rsync"
            return 0
        fi
    fi
    
    # Method 3: Manual instructions
    echo "   ⚠️  Automatic deployment failed. Manual steps:"
    echo "      scp $file $DEPLOY_USER@$SERVER:$TARGET_DIR/$target_path"
    echo "      Or copy the file manually via FTP"
    return 1
}

# Critical HTML files that are missing on production
CRITICAL_FILES=(
    "signup.html"
    "pricing.html" 
    "billing.html"
)

echo "🎯 Deploying critical HTML files..."
for file in "${CRITICAL_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        deploy_file "$file"
    else
        echo "   ❌ File not found: $file"
    fi
done

# Deploy API routes
echo ""
echo "🔌 Deploying API routes..."
API_FILES=(
    "api/ai-routes.js"
    "api/ftp-routes.js"
    "api/sites-routes.js"
    "api/stripe-routes.js"
)

for file in "${API_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        deploy_file "$file"
    else
        echo "   ❌ File not found: $file"
    fi
done

# Deploy server and configuration files
echo ""
echo "⚙️  Deploying server configuration..."
CONFIG_FILES=(
    "server.js"
    "package.json"
    "config/ai-config.js"
)

for file in "${CONFIG_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        deploy_file "$file"
    else
        echo "   ⚠️  Optional file not found: $file"
    fi
done

# Test deployment
echo ""
echo "🧪 Testing deployment..."

test_url() {
    local url=$1
    local description=$2
    
    echo "   Testing $description..."
    if curl -s -o /dev/null -w "%{http_code}" "http://$SERVER/$url" | grep -q "200\|302"; then
        echo "      ✅ $url is accessible"
    else
        echo "      ❌ $url returned error"
    fi
}

# Test critical pages
test_url "" "Landing page"
test_url "signup.html" "Signup page"
test_url "pricing.html" "Pricing page" 
test_url "billing.html" "Billing page"
test_url "login-real.html" "Login page"
test_url "dashboard-real.html" "Dashboard"
test_url "editor-real.html" "Editor"

echo ""
echo "🎉 Deployment process complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify all pages load correctly"
echo "   2. Test user signup flow"
echo "   3. Test subscription process"
echo "   4. Monitor error logs"
echo ""
echo "🌐 Test URLs:"
echo "   Landing:  http://$SERVER/"
echo "   Signup:   http://$SERVER/signup.html"
echo "   Pricing:  http://$SERVER/pricing.html"
echo "   Billing:  http://$SERVER/billing.html"
echo "   Login:    http://$SERVER/login-real.html"
echo ""
echo "🎯 Expected Result:"
echo "   Complete user journey: Visit → Signup → Trial → Subscribe → Billing"
echo "   Revenue generation: ENABLED ✅"