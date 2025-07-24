# EzEdit.co Manual Deployment Guide

## Server Details
- **IP Address:** 159.65.224.175
- **Web Server:** nginx/1.18.0 (Ubuntu)
- **Document Root:** /var/www/html/
- **User:** root (DigitalOcean droplet)

## Files to Deploy
The following files from the `public/` directory need to be deployed:

### PHP Files
- `index.php` (Main landing page)
- `dashboard.php` (User dashboard)
- `editor.php` (Code editor)
- `auth/login.php` (Login page)
- `auth/register.php` (Registration page)

### CSS Files
- `css/main.css`
- `css/auth.css`
- `css/dashboard.css`
- `css/editor.css`

### JavaScript Files
- `js/main.js`

## Deployment Methods

### Method 1: Using SCP (Recommended)
```bash
# From your local machine with SSH access to the server
scp -r "/mnt/c/STRICKLAND/Strickland Technology Marketing/ezedit.co/public/"* root@159.65.224.175:/var/www/html/
```

### Method 2: Using rsync (Most Efficient)
```bash
# From your local machine with SSH access
rsync -avz --delete \
    "/mnt/c/STRICKLAND/Strickland Technology Marketing/ezedit.co/public/" \
    root@159.65.224.175:/var/www/html/ \
    --exclude '.DS_Store' \
    --exclude '*.log' \
    --exclude 'node_modules' \
    --exclude '.git'
```

### Method 3: Using the Provided Script
```bash
# Run the deployment script
bash "/mnt/c/STRICKLAND/Strickland Technology Marketing/ezedit.co/deploy-to-do.sh"
```

## Post-Deployment Testing

After deployment, test these URLs:
- http://159.65.224.175/index.php (Homepage)
- http://159.65.224.175/dashboard.php (Dashboard)
- http://159.65.224.175/editor.php (Editor)
- http://159.65.224.175/auth/login.php (Login)
- http://159.65.224.175/auth/register.php (Register)

## Directory Structure on Server
After deployment, the server should have:
```
/var/www/html/
├── index.php
├── dashboard.php
├── editor.php
├── auth/
│   ├── login.php
│   └── register.php
├── css/
│   ├── main.css
│   ├── auth.css
│   ├── dashboard.css
│   └── editor.css
└── js/
    └── main.js
```

## Server Configuration Notes
- The server is running nginx on Ubuntu
- PHP should be configured to serve .php files
- Ensure proper file permissions (644 for files, 755 for directories)
- The web root is `/var/www/html/`

## Troubleshooting
If pages don't load:
1. Check file permissions: `chmod 644 *.php && chmod 755 auth/ css/ js/`
2. Verify nginx configuration allows PHP processing
3. Check PHP-FPM is running: `systemctl status php-fpm`
4. Review nginx error logs: `tail -f /var/log/nginx/error.log`