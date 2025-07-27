# EzEdit.co Manual Deployment Instructions

## Quick Deployment Steps for DigitalOcean

Since SSH key access is not configured, follow these manual steps to deploy:

### Method 1: DigitalOcean Web Console (Recommended)

1. **Access your droplet console:**
   - Go to https://cloud.digitalocean.com/droplets
   - Click on your droplet "ezedit-mvp" (ID: 509389318)
   - Click "Console" button to open web terminal

2. **In the console, run these commands:**

```bash
# Navigate to web directory
cd /var/www/html

# Create backup
mkdir -p /backup/$(date +%Y%m%d_%H%M%S)
cp -r * /backup/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true

# Create deployment script
cat > deploy.sh << 'EOF'
#!/bin/bash
# Download and extract the deployment package
cd /var/www/html
wget -O ezedit-deploy.tar.gz "YOUR_UPLOAD_URL_HERE"
tar -xzf ezedit-deploy.tar.gz
rm ezedit-deploy.tar.gz

# Set permissions
chown -R www-data:www-data /var/www/html
find /var/www/html -type f -exec chmod 644 {} \;
find /var/www/html -type d -exec chmod 755 {} \;

# Reload nginx
systemctl reload nginx

echo "Deployment complete!"
EOF

chmod +x deploy.sh
```

3. **Upload your files** (you'll need to host the tar.gz file temporarily)

### Method 2: Direct File Upload via Console

1. Access the console as above
2. For each file, create it directly:

```bash
# Example for index.php
cat > /var/www/html/index.php << 'EOF'
[PASTE FILE CONTENT HERE]
EOF
```

### Method 3: Configure SSH Access

To enable easy future deployments:

1. Generate SSH key locally (if you don't have one):
```bash
ssh-keygen -t rsa -b 4096
```

2. Add your public key to the droplet:
   - Go to https://cloud.digitalocean.com/account/security
   - Add your SSH key
   - Or paste it directly in the console:
   ```bash
   echo "YOUR_PUBLIC_KEY" >> ~/.ssh/authorized_keys
   ```

## Current Application Structure

Your application files are ready in the `public/` directory:
- `index.php` - Homepage with features/pricing
- `dashboard.php` - FTP site management
- `editor.php` - Three-pane code editor
- `auth/` - Authentication system
- `css/` - Stylesheets
- `js/` - JavaScript files
- `config/` - Configuration files
- `api/` - API endpoints

## Post-Deployment Checklist

1. ✅ Verify all pages load correctly:
   - http://159.65.224.175/index.php
   - http://159.65.224.175/dashboard.php
   - http://159.65.224.175/editor.php
   - http://159.65.224.175/auth/login.php

2. ✅ Check permissions are correct
3. ✅ Verify nginx is serving PHP files
4. ✅ Test user registration and login
5. ✅ Confirm FTP functionality works

## Alternative: Package for Upload

I can create a deployment package for you: