#!/bin/bash

# EzEdit.co Application Deployment Script
# Deploys the containerized application to DigitalOcean droplet

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Load deployment info
if [[ ! -f "deploy-info.txt" ]]; then
    echo -e "${RED}❌ deploy-info.txt not found. Run setup-digitalocean.sh first${NC}"
    exit 1
fi

DROPLET_IP=$(grep "Droplet IP:" deploy-info.txt | cut -d' ' -f3)
SSH_KEY_PATH=$(grep "SSH Key Path:" deploy-info.txt | cut -d' ' -f4)
PROJECT_DIR="/opt/ezedit"

echo -e "${BLUE}🚀 Deploying EzEdit.co Application${NC}"
echo "======================================="
echo -e "${BLUE}📍 Target: $DROPLET_IP${NC}"

# Create environment file
echo -e "${YELLOW}🔧 Creating environment configuration...${NC}"
cat > .env.production << EOF
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://natjhcqynqziccsnwim.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hdGpoY3F5bnF6aWNjc253aW1zdXBhYmFzZS5jbyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzMxNTA2NDE5LCJleHAiOjIwNDcwODI0MTl9.KnXShA8ELksWF7Lh0i6XXPnOPz2FuWqd-8-sIEFrkfM
CLAUDE_API_KEY=\${CLAUDE_API_KEY:-demo_key}
OPENAI_API_KEY=\${OPENAI_API_KEY:-demo_key}
ENCRYPTION_KEY=\$(openssl rand -base64 32)
DOMAIN=ezedit.co
REDIS_URL=redis://redis-cache:6379
EOF

# Build application image
echo -e "${YELLOW}🏗️  Building application Docker image...${NC}"
docker build -t ezedit-app:latest .

# Save image for transfer
echo -e "${YELLOW}📦 Preparing image for deployment...${NC}"
docker save ezedit-app:latest | gzip > ezedit-app.tar.gz

# Transfer files to server
echo -e "${YELLOW}📤 Transferring files to server...${NC}"
scp -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no \
    ezedit-app.tar.gz \
    docker-compose.yml \
    .env.production \
    deploy/nginx.conf \
    deploy/supervisord.conf \
    deploy/redis.conf \
    root@"$DROPLET_IP":"$PROJECT_DIR/"

# Transfer deployment scripts
scp -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no \
    deploy/setup-domain.sh \
    deploy/setup-monitoring.sh \
    deploy/health-check.sh \
    root@"$DROPLET_IP":"$PROJECT_DIR/"

# Deploy on server
echo -e "${YELLOW}🚀 Deploying application on server...${NC}"
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no root@"$DROPLET_IP" << EOF
cd $PROJECT_DIR

# Load Docker image
echo "📥 Loading Docker image..."
docker load < ezedit-app.tar.gz
rm ezedit-app.tar.gz

# Set up environment
cp .env.production .env

# Create required directories
mkdir -p logs/nginx ssl uploads backups temp

# Set permissions
chmod +x *.sh

# Stop any existing containers
docker-compose down --remove-orphans || true

# Start services
echo "🚀 Starting EzEdit.co services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
docker-compose ps

# Test application endpoint
echo "🧪 Testing application..."
if curl -f http://localhost/health >/dev/null 2>&1; then
    echo "✅ Application is responding"
else
    echo "❌ Application health check failed"
    docker-compose logs --tail=50
    exit 1
fi

# Show logs
echo "📋 Recent logs:"
docker-compose logs --tail=20

echo "✅ Deployment complete!"
EOF

# Clean up local files
rm -f ezedit-app.tar.gz .env.production

# Test external connectivity
echo -e "${YELLOW}🌐 Testing external connectivity...${NC}"
sleep 10

if curl -f "http://$DROPLET_IP/health" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Application is accessible externally${NC}"
else
    echo -e "${RED}❌ External connectivity test failed${NC}"
    echo "This might be normal if firewall rules are still being applied"
fi

echo ""
echo -e "${GREEN}🎉 EzEdit.co deployment complete!${NC}"
echo -e "${BLUE}🌐 Application URL: http://$DROPLET_IP${NC}"
echo -e "${BLUE}📊 Monitoring: http://$DROPLET_IP:9100${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Run ./deploy/setup-domain.sh to configure SSL and custom domain"
echo "2. Run ./deploy/setup-monitoring.sh for enhanced monitoring"
echo "3. Test the application thoroughly"
echo "4. Set up automated backups"
echo ""