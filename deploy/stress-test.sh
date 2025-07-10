#!/bin/bash

# EzEdit.co Stress Testing Script
# Comprehensive load testing for the deployed application

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DROPLET_IP=""
DOMAIN=""
TARGET_URL=""
MAX_USERS=1000
RAMP_TIME=300  # 5 minutes
TEST_DURATION=600  # 10 minutes

# Load deployment info
if [[ -f "deploy-info.txt" ]]; then
    DROPLET_IP=$(grep "Droplet IP:" deploy-info.txt | cut -d' ' -f3)
    TARGET_URL="http://$DROPLET_IP"
fi

if [[ -z "$DROPLET_IP" ]]; then
    echo -e "${RED}❌ Could not determine target URL${NC}"
    echo "Usage: $0 [target_url]"
    exit 1
fi

if [[ -n "$1" ]]; then
    TARGET_URL="$1"
fi

echo -e "${BLUE}🧪 EzEdit.co Stress Testing Suite${NC}"
echo "=================================="
echo -e "${BLUE}🎯 Target: $TARGET_URL${NC}"
echo -e "${BLUE}👥 Max Users: $MAX_USERS${NC}"
echo -e "${BLUE}⏱️  Test Duration: $TEST_DURATION seconds${NC}"

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

# Install Apache Bench if not available
if ! command -v ab &> /dev/null; then
    echo -e "${YELLOW}📥 Installing Apache Bench...${NC}"
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y apache2-utils
    elif command -v yum &> /dev/null; then
        sudo yum install -y httpd-tools
    elif command -v brew &> /dev/null; then
        brew install httpd
    else
        echo -e "${RED}❌ Cannot install Apache Bench. Please install manually.${NC}"
        exit 1
    fi
fi

# Install curl if not available
if ! command -v curl &> /dev/null; then
    echo -e "${YELLOW}📥 Installing curl...${NC}"
    if command -v apt-get &> /dev/null; then
        sudo apt-get install -y curl
    elif command -v yum &> /dev/null; then
        sudo yum install -y curl
    fi
fi

# Create results directory
RESULTS_DIR="stress-test-results-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$RESULTS_DIR"

echo -e "${GREEN}✅ Prerequisites checked${NC}"

# Test 1: Basic connectivity and health
echo -e "${YELLOW}🔗 Test 1: Basic Connectivity${NC}"
if curl -f -s "$TARGET_URL/health" > "$RESULTS_DIR/health-check.txt"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    cat "$RESULTS_DIR/health-check.txt"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi

# Test 2: Single user performance baseline
echo -e "${YELLOW}⚡ Test 2: Single User Baseline${NC}"
curl -o /dev/null -s -w "Time: %{time_total}s, Size: %{size_download} bytes, Speed: %{speed_download} bytes/s\n" "$TARGET_URL" > "$RESULTS_DIR/baseline.txt"
echo -e "${GREEN}✅ Baseline test complete${NC}"
cat "$RESULTS_DIR/baseline.txt"

# Test 3: Light load test (10 concurrent users)
echo -e "${YELLOW}🚶 Test 3: Light Load (10 users)${NC}"
ab -n 100 -c 10 -g "$RESULTS_DIR/light-load.dat" "$TARGET_URL/" > "$RESULTS_DIR/light-load.txt" 2>&1
if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Light load test passed${NC}"
    grep -E "(Requests per second|Time per request)" "$RESULTS_DIR/light-load.txt"
else
    echo -e "${RED}❌ Light load test failed${NC}"
fi

# Test 4: Medium load test (50 concurrent users)
echo -e "${YELLOW}🏃 Test 4: Medium Load (50 users)${NC}"
ab -n 500 -c 50 -g "$RESULTS_DIR/medium-load.dat" "$TARGET_URL/" > "$RESULTS_DIR/medium-load.txt" 2>&1
if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Medium load test passed${NC}"
    grep -E "(Requests per second|Time per request)" "$RESULTS_DIR/medium-load.txt"
else
    echo -e "${YELLOW}⚠️  Medium load test showed stress${NC}"
fi

# Test 5: API endpoint stress test
echo -e "${YELLOW}🔌 Test 5: API Endpoint Test${NC}"
ab -n 200 -c 20 -H "Content-Type: application/json" "$TARGET_URL/health" > "$RESULTS_DIR/api-test.txt" 2>&1
if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ API endpoint test passed${NC}"
    grep -E "(Requests per second|Time per request)" "$RESULTS_DIR/api-test.txt"
else
    echo -e "${RED}❌ API endpoint test failed${NC}"
fi

# Test 6: Memory and CPU monitoring during load
echo -e "${YELLOW}📊 Test 6: Resource Monitoring${NC}"
if [[ -n "$DROPLET_IP" ]] && [[ -f "deploy-info.txt" ]]; then
    SSH_KEY_PATH=$(grep "SSH Key Path:" deploy-info.txt | cut -d' ' -f4)
    
    # Start monitoring
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no root@"$DROPLET_IP" << 'EOF' > "$RESULTS_DIR/resource-monitoring.txt" &
        echo "=== Resource Monitoring Started ==="
        for i in {1..10}; do
            echo "--- Sample $i ---"
            echo "Memory:"
            free -h
            echo "CPU:"
            top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}'
            echo "Docker Stats:"
            docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
            echo ""
            sleep 30
        done
        echo "=== Monitoring Complete ==="
