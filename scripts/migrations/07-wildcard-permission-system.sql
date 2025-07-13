-- Advanced Wildcard Permission System for Multi-Tier Architecture
-- Implements hierarchical permission inheritance with wildcards
-- Created: 2025-01-12

-- Step 1: Update permission check function to support wildcards
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id INTEGER,
    p_permission_pattern VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
    user_tier VARCHAR;
BEGIN
    -- Get user's highest tier for wildcard matching
    SELECT 
        CASE 
            WHEN EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = p_user_id AND r.module = 'platform') THEN 'platform'
            WHEN EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = p_user_id AND r.module = 'tenant') THEN 'tenant'
            WHEN EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = p_user_id AND r.module = 'account') THEN 'account'
            ELSE 'user'
        END INTO user_tier;
    
    -- Check direct user permissions with wildcard support
    SELECT EXISTS (
        SELECT 1 
        FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        WHERE up.user_id = p_user_id 
        AND up.is_denied = false
        AND (
            p.pattern = p_permission_pattern OR
            p.pattern = SUBSTRING(p_permission_pattern FROM 1 FOR POSITION('.' IN p_permission_pattern) - 1) || '.*' OR
            p.pattern = SUBSTRING(p_permission_pattern FROM 1 FOR POSITION('.' IN p_permission_pattern || '.') + POSITION('.' IN SUBSTRING(p_permission_pattern FROM POSITION('.' IN p_permission_pattern) + 1))) || '.*' OR
            p.pattern = '*'
        )
    ) INTO has_perm;
    
    IF has_perm THEN
        RETURN true;
    END IF;
    
    -- Check role-based permissions with wildcard support
    SELECT EXISTS (
        SELECT 1
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = p_user_id
        AND ur.is_active = true
        AND u.is_active = true
        AND (
            p.pattern = p_permission_pattern OR
            p.pattern = SUBSTRING(p_permission_pattern FROM 1 FOR POSITION('.' IN p_permission_pattern) - 1) || '.*' OR
            p.pattern = SUBSTRING(p_permission_pattern FROM 1 FOR POSITION('.' IN p_permission_pattern || '.') + POSITION('.' IN SUBSTRING(p_permission_pattern FROM POSITION('.' IN p_permission_pattern) + 1))) || '.*' OR
            p.pattern = '*'
        )
    ) INTO has_perm;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create hierarchical wildcard permissions
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
    updated_at
) 
SELECT * FROM (VALUES
    -- Platform level wildcards
    ('Platform Super Admin', 'platform', '*', '*', 'platform', '*', 'Complete system access', true, true),
    ('Platform Admin', 'platform', '*', '*', 'platform', 'platform.*', 'All platform operations', true, true),
    
    -- Tenant level wildcards
    ('Tenant All Access', 'tenant', '*', '*', 'tenant', 'tenant.*', 'All tenant operations', true, true),
    ('Tenant Admin', 'tenant', '*', 'manage', 'tenant', 'tenant.*.manage', 'Manage all tenant resources', true, true),
    ('Tenant View', 'tenant', '*', 'view', 'tenant', 'tenant.*.view', 'View all tenant resources', true, true),
    
    -- Account level wildcards
    ('Account All Access', 'account', '*', '*', 'account', 'account.*', 'All account operations', true, true),
    ('Account Admin', 'account', '*', 'manage', 'account', 'account.*.manage', 'Manage all account resources', true, true),
    ('Account View', 'account', '*', 'view', 'account', 'account.*.view', 'View all account resources', true, true),
    
    -- Resource-specific wildcards
    ('All Profiles Access', 'account', 'profiles', '*', 'account', 'account.profiles.*', 'All profile operations', true, true),
    ('All Billing Access', 'account', 'billing', '*', 'account', 'account.billing.*', 'All billing operations', true, true),
    ('All Jobs Access', 'account', 'jobs', '*', 'account', 'account.jobs.*', 'All job operations', true, true),
    ('All Products Access', 'account', 'products', '*', 'account', 'account.products.*', 'All product operations', true, true),
    ('All Team Access', 'account', 'team', '*', 'account', 'account.team.*', 'All team operations', true, true),
    
    -- View-only wildcards for each tier
    ('Platform View All', 'platform', '*', 'view', 'platform', 'platform.*.view', 'View all platform data', true, true),
    ('Tenant View All', 'tenant', '*', 'view', 'tenant', 'tenant.*.view', 'View all tenant data', true, true),
    ('Account View All', 'account', '*', 'view', 'account', 'account.*.view', 'View all account data', true, true)
) AS v(name, module, resource, action, scope, pattern, description, is_system, is_wildcard)
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE pattern = v.pattern
);

