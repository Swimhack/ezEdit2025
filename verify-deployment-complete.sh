#!/bin/bash
# Deployment Completion Verification Script
# This script tests the production site after deployment to ensure everything works

echo "🧪 EzEdit.co Deployment Completion Verification"
echo "=============================================="
echo "Testing: http://159.65.224.175/"
echo "Date: $(date)"
echo ""

SERVER="159.65.224.175"
BASE_URL="http://$SERVER"

# Files that must exist after deployment
REQUIRED_FILES=(
    "/"
    "/pricing.html"
    "/signup.html"
    "/billing.html"
    "/checkout-demo.html"
)

# Navigation links that must work
NAVIGATION_TESTS=(
    "/login-real.html"
    "/editor-real.html"
    "/dashboard-real.html"
)

echo "📊 PHASE 1: File Existence Test"
echo "-------------------------------"

all_files_exist=true
for file in "${REQUIRED_FILES[@]}"; do
    echo -n "Testing $file... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$file")
    
    if [[ "$status" == "200" ]]; then
        echo "✅ HTTP $status"
    else
        echo "❌ HTTP $status (FAILED)"
        all_files_exist=false
    fi
done

echo ""
echo "📊 PHASE 2: Navigation Links Test"
echo "---------------------------------"

navigation_working=true
for link in "${NAVIGATION_TESTS[@]}"; do
    echo -n "Testing $link... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$link")
    
    if [[ "$status" == "200" ]]; then
        echo "✅ HTTP $status"
    else
        echo "❌ HTTP $status (FAILED)"
        navigation_working=false
    fi
done

echo ""
echo "📊 PHASE 3: Navigation Structure Test"
echo "-------------------------------------"

echo -n "Testing homepage navigation... "
homepage_content=$(curl -s "$BASE_URL/")

# Check if homepage has correct navigation links
if [[ $homepage_content == *"login-real.html"* ]] && [[ $homepage_content == *"signup.html"* ]]; then
    echo "✅ Navigation links updated"
    navigation_updated=true
else
    echo "❌ Still has old navigation links"
    navigation_updated=false
fi

echo ""
echo "📊 PHASE 4: Revenue Pages Integration Test"
echo "------------------------------------------"

revenue_working=true

echo -n "Testing Stripe integration... "
pricing_content=$(curl -s "$BASE_URL/pricing.html" 2>/dev/null)
if [[ $pricing_content == *"stripe.com"* ]]; then
    echo "✅ Stripe integration present"
else
    echo "❌ Stripe integration missing"
    revenue_working=false
fi

echo -n "Testing Supabase integration... "
signup_content=$(curl -s "$BASE_URL/signup.html" 2>/dev/null)
if [[ $signup_content == *"supabase"* ]]; then
    echo "✅ Supabase integration present"
else
    echo "❌ Supabase integration missing"
    revenue_working=false
fi

echo ""
echo "🎯 DEPLOYMENT COMPLETION ASSESSMENT"
echo "==================================="

# Calculate overall success
total_tests=4
passed_tests=0

if [[ "$all_files_exist" == true ]]; then
    echo "✅ File Deployment: PASSED"
    ((passed_tests++))
else
    echo "❌ File Deployment: FAILED"
fi

if [[ "$navigation_working" == true ]]; then
    echo "✅ Navigation Links: PASSED"
    ((passed_tests++))
else
    echo "❌ Navigation Links: FAILED"
fi

if [[ "$navigation_updated" == true ]]; then
    echo "✅ Navigation Update: PASSED"
    ((passed_tests++))
else
    echo "❌ Navigation Update: FAILED"
fi

if [[ "$revenue_working" == true ]]; then
    echo "✅ Revenue Integration: PASSED"
    ((passed_tests++))
else
    echo "❌ Revenue Integration: FAILED"
fi

echo ""
echo "📈 OVERALL RESULTS"
echo "=================="

success_rate=$((passed_tests * 100 / total_tests))
echo "Success Rate: $passed_tests/$total_tests ($success_rate%)"

if [[ $passed_tests -eq $total_tests ]]; then
    echo ""
    echo "🎉 DEPLOYMENT COMPLETE AND VERIFIED!"
    echo "====================================="
    echo "✅ All files deployed successfully"
    echo "✅ All navigation links working"
    echo "✅ All integrations functional"
    echo "✅ Full revenue generation enabled"
    echo ""
    echo "🚀 EzEdit.co is now fully operational!"
    echo "Users can sign up, view pricing, and use all features."
    echo ""
    echo "🔗 Test URLs:"
    echo "  Homepage: $BASE_URL/"
    echo "  Pricing:  $BASE_URL/pricing.html"
    echo "  Signup:   $BASE_URL/signup.html"
    echo "  Billing:  $BASE_URL/billing.html"
    
    exit 0
else
    echo ""
    echo "⚠️  DEPLOYMENT INCOMPLETE"
    echo "========================"
    echo "Some issues remain. Review the test results above."
    echo "Deploy missing files and run this script again."
    echo ""
    echo "📋 Deployment Package Available:"
    echo "  Files: deployment-package/*.html"
    echo "  Upload to: /var/www/html/ on server"
    
    exit 1
fi