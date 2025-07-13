#!/bin/bash

echo "🔍 itellico Mono - Complete Service Health Check"
echo "================================================"

# Function to check HTTP endpoint
check_http() {
    local service=$1
    local url=$2
    local expected=$3
    
    if curl -s -f --max-time 5 "$url" | grep -q "$expected"; then
        echo "✅ $service: UP"
        return 0
    else
        echo "❌ $service: DOWN"
        return 1
    fi
}

# Function to check Prometheus metrics
check_prometheus() {
    local service=$1
    local job=$2
    
    local status=$(curl -s "http://localhost:9090/api/v1/query?query=up{job=\"$job\"}" | jq -r '.data.result[0].value[1] // "0"')
    if [ "$status" = "1" ]; then
        echo "✅ $service (Prometheus): UP"
        return 0
    else
        echo "❌ $service (Prometheus): DOWN"
        return 1
    fi
}

echo ""
echo "📊 Core Application Services:"
check_prometheus "itellico Mono API" "mono-api"
check_prometheus "itellico Mono Frontend" "mono-frontend"

echo ""
echo "🗄️ Database & Cache Services:"
check_http "PostgreSQL" "http://localhost:5432" "postgres" || echo "  (No HTTP endpoint - check via Docker)"
check_http "Redis" "http://localhost:6379" "redis" || echo "  (No HTTP endpoint - check via Docker)"

echo ""
echo "⚡ Workflow & Automation:"
check_http "Temporal Web UI" "http://localhost:8080" "html"
check_http "N8N Workflows" "http://localhost:5678" "html"

echo ""
echo "📧 Communication Services:"
check_http "Mailpit" "http://localhost:8025" "html"

echo ""
echo "📊 Monitoring Stack:"
check_prometheus "Prometheus" "prometheus"
check_prometheus "Node Exporter" "node-exporter"
check_prometheus "cAdvisor" "cadvisor"
check_http "Grafana" "http://localhost:5005/api/health" "ok"

echo ""
echo "🔗 Service URLs:"
echo "• Main Dashboard: http://localhost:5005/"
echo "• Temporal Web UI: http://localhost:8080"
echo "• N8N Workflows: http://localhost:5678 (admin/admin123)"
echo "• Mailpit: http://localhost:8025"
echo "• RedisInsight: http://localhost:5540"
echo "• Prometheus: http://localhost:9090"

echo ""
echo "✅ Service health check complete!"