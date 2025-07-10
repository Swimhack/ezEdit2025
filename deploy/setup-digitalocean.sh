#!/bin/bash

# EzEdit.co DigitalOcean Deployment Setup Script
# This script sets up the complete infrastructure for EzEdit.co on DigitalOcean

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DO_API_TOKEN="dop_v1_f5fb7c9657fa9470aec45e4f40907bf5fa41bdba0eab928704be54d2368995c4"
DROPLET_NAME="ezedit-prod"
DROPLET_SIZE="s-1vcpu-512mb-10gb"  # $4/month droplet
DROPLET_IMAGE="docker-20-04"       # Ubuntu 20.04 with Docker pre-installed
REGION="nyc1"                       # New York datacenter
DOMAIN="ezedit.co"
PROJECT_DIR="/opt/ezedit"

echo -e "${BLUE}🚀 EzEdit.co DigitalOcean Deployment Setup${NC}"
echo "=========================================="

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo -e "${YELLOW}📥 Installing doctl CLI...${NC}"
    
    # Detect OS and architecture
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)
    
    if [[ "$ARCH" == "x86_64" ]]; then
        ARCH="amd64"
    elif [[ "$ARCH" == "aarch64" ]] || [[ "$ARCH" == "arm64" ]]; then
        ARCH="arm64"
    fi
    
    DOCTL_VERSION="1.131.0"
    DOCTL_URL="https://github.com/digitalocean/doctl/releases/download/v${DOCTL_VERSION}/doctl-${DOCTL_VERSION}-${OS}-${ARCH}.tar.gz"
    
    # Download and install doctl
    curl -sL "$DOCTL_URL" | tar -xz
    sudo mv doctl /usr/local/bin/
    
    echo -e "${GREEN}✅ doctl installed successfully${NC}"
else
    echo -e "${GREEN}✅ doctl already installed${NC}"
fi

# Configure doctl with API token
echo -e "${YELLOW}🔑 Configuring doctl with API token...${NC}"
echo "$DO_API_TOKEN" | doctl auth init --access-token-stdin

# Verify authentication
echo -e "${YELLOW}🔍 Verifying DigitalOcean authentication...${NC}"
if doctl account get >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Authentication successful${NC}"
    ACCOUNT_EMAIL=$(doctl account get --format Email --no-header)
    echo -e "${BLUE}📧 Account: $ACCOUNT_EMAIL${NC}"
else
    echo -e "${RED}❌ Authentication failed${NC}"
    exit 1
fi

# Check if SSH key exists, if not create one
echo -e "${YELLOW}🔐 Setting up SSH keys...${NC}"
SSH_KEY_NAME="ezedit-deploy-key"
SSH_KEY_PATH="$HOME/.ssh/ezedit_deploy"

if [[ ! -f "$SSH_KEY_PATH" ]]; then
    echo -e "${YELLOW}🔧 Creating new SSH key...${NC}"
    ssh-keygen -t rsa -b 4096 -f "$SSH_KEY_PATH" -N "" -C "ezedit-deploy@$(hostname)"
    
    # Add SSH key to DigitalOcean
    doctl compute ssh-key import "$SSH_KEY_NAME" --public-key-file "${SSH_KEY_PATH}.pub"
    echo -e "${GREEN}✅ SSH key created and uploaded${NC}"
else
    echo -e "${GREEN}✅ SSH key already exists${NC}"
fi

# Get SSH key ID
SSH_KEY_ID=$(doctl compute ssh-key list --format ID,Name --no-header | grep "$SSH_KEY_NAME" | cut -d' ' -f1)

# Check if droplet already exists
echo -e "${YELLOW}🔍 Checking if droplet exists...${NC}"
if doctl compute droplet list --format Name --no-header | grep -q "^$DROPLET_NAME$"; then
    echo -e "${YELLOW}⚠️  Droplet $DROPLET_NAME already exists${NC}"
    DROPLET_IP=$(doctl compute droplet list --format Name,PublicIPv4 --no-header | grep "^$DROPLET_NAME" | awk '{print $2}')
    echo -e "${BLUE}📍 Existing droplet IP: $DROPLET_IP${NC}"
