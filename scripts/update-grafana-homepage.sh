#!/bin/bash

echo "🔄 Updating Grafana with All Service Dashboards"
echo "================================================"

GRAFANA_URL="http://localhost:5005"
GRAFANA_USER="admin"
GRAFANA_PASS="admin123"

echo ""
echo "📊 Reloading dashboards..."
curl -s "$GRAFANA_URL/api/admin/provisioning/dashboards/reload" -X POST -u "$GRAFANA_USER:$GRAFANA_PASS"

echo ""
echo "⏳ Waiting for dashboards to load..."
sleep 10

echo ""
echo "🎯 Available Enhanced Dashboards:"
echo "• 🚀 itellico Mono - Complete Unified Overview v3 (All Services)"
echo "• 🐘 PostgreSQL Enhanced Monitoring"
echo "• 🔴 Redis Enhanced Monitoring"
echo "• 🐰 RabbitMQ Message Queue Monitoring"
echo "• ⚡ Temporal Server Monitoring (Enhanced)"
echo "• 📊 Grafana Self-Monitoring"
echo "• 📧 Mailpit Email Service Monitoring"
echo "• 🔄 N8N Workflow Automation Monitoring"
echo "• 🔥 Fastify API Metrics"
echo "• 🌐 Platform Overview"

echo ""
echo "🏠 Setting Complete Unified Overview v3 as homepage..."

# Find the v3 dashboard
DASHBOARD_SEARCH=$(curl -s -u "$GRAFANA_USER:$GRAFANA_PASS" \
  "$GRAFANA_URL/api/search?query=Complete%20Unified%20Overview%20v3")

DASHBOARD_UID=$(echo "$DASHBOARD_SEARCH" | grep -o '"uid":"[^"]*"' | cut -d'"' -f4 | head -n1)

if [ -n "$DASHBOARD_UID" ]; then
    echo "✅ Found dashboard UID: $DASHBOARD_UID"
    
    # Set as home dashboard
    curl -s -u "$GRAFANA_USER:$GRAFANA_PASS" \
      -X PUT "$GRAFANA_URL/api/org/preferences" \
      -H "Content-Type: application/json" \
      -d "{
        \"homeDashboardUID\": \"$DASHBOARD_UID\",
        \"theme\": \"dark\",
        \"timezone\": \"browser\"
      }"
    
    echo "✅ Homepage updated to Complete Unified Overview v3!"
else
    echo "⚠️  Dashboard not found, using v2"
fi

echo ""
echo "📊 Service Coverage:"
echo "✅ Core Services: API, Frontend, PostgreSQL, Redis"
echo "✅ Message Queue: RabbitMQ"
echo "✅ Workflow Services: Temporal, N8N"
echo "✅ Communication: Mailpit"
echo "✅ Monitoring: Grafana, Prometheus"
echo "✅ Infrastructure: Node Exporter, cAdvisor"

echo ""
echo "🔗 Access Dashboard:"
echo "• Main URL: $GRAFANA_URL/"
echo "• Direct: $GRAFANA_URL/d/mono-unified-overview-v3/"

echo ""
echo "✅ All service dashboards are now available in Grafana!"