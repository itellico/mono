#!/bin/bash

echo "🔍 Checking All Docker Services Status..."
echo "================================================"

# Function to check if a service is responding
check_service() {
    local name="$1"
    local url="$2"
    local expected="$3"
    
    echo -n "🔗 $name: "
    if curl -s "$url" | grep -q "$expected" > /dev/null 2>&1; then
        echo "✅ Running"
    else
        echo "❌ Not responding"
    fi
}

# Function to check if a port is open
check_port() {
    local name="$1"
    local port="$2"
    
    echo -n "🔗 $name: "
    if nc -z localhost "$port" > /dev/null 2>&1; then
        echo "✅ Port $port open"
    else
        echo "❌ Port $port closed"
    fi
}

echo ""
echo "📊 Container Status:"
docker-compose ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🌐 Service Health Checks:"
check_service "Grafana" "http://localhost:5005/api/health" "database"
check_service "Prometheus" "http://localhost:9090/api/v1/status/buildinfo" "version"
check_service "Mailpit" "http://localhost:8025" "Mailpit"
check_service "RedisInsight" "http://localhost:5540" "Redis Insight"
check_port "N8N" "5678"
check_port "Temporal Web" "8080"
check_port "Temporal Server" "7233"
check_port "Redis" "6379"
check_port "PostgreSQL" "5432"
check_port "Container Metrics" "8081"

echo ""
echo "🔑 Redis Test:"
if redis-cli -h localhost -p 6379 ping > /dev/null 2>&1; then
    echo "✅ Redis responding to ping"
    echo "   Keys count: $(redis-cli -h localhost -p 6379 dbsize)"
else
    echo "❌ Redis not responding"
fi

echo ""
echo "🗄️  PostgreSQL Test:"
if pg_isready -h localhost -p 5432 -U developer > /dev/null 2>&1; then
    echo "✅ PostgreSQL ready"
else
    echo "❌ PostgreSQL not ready"
fi

echo ""
echo "📈 Quick Service URLs:"
echo "   - Grafana Dashboard: http://localhost:5005 (admin/admin123)"
echo "   - Prometheus: http://localhost:9090"
echo "   - Mailpit: http://localhost:8025"
echo "   - N8N Workflows: http://localhost:5678 (admin/admin123)"
echo "   - Temporal Web: http://localhost:8080"
echo "   - RedisInsight GUI: http://localhost:5540"
echo "   - Container Metrics: http://localhost:8081"
echo ""
echo "💡 For Redis CLI, use: redis-cli -h localhost -p 6379"
echo "💡 For detailed Redis info: ./scripts/redis-cli-web.sh"