else
    # Create droplet
    echo -e "${YELLOW}🏗️  Creating DigitalOcean droplet...${NC}"
    echo -e "${BLUE}   Name: $DROPLET_NAME${NC}"
    echo -e "${BLUE}   Size: $DROPLET_SIZE ($4/month)${NC}"
    echo -e "${BLUE}   Image: $DROPLET_IMAGE${NC}"
    echo -e "${BLUE}   Region: $REGION${NC}"
    
    doctl compute droplet create "$DROPLET_NAME" \
        --size "$DROPLET_SIZE" \
        --image "$DROPLET_IMAGE" \
        --region "$REGION" \
        --ssh-keys "$SSH_KEY_ID" \
        --wait
    
    # Get droplet IP
    DROPLET_IP=$(doctl compute droplet list --format Name,PublicIPv4 --no-header | grep "^$DROPLET_NAME" | awk '{print $2}')
    echo -e "${GREEN}✅ Droplet created successfully${NC}"
    echo -e "${BLUE}📍 Droplet IP: $DROPLET_IP${NC}"
    
    # Wait for droplet to be ready
    echo -e "${YELLOW}⏳ Waiting for droplet to be ready...${NC}"
    sleep 30
fi

# Test SSH connection
echo -e "${YELLOW}🔗 Testing SSH connection...${NC}"
ssh_attempts=0
max_attempts=10

while [ $ssh_attempts -lt $max_attempts ]; do
    if ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@"$DROPLET_IP" "echo 'SSH connection successful'" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ SSH connection established${NC}"
        break
    else
        ssh_attempts=$((ssh_attempts + 1))
        echo -e "${YELLOW}⏳ Waiting for SSH (attempt $ssh_attempts/$max_attempts)...${NC}"
        sleep 10
    fi
done

if [ $ssh_attempts -eq $max_attempts ]; then
    echo -e "${RED}❌ SSH connection failed after $max_attempts attempts${NC}"
    exit 1
fi

# Set up firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
FIREWALL_NAME="ezedit-firewall"

# Check if firewall exists
if ! doctl compute firewall list --format Name --no-header | grep -q "^$FIREWALL_NAME$"; then
    # Create firewall
    doctl compute firewall create \
        --name "$FIREWALL_NAME" \
        --inbound-rules "protocol:tcp,ports:22,sources:addresses:0.0.0.0/0,sources:addresses:::/0" \
        --inbound-rules "protocol:tcp,ports:80,sources:addresses:0.0.0.0/0,sources:addresses:::/0" \
        --inbound-rules "protocol:tcp,ports:443,sources:addresses:0.0.0.0/0,sources:addresses:::/0" \
        --outbound-rules "protocol:tcp,ports:all,destinations:addresses:0.0.0.0/0,destinations:addresses:::/0" \
        --outbound-rules "protocol:udp,ports:all,destinations:addresses:0.0.0.0/0,destinations:addresses:::/0"
    
    echo -e "${GREEN}✅ Firewall created${NC}"
else
    echo -e "${GREEN}✅ Firewall already exists${NC}"
fi

# Apply firewall to droplet
DROPLET_ID=$(doctl compute droplet list --format ID,Name --no-header | grep "$DROPLET_NAME" | cut -d' ' -f1)
doctl compute firewall add-droplets "$FIREWALL_NAME" --droplet-ids "$DROPLET_ID"

# Create deployment directory on server
echo -e "${YELLOW}📁 Creating deployment directory on server...${NC}"
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no root@"$DROPLET_IP" << EOF
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Update system
apt-get update -y
apt-get upgrade -y

# Install additional tools
apt-get install -y curl wget git htop nano tree jq

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Verify Docker installation
docker --version
docker-compose --version

echo "✅ Server setup complete"
EOF

echo -e "${GREEN}✅ Server configuration complete${NC}"

# Save deployment information
echo -e "${YELLOW}📄 Saving deployment information...${NC}"
cat > deploy-info.txt << EOF
EzEdit.co Deployment Information
================================
Droplet Name: $DROPLET_NAME
Droplet IP: $DROPLET_IP
Droplet ID: $DROPLET_ID
SSH Key Path: $SSH_KEY_PATH
Project Directory: $PROJECT_DIR
Region: $REGION
Size: $DROPLET_SIZE ($4/month)

SSH Command:
ssh -i $SSH_KEY_PATH root@$DROPLET_IP

Next Steps:
1. Run ./deploy-ezedit.sh to deploy the application
2. Run ./setup-domain.sh to configure domain and SSL
3. Run ./setup-monitoring.sh for monitoring and backups
EOF

echo -e "${GREEN}✅ Deployment information saved to deploy-info.txt${NC}"

echo ""
echo -e "${GREEN}🎉 DigitalOcean infrastructure setup complete!${NC}"
echo -e "${BLUE}📍 Droplet IP: $DROPLET_IP${NC}"
echo -e "${BLUE}💰 Monthly cost: \$4 (perfect for 1000+ users)${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Run ./deploy-ezedit.sh to deploy your application"
echo "2. Run ./setup-domain.sh to configure domain and SSL"
echo "3. Visit http://$DROPLET_IP to test your deployment"
echo ""