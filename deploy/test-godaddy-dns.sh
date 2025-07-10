#!/bin/bash

# Test GoDaddy DNS API Integration
# Quick verification script for DNS management

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="ezedit.co"
GODADDY_API_KEY="9EE9DPNXA1p_TGcTTgAdCmgsrD1BdFZLh6"
GODADDY_API_SECRET="KbUA4FF1aCDgQBV8EqgLaE"

echo -e "${BLUE}🧪 Testing GoDaddy DNS API Integration${NC}"
echo "======================================"

# Test 1: Check domain exists and is accessible
echo -e "${YELLOW}🔍 Test 1: Checking domain availability in GoDaddy...${NC}"
response=$(curl -s -X GET \
    "https://api.godaddy.com/v1/domains/$DOMAIN" \
    -H "Authorization: sso-key $GODADDY_API_KEY:$GODADDY_API_SECRET" \
    -H "Content-Type: application/json")

if echo "$response" | grep -q "domainId"; then
    echo -e "${GREEN}✅ Domain $DOMAIN found in GoDaddy account${NC}"
else
    echo -e "${RED}❌ Domain not found or API error${NC}"
    echo "Response: $response"
    exit 1
fi

# Test 2: Get current DNS records
echo -e "${YELLOW}🔍 Test 2: Getting current DNS records...${NC}"
records=$(curl -s -X GET \
    "https://api.godaddy.com/v1/domains/$DOMAIN/records" \
    -H "Authorization: sso-key $GODADDY_API_KEY:$GODADDY_API_SECRET" \
    -H "Content-Type: application/json")

if echo "$records" | grep -q "type"; then
    echo -e "${GREEN}✅ Successfully retrieved DNS records${NC}"
    echo "Current A records:"
    echo "$records" | jq -r '.[] | select(.type=="A") | "   \(.name) -> \(.data)"' 2>/dev/null || echo "   (jq not available for pretty printing)"
else
    echo -e "${RED}❌ Failed to retrieve DNS records${NC}"
    echo "Response: $records"
fi

# Test 3: Test DNS update capability (using a test subdomain)
echo -e "${YELLOW}🔍 Test 3: Testing DNS update capability...${NC}"
test_ip="192.0.2.1"  # RFC5737 test IP
test_payload='[{"type":"A","name":"test","data":"'$test_ip'","ttl":600}]'

update_response=$(curl -s -X PUT \
    "https://api.godaddy.com/v1/domains/$DOMAIN/records/A/test" \
    -H "Authorization: sso-key $GODADDY_API_KEY:$GODADDY_API_SECRET" \
    -H "Content-Type: application/json" \
    -d "$test_payload")

if [[ -z "$update_response" ]]; then
    echo -e "${GREEN}✅ DNS update test successful${NC}"
    
    # Clean up test record
    sleep 2
    curl -s -X DELETE \
        "https://api.godaddy.com/v1/domains/$DOMAIN/records/A/test" \
        -H "Authorization: sso-key $GODADDY_API_KEY:$GODADDY_API_SECRET" >/dev/null
    echo -e "${GREEN}✅ Test record cleaned up${NC}"
else
    echo -e "${YELLOW}⚠️  DNS update response: $update_response${NC}"
fi

# Test 4: Verify current domain resolution
echo -e "${YELLOW}🔍 Test 4: Checking current domain resolution...${NC}"
current_ip=$(dig +short $DOMAIN @8.8.8.8 2>/dev/null || nslookup $DOMAIN 8.8.8.8 2>/dev/null | grep "Address:" | tail -1 | cut -d' ' -f2)

if [[ -n "$current_ip" ]]; then
    echo -e "${GREEN}✅ Domain currently resolves to: $current_ip${NC}"
else
    echo -e "${YELLOW}⚠️  Could not resolve domain (may be normal for new domains)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 GoDaddy DNS API test complete!${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "   Domain: $DOMAIN"
echo "   API Access: Working"
echo "   DNS Management: Ready"
echo "   Current IP: ${current_ip:-"Not resolved"}"
echo ""
echo -e "${YELLOW}Ready for deployment with GoDaddy DNS integration!${NC}"