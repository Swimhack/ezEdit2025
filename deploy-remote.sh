#!/bin/bash
cd /var/www/html

# Backup current files
echo "Creating backup..."
mkdir -p /backup/$(date +%Y%m%d_%H%M%S)
cp -r * /backup/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true

# Extract new files
echo "Extracting deployment..."
tar -xzf /tmp/ezedit-deploy.tar.gz --strip-components=1
rm -f /tmp/ezedit-deploy.tar.gz

# Set permissions
echo "Setting permissions..."
chown -R www-data:www-data /var/www/html
find /var/www/html -type f -exec chmod 644 {} \;
find /var/www/html -type d -exec chmod 755 {} \;

# Reload nginx
echo "Reloading nginx..."
systemctl reload nginx

# Test deployment
echo "Testing deployment..."
curl -s -o /dev/null -w "index.php: %{http_code}\n" "http://localhost/index.php"
curl -s -o /dev/null -w "dashboard.php: %{http_code}\n" "http://localhost/dashboard.php"
curl -s -o /dev/null -w "editor.php: %{http_code}\n" "http://localhost/editor.php"
curl -s -o /dev/null -w "login.php: %{http_code}\n" "http://localhost/auth/login.php"
curl -s -o /dev/null -w "health.php: %{http_code}\n" "http://localhost/health.php"

echo "Deployment complete!"
