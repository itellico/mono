#!/bin/bash

# Verify Prometheus Setup and Data Persistence
# This script checks if Prometheus is properly configured with persistent storage

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           Prometheus Setup Verification                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

PROMETHEUS_URL="http://192.168.178.94:9090"

# Step 1: Check if Prometheus is accessible
echo -e "${YELLOW}Step 1: Testing Prometheus accessibility...${NC}"
if curl -s --max-time 10 "$PROMETHEUS_URL" > /dev/null; then
    echo -e "${GREEN}✅ Prometheus is accessible${NC}"
else
    echo -e "${RED}❌ Prometheus is not accessible${NC}"
    exit 1
fi

# Step 2: Check API status
echo -e "${YELLOW}Step 2: Checking API status...${NC}"
API_STATUS=$(curl -s "$PROMETHEUS_URL/api/v1/status/runtimeinfo" | jq -r '.status')
if [ "$API_STATUS" = "success" ]; then
    echo -e "${GREEN}✅ Prometheus API is working${NC}"
else
    echo -e "${RED}❌ Prometheus API issue${NC}"
fi

# Step 3: Check targets
echo -e "${YELLOW}Step 3: Checking scrape targets...${NC}"
TARGETS=$(curl -s "$PROMETHEUS_URL/api/v1/targets" | jq -r '.data.activeTargets[] | "\(.labels.job): \(.health)"')
echo -e "${BLUE}Active targets:${NC}"
echo "$TARGETS" | while read -r line; do
    job=$(echo "$line" | cut -d: -f1)
    health=$(echo "$line" | cut -d: -f2 | tr -d ' ')
    if [ "$health" = "up" ]; then
        echo -e "  ${GREEN}✅ $job${NC}"
    else
        echo -e "  ${RED}❌ $job (down)${NC}"
    fi
done

# Step 4: Check available metrics
echo -e "${YELLOW}Step 4: Checking available metrics...${NC}"
METRIC_COUNT=$(curl -s "$PROMETHEUS_URL/api/v1/label/__name__/values" | jq '.data | length')
echo -e "${GREEN}✅ $METRIC_COUNT metrics available${NC}"

# Step 5: Check data persistence
echo -e "${YELLOW}Step 5: Checking data persistence...${NC}"
if [ -d "docker-data/monitoring/prometheus/data" ]; then
    DATA_SIZE=$(du -sh docker-data/monitoring/prometheus/data | cut -f1)
    BLOCK_COUNT=$(ls docker-data/monitoring/prometheus/data/ | grep -E '^[0-9A-Z]+$' | wc -l)
    echo -e "${GREEN}✅ Persistent data: $DATA_SIZE ($BLOCK_COUNT time blocks)${NC}"
else
    echo -e "${RED}❌ No persistent data directory found${NC}"
fi

# Step 6: Check configuration
echo -e "${YELLOW}Step 6: Checking configuration...${NC}"
CONFIG_STATUS=$(curl -s "$PROMETHEUS_URL/api/v1/status/config" | jq -r '.status')
if [ "$CONFIG_STATUS" = "success" ]; then
    echo -e "${GREEN}✅ Configuration is valid${NC}"
else
    echo -e "${RED}❌ Configuration issue${NC}"
fi

# Step 7: Sample queries
echo -e "${YELLOW}Step 7: Testing sample queries...${NC}"

# Test basic up query
UP_COUNT=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=up" | jq '.data.result | length')
echo -e "${GREEN}✅ Found $UP_COUNT service instances${NC}"

# Test container metrics
CONTAINER_COUNT=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=container_memory_usage_bytes" | jq '.data.result | length // 0')
if [ "$CONTAINER_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Container metrics: $CONTAINER_COUNT containers${NC}"
else
    echo -e "${YELLOW}⚠️  No container metrics (cAdvisor may be starting)${NC}"
fi

# Test system metrics
SYSTEM_METRICS=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=node_memory_MemAvailable_bytes" | jq '.data.result | length // 0')
if [ "$SYSTEM_METRICS" -gt 0 ]; then
    echo -e "${GREEN}✅ System metrics available${NC}"
else
    echo -e "${YELLOW}⚠️  No system metrics (node-exporter may be starting)${NC}"
fi

echo ""
echo -e "${BLUE}📊 Quick Access Links:${NC}"
echo -e "${YELLOW}• Prometheus:     $PROMETHEUS_URL${NC}"
echo -e "${YELLOW}• Targets:        $PROMETHEUS_URL/targets${NC}"
echo -e "${YELLOW}• Graph:          $PROMETHEUS_URL/graph${NC}"
echo -e "${YELLOW}• Status:         $PROMETHEUS_URL/status${NC}"
echo -e "${YELLOW}• Grafana:        http://192.168.178.94:5005${NC}"

echo ""
echo -e "${BLUE}🔍 Sample Queries to Try:${NC}"
echo -e "${YELLOW}• up                                    # Service availability${NC}"
echo -e "${YELLOW}• container_memory_usage_bytes          # Container memory${NC}"
echo -e "${YELLOW}• node_memory_MemAvailable_bytes        # System memory${NC}"
echo -e "${YELLOW}• rabbitmq_queue_messages               # RabbitMQ queue size${NC}"
echo -e "${YELLOW}• temporal_request_latency              # Temporal latency${NC}"

echo ""
echo -e "${GREEN}✅ Prometheus verification complete!${NC}"