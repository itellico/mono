#!/bin/bash

# Mono Platform - Complete Grafana & Prometheus Setup via APIs
# This script configures everything programmatically without manual intervention

set -e

echo "🚀 Mono Platform - Complete Monitoring Setup"
echo "============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GRAFANA_URL="http://localhost:5005"
PROMETHEUS_URL="http://localhost:9090"
GRAFANA_USER="admin"
GRAFANA_PASSWORD="admin123"
FASTIFY_URL="http://host.docker.internal:3001"

# Function to check service availability
check_service() {
    local service_name=$1
    local url=$2
    
    echo -n "Checking $service_name... "
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|302\|401"; then
        echo -e "${GREEN}✓ Available${NC}"
        return 0
    else
        echo -e "${RED}✗ Not available${NC}"
        return 1
    fi
}

# Function to wait for services
wait_for_services() {
    echo "Waiting for services to be ready..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if check_service "Grafana" "$GRAFANA_URL/api/health" && \
           check_service "Prometheus" "$PROMETHEUS_URL/-/ready"; then
            echo -e "${GREEN}All services are ready!${NC}"
            return 0
        fi
        
        echo "Waiting for services... (attempt $((attempt + 1))/$max_attempts)"
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}Services did not become ready in time${NC}"
    return 1
}

# Function to make Grafana API call
grafana_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -n "$data" ]; then
        curl -s -X "$method" "$GRAFANA_URL$endpoint" \
            -H "Content-Type: application/json" \
            -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
            -d "$data"
    else
        curl -s -X "$method" "$GRAFANA_URL$endpoint" \
            -H "Content-Type: application/json" \
            -u "$GRAFANA_USER:$GRAFANA_PASSWORD"
    fi
}

# Function to check if Fastify API is serving metrics
check_fastify_metrics() {
    echo -n "Checking Fastify metrics endpoint... "
    if curl -s "$FASTIFY_URL/metrics" | grep -q "# HELP"; then
        echo -e "${GREEN}✓ Metrics available${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ Metrics not available (Fastify may not be running)${NC}"
        return 1
    fi
}

# Wait for services
if ! wait_for_services; then
    echo -e "${RED}Error: Services are not available. Please ensure Docker services are running.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📊 Step 1: Setting up Grafana Data Sources${NC}"
echo "============================================"

# 1. Delete existing Prometheus data source if it exists
echo "Cleaning up existing data sources..."
existing_ds=$(grafana_api GET "/api/datasources" | jq -r '.[] | select(.name=="Prometheus") | .id' 2>/dev/null || echo "")
if [ -n "$existing_ds" ]; then
    echo "Deleting existing Prometheus data source (ID: $existing_ds)..."
    grafana_api DELETE "/api/datasources/$existing_ds" >/dev/null 2>&1 || true
fi

# 2. Create Prometheus data source
echo "Creating Prometheus data source..."
prometheus_ds_response=$(grafana_api POST "/api/datasources" '{
    "name": "Prometheus",
    "type": "prometheus",
    "url": "http://prometheus:9090",
    "access": "proxy",
    "isDefault": true,
    "basicAuth": false,
    "jsonData": {
        "httpMethod": "POST",
        "timeInterval": "15s",
        "queryTimeout": "60s",
        "customQueryParameters": "",
        "manageAlerts": true,
        "alertmanagerUid": ""
    },
    "readOnly": false
}')

if echo "$prometheus_ds_response" | grep -q '"message":"Datasource added"'; then
    echo -e "${GREEN}✓ Prometheus data source created successfully${NC}"
else
    echo -e "${RED}✗ Failed to create Prometheus data source${NC}"
    echo "Response: $prometheus_ds_response"
fi

# 3. Test data source connection
echo "Testing Prometheus data source connection..."
test_response=$(grafana_api POST "/api/datasources/proxy/1/api/v1/query" 'query=up')
if echo "$test_response" | grep -q '"status":"success"'; then
    echo -e "${GREEN}✓ Prometheus connection test successful${NC}"
else
    echo -e "${YELLOW}⚠ Prometheus connection test failed (this is expected if no metrics are being scraped yet)${NC}"
fi

echo ""
echo -e "${BLUE}📈 Step 2: Creating Grafana Dashboards${NC}"
echo "======================================"

