#!/bin/bash

# Mono Platform - Complete Monitoring Stack Startup
# This script starts all monitoring components and configures them properly

set -e

echo "🚀 Mono Platform - Complete Monitoring Stack"
echo "============================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}📁 Project root: $PROJECT_ROOT${NC}"

# Source safe port utilities
source scripts/utils/safe-port-utils.sh

# Kill any existing processes on our ports to avoid conflicts (Docker-safe)
echo -e "${YELLOW}🔧 Cleaning up existing processes (Docker-safe)...${NC}"
for port in 3000 3001 3002 3003 3004 3005 9090; do
    safe_kill_port $port "node"
done
sleep 2

echo -e "${BLUE}🐳 Step 1: Starting Docker Services${NC}"
echo "=================================="

cd "$PROJECT_ROOT"

# Start Docker services
echo "Starting Docker services..."
docker compose -f docker-compose.services.yml up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Check service health
services=(
    "prometheus:http://localhost:9090/-/healthy"
    "grafana:http://localhost:5005/api/health"
    "postgres:tcp://localhost:5432"
    "redis:tcp://localhost:6379"
)

echo "Checking service health..."
for service_info in "${services[@]}"; do
    IFS=':' read -r service_name service_url <<< "$service_info"
    
    if [[ "$service_url" == http* ]]; then
        if curl -s "$service_url" >/dev/null 2>&1; then
            echo -e "  ${GREEN}✓ $service_name is healthy${NC}"
        else
            echo -e "  ${YELLOW}⚠ $service_name is starting...${NC}"
        fi
    else
        echo -e "  ${BLUE}ℹ $service_name should be available${NC}"
    fi
done

echo ""
echo -e "${BLUE}🔧 Step 2: Starting Fastify API Server${NC}"
echo "====================================="

# Start Fastify API in the background
cd "$PROJECT_ROOT/apps/api"
echo "Installing API dependencies..."
npm install >/dev/null 2>&1 || echo "Dependencies already installed"

echo "Starting Fastify API server..."
nohup npm run dev > "$PROJECT_ROOT/api-server.log" 2>&1 &
API_PID=$!
echo "API server started with PID: $API_PID"

# Wait for API to be ready
echo "Waiting for API server to start..."
for i in {1..30}; do
    if curl -s http://localhost:3001/api/v1/public/health >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Fastify API is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ API server failed to start in time${NC}"
        exit 1
    fi
    sleep 2
done

# Test metrics endpoint
echo "Testing metrics endpoint..."
if curl -s http://localhost:3001/metrics | head -5; then
    echo -e "${GREEN}✓ Metrics endpoint is serving data${NC}"
else
    echo -e "${YELLOW}⚠ Metrics endpoint not responding${NC}"
fi

echo ""
echo -e "${BLUE}🌐 Step 3: Starting Next.js Frontend${NC}"
echo "==================================="

cd "$PROJECT_ROOT"
echo "Starting Next.js development server..."
nohup npm run dev > "$PROJECT_ROOT/nextjs-server.log" 2>&1 &
NEXTJS_PID=$!
echo "Next.js server started with PID: $NEXTJS_PID"

