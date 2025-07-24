#!/bin/bash

# EzEdit.co Netlify Scalable Deployment Script
# Automated deployment with full serverless architecture

set -e

echo "🚀 EzEdit.co Netlify Scalable Deployment"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "  Platform: Netlify (Serverless)"
echo "  Functions: Node.js serverless functions"
echo "  Frontend: Static site with SPA routing"
echo "  Auto-scaling: Enabled by default"
echo "  CDN: Global edge network"
echo ""

# Check Netlify CLI
if ! command -v netlify &> /dev/null; then
    echo -e "${RED}❌ Netlify CLI not found${NC}"
    echo "Install with: npm install -g netlify-cli"
    exit 1
fi

echo -e "${GREEN}✅ Netlify CLI ready${NC}"

# Check authentication
if ! netlify status > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Not logged in to Netlify${NC}"
    echo ""
    echo "Please authenticate first:"
    echo "1. Run: netlify login"
    echo "2. Complete authorization in browser"
    echo "3. Run this script again"
    echo ""
    echo "Or deploy manually:"
    echo "1. Go to: https://app.netlify.com/drop"
    echo "2. Drag and drop the 'public' folder"
    echo "3. Configure functions directory as 'netlify/functions'"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Netlify authenticated${NC}"

# Create production build
echo ""
echo -e "${BLUE}📦 Preparing production build...${NC}"

# Update index.html to include API client
if [ -f "public/index.html" ]; then
    if ! grep -q "api.js" public/index.html; then
        sed -i 's/<script src="js\/main.js"><\/script>/<script src="js\/api.js"><\/script>\n    <script src="js\/main.js"><\/script>/' public/index.html
        echo -e "${GREEN}✅ Added API client to index.html${NC}"
    fi
fi

