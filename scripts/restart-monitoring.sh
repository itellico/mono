#!/bin/bash

echo "🔄 itellico Mono - Monitoring System Restart"
echo "============================================="

echo ""
echo "🛑 Stopping monitoring services..."
docker-compose stop prometheus grafana || echo "Services may already be stopped"

echo ""
echo "⏳ Waiting for services to stop..."
sleep 5

echo ""
echo "🚀 Starting monitoring services..."
docker-compose up -d prometheus grafana

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "🔍 Checking service status..."
echo -n "• Prometheus: "
if curl -s --max-time 5 http://localhost:9090/ > /dev/null; then
    echo "✅ UP"
else
    echo "❌ DOWN"
fi

echo -n "• Grafana: "
if curl -s --max-time 5 http://localhost:5005/api/health > /dev/null; then
    echo "✅ UP"
else
    echo "❌ DOWN"
fi

echo ""
echo "📊 Alert Rules Status:"
sleep 5
curl -s "http://localhost:9090/api/v1/rules" | jq -r '.data.groups[].rules[] | select(.type == "alerting") | "\(.name): \(.state // "inactive")"' 2>/dev/null || echo "Alert rules loading..."

echo ""
echo "🔗 Access URLs:"
echo "• Prometheus: http://localhost:9090"
echo "• Grafana: http://localhost:5005"
echo "• Alerts: http://localhost:9090/alerts"

echo ""
echo "✅ Monitoring restart complete!"