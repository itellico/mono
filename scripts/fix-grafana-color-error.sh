#!/bin/bash

# Fix Grafana color mode error in homepage dashboard

echo "🎨 Fixing Grafana Color Mode Error"
echo "================================="

GRAFANA_URL="http://localhost:5005"
GRAFANA_USER="admin"
GRAFANA_PASSWORD="admin123"

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

echo "Fixing color mode configuration..."

# Fixed dashboard with correct color modes
fixed_dashboard='{
  "dashboard": {
    "id": null,
    "uid": "mono-homepage",
    "title": "Mono Platform - Monitoring Overview",
    "tags": ["mono", "homepage", "overview"],
    "timezone": "browser",
    "refresh": "5s",
    "time": {
      "from": "now-6h",
      "to": "now"
    },
    "panels": [
      {
        "datasource": "Prometheus",
        "fieldConfig": {
          "defaults": {
            "color": {"mode": "palette-classic"},
            "custom": {
              "axisLabel": "",
              "axisPlacement": "auto",
              "drawStyle": "line",
              "fillOpacity": 10,
              "lineWidth": 2,
              "pointSize": 5,
              "showPoints": "never"
            },
            "unit": "reqps"
          }
        },
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
        "id": 1,
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) or vector(0)",
            "legendFormat": "Requests/sec",
            "refId": "A"
          }
        ],
        "title": "🚀 API Request Rate",
        "type": "timeseries"
      },
      {
        "datasource": "Prometheus",
        "fieldConfig": {
          "defaults": {
            "color": {"mode": "thresholds"},
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 100},
                {"color": "red", "value": 500}
              ]
            },
            "unit": "ms"
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 12, "y": 0},
        "id": 2,
        "options": {
          "colorMode": "value",
          "graphMode": "area",
          "reduceOptions": {"calcs": ["lastNotNull"]}
        },
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) * 1000 or vector(0)",
            "refId": "A"
          }
        ],
        "title": "⚡ P95 Response Time",
        "type": "stat"
      },
      {
        "datasource": "Prometheus",
        "fieldConfig": {
          "defaults": {
            "color": {"mode": "thresholds"},
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 2},
                {"color": "red", "value": 5}
              ]
            },
            "unit": "percent"
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 18, "y": 0},
        "id": 3,
        "options": {
          "colorMode": "value",
          "reduceOptions": {"calcs": ["lastNotNull"]}
        },
        "targets": [
          {
            "expr": "(sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100) or vector(0)",
            "refId": "A"
          }
        ],
        "title": "🚨 Error Rate",
        "type": "stat"
      },
      {
        "datasource": "Prometheus",
        "fieldConfig": {
          "defaults": {
            "color": {"mode": "palette-classic"},
            "unit": "percent",
            "min": 0,
            "max": 100
          },
          "overrides": [
            {"matcher": {"id": "byName", "options": "CPU Usage"}, "properties": [{"id": "color", "value": {"fixedColor": "red", "mode": "fixed"}}]},
            {"matcher": {"id": "byName", "options": "Memory Usage"}, "properties": [{"id": "color", "value": {"fixedColor": "blue", "mode": "fixed"}}]}
          ]
        },
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8},
        "id": 4,
        "targets": [
          {
            "expr": "100 - (avg(rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100) or vector(0)",
            "legendFormat": "CPU Usage",
            "refId": "A"
          },
          {
            "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 or vector(0)",
            "legendFormat": "Memory Usage", 
            "refId": "B"
          }
        ],
        "title": "💻 System Resources",
        "type": "timeseries"
      },
      {
        "datasource": "Prometheus",
        "fieldConfig": {
          "defaults": {
            "color": {"mode": "palette-classic"}
          }
        },
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8},
        "id": 5,
        "options": {
          "pieType": "pie",
          "reduceOptions": {"calcs": ["lastNotNull"]}
        },
        "targets": [
          {
            "expr": "sum by (status) (increase(http_requests_total[1h])) or vector(0)",
            "legendFormat": "HTTP {{status}}",
            "refId": "A"
          }
        ],
        "title": "📊 HTTP Status Distribution (1h)",
        "type": "piechart"
      },
      {
        "datasource": "Prometheus",
        "fieldConfig": {
          "defaults": {
            "color": {"mode": "palette-classic"},
            "unit": "reqps"
          }
        },
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": 16},
        "id": 6,
        "targets": [
          {
            "expr": "sum by (route) (rate(http_requests_total[5m])) > 0",
            "legendFormat": "{{route}}",
            "refId": "A"
          }
        ],
        "title": "🛣️ Request Rate by Route",
        "type": "timeseries"
      },
      {
        "datasource": "Prometheus",
        "fieldConfig": {
          "defaults": {
            "color": {"mode": "palette-classic"},
            "unit": "ms"
          }
        },
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 24},
        "id": 7,
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum by (route, le) (rate(http_request_duration_seconds_bucket[5m]))) * 1000 > 0",
            "legendFormat": "P95 {{route}}",
            "refId": "A"
          },
          {
            "expr": "histogram_quantile(0.50, sum by (route, le) (rate(http_request_duration_seconds_bucket[5m]))) * 1000 > 0",
            "legendFormat": "P50 {{route}}",
            "refId": "B"
          }
        ],
        "title": "⏱️ Response Time by Route",
        "type": "timeseries"
      },
      {
        "datasource": "Prometheus",
        "fieldConfig": {
          "defaults": {
            "color": {"mode": "thresholds"},
            "thresholds": {
              "steps": [
                {"color": "red", "value": null},
                {"color": "yellow", "value": 80},
                {"color": "green", "value": 95}
              ]
            },
            "unit": "percent",
            "min": 0,
            "max": 100
          }
        },
        "gridPos": {"h": 4, "w": 6, "x": 12, "y": 24},
        "id": 8,
        "targets": [
          {
            "expr": "(redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total) * 100) or vector(0)",
            "refId": "A"
          }
        ],
        "title": "⚡ Redis Hit Rate",
        "type": "gauge"
      },
      {
        "datasource": "Prometheus",
        "fieldConfig": {
          "defaults": {
            "color": {"mode": "thresholds"},
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 50},
                {"color": "red", "value": 80}
              ]
            }
          }
        },
        "gridPos": {"h": 4, "w": 6, "x": 18, "y": 24},
        "id": 9,
        "options": {
          "colorMode": "value",
          "reduceOptions": {"calcs": ["lastNotNull"]}
        },
        "targets": [
          {
            "expr": "pg_stat_database_numbackends{datname=\"mono\"} or vector(0)",
            "refId": "A"
          }
        ],
        "title": "🗄️ DB Connections",
        "type": "stat"
      },
      {
        "datasource": "Prometheus",
        "fieldConfig": {
          "defaults": {
            "color": {"mode": "thresholds"},
            "thresholds": {
              "steps": [
                {"color": "red", "value": null},
                {"color": "yellow", "value": 3},
                {"color": "green", "value": 5}
              ]
            },
            "mappings": []
          }
        },
        "gridPos": {"h": 4, "w": 6, "x": 12, "y": 28},
        "id": 10,
        "options": {
          "colorMode": "value",
          "reduceOptions": {"calcs": ["lastNotNull"]}
        },
        "targets": [
          {
            "expr": "count(up == 1)",
            "refId": "A"
          }
        ],
        "title": "🔧 Services Up",
        "type": "stat"
      },
      {
        "datasource": "Prometheus",
        "fieldConfig": {
          "defaults": {
            "color": {"mode": "thresholds"},
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 100000000},
                {"color": "red", "value": 200000000}
              ]
            },
            "unit": "bytes"
          }
        },
        "gridPos": {"h": 4, "w": 6, "x": 18, "y": 28},
        "id": 11,
        "options": {
          "colorMode": "value",
          "reduceOptions": {"calcs": ["lastNotNull"]}
        },
        "targets": [
          {
            "expr": "process_resident_memory_bytes{job=\"mono-api\"} or vector(0)",
            "refId": "A"
          }
        ],
        "title": "💾 API Memory Usage",
        "type": "stat"
      }
    ],
    "schemaVersion": 27,
    "style": "dark",
    "uid": "mono-homepage",
    "version": 0
  },
  "overwrite": true
}'

response=$(grafana_api POST "/api/dashboards/db" "$fixed_dashboard")

if echo "$response" | grep -q '"status":"success"'; then
    echo "✅ Color mode error fixed successfully!"
    echo "🎯 Dashboard updated with valid color configurations"
else
    echo "❌ Failed to fix dashboard"
    echo "Response: $response"
fi

echo ""
echo "🚀 Please refresh your Grafana page: http://localhost:5005"
echo "✨ The error should now be resolved!"