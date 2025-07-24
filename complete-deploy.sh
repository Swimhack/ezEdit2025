
# Complete EzEdit.co Deployment Script
# Run this on the droplet console

echo "🚀 Deploying EzEdit.co complete package..."

# Create web directory if not exists
sudo mkdir -p /var/www/html

# Download and extract files (if you have the tar.gz uploaded)
# sudo tar -xzf ~/ezedit-deployment.tar.gz -C /
# sudo mv /public_html/* /var/www/html/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
sudo find /var/www/html -name "*.php" -exec chmod 644 {} \;

# Restart web server
sudo systemctl restart nginx

echo "✅ Deployment complete!"
echo "🌐 Test at: http://159.65.224.175"
