#!/bin/bash

# Mono Platform Monitoring Setup Script
# Sets up Prometheus and Grafana with all dashboards and configurations

set -e

echo "🚀 Mono Platform Monitoring Setup"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default URLs (can be overridden by environment variables)
GRAFANA_URL=${GRAFANA_URL:-"http://localhost:5005"}
PROMETHEUS_URL=${PROMETHEUS_URL:-"http://localhost:9090"}
GRAFANA_USER=${GRAFANA_USER:-"admin"}
GRAFANA_PASSWORD=${GRAFANA_PASSWORD:-"admin123"}

# Function to check if service is available
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

# Create monitoring configuration directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CONFIG_DIR="$SCRIPT_DIR/monitoring-config"
mkdir -p "$CONFIG_DIR"

# Generate Prometheus configuration
cat > "$CONFIG_DIR/prometheus.yml" << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

# Alerting configuration
alerting:
  alertmanagers:
    - static_configs:
        - targets: []

# Load rules once and periodically evaluate them
rule_files:
  - "alerts/*.yml"

# Scrape configurations
scrape_configs:
  # Prometheus itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Fastify API metrics
  - job_name: 'fastify'
    static_configs:
      - targets: ['host.docker.internal:3001']
    metrics_path: '/metrics'
    
  # Node exporter for system metrics
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
      
  # PostgreSQL exporter
  - job_name: 'postgresql'
    static_configs:
      - targets: ['postgres-exporter:9187']
      
  # Redis exporter
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
      
  # Docker metrics
  - job_name: 'docker'
    static_configs:
      - targets: ['cadvisor:8080']
EOF

# Create Prometheus alert rules
mkdir -p "$CONFIG_DIR/alerts"
cat > "$CONFIG_DIR/alerts/mono-alerts.yml" << 'EOF'
groups:
  - name: mono_platform_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 5% (current: {{ $value | humanizePercentage }})"
      
      # High response time
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High API response time"
          description: "95th percentile response time is above 500ms"
      
      # Database connection pool exhaustion
      - alert: DatabaseConnectionPoolExhaustion
        expr: pg_stat_database_numbackends / pg_settings_max_connections > 0.8
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool near exhaustion"
          description: "Database connections at {{ $value | humanizePercentage }} of maximum"
      
      # Redis memory usage
      - alert: RedisHighMemoryUsage
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Redis memory usage is high"
          description: "Redis memory at {{ $value | humanizePercentage }} of maximum"
      
      # Disk space
      - alert: DiskSpaceLow
        expr: node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} < 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Low disk space"
          description: "Less than 10% disk space remaining"
EOF

# Wait for services to be ready
if ! wait_for_services; then
    echo -e "${RED}Error: Services are not available. Please ensure Docker services are running.${NC}"
    exit 1
fi

# Create or update Prometheus data source in Grafana
echo "Setting up Grafana data sources..."
curl -s -X POST "$GRAFANA_URL/api/datasources" \
  -H "Content-Type: application/json" \
  -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
  -d '{
    "name": "Prometheus",
    "type": "prometheus",
    "url": "http://prometheus:9090",
    "access": "proxy",
    "isDefault": true,
    "jsonData": {
      "httpMethod": "POST",
      "timeInterval": "15s"
    }
  }' > /dev/null 2>&1 || echo "Prometheus data source might already exist"

# Create organization if needed
echo "Setting up Grafana organization..."
ORG_ID=$(curl -s -X POST "$GRAFANA_URL/api/orgs" \
  -H "Content-Type: application/json" \
  -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
  -d '{"name":"Mono Platform"}' 2>/dev/null | jq -r '.orgId // 1')

# Switch to organization
curl -s -X POST "$GRAFANA_URL/api/user/using/$ORG_ID" \
  -u "$GRAFANA_USER:$GRAFANA_PASSWORD" > /dev/null

echo "Creating Grafana dashboards..."

# Function to create dashboard
create_dashboard() {
    local dashboard_json=$1
    local dashboard_name=$2
    
    echo -n "Creating $dashboard_name dashboard... "
    
    response=$(curl -s -X POST "$GRAFANA_URL/api/dashboards/db" \
      -H "Content-Type: application/json" \
      -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
      -d "$dashboard_json")
    
    if echo "$response" | grep -q '"status":"success"'; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        echo "Error: $response"
    fi
}

# Create Mono Platform Overview Dashboard
cat > "$CONFIG_DIR/mono-overview-dashboard.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "uid": "mono-overview",
    "title": "Mono Platform Overview",
    "tags": ["mono", "overview"],
    "timezone": "browser",
    "refresh": "5s",
    "panels": [
      {
        "gridPos": {"h": 8, "w": 6, "x": 0, "y": 0},
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m]))",
            "legendFormat": "Requests/sec",
            "refId": "A"
          }
        ],
        "yaxes": [{"format": "reqps", "show": true}, {"show": false}]
      },
      {
        "gridPos": {"h": 8, "w": 6, "x": 6, "y": 0},
        "id": 2,
        "title": "Response Time (95th percentile)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) * 1000",
            "legendFormat": "P95 Response Time",
            "refId": "A"
          }
        ],
        "yaxes": [{"format": "ms", "show": true}, {"show": false}]
      },
      {
        "gridPos": {"h": 8, "w": 6, "x": 12, "y": 0},
        "id": 3,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100",
            "legendFormat": "Error %",
            "refId": "A"
          }
        ],
        "yaxes": [{"format": "percent", "show": true}, {"show": false}]
      },
      {
        "gridPos": {"h": 8, "w": 6, "x": 18, "y": 0},
        "id": 4,
        "title": "Active Users",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(increase(user_sessions_total[1h]))",
            "refId": "A"
          }
        ],
        "options": {
          "colorMode": "value",
          "graphMode": "area",
          "justifyMode": "auto"
        }
      },
      {
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8},
        "id": 5,
        "title": "System Resources",
        "type": "graph",
        "targets": [
          {
            "expr": "100 - (avg(rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU Usage %",
            "refId": "A"
          },
          {
            "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
            "legendFormat": "Memory Usage %",
            "refId": "B"
          }
        ],
        "yaxes": [{"format": "percent", "show": true}, {"show": false}]
      },
      {
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8},
        "id": 6,
        "title": "Database Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends{datname=\"mono\"}",
            "legendFormat": "Active Connections",
            "refId": "A"
          },
          {
            "expr": "rate(pg_stat_database_xact_commit{datname=\"mono\"}[5m])",
            "legendFormat": "Transactions/sec",
            "refId": "B"
          }
        ],
        "yaxes": [{"format": "short", "show": true}, {"show": false}]
      }
    ]
  },
  "overwrite": true
}
EOF

create_dashboard "$(cat $CONFIG_DIR/mono-overview-dashboard.json)" "Mono Platform Overview"

# Create Fastify API Performance Dashboard
cat > "$CONFIG_DIR/fastify-dashboard.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "uid": "fastify",
    "title": "Fastify API Performance",
    "tags": ["mono", "api", "fastify"],
    "timezone": "browser",
    "refresh": "5s",
    "panels": [
      {
        "gridPos": {"h": 8, "w": 8, "x": 0, "y": 0},
        "id": 1,
        "title": "Request Rate by Endpoint",
        "type": "graph",
        "targets": [
          {
            "expr": "sum by (route) (rate(http_requests_total[5m]))",
            "legendFormat": "{{route}}",
            "refId": "A"
          }
        ]
      },
      {
        "gridPos": {"h": 8, "w": 8, "x": 8, "y": 0},
        "id": 2,
        "title": "Response Time by Endpoint",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum by (route, le) (rate(http_request_duration_seconds_bucket[5m]))) * 1000",
            "legendFormat": "{{route}}",
            "refId": "A"
          }
        ],
        "yaxes": [{"format": "ms", "show": true}, {"show": false}]
      },
      {
        "gridPos": {"h": 8, "w": 8, "x": 16, "y": 0},
        "id": 3,
        "title": "Status Code Distribution",
        "type": "piechart",
        "targets": [
          {
            "expr": "sum by (status) (increase(http_requests_total[1h]))",
            "legendFormat": "{{status}}",
            "refId": "A"
          }
        ]
      },
      {
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": 8},
        "id": 4,
        "title": "Request Duration Heatmap",
        "type": "heatmap",
        "targets": [
          {
            "expr": "sum(increase(http_request_duration_seconds_bucket[1m])) by (le)",
            "format": "heatmap",
            "refId": "A"
          }
        ]
      }
    ]
  },
  "overwrite": true
}
EOF

create_dashboard "$(cat $CONFIG_DIR/fastify-dashboard.json)" "Fastify API Performance"

# Create PostgreSQL Dashboard
cat > "$CONFIG_DIR/postgres-dashboard.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "uid": "postgres",
    "title": "PostgreSQL Metrics",
    "tags": ["mono", "database", "postgresql"],
    "timezone": "browser",
    "refresh": "10s",
    "panels": [
      {
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
        "id": 1,
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends{datname=\"mono\"}",
            "legendFormat": "Active Connections",
            "refId": "A"
          },
          {
            "expr": "pg_settings_max_connections",
            "legendFormat": "Max Connections",
            "refId": "B"
          }
        ]
      },
      {
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0},
        "id": 2,
        "title": "Transaction Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(pg_stat_database_xact_commit{datname=\"mono\"}[5m])",
            "legendFormat": "Commits/sec",
            "refId": "A"
          },
          {
            "expr": "rate(pg_stat_database_xact_rollback{datname=\"mono\"}[5m])",
            "legendFormat": "Rollbacks/sec",
            "refId": "B"
          }
        ]
      },
      {
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8},
        "id": 3,
        "title": "Cache Hit Rate",
        "type": "gauge",
        "targets": [
          {
            "expr": "pg_stat_database_blks_hit{datname=\"mono\"} / (pg_stat_database_blks_hit{datname=\"mono\"} + pg_stat_database_blks_read{datname=\"mono\"}) * 100",
            "refId": "A"
          }
        ],
        "options": {
          "showThresholdLabels": false,
          "showThresholdMarkers": true
        },
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "min": 0,
            "max": 100,
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"color": "red", "value": null},
                {"color": "yellow", "value": 80},
                {"color": "green", "value": 90}
              ]
            }
          }
        }
      },
      {
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8},
        "id": 4,
        "title": "Database Size",
        "type": "stat",
        "targets": [
          {
            "expr": "pg_database_size_bytes{datname=\"mono\"}",
            "refId": "A"
          }
        ],
        "options": {
          "colorMode": "value",
          "graphMode": "area"
        },
        "fieldConfig": {
          "defaults": {
            "unit": "bytes"
          }
        }
      }
    ]
  },
  "overwrite": true
}
EOF

create_dashboard "$(cat $CONFIG_DIR/postgres-dashboard.json)" "PostgreSQL Metrics"

# Create Redis Dashboard
cat > "$CONFIG_DIR/redis-dashboard.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "uid": "redis",
    "title": "Redis Cache Performance",
    "tags": ["mono", "cache", "redis"],
    "timezone": "browser",
    "refresh": "5s",
    "panels": [
      {
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
        "id": 1,
        "title": "Cache Hit Rate",
        "type": "gauge",
        "targets": [
          {
            "expr": "redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total) * 100",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "min": 0,
            "max": 100,
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"color": "red", "value": null},
                {"color": "yellow", "value": 70},
                {"color": "green", "value": 85}
              ]
            }
          }
        }
      },
      {
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0},
        "id": 2,
        "title": "Operations/sec",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(redis_commands_processed_total[5m])",
            "legendFormat": "Commands/sec",
            "refId": "A"
          }
        ]
      },
      {
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8},
        "id": 3,
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "redis_memory_used_bytes",
            "legendFormat": "Used Memory",
            "refId": "A"
          },
          {
            "expr": "redis_memory_max_bytes",
            "legendFormat": "Max Memory",
            "refId": "B"
          }
        ],
        "yaxes": [{"format": "bytes", "show": true}, {"show": false}]
      },
      {
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8},
        "id": 4,
        "title": "Connected Clients",
        "type": "stat",
        "targets": [
          {
            "expr": "redis_connected_clients",
            "refId": "A"
          }
        ]
      }
    ]
  },
  "overwrite": true
}
EOF

