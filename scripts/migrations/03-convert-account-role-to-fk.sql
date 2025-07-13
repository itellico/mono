-- Database Redesign Migration: Convert users.account_role from TEXT to Foreign Key
-- Part of comprehensive database normalization effort
-- Created: 2025-01-12

-- Step 1: Create account_role_id column (nullable initially)
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_role_id INTEGER;

-- Step 2: Add foreign key constraint (but don't enforce it yet)
-- This allows us to populate the data first
ALTER TABLE users 
ADD CONSTRAINT fk_users_account_role 
FOREIGN KEY (account_role_id) 
REFERENCES roles(id) 
ON DELETE SET NULL
NOT VALID;

-- Step 3: Populate account_role_id based on existing text values
UPDATE users u
SET account_role_id = r.id
FROM roles r
WHERE LOWER(u.account_role) = LOWER(r.code)
AND u.account_role IS NOT NULL;

-- Step 4: Log any unmapped account roles
DO $$
DECLARE
    unmapped_count INTEGER;
    role_rec RECORD;
BEGIN
    -- Count unmapped roles
    SELECT COUNT(DISTINCT account_role) INTO unmapped_count
    FROM users 
    WHERE account_role IS NOT NULL 
    AND account_role_id IS NULL;
    
    IF unmapped_count > 0 THEN
        RAISE WARNING 'Found % unmapped account roles:', unmapped_count;
        
        FOR role_rec IN 
            SELECT DISTINCT account_role, COUNT(*) as user_count
            FROM users 
            WHERE account_role IS NOT NULL 
            AND account_role_id IS NULL
            GROUP BY account_role
        LOOP
            RAISE WARNING 'Unmapped role: "%" (% users)', role_rec.account_role, role_rec.user_count;
        END LOOP;
        
        -- Create missing roles if they don't exist
        INSERT INTO roles (code, name, module, level, is_system, created_at, updated_at)
        SELECT DISTINCT 
            LOWER(REPLACE(account_role, ' ', '_')) as code,
            account_role as name,
            'account' as module,
            3 as level, -- Account level
            false as is_system,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        FROM users 
        WHERE account_role IS NOT NULL 
        AND account_role_id IS NULL
        AND account_role NOT IN (SELECT code FROM roles)
        AND account_role NOT IN (SELECT name FROM roles);
        
        -- Try mapping again after creating missing roles
        UPDATE users u
        SET account_role_id = r.id
        FROM roles r
        WHERE (LOWER(u.account_role) = LOWER(r.code) OR LOWER(u.account_role) = LOWER(r.name))
        AND u.account_role IS NOT NULL
        AND u.account_role_id IS NULL;
    END IF;
    
    -- Final check
    SELECT COUNT(*) INTO unmapped_count
    FROM users 
    WHERE account_role IS NOT NULL 
    AND account_role_id IS NULL;
    
    IF unmapped_count > 0 THEN
        RAISE EXCEPTION 'Still have % unmapped account roles. Please resolve manually before proceeding.', unmapped_count;
    END IF;
END $$;

-- Step 5: Validate the foreign key constraint
ALTER TABLE users VALIDATE CONSTRAINT fk_users_account_role;

-- Step 6: Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_account_role_id ON users(account_role_id);

-- Step 7: Create a view for backward compatibility during transition
CREATE OR REPLACE VIEW v_users_with_text_role AS
SELECT 
    u.*,
    r.code as account_role_code,
    r.name as account_role_name
FROM users u
LEFT JOIN roles r ON u.account_role_id = r.id;

-- Step 8: Add comment documenting the migration
COMMENT ON COLUMN users.account_role_id IS 'Foreign key to roles table - replaces legacy text account_role column';
COMMENT ON COLUMN users.account_role IS 'DEPRECATED: Use account_role_id instead. Will be dropped after full migration.';

-- Step 9: Migration statistics
DO $$
DECLARE
    total_users INTEGER;
    users_with_role INTEGER;
    users_without_role INTEGER;
    r RECORD;
BEGIN
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO users_with_role FROM users WHERE account_role_id IS NOT NULL;
    SELECT COUNT(*) INTO users_without_role FROM users WHERE account_role_id IS NULL;
    
    RAISE NOTICE 'Migration Statistics:';
    RAISE NOTICE '  Total users: %', total_users;
    RAISE NOTICE '  Users with role assigned: %', users_with_role;
    RAISE NOTICE '  Users without role: %', users_without_role;
    
    -- Show role distribution
    RAISE NOTICE '';
    RAISE NOTICE 'Role Distribution:';
    FOR r IN 
        SELECT ro.code, ro.name, COUNT(u.id) as user_count
        FROM roles ro
        LEFT JOIN users u ON u.account_role_id = ro.id
        WHERE ro.module = 'account' OR ro.level = 3
        GROUP BY ro.id, ro.code, ro.name
        ORDER BY user_count DESC
    LOOP
        RAISE NOTICE '  % (%): % users', r.code, r.name, r.user_count;
    END LOOP;
END $$;

-- Note: The actual dropping of the account_role column will be done in a later migration
-- after all code has been updated to use account_role_id