-- Rollback Script: Account Role Foreign Key
-- This script reverses the account_role TEXT to FK conversion
-- Created: 2025-01-12

-- Step 1: Restore account_role TEXT values from the FK relationship
UPDATE users u
SET account_role = r.code
FROM roles r
WHERE u.account_role_id = r.id
AND u.account_role IS NULL;

-- If account_role column was dropped, recreate it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'account_role'
    ) THEN
        ALTER TABLE users ADD COLUMN account_role TEXT;
        
        -- Populate from FK
        UPDATE users u
        SET account_role = r.code
        FROM roles r
        WHERE u.account_role_id = r.id;
    END IF;
END $$;

-- Step 2: Drop the compatibility view
DROP VIEW IF EXISTS v_users_with_text_role;

-- Step 3: Drop the index
DROP INDEX IF EXISTS idx_users_account_role_id;

-- Step 4: Drop the foreign key constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_account_role;

-- Step 5: Drop the account_role_id column
ALTER TABLE users DROP COLUMN IF EXISTS account_role_id;

-- Step 6: Remove any comments
COMMENT ON COLUMN users.account_role IS NULL;

-- Step 7: Clean up any roles that were auto-created during migration
DELETE FROM roles 
WHERE code IN (
    SELECT DISTINCT LOWER(REPLACE(account_role, ' ', '_'))
    FROM users 
    WHERE account_role IS NOT NULL
)
AND is_system = false
AND created_at >= CURRENT_DATE - INTERVAL '1 day';

-- Step 8: Log rollback results
DO $$
DECLARE
    users_with_role INTEGER;
    distinct_roles INTEGER;
BEGIN
    SELECT COUNT(*) INTO users_with_role FROM users WHERE account_role IS NOT NULL;
    SELECT COUNT(DISTINCT account_role) INTO distinct_roles FROM users WHERE account_role IS NOT NULL;
    
    RAISE NOTICE 'Account role FK rollback completed.';
    RAISE NOTICE 'Users with account_role: %', users_with_role;
    RAISE NOTICE 'Distinct account roles: %', distinct_roles;
END $$;