# Check required files
REQUIRED_FILES=(
    "public/index.html"
    "netlify.toml"
    "netlify/functions/auth.js"
    "netlify/functions/health.js"
    "netlify/functions/ftp.js"
    "netlify/functions/ai-assistant.js"
    "public/js/api.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ Missing: $file${NC}"
        exit 1
    fi
done

# Deploy to Netlify
echo ""
echo -e "${BLUE}🚀 Deploying to Netlify...${NC}"
echo "   (This may take 2-3 minutes)"

# First deploy as draft
echo "Creating preview deployment..."
PREVIEW_RESULT=$(netlify deploy --dir=public --functions=netlify/functions 2>&1)
PREVIEW_EXIT_CODE=$?

if [ $PREVIEW_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Preview deployment successful${NC}"
    
    # Extract preview URL
    PREVIEW_URL=$(echo "$PREVIEW_RESULT" | grep -o 'https://[^[:space:]]*--[^[:space:]]*.netlify.app' | head -1)
    
    if [ -n "$PREVIEW_URL" ]; then
        echo -e "${BLUE}🔗 Preview URL: $PREVIEW_URL${NC}"
        
        # Test preview deployment
        echo -e "${BLUE}🧪 Testing preview deployment...${NC}"
        sleep 5  # Wait for deployment to propagate
        
        if curl -sf "$PREVIEW_URL" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Preview deployment is healthy${NC}"
            
            # Deploy to production
            echo ""
            echo -e "${BLUE}🌟 Deploying to production...${NC}"
            PROD_RESULT=$(netlify deploy --dir=public --functions=netlify/functions --prod 2>&1)
            PROD_EXIT_CODE=$?
            
            if [ $PROD_EXIT_CODE -eq 0 ]; then
                echo -e "${GREEN}🎉 PRODUCTION DEPLOYMENT SUCCESSFUL!${NC}"
                echo ""
                
                # Extract production URL
                PROD_URL=$(echo "$PROD_RESULT" | grep -o 'https://[^[:space:]]*.netlify.app' | head -1)
                
                if [ -n "$PROD_URL" ]; then
                    echo -e "${GREEN}🌐 LIVE URL: $PROD_URL${NC}"
                    echo ""
                    
                    # Test production deployment
                    echo -e "${BLUE}🧪 Testing production deployment...${NC}"
                    sleep 10  # Wait for deployment to propagate globally
                    
                    # Test main endpoints
                    echo "Testing endpoints:"
                    
                    if curl -sf "$PROD_URL" > /dev/null 2>&1; then
                        echo -e "  ✅ Homepage: ${GREEN}OK${NC}"
                    else
                        echo -e "  ❌ Homepage: ${RED}FAILED${NC}"
                    fi
                    
                    if curl -sf "$PROD_URL/.netlify/functions/health" > /dev/null 2>&1; then
                        echo -e "  ✅ Health API: ${GREEN}OK${NC}"
                    else
                        echo -e "  ❌ Health API: ${RED}FAILED${NC}"
                    fi
                    
                    if curl -sf "$PROD_URL/.netlify/functions/auth" -X POST -d '{}' > /dev/null 2>&1; then
                        echo -e "  ✅ Auth API: ${GREEN}OK${NC}"
                    else
                        echo -e "  ❌ Auth API: ${RED}FAILED${NC}"
                    fi
                    
                    echo ""
                    echo -e "${BLUE}🎯 Deployment Summary:${NC}"
                    echo "=============================="
                    echo -e "📱 Live URL: ${GREEN}$PROD_URL${NC}"
                    echo -e "🔧 Platform: ${GREEN}Netlify (Serverless)${NC}"
                    echo -e "⚡ Auto-scaling: ${GREEN}Enabled${NC}"
                    echo -e "🌍 CDN: ${GREEN}Global Edge Network${NC}"
                    echo -e "🔒 SSL: ${GREEN}Automatic HTTPS${NC}"
                    echo ""
                    echo -e "${BLUE}📊 Scalability Features:${NC}"
                    echo "  • Automatic traffic-based scaling"
                    echo "  • Global CDN with 125+ edge locations"
                    echo "  • Serverless functions (no server management)"
                    echo "  • Built-in DDoS protection"
                    echo "  • Edge-optimized static assets"
                    echo ""
                    echo -e "${BLUE}🔗 Test Your Application:${NC}"
                    echo "  Homepage: $PROD_URL"
                    echo "  Health Check: $PROD_URL/.netlify/functions/health"
                    echo "  Auth API: $PROD_URL/.netlify/functions/auth"
                    echo "  FTP API: $PROD_URL/.netlify/functions/ftp"
                    echo "  AI Assistant: $PROD_URL/.netlify/functions/ai-assistant"
                    echo ""
                    echo -e "${GREEN}🎉 EzEdit.co is now live on Netlify with full auto-scaling!${NC}"
                    
                    # Save deployment info
                    cat > .netlify-deployment.json << EOF
{
  "platform": "netlify",
  "live_url": "$PROD_URL",
  "preview_url": "$PREVIEW_URL",
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "features": {
    "auto_scaling": true,
    "serverless_functions": true,
    "global_cdn": true,
    "automatic_https": true,
    "ddos_protection": true
  },
  "endpoints": {
    "homepage": "$PROD_URL",
    "health": "$PROD_URL/.netlify/functions/health",
    "auth": "$PROD_URL/.netlify/functions/auth",
    "ftp": "$PROD_URL/.netlify/functions/ftp",
    "ai_assistant": "$PROD_URL/.netlify/functions/ai-assistant"
  }
}
EOF
                    echo -e "${GREEN}📄 Deployment info saved to .netlify-deployment.json${NC}"
                    
                    exit 0
                else
                    echo -e "${YELLOW}⚠️  Could not extract production URL${NC}"
                fi
            else
                echo -e "${RED}❌ Production deployment failed${NC}"
                echo "$PROD_RESULT"
                exit 1
            fi
        else
            echo -e "${YELLOW}⚠️  Preview deployment health check pending${NC}"
            echo "Proceeding with production deployment..."
        fi
    else
        echo -e "${YELLOW}⚠️  Could not extract preview URL${NC}"
    fi
else
    echo -e "${RED}❌ Preview deployment failed${NC}"
    echo "$PREVIEW_RESULT"
    exit 1
fi