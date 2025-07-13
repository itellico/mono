#!/bin/bash

echo "🏠 Setting Up Grafana Unified Dashboard as Homepage"
echo "=================================================="

# Wait for Grafana to be ready
echo "📡 Waiting for Grafana to be ready..."
until curl -s http://localhost:5005/api/health > /dev/null; do
    sleep 2
done

echo "✅ Grafana is ready!"

# Get Grafana admin credentials
GRAFANA_URL="http://localhost:5005"
GRAFANA_USER="admin"
GRAFANA_PASS="admin123"

echo ""
echo "🔧 Configuring Grafana settings..."

# Set the unified dashboard as the default home dashboard
# First, we need to get the dashboard UID after Grafana loads it
sleep 5

echo "📊 Looking for Mono Unified Overview dashboard..."

# Get the dashboard by searching
DASHBOARD_SEARCH=$(curl -s -u "$GRAFANA_USER:$GRAFANA_PASS" \
  "$GRAFANA_URL/api/search?query=Mono%20Platform%20-%20Unified%20Overview" \
  -H "Content-Type: application/json")

echo "Dashboard search result: $DASHBOARD_SEARCH"

# Extract the dashboard UID
DASHBOARD_UID=$(echo "$DASHBOARD_SEARCH" | grep -o '"uid":"[^"]*"' | cut -d'"' -f4 | head -n1)

if [ -n "$DASHBOARD_UID" ]; then
    echo "✅ Found dashboard UID: $DASHBOARD_UID"
    
    # Set as home dashboard
    echo "🏠 Setting as home dashboard..."
    
    # Update organization preferences to set this dashboard as home
    curl -s -u "$GRAFANA_USER:$GRAFANA_PASS" \
      -X PUT "$GRAFANA_URL/api/org/preferences" \
      -H "Content-Type: application/json" \
      -d "{
        \"homeDashboardId\": 0,
        \"homeDashboardUID\": \"$DASHBOARD_UID\",
        \"theme\": \"dark\",
        \"timezone\": \"browser\"
      }"
    
    echo "✅ Home dashboard set successfully!"
    
    # Also set user preferences
    echo "👤 Setting user preferences..."
    curl -s -u "$GRAFANA_USER:$GRAFANA_PASS" \
      -X PUT "$GRAFANA_URL/api/user/preferences" \
      -H "Content-Type: application/json" \
      -d "{
        \"homeDashboardId\": 0,
        \"homeDashboardUID\": \"$DASHBOARD_UID\",
        \"theme\": \"dark\",
        \"timezone\": \"browser\"
      }"
    
    echo "✅ User preferences set!"
    
else
    echo "❌ Could not find dashboard UID. Dashboard might not be loaded yet."
    echo "💡 Try running this script again in a few seconds."
fi

echo ""
echo "🎯 Dashboard Features:"
echo "• 🚀 Platform Overview - CPU, Memory, Services Status"
echo "• ⚡ Fastify API Performance - Request rates, Response times"
echo "• 🗄️ Database & Cache - PostgreSQL and Redis metrics"
echo "• 📊 Resource Utilization - Container resources and network I/O"
echo ""
echo "🔗 Access your unified dashboard at:"
echo "   http://localhost:5005/"
echo ""
echo "💡 Dashboard automatically refreshes every 5 seconds"
echo "💡 All your individual dashboards are still available in the sidebar"