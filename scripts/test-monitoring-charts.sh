#!/bin/bash

# Test script to demonstrate real-time monitoring charts
# This script generates sample load to show the charts in action

echo "🚀 Testing Mono Platform Monitoring Charts"
echo "=========================================="
echo ""
echo "This script will:"
echo "1. Make sample API requests to generate metrics"
echo "2. Show the real-time charts updating"
echo "3. Access the monitoring dashboard at http://localhost:3000/admin/monitoring"
echo ""

# Check if Next.js server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Next.js server is not running. Please start it with:"
    echo "   npm run dev"
    exit 1
fi

echo "✅ Next.js server is running"

# Function to make API requests
make_requests() {
    local count=$1
    local endpoint=$2
    
    echo "📊 Making $count requests to $endpoint..."
    
    for i in $(seq 1 $count); do
        # Make request and capture response time
        response=$(curl -w "%{http_code},%{time_total}" -s -o /dev/null "http://localhost:3000$endpoint" 2>/dev/null)
        
        # Show progress
        if [ $((i % 5)) -eq 0 ]; then
            echo "   Request $i/$count completed"
        fi
        
        # Small delay to simulate realistic load
        sleep 0.1
    done
}

# Test different endpoints to generate varied metrics
echo "🔥 Generating load patterns..."

# Test 1: Normal API requests
make_requests 20 "/api/v1/admin/monitoring/metrics"

echo ""
echo "📈 Testing different response patterns..."

# Test 2: Fast requests to show request rate spikes
for i in {1..10}; do
    curl -s http://localhost:3000/api/auth/session > /dev/null &
done
wait

echo ""
echo "✅ Load generation complete!"
echo ""
echo "🎯 View your real-time charts at:"
echo "   http://localhost:3000/admin/monitoring"
echo ""
echo "📊 You should see:"
echo "   - API Response Time trending"
echo "   - Request Rate spikes"
echo "   - System resource usage"
echo "   - Error rates (if any errors occurred)"
echo ""
echo "🔄 Charts auto-refresh every 10 seconds"
echo "💡 Toggle 'Auto Refresh' to see updates in real-time"