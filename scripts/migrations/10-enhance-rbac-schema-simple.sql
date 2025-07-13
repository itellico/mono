-- ============================================================================
-- Enhanced RBAC Schema for NestJS Best Practices (Simple Version)
-- Purpose: Add missing RBAC fields and basic constraints
-- Date: 2024-12-11
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1: ADD MISSING COLUMNS
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

-- ============================================================================
-- PHASE 2: CREATE IMPROVED INDEXES
-- ============================================================================

-- Permissions indexes for Guard performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permissions_module_resource 
    ON permissions(module, resource);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permissions_scope_tenant 
    ON permissions(scope, tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permissions_system 
    ON permissions(is_system);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permissions_wildcard 
    ON permissions(is_wildcard, priority);

-- Roles indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_tenant_active 
    ON roles(tenant_id, is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_level 
    ON roles(level, is_system);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_inherit 
    ON roles(inherit_from);

-- ============================================================================
-- PHASE 3: ADD SYSTEM PERMISSIONS
-- ============================================================================

-- Insert system permissions with explicit timestamps
INSERT INTO permissions (name, module, resource, action, scope, description, is_system, priority, created_at, updated_at) VALUES
-- Platform administration
('platform.admin.super', 'platform', 'platform', 'super_admin', 'platform', 'Super admin access to everything', true, 1000, now(), now()),
('platform.admin.manage', 'platform', 'platform', 'manage', 'platform', 'Platform administration', true, 900, now(), now()),

-- Tenant management
('platform.tenants.create', 'platform', 'tenant', 'create', 'platform', 'Create new tenants', true, 800, now(), now()),
('platform.tenants.read', 'platform', 'tenant', 'read', 'platform', 'View all tenants', true, 700, now(), now()),
('platform.tenants.update', 'platform', 'tenant', 'update', 'platform', 'Update tenant settings', true, 700, now(), now()),
('platform.tenants.delete', 'platform', 'tenant', 'delete', 'platform', 'Delete tenants', true, 600, now(), now()),

-- Account management
('tenant.accounts.create', 'accounts', 'account', 'create', 'tenant', 'Create new accounts', true, 500, now(), now()),
('tenant.accounts.read', 'accounts', 'account', 'read', 'tenant', 'View accounts', true, 400, now(), now()),
('tenant.accounts.update', 'accounts', 'account', 'update', 'tenant', 'Update account details', true, 400, now(), now()),
('tenant.accounts.delete', 'accounts', 'account', 'delete', 'tenant', 'Delete accounts', true, 300, now(), now()),

-- User management
('account.users.create', 'users', 'user', 'create', 'account', 'Create new users', true, 400, now(), now()),
('account.users.read', 'users', 'user', 'read', 'account', 'View users', true, 300, now(), now()),
('account.users.update', 'users', 'user', 'update', 'account', 'Update user details', true, 300, now(), now()),
('account.users.delete', 'users', 'user', 'delete', 'account', 'Delete users', true, 200, now(), now()),

-- Profile management
('user.profile.read', 'users', 'profile', 'read', 'user', 'View own profile', true, 100, now(), now()),
('user.profile.update', 'users', 'profile', 'update', 'user', 'Update own profile', true, 100, now(), now()),

-- Public permissions
('public.auth.login', 'auth', 'session', 'create', 'public', 'Login to system', true, 50, now(), now()),
('public.auth.register', 'auth', 'account', 'create', 'public', 'Register new account', true, 50, now(), now())

ON CONFLICT (name) DO NOTHING;

-- Insert system roles
INSERT INTO roles (name, code, description, level, is_system, is_default, metadata, created_at, updated_at) VALUES
('Platform Super Admin', 'platform_super_admin', 'Full platform access', 0, true, false, '{"color": "red", "icon": "crown"}', now(), now()),
('Platform Admin', 'platform_admin', 'Platform administration', 0, true, false, '{"color": "orange", "icon": "shield"}', now(), now()),
('Tenant Admin', 'tenant_admin', 'Tenant administration', 1, true, false, '{"color": "blue", "icon": "building"}', now(), now()),
('Account Admin', 'account_admin', 'Account administration', 2, true, false, '{"color": "green", "icon": "users"}', now(), now()),
('User', 'user', 'Regular user', 3, true, true, '{"color": "gray", "icon": "user"}', now(), now()),
('Public', 'public', 'Public access', 4, true, false, '{"color": "lightgray", "icon": "globe"}', now(), now())

ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- PHASE 4: CREATE HELPER FUNCTIONS FOR NESTJS
-- ============================================================================

-- Function to get user permissions
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
            p.action,
            p.scope,
            'direct' as source,
            p.priority
        FROM user_permissions up
        JOIN permissions p ON p.id = up.permission_id
        WHERE up.user_id = p_user_id
          AND p.deleted_at IS NULL
          AND (p_tenant_id IS NULL OR p.tenant_id = p_tenant_id)
        
        UNION
        
        -- Role-based permissions (if role_permissions table exists)
        SELECT 
            p.name as permission_name,
            p.module,
            p.resource,
            p.action,
            p.scope,
            'role:' || r.name as source,
            p.priority
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        JOIN role_permissions rp ON rp.role_id = r.id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = p_user_id
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

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show final summary
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
    RAISE NOTICE 'Added: module, context, metadata fields';
    RAISE NOTICE 'Added: system permissions and roles';
    RAISE NOTICE 'Added: NestJS helper functions';
END $$;

COMMIT;