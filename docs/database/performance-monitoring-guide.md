# Database Performance Monitoring Guide

## Overview

This guide provides comprehensive instructions for monitoring database performance after implementing the new schema with UUID primary keys, audit trails, and caching layers.

## Key Metrics to Monitor

### 1. Query Performance

#### UUID Lookup Performance
- **Target**: &lt;10ms P95 for indexed UUID lookups
- **Alert Threshold**: >20ms P99
- **Dashboard**: Grafana > Database Performance > UUID Queries

```sql
-- Monitor UUID lookup performance
SELECT 
  date_trunc('minute', query_start) as minute,
  substring(query, 1, 50) as query_pattern,
  count(*) as query_count,
  avg(duration) as avg_duration_ms,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY duration) as p95_ms,
  percentile_cont(0.99) WITHIN GROUP (ORDER BY duration) as p99_ms
FROM pg_stat_statements
WHERE query LIKE '%uuid = %'
GROUP BY 1, 2
ORDER BY 1 DESC;
```

#### Index Usage
```sql
-- Check index usage rates
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### 2. Cache Performance

#### Redis Cache Metrics
```javascript
// Prometheus metrics to track
const cacheMetrics = {
  // Cache hit rate (target: >90%)
  'cache_hit_rate': 'rate(cache_hits_total[5m]) / rate(cache_requests_total[5m])',
  
  // Cache latency by level
  'cache_l1_latency_p95': 'histogram_quantile(0.95, cache_latency_seconds{level="l1"})',
  'cache_l2_latency_p95': 'histogram_quantile(0.95, cache_latency_seconds{level="l2"})',
  
  // Cache invalidations
  'cache_invalidations_rate': 'rate(cache_invalidations_total[5m])',
};
```

#### Permission Cache Effectiveness
```sql
-- Monitor permission cache usage
SELECT 
  context,
  COUNT(*) as cache_entries,
  AVG(hit_count) as avg_hits,
  AVG(EXTRACT(EPOCH FROM (expires_at - NOW()))) as avg_ttl_seconds,
  SUM(CASE WHEN last_accessed > NOW() - INTERVAL '1 hour' THEN 1 ELSE 0 END) as active_last_hour
FROM permission_cache
WHERE expires_at > NOW()
GROUP BY context;
```

### 3. Audit System Performance

#### Audit Log Volume
```sql
-- Monitor audit log growth
SELECT 
  date_trunc('hour', created_at) as hour,
  category,
  COUNT(*) as events,
  pg_size_pretty(SUM(pg_column_size(metadata))) as metadata_size
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY 1, 2
ORDER BY 1 DESC, 3 DESC;
```

#### Partition Performance
```sql
-- Check partition sizes and performance
SELECT 
  child.relname as partition_name,
  pg_size_pretty(pg_relation_size(child.oid)) as size,
  CASE 
    WHEN child.relname LIKE '%' || TO_CHAR(CURRENT_DATE, 'YYYY_MM') || '%' THEN 'current'
    WHEN child.relname LIKE '%' || TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY_MM') || '%' THEN 'previous'
    ELSE 'archived'
  END as status
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
WHERE parent.relname = 'audit_logs'
ORDER BY child.relname DESC;
```

### 4. Database Health

#### Connection Pool Monitoring
```javascript
// Monitor Prisma connection pool
const poolMetrics = {
  activeConnections: prisma.$metrics.json().counters.find(m => m.key === 'prisma_pool_connections_open'),
  idleConnections: prisma.$metrics.json().counters.find(m => m.key === 'prisma_pool_connections_idle'),
  waitQueue: prisma.$metrics.json().gauges.find(m => m.key === 'prisma_pool_wait_queue_size'),
};
```

#### Table Bloat
```sql
-- Monitor table bloat
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  ROUND(100 * pg_total_relation_size(schemaname||'.'||tablename) / 
    NULLIF(pg_relation_size(schemaname||'.'||tablename), 0) - 100, 2) AS bloat_ratio
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
```

## Monitoring Setup

### 1. Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']
    
  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']
    
  - job_name: 'nodejs'
    static_configs:
      - targets: ['localhost:3001/metrics']
```

### 2. Grafana Dashboards

#### Database Performance Dashboard
```json
{
  "dashboard": {
    "title": "Database Performance - UUID Schema",
    "panels": [
      {
        "title": "UUID Lookup Performance",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(db_query_duration_seconds_bucket{query_type=\"uuid_lookup\"}[5m]))"
          }
        ]
      },
      {
        "title": "Cache Hit Rate",
        "targets": [
          {
            "expr": "rate(cache_hits_total[5m]) / rate(cache_requests_total[5m]) * 100"
          }
        ]
      }
    ]
  }
}
```

### 3. Alert Rules

```yaml
# alerts.yml
groups:
  - name: database
    rules:
      - alert: HighUUIDLookupLatency
        expr: histogram_quantile(0.99, rate(db_query_duration_seconds_bucket{query_type="uuid_lookup"}[5m])) > 0.02
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "UUID lookup latency is high"
          description: "P99 UUID lookup latency is {{ $value }}s (threshold: 20ms)"
      
      - alert: LowCacheHitRate
        expr: rate(cache_hits_total[5m]) / rate(cache_requests_total[5m]) < 0.9
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Cache hit rate below 90%"
          description: "Cache hit rate is {{ $value | humanizePercentage }}"
      
      - alert: HighAuditLogVolume
        expr: rate(audit_logs_created_total[5m]) > 1000
        for: 5m
        labels:
          severity: info
        annotations:
          summary: "High audit log volume"
          description: "Creating {{ $value }} audit logs per second"
```

