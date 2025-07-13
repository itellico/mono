-- ============================================================================
-- Enhanced RBAC Schema for NestJS Best Practices
-- Purpose: Create proper Permission and Role schemas with NestJS Guard support
-- Date: 2024-12-11
-- Prerequisite: Run 09-normalize-table-naming.sql first
-- ============================================================================

-- IMPORTANT: This migration enhances the RBAC system for NestJS Guards
-- Adds missing fields, proper enums, constraints, and indexes

BEGIN;

-- ============================================================================
-- PHASE 1: CREATE ENUMS FOR TYPE SAFETY
-- ============================================================================

-- Permission action enum
CREATE TYPE permission_action AS ENUM (
    'create', 'read', 'update', 'delete',
    'list', 'search', 'export', 'import',
    'approve', 'reject', 'publish', 'archive',
    'assign', 'unassign', 'transfer', 'clone',
    'manage', 'admin', 'super_admin'
);

-- Permission scope enum (5-tier architecture)
CREATE TYPE permission_scope AS ENUM (
    'platform',  -- Global platform level
    'tenant',    -- Tenant level
    'account',   -- Account level
    'user',      -- User level
    'public'     -- Public access
);

-- Role level enum
CREATE TYPE role_level AS ENUM (
    'platform',  -- 0: Platform admin
    'tenant',    -- 1: Tenant admin
    'account',   -- 2: Account admin
    'user',      -- 3: Regular user
    'public'     -- 4: Public access
);

-- ============================================================================
-- PHASE 2: ENHANCE PERMISSIONS TABLE
-- ============================================================================

-- Add missing columns to permissions table
ALTER TABLE permissions 
ADD COLUMN IF NOT EXISTS module VARCHAR(50),
ADD COLUMN IF NOT EXISTS context VARCHAR(50),
ADD COLUMN IF NOT EXISTS condition JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tenant_id INTEGER,
ADD COLUMN IF NOT EXISTS created_by INTEGER,
ADD COLUMN IF NOT EXISTS updated_by INTEGER,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by INTEGER;

-- Update existing columns to use enums where possible
-- Note: We'll update these after creating proper constraints

-- Add constraints for data integrity
ALTER TABLE permissions 
ADD CONSTRAINT permissions_name_length CHECK (length(name) >= 3 AND length(name) <= 100),
ADD CONSTRAINT permissions_pattern_length CHECK (pattern IS NULL OR length(pattern) <= 200),
ADD CONSTRAINT permissions_priority_range CHECK (priority >= 0 AND priority <= 1000);

-- Add foreign key constraints
ALTER TABLE permissions 
ADD CONSTRAINT permissions_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
ADD CONSTRAINT permissions_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
ADD CONSTRAINT permissions_updated_by_fkey 
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
ADD CONSTRAINT permissions_deleted_by_fkey 
    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- Create composite unique constraint for logical uniqueness
ALTER TABLE permissions 
ADD CONSTRAINT permissions_unique_per_tenant 
    UNIQUE (tenant_id, module, resource, action, scope);

-- ============================================================================
-- PHASE 3: ENHANCE ROLES TABLE
-- ============================================================================

-- Add missing columns to roles table
ALTER TABLE roles 
ADD COLUMN IF NOT EXISTS module VARCHAR(50),
ADD COLUMN IF NOT EXISTS inherit_from INTEGER,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_by INTEGER,
ADD COLUMN IF NOT EXISTS updated_by INTEGER,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by INTEGER;

-- Add constraints for data integrity
ALTER TABLE roles 
ADD CONSTRAINT roles_name_length CHECK (length(name) >= 2 AND length(name) <= 100),
ADD CONSTRAINT roles_code_length CHECK (length(code) >= 2 AND length(code) <= 50),
ADD CONSTRAINT roles_level_range CHECK (level >= 0 AND level <= 4);

-- Add foreign key constraints
ALTER TABLE roles 
ADD CONSTRAINT roles_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
ADD CONSTRAINT roles_inherit_from_fkey 
    FOREIGN KEY (inherit_from) REFERENCES roles(id) ON DELETE SET NULL,
ADD CONSTRAINT roles_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
ADD CONSTRAINT roles_updated_by_fkey 
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
ADD CONSTRAINT roles_deleted_by_fkey 
    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- Prevent circular inheritance
ALTER TABLE roles 
ADD CONSTRAINT roles_no_self_inheritance CHECK (id != inherit_from);

-- Create composite unique constraints
ALTER TABLE roles 
ADD CONSTRAINT roles_unique_code_per_tenant 
    UNIQUE (tenant_id, code),
ADD CONSTRAINT roles_unique_name_per_tenant 
    UNIQUE (tenant_id, name);

-- ============================================================================
-- PHASE 4: CREATE ENHANCED JUNCTION TABLES
-- ============================================================================

