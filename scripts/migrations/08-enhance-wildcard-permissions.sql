-- Enhanced Wildcard Permission Patterns for Existing System
-- Adds advanced wildcard permissions to the existing industry-grade RBAC
-- Created: 2025-01-12

-- Step 1: Add enhanced wildcard permissions to existing permission table
-- These follow the existing pattern: module.resource.action
INSERT INTO permissions (
    name, 
    module, 
    resource, 
    action, 
    scope, 
    pattern,
    description,
    is_system,
    is_wildcard,
    created_at,
    updated_at,
    priority
) VALUES
    -- Super wildcards
    ('All System Access', NULL, '*', '*', 'global', '*', 'Complete system access - all modules, resources, and actions', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1),
    
    -- Module-level wildcards
    ('All Platform Access', 'platform', '*', '*', 'platform', 'platform.*', 'All platform module operations', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 10),
    ('All Tenant Access', 'tenant', '*', '*', 'tenant', 'tenant.*', 'All tenant module operations', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 10),
    ('All Account Access', 'account', '*', '*', 'account', 'account.*', 'All account module operations', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 10),
    ('All User Access', 'user', '*', '*', 'own', 'user.*', 'All user module operations', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 10),
    
    -- Action-specific wildcards across modules
    ('Universal Read Access', '*', '*', 'read', 'global', '*.*.read', 'Read access to all resources', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 20),
    ('Universal Create Access', '*', '*', 'create', 'global', '*.*.create', 'Create access to all resources', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 20),
    ('Universal Update Access', '*', '*', 'update', 'global', '*.*.update', 'Update access to all resources', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 20),
    ('Universal Delete Access', '*', '*', 'delete', 'global', '*.*.delete', 'Delete access to all resources', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 20),
    ('Universal Manage Access', '*', '*', 'manage', 'global', '*.*.manage', 'Manage access to all resources', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 20),
    
    -- Module + Action wildcards
    ('Platform Read All', 'platform', '*', 'read', 'platform', 'platform.*.read', 'Read all platform resources', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 30),
    ('Platform Manage All', 'platform', '*', 'manage', 'platform', 'platform.*.manage', 'Manage all platform resources', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 30),
    ('Tenant Read All', 'tenant', '*', 'read', 'tenant', 'tenant.*.read', 'Read all tenant resources', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 30),
    ('Tenant Manage All', 'tenant', '*', 'manage', 'tenant', 'tenant.*.manage', 'Manage all tenant resources', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 30),
    ('Account Read All', 'account', '*', 'read', 'account', 'account.*.read', 'Read all account resources', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 30),
    ('Account Manage All', 'account', '*', 'manage', 'account', 'account.*.manage', 'Manage all account resources', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 30),
    
    -- Resource-specific wildcards
    ('All User Operations', 'platform', 'users', '*', 'global', 'platform.users.*', 'All operations on users resource', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 40),
    ('All Billing Operations', 'tenant', 'billing', '*', 'tenant', 'tenant.billing.*', 'All operations on billing resource', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 40),
    ('All Settings Operations', 'account', 'settings', '*', 'account', 'account.settings.*', 'All operations on settings resource', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 40)
ON CONFLICT (pattern) DO UPDATE SET
    is_wildcard = EXCLUDED.is_wildcard,
    priority = EXCLUDED.priority,
    updated_at = CURRENT_TIMESTAMP;

-- Step 2: Update super_admin role to use the super wildcard
DO $$
DECLARE
    super_admin_role_id INTEGER;
    super_wildcard_id INTEGER;
