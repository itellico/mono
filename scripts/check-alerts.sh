#!/bin/bash

echo "🚨 itellico Mono - Alerting System Status"
echo "=========================================="

echo ""
echo "📊 Prometheus Status:"
if curl -s --max-time 5 http://localhost:9090/ > /dev/null; then
    echo "✅ Prometheus: UP"
    
    echo ""
    echo "🔔 Current Alerts:"
    curl -s "http://localhost:9090/api/v1/alerts" | jq -r '.data.alerts[] | "\(.labels.alertname): \(.state)"' 2>/dev/null || echo "No alerts or API issue"
    
    echo ""
    echo "📋 Alert Rules:"
    curl -s "http://localhost:9090/api/v1/rules" | jq -r '.data.groups[].rules[] | select(.type == "alerting") | "\(.name): \(.state // "inactive")"' 2>/dev/null || echo "No rules or API issue"
    
else
    echo "❌ Prometheus: DOWN"
fi

echo ""
echo "🎯 Expected Alerts (should be inactive when services are healthy):"
echo "• MonoAPIDown (0 active) - API service monitoring"
echo "• MonoFrontendDown (0 active) - Frontend service monitoring"  
echo "• HighCPUUsage (0 active) - System CPU monitoring"
echo "• HighMemoryUsage (0 active) - System memory monitoring"
echo "• ContainerMonitoringDown (0 active) - cAdvisor monitoring"
echo "• NodeExporterDown (0 active) - System metrics monitoring"
echo "• PostgreSQLDown (0 active) - Database monitoring"
echo "• TemporalDown (0 active) - Workflow engine monitoring"
echo "• RedisDown (0 active) - Cache monitoring"

echo ""
echo "🔗 Monitoring URLs:"
echo "• Prometheus Alerts: http://localhost:9090/alerts"
echo "• Prometheus Rules: http://localhost:9090/rules"
echo "• Grafana Alerts: http://localhost:5005/alerting/list"

echo ""
echo "💡 Note: All alerts should show as '0 active' when services are healthy"
echo "✅ Alert configuration complete with Temporal and PostgreSQL included!"