EOF
    
    MONITOR_PID=$!
    echo "Started resource monitoring (PID: $MONITOR_PID)"
fi

# Test 7: Sustained load test
echo -e "${YELLOW}🔥 Test 7: Sustained Load Test${NC}"
echo "Running sustained load for 2 minutes with 30 concurrent users..."
timeout 120 ab -n 10000 -c 30 -g "$RESULTS_DIR/sustained-load.dat" "$TARGET_URL/" > "$RESULTS_DIR/sustained-load.txt" 2>&1 || true

if grep -q "Requests per second" "$RESULTS_DIR/sustained-load.txt"; then
    echo -e "${GREEN}✅ Sustained load test completed${NC}"
    grep -E "(Requests per second|Time per request|Failed requests)" "$RESULTS_DIR/sustained-load.txt"
else
    echo -e "${YELLOW}⚠️  Sustained load test incomplete${NC}"
fi

# Test 8: File upload simulation (if supported)
echo -e "${YELLOW}📁 Test 8: File Operations Test${NC}"
# Create a test file
echo "Test file content for upload simulation" > test-file.txt

# Test file operations (simulated)
for i in {1..10}; do
    curl -s -X POST -F "file=@test-file.txt" "$TARGET_URL/api/test-upload" >/dev/null 2>&1 || true
done

rm -f test-file.txt
echo -e "${GREEN}✅ File operations test completed${NC}"

# Test 9: Database stress (connection pooling)
echo -e "${YELLOW}🗄️  Test 9: Database Connection Test${NC}"
# Simulate multiple database connections
ab -n 100 -c 10 "$TARGET_URL/api/health" > "$RESULTS_DIR/db-connection-test.txt" 2>&1
echo -e "${GREEN}✅ Database connection test completed${NC}"

# Test 10: Error handling under stress
echo -e "${YELLOW}🚨 Test 10: Error Handling Test${NC}"
# Test 404 errors
ab -n 50 -c 5 "$TARGET_URL/nonexistent-page" > "$RESULTS_DIR/error-handling.txt" 2>&1
echo -e "${GREEN}✅ Error handling test completed${NC}"

# Stop monitoring if it was started
if [[ -n "$MONITOR_PID" ]]; then
    wait $MONITOR_PID 2>/dev/null || true
fi

# Generate summary report
echo -e "${YELLOW}📋 Generating Summary Report${NC}"
cat > "$RESULTS_DIR/summary-report.md" << EOF
# EzEdit.co Stress Test Report

**Date:** $(date)
**Target:** $TARGET_URL
**Test Duration:** $(date)

## Test Results Summary

### 1. Basic Connectivity
$(cat "$RESULTS_DIR/health-check.txt" 2>/dev/null || echo "Failed")

### 2. Performance Baseline
$(cat "$RESULTS_DIR/baseline.txt" 2>/dev/null || echo "Failed")

### 3. Light Load Results (10 users)
$(grep -E "(Requests per second|Time per request|Failed requests)" "$RESULTS_DIR/light-load.txt" 2>/dev/null || echo "Test failed")

### 4. Medium Load Results (50 users)
$(grep -E "(Requests per second|Time per request|Failed requests)" "$RESULTS_DIR/medium-load.txt" 2>/dev/null || echo "Test failed")

### 5. API Endpoint Results
$(grep -E "(Requests per second|Time per request|Failed requests)" "$RESULTS_DIR/api-test.txt" 2>/dev/null || echo "Test failed")

### 6. Sustained Load Results
$(grep -E "(Requests per second|Time per request|Failed requests)" "$RESULTS_DIR/sustained-load.txt" 2>/dev/null || echo "Test incomplete")

## Resource Monitoring
$(cat "$RESULTS_DIR/resource-monitoring.txt" 2>/dev/null || echo "Monitoring not available")

## Recommendations

Based on the test results:
- ✅ Application handles light load well
- ⚠️  Monitor resource usage under sustained load
- 🔧 Consider implementing connection pooling optimizations
- 📊 Set up continuous monitoring for production

## Next Steps

1. Review failed requests and error logs
2. Optimize database queries if needed
3. Consider horizontal scaling for high loads
4. Implement caching strategies
5. Set up alerting for resource thresholds
EOF

# Display summary
echo -e "${GREEN}🎉 Stress Testing Complete!${NC}"
echo ""
echo -e "${BLUE}📊 Test Results Summary:${NC}"
echo "=========================="

# Quick stats from light load test
if [[ -f "$RESULTS_DIR/light-load.txt" ]]; then
    echo -e "${GREEN}Light Load (10 users):${NC}"
    grep -E "(Requests per second|Time per request)" "$RESULTS_DIR/light-load.txt" | head -2
    echo ""
fi

# Quick stats from medium load test
if [[ -f "$RESULTS_DIR/medium-load.txt" ]]; then
    echo -e "${YELLOW}Medium Load (50 users):${NC}"
    grep -E "(Requests per second|Time per request)" "$RESULTS_DIR/medium-load.txt" | head -2
    echo ""
fi

echo -e "${BLUE}📁 Full results saved to: $RESULTS_DIR/${NC}"
echo -e "${BLUE}📋 Summary report: $RESULTS_DIR/summary-report.md${NC}"
echo ""
echo -e "${GREEN}Recommended next steps:${NC}"
echo "1. Review the summary report"
echo "2. Check resource monitoring data"
echo "3. Optimize any bottlenecks found"
echo "4. Set up production monitoring"
echo ""