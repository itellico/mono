-- Comprehensive Audit Trail System Migration
-- This script creates all audit-related tables with proper structure

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== ENUMS ====================

-- Audit Category
CREATE TYPE audit_category AS ENUM (
  'data_change',
  'access',
  'permission',
  'system',
  'security',
  'compliance'
);

-- Audit Severity
CREATE TYPE audit_severity AS ENUM (
  'debug',
  'info',
  'warn',
  'error',
  'critical'
);

-- Audit Status
CREATE TYPE audit_status AS ENUM (
  'pending',
  'completed',
  'failed',
  'partial'
);

-- Actor Type
CREATE TYPE actor_type AS ENUM (
  'user',
  'system',
  'api',
  'scheduled',
  'external'
);

-- Security Event Type
CREATE TYPE security_event_type AS ENUM (
  'login',
  'logout',
  'failed_login',
  'password_change',
  'password_reset',
  'mfa_enabled',
  'mfa_disabled',
  'mfa_challenge',
  'account_locked',
  'suspicious_activity',
  'api_key_created',
  'api_key_revoked'
);

-- Security Severity
CREATE TYPE security_severity AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Compliance Outcome
CREATE TYPE compliance_outcome AS ENUM (
  'compliant',
  'non_compliant',
  'exception',
  'pending_review'
);

-- ==================== MAIN AUDIT LOG TABLE ====================

-- Create main audit log table (will be partitioned)
CREATE TABLE audit_logs (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id BIGSERIAL UNIQUE,
  
  -- Event Classification
  category audit_category NOT NULL DEFAULT 'data_change',
  event_type VARCHAR(50) NOT NULL,
  severity audit_severity NOT NULL DEFAULT 'info',
  
  -- Entity Information
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  entity_name VARCHAR(255),
  
  -- Actor Information
  actor_type actor_type NOT NULL DEFAULT 'user',
  actor_id UUID,
  user_id INTEGER,
  tenant_id INTEGER NOT NULL,
  account_id INTEGER,
  
  -- Request Context
  ip_address INET,
  user_agent TEXT,
  session_id UUID,
  request_id UUID,
  api_version VARCHAR(20),
  endpoint VARCHAR(255),
  http_method VARCHAR(10),
  
  -- Change Details
  operation VARCHAR(100) NOT NULL,
  changes JSONB,
  metadata JSONB,
  
  -- Security Context
  permission_used VARCHAR(255),
  mfa_verified BOOLEAN DEFAULT FALSE,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  
  -- Performance Metrics
  duration INTEGER,
  query_count INTEGER,
  
  -- Status
  status audit_status NOT NULL DEFAULT 'completed',
  error_code VARCHAR(50),
  error_message TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES "User"(id),
  CONSTRAINT fk_audit_tenant FOREIGN KEY (tenant_id) REFERENCES "Tenant"(id),
  CONSTRAINT fk_audit_account FOREIGN KEY (account_id) REFERENCES "Account"(id)
) PARTITION BY RANGE (created_at);

-- Create partitions for the next 12 months
DO $$
DECLARE
  start_date DATE;
  end_date DATE;
  partition_name TEXT;
BEGIN
  FOR i IN 0..11 LOOP
    start_date := DATE_TRUNC('month', CURRENT_DATE + (i || ' months')::INTERVAL);
    end_date := start_date + INTERVAL '1 month';
    partition_name := 'audit_logs_' || TO_CHAR(start_date, 'YYYY_MM');
    
    EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs
      FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date
    );
  END LOOP;
END $$;

