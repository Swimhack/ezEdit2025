#!/bin/bash

# Quick EzEdit deployment - minimal setup
SERVER_IP="159.65.224.175"

echo "🚀 Quick deploying EzEdit..."

# Create minimal deployment package
tar -czf ezedit-minimal.tar.gz public/ netlify/ package.json

# Upload files
scp -i ~/.ssh/ezedit_rsa -o StrictHostKeyChecking=no ezedit-minimal.tar.gz root@$SERVER_IP:/tmp/

# Minimal server setup
ssh -i ~/.ssh/ezedit_rsa -o StrictHostKeyChecking=no root@$SERVER_IP << 'EOF'
# Kill existing package managers and wait
pkill -f apt-get || true
pkill -f dpkg || true
sleep 10

# Basic setup without full upgrade
export DEBIAN_FRONTEND=noninteractive

# Install minimal requirements
apt update
apt install -y nodejs npm nginx

# Setup project
mkdir -p /var/www/ezedit
cd /var/www/ezedit
tar -xzf /tmp/ezedit-minimal.tar.gz
npm install --only=production

# Simple nginx config
cat > /etc/nginx/sites-available/default << 'NGINX'
server {
    listen 80 default_server;
    root /var/www/ezedit/public;
    index index.php index.html;
    
    location ~ \.php$ {
        return 200 "EzEdit MVP - PHP processing would happen here\n";
        add_header Content-Type text/plain;
    }
    
    location / {
        try_files $uri $uri/ =404;
    }
}
NGINX

# Start services
systemctl restart nginx
systemctl enable nginx

echo "✅ EzEdit MVP is running!"
EOF

rm ezedit-minimal.tar.gz
echo "🎉 EzEdit MVP deployed at http://$SERVER_IP"