# itellico Mono Monitoring Setup

This document explains the complete monitoring infrastructure for itellico Mono using Prometheus and Grafana.

## Overview

The itellico Mono uses a comprehensive monitoring stack:
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Fastify Metrics**: Custom application metrics
- **Node Exporter**: System metrics
- **cAdvisor**: Container metrics

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  Fastify API    │────▶│  Prometheus  │────▶│   Grafana   │
│  (Port 3001)    │     │  (Port 9090) │     │ (Port 3005) │
└─────────────────┘     └──────────────┘     └─────────────┘
        │                       ▲                     │
        │                       │                     │
        └── /metrics ───────────┘                     │
                                                      │
                                              ┌───────▼────────┐
                                              │   Dashboards   │
                                              └────────────────┘
```

## Quick Start

### 1. Start the Monitoring Stack

```bash
# Start all services including Prometheus and Grafana
docker compose -f docker-compose.services.yml up -d

# Verify services are running
docker compose -f docker-compose.services.yml ps
```

### 2. Access Monitoring Tools

- **Grafana**: http://localhost:5005 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Fastify Metrics**: http://localhost:3001/metrics

### 3. Start Your Fastify API

```bash
# From the apps/api directory
pnpm run dev
```

## Metrics Exposed

### HTTP Metrics
- `http_request_duration_seconds`: Request duration histogram
- `http_requests_total`: Total number of requests
- Labels: method, route, status_code, tenant_id

### Database Metrics
- `database_query_duration_seconds`: Query execution time
- `database_queries_total`: Total number of queries
- Labels: operation, model, tenant_id

### Business Metrics
- `mono_users_total`: Total users by tenant and status
- `mono_tenants_total`: Total tenants by status
- `mono_subscriptions_total`: Active subscriptions by plan and tenant
- `active_sessions_total`: Current active sessions

### System Metrics (via Node Exporter)
- CPU usage
- Memory usage
- Disk I/O
- Network traffic

## Grafana Dashboards

Four pre-configured dashboards are included:

### 1. itellico Mono Overview
- Overall system health
- Request rate and response times
- Error rates
- Active sessions
- CPU and memory usage

### 2. Fastify API Metrics
- Detailed API performance
- Route-specific metrics
- Top 10 routes by traffic
- Request distribution by method

### 3. PostgreSQL Metrics
- Database operation rates
- Query duration percentiles
- Operations by model and type
- Slow query analysis

### 4. Redis Metrics
- Cache hit rate
- Memory usage
- Client connections
- Key statistics

## Custom Metrics Integration

### Adding New Metrics

1. Import metrics in your service:
```typescript
import { 
  httpRequestDuration,
  businessMetrics 
} from './plugins/prometheus.js';
```

2. Record custom metrics:
```typescript
// Increment a counter
businessMetrics.usersTotal
  .labels(tenantId, 'active')
  .inc();

// Observe a histogram value
httpRequestDuration
  .labels(method, route, statusCode, tenantId)
  .observe(duration);
```

### Creating Custom Dashboards

1. Access Grafana at http://localhost:5005
2. Create a new dashboard
3. Add panels with Prometheus queries
4. Save and export as JSON
5. Place in `docker/grafana/dashboards/`

## Prometheus Queries Examples

### Request Rate
```promql
rate(http_requests_total{job="mono-api"}[1m])
```

### 95th Percentile Response Time
```promql
histogram_quantile(0.95, 
  sum(rate(http_request_duration_seconds_bucket{job="mono-api"}[5m])) 
  by (le)
) * 1000
```

### Error Rate
```promql
(sum(rate(http_requests_total{job="mono-api",status_code=~"5.."}[5m])) 
/ sum(rate(http_requests_total{job="mono-api"}[5m]))) * 100
```

### Database Operations by Model
```promql
sum(rate(database_queries_total{job="mono-api"}[1m])) by (model)
```

## Alerting Configuration

Prometheus alert rules can be added in `docker/prometheus/rules/`:

```yaml
groups:
  - name: mono_alerts
    rules:
      - alert: HighErrorRate
        expr: |
          (sum(rate(http_requests_total{job="mono-api",status_code=~"5.."}[5m])) 
          / sum(rate(http_requests_total{job="mono-api"}[5m]))) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High error rate detected
          description: "Error rate is {{ $value | humanizePercentage }}"
```

## Performance Optimization

### 1. Metric Cardinality
- Limit label values to prevent metric explosion
- Use tenant_id carefully in multi-tenant environments
- Aggregate where possible

### 2. Scrape Intervals
- API metrics: 5s (high-frequency)
- Database metrics: 30s (medium-frequency)
- System metrics: 15s (standard)

### 3. Retention
- Default: 30 days
- Adjust in prometheus.yml if needed

## Troubleshooting

### Metrics Not Appearing
1. Check Fastify API is running: `curl http://localhost:3001/api/v1/public/health`
2. Verify metrics endpoint: `curl http://localhost:3001/metrics`
3. Check Prometheus targets: http://localhost:9090/targets

### Grafana Dashboard Issues
1. Verify datasource configuration
2. Check Prometheus is accessible from Grafana
3. Ensure time range is appropriate

### High Memory Usage
1. Review metric cardinality
2. Adjust retention period
3. Consider downsampling for long-term storage

## Security Considerations

1. **Metrics Endpoint**: Consider protecting `/metrics` in production
2. **Grafana Access**: Change default admin password
3. **Network Isolation**: Use internal networks for metric collection
4. **Tenant Isolation**: Ensure metrics don't leak cross-tenant data

## Integration with Next.js Monitoring Page

The Next.js monitoring page at `/admin/monitoring` provides a high-level overview and embeds Grafana dashboards. It fetches summary metrics from the API and displays them alongside embedded Grafana visualizations.

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Fastify Metrics Best Practices](https://www.fastify.io/docs/latest/Guides/Monitoring/)