# Function to create dashboard
create_dashboard() {
    local dashboard_name=$1
    local dashboard_json=$2
    
    echo "Creating dashboard: $dashboard_name..."
    
    response=$(grafana_api POST "/api/dashboards/db" "$dashboard_json")
    
    if echo "$response" | grep -q '"status":"success"'; then
        echo -e "${GREEN}✓ Dashboard '$dashboard_name' created successfully${NC}"
        dashboard_url=$(echo "$response" | jq -r '.url // ""')
        if [ -n "$dashboard_url" ]; then
            echo "   URL: $GRAFANA_URL$dashboard_url"
        fi
    else
        echo -e "${RED}✗ Failed to create dashboard '$dashboard_name'${NC}"
        echo "   Response: $response"
    fi
}

# Dashboard 1: Mono Platform Overview
echo ""
echo "Creating Mono Platform Overview Dashboard..."
overview_dashboard='{
  "dashboard": {
    "id": null,
    "uid": "mono-overview",
    "title": "Mono Platform Overview",
    "tags": ["mono", "overview", "platform"],
    "timezone": "browser",
    "refresh": "5s",
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "panels": [
      {
        "gridPos": {"h": 8, "w": 6, "x": 0, "y": 0},
        "id": 1,
        "title": "Request Rate",
        "type": "timeseries",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m]))",
            "legendFormat": "Requests/sec",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "reqps",
            "color": {"mode": "palette-classic"}
          }
        }
      },
      {
        "gridPos": {"h": 8, "w": 6, "x": 6, "y": 0},
        "id": 2,
        "title": "Response Time (95th percentile)",
        "type": "timeseries",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) * 1000",
            "legendFormat": "P95 Response Time",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "ms",
            "color": {"mode": "palette-classic"}
          }
        }
      },
      {
        "gridPos": {"h": 8, "w": 6, "x": 12, "y": 0},
        "id": 3,
        "title": "Error Rate",
        "type": "timeseries",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100",
            "legendFormat": "Error %",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "color": {"mode": "palette-classic"}
          }
        }
      },
      {
        "gridPos": {"h": 8, "w": 6, "x": 18, "y": 0},
        "id": 4,
        "title": "Active Connections",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(http_requests_currently_active)",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {"mode": "value"},
            "mappings": [],
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "red", "value": 80}
              ]
            }
          }
        }
      }
    ]
  },
  "overwrite": true
}'

create_dashboard "Mono Platform Overview" "$overview_dashboard"

# Dashboard 2: Fastify API Performance  
echo ""
echo "Creating Fastify API Performance Dashboard..."
fastify_dashboard='{
  "dashboard": {
    "id": null,
    "uid": "fastify-performance",
    "title": "Fastify API Performance", 
    "tags": ["mono", "api", "fastify"],
    "timezone": "browser",
    "refresh": "5s",
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "panels": [
      {
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
        "id": 1,
        "title": "Request Rate by Route",
        "type": "timeseries",
        "targets": [
          {
            "expr": "sum by (route) (rate(http_requests_total[5m]))",
            "legendFormat": "{{route}}",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "reqps",
            "color": {"mode": "palette-classic"}
          }
        }
      },
      {
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0},
        "id": 2,
        "title": "Response Time by Route",
        "type": "timeseries",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum by (route, le) (rate(http_request_duration_seconds_bucket[5m]))) * 1000",
            "legendFormat": "{{route}}",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "ms",
            "color": {"mode": "palette-classic"}
          }
        }
      },
      {
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": 8},
        "id": 3,
        "title": "HTTP Status Codes",
        "type": "timeseries",
        "targets": [
          {
            "expr": "sum by (status) (rate(http_requests_total[5m]))",
            "legendFormat": "{{status}}",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "reqps",
            "color": {"mode": "palette-classic"}
          }
        }
      }
    ]
  },
  "overwrite": true
}'

create_dashboard "Fastify API Performance" "$fastify_dashboard"

# Dashboard 3: System Resources
echo ""
echo "Creating System Resources Dashboard..."
system_dashboard='{
  "dashboard": {
    "id": null,
    "uid": "system-resources",
    "title": "System Resources",
    "tags": ["mono", "system", "resources"],
    "timezone": "browser", 
    "refresh": "10s",
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "panels": [
      {
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
        "id": 1,
        "title": "CPU Usage",
        "type": "timeseries",
        "targets": [
          {
            "expr": "100 - (avg(rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU Usage %",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "min": 0,
            "max": 100,
            "color": {"mode": "palette-classic"}
          }
        }
      },
      {
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0},
        "id": 2,
        "title": "Memory Usage",
        "type": "timeseries",
        "targets": [
          {
            "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
            "legendFormat": "Memory Usage %",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "min": 0,
            "max": 100,
            "color": {"mode": "palette-classic"}
          }
        }
      }
    ]
  },
  "overwrite": true
}'

