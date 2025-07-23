#!/bin/bash
# Deploy Missing Revenue Pages - Fixes Pricing Page Issues
# This script addresses the root cause: missing files on production server

echo "🚀 EzEdit.co - Deploying Missing Revenue Pages"
echo "=============================================="

SERVER="159.65.224.175"
WEB_ROOT="/var/www/html"

# Critical revenue pages that are missing from production
MISSING_PAGES=(
    "pricing.html"
    "signup.html" 
    "billing.html"
    "checkout-demo.html"
)

echo ""
echo "📊 Pre-Deployment Status Check:"
echo "--------------------------------"

for page in "${MISSING_PAGES[@]}"; do
    echo -n "Testing $page on production... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER/$page")
    
    if [[ "$status" == "200" ]]; then
        echo "✅ WORKING (HTTP $status)"
    elif [[ "$status" == "404" ]]; then
        echo "❌ NOT FOUND (HTTP $status)"
    else
        echo "⚠️  ISSUE (HTTP $status)"
    fi
done

echo ""
echo "📁 Local File Verification:"
echo "---------------------------"

total_size=0
for page in "${MISSING_PAGES[@]}"; do
    if [[ -f "$page" ]]; then
        size=$(du -h "$page" | cut -f1)
        total_size=$((total_size + $(du -k "$page" | cut -f1)))
        echo "✅ $page ($size) - Ready for deployment"
    else
        echo "❌ $page - FILE MISSING LOCALLY"
    fi
done

echo ""
echo "📦 Deployment Size: ${total_size}KB total"

echo ""
echo "🔧 Deployment Commands:"
echo "----------------------"
echo "Choose your deployment method:"
echo ""

echo "Option 1: SCP Upload (Recommended if you have SSH key)"
for page in "${MISSING_PAGES[@]}"; do
    if [[ -f "$page" ]]; then
        echo "scp '$page' root@$SERVER:$WEB_ROOT/"
    fi
done

echo ""
echo "Option 2: FTP Upload"
echo "Use any FTP client with these commands:"
for page in "${MISSING_PAGES[@]}"; do
    if [[ -f "$page" ]]; then
        echo "PUT '$page' -> /$page"
    fi
done

echo ""
echo "Option 3: Git Pull (if git repo exists on server)"
echo "ssh root@$SERVER 'cd $WEB_ROOT && git pull origin feat/ftp-mvp'"

echo ""
echo "Option 4: Manual Copy (if running on server)"
for page in "${MISSING_PAGES[@]}"; do
    if [[ -f "$page" ]]; then
        echo "cp '$page' $WEB_ROOT/ && chmod 644 $WEB_ROOT/$page"
    fi
done

echo ""
echo "🧪 Post-Deployment Validation:"
echo "------------------------------"
echo "Run these commands to verify deployment:"
echo ""

for page in "${MISSING_PAGES[@]}"; do
    echo "curl -I http://$SERVER/$page"
done

echo ""
echo "Expected result: HTTP/1.1 200 OK for all pages"

echo ""
echo "💰 Business Impact:"
echo "------------------"
echo "Once deployed, these pages will enable:"
echo "✅ User registration and trials (signup.html)"
echo "✅ Revenue generation (pricing.html)"  
echo "✅ Subscription management (billing.html)"
echo "✅ Complete customer journey (checkout-demo.html)"

echo ""
echo "🎯 Total Revenue Impact: UNLIMITED (enables full SaaS functionality)"
echo ""
echo "Deploy now to start generating revenue! 🚀"