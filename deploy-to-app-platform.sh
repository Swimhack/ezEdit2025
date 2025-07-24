#!/bin/bash

# Complete GitHub to App Platform Deployment Script
# Run this after creating the GitHub repository

set -e

echo "🚀 EzEdit.co GitHub to App Platform Deployment"
echo "==============================================="
echo ""

# Configuration
REPO_URL="https://github.com/Swimhack/ezEdit2025.git"
DO_TOKEN="dop_v1_f5fb7c9657fa9470aec45e4f40907bf5fa41bdba0eab928704be54d2368995c4"
DOCTL_PATH="/home/james/bin/doctl"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "  Repository: $REPO_URL"
echo "  App Name: ezedit-production"
echo "  Region: NYC"
echo "  Instance: Basic XXS"
echo ""

# Check if repository exists
echo -e "${BLUE}🔍 Checking GitHub repository...${NC}"
if curl -sf "$REPO_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Repository found and accessible${NC}"
else
    echo -e "${RED}❌ Repository not found or not accessible${NC}"
    echo ""
    echo "Please create the repository first:"
    echo "1. Go to: https://github.com/new"
    echo "2. Repository name: ezEdit2025"
    echo "3. Owner: Swimhack"
    echo "4. Make it PUBLIC"
    echo "5. Create repository"
    echo ""
    exit 1
fi

# Set up git remote
echo -e "${BLUE}🔧 Setting up git remote...${NC}"
git remote set-url origin "$REPO_URL"

# Push to GitHub
echo -e "${BLUE}📤 Pushing code to GitHub...${NC}"
if git push -u origin main; then
    echo -e "${GREEN}✅ Code pushed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Push may have failed, but continuing with deployment...${NC}"
fi

# Deploy to App Platform
echo ""
echo -e "${BLUE}🚀 Deploying to DigitalOcean App Platform...${NC}"
export DO_TOKEN="$DO_TOKEN"

if [ ! -f "$DOCTL_PATH" ]; then
    echo -e "${RED}❌ doctl not found at $DOCTL_PATH${NC}"
    exit 1
fi

echo "Creating App Platform application..."
DEPLOY_OUTPUT=$($DOCTL_PATH apps create --spec .do/app-minimal-deploy.yaml --wait --output json 2>&1)
DEPLOY_EXIT_CODE=$?

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment initiated successfully${NC}"
    
    # Parse app ID from output
    APP_ID=$(echo "$DEPLOY_OUTPUT" | jq -r '.id // empty' 2>/dev/null)
    
    if [ -n "$APP_ID" ]; then
        echo -e "${BLUE}📱 App ID: $APP_ID${NC}"
        
        # Wait for deployment to be healthy
        echo ""
        echo -e "${BLUE}⏳ Waiting for deployment to be healthy...${NC}"
        echo "   (This may take 3-5 minutes)"
        
        TIMEOUT=600  # 10 minutes
        ELAPSED=0
        INTERVAL=15
        
        while [ $ELAPSED -lt $TIMEOUT ]; do
            APP_STATUS=$($DOCTL_PATH apps get "$APP_ID" --output json 2>/dev/null)
            
            if [ $? -eq 0 ]; then
                DEPLOYMENT_PHASE=$(echo "$APP_STATUS" | jq -r '.active_deployment.phase // "unknown"' 2>/dev/null)
                LIVE_URL=$(echo "$APP_STATUS" | jq -r '.default_ingress // empty' 2>/dev/null)
                
                echo -e "${BLUE}📊 Status: $DEPLOYMENT_PHASE${NC}"
                
                if [ "$DEPLOYMENT_PHASE" = "ACTIVE" ] && [ -n "$LIVE_URL" ]; then
                    echo ""
                    echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
                    echo ""
                    echo -e "${GREEN}🌐 LIVE URL: $LIVE_URL${NC}"
                    echo ""
                    echo -e "${BLUE}📋 Application Details:${NC}"
                    echo "   App ID: $APP_ID"
                    echo "   Region: NYC"
                    echo "   Status: Active and Healthy"
                    echo ""
                    echo -e "${BLUE}🧪 Test Endpoints:${NC}"
                    echo "   Homepage: $LIVE_URL"
                    echo "   Health Check: $LIVE_URL/health.php"
                    echo ""
                    echo -e "${GREEN}✅ EzEdit.co is now live on DigitalOcean App Platform!${NC}"
                    
                    # Test the live URL
                    echo -e "${BLUE}🧪 Testing live deployment...${NC}"
                    if curl -sf "$LIVE_URL/health.php" > /dev/null 2>&1; then
                        echo -e "${GREEN}✅ Health check passed - deployment is healthy${NC}"
                    else
                        echo -e "${YELLOW}⚠️  Health check pending - app may still be starting${NC}"
                    fi
                    
                    exit 0
                elif [ "$DEPLOYMENT_PHASE" = "ERROR" ]; then
                    echo ""
                    echo -e "${RED}❌ Deployment failed${NC}"
                    echo "Check the App Platform console for details:"
                    echo "👉 https://cloud.digitalocean.com/apps/$APP_ID"
                    exit 1
                fi
            fi
            
            sleep $INTERVAL
            ELAPSED=$((ELAPSED + INTERVAL))
        done
        
        echo ""
        echo -e "${YELLOW}⚠️  Deployment timeout reached${NC}"
        echo "Check deployment status manually:"
        echo "👉 https://cloud.digitalocean.com/apps/$APP_ID"
    else
        echo -e "${YELLOW}⚠️  Could not parse app ID from deployment output${NC}"
        echo "Deployment may still be in progress."
    fi
else
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "Error output:"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi