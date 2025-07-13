-- Database Cleanup: Remove All Legacy and Backward Compatibility
-- Part of comprehensive database normalization effort
-- Created: 2025-01-12

-- Step 1: Drop all backward compatibility views
DROP VIEW IF EXISTS v_user_preferences_legacy CASCADE;
DROP VIEW IF EXISTS v_users_with_text_role CASCADE;
DROP VIEW IF EXISTS v_users_with_boolean_permissions CASCADE;

-- Step 2: Drop deprecated columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS account_role CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS can_create_profiles CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS can_manage_all_profiles CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS can_access_billing CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS can_book_jobs CASCADE;

-- Step 3: Drop deprecated columns from accounts table (user preferences)
ALTER TABLE accounts DROP COLUMN IF EXISTS date_format CASCADE;
ALTER TABLE accounts DROP COLUMN IF EXISTS time_format CASCADE;
ALTER TABLE accounts DROP COLUMN IF EXISTS number_format CASCADE;
ALTER TABLE accounts DROP COLUMN IF EXISTS first_day_of_week CASCADE;
ALTER TABLE accounts DROP COLUMN IF EXISTS language_locale CASCADE;
ALTER TABLE accounts DROP COLUMN IF EXISTS timezone CASCADE;
ALTER TABLE accounts DROP COLUMN IF EXISTS currency_code CASCADE;
ALTER TABLE accounts DROP COLUMN IF EXISTS currency_position CASCADE;
ALTER TABLE accounts DROP COLUMN IF EXISTS currency_space CASCADE;
ALTER TABLE accounts DROP COLUMN IF EXISTS decimal_separator CASCADE;
ALTER TABLE accounts DROP COLUMN IF EXISTS thousands_separator CASCADE;
ALTER TABLE accounts DROP COLUMN IF EXISTS theme_preference CASCADE;
ALTER TABLE accounts DROP COLUMN IF EXISTS compact_mode CASCADE;
ALTER TABLE accounts DROP COLUMN IF EXISTS show_seconds CASCADE;
ALTER TABLE accounts DROP COLUMN IF EXISTS show_timezone CASCADE;
ALTER TABLE accounts DROP COLUMN IF EXISTS use_relative_time CASCADE;
ALTER TABLE accounts DROP COLUMN IF EXISTS relative_time_threshold CASCADE;
ALTER TABLE accounts DROP COLUMN IF EXISTS relative_time_style CASCADE;
ALTER TABLE accounts DROP COLUMN IF EXISTS notification_time_format CASCADE;
ALTER TABLE accounts DROP COLUMN IF EXISTS email_notifications CASCADE;
ALTER TABLE accounts DROP COLUMN IF EXISTS sms_notifications CASCADE;

-- Step 4: Add NOT NULL constraint to account_role_id (every user must have a role)
UPDATE users SET account_role_id = (
    SELECT id FROM roles WHERE code = 'user' LIMIT 1
) WHERE account_role_id IS NULL;

ALTER TABLE users ALTER COLUMN account_role_id SET NOT NULL;

-- Step 5: Add useful indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_account_role_id ON users(account_role_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions(permission_id);

-- Step 6: Clean up any test/temporary data
DROP TABLE IF EXISTS users_boolean_permissions_backup;

-- Step 7: Add proper comments to document the clean schema
COMMENT ON COLUMN users.account_role_id IS 'Required foreign key to roles table - defines user''s primary role';
COMMENT ON TABLE user_preferences IS 'User-specific settings and preferences, properly normalized from accounts table';
COMMENT ON TABLE user_permissions IS 'Direct user permission grants outside of role-based permissions';

-- Step 8: Create a clean summary of the new structure
DO $$
DECLARE
    user_count INTEGER;
    pref_count INTEGER;
    role_count INTEGER;
    perm_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO pref_count FROM user_preferences;
    SELECT COUNT(DISTINCT account_role_id) INTO role_count FROM users;
    SELECT COUNT(*) INTO perm_count FROM user_permissions;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Database Cleanup Complete ===';
    RAISE NOTICE 'Clean, normalized structure:';
    RAISE NOTICE '  - % users with proper role assignments', user_count;
    RAISE NOTICE '  - % user preference records', pref_count;
    RAISE NOTICE '  - % distinct roles in use', role_count;
    RAISE NOTICE '  - % direct permission grants', perm_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Removed:';
    RAISE NOTICE '  - All backward compatibility views';
    RAISE NOTICE '  - account_role TEXT column';
    RAISE NOTICE '  - All boolean permission columns';
    RAISE NOTICE '  - All user preference columns from accounts';
    RAISE NOTICE '';
    RAISE NOTICE 'Database is now fully normalized!';
END $$;