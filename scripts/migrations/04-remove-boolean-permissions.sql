-- Database Redesign Migration: Remove Boolean Permission Columns from Users Table
-- Part of comprehensive database normalization effort
-- Created: 2025-01-12

-- Step 1: Create permissions for the boolean columns if they don't exist
INSERT INTO permissions (code, name, tier, resource, action, is_system, created_at, updated_at)
VALUES 
    ('account.profiles.create', 'Create Profiles', 'account', 'profiles', 'create', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('account.profiles.manage', 'Manage Profiles', 'account', 'profiles', 'manage', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('account.billing.access', 'Access Billing', 'account', 'billing', 'access', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('account.billing.modify', 'Modify Billing', 'account', 'billing', 'modify', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('account.products.create', 'Create Products', 'account', 'products', 'create', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('account.products.manage', 'Manage Products', 'account', 'products', 'manage', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('account.team.manage', 'Manage Team', 'account', 'team', 'manage', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

-- Step 2: Create a mapping table to track which users had which boolean permissions
CREATE TABLE IF NOT EXISTS users_boolean_permissions_backup (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    can_create_profiles BOOLEAN,
    can_manage_profiles BOOLEAN,
    can_access_billing BOOLEAN,
    can_modify_billing BOOLEAN,
    can_create_products BOOLEAN,
    can_manage_products BOOLEAN,
    can_manage_team BOOLEAN,
    migrated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
);

-- Step 3: Backup current boolean permission values
INSERT INTO users_boolean_permissions_backup (
    user_id,
    can_create_profiles,
    can_manage_profiles,
    can_access_billing,
    can_modify_billing,
    can_create_products,
    can_manage_products,
    can_manage_team
)
SELECT 
    id,
    can_create_profiles,
    can_manage_profiles,
    can_access_billing,
    can_modify_billing,
    can_create_products,
    can_manage_products,
    can_manage_team
FROM users
WHERE 
    can_create_profiles IS NOT NULL OR
    can_manage_profiles IS NOT NULL OR
    can_access_billing IS NOT NULL OR
    can_modify_billing IS NOT NULL OR
    can_create_products IS NOT NULL OR
    can_manage_products IS NOT NULL OR
    can_manage_team IS NOT NULL;

-- Step 4: Create role for users with custom permissions (if not exists)
INSERT INTO roles (code, name, tier, description, is_system, created_at, updated_at)
VALUES (
    'account_custom',
    'Account Custom User',
    'account',
    'User with custom permission set (migrated from boolean columns)',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO NOTHING;

-- Step 5: Assign permissions to the custom role based on most common permission patterns
DO $$
DECLARE
    custom_role_id INTEGER;
    perm_id INTEGER;
BEGIN
    -- Get the custom role ID
    SELECT id INTO custom_role_id FROM roles WHERE code = 'account_custom';
    
    -- Assign permissions based on boolean flags
    -- We'll create user-specific role permission overrides later for edge cases
    
    -- Basic permissions that most users with any permission should have
    FOR perm_id IN 
        SELECT id FROM permissions 
        WHERE code IN (
            'account.dashboard.view',
            'account.profile.view',
            'account.settings.view'
        )
    LOOP
        INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
        VALUES (custom_role_id, perm_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- Step 6: Migrate users with boolean permissions to proper role assignments
DO $$
DECLARE
    user_rec RECORD;
    custom_role_id INTEGER;
    user_permission_count INTEGER;
BEGIN
    -- Get the custom role ID
    SELECT id INTO custom_role_id FROM roles WHERE code = 'account_custom';
    
    FOR user_rec IN 
        SELECT * FROM users_boolean_permissions_backup
    LOOP
        -- Count how many permissions this user has
        user_permission_count := 0;
        IF user_rec.can_create_profiles = true THEN user_permission_count := user_permission_count + 1; END IF;
        IF user_rec.can_manage_profiles = true THEN user_permission_count := user_permission_count + 1; END IF;
        IF user_rec.can_access_billing = true THEN user_permission_count := user_permission_count + 1; END IF;
        IF user_rec.can_modify_billing = true THEN user_permission_count := user_permission_count + 1; END IF;
        IF user_rec.can_create_products = true THEN user_permission_count := user_permission_count + 1; END IF;
        IF user_rec.can_manage_products = true THEN user_permission_count := user_permission_count + 1; END IF;
        IF user_rec.can_manage_team = true THEN user_permission_count := user_permission_count + 1; END IF;
        
        IF user_permission_count > 0 THEN
            -- Assign custom role to user if they don't already have a role
            INSERT INTO user_roles (user_id, role_id, assigned_by, created_at, updated_at)
            SELECT user_rec.user_id, custom_role_id, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            WHERE NOT EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_id = user_rec.user_id 
                AND role_id = custom_role_id
            );
            
            -- Create user-specific permission grants
            IF user_rec.can_create_profiles = true THEN
                INSERT INTO user_permission_grants (user_id, permission_id, granted_by, created_at, updated_at)
                SELECT user_rec.user_id, id, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM permissions WHERE code = 'account.profiles.create'
                ON CONFLICT DO NOTHING;
            END IF;
            
            IF user_rec.can_manage_profiles = true THEN
                INSERT INTO user_permission_grants (user_id, permission_id, granted_by, created_at, updated_at)
                SELECT user_rec.user_id, id, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM permissions WHERE code = 'account.profiles.manage'
                ON CONFLICT DO NOTHING;
            END IF;
            
            IF user_rec.can_access_billing = true THEN
                INSERT INTO user_permission_grants (user_id, permission_id, granted_by, created_at, updated_at)
                SELECT user_rec.user_id, id, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM permissions WHERE code = 'account.billing.access'
                ON CONFLICT DO NOTHING;
            END IF;
            
            IF user_rec.can_modify_billing = true THEN
                INSERT INTO user_permission_grants (user_id, permission_id, granted_by, created_at, updated_at)
                SELECT user_rec.user_id, id, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM permissions WHERE code = 'account.billing.modify'
                ON CONFLICT DO NOTHING;
            END IF;
            
            IF user_rec.can_create_products = true THEN
                INSERT INTO user_permission_grants (user_id, permission_id, granted_by, created_at, updated_at)
                SELECT user_rec.user_id, id, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM permissions WHERE code = 'account.products.create'
                ON CONFLICT DO NOTHING;
            END IF;
            
            IF user_rec.can_manage_products = true THEN
                INSERT INTO user_permission_grants (user_id, permission_id, granted_by, created_at, updated_at)
                SELECT user_rec.user_id, id, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM permissions WHERE code = 'account.products.manage'
                ON CONFLICT DO NOTHING;
            END IF;
            
            IF user_rec.can_manage_team = true THEN
                INSERT INTO user_permission_grants (user_id, permission_id, granted_by, created_at, updated_at)
                SELECT user_rec.user_id, id, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM permissions WHERE code = 'account.team.manage'
                ON CONFLICT DO NOTHING;
            END IF;
        END IF;
    END LOOP;
END $$;

-- Step 7: Create view for backward compatibility
CREATE OR REPLACE VIEW v_users_with_boolean_permissions AS
SELECT 
    u.*,
    CASE WHEN EXISTS (
        SELECT 1 FROM user_permission_grants upg
        JOIN permissions p ON upg.permission_id = p.id
        WHERE upg.user_id = u.id AND p.code = 'account.profiles.create'
    ) THEN true ELSE false END as can_create_profiles_computed,
    CASE WHEN EXISTS (
        SELECT 1 FROM user_permission_grants upg
        JOIN permissions p ON upg.permission_id = p.id
        WHERE upg.user_id = u.id AND p.code = 'account.profiles.manage'
    ) THEN true ELSE false END as can_manage_profiles_computed,
    CASE WHEN EXISTS (
        SELECT 1 FROM user_permission_grants upg
        JOIN permissions p ON upg.permission_id = p.id
        WHERE upg.user_id = u.id AND p.code = 'account.billing.access'
    ) THEN true ELSE false END as can_access_billing_computed,
    CASE WHEN EXISTS (
        SELECT 1 FROM user_permission_grants upg
        JOIN permissions p ON upg.permission_id = p.id
        WHERE upg.user_id = u.id AND p.code = 'account.billing.modify'
    ) THEN true ELSE false END as can_modify_billing_computed,
    CASE WHEN EXISTS (
        SELECT 1 FROM user_permission_grants upg
        JOIN permissions p ON upg.permission_id = p.id
        WHERE upg.user_id = u.id AND p.code = 'account.products.create'
    ) THEN true ELSE false END as can_create_products_computed,
    CASE WHEN EXISTS (
        SELECT 1 FROM user_permission_grants upg
        JOIN permissions p ON upg.permission_id = p.id
        WHERE upg.user_id = u.id AND p.code = 'account.products.manage'
    ) THEN true ELSE false END as can_manage_products_computed,
    CASE WHEN EXISTS (
        SELECT 1 FROM user_permission_grants upg
        JOIN permissions p ON upg.permission_id = p.id
        WHERE upg.user_id = u.id AND p.code = 'account.team.manage'
    ) THEN true ELSE false END as can_manage_team_computed
FROM users u;

-- Step 8: Add deprecation comments
COMMENT ON COLUMN users.can_create_profiles IS 'DEPRECATED: Use RBAC permissions instead. Check account.profiles.create permission.';
COMMENT ON COLUMN users.can_manage_profiles IS 'DEPRECATED: Use RBAC permissions instead. Check account.profiles.manage permission.';
COMMENT ON COLUMN users.can_access_billing IS 'DEPRECATED: Use RBAC permissions instead. Check account.billing.access permission.';
COMMENT ON COLUMN users.can_modify_billing IS 'DEPRECATED: Use RBAC permissions instead. Check account.billing.modify permission.';
COMMENT ON COLUMN users.can_create_products IS 'DEPRECATED: Use RBAC permissions instead. Check account.products.create permission.';
COMMENT ON COLUMN users.can_manage_products IS 'DEPRECATED: Use RBAC permissions instead. Check account.products.manage permission.';
COMMENT ON COLUMN users.can_manage_team IS 'DEPRECATED: Use RBAC permissions instead. Check account.team.manage permission.';

-- Step 9: Migration report
DO $$
DECLARE
    total_migrated INTEGER;
    total_permissions_assigned INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_migrated FROM users_boolean_permissions_backup;
    SELECT COUNT(*) INTO total_permissions_assigned FROM user_permission_grants 
    WHERE permission_id IN (
        SELECT id FROM permissions 
        WHERE code IN (
            'account.profiles.create',
            'account.profiles.manage',
            'account.billing.access',
            'account.billing.modify',
            'account.products.create',
            'account.products.manage',
            'account.team.manage'
        )
    );
    
    RAISE NOTICE 'Boolean Permissions Migration Report:';
    RAISE NOTICE '  Users with boolean permissions: %', total_migrated;
    RAISE NOTICE '  Permission grants created: %', total_permissions_assigned;
    RAISE NOTICE '';
    RAISE NOTICE 'Permission distribution:';
    
    FOR r IN 
        SELECT p.code, p.name, COUNT(upg.user_id) as user_count
        FROM permissions p
        LEFT JOIN user_permission_grants upg ON upg.permission_id = p.id
        WHERE p.code IN (
            'account.profiles.create',
            'account.profiles.manage',
            'account.billing.access',
            'account.billing.modify',
            'account.products.create',
            'account.products.manage',
            'account.team.manage'
        )
        GROUP BY p.id, p.code, p.name
        ORDER BY user_count DESC
    LOOP
        RAISE NOTICE '  %: % users', r.code, r.user_count;
    END LOOP;
END $$;

-- Note: The actual dropping of boolean columns will be done in a later migration
-- after all code has been updated to use RBAC permissions