-- Create indexes on main table (inherited by partitions)
CREATE INDEX idx_audit_tenant_time ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_user_time ON audit_logs(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_category_type ON audit_logs(category, event_type, created_at DESC);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_request ON audit_logs(request_id) WHERE request_id IS NOT NULL;
CREATE INDEX idx_audit_session ON audit_logs(session_id) WHERE session_id IS NOT NULL;

-- ==================== DATA ACCESS LOG ====================

CREATE TABLE data_access_logs (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id BIGSERIAL UNIQUE,
  
  -- Access Information
  user_id INTEGER NOT NULL,
  tenant_id INTEGER NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  
  -- Access Details
  access_type VARCHAR(50) NOT NULL,
  record_count INTEGER,
  fields TEXT[],
  filters JSONB,
  
  -- Context
  purpose TEXT,
  authorized BOOLEAN DEFAULT TRUE,
  
  -- Performance
  response_time INTEGER,
  data_size BIGINT,
  
  -- Timestamp
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_data_access_user FOREIGN KEY (user_id) REFERENCES "User"(id),
  CONSTRAINT fk_data_access_tenant FOREIGN KEY (tenant_id) REFERENCES "Tenant"(id)
);

-- Indexes
CREATE INDEX idx_data_access_user ON data_access_logs(user_id, accessed_at DESC);
CREATE INDEX idx_data_access_resource ON data_access_logs(resource_type, accessed_at DESC);
CREATE INDEX idx_data_access_tenant ON data_access_logs(tenant_id, accessed_at DESC);

-- ==================== SECURITY AUDIT LOG ====================

CREATE TABLE security_audit_logs (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id BIGSERIAL UNIQUE,
  
  -- Event Information
  event_type security_event_type NOT NULL,
  severity security_severity NOT NULL,
  
  -- Actor
  user_id INTEGER,
  email VARCHAR(255),
  ip_address INET NOT NULL,
  
  -- Event Details
  success BOOLEAN NOT NULL,
  failure_reason VARCHAR(255),
  attempts INTEGER DEFAULT 1,
  
  -- Threat Detection
  threat_indicators JSONB,
  geo_location JSONB,
  device_fingerprint VARCHAR(255),
  
  -- Response
  action_taken VARCHAR(255),
  alert_sent BOOLEAN DEFAULT FALSE,
  
  -- Timestamp
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_security_audit_user FOREIGN KEY (user_id) REFERENCES "User"(id)
);

-- Indexes
CREATE INDEX idx_security_user ON security_audit_logs(user_id, occurred_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_security_event ON security_audit_logs(event_type, occurred_at DESC);
CREATE INDEX idx_security_ip ON security_audit_logs(ip_address);
CREATE INDEX idx_security_severity ON security_audit_logs(severity, occurred_at DESC);

-- ==================== COMPLIANCE AUDIT LOG ====================

CREATE TABLE compliance_audit_logs (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id BIGSERIAL UNIQUE,
  
  -- Compliance Event
  regulation VARCHAR(50) NOT NULL,
  requirement VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  
  -- Subject
  subject_type VARCHAR(50) NOT NULL,
  subject_id UUID NOT NULL,
  
  -- Action
  action TEXT NOT NULL,
  outcome compliance_outcome NOT NULL,
  evidence JSONB,
  
  -- Review
  review_required BOOLEAN DEFAULT FALSE,
  reviewed_by INTEGER,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Metadata
  automated_check BOOLEAN DEFAULT TRUE,
  policy_version VARCHAR(20),
  
  -- Timestamp
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_compliance_reviewer FOREIGN KEY (reviewed_by) REFERENCES "User"(id)
);

-- Indexes
CREATE INDEX idx_compliance_regulation ON compliance_audit_logs(regulation, occurred_at DESC);
CREATE INDEX idx_compliance_outcome ON compliance_audit_logs(outcome, occurred_at DESC);
CREATE INDEX idx_compliance_review ON compliance_audit_logs(review_required) WHERE review_required = TRUE;

-- ==================== AUDIT METRICS ====================

CREATE TABLE audit_metrics (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dimensions
  tenant_id INTEGER NOT NULL,
  metric_date DATE NOT NULL,
  category audit_category NOT NULL,
  
  -- Metrics
  total_events BIGINT NOT NULL,
  unique_users INTEGER NOT NULL,
  failed_ops INTEGER NOT NULL,
  avg_duration FLOAT NOT NULL,
  
  -- Top Lists
  top_users JSONB NOT NULL,
  top_entities JSONB NOT NULL,
  top_ops JSONB NOT NULL,
  
  -- Anomalies
  anomalies JSONB,
  
  -- Metadata
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_metrics_tenant FOREIGN KEY (tenant_id) REFERENCES "Tenant"(id),
  
  -- Unique constraint
  CONSTRAINT uq_metrics_tenant_date_category UNIQUE (tenant_id, metric_date, category)
);

-- Indexes
CREATE INDEX idx_metrics_date ON audit_metrics(metric_date);

-- ==================== AUDIT RETENTION POLICY ====================

CREATE TABLE audit_retention_policies (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id SERIAL UNIQUE,
  
  -- Policy Scope
  tenant_id INTEGER,
  category audit_category NOT NULL,
  
  -- Retention Rules
  hot_days INTEGER NOT NULL DEFAULT 30,
  warm_days INTEGER NOT NULL DEFAULT 365,
  cold_days INTEGER NOT NULL DEFAULT 2555,
  
  -- Purge Rules
  purge_enabled BOOLEAN DEFAULT FALSE,
  purge_after_days INTEGER,
  
  -- Exceptions
  legal_hold BOOLEAN DEFAULT FALSE,
  exceptions JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_retention_tenant FOREIGN KEY (tenant_id) REFERENCES "Tenant"(id),
  
  -- Unique constraint
  CONSTRAINT uq_retention_tenant_category UNIQUE (tenant_id, category)
);

-- ==================== FUNCTIONS AND TRIGGERS ====================

-- Function to automatically update audit metrics
CREATE OR REPLACE FUNCTION update_audit_metrics()
RETURNS void AS $$
BEGIN
  INSERT INTO audit_metrics (
    tenant_id,
    metric_date,
    category,
    total_events,
    unique_users,
    failed_ops,
    avg_duration,
    top_users,
    top_entities,
    top_ops
  )
  SELECT 
    tenant_id,
    DATE_TRUNC('day', created_at)::DATE as metric_date,
    category,
    COUNT(*) as total_events,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_ops,
    AVG(duration) as avg_duration,
    jsonb_build_object(
      'users', (
        SELECT jsonb_agg(jsonb_build_object('user_id', user_id, 'count', cnt))
        FROM (
          SELECT user_id, COUNT(*) as cnt
          FROM audit_logs al2
          WHERE al2.tenant_id = al.tenant_id
          AND DATE_TRUNC('day', al2.created_at) = DATE_TRUNC('day', al.created_at)
          AND al2.category = al.category
          GROUP BY user_id
          ORDER BY cnt DESC
          LIMIT 10
        ) top_users
      )
    ) as top_users,
    jsonb_build_object() as top_entities,
    jsonb_build_object() as top_ops
  FROM audit_logs al
  WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
  GROUP BY tenant_id, DATE_TRUNC('day', created_at), category
  ON CONFLICT (tenant_id, metric_date, category)
  DO UPDATE SET
    total_events = EXCLUDED.total_events,
    unique_users = EXCLUDED.unique_users,
    failed_ops = EXCLUDED.failed_ops,
    avg_duration = EXCLUDED.avg_duration,
    top_users = EXCLUDED.top_users,
    computed_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean old audit logs based on retention policy
CREATE OR REPLACE FUNCTION clean_audit_logs()
RETURNS void AS $$
DECLARE
  policy RECORD;
BEGIN
  FOR policy IN 
    SELECT * FROM audit_retention_policies WHERE is_active = TRUE
  LOOP
    -- Move to warm storage (just mark with metadata for now)
    UPDATE audit_logs
    SET metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{storage_tier}',
      '"warm"'
    )
    WHERE tenant_id = policy.tenant_id
    AND category = policy.category
    AND created_at < NOW() - (policy.hot_days || ' days')::INTERVAL
    AND created_at >= NOW() - (policy.warm_days || ' days')::INTERVAL
    AND (metadata->>'storage_tier') IS DISTINCT FROM 'warm';
    
    -- Delete old logs if purge is enabled
    IF policy.purge_enabled AND policy.purge_after_days IS NOT NULL THEN
      DELETE FROM audit_logs
      WHERE tenant_id = policy.tenant_id
      AND category = policy.category
      AND created_at < NOW() - (policy.purge_after_days || ' days')::INTERVAL
      AND NOT policy.legal_hold;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==================== DEFAULT RETENTION POLICIES ====================

-- Insert default global retention policies
INSERT INTO audit_retention_policies (category, tenant_id)
VALUES 
  ('data_change', NULL),
  ('access', NULL),
  ('permission', NULL),
  ('system', NULL),
  ('security', NULL),
  ('compliance', NULL);

-- ==================== GRANTS ====================

-- Grant appropriate permissions (adjust based on your user roles)
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_role;
-- GRANT INSERT ON audit_logs, data_access_logs, security_audit_logs, compliance_audit_logs TO app_role;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO app_role;