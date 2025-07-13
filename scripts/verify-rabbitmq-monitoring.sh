#!/bin/bash

echo "🐰 Verifying RabbitMQ Monitoring Setup"
echo "====================================="

echo ""
echo "🔍 Checking RabbitMQ Container Status..."
RABBITMQ_STATUS=$(docker-compose ps rabbitmq --format "{{.Status}}")
if [[ "$RABBITMQ_STATUS" == *"Up"* ]] && [[ "$RABBITMQ_STATUS" == *"healthy"* ]]; then
    echo "✅ RabbitMQ container is running and healthy"
else
    echo "❌ RabbitMQ container status: $RABBITMQ_STATUS"
fi

echo ""
echo "🔍 Checking RabbitMQ Prometheus Metrics..."
METRICS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:15692/metrics)
if [ "$METRICS_RESPONSE" = "200" ]; then
    echo "✅ RabbitMQ Prometheus metrics endpoint is accessible"
    
    # Count the number of metrics
    METRICS_COUNT=$(curl -s http://localhost:15692/metrics | grep -c "^rabbitmq_")
    echo "📊 Found $METRICS_COUNT RabbitMQ-specific metrics"
else
    echo "❌ RabbitMQ Prometheus metrics endpoint returned: $METRICS_RESPONSE"
fi

echo ""
echo "🔍 Checking Prometheus RabbitMQ Target..."
PROMETHEUS_RESPONSE=$(curl -s "http://localhost:9090/api/v1/targets" | grep -o '"job":"rabbitmq".*"health":"[^"]*"' | head -1)
if [[ "$PROMETHEUS_RESPONSE" == *'"health":"up"'* ]]; then
    echo "✅ Prometheus is successfully scraping RabbitMQ metrics"
else
    echo "⚠️  Prometheus RabbitMQ target status: $PROMETHEUS_RESPONSE"
fi

echo ""
echo "🔍 Checking RabbitMQ Management UI..."
MGMT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:15672/)
if [ "$MGMT_RESPONSE" = "200" ]; then
    echo "✅ RabbitMQ Management UI is accessible"
else
    echo "❌ RabbitMQ Management UI returned: $MGMT_RESPONSE"
fi

echo ""
echo "🔍 Checking Grafana RabbitMQ Dashboard..."
GRAFANA_USER="admin"
GRAFANA_PASS="admin123"
DASHBOARD_CHECK=$(curl -s -u "$GRAFANA_USER:$GRAFANA_PASS" "http://localhost:5005/api/search?query=RabbitMQ")
if [[ "$DASHBOARD_CHECK" == *"rabbitmq-monitoring"* ]]; then
    echo "✅ RabbitMQ dashboard is available in Grafana"
else
    echo "❌ RabbitMQ dashboard not found in Grafana"
fi

echo ""
echo "📋 Access URLs:"
echo "• RabbitMQ Management: http://localhost:15672 (admin/admin123)"
echo "• RabbitMQ Metrics: http://localhost:15692/metrics"
echo "• Prometheus Targets: http://localhost:9090/targets"
echo "• Grafana RabbitMQ Dashboard: http://localhost:5005/d/rabbitmq-monitoring/"
echo "• Unified Dashboard: http://localhost:5005/d/mono-unified-overview-v3/"

echo ""
echo "🎯 Sample RabbitMQ Metrics to Verify:"
echo "Checking for key metrics..."

RABBITMQ_UP=$(curl -s http://localhost:15692/metrics | grep "rabbitmq_up " | head -1)
if [ -n "$RABBITMQ_UP" ]; then
    echo "✅ rabbitmq_up: $RABBITMQ_UP"
else
    echo "❌ rabbitmq_up metric not found"
fi

RABBITMQ_CONNECTIONS=$(curl -s http://localhost:15692/metrics | grep "rabbitmq_connections " | head -1)
if [ -n "$RABBITMQ_CONNECTIONS" ]; then
    echo "✅ rabbitmq_connections: $RABBITMQ_CONNECTIONS"
else
    echo "❌ rabbitmq_connections metric not found"
fi

echo ""
echo "✅ RabbitMQ monitoring verification complete!"