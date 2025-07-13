# Database Schema Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the new database schema with UUID primary keys, audit trails, and caching infrastructure.

## Pre-Deployment Checklist

### 1. Backup Current Database
```bash
# Create full backup
pg_dump -h localhost -U postgres -d mono_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
pg_restore --list backup_*.sql | head -20
```

### 2. Test Migration Scripts
```bash
# Run on test database first
export DATABASE_URL="postgresql://user:pass@localhost:5433/mono_test"
pnpm prisma migrate deploy --preview-feature

# Run all tests
pnpm test:integration
pnpm test:performance
```

### 3. Resource Planning
- **Database**: Ensure 2x current storage for migration
- **Redis**: Allocate 2GB minimum for permission cache
- **CPU**: Migration may spike CPU usage to 80%
- **Downtime**: Plan for 15-30 minute maintenance window

## Deployment Steps

### Phase 1: Infrastructure Setup (Zero Downtime)

#### 1.1 Deploy Redis Cache
```bash
# Deploy Redis with persistence
docker-compose -f docker-compose.prod.yml up -d redis

# Verify Redis
redis-cli ping
redis-cli INFO server
```

#### 1.2 Create Audit Database Partitions
```sql
-- Connect to production database
psql -U postgres -d mono_prod

-- Run partition setup
\i scripts/migrations/03-add-audit-tables.sql

-- Verify partitions
SELECT 
  schemaname,
  tablename 
FROM pg_tables 
WHERE tablename LIKE 'audit_logs_%'
ORDER BY tablename;
```

### Phase 2: Schema Migration (Maintenance Window)

#### 2.1 Enable Maintenance Mode
```bash
# Set maintenance mode in application
echo "MAINTENANCE_MODE=true" >> .env.production

# Deploy maintenance page
kubectl set image deployment/web web=mono-web:maintenance

# Verify all connections drained
watch -n 1 'netstat -an | grep :3000 | grep ESTABLISHED | wc -l'
```

#### 2.2 Run Migration Scripts
```bash
# Execute migrations in order
psql -U postgres -d mono_prod -f scripts/migrations/01-add-uuid-fields.sql
psql -U postgres -d mono_prod -f scripts/migrations/02-add-indexes.sql
psql -U postgres -d mono_prod -f scripts/migrations/03-add-audit-tables.sql
psql -U postgres -d mono_prod -f scripts/migrations/04-add-permission-tables.sql
psql -U postgres -d mono_prod -f scripts/migrations/05-reorder-columns.sql
psql -U postgres -d mono_prod -f scripts/migrations/06-add-constraints.sql

# Run Prisma migrations
pnpm prisma migrate deploy

# Verify migration status
pnpm prisma migrate status
```

#### 2.3 Data Migration
```bash
# Populate UUIDs for existing records
pnpm tsx scripts/migrations/populate-uuids.ts

# Verify UUID population
psql -U postgres -d mono_prod -c "
  SELECT COUNT(*) as missing_uuids 
  FROM users 
  WHERE uuid IS NULL
"
```

#### 2.4 Create Initial Cache Entries
```bash
# Warm permission cache
pnpm tsx scripts/migrations/warm-permission-cache.ts

# Verify cache
redis-cli KEYS "perm:*" | head -10
```

### Phase 3: Application Deployment

#### 3.1 Deploy Updated Services
```bash
# Build new images
docker build -t mono-api:v2.0.0 -f apps/api/Dockerfile .
docker build -t mono-web:v2.0.0 -f apps/web/Dockerfile .

# Deploy API first (supports both old and new)
kubectl set image deployment/api api=mono-api:v2.0.0

# Wait for API health checks
kubectl wait --for=condition=ready pod -l app=api --timeout=300s

# Deploy frontend
kubectl set image deployment/web web=mono-web:v2.0.0
```

#### 3.2 Disable Maintenance Mode
```bash
# Remove maintenance flag
sed -i '/MAINTENANCE_MODE/d' .env.production

# Restart services
kubectl rollout restart deployment/api deployment/web
```

### Phase 4: Post-Deployment Validation

#### 4.1 Health Checks
```bash
# API health
curl https://api.example.com/health

# Database connections
psql -U postgres -d mono_prod -c "
  SELECT COUNT(*) 
  FROM pg_stat_activity 
  WHERE datname = 'mono_prod'
"

# Redis connections
redis-cli CLIENT LIST
```

#### 4.2 Performance Validation
```bash
# Run performance tests against production
pnpm tsx scripts/validate-production-performance.ts

# Check key metrics
curl https://api.example.com/metrics | grep -E "(uuid_lookup|cache_hit|permission_check)"
```

#### 4.3 Audit System Verification
```sql
-- Check audit logs are being created
SELECT 
  category,
  COUNT(*) as events,
  MAX(created_at) as latest
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY category;

-- Verify partitioning is working
SELECT 
  tablename,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename LIKE 'audit_logs_%'
ORDER BY tablename DESC
LIMIT 5;
```