create_dashboard "$(cat $CONFIG_DIR/redis-dashboard.json)" "Redis Cache Performance"

# Create Docker Services Dashboard
cat > "$CONFIG_DIR/docker-dashboard.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "uid": "docker",
    "title": "Docker Services Health",
    "tags": ["mono", "docker", "infrastructure"],
    "timezone": "browser",
    "refresh": "10s",
    "panels": [
      {
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": 0},
        "id": 1,
        "title": "Container Status",
        "type": "table",
        "targets": [
          {
            "expr": "container_last_seen{name=~\"mono.*\"}",
            "format": "table",
            "instant": true,
            "refId": "A"
          }
        ],
        "transformations": [
          {
            "id": "organize",
            "options": {
              "excludeByName": {
                "Time": true,
                "__name__": true,
                "job": true,
                "instance": true
              },
              "renameByName": {
                "name": "Container",
                "Value": "Status"
              }
            }
          }
        ]
      },
      {
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8},
        "id": 2,
        "title": "Container CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(container_cpu_usage_seconds_total{name=~\"mono.*\"}[5m]) * 100",
            "legendFormat": "{{name}}",
            "refId": "A"
          }
        ],
        "yaxes": [{"format": "percent", "show": true}, {"show": false}]
      },
      {
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8},
        "id": 3,
        "title": "Container Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "container_memory_usage_bytes{name=~\"mono.*\"}",
            "legendFormat": "{{name}}",
            "refId": "A"
          }
        ],
        "yaxes": [{"format": "bytes", "show": true}, {"show": false}]
      }
    ]
  },
  "overwrite": true
}
EOF

create_dashboard "$(cat $CONFIG_DIR/docker-dashboard.json)" "Docker Services Health"

# Create Business Intelligence Dashboard
cat > "$CONFIG_DIR/business-dashboard.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "uid": "business",
    "title": "Mono Business Metrics",
    "tags": ["mono", "business", "kpi"],
    "timezone": "browser",
    "refresh": "30s",
    "panels": [
      {
        "gridPos": {"h": 8, "w": 6, "x": 0, "y": 0},
        "id": 1,
        "title": "Total Users",
        "type": "stat",
        "targets": [
          {
            "expr": "mono_users_total",
            "refId": "A"
          }
        ],
        "options": {
          "colorMode": "value",
          "graphMode": "area"
        }
      },
      {
        "gridPos": {"h": 8, "w": 6, "x": 6, "y": 0},
        "id": 2,
        "title": "Active Tenants",
        "type": "stat",
        "targets": [
          {
            "expr": "mono_tenants_active",
            "refId": "A"
          }
        ]
      },
      {
        "gridPos": {"h": 8, "w": 6, "x": 12, "y": 0},
        "id": 3,
        "title": "Monthly Revenue",
        "type": "stat",
        "targets": [
          {
            "expr": "mono_revenue_monthly",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "currencyUSD"
          }
        }
      },
      {
        "gridPos": {"h": 8, "w": 6, "x": 18, "y": 0},
        "id": 4,
        "title": "User Growth Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(mono_users_total[30d]) * 100",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent"
          }
        }
      }
    ]
  },
  "overwrite": true
}
EOF

create_dashboard "$(cat $CONFIG_DIR/business-dashboard.json)" "Business Metrics"

# Setup Grafana alerts
echo "Setting up Grafana alerts..."
cat > "$CONFIG_DIR/grafana-alerts.json" << 'EOF'
{
  "notifications": [
    {
      "uid": "mono-alerts",
      "name": "Mono Platform Alerts",
      "type": "email",
      "isDefault": true,
      "sendReminder": true,
      "frequency": "1h",
      "settings": {
        "addresses": "alerts@mono-platform.com"
      }
    }
  ]
}
EOF

# Create notification channel
curl -s -X POST "$GRAFANA_URL/api/alert-notifications" \
  -H "Content-Type: application/json" \
  -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
  -d "$(cat $CONFIG_DIR/grafana-alerts.json | jq '.notifications[0]')" > /dev/null 2>&1 || true

