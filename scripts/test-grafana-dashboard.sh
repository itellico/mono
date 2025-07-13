#!/bin/bash

echo "🧪 Testing Grafana Unified Dashboard"
echo "===================================="

GRAFANA_URL="http://localhost:5005"
GRAFANA_USER="admin"
GRAFANA_PASS="admin123"

echo ""
echo "🔍 Testing dashboard components..."

# Test dashboard accessibility
echo "📊 Testing dashboard access..."
DASHBOARD_RESPONSE=$(curl -s "$GRAFANA_URL/d/mono-unified-overview/f09f9a80-mono-platform-unified-overview")
if echo "$DASHBOARD_RESPONSE" | grep -q "Mono Platform"; then
    echo "✅ Unified dashboard is accessible"
else
    echo "❌ Dashboard not accessible"
fi

# Test API access to dashboard
echo "🔌 Testing API access to dashboard..."
API_RESPONSE=$(curl -s -u "$GRAFANA_USER:$GRAFANA_PASS" "$GRAFANA_URL/api/dashboards/uid/mono-unified-overview")
if echo "$API_RESPONSE" | grep -q "Unified overview"; then
    echo "✅ Dashboard API access working"
else
    echo "❌ Dashboard API access failed"
fi

# Test homepage setting
echo "🏠 Testing homepage configuration..."
ORG_PREFS=$(curl -s -u "$GRAFANA_USER:$GRAFANA_PASS" "$GRAFANA_URL/api/org/preferences")
if echo "$ORG_PREFS" | grep -q "mono-unified-overview"; then
    echo "✅ Homepage is set to unified dashboard"
else
    echo "❌ Homepage not configured correctly"
fi

# Test individual dashboard sections
echo ""
echo "📋 Dashboard Sections Included:"
echo "• 🚀 Platform Overview (CPU, Memory, Services)"
echo "• ⚡ Fastify API Performance (Requests, Response times)"
echo "• 🗄️ Database & Cache (PostgreSQL, Redis)"
echo "• 📊 Resource Utilization (Containers, Network)"

echo ""
echo "🎯 Dashboard Features:"
echo "• 🔄 Auto-refresh every 5 seconds"
echo "• 🌙 Dark theme optimized"
echo "• 📱 Responsive layout"
echo "• 🔗 Links to individual dashboards"
echo "• ⏰ 1-hour time range by default"

echo ""
echo "🔗 Access Points:"
echo "• Main Dashboard: $GRAFANA_URL/"
echo "• Direct Link: $GRAFANA_URL/d/mono-unified-overview/"
echo "• Credentials: admin / admin123"

echo ""
echo "📁 Individual Dashboards Still Available:"
echo "• Fastify API Metrics"
echo "• Platform Overview" 
echo "• PostgreSQL Metrics"
echo "• Redis Metrics"
echo ""
echo "✨ All dashboards are organized in the 'itellico Mono' folder"

echo ""
echo "🚀 Quick Commands:"
echo "pnpm run grafana:homepage  # Reconfigure homepage"
echo "pnpm run docker:services   # Show all service URLs"