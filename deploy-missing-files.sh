#!/bin/bash
# EzEdit.co Deployment Script
# Run this on your server to deploy missing files

echo "🚀 Deploying EzEdit.co missing files..."

# Files to copy to web root
FILES=(
    "signup.html"
    "pricing.html" 
    "billing.html"
    "checkout-demo.html"
    "index.html"
)

# Copy files
for file in "${FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "📤 Deploying $file..."
        cp "$file" /var/www/html/
        chmod 644 "/var/www/html/$file"
    else
        echo "❌ Missing: $file"
    fi
done

# Copy directories
if [[ -d "public/auth" ]]; then
    echo "📤 Deploying auth endpoints..."
    cp -r public/auth /var/www/html/
    chmod -R 644 /var/www/html/auth/*
fi

if [[ -d "public/api" ]]; then
    echo "📤 Deploying API endpoints..."
    cp -r public/api /var/www/html/
    chmod -R 644 /var/www/html/api/*
fi

if [[ -f "public/.htaccess" ]]; then
    echo "📤 Deploying .htaccess..."
    cp public/.htaccess /var/www/html/
    chmod 644 /var/www/html/.htaccess
fi

echo "✅ Deployment complete!"
echo "🧪 Test URLs:"
echo "   http://$(hostname -I | awk '{print $1}')/signup.html"
echo "   http://$(hostname -I | awk '{print $1}')/pricing.html"
echo "   http://$(hostname -I | awk '{print $1}')/billing.html"
