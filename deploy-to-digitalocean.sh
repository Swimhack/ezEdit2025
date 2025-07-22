#!/bin/bash

# EzEdit.co DigitalOcean Deployment Script
# Deploys the MVP to a fresh Ubuntu 22.04 droplet

SERVER_IP="159.65.224.175"
SERVER_USER="root"
PROJECT_NAME="ezedit-co"
DOMAIN="ezedit.co"

echo "🚀 Deploying EzEdit MVP to DigitalOcean..."

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf ezedit-deploy.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=*.log \
  --exclude=ezedit-deploy.tar.gz \
  --exclude=doctl* \
  --exclude=credentials.md \
  .

# Upload to server
echo "⬆️  Uploading files to server..."
scp -i ~/.ssh/ezedit_rsa -o StrictHostKeyChecking=no ezedit-deploy.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

# Execute deployment on server
echo "🔧 Configuring server..."
ssh -i ~/.ssh/ezedit_rsa -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y nginx php8.1 php8.1-fpm php8.1-curl php8.1-json php8.1-mbstring php8.1-xml php8.1-zip php8.1-pgsql nodejs npm certbot python3-certbot-nginx redis-server

# Create project directory
mkdir -p /var/www/ezedit-co
cd /var/www/ezedit-co

# Extract project files
tar -xzf /tmp/ezedit-deploy.tar.gz -C /var/www/ezedit-co
chown -R www-data:www-data /var/www/ezedit-co
chmod -R 755 /var/www/ezedit-co

# Install Node.js dependencies
npm install --production

# Configure Nginx
cat > /etc/nginx/sites-available/ezedit-co << 'NGINX_CONFIG'
server {
    listen 80;
    server_name ezedit.co www.ezedit.co 159.65.224.175;
    root /var/www/ezedit-co/public;
    index index.php index.html index.htm;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'; frame-ancestors 'self';" always;

    # Handle PHP files
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fmp.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # API routes
    location /api/ {
        try_files $uri $uri/ @nodejs;
    }

    location @nodejs {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Default location
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Security
    location ~ /\.ht {
        deny all;
    }
}
NGINX_CONFIG

# Enable site
ln -sf /etc/nginx/sites-available/ezedit-co /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Configure PHP-FPM
sed -i 's/;cgi.fix_pathinfo=1/cgi.fix_pathinfo=0/' /etc/php/8.1/fpm/php.ini
systemctl restart php8.1-fpm

# Start Node.js app with PM2
npm install -g pm2
cd /var/www/ezedit-co
cat > ecosystem.config.js << 'PM2_CONFIG'
module.exports = {
  apps: [{
    name: 'ezedit-api',
    script: 'netlify/functions/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
PM2_CONFIG

pm2 start ecosystem.config.js
pm2 startup
pm2 save

# Configure environment variables
cat > /var/www/ezedit-co/.env << 'ENV_CONFIG'
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://sctsykgcfkhadowygcrj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdHN5a2djZmtoYWRvd3lnY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1OTE5MDUsImV4cCI6MjA2NzE2NzkwNX0.8cpoEx0MXO0kkTqDrpkbYRhXQHVQ0bmjHA0xI2rUWqY
ANTHROPIC_API_KEY=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
OPENAI_API_KEY=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
ENV_CONFIG

chmod 600 /var/www/ezedit-co/.env

# Enable and start services
systemctl enable nginx php8.1-fpm redis-server
systemctl start nginx php8.1-fpm redis-server

echo "✅ Server configuration complete!"
echo "🌐 EzEdit MVP is now accessible at: http://159.65.224.175"
echo "📝 Next step: Point ezedit.co domain to this IP address"

EOF

# Clean up
rm ezedit-deploy.tar.gz

echo "🎉 Deployment complete! Your EzEdit MVP is live at http://159.65.224.175"
echo "💡 To set up SSL certificate, run: ssh -i ~/.ssh/ezedit_rsa root@159.65.224.175 'certbot --nginx -d ezedit.co -d www.ezedit.co'"