-- Setup Proper Permission System
-- Best practice RBAC implementation
-- Created: 2025-01-12

-- Step 1: Create standard account-level permissions
INSERT INTO permissions (
    name, 
    module, 
    resource, 
    action, 
    scope, 
    pattern,
    description,
    is_system
) 
SELECT * FROM (VALUES
    -- Profile permissions (replacing can_create_profiles, can_manage_all_profiles)
    ('Create Profiles', 'account', 'profiles', 'create', 'account', 'account.profiles.create', 'Create new profiles within the account', true),
    ('Manage Own Profiles', 'account', 'profiles', 'manage', 'own', 'account.profiles.manage.own', 'Manage user''s own profiles', true),
    ('Manage All Profiles', 'account', 'profiles', 'manage', 'account', 'account.profiles.manage.all', 'Manage all profiles in the account', true),
    
    -- Billing permissions (replacing can_access_billing)
    ('View Billing', 'account', 'billing', 'view', 'account', 'account.billing.view', 'View billing information', true),
    ('Manage Billing', 'account', 'billing', 'manage', 'account', 'account.billing.manage', 'Manage billing settings and payments', true),
    
    -- Job booking permissions (replacing can_book_jobs)
    ('Book Jobs', 'account', 'jobs', 'book', 'account', 'account.jobs.book', 'Book jobs on behalf of the account', true),
    ('View Jobs', 'account', 'jobs', 'view', 'account', 'account.jobs.view', 'View all jobs in the account', true),
    
    -- Team management permissions
    ('Manage Team', 'account', 'team', 'manage', 'account', 'account.team.manage', 'Manage team members and roles', true),
    ('Invite Team Members', 'account', 'team', 'invite', 'account', 'account.team.invite', 'Invite new team members', true),
    
    -- Product permissions
    ('Create Products', 'account', 'products', 'create', 'account', 'account.products.create', 'Create new products', true),
    ('Manage Products', 'account', 'products', 'manage', 'account', 'account.products.manage', 'Manage existing products', true),
    ('Delete Products', 'account', 'products', 'delete', 'account', 'account.products.delete', 'Delete products', true)
) AS v(name, module, resource, action, scope, pattern, description, is_system)
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE pattern = v.pattern
);

-- Step 2: Create standard roles with proper permissions
DO $$
DECLARE
    account_admin_role_id INTEGER;
    account_manager_role_id INTEGER;
    account_member_role_id INTEGER;
    perm_id INTEGER;
BEGIN
    -- Get or create account-level roles
    INSERT INTO roles (code, name, module, level, description, is_system, created_at, updated_at)
    VALUES 
        ('account_admin', 'Account Administrator', 'account', 3, 'Full administrative access to the account', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('account_manager', 'Account Manager', 'account', 3, 'Manage account resources and team', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('account_member', 'Account Member', 'account', 3, 'Basic account member with limited permissions', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (code) DO NOTHING;
    
    SELECT id INTO account_admin_role_id FROM roles WHERE code = 'account_admin';
    SELECT id INTO account_manager_role_id FROM roles WHERE code = 'account_manager';
    SELECT id INTO account_member_role_id FROM roles WHERE code = 'account_member';
    
    -- Assign permissions to Account Administrator (all permissions)
    FOR perm_id IN 
        SELECT id FROM permissions 
        WHERE module = 'account' 
        AND is_system = true
    LOOP
        INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
        VALUES (account_admin_role_id, perm_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Assign permissions to Account Manager (most permissions, no billing management)
    FOR perm_id IN 
        SELECT id FROM permissions 
        WHERE module = 'account' 
        AND pattern NOT LIKE '%billing.manage%'
        AND is_system = true
    LOOP
        INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
        VALUES (account_manager_role_id, perm_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Assign permissions to Account Member (basic permissions)
    FOR perm_id IN 
        SELECT id FROM permissions 
        WHERE module = 'account' 
        AND pattern IN (
            'account.profiles.manage.own',
            'account.jobs.view',
            'account.billing.view',
            'account.products.view'
        )
    LOOP
        INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
        VALUES (account_member_role_id, perm_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- Step 3: Create a permission check function (best practice)
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id INTEGER,
    p_permission_pattern VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    -- Check direct user permissions first
    SELECT EXISTS (
        SELECT 1 
        FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        WHERE up.user_id = p_user_id 
        AND p.pattern = p_permission_pattern
        AND up.is_denied = false
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
        AND p.pattern = p_permission_pattern
        AND ur.is_active = true
        AND u.is_active = true
    ) INTO has_perm;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create helper views for permission management
CREATE OR REPLACE VIEW v_user_effective_permissions AS
SELECT DISTINCT
    u.id as user_id,
    u.username,
    p.id as permission_id,
    p.pattern,
    p.name as permission_name,
    p.module,
    p.resource,
    p.action,
    p.scope,
    CASE 
        WHEN up.id IS NOT NULL THEN 'direct'
        ELSE 'role'
    END as grant_type,
    COALESCE(r.name, 'Direct Grant') as granted_via
FROM users u
LEFT JOIN user_permissions up ON u.id = up.user_id AND up.is_denied = false
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN permissions p ON p.id = up.permission_id OR p.id = rp.permission_id
WHERE u.is_active = true
AND p.id IS NOT NULL;

-- Step 5: Report on permission system setup
DO $$
DECLARE
    perm_count INTEGER;
    role_count INTEGER;
    role_perm_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO perm_count FROM permissions WHERE module = 'account';
    SELECT COUNT(*) INTO role_count FROM roles WHERE module = 'account';
    SELECT COUNT(*) INTO role_perm_count FROM role_permissions rp
    JOIN roles r ON rp.role_id = r.id
    WHERE r.module = 'account';
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Permission System Setup Complete ===';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '  - % account-level permissions', perm_count;
    RAISE NOTICE '  - % account roles', role_count;
    RAISE NOTICE '  - % role-permission assignments', role_perm_count;
    RAISE NOTICE '  - user_has_permission() function';
    RAISE NOTICE '  - v_user_effective_permissions view';
    RAISE NOTICE '';
    RAISE NOTICE 'Usage: SELECT user_has_permission(user_id, ''account.profiles.create'');';
END $$;