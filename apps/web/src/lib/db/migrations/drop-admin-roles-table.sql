-- Drop old admin_roles table
-- This table has been replaced by the new permission system (roles, permissions, user_roles)

BEGIN;

-- First check if the table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_roles') THEN
        -- Drop the table if it exists
        DROP TABLE admin_roles CASCADE;
        RAISE NOTICE 'admin_roles table dropped successfully';
    ELSE
        RAISE NOTICE 'admin_roles table does not exist - skipping';
    END IF;
END $$;

COMMIT; 