## Rollback Plan

### Immediate Rollback (< 30 minutes)
```bash
# 1. Re-enable maintenance mode
echo "MAINTENANCE_MODE=true" >> .env.production

# 2. Restore database from backup
pg_restore -h localhost -U postgres -d mono_prod backup_*.sql

# 3. Deploy previous version
kubectl set image deployment/api api=mono-api:v1.9.0
kubectl set image deployment/web web=mono-web:v1.9.0

# 4. Clear Redis cache
redis-cli FLUSHDB

# 5. Disable maintenance mode
sed -i '/MAINTENANCE_MODE/d' .env.production
```

### Gradual Rollback (> 30 minutes)
If significant data has been created post-migration:

```sql
-- 1. Keep UUID fields but make optional
ALTER TABLE users ALTER COLUMN uuid DROP NOT NULL;

-- 2. Update application to handle both patterns
-- Deploy hybrid version that works with/without UUIDs

-- 3. Gradually migrate back if needed
```

## Monitoring Post-Deployment

### Key Metrics to Watch
```yaml
# Prometheus queries
- name: UUID Lookup Performance
  query: histogram_quantile(0.95, rate(db_query_duration_seconds_bucket{query_type="uuid_lookup"}[5m]))
  warning: > 0.01  # > 10ms
  critical: > 0.02 # > 20ms

- name: Cache Hit Rate
  query: rate(cache_hits_total[5m]) / rate(cache_requests_total[5m])
  warning: < 0.9   # < 90%
  critical: < 0.8  # < 80%

- name: Audit Log Growth
  query: rate(audit_logs_created_total[1h])
  warning: > 10000 # > 10k/hour
  critical: > 50000 # > 50k/hour
```

### Grafana Dashboards
Import the following dashboards:
- `dashboards/database-performance.json`
- `dashboards/cache-metrics.json`
- `dashboards/audit-system.json`

### Alert Configuration
```yaml
# alerts/database.yml
groups:
  - name: database_performance
    interval: 30s
    rules:
      - alert: HighUUIDLookupLatency
        expr: db_uuid_lookup_p95 > 0.02
        for: 5m
        
      - alert: LowCacheHitRate
        expr: cache_hit_rate < 0.9
        for: 10m
        
      - alert: AuditPartitionSize
        expr: pg_table_size_bytes{table=~"audit_logs_.*"} > 10737418240
        for: 30m
```

## Optimization Tasks (Post-Deployment)

### Week 1
- [ ] Analyze slow query logs
- [ ] Adjust cache TTLs based on hit rates
- [ ] Review audit log retention policy
- [ ] Optimize permission check queries

### Week 2
- [ ] Create missing indexes based on usage
- [ ] Implement cache warming for cold starts
- [ ] Set up automated partition management
- [ ] Performance baseline documentation

### Month 1
- [ ] Full performance review
- [ ] Capacity planning update
- [ ] Documentation updates
- [ ] Team training on new patterns

## Troubleshooting

### Common Issues

#### 1. UUID Generation Failures
```sql
-- Check if gen_random_uuid() is available
SELECT gen_random_uuid();

-- If not, enable extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

#### 2. Cache Connection Issues
```bash
# Check Redis connectivity
redis-cli -h redis.prod ping

# Verify Redis memory
redis-cli INFO memory

# Clear cache if corrupted
redis-cli FLUSHDB
```

#### 3. Slow Permission Checks
```sql
-- Check permission query plan
EXPLAIN ANALYZE
SELECT p.name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.uuid = '...'
AND ur.valid_until > NOW();

-- Update statistics if needed
ANALYZE users, user_roles, role_permissions, permissions;
```

#### 4. Audit Partition Issues
```sql
-- Check partition constraints
SELECT 
  conname,
  pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'audit_logs_2024_01'::regclass;

-- Manually create missing partition
CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

## Success Criteria

### Deployment is successful when:
1. ✅ All health checks pass
2. ✅ UUID lookups P95 < 10ms
3. ✅ Cache hit rate > 90%
4. ✅ No increase in error rates
5. ✅ Audit logs capturing all changes
6. ✅ All integration tests pass
7. ✅ No customer-reported issues

## Contact Information

### Escalation Path
1. **On-Call Engineer**: Check PagerDuty
2. **Database Team**: #database-team on Slack
3. **Platform Team**: #platform-team on Slack
4. **Incident Commander**: Via incident response system

### Key Documentation
- Migration Scripts: `/scripts/migrations/`
- Performance Baselines: `/docs/database/performance-baseline.md`
- Architecture Decisions: `/docs/database/schema-audit-report.md`
- Runbooks: `/docs/runbooks/database-operations.md`