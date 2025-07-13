#!/bin/bash

echo "🔧 Fixing Grafana Datasources and Adding Temporal Monitoring"
echo "==========================================================="

GRAFANA_URL="http://localhost:5005"
GRAFANA_USER="admin"
GRAFANA_PASS="admin123"

# Wait for Grafana to be ready
echo "📡 Waiting for Grafana to be ready..."
until curl -s "$GRAFANA_URL/api/health" > /dev/null; do
    sleep 2
done
echo "✅ Grafana is ready!"

# Wait a bit more for full startup
sleep 10

echo ""
echo "🔍 Checking current datasources..."
DATASOURCES=$(curl -s -u "$GRAFANA_USER:$GRAFANA_PASS" "$GRAFANA_URL/api/datasources")
echo "Current datasources: $DATASOURCES"

echo ""
echo "📊 Testing Prometheus connection..."
PROM_TEST=$(curl -s "$GRAFANA_URL/api/datasources/proxy/1/api/v1/query?query=up")
if echo "$PROM_TEST" | grep -q "success"; then
    echo "✅ Prometheus datasource is working"
else
    echo "❌ Prometheus datasource has issues"
    echo "Response: $PROM_TEST"
fi

echo ""
echo "🎯 Setting up enhanced dashboards as homepage..."

# Wait for dashboards to be loaded
sleep 5

# Try to find the new unified dashboard v2
DASHBOARD_SEARCH=$(curl -s -u "$GRAFANA_USER:$GRAFANA_PASS" \
  "$GRAFANA_URL/api/search?query=Mono%20Platform%20-%20Unified%20Overview%20v2")

echo "Dashboard search result: $DASHBOARD_SEARCH"

DASHBOARD_UID=$(echo "$DASHBOARD_SEARCH" | grep -o '"uid":"[^"]*"' | cut -d'"' -f4 | head -n1)

if [ -n "$DASHBOARD_UID" ]; then
    echo "✅ Found unified dashboard v2 UID: $DASHBOARD_UID"
    
    # Set as home dashboard
    echo "🏠 Setting v2 dashboard as homepage..."
    curl -s -u "$GRAFANA_USER:$GRAFANA_PASS" \
      -X PUT "$GRAFANA_URL/api/org/preferences" \
      -H "Content-Type: application/json" \
      -d "{
        \"homeDashboardUID\": \"$DASHBOARD_UID\",
        \"theme\": \"dark\",
        \"timezone\": \"browser\"
      }"
    
    echo "✅ Homepage updated to include Temporal monitoring!"
else
    echo "⚠️  Using original unified dashboard"
    # Fallback to original
    DASHBOARD_SEARCH=$(curl -s -u "$GRAFANA_USER:$GRAFANA_PASS" \
      "$GRAFANA_URL/api/search?query=Mono%20Platform%20-%20Unified%20Overview")
    DASHBOARD_UID=$(echo "$DASHBOARD_SEARCH" | grep -o '"uid":"[^"]*"' | cut -d'"' -f4 | head -n1)
    
    if [ -n "$DASHBOARD_UID" ]; then
        curl -s -u "$GRAFANA_USER:$GRAFANA_PASS" \
          -X PUT "$GRAFANA_URL/api/org/preferences" \
          -H "Content-Type: application/json" \
          -d "{
            \"homeDashboardUID\": \"$DASHBOARD_UID\",
            \"theme\": \"dark\",
            \"timezone\": \"browser\"
          }"
    fi
fi

echo ""
echo "🎯 Available Dashboards:"
echo "• 🚀 Mono Platform - Unified Overview v2 (with Temporal)"
echo "• ⚡ Temporal Server Monitoring (dedicated)"
echo "• 🔥 Fastify API Metrics"
echo "• 🗄️ PostgreSQL Metrics"
echo "• 🔴 Redis Metrics"

echo ""
echo "📊 Temporal Monitoring Features:"
echo "• ⚡ Server health and status"
echo "• 🖥️ CPU and memory usage"
echo "• 🌐 Network and disk I/O"
echo "• 📈 Request rates and performance"

echo ""
echo "🔗 Access URLs:"
echo "• Main Dashboard: $GRAFANA_URL/"
echo "• Temporal Dashboard: $GRAFANA_URL/d/temporal-monitoring/"
echo "• Temporal Web UI: http://localhost:8080"
echo "• Temporal Metrics: http://localhost:9091/metrics"

echo ""
echo "✅ Grafana setup complete with Temporal monitoring!"