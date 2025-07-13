#!/bin/bash

# Create a comprehensive Grafana homepage dashboard for Mono Platform
# This will be set as the default home dashboard

set -e

echo "🏠 Creating Mono Platform Grafana Homepage"
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
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

echo -e "${BLUE}📊 Creating comprehensive homepage dashboard...${NC}"

# Create the comprehensive homepage dashboard
homepage_dashboard='{
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
    "templating": {
      "list": []
    },
    "annotations": {
      "list": [
        {
          "builtIn": 1,
          "datasource": "-- Grafana --",
          "enable": true,
          "hide": true,
          "iconColor": "rgba(0, 211, 255, 1)",
          "name": "Annotations & Alerts",
          "type": "dashboard"
        }
      ]
    },
    "editable": true,
    "gnetId": null,
    "graphTooltip": 0,
    "links": [],
    "panels": [
      {
        "datasource": "Prometheus",
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "palette-classic"
            },
            "custom": {
              "axisLabel": "",
              "axisPlacement": "auto",
              "barAlignment": 0,
              "drawStyle": "line",
              "fillOpacity": 0,
              "gradientMode": "none",
              "hideFrom": {
                "legend": false,
                "tooltip": false,
                "vis": false
              },
              "lineInterpolation": "linear",
              "lineWidth": 1,
              "pointSize": 5,
              "scaleDistribution": {
                "type": "linear"
              },
              "showPoints": "auto",
              "spanNulls": false,
              "stacking": {
                "group": "A",
                "mode": "none"
              },
              "thresholdsStyle": {
                "mode": "off"
              }
            },
            "mappings": [],
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {
                  "color": "green",
                  "value": null
                },
                {
                  "color": "red",
                  "value": 80
                }
              ]
            }
          },
          "overrides": []
        },
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 0
        },
        "id": 1,
        "options": {
          "legend": {
            "calcs": [],
            "displayMode": "list",
            "placement": "bottom"
          },
          "tooltip": {
            "mode": "single",
            "sort": "none"
          }
        },
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m]))",
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
            "color": {
              "mode": "thresholds"
            },
            "mappings": [],
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {
                  "color": "green",
                  "value": null
                },
                {
                  "color": "yellow",
                  "value": 100
                },
                {
                  "color": "red",
                  "value": 500
                }
              ]
            },
            "unit": "ms"
          },
          "overrides": []
        },
        "gridPos": {
          "h": 8,
          "w": 6,
          "x": 12,
          "y": 0
        },
        "id": 2,
        "options": {
          "colorMode": "value",
          "graphMode": "area",
          "justifyMode": "auto",
          "orientation": "auto",
          "reduceOptions": {
            "calcs": [
              "lastNotNull"
            ],
            "fields": "",
            "values": false
          },
          "textMode": "auto"
        },
        "pluginVersion": "8.0.0",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) * 1000",
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
            "color": {
              "mode": "thresholds"
            },
            "mappings": [],
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {
                  "color": "green",
                  "value": null
                },
                {
                  "color": "yellow",
                  "value": 2
                },
                {
                  "color": "red",
                  "value": 5
                }
              ]
            },
            "unit": "percent"
          },
          "overrides": []
        },
        "gridPos": {
          "h": 8,
          "w": 6,
          "x": 18,
          "y": 0
        },
        "id": 3,
        "options": {
          "colorMode": "value",
          "graphMode": "area",
          "justifyMode": "auto",
          "orientation": "auto",
          "reduceOptions": {
            "calcs": [
              "lastNotNull"
            ],
            "fields": "",
            "values": false
          },
          "textMode": "auto"
        },
        "pluginVersion": "8.0.0",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100",
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
            "color": {
              "mode": "palette-classic"
            },
            "custom": {
              "axisLabel": "",
              "axisPlacement": "auto",
              "barAlignment": 0,
              "drawStyle": "line",
              "fillOpacity": 10,
              "gradientMode": "none",
              "hideFrom": {
                "legend": false,
                "tooltip": false,
                "vis": false
              },
              "lineInterpolation": "linear",
              "lineWidth": 2,
              "pointSize": 5,
              "scaleDistribution": {
                "type": "linear"
              },
              "showPoints": "never",
              "spanNulls": false,
              "stacking": {
                "group": "A",
                "mode": "none"
              },
              "thresholdsStyle": {
                "mode": "off"
              }
            },
            "mappings": [],
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {
                  "color": "green",
                  "value": null
                }
              ]
            },
            "unit": "percent"
          },
          "overrides": [
            {
              "matcher": {
                "id": "byName",
                "options": "CPU Usage"
              },
              "properties": [
                {
                  "id": "color",
                  "value": {
                    "fixedColor": "red",
                    "mode": "fixed"
                  }
                }
              ]
            },
            {
              "matcher": {
                "id": "byName",
                "options": "Memory Usage"
              },
              "properties": [
                {
                  "id": "color",
                  "value": {
                    "fixedColor": "blue",
                    "mode": "fixed"
                  }
                }
              ]
            }
          ]
        },
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 8
        },
        "id": 4,
        "options": {
          "legend": {
            "calcs": [
              "last"
            ],
            "displayMode": "table",
            "placement": "right"
          },
          "tooltip": {
            "mode": "multi",
            "sort": "none"
          }
        },
        "targets": [
          {
            "expr": "100 - (avg(rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU Usage",
            "refId": "A"
          },
          {
            "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
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
            "color": {
              "mode": "palette-classic"
            },
            "custom": {
              "hideFrom": {
                "legend": false,
                "tooltip": false,
                "vis": false
              }
            },
            "mappings": []
          },
          "overrides": []
        },
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 8
        },
        "id": 5,
        "options": {
          "legend": {
            "displayMode": "table",
            "placement": "right",
            "values": [
              "value"
            ]
          },
          "pieType": "pie",
          "reduceOptions": {
            "calcs": [
              "lastNotNull"
            ],
            "fields": "",
            "values": false
          },
          "tooltip": {
            "mode": "single",
            "sort": "none"
          }
        },
        "targets": [
          {
            "expr": "sum by (status) (increase(http_requests_total[1h]))",
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
            "color": {
              "mode": "palette-classic"
            },
            "custom": {
              "axisLabel": "",
              "axisPlacement": "auto",
              "barAlignment": 0,
              "drawStyle": "line",
              "fillOpacity": 10,
              "gradientMode": "none",
              "hideFrom": {
                "legend": false,
                "tooltip": false,
                "vis": false
              },
              "lineInterpolation": "linear",
              "lineWidth": 2,
              "pointSize": 5,
              "scaleDistribution": {
                "type": "linear"
              },
              "showPoints": "never",
              "spanNulls": false,
              "stacking": {
                "group": "A",
                "mode": "none"
              },
              "thresholdsStyle": {
                "mode": "off"
              }
            },
            "mappings": [],
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {
                  "color": "green",
                  "value": null
                }
              ]
            },
            "unit": "reqps"
          },
          "overrides": []
        },
        "gridPos": {
          "h": 8,
          "w": 24,
          "x": 0,
          "y": 16
        },
        "id": 6,
        "options": {
          "legend": {
            "calcs": [
              "last",
              "max"
            ],
            "displayMode": "table",
            "placement": "bottom"
          },
          "tooltip": {
            "mode": "multi",
            "sort": "desc"
          }
        },
        "targets": [
          {
            "expr": "sum by (route) (rate(http_requests_total[5m]))",
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
            "color": {
              "mode": "palette-classic"
            },
            "custom": {
              "axisLabel": "",
              "axisPlacement": "auto",
              "barAlignment": 0,
              "drawStyle": "line",
              "fillOpacity": 10,
              "gradientMode": "none",
              "hideFrom": {
                "legend": false,
                "tooltip": false,
                "vis": false
              },
              "lineInterpolation": "linear",
              "lineWidth": 2,
              "pointSize": 5,
              "scaleDistribution": {
                "type": "linear"
              },
              "showPoints": "never",
              "spanNulls": false,
              "stacking": {
                "group": "A",
                "mode": "none"
              },
              "thresholdsStyle": {
                "mode": "off"
              }
            },
            "mappings": [],
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {
                  "color": "green",
                  "value": null
                }
              ]
            },
            "unit": "ms"
          },
          "overrides": []
        },
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 24
        },
        "id": 7,
        "options": {
          "legend": {
            "calcs": [
              "last",
              "max"
            ],
            "displayMode": "table",
            "placement": "bottom"
          },
          "tooltip": {
            "mode": "multi",
            "sort": "desc"
          }
        },
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum by (route, le) (rate(http_request_duration_seconds_bucket[5m]))) * 1000",
            "legendFormat": "P95 {{route}}",
            "refId": "A"
          },
          {
            "expr": "histogram_quantile(0.50, sum by (route, le) (rate(http_request_duration_seconds_bucket[5m]))) * 1000",
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
            "color": {
              "mode": "thresholds"
            },
            "mappings": [],
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {
                  "color": "red",
                  "value": null
                },
                {
                  "color": "yellow",
                  "value": 80
                },
                {
                  "color": "green",
                  "value": 95
                }
              ]
            },
            "unit": "percent"
          },
          "overrides": []
        },
        "gridPos": {
          "h": 4,
          "w": 6,
          "x": 12,
          "y": 24
        },
        "id": 8,
        "options": {
          "orientation": "auto",
          "reduceOptions": {
            "calcs": [
              "lastNotNull"
            ],
            "fields": "",
            "values": false
          },
          "showThresholdLabels": false,
          "showThresholdMarkers": true,
          "text": {}
        },
        "pluginVersion": "8.0.0",
        "targets": [
          {
            "expr": "redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total) * 100",
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
            "color": {
              "mode": "thresholds"
            },
            "mappings": [],
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {
                  "color": "green",
                  "value": null
                },
                {
                  "color": "yellow",
                  "value": 50
                },
                {
                  "color": "red",
                  "value": 80
                }
              ]
            },
            "unit": "short"
          },
          "overrides": []
        },
        "gridPos": {
          "h": 4,
          "w": 6,
          "x": 18,
          "y": 24
        },
        "id": 9,
        "options": {
          "colorMode": "value",
          "graphMode": "area",
          "justifyMode": "auto",
          "orientation": "auto",
          "reduceOptions": {
            "calcs": [
              "lastNotNull"
            ],
            "fields": "",
            "values": false
          },
          "textMode": "auto"
        },
        "pluginVersion": "8.0.0",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends{datname=\"mono\"}",
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
            "color": {
              "mode": "thresholds"
            },
            "mappings": [],
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {
                  "color": "green",
                  "value": null
                },
                {
                  "color": "yellow",
                  "value": 5
                },
                {
                  "color": "red",
                  "value": 10
                }
              ]
            },
            "unit": "short"
          },
          "overrides": []
        },
        "gridPos": {
          "h": 4,
          "w": 6,
          "x": 12,
          "y": 28
        },
        "id": 10,
        "options": {
          "colorMode": "value",
          "graphMode": "area",
          "justifyMode": "auto",
          "orientation": "auto",
          "reduceOptions": {
            "calcs": [
              "lastNotNull"
            ],
            "fields": "",
            "values": false
          },
          "textMode": "auto"
        },
        "pluginVersion": "8.0.0",
        "targets": [
          {
            "expr": "up",
            "legendFormat": "{{job}}",
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
            "color": {
              "mode": "thresholds"
            },
            "mappings": [],
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {
                  "color": "green",
                  "value": null
                }
              ]
            },
            "unit": "bytes"
          },
          "overrides": []
        },
        "gridPos": {
          "h": 4,
          "w": 6,
          "x": 18,
          "y": 28
        },
        "id": 11,
        "options": {
          "colorMode": "value",
          "graphMode": "area",
          "justifyMode": "auto",
          "orientation": "auto",
          "reduceOptions": {
            "calcs": [
              "lastNotNull"
            ],
            "fields": "",
            "values": false
          },
          "textMode": "auto"
        },
        "pluginVersion": "8.0.0",
        "targets": [
          {
            "expr": "process_resident_memory_bytes{job=\"mono-api\"}",
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

echo "Creating homepage dashboard..."
response=$(grafana_api POST "/api/dashboards/db" "$homepage_dashboard")

if echo "$response" | grep -q '"status":"success"'; then
    dashboard_url=$(echo "$response" | jq -r '.url // ""')
    echo -e "${GREEN}✓ Homepage dashboard created successfully${NC}"
    echo "   URL: $GRAFANA_URL$dashboard_url"
    
    # Get the dashboard UID for setting as home
    dashboard_uid=$(echo "$response" | jq -r '.uid // "mono-homepage"')
    
    echo ""
    echo -e "${BLUE}🏠 Setting as default home dashboard...${NC}"
    
    # Set as home dashboard for the organization
    home_response=$(grafana_api PUT "/api/org/preferences" "{
        \"theme\": \"dark\",
        \"homeDashboardId\": 0,
        \"homeDashboardUID\": \"$dashboard_uid\",
        \"timezone\": \"browser\"
    }")
    
    if echo "$home_response" | grep -q '"message":"Preferences updated"'; then
        echo -e "${GREEN}✓ Set as default home dashboard${NC}"
    else
        echo -e "${YELLOW}⚠ Could not set as home dashboard (dashboard still created)${NC}"
        echo "Response: $home_response"
    fi
    
else
    echo -e "${RED}✗ Failed to create homepage dashboard${NC}"
    echo "Response: $response"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Grafana Homepage Setup Complete!${NC}"
echo "=================================="
echo ""
echo -e "${BLUE}📊 Access your new homepage:${NC}"
echo "   Main URL:     $GRAFANA_URL"
echo "   Direct link:  $GRAFANA_URL/d/mono-homepage"
echo "   Login:        $GRAFANA_USER / $GRAFANA_PASSWORD"
echo ""
echo -e "${BLUE}📈 Homepage includes:${NC}"
echo "   🚀 API Request Rate"
echo "   ⚡ P95 Response Time"
echo "   🚨 Error Rate"
echo "   💻 System Resources (CPU/Memory)"
echo "   📊 HTTP Status Distribution"
echo "   🛣️ Request Rate by Route"
echo "   ⏱️ Response Time by Route"
echo "   ⚡ Redis Hit Rate"
echo "   🗄️ Database Connections"
echo "   🔧 Services Status"
echo "   💾 API Memory Usage"
echo ""
echo -e "${YELLOW}🔄 Auto-refresh: 5 seconds${NC}"
echo -e "${YELLOW}📅 Time range: Last 6 hours${NC}"
echo ""
echo -e "${GREEN}✨ Your Grafana homepage is now ready!${NC}"