# Setup Prometheus recording rules for better performance
cat > "$CONFIG_DIR/recording-rules.yml" << 'EOF'
groups:
  - name: mono_recording_rules
    interval: 30s
    rules:
      # Pre-compute expensive queries
      - record: instance:node_cpu_utilization:rate5m
        expr: 100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
      
      - record: instance:node_memory_utilization:ratio
        expr: 1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)
      
      - record: job:http_requests:rate5m
        expr: sum by (job) (rate(http_requests_total[5m]))
      
      - record: job:http_request_duration:p95_5m
        expr: histogram_quantile(0.95, sum by (job, le) (rate(http_request_duration_seconds_bucket[5m])))
EOF

# Copy configurations to Docker volumes if running in Docker
if [ -f "$SCRIPT_DIR/../docker-compose.services.yml" ]; then
    echo "Copying configurations to Docker volumes..."
    
    # Copy Prometheus config
    docker cp "$CONFIG_DIR/prometheus.yml" mono-prometheus:/etc/prometheus/prometheus.yml 2>/dev/null || true
    docker cp "$CONFIG_DIR/alerts" mono-prometheus:/etc/prometheus/ 2>/dev/null || true
    docker cp "$CONFIG_DIR/recording-rules.yml" mono-prometheus:/etc/prometheus/recording-rules.yml 2>/dev/null || true
    
    # Reload Prometheus configuration
    docker exec mono-prometheus kill -HUP 1 2>/dev/null || true
fi

# Create a script to export dashboards
cat > "$SCRIPT_DIR/export-dashboards.sh" << 'EOF'
#!/bin/bash
# Export all Mono dashboards from Grafana

GRAFANA_URL=${GRAFANA_URL:-"http://localhost:5005"}
GRAFANA_USER=${GRAFANA_USER:-"admin"}
GRAFANA_PASSWORD=${GRAFANA_PASSWORD:-"admin123"}

mkdir -p exported-dashboards

for uid in mono-overview fastify postgres redis docker business; do
    echo "Exporting dashboard: $uid"
    curl -s "$GRAFANA_URL/api/dashboards/uid/$uid" \
      -u "$GRAFANA_USER:$GRAFANA_PASSWORD" | \
      jq '.dashboard' > "exported-dashboards/$uid.json"
done

echo "Dashboards exported to ./exported-dashboards/"
EOF

chmod +x "$SCRIPT_DIR/export-dashboards.sh"

# Create a health check script
cat > "$SCRIPT_DIR/check-monitoring.sh" << 'EOF'
#!/bin/bash
# Check monitoring stack health

echo "Checking monitoring stack health..."

# Check Prometheus
prometheus_health=$(curl -s http://localhost:9090/-/healthy)
if [ "$prometheus_health" = "Prometheus is Healthy." ]; then
    echo "✓ Prometheus is healthy"
else
    echo "✗ Prometheus is not healthy"
fi

# Check Grafana
grafana_health=$(curl -s http://localhost:5005/api/health | jq -r '.database')
if [ "$grafana_health" = "ok" ]; then
    echo "✓ Grafana is healthy"
else
    echo "✗ Grafana is not healthy"
fi

# Check metrics collection
metric_count=$(curl -s http://localhost:9090/api/v1/query?query=up | jq '.data.result | length')
echo "✓ Collecting metrics from $metric_count targets"
EOF

chmod +x "$SCRIPT_DIR/check-monitoring.sh"

echo ""
echo -e "${GREEN}✅ Monitoring setup complete!${NC}"
echo ""
echo "📊 Access your dashboards:"
echo "   Grafana: $GRAFANA_URL (login: $GRAFANA_USER/****)"
echo "   Prometheus: $PROMETHEUS_URL"
echo ""
echo "📈 Available dashboards:"
echo "   - Mono Platform Overview"
echo "   - Fastify API Performance"
echo "   - PostgreSQL Metrics"
echo "   - Redis Cache Performance"
echo "   - Docker Services Health"
echo "   - Business Metrics"
echo ""
echo "🔧 Useful scripts created:"
echo "   - $SCRIPT_DIR/check-monitoring.sh - Check monitoring health"
echo "   - $SCRIPT_DIR/export-dashboards.sh - Export dashboards"
echo ""
echo "📁 Configuration files saved in: $CONFIG_DIR"