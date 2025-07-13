#!/bin/bash

# Generate sample data to populate the Grafana homepage with realistic metrics

echo "📊 Populating Mono Platform Homepage with Sample Data"
echo "===================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Generating diverse API traffic patterns...${NC}"

# Function to make API requests with different patterns
generate_traffic() {
    local endpoint=$1
    local count=$2
    local delay=$3
    local description=$4
    
    echo -e "${YELLOW}📈 $description${NC}"
    
    for i in $(seq 1 $count); do
        # Make request in background for parallel execution
        curl -s "http://localhost:3001$endpoint" >/dev/null 2>&1 &
        
        # Show progress every 5 requests
        if [ $((i % 5)) -eq 0 ]; then
            echo -n "."
        fi
        
        # Small delay between requests
        sleep $delay
    done
    wait # Wait for all background requests to complete
    echo " ✓"
}

# 1. Generate baseline API traffic (metrics endpoint)
generate_traffic "/metrics" 20 0.1 "Baseline metrics collection (20 requests)"

# 2. Generate health check pattern
generate_traffic "/api/v1/public/health" 15 0.2 "Health check monitoring (15 requests)"

# 3. Simulate API endpoint traffic (this will create 404s but show traffic patterns)
echo -e "${YELLOW}📊 Simulating various API endpoints...${NC}"

# Different endpoint patterns to show route diversity
endpoints=(
    "/api/v1/auth/session"
    "/api/v1/admin/tenants"
    "/api/v1/admin/users" 
    "/api/v1/categories"
    "/api/v1/tags"
    "/api/v1/monitoring/health"
)

for endpoint in "${endpoints[@]}"; do
    echo -n "Testing $endpoint... "
    for i in {1..3}; do
        curl -s "http://localhost:3001$endpoint" >/dev/null 2>&1 &
    done
    wait
    echo "✓"
    sleep 0.5
done

# 4. Generate some load testing pattern
echo -e "${YELLOW}⚡ Load testing pattern (burst traffic)${NC}"
for burst in {1..3}; do
    echo -n "Burst $burst... "
    for i in {1..10}; do
        curl -s "http://localhost:3001/metrics" >/dev/null 2>&1 &
        curl -s "http://localhost:3001/health" >/dev/null 2>&1 &
    done
    wait
    echo "✓"
    sleep 2
done

# 5. Generate sustained traffic pattern
echo -e "${YELLOW}🔄 Sustained traffic pattern (30 seconds)${NC}"
echo "This will create a nice traffic pattern on your dashboard..."

end_time=$((SECONDS + 30))
request_count=0

while [ $SECONDS -lt $end_time ]; do
    # Random endpoint selection
    endpoint_choice=$((RANDOM % 3))
    case $endpoint_choice in
        0) endpoint="/metrics" ;;
        1) endpoint="/health" ;;
        2) endpoint="/api/v1/admin/monitoring" ;;
    esac
    
    curl -s "http://localhost:3001$endpoint" >/dev/null 2>&1 &
    
    request_count=$((request_count + 1))
    
    # Progress indicator
    if [ $((request_count % 10)) -eq 0 ]; then
        remaining=$((end_time - SECONDS))
        echo -n "📊 $request_count requests sent, ${remaining}s remaining... "
    fi
    
    # Random delay between 0.5-2 seconds for realistic pattern
    sleep_time=$(echo "scale=1; ($(shuf -i 5-20 -n 1))/10" | bc 2>/dev/null || echo "1")
    sleep $sleep_time
done

wait # Wait for all requests to complete

echo ""
echo -e "${GREEN}✅ Traffic generation complete!${NC}"
echo ""
echo -e "${BLUE}📊 Generated traffic summary:${NC}"
echo "   • Baseline metrics: 20 requests"
echo "   • Health checks: 15 requests"  
echo "   • API endpoints: 18 requests (6 endpoints × 3 each)"
echo "   • Load bursts: 60 requests (3 bursts × 20 each)"
echo "   • Sustained traffic: ~$request_count requests over 30s"
echo ""
echo -e "${GREEN}📈 Total: ~$((20 + 15 + 18 + 60 + request_count)) requests generated${NC}"
echo ""
echo -e "${BLUE}🎯 Now check your Grafana homepage:${NC}"
echo "   http://localhost:5005"
echo ""
echo -e "${YELLOW}💡 You should see:${NC}"
echo "   • Request rate spikes and patterns"
echo "   • Response time variations"
echo "   • Route-specific traffic distribution"
echo "   • HTTP status code distribution"
echo "   • Real-time system resource usage"
echo ""
echo -e "${GREEN}🚀 Your monitoring dashboard is now populated with realistic data!${NC}"