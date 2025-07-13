-- Rollback Script: Boolean Permission Columns
-- This script reverses the boolean permissions to RBAC migration
-- Created: 2025-01-12

-- Step 1: Restore boolean permission values from backup
UPDATE users u
SET 
    can_create_profiles = b.can_create_profiles,
    can_manage_profiles = b.can_manage_profiles,
    can_access_billing = b.can_access_billing,
    can_modify_billing = b.can_modify_billing,
    can_create_products = b.can_create_products,
    can_manage_products = b.can_manage_products,
    can_manage_team = b.can_manage_team
FROM users_boolean_permissions_backup b
WHERE u.id = b.user_id;

-- Step 2: If columns were dropped, recreate them
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'can_create_profiles'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN can_create_profiles BOOLEAN DEFAULT false,
        ADD COLUMN can_manage_profiles BOOLEAN DEFAULT false,
        ADD COLUMN can_access_billing BOOLEAN DEFAULT false,
        ADD COLUMN can_modify_billing BOOLEAN DEFAULT false,
        ADD COLUMN can_create_products BOOLEAN DEFAULT false,
        ADD COLUMN can_manage_products BOOLEAN DEFAULT false,
        ADD COLUMN can_manage_team BOOLEAN DEFAULT false;
        
        -- Restore from backup
        UPDATE users u
        SET 
            can_create_profiles = b.can_create_profiles,
            can_manage_profiles = b.can_manage_profiles,
            can_access_billing = b.can_access_billing,
            can_modify_billing = b.can_modify_billing,
            can_create_products = b.can_create_products,
            can_manage_products = b.can_manage_products,
            can_manage_team = b.can_manage_team
        FROM users_boolean_permissions_backup b
        WHERE u.id = b.user_id;
    END IF;
END $$;

-- Step 3: Remove user permission grants that were created during migration
DELETE FROM user_permission_grants
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
)
AND created_at >= (
    SELECT MIN(migrated_at) FROM users_boolean_permissions_backup
);

-- Step 4: Remove users from the custom role
DELETE FROM user_roles
WHERE role_id = (SELECT id FROM roles WHERE code = 'account_custom')
AND created_at >= (
    SELECT MIN(migrated_at) FROM users_boolean_permissions_backup
);

-- Step 5: Drop the compatibility view
DROP VIEW IF EXISTS v_users_with_boolean_permissions;

-- Step 6: Remove the custom role if it has no users
DELETE FROM role_permissions 
WHERE role_id = (SELECT id FROM roles WHERE code = 'account_custom');

DELETE FROM roles 
WHERE code = 'account_custom' 
AND NOT EXISTS (
    SELECT 1 FROM user_roles WHERE role_id = roles.id
);

-- Step 7: Remove deprecation comments
COMMENT ON COLUMN users.can_create_profiles IS NULL;
COMMENT ON COLUMN users.can_manage_profiles IS NULL;
COMMENT ON COLUMN users.can_access_billing IS NULL;
COMMENT ON COLUMN users.can_modify_billing IS NULL;
COMMENT ON COLUMN users.can_create_products IS NULL;
COMMENT ON COLUMN users.can_manage_products IS NULL;
COMMENT ON COLUMN users.can_manage_team IS NULL;

-- Step 8: Drop the backup table (optional - you might want to keep it)
-- DROP TABLE IF EXISTS users_boolean_permissions_backup;

-- Step 9: Log rollback results
DO $$
DECLARE
    users_with_perms INTEGER;
    total_perms INTEGER;
BEGIN
    SELECT COUNT(*) INTO users_with_perms 
    FROM users 
    WHERE 
        can_create_profiles = true OR
        can_manage_profiles = true OR
        can_access_billing = true OR
        can_modify_billing = true OR
        can_create_products = true OR
        can_manage_products = true OR
        can_manage_team = true;
    
    SELECT 
        SUM(CASE WHEN can_create_profiles = true THEN 1 ELSE 0 END) +
        SUM(CASE WHEN can_manage_profiles = true THEN 1 ELSE 0 END) +
        SUM(CASE WHEN can_access_billing = true THEN 1 ELSE 0 END) +
        SUM(CASE WHEN can_modify_billing = true THEN 1 ELSE 0 END) +
        SUM(CASE WHEN can_create_products = true THEN 1 ELSE 0 END) +
        SUM(CASE WHEN can_manage_products = true THEN 1 ELSE 0 END) +
        SUM(CASE WHEN can_manage_team = true THEN 1 ELSE 0 END)
    INTO total_perms
    FROM users;
    
    RAISE NOTICE 'Boolean permissions rollback completed.';
    RAISE NOTICE 'Users with boolean permissions: %', users_with_perms;
    RAISE NOTICE 'Total permission flags set: %', total_perms;
END $$;