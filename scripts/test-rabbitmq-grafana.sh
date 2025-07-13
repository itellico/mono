#!/bin/bash

echo "🔍 Testing RabbitMQ Metrics in Grafana"
echo "====================================="

GRAFANA_URL="http://localhost:5005"
GRAFANA_USER="admin"
GRAFANA_PASS="admin123"

echo ""
echo "📊 Testing RabbitMQ Dashboard Queries..."

# Test the main metrics used in the dashboard
METRICS=(
    "up{job=\"rabbitmq\"}"
    "rabbitmq_connections"
    "rabbitmq_queue_messages"
    "rabbitmq_queue_consumers"
    "rabbitmq_process_resident_memory_bytes"
    "rabbitmq_disk_space_available_bytes"
)

for metric in "${METRICS[@]}"; do
    echo -n "Testing $metric: "
    
    # URL encode the metric
    encoded_metric=$(echo "$metric" | sed 's/{/%7B/g; s/}/%7D/g; s/"/%22/g; s/=/%3D/g')
    
    # Query Prometheus directly
    result=$(curl -s "http://localhost:9090/api/v1/query?query=$encoded_metric")
    
    if echo "$result" | grep -q '"status":"success"' && echo "$result" | grep -q '"result":\['; then
        value=$(echo "$result" | jq -r '.data.result[0].value[1]' 2>/dev/null)
        if [ "$value" != "null" ] && [ "$value" != "" ]; then
            echo "✅ Value: $value"
        else
            echo "⚠️  No data"
        fi
    else
        echo "❌ Query failed"
    fi
done

echo ""
echo "🌐 Dashboard URLs:"
echo "• RabbitMQ Dashboard: $GRAFANA_URL/d/rabbitmq-monitoring/"
echo "• Unified Dashboard: $GRAFANA_URL/d/mono-unified-overview-v3/"
echo "• RabbitMQ Management: http://localhost:15672 (admin/admin123)"

echo ""
echo "🔧 If dashboards show 'No data', try:"
echo "1. Refresh the dashboard (Ctrl+R)"
echo "2. Check time range (ensure it covers recent data)"
echo "3. Verify Prometheus data source in Grafana"
echo ""
echo "✅ RabbitMQ Grafana testing complete!"