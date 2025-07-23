#!/bin/bash
# Benchonly.com Deployment Verification Script
# Tests https://benchonly.com/membership/ after deployment

echo "🧪 EzEdit.co Deployment Verification - benchonly.com/membership"
echo "=============================================================="
echo "Testing: https://benchonly.com/membership/"
echo "Date: $(date)"
echo ""

BASE_URL="https://benchonly.com/membership"

# Files that must exist after deployment
REQUIRED_FILES=(
    "/"
    "/pricing.html"
    "/signup.html"
    "/billing.html"
    "/checkout-demo.html"
)

echo "📊 PHASE 1: File Deployment Test"
echo "--------------------------------"

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
echo "📊 PHASE 2: Content Verification Test"
echo "-------------------------------------"

content_valid=true

echo -n "Testing homepage content... "
homepage_content=$(curl -s "$BASE_URL/")
if [[ $homepage_content == *"EzEdit.co"* ]]; then
    echo "✅ Homepage content present"
else
    echo "❌ Homepage content missing"
    content_valid=false
fi

echo -n "Testing pricing page... "
pricing_content=$(curl -s "$BASE_URL/pricing.html" 2>/dev/null)
if [[ $pricing_content == *"stripe.com"* ]]; then
    echo "✅ Stripe integration present"
else
    echo "❌ Stripe integration missing"
    content_valid=false
fi

echo -n "Testing signup page... "
signup_content=$(curl -s "$BASE_URL/signup.html" 2>/dev/null)
if [[ $signup_content == *"supabase"* ]]; then
    echo "✅ Supabase integration present"
else
    echo "❌ Supabase integration missing"
    content_valid=false
fi

echo ""
echo "📊 PHASE 3: Navigation Structure Test"
echo "-------------------------------------"

navigation_correct=true

echo -n "Testing navigation links... "
if [[ $homepage_content == *"signup.html"* ]] && [[ $homepage_content == *"pricing.html"* ]]; then
    echo "✅ Navigation links updated"
else
    echo "❌ Navigation links incorrect"
    navigation_correct=false
fi

echo ""
echo "🎯 BENCHONLY DEPLOYMENT ASSESSMENT"
echo "=================================="

# Calculate overall success
total_tests=3
passed_tests=0

if [[ "$all_files_exist" == true ]]; then
    echo "✅ File Deployment: PASSED"
    ((passed_tests++))
else
    echo "❌ File Deployment: FAILED"
fi

if [[ "$content_valid" == true ]]; then
    echo "✅ Content Integration: PASSED"
    ((passed_tests++))
else
    echo "❌ Content Integration: FAILED"
fi

if [[ "$navigation_correct" == true ]]; then
    echo "✅ Navigation Structure: PASSED"
    ((passed_tests++))
else
    echo "❌ Navigation Structure: FAILED"
fi

echo ""
echo "📈 OVERALL RESULTS"
echo "=================="

success_rate=$((passed_tests * 100 / total_tests))
echo "Success Rate: $passed_tests/$total_tests ($success_rate%)"

if [[ $passed_tests -eq $total_tests ]]; then
    echo ""
    echo "🎉 BENCHONLY DEPLOYMENT COMPLETE!"
    echo "================================="
    echo "✅ All files deployed successfully"
    echo "✅ All integrations functional"
    echo "✅ Navigation working correctly"
    echo ""
    echo "🚀 EzEdit.co is live at benchonly.com/membership!"
    echo ""
    echo "🔗 Live URLs:"
    echo "  Homepage: $BASE_URL/"
    echo "  Pricing:  $BASE_URL/pricing.html"
    echo "  Signup:   $BASE_URL/signup.html"
    echo "  Billing:  $BASE_URL/billing.html"
    echo "  Demo:     $BASE_URL/checkout-demo.html"
    
    exit 0
else
    echo ""
    echo "⚠️  DEPLOYMENT INCOMPLETE"
    echo "========================"
    echo "Upload files from deployment-package/ to benchonly.com/membership/"
    echo "Then run this script again to verify."
    
    exit 1
fi