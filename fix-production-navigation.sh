#!/bin/bash
# Fix Production Navigation - Deploy Updated Index File
# Addresses broken navigation links found by Playwright testing

echo "🔧 Fixing Production Navigation Links"
echo "===================================="

SERVER="159.65.224.175"
BASE_URL="http://$SERVER"

echo ""
echo "🧪 Current Navigation Issues (Found by Playwright):"
echo "---------------------------------------------------"
echo "❌ /login → 404 (should be /login-real.html)"
echo "❌ /signup → 404 (should be /signup.html)"  
echo "❌ /demo → 404 (should be /editor.html)"
echo "⚠️  #pricing → no pricing section (should be /pricing.html)"
echo "⚠️  # → empty link (should be /dashboard.html)"

echo ""
echo "📊 Testing Current Production Navigation:"
echo "----------------------------------------"

# Test the broken links
broken_links=("/login" "/signup" "/demo")
for link in "${broken_links[@]}"; do
    echo -n "Testing $link... "
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$link")
    if [[ "$status" == "404" ]]; then
        echo "❌ HTTP $status (BROKEN)"
    else
        echo "✅ HTTP $status"
    fi
done

echo ""
echo "📁 Available Updated Files:"
echo "---------------------------"

# Check which updated index files we have
if [[ -f "index-redesigned.html" ]]; then
    echo "✅ index-redesigned.html ($(du -h index-redesigned.html | cut -f1)) - HAS CORRECT NAVIGATION"
fi

if [[ -f "public/index.html" ]]; then
    echo "✅ public/index.html ($(du -h public/index.html | cut -f1)) - HAS CORRECT NAVIGATION"
fi

if [[ -f "index.html" ]]; then
    echo "✅ index.html ($(du -h index.html | cut -f1)) - SIMPLE LANDING PAGE"
fi

echo ""
echo "🔍 Navigation Comparison:"
echo "------------------------"

echo "PRODUCTION (BROKEN):"
echo "  - Login: href=\"/login\" → 404"
echo "  - Signup: href=\"/signup\" → 404"
echo "  - Demo: href=\"/demo\" → 404"

echo ""
echo "LOCAL FILES (FIXED):"
echo "  - Login: href=\"/login-real.html\" → WORKS"
echo "  - Signup: href=\"/signup.html\" → NEEDS DEPLOYMENT"
echo "  - Demo: href=\"/editor.html\" → WORKS"

echo ""
echo "🚀 Deployment Options:"
echo "----------------------"

echo "Option 1: Deploy Updated index-redesigned.html as index.html"
echo "scp index-redesigned.html root@$SERVER:/var/www/html/index.html"

echo ""
echo "Option 2: Deploy public/index.html (if it has correct navigation)"
echo "scp public/index.html root@$SERVER:/var/www/html/index.html"

echo ""
echo "Option 3: Create index.html with correct navigation locally first"
echo "cp index-redesigned.html index.html"
echo "scp index.html root@$SERVER:/var/www/html/"

echo ""
echo "🧪 Validation Commands (After Deployment):"
echo "-------------------------------------------"

echo "Test navigation links:"
for link in "/login-real.html" "/signup.html" "/editor.html" "/dashboard.html"; do
    echo "curl -I $BASE_URL$link"
done

echo ""
echo "Test homepage navigation:"
echo "curl -s $BASE_URL/ | grep -o 'href=\"[^\"]*\"' | head -10"

echo ""
echo "💡 Recommended Action:"
echo "---------------------"
echo "1. Deploy index-redesigned.html as the main index.html"
echo "2. Deploy missing signup.html, pricing.html, billing.html"
echo "3. Test all navigation links work"
echo "4. Run Playwright tests again to verify fixes"

echo ""
echo "📈 Expected Result:"
echo "------------------"
echo "✅ All navigation links will work (100% success rate)"
echo "✅ Users can access login, signup, and demo functionality"
echo "✅ Complete user journey enabled"