## Performance Optimization Checklist

### Daily Checks
- [ ] Review UUID lookup P95/P99 latencies
- [ ] Check cache hit rates across all levels
- [ ] Monitor audit log partition sizes
- [ ] Review slow query log

### Weekly Tasks
- [ ] Analyze index usage and identify unused indexes
- [ ] Review permission check patterns
- [ ] Check table bloat ratios
- [ ] Validate partition maintenance jobs

### Monthly Tasks
- [ ] Full EXPLAIN ANALYZE on critical queries
- [ ] Review and optimize cache TTLs
- [ ] Archive old audit partitions
- [ ] Database vacuum and reindex if needed

## Custom Monitoring Scripts

### 1. Performance Test Runner
```bash
#!/bin/bash
# run-performance-tests.sh

echo "Running database performance tests..."

# Test UUID lookups
echo "Testing UUID lookup performance..."
npm run test:performance -- --testNamePattern="UUID lookup"

# Test permission checks
echo "Testing permission check performance..."
npm run test:performance -- --testNamePattern="Permission check"

# Generate report
node scripts/generate-performance-report.js
```

### 2. Cache Analysis Script
```typescript
// scripts/analyze-cache.ts
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';

const redis = new Redis();
const prisma = new PrismaClient();

async function analyzeCacheEffectiveness() {
  // Get cache statistics
  const info = await redis.info('stats');
  const keyspace = await redis.info('keyspace');
  
  // Analyze permission cache
  const permCacheStats = await prisma.permissionCache.aggregate({
    _avg: { hitCount: true, accessCount: true },
    _count: true,
  });
  
  // Calculate effectiveness metrics
  const metrics = {
    redisHitRate: parseFloat(info.match(/keyspace_hits:(\d+)/)?.[1] || '0') /
                  (parseFloat(info.match(/keyspace_hits:(\d+)/)?.[1] || '0') +
                   parseFloat(info.match(/keyspace_misses:(\d+)/)?.[1] || '0')),
    avgCacheHits: permCacheStats._avg.hitCount,
    totalCacheEntries: permCacheStats._count,
    cacheMemoryUsage: info.match(/used_memory_human:(.+)/)?.[1],
  };
  
  console.log('Cache Effectiveness Analysis:');
  console.log(JSON.stringify(metrics, null, 2));
  
  // Recommendations
  if (metrics.redisHitRate < 0.9) {
    console.log('\n⚠️  Warning: Cache hit rate below 90%');
    console.log('Consider increasing cache TTLs or warming cache on startup');
  }
}

analyzeCacheEffectiveness().catch(console.error);
```

### 3. Query Performance Analyzer
```sql
-- Create performance analysis view
CREATE OR REPLACE VIEW query_performance_analysis AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  stddev_time,
  min_time,
  max_time,
  rows,
  100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0) AS cache_hit_ratio
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_time DESC
LIMIT 50;

-- Usage
SELECT * FROM query_performance_analysis WHERE query LIKE '%uuid%';
```

## Troubleshooting Guide

### High UUID Lookup Latency
1. Check if UUID indexes exist and are being used
2. Verify statistics are up to date: `ANALYZE table_name;`
3. Check for index bloat
4. Consider partial indexes for filtered queries

### Low Cache Hit Rate
1. Review cache TTL settings
2. Check for cache stampede issues
3. Analyze cache key patterns
4. Consider implementing cache warming

### Audit Log Performance Issues
1. Verify partitions are being created correctly
2. Check partition pruning in query plans
3. Archive old partitions
4. Consider adjusting partition size (daily vs monthly)

### Connection Pool Exhaustion
1. Review connection pool settings
2. Check for connection leaks
3. Monitor transaction duration
4. Consider connection pooling at database level

## Reporting

### Weekly Performance Report Template
```markdown
# Database Performance Report - Week of [DATE]

## Executive Summary
- Overall database health: [GREEN/YELLOW/RED]
- Average query latency: [X]ms
- Cache hit rate: [X]%
- Audit system status: [HEALTHY/DEGRADED]

## Key Metrics
| Metric | Current | Target | Status |
|--------|---------|---------|--------|
| UUID Lookup P95 | Xms | &lt;10ms | ✅/⚠️/❌ |
| Cache Hit Rate | X% | >90% | ✅/⚠️/❌ |
| Audit Log Growth | XGB/day | &lt;10GB | ✅/⚠️/❌ |

## Recommendations
1. [Action items based on metrics]
2. [Optimization opportunities]
3. [Maintenance tasks needed]
```

## Integration with APM Tools

### New Relic Integration
```javascript
// Track custom metrics
newrelic.recordMetric('Custom/Database/UUID/LookupTime', lookupDuration);
newrelic.recordMetric('Custom/Cache/HitRate', cacheHitRate);
newrelic.recordMetric('Custom/Audit/EventsPerMinute', auditEventRate);
```

### DataDog Integration
```javascript
// Custom metrics
const StatsD = require('node-dogstatsd').StatsD;
const dogstatsd = new StatsD();

// Track UUID performance
dogstatsd.histogram('database.uuid.lookup_time', duration, ['operation:findOne']);
dogstatsd.increment('cache.hits', 1, ['level:l1', 'entity:user']);
```

## Best Practices

1. **Set up automated monitoring** before issues occur
2. **Establish baselines** during normal operation
3. **Create runbooks** for common issues
4. **Regular review cycles** for metrics and thresholds
5. **Correlate metrics** across different layers
6. **Document changes** and their performance impact
7. **Test monitoring** in staging environment first