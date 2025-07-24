#!/bin/bash

# EzEdit.co Deployment via DigitalOcean API
# This script uses the DigitalOcean API to deploy files

echo "🚀 EzEdit.co Deployment via DigitalOcean API"
echo "============================================"

# Set variables
DROPLET_ID="509389318"  # ezedit-mvp droplet ID
API_TOKEN="dop_v1_f5fb7c9657fa9470aec45e4f40907bf5fa41bdba0eab928704be54d2368995c4"
SERVER_IP="159.65.224.175"

# Create deployment script to run on the server
cat > /tmp/remote-deploy.sh << 'EOF'
#!/bin/bash
cd /var/www/html
echo "Backing up current files..."
mkdir -p /tmp/backup-$(date +%Y%m%d-%H%M%S)
cp -r * /tmp/backup-$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true

echo "Downloading deployment package..."
wget -O /tmp/ezedit-deploy.tar.gz "http://your-temporary-hosting-url/ezedit-production-deploy.tar.gz"

echo "Extracting files..."
tar -xzf /tmp/ezedit-deploy.tar.gz -C /var/www/html/

echo "Setting permissions..."
chown -R www-data:www-data /var/www/html/
find /var/www/html/ -type f -exec chmod 644 {} \;
find /var/www/html/ -type d -exec chmod 755 {} \;

echo "Restarting nginx..."
systemctl reload nginx

echo "Deployment complete!"
echo "Testing pages..."
curl -s -o /dev/null -w "index.php: %{http_code}\n" "http://localhost/index.php"
curl -s -o /dev/null -w "dashboard.php: %{http_code}\n" "http://localhost/dashboard.php"
curl -s -o /dev/null -w "editor.php: %{http_code}\n" "http://localhost/editor.php"
EOF

echo "📦 Deployment script created"
echo "🔄 Note: Manual steps required:"
echo ""
echo "1. Upload the deployment package (ezedit-production-deploy.tar.gz) to a temporary hosting location"
echo "2. Update the wget URL in the remote deployment script"
echo "3. Copy the script to the server and execute it"
echo ""
echo "Alternative: Use SSH to copy files directly:"
echo "scp -r public/* root@159.65.224.175:/var/www/html/"
echo ""
echo "Files ready for deployment:"
find "/mnt/c/STRICKLAND/Strickland Technology Marketing/ezedit.co/public" -type f

# Show the remote deployment script
echo ""
echo "📋 Remote deployment script (save as deploy-on-server.sh):"
echo "=================================================="
cat /tmp/remote-deploy.sh