-- Step 3: Create a better permission matching function
CREATE OR REPLACE FUNCTION pattern_matches_permission(
    pattern TEXT,
    permission TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Exact match
    IF pattern = permission THEN
        RETURN true;
    END IF;
    
    -- Full wildcard
    IF pattern = '*' THEN
        RETURN true;
    END IF;
    
    -- Pattern wildcard matching
    -- e.g., 'account.*' matches 'account.profiles.create'
    IF pattern LIKE '%.*' THEN
        IF permission LIKE REPLACE(pattern, '*', '%') THEN
            RETURN true;
        END IF;
    END IF;
    
    -- Middle wildcard matching
    -- e.g., 'account.*.view' matches 'account.profiles.view'
    IF pattern LIKE '%.*.%' THEN
        DECLARE
            pattern_parts TEXT[];
            permission_parts TEXT[];
        BEGIN
            pattern_parts := string_to_array(pattern, '.');
            permission_parts := string_to_array(permission, '.');
            
            IF array_length(pattern_parts, 1) = array_length(permission_parts, 1) THEN
                FOR i IN 1..array_length(pattern_parts, 1) LOOP
                    IF pattern_parts[i] != '*' AND pattern_parts[i] != permission_parts[i] THEN
                        RETURN false;
                    END IF;
                END LOOP;
                RETURN true;
            END IF;
        END;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 4: Update the permission check function to use the new matcher
CREATE OR REPLACE FUNCTION user_has_permission_v2(
    p_user_id INTEGER,
    p_permission_pattern VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    -- Check if user is denied this permission explicitly
    SELECT EXISTS (
        SELECT 1 
        FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        WHERE up.user_id = p_user_id 
        AND up.is_denied = true
        AND pattern_matches_permission(p.pattern, p_permission_pattern)
    ) INTO has_perm;
    
    IF has_perm THEN
        RETURN false; -- Explicitly denied
    END IF;
    
    -- Check direct user permissions
    SELECT EXISTS (
        SELECT 1 
        FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        WHERE up.user_id = p_user_id 
        AND up.is_denied = false
        AND pattern_matches_permission(p.pattern, p_permission_pattern)
    ) INTO has_perm;
    
    IF has_perm THEN
        RETURN true;
    END IF;
    
    -- Check role-based permissions
    SELECT EXISTS (
        SELECT 1
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = p_user_id
        AND ur.is_active = true
        AND u.is_active = true
        AND pattern_matches_permission(p.pattern, p_permission_pattern)
    ) INTO has_perm;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create permission inheritance view
CREATE OR REPLACE VIEW v_permission_inheritance AS
WITH RECURSIVE permission_tree AS (
    -- Base permissions
    SELECT 
        p.id,
        p.pattern,
        p.name,
        p.module,
        p.resource,
        p.action,
        p.is_wildcard,
        p.pattern as inherits_from,
        0 as level
    FROM permissions p
    WHERE p.is_wildcard = false
    
    UNION ALL
    
    -- Wildcard permissions that match
    SELECT 
        pt.id,
        pt.pattern,
        pt.name,
        pt.module,
        pt.resource,
        pt.action,
        pt.is_wildcard,
        p.pattern as inherits_from,
        pt.level + 1
    FROM permission_tree pt
    JOIN permissions p ON pattern_matches_permission(p.pattern, pt.pattern)
    WHERE p.is_wildcard = true
    AND p.pattern != pt.pattern
)
SELECT DISTINCT ON (pattern) * FROM permission_tree
ORDER BY pattern, level;

-- Step 6: Update roles with wildcard permissions
DO $$
DECLARE
    super_admin_role_id INTEGER;
    platform_admin_role_id INTEGER;
    tenant_admin_role_id INTEGER;
    account_admin_role_id INTEGER;
    wildcard_perm_id INTEGER;
BEGIN
    -- Get role IDs
    SELECT id INTO super_admin_role_id FROM roles WHERE code = 'super_admin';
    SELECT id INTO platform_admin_role_id FROM roles WHERE code = 'platform_admin';
    SELECT id INTO tenant_admin_role_id FROM roles WHERE code = 'tenant_admin';
    SELECT id INTO account_admin_role_id FROM roles WHERE code = 'account_admin';
    
    -- Assign wildcard permissions to super_admin
    IF super_admin_role_id IS NOT NULL THEN
        SELECT id INTO wildcard_perm_id FROM permissions WHERE pattern = '*';
        IF wildcard_perm_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
            VALUES (super_admin_role_id, wildcard_perm_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    -- Assign platform wildcard to platform_admin
    IF platform_admin_role_id IS NOT NULL THEN
        SELECT id INTO wildcard_perm_id FROM permissions WHERE pattern = 'platform.*';
        IF wildcard_perm_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
            VALUES (platform_admin_role_id, wildcard_perm_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    -- Assign tenant wildcard to tenant_admin
    IF tenant_admin_role_id IS NOT NULL THEN
        SELECT id INTO wildcard_perm_id FROM permissions WHERE pattern = 'tenant.*';
        IF wildcard_perm_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
            VALUES (tenant_admin_role_id, wildcard_perm_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    -- Assign account wildcard to account_admin
    IF account_admin_role_id IS NOT NULL THEN
        SELECT id INTO wildcard_perm_id FROM permissions WHERE pattern = 'account.*';
        IF wildcard_perm_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
            VALUES (account_admin_role_id, wildcard_perm_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END $$;

-- Step 7: Create helper function to check permissions with tier context
CREATE OR REPLACE FUNCTION user_can(
    p_user_id INTEGER,
    p_action VARCHAR,
    p_resource VARCHAR DEFAULT NULL,
    p_tier VARCHAR DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    permission_to_check VARCHAR;
BEGIN
    -- Build permission pattern based on inputs
    IF p_tier IS NOT NULL AND p_resource IS NOT NULL THEN
        permission_to_check := p_tier || '.' || p_resource || '.' || p_action;
    ELSIF p_resource IS NOT NULL THEN
        -- Infer tier from user's context
        permission_to_check := 'account.' || p_resource || '.' || p_action;
    ELSE
        permission_to_check := p_action;
    END IF;
    
    RETURN user_has_permission_v2(p_user_id, permission_to_check);
END;
$$ LANGUAGE plpgsql;

-- Step 8: Report on wildcard permission system
DO $$
DECLARE
    wildcard_count INTEGER;
    specific_count INTEGER;
    role_wildcard_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO wildcard_count FROM permissions WHERE is_wildcard = true;
    SELECT COUNT(*) INTO specific_count FROM permissions WHERE is_wildcard = false;
    SELECT COUNT(DISTINCT rp.role_id) INTO role_wildcard_count 
    FROM role_permissions rp 
    JOIN permissions p ON rp.permission_id = p.id 
    WHERE p.is_wildcard = true;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Wildcard Permission System Setup Complete ===';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '  - % wildcard permissions', wildcard_count;
    RAISE NOTICE '  - % specific permissions', specific_count;
    RAISE NOTICE '  - % roles with wildcard permissions', role_wildcard_count;
    RAISE NOTICE '  - pattern_matches_permission() function';
    RAISE NOTICE '  - user_has_permission_v2() function';
    RAISE NOTICE '  - user_can() helper function';
    RAISE NOTICE '  - v_permission_inheritance view';
    RAISE NOTICE '';
    RAISE NOTICE 'Usage Examples:';
    RAISE NOTICE '  - SELECT user_has_permission_v2(1, ''account.profiles.create'');';
    RAISE NOTICE '  - SELECT user_can(1, ''create'', ''profiles'', ''account'');';
    RAISE NOTICE '  - SELECT user_can(1, ''manage'', ''billing'');';
    RAISE NOTICE '';
    RAISE NOTICE 'Wildcard Examples:';
    RAISE NOTICE '  - "*" grants all permissions';
    RAISE NOTICE '  - "account.*" grants all account permissions';
    RAISE NOTICE '  - "account.*.view" grants view on all account resources';
    RAISE NOTICE '  - "account.profiles.*" grants all actions on profiles';
END $$;