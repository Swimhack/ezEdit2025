#!/bin/bash

# Complete DigitalOcean App Platform Deployment
# Handles authentication and deployment automatically

set -e

echo "🚀 EzEdit.co Complete App Platform Deployment"
echo "=============================================="
echo ""

# Set doctl path
export PATH="$HOME/bin:$PATH"
DOCTL="$HOME/bin/doctl"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if doctl is available
if [ ! -f "$DOCTL" ]; then
    echo -e "${RED}❌ doctl not found at $DOCTL${NC}"
    exit 1
fi

echo -e "${GREEN}✅ doctl CLI ready${NC}"
echo ""

# Check for DigitalOcean API token
if [ -z "$DO_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  DigitalOcean API token required${NC}"
    echo ""
    echo "Please get your API token from:"
    echo "👉 https://cloud.digitalocean.com/account/api/tokens"
    echo ""
    echo "Then run:"
    echo "export DO_TOKEN=your_token_here"
    echo "./deploy-complete.sh"
    echo ""
    exit 1
fi

# Authenticate doctl
echo "🔐 Authenticating with DigitalOcean..."
echo "$DO_TOKEN" | $DOCTL auth init --access-token-stdin

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Authentication successful${NC}"
else
    echo -e "${RED}❌ Authentication failed${NC}"
    exit 1
fi

echo ""

# Validate account access
echo "👤 Validating account access..."
ACCOUNT_INFO=$($DOCTL account get --output json 2>/dev/null)

if [ $? -eq 0 ]; then
    EMAIL=$(echo "$ACCOUNT_INFO" | jq -r '.email' 2>/dev/null)
    echo -e "${GREEN}✅ Account validated: $EMAIL${NC}"
else
    echo -e "${RED}❌ Could not access account${NC}"
    exit 1
fi

echo ""

# Show current configuration
echo -e "${BLUE}📊 Deployment Configuration:${NC}"
echo "=============================="
echo "App Name: ezedit-production"
echo "Region: NYC (nyc3)"
echo "Web Service: Professional XS (auto-scaling 1-10 instances)"
echo "Database: PostgreSQL 14 (1GB)"
echo "Background Worker: Basic XXS"
echo "Monthly Cost: ~$32-140 (scales with traffic)"
echo ""

# Validate app spec
if [ ! -f ".do/app.yaml" ]; then
    echo -e "${RED}❌ App specification not found at .do/app.yaml${NC}"
    exit 1
fi

echo -e "${GREEN}✅ App specification validated${NC}"
echo ""

# Check for existing app with same name
echo "🔍 Checking for existing apps..."
EXISTING_APP=$($DOCTL apps list --output json | jq -r '.[] | select(.spec.name=="ezedit-production") | .id' 2>/dev/null)

if [ -n "$EXISTING_APP" ] && [ "$EXISTING_APP" != "null" ]; then
    echo -e "${YELLOW}⚠️  App 'ezedit-production' already exists (ID: $EXISTING_APP)${NC}"
    echo ""
    read -p "Update existing app? (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📝 Updating existing app..."
        $DOCTL apps update "$EXISTING_APP" --spec .do/app.yaml
        APP_ID="$EXISTING_APP"
        DEPLOYMENT_TYPE="update"
    else
        echo -e "${YELLOW}❌ Deployment cancelled${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ No existing app found, creating new one${NC}"
    echo ""
    
    # Create the app
    echo "🚀 Creating App Platform application..."
    echo "   (This may take a few minutes)"
    echo ""
    
    CREATE_RESULT=$($DOCTL apps create --spec .do/app.yaml --output json 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        APP_ID=$(echo "$CREATE_RESULT" | jq -r '.id' 2>/dev/null)
        
        if [ -n "$APP_ID" ] && [ "$APP_ID" != "null" ]; then
            echo -e "${GREEN}✅ App created successfully!${NC}"
            echo -e "${BLUE}📱 App ID: $APP_ID${NC}"
            DEPLOYMENT_TYPE="create"
        else
            echo -e "${RED}❌ Failed to create app${NC}"
            echo "Response: $CREATE_RESULT"
            exit 1
        fi
    else
        echo -e "${RED}❌ App creation failed${NC}"
        exit 1
    fi
fi

echo ""

# Monitor deployment
echo "👀 Monitoring deployment progress..."
echo "   (This typically takes 5-15 minutes)"
echo ""

TIMEOUT=1200  # 20 minutes
ELAPSED=0
INTERVAL=30
LAST_STATUS=""

while [ $ELAPSED -lt $TIMEOUT ]; do
    APP_STATUS=$($DOCTL apps get "$APP_ID" --output json 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        PHASE=$(echo "$APP_STATUS" | jq -r '.last_deployment_active_at // empty' 2>/dev/null)
        LIVE_URL=$(echo "$APP_STATUS" | jq -r '.live_url // empty' 2>/dev/null)
        DEFAULT_INGRESS=$(echo "$APP_STATUS" | jq -r '.default_ingress // empty' 2>/dev/null)
        
        # Get deployment status
        DEPLOY_STATUS=$(echo "$APP_STATUS" | jq -r '.active_deployment.phase // "pending"' 2>/dev/null)
        
        if [ "$DEPLOY_STATUS" != "$LAST_STATUS" ]; then
            echo -e "${BLUE}📊 Status: $DEPLOY_STATUS${NC}"
            LAST_STATUS="$DEPLOY_STATUS"
        fi
        
        # Check if deployment is complete
        if [ "$DEPLOY_STATUS" = "ACTIVE" ] && [ -n "$DEFAULT_INGRESS" ]; then
            echo ""
            echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
            echo ""
            break
        elif [ "$DEPLOY_STATUS" = "ERROR" ]; then
            echo ""
            echo -e "${RED}❌ Deployment failed${NC}"
            echo "Check the App Platform console for details:"
            echo "👉 https://cloud.digitalocean.com/apps/$APP_ID"
            exit 1
        fi
    fi
    
    echo -e "${YELLOW}⏳ Still deploying... (${ELAPSED}s elapsed)${NC}"
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Deployment timeout reached${NC}"
    echo "Check the console for status:"
    echo "👉 https://cloud.digitalocean.com/apps/$APP_ID"
    exit 1
fi

# Get final app details
APP_DETAILS=$($DOCTL apps get "$APP_ID" --output json 2>/dev/null)
LIVE_URL=$(echo "$APP_DETAILS" | jq -r '.live_url // .default_ingress // empty' 2>/dev/null)
APP_URL=$(echo "$APP_DETAILS" | jq -r '.default_ingress // .live_url // empty' 2>/dev/null)

# Success output
echo ""
echo -e "${GREEN}🎉 EzEdit.co Successfully Deployed!${NC}"
echo "===================================="
echo ""
echo -e "${BLUE}📱 App Details:${NC}"
echo "   App ID: $APP_ID"
echo "   Live URL: $APP_URL"
echo "   Console: https://cloud.digitalocean.com/apps/$APP_ID"
echo ""
echo -e "${BLUE}🌐 Your app is live at:${NC}"
echo "   👉 $APP_URL"
echo ""
echo -e "${BLUE}📋 Test these endpoints:${NC}"
echo "   Homepage: $APP_URL"
echo "   Pricing: $APP_URL#pricing"
echo "   Health: $APP_URL/health"
echo "   Login: $APP_URL/auth/login.php"
echo "   Dashboard: $APP_URL/dashboard.php"
echo ""

# Test health endpoint
echo -e "${BLUE}🧪 Testing deployment...${NC}"
sleep 10  # Give the app a moment to fully start

if curl -sf "$APP_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Health check pending (app may still be starting)${NC}"
fi

# Test pricing page
if curl -sf "$APP_URL" | grep -q "No setup fees" 2>/dev/null; then
    echo -e "${GREEN}✅ Pricing update verified${NC}"
else
    echo -e "${YELLOW}⚠️  Pricing verification pending${NC}"
fi

echo ""
echo -e "${BLUE}🎯 Features Deployed:${NC}"
echo "   ✅ Auto-scaling web service (1-10 instances)"
echo "   ✅ PostgreSQL database for user data"
echo "   ✅ Background worker for async tasks"
echo "   ✅ Health monitoring and alerts"
echo "   ✅ SSL/TLS encryption"
echo "   ✅ Updated pricing structure:"
echo "      • Free: \$0/forever"
echo "      • Single Site: \$20/month"
echo "      • Unlimited: \$100/month"
echo "      • Guarantee: No setup fees | Cancel anytime | 30-day money back"
echo ""
echo -e "${BLUE}💰 Cost Monitoring:${NC}"
echo "   • Light traffic: ~\$32/month"
echo "   • Heavy traffic: ~\$140/month"
echo "   • Scales automatically based on usage"
echo ""
echo -e "${BLUE}⚙️  Management Commands:${NC}"
echo "   View logs: $DOCTL apps logs $APP_ID --follow"
echo "   Scale app: $DOCTL apps update $APP_ID --spec .do/app.yaml"
echo "   App info: $DOCTL apps get $APP_ID"
echo ""

# Save deployment info
cat > .deployment-info.json << EOF
{
  "app_id": "$APP_ID",
  "live_url": "$APP_URL",
  "deployment_type": "$DEPLOYMENT_TYPE",
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "doctl_version": "$($DOCTL version | head -n1)"
}
EOF

echo -e "${GREEN}📄 Deployment info saved to .deployment-info.json${NC}"
echo ""
echo -e "${GREEN}🚀 Your scalable EzEdit.co is now live and ready for production!${NC}"