create_dashboard "System Resources" "$system_dashboard"

echo ""
echo -e "${BLUE}⚙️  Step 3: Configuring Prometheus Scrape Targets${NC}"
echo "=============================================="

# Check if Fastify API has metrics endpoint
check_fastify_metrics

# Get current Prometheus configuration
echo "Getting current Prometheus configuration..."
current_config=$(curl -s "$PROMETHEUS_URL/api/v1/status/config" | jq -r '.data.yaml // ""')

if [ -n "$current_config" ]; then
    echo -e "${GREEN}✓ Retrieved Prometheus configuration${NC}"
else
    echo -e "${YELLOW}⚠ Could not retrieve Prometheus configuration${NC}"
fi

echo ""
echo -e "${BLUE}📋 Step 4: Creating Configuration Templates${NC}"
echo "==========================================="

# Create Prometheus configuration template
mkdir -p monitoring-config

cat > monitoring-config/prometheus-scrape-config.yml << 'EOF'
# Add this job to your prometheus.yml scrape_configs section:

  # Mono Platform Fastify API
  - job_name: 'mono-fastify'
    static_configs:
      - targets: ['host.docker.internal:3001']
    metrics_path: '/metrics'
    scrape_interval: 15s
    scrape_timeout: 10s

  # Mono Platform Next.js (if metrics are enabled)
  - job_name: 'mono-nextjs'
    static_configs:
      - targets: ['host.docker.internal:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 30s
    scrape_timeout: 10s

EOF

echo -e "${GREEN}✓ Prometheus configuration template created${NC}"
echo "   File: monitoring-config/prometheus-scrape-config.yml"

echo ""
echo -e "${BLUE}🔍 Step 5: Testing Metrics Collection${NC}"
echo "====================================="

# Test if we can query some basic metrics
echo "Testing Prometheus query API..."
test_query="up"
query_response=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=$test_query")

if echo "$query_response" | grep -q '"status":"success"'; then
    echo -e "${GREEN}✓ Prometheus query API is working${NC}"
    
    # Check if we have any targets
    targets_up=$(echo "$query_response" | jq -r '.data.result | length')
    echo "   Active targets: $targets_up"
    
    if [ "$targets_up" -gt 0 ]; then
        echo "   Available targets:"
        echo "$query_response" | jq -r '.data.result[] | "   - " + .metric.instance + " (" + .metric.job + ")"'
    fi
else
    echo -e "${RED}✗ Prometheus query API test failed${NC}"
fi

echo ""
echo -e "${BLUE}📊 Step 6: Setting up Grafana Organization & Users${NC}"
echo "=============================================="

# Check current organization
echo "Checking Grafana organization..."
org_response=$(grafana_api GET "/api/org")
if echo "$org_response" | grep -q '"name"'; then
    org_name=$(echo "$org_response" | jq -r '.name')
    org_id=$(echo "$org_response" | jq -r '.id')
    echo -e "${GREEN}✓ Current organization: $org_name (ID: $org_id)${NC}"
else
    echo -e "${YELLOW}⚠ Could not get organization info${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "=================="
echo ""
echo -e "${BLUE}📊 Access your monitoring:${NC}"
echo "   Grafana:    $GRAFANA_URL"
echo "   Prometheus: $PROMETHEUS_URL" 
echo "   Login:      $GRAFANA_USER / $GRAFANA_PASSWORD"
echo ""
echo -e "${BLUE}📈 Created Dashboards:${NC}"
echo "   1. Mono Platform Overview    - $GRAFANA_URL/d/mono-overview"
echo "   2. Fastify API Performance   - $GRAFANA_URL/d/fastify-performance"  
echo "   3. System Resources          - $GRAFANA_URL/d/system-resources"
echo ""
echo -e "${BLUE}⚙️  Next Steps:${NC}"
echo "   1. Start your Fastify API server to begin collecting metrics"
echo "   2. Configure Prometheus to scrape your API endpoints"
echo "   3. View the dashboards to see real-time data"
echo ""
echo -e "${YELLOW}📝 Configuration files created:${NC}"
echo "   - monitoring-config/prometheus-scrape-config.yml"
echo ""
echo -e "${BLUE}🚀 To start collecting metrics from your API:${NC}"
echo "   1. Ensure your Fastify app has prometheus metrics enabled"
echo "   2. Add the scrape configs to your prometheus.yml"
echo "   3. Restart Prometheus to pick up new targets"
echo ""