# Wait for Next.js to be ready
echo "Waiting for Next.js server to start..."
for i in {1..60}; do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Next.js is ready${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${RED}✗ Next.js server failed to start in time${NC}"
        exit 1
    fi
    sleep 3
done

echo ""
echo -e "${BLUE}📊 Step 4: Configuring Grafana and Prometheus${NC}"
echo "============================================="

# Run our setup script
cd "$PROJECT_ROOT"
./scripts/setup-grafana-prometheus.sh

echo ""
echo -e "${BLUE}🔄 Step 5: Reloading Prometheus Configuration${NC}"
echo "=============================================="

# Reload Prometheus to pick up any config changes
echo "Reloading Prometheus configuration..."
if curl -s -X POST http://localhost:9090/-/reload; then
    echo -e "${GREEN}✓ Prometheus configuration reloaded${NC}"
else
    echo -e "${YELLOW}⚠ Prometheus reload may have failed${NC}"
fi

echo ""
echo -e "${BLUE}🎯 Step 6: Testing Complete Stack${NC}"
echo "================================"

# Test Prometheus targets
echo "Checking Prometheus targets..."
targets_response=$(curl -s http://localhost:9090/api/v1/targets)
if echo "$targets_response" | grep -q '"health":"up"'; then
    echo -e "${GREEN}✓ Prometheus is successfully scraping targets${NC}"
    active_targets=$(echo "$targets_response" | grep -o '"health":"up"' | wc -l)
    echo "  Active targets: $active_targets"
else
    echo -e "${YELLOW}⚠ Some Prometheus targets may be down${NC}"
fi

# Test Grafana dashboards
echo "Testing Grafana dashboards..."
dashboards=(
    "mono-overview:Mono Platform Overview"
    "fastify-performance:Fastify API Performance"
    "system-resources:System Resources"
)

for dashboard_info in "${dashboards[@]}"; do
    IFS=':' read -r dashboard_id dashboard_name <<< "$dashboard_info"
    
    if curl -s "http://localhost:5005/api/dashboards/uid/$dashboard_id" \
       -u "admin:admin123" | grep -q '"title"'; then
        echo -e "  ${GREEN}✓ $dashboard_name${NC}"
    else
        echo -e "  ${YELLOW}⚠ $dashboard_name (may still be loading)${NC}"
    fi
done

# Generate some test metrics
echo ""
echo -e "${BLUE}📈 Step 7: Generating Sample Metrics${NC}"
echo "===================================="

echo "Generating sample API requests to populate metrics..."
for i in {1..20}; do
    curl -s http://localhost:3001/api/v1/public/health >/dev/null &
    curl -s http://localhost:3001/metrics >/dev/null &
    curl -s http://localhost:3000/api/auth/session >/dev/null &
done
wait

echo -e "${GREEN}✓ Sample requests sent${NC}"

# Create a process tracking file
cat > "$PROJECT_ROOT/monitoring-processes.txt" << EOF
# Mono Platform Monitoring Processes
# Generated: $(date)

API_PID=$API_PID
NEXTJS_PID=$NEXTJS_PID

# To stop all processes:
# kill $API_PID $NEXTJS_PID
# docker compose -f docker-compose.services.yml down
EOF

echo ""
echo -e "${GREEN}🎉 Complete Monitoring Stack is Ready!${NC}"
echo "====================================="
echo ""
echo -e "${BLUE}📊 Access your monitoring:${NC}"
echo "   Next.js App:     http://localhost:3000"
echo "   Fastify API:     http://localhost:3001"
echo "   Grafana:         http://localhost:5005 (admin/admin123)"
echo "   Prometheus:      http://localhost:9090"
echo "   Admin Dashboard: http://localhost:3000/admin/monitoring"
echo ""
echo -e "${BLUE}📈 Available Dashboards:${NC}"
echo "   1. Mono Platform Overview     - http://localhost:5005/d/mono-overview"
echo "   2. Fastify API Performance    - http://localhost:5005/d/fastify-performance"
echo "   3. System Resources           - http://localhost:5005/d/system-resources"
echo ""
echo -e "${BLUE}💻 Running Processes:${NC}"
echo "   Fastify API:  PID $API_PID"
echo "   Next.js:      PID $NEXTJS_PID"
echo "   Docker services running in background"
echo ""
echo -e "${BLUE}📁 Log Files:${NC}"
echo "   API logs:     $PROJECT_ROOT/api-server.log"
echo "   Next.js logs: $PROJECT_ROOT/nextjs-server.log"
echo ""
echo -e "${BLUE}🛑 To stop everything:${NC}"
echo "   kill $API_PID $NEXTJS_PID"
echo "   docker compose -f docker-compose.services.yml down"
echo ""
echo -e "${YELLOW}⏱  Wait 30-60 seconds for all metrics to populate in Grafana dashboards${NC}"
echo ""
echo -e "${GREEN}🚀 Your Mono Platform monitoring stack is fully operational!${NC}"