-- Migration: Add Permission Cache Tables
-- This script creates tables for multi-level permission caching
-- Supports L3 (PostgreSQL) cache layer with metadata tracking

BEGIN;

-- ==================== PERMISSION CACHE TABLE ====================
CREATE TABLE IF NOT EXISTS permission_cache (
  -- Identifiers
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id SERIAL UNIQUE,
  
  -- Cache key
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  namespace VARCHAR(50) NOT NULL DEFAULT 'permissions',
  
  -- Scope
  user_id INTEGER NOT NULL,
  tenant_id INTEGER NOT NULL,
  context VARCHAR(50) NOT NULL, -- platform|tenant|account|user
  
  -- Cached data
  permissions TEXT[] NOT NULL, -- Array of permission strings
  roles INTEGER[] NOT NULL,    -- Array of role IDs
  metadata JSONB DEFAULT '{}',
  
  -- Cache control
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  
  -- Version control
  version INTEGER DEFAULT 1,
  hash VARCHAR(64) NOT NULL, -- SHA256 of permissions
  
  -- Redis sync
  in_redis BOOLEAN DEFAULT false,
  redis_key VARCHAR(255),
  redis_ttl INTEGER,
  
  -- Foreign keys
  CONSTRAINT fk_cache_user FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE CASCADE,
  CONSTRAINT fk_cache_tenant FOREIGN KEY (tenant_id) REFERENCES "Tenant"(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_cache_user_tenant ON permission_cache(user_id, tenant_id);
CREATE INDEX idx_cache_expires ON permission_cache(expires_at);
CREATE INDEX idx_cache_accessed ON permission_cache(last_accessed);
CREATE INDEX idx_cache_context ON permission_cache(context, tenant_id);

-- ==================== CACHE INVALIDATION LOG ====================
CREATE TABLE IF NOT EXISTS cache_invalidation_log (
  -- Identifiers
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id BIGSERIAL UNIQUE,
  
  -- Invalidation target
  target_type VARCHAR(50) NOT NULL, -- user|role|permission|tenant|global
  target_id VARCHAR(255) NOT NULL,
  pattern VARCHAR(255),            -- Wildcard pattern used
  
  -- Metadata
  reason TEXT NOT NULL,
  invalidated_by INTEGER,
  invalidated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Processing
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  keys_invalidated INTEGER DEFAULT 0,
  
  -- Foreign keys
  CONSTRAINT fk_invalidation_user FOREIGN KEY (invalidated_by) REFERENCES "User"(id)
);

-- Indexes
CREATE INDEX idx_invalidation_target ON cache_invalidation_log(target_type, target_id);
CREATE INDEX idx_invalidation_processed ON cache_invalidation_log(processed, invalidated_at)
  WHERE processed = false;

-- ==================== CACHE WARMUP QUEUE ====================
CREATE TABLE IF NOT EXISTS cache_warmup_queue (
  -- Identifiers
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id SERIAL UNIQUE,
  
  -- Target
  user_id INTEGER NOT NULL,
  tenant_id INTEGER NOT NULL,
  priority INTEGER DEFAULT 0, -- Higher = more important
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending|processing|completed|failed
  attempts INTEGER DEFAULT 0,
  
  -- Timing
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Error tracking
  last_error TEXT,
  
  -- Foreign keys
  CONSTRAINT fk_warmup_user FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE CASCADE,
  CONSTRAINT fk_warmup_tenant FOREIGN KEY (tenant_id) REFERENCES "Tenant"(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_warmup_status_priority ON cache_warmup_queue(status, priority DESC)
  WHERE status = 'pending';
CREATE INDEX idx_warmup_user_tenant ON cache_warmup_queue(user_id, tenant_id);

-- ==================== CACHE METRICS TABLE ====================
CREATE TABLE IF NOT EXISTS cache_metrics (
  -- Identifiers
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dimensions
  metric_date DATE NOT NULL,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  cache_level VARCHAR(10) NOT NULL, -- L1|L2|L3
  operation VARCHAR(50) NOT NULL,   -- get|set|invalidate|miss
  
  -- Metrics
  request_count BIGINT DEFAULT 0,
  hit_count BIGINT DEFAULT 0,
  miss_count BIGINT DEFAULT 0,
  error_count BIGINT DEFAULT 0,
  
  -- Performance
  avg_latency_ms FLOAT,
  p95_latency_ms FLOAT,
  p99_latency_ms FLOAT,
  
  -- Size metrics
  keys_count INTEGER,
  memory_bytes BIGINT,
  
  -- Computed
  hit_rate FLOAT GENERATED ALWAYS AS (
    CASE 
      WHEN (hit_count + miss_count) > 0 
      THEN (hit_count::FLOAT / (hit_count + miss_count)) * 100
      ELSE 0 
    END
  ) STORED,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT uq_cache_metrics UNIQUE (metric_date, hour, cache_level, operation)
);

-- Indexes
CREATE INDEX idx_cache_metrics_date ON cache_metrics(metric_date DESC);
CREATE INDEX idx_cache_metrics_level ON cache_metrics(cache_level, metric_date DESC);

-- ==================== CACHE CONFIGURATION ====================
CREATE TABLE IF NOT EXISTS cache_configuration (
  -- Identifiers
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id SERIAL UNIQUE,
  
  -- Configuration scope
  entity_type VARCHAR(50) NOT NULL, -- user|role|permission|global
  entity_id INTEGER,
  tenant_id INTEGER,
  
  -- TTL settings (seconds)
  l1_ttl INTEGER DEFAULT 60,      -- Memory cache
  l2_ttl INTEGER DEFAULT 3600,    -- Redis cache
  l3_ttl INTEGER DEFAULT 86400,   -- Database cache
  
  -- Size limits
  max_permissions INTEGER DEFAULT 1000,
  max_cache_size_kb INTEGER DEFAULT 1024,
  
  -- Features
  auto_warm BOOLEAN DEFAULT true,
  compress_data BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by INTEGER,
  
  -- Foreign keys
  CONSTRAINT fk_cache_config_tenant FOREIGN KEY (tenant_id) REFERENCES "Tenant"(id),
  CONSTRAINT fk_cache_config_creator FOREIGN KEY (created_by) REFERENCES "User"(id),
  
  -- Unique constraint
  CONSTRAINT uq_cache_config UNIQUE (entity_type, entity_id, tenant_id)
);

-- ==================== FUNCTIONS ====================

-- Function to update cache access statistics
CREATE OR REPLACE FUNCTION update_cache_access_stats()
RETURNS TRIGGER AS $$
BEGIN
  NEW.access_count = OLD.access_count + 1;
  NEW.last_accessed = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic access count update
CREATE TRIGGER trigger_cache_access_update
BEFORE UPDATE ON permission_cache
FOR EACH ROW
WHEN (OLD.permissions IS NOT DISTINCT FROM NEW.permissions)
EXECUTE FUNCTION update_cache_access_stats();

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM permission_cache
  WHERE expires_at < NOW()
  AND in_redis = false;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup
  INSERT INTO cache_invalidation_log (
    target_type,
    target_id,
    reason,
    keys_invalidated
  ) VALUES (
    'global',
    'expired',
    'Automatic cleanup of expired cache entries',
    deleted_count
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get cache statistics
CREATE OR REPLACE FUNCTION get_cache_stats(
  p_tenant_id INTEGER DEFAULT NULL,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  total_entries BIGINT,
  active_entries BIGINT,
  expired_entries BIGINT,
  avg_hit_rate FLOAT,
  avg_access_count FLOAT,
  total_invalidations BIGINT,
  cache_size_mb FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_entries,
    COUNT(*) FILTER (WHERE expires_at > NOW())::BIGINT as active_entries,
    COUNT(*) FILTER (WHERE expires_at <= NOW())::BIGINT as expired_entries,
    AVG(CASE WHEN access_count > 0 THEN 100.0 ELSE 0 END) as avg_hit_rate,
    AVG(access_count)::FLOAT as avg_access_count,
    (SELECT COUNT(*) FROM cache_invalidation_log 
     WHERE invalidated_at > NOW() - INTERVAL '1 day' * p_days)::BIGINT as total_invalidations,
    (pg_total_relation_size('permission_cache') / 1024.0 / 1024.0)::FLOAT as cache_size_mb
  FROM permission_cache
  WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
  AND computed_at > NOW() - INTERVAL '1 day' * p_days;
END;
$$ LANGUAGE plpgsql;

-- ==================== MATERIALIZED VIEW FOR ANALYTICS ====================
CREATE MATERIALIZED VIEW IF NOT EXISTS cache_analytics_daily AS
SELECT 
  DATE_TRUNC('day', computed_at) as day,
  tenant_id,
  context,
  COUNT(*) as total_entries,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(access_count) as avg_access_count,
  AVG(array_length(permissions, 1)) as avg_permissions_count,
  SUM(CASE WHEN expires_at > NOW() THEN 1 ELSE 0 END) as active_entries,
  AVG(EXTRACT(EPOCH FROM (expires_at - computed_at))) / 3600 as avg_ttl_hours
FROM permission_cache
GROUP BY 1, 2, 3
WITH DATA;

-- Index for materialized view
CREATE INDEX idx_cache_analytics_day ON cache_analytics_daily(day DESC);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_cache_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY cache_analytics_daily;
END;
$$ LANGUAGE plpgsql;

-- ==================== INITIAL DATA ====================

-- Default cache configurations
INSERT INTO cache_configuration (entity_type, entity_id, l1_ttl, l2_ttl, l3_ttl)
VALUES 
  ('global', NULL, 60, 3600, 86400),
  ('role', NULL, 60, 86400, 604800),    -- Roles cached longer
  ('permission', NULL, 60, 604800, 2592000); -- Permissions rarely change

-- ==================== GRANTS ====================
-- Adjust based on your application users
-- GRANT SELECT, INSERT, UPDATE ON permission_cache TO app_user;
-- GRANT SELECT ON cache_analytics_daily TO readonly_user;

COMMIT;

-- ==================== ROLLBACK SCRIPT ====================
-- Save as rollback-04-remove-cache-tables.sql

/*
BEGIN;

DROP TABLE IF EXISTS cache_configuration CASCADE;
DROP TABLE IF EXISTS cache_metrics CASCADE;
DROP TABLE IF EXISTS cache_warmup_queue CASCADE;
DROP TABLE IF EXISTS cache_invalidation_log CASCADE;
DROP TABLE IF EXISTS permission_cache CASCADE;

DROP MATERIALIZED VIEW IF EXISTS cache_analytics_daily;

DROP FUNCTION IF EXISTS update_cache_access_stats();
DROP FUNCTION IF EXISTS clean_expired_cache();
DROP FUNCTION IF EXISTS get_cache_stats(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS refresh_cache_analytics();

COMMIT;
*/