BEGIN
    -- Get super_admin role
    SELECT id INTO super_admin_role_id FROM roles WHERE code = 'super_admin';
    
    -- Get super wildcard permission
    SELECT id INTO super_wildcard_id FROM permissions WHERE pattern = '*';
    
    IF super_admin_role_id IS NOT NULL AND super_wildcard_id IS NOT NULL THEN
        -- Remove all existing permissions for super_admin
        DELETE FROM role_permissions WHERE role_id = super_admin_role_id;
        
        -- Add only the super wildcard
        INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
        VALUES (super_admin_role_id, super_wildcard_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        
        RAISE NOTICE 'Updated super_admin role to use wildcard permission (*)';
    END IF;
END $$;

-- Step 3: Update platform_admin to use platform wildcard
DO $$
DECLARE
    platform_admin_role_id INTEGER;
    platform_wildcard_id INTEGER;
BEGIN
    SELECT id INTO platform_admin_role_id FROM roles WHERE code = 'platform_admin';
    SELECT id INTO platform_wildcard_id FROM permissions WHERE pattern = 'platform.*';
    
    IF platform_admin_role_id IS NOT NULL AND platform_wildcard_id IS NOT NULL THEN
        -- Add platform wildcard
        INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
        VALUES (platform_admin_role_id, platform_wildcard_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Added platform.* wildcard to platform_admin role';
    END IF;
END $$;

-- Step 4: Update tenant_admin to use tenant wildcard
DO $$
DECLARE
    tenant_admin_role_id INTEGER;
    tenant_wildcard_id INTEGER;
    account_read_id INTEGER;
BEGIN
    SELECT id INTO tenant_admin_role_id FROM roles WHERE code = 'tenant_admin';
    SELECT id INTO tenant_wildcard_id FROM permissions WHERE pattern = 'tenant.*';
    SELECT id INTO account_read_id FROM permissions WHERE pattern = 'account.*.read';
    
    IF tenant_admin_role_id IS NOT NULL AND tenant_wildcard_id IS NOT NULL THEN
        -- Add tenant wildcard
        INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
        VALUES (tenant_admin_role_id, tenant_wildcard_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING;
        
        -- Also add account read permissions for visibility
        IF account_read_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
            VALUES (tenant_admin_role_id, account_read_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING;
        END IF;
        
        RAISE NOTICE 'Added tenant.* and account.*.read wildcards to tenant_admin role';
    END IF;
END $$;

-- Step 5: Create index for wildcard pattern matching
CREATE INDEX IF NOT EXISTS idx_permissions_pattern_wildcard ON permissions(pattern) WHERE is_wildcard = true;
CREATE INDEX IF NOT EXISTS idx_permissions_priority ON permissions(priority);

-- Step 6: Create a view to show effective permissions (including wildcards)
CREATE OR REPLACE VIEW v_role_effective_permissions AS
WITH wildcard_expansions AS (
    SELECT 
        rp.role_id,
        r.code as role_code,
        r.name as role_name,
        p.pattern,
        p.is_wildcard,
        p.priority
    FROM role_permissions rp
    JOIN roles r ON rp.role_id = r.id
    JOIN permissions p ON rp.permission_id = p.id
    ORDER BY p.priority
)
SELECT * FROM wildcard_expansions;

-- Step 7: Update existing checkPermissionWithWildcards to handle more patterns
-- Note: This is documentation for the TypeScript update needed
COMMENT ON TABLE permissions IS 'Permission patterns support wildcards:
- "*" matches everything
- "module.*" matches all resources and actions in module
- "*.resource.*" matches all modules and actions for a resource
- "*.*.action" matches specific action across all modules and resources
- "module.*.action" matches specific action on all resources in module
The existing checkPermissionWithWildcards function already handles these patterns correctly.';

-- Step 8: Report on wildcard system enhancement
DO $$
DECLARE
    wildcard_count INTEGER;
    super_admin_perms INTEGER;
    platform_admin_perms INTEGER;
    tenant_admin_perms INTEGER;
BEGIN
    SELECT COUNT(*) INTO wildcard_count FROM permissions WHERE is_wildcard = true;
    
    SELECT COUNT(*) INTO super_admin_perms 
    FROM role_permissions rp 
    JOIN roles r ON rp.role_id = r.id 
    WHERE r.code = 'super_admin';
    
    SELECT COUNT(*) INTO platform_admin_perms 
    FROM role_permissions rp 
    JOIN roles r ON rp.role_id = r.id 
    WHERE r.code = 'platform_admin';
    
    SELECT COUNT(*) INTO tenant_admin_perms 
    FROM role_permissions rp 
    JOIN roles r ON rp.role_id = r.id 
    WHERE r.code = 'tenant_admin';
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Wildcard Permission Enhancement Complete ===';
    RAISE NOTICE 'Stats:';
    RAISE NOTICE '  - % wildcard permissions available', wildcard_count;
    RAISE NOTICE '  - super_admin now has % permissions (should be 1 wildcard)', super_admin_perms;
    RAISE NOTICE '  - platform_admin has % permissions', platform_admin_perms;
    RAISE NOTICE '  - tenant_admin has % permissions', tenant_admin_perms;
    RAISE NOTICE '';
    RAISE NOTICE 'The existing checkPermissionWithWildcards() function already supports:';
    RAISE NOTICE '  - Direct matches: "platform.users.read"';
    RAISE NOTICE '  - Module wildcards: "platform.*"';
    RAISE NOTICE '  - Action wildcards: "*.*.read"';
    RAISE NOTICE '  - Resource wildcards: "*.users.*"';
    RAISE NOTICE '  - Super wildcard: "*"';
END $$;