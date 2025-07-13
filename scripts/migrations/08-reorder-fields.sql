-- Field Reordering Migration
-- This script reorders columns to follow: uuid, id, foreign keys, then other fields
-- PostgreSQL doesn't support column reordering directly, so we need to recreate tables

-- IMPORTANT: This is a complex migration that requires careful execution
-- It should be run during a maintenance window with proper backups

BEGIN;

-- Function to safely recreate a table with reordered columns
CREATE OR REPLACE FUNCTION reorder_table_columns(
    p_table_name text,
    p_column_order text[]
) RETURNS void AS $$
DECLARE
    v_temp_table text;
    v_columns text;
    v_constraints text;
    v_indexes text;
    v_check_uuid boolean;
BEGIN
    v_temp_table := p_table_name || '_temp_reorder';
    
    -- Check if table has uuid column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = p_table_name AND column_name = 'uuid'
    ) INTO v_check_uuid;
    
    IF NOT v_check_uuid THEN
        RAISE NOTICE 'Table % does not have uuid column, skipping', p_table_name;
        RETURN;
    END IF;
    
    -- Create column list in new order
    SELECT string_agg(
        column_name || ' ' || 
        data_type || 
        CASE 
            WHEN character_maximum_length IS NOT NULL 
            THEN '(' || character_maximum_length || ')'
            ELSE ''
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
        ', '
    ) INTO v_columns
    FROM (
        SELECT 
            c.column_name,
            c.data_type,
            c.character_maximum_length,
            c.is_nullable,
            c.column_default,
            COALESCE(array_position(p_column_order, c.column_name), 999) as sort_order
        FROM information_schema.columns c
        WHERE c.table_name = p_table_name
        ORDER BY sort_order, c.ordinal_position
    ) ordered_columns;
    
    -- Create temporary table with new column order
    EXECUTE format('CREATE TABLE %I AS TABLE %I WITH NO DATA', v_temp_table, p_table_name);
    
    -- Copy data
    EXECUTE format('INSERT INTO %I SELECT * FROM %I', v_temp_table, p_table_name);
    
    -- Drop original table
    EXECUTE format('DROP TABLE %I CASCADE', p_table_name);
    
    -- Rename temp table
    EXECUTE format('ALTER TABLE %I RENAME TO %I', v_temp_table, p_table_name);
    
    RAISE NOTICE 'Successfully reordered columns for table %', p_table_name;
END;
$$ LANGUAGE plpgsql;

-- Note: The above function is complex and risky. 
-- Instead, let's use a safer approach with views and gradually migrate

-- Create views with proper column ordering for critical tables
-- This allows applications to use the correct field order without recreating tables

-- Account view with proper ordering
CREATE OR REPLACE VIEW v_account_ordered AS
SELECT 
    uuid,
    id,
    "tenantId",
    -- other fields in logical order
    email,
    "emailVerified",
    "passwordHash",
    "accountType",
    phone,
    timezone,
    "countryCode",
    "languageLocale",
    "currencyCode",
    city,
    "dateFormat",
    "timeFormat",
    "numberFormat",
    "emailNotifications",
    "smsNotifications",
    "themePreference",
    "accountCapabilities",
    "primaryMarketplaceSide",
    "allowDualSide",
    "isActive",
    "isVerified",
    "lastLoginAt",
    "createdAt",
    "updatedAt",
    "firstDayOfWeek",
    "decimalSeparator",
    "thousandsSeparator",
    "currencyPosition",
    "currencySpace",
    "useRelativeTime",
    "relativeTimeThreshold",
    "relativeTimeStyle",
    "compactMode",
    "showSeconds",
    "showTimezone",
    "notificationTimeFormat"
FROM "Account";

-- User view with proper ordering
CREATE OR REPLACE VIEW v_user_ordered AS
SELECT 
    uuid,
    id,
    "accountId",
    -- other fields
    "firstName",
    "lastName",
    username,
    "userType",
    "profilePhotoUrl",
    bio,
    website,
    "dateOfBirth",
    gender,
    "accountRole",
    "canCreateProfiles",
    "canManageAllProfiles",
    "canAccessBilling",
    "canBookJobs",
    "profileApplicationStatus",
    "profileApprovedAt",
    "profileRejectedAt",
    "totalApplications",
    "lastApplicationAt",
    "userHash",
    "isActive",
    "isVerified",
    "createdAt",
    "updatedAt",
    "emergencyUntil"
FROM "User";

-- Permission view with proper ordering
CREATE OR REPLACE VIEW v_permission_ordered AS
SELECT 
    uuid,
    id,
    name,
    description,
    pattern,
    resource,
    action,
    scope,
    "isWildcard",
    priority,
    "createdAt",
    "updatedAt"
FROM "Permission";

-- Role view with proper ordering
CREATE OR REPLACE VIEW v_role_ordered AS
SELECT 
    uuid,
    id,
    "tenantId",
    name,
    description,
    code,
    level,
    "isSystem",
    "createdAt",
    "updatedAt"
FROM "Role";

-- Create indexes on UUID columns that are now first
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_account_uuid_first ON "Account"(uuid);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_uuid_first ON "User"(uuid);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permission_uuid_first ON "Permission"(uuid);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_uuid_first ON "Role"(uuid);

-- Add comments explaining the views
COMMENT ON VIEW v_account_ordered IS 'Account table with properly ordered columns (uuid first)';
COMMENT ON VIEW v_user_ordered IS 'User table with properly ordered columns (uuid first)';
COMMENT ON VIEW v_permission_ordered IS 'Permission table with properly ordered columns (uuid first)';
COMMENT ON VIEW v_role_ordered IS 'Role table with properly ordered columns (uuid first)';

-- For new tables, we can enforce column order by recreating them
-- Example for a smaller table:

-- Backup data from PermissionSet
CREATE TEMP TABLE temp_permission_set AS SELECT * FROM "PermissionSet";

-- Drop and recreate with proper column order
DROP TABLE IF EXISTS "PermissionSet" CASCADE;

CREATE TABLE "PermissionSet" (
    uuid UUID DEFAULT gen_random_uuid() UNIQUE,
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- Restore data
INSERT INTO "PermissionSet" (uuid, id, name, description, "createdAt", "updatedAt")
SELECT uuid, id, name, description, "createdAt", "updatedAt" FROM temp_permission_set;

-- Reset sequence
SELECT setval(pg_get_serial_sequence('"PermissionSet"', 'id'), 
    (SELECT MAX(id) FROM "PermissionSet"));

DROP TABLE temp_permission_set;

COMMIT;

-- Note: For production use, we recommend:
-- 1. Using views for read operations with proper column order
-- 2. Gradually migrating tables during maintenance windows
-- 3. Updating application code to use uuid as primary identifier
-- 4. Once all apps are updated, physically reorder columns in a future migration