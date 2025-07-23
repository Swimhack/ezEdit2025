#!/bin/bash
# Deploy missing files that are causing 404 errors
# Run this on your production server to fix the 404 issues

echo "🚀 Deploying files to fix 404 errors..."

SERVER="159.65.224.175"
WEB_ROOT="/var/www/html"

# Files that need to be deployed to fix 404s
MISSING_FILES=(
    "signup.html"
    "pricing.html" 
    "billing.html"
    "checkout-demo.html"
    "index.html"
)

echo "📁 Files to deploy:"
for file in "${MISSING_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        size=$(du -h "$file" | cut -f1)
        echo "  ✅ $file ($size)"
    else
        echo "  ❌ $file (MISSING)"
    fi
done

echo ""
echo "🔧 Deployment commands:"
echo "# Option 1: SCP Upload (if you have SSH access)"
for file in "${MISSING_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "scp '$file' root@$SERVER:$WEB_ROOT/"
    fi
done

echo ""
echo "# Option 2: Git Pull (if git is set up on server)"
echo "ssh root@$SERVER 'cd $WEB_ROOT && git pull origin feat/ftp-mvp'"

echo ""
echo "# Option 3: Manual copy commands (if running on server)"
for file in "${MISSING_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "cp '$file' $WEB_ROOT/"
    fi
done

echo ""
echo "🧪 Test commands after deployment:"
echo "curl -I http://$SERVER/signup.html"
echo "curl -I http://$SERVER/pricing.html"
echo "curl -I http://$SERVER/billing.html"

echo ""
echo "✅ Run any of the above options to fix 404 errors"