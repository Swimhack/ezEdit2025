#!/bin/bash

echo "🚀 DigitalOcean App Platform Deployment Script"
echo "============================================="

# Check if doctl is available
if [ ! -f "./doctl" ]; then
    echo "❌ doctl not found. Please download it first."
    exit 1
fi

echo "📋 Step 1: Get your DigitalOcean API Token"
echo "1. Go to: https://cloud.digitalocean.com/account/api/tokens"
echo "2. Click 'Generate New Token'"
echo "3. Name it 'EzEdit-Deploy' with Write scope"
echo "4. Copy the token when generated"
echo ""

# Get API token from user
read -p "🔑 Enter your DigitalOcean API Token: " api_token

if [ -z "$api_token" ]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

echo ""
echo "🔐 Authenticating with DigitalOcean..."

# Authenticate
echo "$api_token" | ./doctl auth init --access-token -

# Verify authentication
if ./doctl account get > /dev/null 2>&1; then
    echo "✅ Authentication successful!"
    
    # Get account info
    echo "📊 Account Info:"
    ./doctl account get
    echo ""
    
    echo "🚀 Deploying EzEdit to App Platform..."
    echo "📍 Using configuration: simple-app-spec.yaml"
    echo ""
    
    # Deploy the app
    ./doctl apps create --spec simple-app-spec.yaml --format json > deployment-result.json
    
    if [ $? -eq 0 ]; then
        echo "✅ Deployment initiated successfully!"
        echo ""
        
        # Extract app ID and details
        app_id=$(cat deployment-result.json | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        app_name=$(cat deployment-result.json | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
        
        echo "📱 App Details:"
        echo "   Name: $app_name"
        echo "   ID: $app_id"
        echo ""
        
        echo "⏳ Monitoring deployment progress..."
        echo "This may take 3-5 minutes..."
        echo ""
        
        # Monitor deployment
        for i in {1..20}; do
            echo "🔄 Checking status... ($i/20)"
            
            if ./doctl apps get "$app_id" --format json > app-status.json 2>/dev/null; then
                status=$(cat app-status.json | grep -o '"phase":"[^"]*"' | head -1 | cut -d'"' -f4)
                echo "   Status: $status"
                
                if [ "$status" = "ACTIVE" ]; then
                    echo ""
                    echo "🎉 Deployment Successful!"
                    
                    # Get the live URL
                    live_url=$(cat app-status.json | grep -o '"live_url":"[^"]*"' | head -1 | cut -d'"' -f4)
                    
                    if [ ! -z "$live_url" ]; then
                        echo "🌐 Your EzEdit is now live at:"
                        echo "   $live_url"
                        echo ""
                        echo "🔗 Quick Links:"
                        echo "   📝 Editor: $live_url/editor.php"
                        echo "   📊 Dashboard: $live_url/dashboard.php"
                        echo "   🔐 Login: $live_url/auth/login.php"
                        echo "   ⚡ Health: $live_url/health.php"
                        echo ""
                        echo "✅ Deployment Complete!"
                    fi
                    break
                elif [ "$status" = "ERROR" ]; then
                    echo "❌ Deployment failed. Check logs:"
                    ./doctl apps logs "$app_id" --type=deploy
                    break
                fi
            fi
            
            sleep 15
        done
        
        # List all apps
        echo ""
        echo "📱 Your DigitalOcean Apps:"
        ./doctl apps list
        
    else
        echo "❌ Deployment failed. Please check your configuration."
        cat deployment-result.json 2>/dev/null || echo "No detailed error information available."
    fi
    
else
    echo "❌ Authentication failed. Please check your API token."
    exit 1
fi

echo ""
echo "🔧 Manage your app:"
echo "   View in browser: https://cloud.digitalocean.com/apps"
echo "   CLI commands: ./doctl apps --help"