-- Enhanced role_permissions table
DROP TABLE IF EXISTS role_permissions CASCADE;
CREATE TABLE role_permissions (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id SERIAL UNIQUE,
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    granted_by INTEGER,
    granted_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    is_denied BOOLEAN DEFAULT false,  -- Explicit deny permissions
    condition JSONB DEFAULT '{}',     -- Conditional grants
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE (role_id, permission_id)
);

-- Enhanced user_permissions table (direct permissions)
DROP TABLE IF EXISTS user_permissions CASCADE;
CREATE TABLE user_permissions (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id SERIAL UNIQUE,
    user_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    granted_by INTEGER,
    granted_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    is_denied BOOLEAN DEFAULT false,
    condition JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE (user_id, permission_id)
);

-- Enhanced user_roles table
DROP TABLE IF EXISTS user_roles CASCADE;
CREATE TABLE user_roles (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id SERIAL UNIQUE,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    assigned_by INTEGER,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE (user_id, role_id)
);

-- ============================================================================
-- PHASE 5: CREATE SYSTEM PERMISSIONS AND ROLES
-- ============================================================================

-- Insert system permissions for each module
INSERT INTO permissions (name, module, resource, action, scope, description, is_system, priority) VALUES
-- Platform administration
('platform.admin.super', 'platform', 'platform', 'super_admin', 'platform', 'Super admin access to everything', true, 1000),
('platform.admin.manage', 'platform', 'platform', 'manage', 'platform', 'Platform administration', true, 900),

-- Tenant management
('platform.tenants.create', 'platform', 'tenant', 'create', 'platform', 'Create new tenants', true, 800),
('platform.tenants.read', 'platform', 'tenant', 'read', 'platform', 'View all tenants', true, 700),
('platform.tenants.update', 'platform', 'tenant', 'update', 'platform', 'Update tenant settings', true, 700),
('platform.tenants.delete', 'platform', 'tenant', 'delete', 'platform', 'Delete tenants', true, 600),

-- Account management
('tenant.accounts.create', 'accounts', 'account', 'create', 'tenant', 'Create new accounts', true, 500),
('tenant.accounts.read', 'accounts', 'account', 'read', 'tenant', 'View accounts', true, 400),
('tenant.accounts.update', 'accounts', 'account', 'update', 'tenant', 'Update account details', true, 400),
('tenant.accounts.delete', 'accounts', 'account', 'delete', 'tenant', 'Delete accounts', true, 300),

-- User management
('account.users.create', 'users', 'user', 'create', 'account', 'Create new users', true, 400),
('account.users.read', 'users', 'user', 'read', 'account', 'View users', true, 300),
('account.users.update', 'users', 'user', 'update', 'account', 'Update user details', true, 300),
('account.users.delete', 'users', 'user', 'delete', 'account', 'Delete users', true, 200),

-- Profile management
('user.profile.read', 'users', 'profile', 'read', 'user', 'View own profile', true, 100),
('user.profile.update', 'users', 'profile', 'update', 'user', 'Update own profile', true, 100),

-- Public permissions
('public.auth.login', 'auth', 'session', 'create', 'public', 'Login to system', true, 50),
('public.auth.register', 'auth', 'account', 'create', 'public', 'Register new account', true, 50)

ON CONFLICT (name) DO NOTHING;

-- Insert system roles
INSERT INTO roles (name, code, description, level, is_system, is_default, metadata) VALUES
('Platform Super Admin', 'platform_super_admin', 'Full platform access', 0, true, false, '{"color": "red", "icon": "crown"}'),
('Platform Admin', 'platform_admin', 'Platform administration', 0, true, false, '{"color": "orange", "icon": "shield"}'),
('Tenant Admin', 'tenant_admin', 'Tenant administration', 1, true, false, '{"color": "blue", "icon": "building"}'),
('Account Admin', 'account_admin', 'Account administration', 2, true, false, '{"color": "green", "icon": "users"}'),
('User', 'user', 'Regular user', 3, true, true, '{"color": "gray", "icon": "user"}'),
('Public', 'public', 'Public access', 4, true, false, '{"color": "lightgray", "icon": "globe"}')

ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- PHASE 6: CREATE OPTIMIZED INDEXES
-- ============================================================================

-- Permissions indexes for Guard performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permissions_module_resource_action 
    ON permissions(module, resource, action) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permissions_scope_tenant 
    ON permissions(scope, tenant_id) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permissions_system_active 
    ON permissions(is_system) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permissions_wildcard_priority 
    ON permissions(is_wildcard, priority) WHERE deleted_at IS NULL;

-- Roles indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_tenant_active 
    ON roles(tenant_id, is_active) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_level_system 
    ON roles(level, is_system) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_inherit_from 
    ON roles(inherit_from) WHERE inherit_from IS NOT NULL;

