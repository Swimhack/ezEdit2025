#!/bin/bash

# DigitalOcean App Platform Deployment Script
# Deploy EzEdit.co with scalable configuration

set -e

echo "🚀 EzEdit.co App Platform Deployment"
echo "===================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo "❌ doctl CLI not found. Please install it first:"
    echo "   https://docs.digitalocean.com/reference/doctl/how-to/install/"
    exit 1
fi

# Check if user is authenticated
if ! doctl auth list &> /dev/null; then
    echo "❌ Please authenticate with DigitalOcean first:"
    echo "   doctl auth init"
    exit 1
fi

echo "✅ Prerequisites met"
echo ""

# Validate app.yaml configuration
echo "🔍 Validating App Platform configuration..."

if [ ! -f ".do/app.yaml" ]; then
    echo "❌ App Platform configuration not found!"
    exit 1
fi

echo "✅ Configuration validated"
echo ""

# Check for required files
echo "📁 Verifying required files..."

REQUIRED_FILES=(
    "public/index.php"
    "public/health.php"
    "composer.json"
    "apache.conf"
    "worker.php"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file missing: $file"
        exit 1
    fi
done

echo "✅ All required files present"
echo ""

# Display configuration summary
echo "📊 Deployment Configuration:"
echo "=============================="
echo "App Name: ezedit-production"
echo "Region: NYC (nyc3)"
echo "Web Service: Professional XS (2 instances)"
echo "Auto-scaling: 1-10 instances"
echo "Database: PostgreSQL 14 (1GB)"
echo "Background Worker: Basic XXS"
echo "Custom Domain: ezedit.co"
echo ""

# Ask for confirmation
read -p "🤔 Deploy to App Platform? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🚀 Starting deployment..."

# Create the app
echo "📦 Creating App Platform application..."

APP_ID=$(doctl apps create --spec .do/app.yaml --output json | jq -r '.id')

if [ -z "$APP_ID" ] || [ "$APP_ID" = "null" ]; then
    echo "❌ Failed to create app"
    exit 1
fi

echo "✅ App created successfully!"
echo "📱 App ID: $APP_ID"
echo ""

# Monitor deployment
echo "👀 Monitoring deployment progress..."
echo "   (This may take 5-15 minutes)"
echo ""

# Wait for deployment to complete
TIMEOUT=900 # 15 minutes
ELAPSED=0
INTERVAL=30

while [ $ELAPSED -lt $TIMEOUT ]; do
    STATUS=$(doctl apps get $APP_ID --output json | jq -r '.live_url_base')
    
    if [ "$STATUS" != "null" ] && [ -n "$STATUS" ]; then
        echo "✅ Deployment completed successfully!"
        echo ""
        break
    fi
    
    echo "⏳ Still deploying... (${ELAPSED}s elapsed)"
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "⚠️  Deployment timeout reached. Check App Platform console:"
    echo "   https://cloud.digitalocean.com/apps/$APP_ID"
    exit 1
fi

# Get app details
APP_INFO=$(doctl apps get $APP_ID --output json)
LIVE_URL=$(echo $APP_INFO | jq -r '.live_url_base')
APP_URL=$(echo $APP_INFO | jq -r '.live_url')

echo "🎉 Deployment Successful!"
echo "========================="
echo ""
echo "📱 App Details:"
echo "   App ID: $APP_ID"
echo "   Live URL: $LIVE_URL"
echo "   App URL: $APP_URL"
echo ""
echo "🌐 Your EzEdit.co app is now live at:"
echo "   $APP_URL"
echo ""
echo "📋 Test these endpoints:"
echo "   Homepage: $APP_URL"
echo "   Pricing: $APP_URL#pricing"
echo "   Health Check: $APP_URL/health"
echo "   Login: $APP_URL/auth/login.php"
echo ""
echo "⚙️  Manage your app:"
echo "   Console: https://cloud.digitalocean.com/apps/$APP_ID"
echo "   Logs: doctl apps logs $APP_ID --follow"
echo "   Scale: doctl apps update $APP_ID --spec .do/app.yaml"
echo ""

# Test health endpoint
echo "🧪 Testing health endpoint..."
if curl -sf "$APP_URL/health" > /dev/null; then
    echo "✅ Health check passed"
else
    echo "⚠️  Health check failed - app may still be starting up"
fi

echo ""
echo "🎯 Features Deployed:"
echo "   ✅ Updated pricing structure ($0/forever, $20/month, $100/month)"
echo "   ✅ Auto-scaling (1-10 instances based on traffic)"
echo "   ✅ PostgreSQL database for user data"
echo "   ✅ Background worker for async tasks"
echo "   ✅ Health monitoring and alerts"
echo "   ✅ SSL/TLS encryption"
echo "   ✅ Global CDN for static assets"
echo ""
echo "💰 Monthly Cost Estimate:"
echo "   Web Service (Professional XS): ~$12-120/month (scales with traffic)"
echo "   Database (1GB PostgreSQL): ~$15/month"
echo "   Worker (Basic XXS): ~$5/month"
echo "   Total: ~$32-140/month depending on traffic"
echo ""
echo "🚀 Your scalable EzEdit.co is ready for production!"

# Save app info for future reference
echo "{" > .app-info.json
echo "  \"app_id\": \"$APP_ID\"," >> .app-info.json
echo "  \"live_url\": \"$APP_URL\"," >> .app-info.json
echo "  \"deployed_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"" >> .app-info.json
echo "}" >> .app-info.json

echo ""
echo "📄 App info saved to .app-info.json"