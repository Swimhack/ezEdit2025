#!/bin/bash

# EzEdit.co Domain and SSL Setup Script
# Configures custom domain and Let's Encrypt SSL certificates

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN="$1"
EMAIL="admin@${DOMAIN}"

if [[ -z "$DOMAIN" ]]; then
    echo "Usage: $0 <domain>"
    echo "Example: $0 ezedit.co"
    exit 1
fi

# Load deployment info
if [[ ! -f "deploy-info.txt" ]]; then
    echo -e "${RED}❌ deploy-info.txt not found. Run setup-digitalocean.sh first${NC}"
    exit 1
fi

DROPLET_IP=$(grep "Droplet IP:" deploy-info.txt | cut -d' ' -f3)
SSH_KEY_PATH=$(grep "SSH Key Key Path:" deploy-info.txt | cut -d' ' -f4)
PROJECT_DIR="/opt/ezedit"

echo -e "${BLUE}🌐 Setting up domain and SSL for EzEdit.co${NC}"
echo "=============================================="
echo -e "${BLUE}🏷️  Domain: $DOMAIN${NC}"
echo -e "${BLUE}📍 IP: $DROPLET_IP${NC}"

# Configure GoDaddy DNS
echo -e "${YELLOW}🔧 Configuring GoDaddy DNS...${NC}"

GODADDY_API_KEY="9EE9DPNXA1p_TGcTTgAdCmgsrD1BdFZLh6"
GODADDY_API_SECRET="KbUA4FF1aCDgQBV8EqgLaE"

# Function to update GoDaddy DNS record
update_godaddy_dns() {
    local record_type="$1"
    local record_name="$2"
    local record_data="$3"
    local ttl="${4:-600}"
    
    echo -e "${YELLOW}📝 Updating $record_type record: $record_name -> $record_data${NC}"
    
    # Create JSON payload
    local json_payload="[{\"type\":\"$record_type\",\"name\":\"$record_name\",\"data\":\"$record_data\",\"ttl\":$ttl}]"
    
    # Make API call to GoDaddy
    local response=$(curl -s -X PUT \
        "https://api.godaddy.com/v1/domains/$DOMAIN/records/$record_type/$record_name" \
        -H "Authorization: sso-key $GODADDY_API_KEY:$GODADDY_API_SECRET" \
        -H "Content-Type: application/json" \
        -d "$json_payload")
    
    if [[ -z "$response" ]]; then
        echo -e "${GREEN}✅ $record_type record updated successfully${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  $record_type record update response: $response${NC}"
        return 1
    fi
}

# Update DNS records via GoDaddy API
echo -e "${YELLOW}📝 Updating GoDaddy DNS records...${NC}"

# A record for root domain (@)
update_godaddy_dns "A" "@" "$DROPLET_IP" 600

# A record for www subdomain
update_godaddy_dns "A" "www" "$DROPLET_IP" 600

# A record for API subdomain (pointing to same IP)
update_godaddy_dns "A" "api" "$DROPLET_IP" 600

echo -e "${GREEN}✅ DNS records configured${NC}"

# Wait for DNS propagation
echo -e "${YELLOW}⏳ Waiting for DNS propagation...${NC}"
sleep 30

# Test DNS resolution
echo -e "${YELLOW}🔍 Testing DNS resolution...${NC}"
for attempt in {1..10}; do
    if nslookup "$DOMAIN" 8.8.8.8 | grep -q "$DROPLET_IP"; then
        echo -e "${GREEN}✅ DNS resolution working${NC}"
        break
    else
        echo -e "${YELLOW}⏳ Waiting for DNS... (attempt $attempt/10)${NC}"
        sleep 10
    fi
done

# Set up SSL certificates on server
echo -e "${YELLOW}🔒 Setting up SSL certificates...${NC}"
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no root@"$DROPLET_IP" << EOF
cd $PROJECT_DIR

# Install Certbot
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Stop nginx temporarily
docker-compose stop nginx-proxy || true

# Get SSL certificate
certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --domains $DOMAIN,www.$DOMAIN

# Copy certificates to project directory
mkdir -p ssl
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/cert.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/key.pem

# Set permissions
chmod 644 ssl/cert.pem
chmod 600 ssl/key.pem

# Update nginx configuration for SSL
cat > deploy/nginx-ssl.conf << 'NGINXCONF'
user appuser;
worker_processes auto;
pid /tmp/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    
    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
    
    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    
    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name $DOMAIN www.$DOMAIN;
        return 301 https://\$server_name\$request_uri;
    }
    
    # Main HTTPS server
    server {
        listen 443 ssl http2;
        server_name $DOMAIN www.$DOMAIN;
        root /app/public;
        index index.html index.php;
        
        # SSL Configuration
        ssl_certificate /app/ssl/cert.pem;
        ssl_certificate_key /app/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        
        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        
        # Health check
        location /health {
            access_log off;
            return 200 "healthy\\n";
            add_header Content-Type text/plain;
        }
        
        # Static files
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }
        
        # API endpoints
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }
        
        # FTP handler
        location /ftp/ {
            limit_req zone=api burst=10 nodelay;
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        # Default route
        location / {
            try_files \$uri \$uri/ /index.html;
        }
        
        # Block sensitive files
        location ~ /\\. {
            deny all;
            access_log off;
            log_not_found off;
        }
    }
}
NGINXCONF

# Update environment with domain
echo "DOMAIN=$DOMAIN" >> .env

# Restart services with new configuration
docker-compose up -d

# Wait for services to start
sleep 15

# Test HTTPS
echo "🧪 Testing HTTPS..."
if curl -f https://$DOMAIN/health >/dev/null 2>&1; then
    echo "✅ HTTPS is working"
else
    echo "❌ HTTPS test failed"
    docker-compose logs nginx-proxy
fi

# Set up automatic certificate renewal
echo "🔄 Setting up automatic SSL renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && cd $PROJECT_DIR && docker-compose restart nginx-proxy") | crontab -

echo "✅ SSL setup complete!"
EOF

echo -e "${GREEN}🎉 Domain and SSL setup complete!${NC}"
echo ""
echo -e "${BLUE}🌐 Your site is now available at:${NC}"
echo -e "${GREEN}   https://$DOMAIN${NC}"
echo -e "${GREEN}   https://www.$DOMAIN${NC}"
echo ""
echo -e "${YELLOW}DNS Records Updated:${NC}"
echo "   A    @    -> $DROPLET_IP"
echo "   A    www  -> $DROPLET_IP"  
echo "   A    api  -> $DROPLET_IP"

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test your site: https://$DOMAIN"
echo "2. Update any hardcoded URLs in your application"
echo "3. Set up monitoring and backups"
echo "4. Configure CDN if needed for global performance"
echo ""