-- Junction table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_permissions_role_permission 
    ON role_permissions(role_id, permission_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_permissions_expires 
    ON role_permissions(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_permissions_user_permission 
    ON user_permissions(user_id, permission_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_permissions_expires 
    ON user_permissions(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_role 
    ON user_roles(user_id, role_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_active 
    ON user_roles(is_active, expires_at);

-- ============================================================================
-- PHASE 7: CREATE HELPER FUNCTIONS FOR NESTJS
-- ============================================================================

-- Function to get user permissions with inheritance
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id INTEGER, p_tenant_id INTEGER DEFAULT NULL)
RETURNS TABLE (
    permission_name VARCHAR,
    module VARCHAR,
    resource VARCHAR,
    action VARCHAR,
    scope VARCHAR,
    source VARCHAR,
    priority INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH user_perms AS (
        -- Direct user permissions
        SELECT 
            p.name as permission_name,
            p.module,
            p.resource,
            p.action::VARCHAR,
            p.scope::VARCHAR,
            'direct' as source,
            p.priority
        FROM user_permissions up
        JOIN permissions p ON p.id = up.permission_id
        WHERE up.user_id = p_user_id
          AND up.is_denied = false
          AND (up.expires_at IS NULL OR up.expires_at > now())
          AND p.deleted_at IS NULL
          AND (p_tenant_id IS NULL OR p.tenant_id = p_tenant_id)
        
        UNION
        
        -- Role-based permissions
        SELECT 
            p.name as permission_name,
            p.module,
            p.resource,
            p.action::VARCHAR,
            p.scope::VARCHAR,
            'role:' || r.name as source,
            p.priority
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        JOIN role_permissions rp ON rp.role_id = r.id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = p_user_id
          AND ur.is_active = true
          AND (ur.expires_at IS NULL OR ur.expires_at > now())
          AND rp.is_denied = false
          AND (rp.expires_at IS NULL OR rp.expires_at > now())
          AND r.is_active = true
          AND r.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND (p_tenant_id IS NULL OR p.tenant_id = p_tenant_id)
    )
    SELECT DISTINCT ON (permission_name) 
        permission_name, module, resource, action, scope, source, priority
    FROM user_perms
    ORDER BY permission_name, priority DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id INTEGER, 
    p_permission_name VARCHAR,
    p_tenant_id INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN := false;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM get_user_permissions(p_user_id, p_tenant_id)
        WHERE permission_name = p_permission_name
    ) INTO has_perm;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user roles
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id INTEGER, p_tenant_id INTEGER DEFAULT NULL)
RETURNS TABLE (
    role_name VARCHAR,
    role_code VARCHAR,
    role_level INTEGER,
    assigned_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.name::VARCHAR as role_name,
        r.code::VARCHAR as role_code,
        r.level,
        ur.assigned_at
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = p_user_id
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
      AND r.is_active = true
      AND r.deleted_at IS NULL
      AND (p_tenant_id IS NULL OR r.tenant_id = p_tenant_id)
    ORDER BY r.level, r.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PHASE 8: CREATE AUDIT TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_permissions_updated_at 
    BEFORE UPDATE ON permissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_permissions_updated_at 
    BEFORE UPDATE ON role_permissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_permissions_updated_at 
    BEFORE UPDATE ON user_permissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at 
    BEFORE UPDATE ON user_roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION AND CLEANUP
-- ============================================================================

-- Show enhancement summary
DO $$
DECLARE
    perm_count INTEGER;
    role_count INTEGER;
    system_perm_count INTEGER;
    system_role_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO perm_count FROM permissions;
    SELECT COUNT(*) INTO role_count FROM roles;
    SELECT COUNT(*) INTO system_perm_count FROM permissions WHERE is_system = true;
    SELECT COUNT(*) INTO system_role_count FROM roles WHERE is_system = true;
    
    RAISE NOTICE 'RBAC Enhancement completed!';
    RAISE NOTICE 'Total permissions: % (% system)', perm_count, system_perm_count;
    RAISE NOTICE 'Total roles: % (% system)', role_count, system_role_count;
    RAISE NOTICE 'Enhanced with: enums, constraints, indexes, functions';
END $$;

COMMIT;

-- ============================================================================
-- USAGE EXAMPLES FOR NESTJS
-- ============================================================================

-- Example queries for NestJS Guards:

-- Check if user has permission:
-- SELECT user_has_permission(1, 'tenant.accounts.create', 123);

-- Get all user permissions:
-- SELECT * FROM get_user_permissions(1, 123);

-- Get user roles:
-- SELECT * FROM get_user_roles(1, 123);

-- Example TypeScript interface for NestJS:
/*
interface Permission {
  uuid: string;
  id: number;
  name: string;
  module: string;
  resource: string;
  action: PermissionAction;
  scope: PermissionScope;
  pattern?: string;
  condition?: Record<string, any>;
  metadata?: Record<string, any>;
  isWildcard: boolean;
  isSystem: boolean;
  priority: number;
  tenantId?: number;
  createdAt: Date;
  updatedAt: Date;
}

type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'list' | 'search' | 'export' | 'import' | 'approve' | 'reject' | 'publish' | 'archive' | 'assign' | 'unassign' | 'transfer' | 'clone' | 'manage' | 'admin' | 'super_admin';

type PermissionScope = 'platform' | 'tenant' | 'account' | 'user' | 'public';
*/