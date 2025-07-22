#!/bin/bash

# EzEdit.co DigitalOcean Deployment Script - Fixed Version
SERVER_IP="159.65.224.175"
SERVER_USER="root"

echo "🚀 Deploying EzEdit MVP to DigitalOcean (Fixed)..."

# Create deployment package
tar -czf ezedit-deploy.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=*.log \
  --exclude=ezedit-deploy.tar.gz \
  --exclude=doctl* \
  --exclude=credentials.md \
  .

# Upload to server
scp -i ~/.ssh/ezedit_rsa -o StrictHostKeyChecking=no ezedit-deploy.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

# Execute fixed deployment
ssh -i ~/.ssh/ezedit_rsa -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
set -e

# Wait for apt to be available
sleep 30
while pgrep apt > /dev/null; do sleep 5; done

# Update system
export DEBIAN_FRONTEND=noninteractive
apt update
apt upgrade -y

# Install Node.js first
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install other packages
apt install -y nginx php8.1 php8.1-fpm php8.1-curl php8.1-mbstring php8.1-xml php8.1-zip php8.1-pgsql redis-server certbot python3-certbot-nginx

# Create project directory and extract files
mkdir -p /var/www/ezedit-co
cd /var/www/ezedit-co
tar -xzf /tmp/ezedit-deploy.tar.gz
chown -R www-data:www-data /var/www/ezedit-co
chmod -R 755 /var/www/ezedit-co

# Install npm dependencies
npm install --production

# Install PM2
npm install -g pm2

# Configure Nginx
cat > /etc/nginx/sites-available/ezedit-co << 'NGINX_END'
server {
    listen 80;
    server_name ezedit.co www.ezedit.co 159.65.224.175;
    root /var/www/ezedit-co/public;
    index index.php index.html;

    # Handle PHP files
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
    }

    # API routes to Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
}
NGINX_END

# Enable site
ln -sf /etc/nginx/sites-available/ezedit-co /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
nginx -t && systemctl reload nginx

# Create environment file
cat > /var/www/ezedit-co/.env << 'ENV_END'
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://sctsykgcfkhadowygcrj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdHN5a2djZmtoYWRvd3lnY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1OTE5MDUsImV4cCI6MjA2NzE2NzkwNX0.8cpoEx0MXO0kkTqDrpkbYRhXQHVQ0bmjHA0xI2rUWqY
ANTHROPIC_API_KEY=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
ENV_END

chmod 600 /var/www/ezedit-co/.env

# Start Node.js app with PM2
cd /var/www/ezedit-co
pm2 start netlify/functions/server.js --name ezedit-api
pm2 startup
pm2 save

# Enable services
systemctl enable nginx php8.1-fmp redis-server
systemctl start nginx php8.1-fmp redis-server

echo "✅ Deployment successful!"
echo "🌐 EzEdit MVP: http://159.65.224.175"

EOF

rm ezedit-deploy.tar.gz
echo "🎉 EzEdit MVP is now live!"