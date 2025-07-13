-- Migration: Fix Enum Mappings
-- This script updates all enums to use consistent snake_case mapping
-- for better compatibility between Prisma and PostgreSQL

BEGIN;

-- ==================== DROP EXISTING ENUM DEPENDENCIES ====================
-- We need to temporarily remove constraints that use enums

-- Save current enum values to temporary tables
CREATE TEMP TABLE temp_profile_types AS 
SELECT DISTINCT profile_type FROM "User";

CREATE TEMP TABLE temp_change_levels AS 
SELECT DISTINCT change_level FROM "ChangeSet";

CREATE TEMP TABLE temp_user_activity_types AS 
SELECT DISTINCT activity_type FROM "UserActivityLog";

-- ==================== RECREATE ENUMS WITH PROPER MAPPING ====================

-- ProfileType enum
DO $$
BEGIN
    -- Check if enum needs updating
    IF EXISTS (
        SELECT 1 
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'ProfileType' 
        AND e.enumlabel IN ('MODEL', 'PHOTOGRAPHER')
    ) THEN
        -- Create new enum with proper values
        CREATE TYPE "ProfileType_new" AS ENUM (
            'model',
            'photographer',
            'agency',
            'client',
            'brand',
            'venue',
            'stylist',
            'makeup_artist',
            'hair_stylist',
            'producer',
            'director',
            'other'
        );
        
        -- Update columns to use new enum
        ALTER TABLE "User" 
        ALTER COLUMN profile_type TYPE "ProfileType_new" 
        USING (
            CASE profile_type::text
                WHEN 'MODEL' THEN 'model'::ProfileType_new
                WHEN 'PHOTOGRAPHER' THEN 'photographer'::ProfileType_new
                WHEN 'AGENCY' THEN 'agency'::ProfileType_new
                WHEN 'CLIENT' THEN 'client'::ProfileType_new
                ELSE profile_type::text::ProfileType_new
            END
        );
        
        -- Drop old enum and rename new one
        DROP TYPE "ProfileType";
        ALTER TYPE "ProfileType_new" RENAME TO "ProfileType";
    END IF;
END $$;

-- ChangeLevel enum
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'ChangeLevel' 
        AND e.enumlabel = 'OPTIMISTIC'
    ) THEN
        CREATE TYPE "ChangeLevel_new" AS ENUM (
            'optimistic',
            'processing',
            'committed'
        );
        
        ALTER TABLE "ChangeSet" 
        ALTER COLUMN change_level TYPE "ChangeLevel_new" 
        USING (
            CASE change_level::text
                WHEN 'OPTIMISTIC' THEN 'optimistic'::ChangeLevel_new
                WHEN 'PROCESSING' THEN 'processing'::ChangeLevel_new
                WHEN 'COMMITTED' THEN 'committed'::ChangeLevel_new
                ELSE LOWER(change_level::text)::ChangeLevel_new
            END
        );
        
        DROP TYPE "ChangeLevel";
        ALTER TYPE "ChangeLevel_new" RENAME TO "ChangeLevel";
    END IF;
END $$;

-- UserActivityType enum
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_type 
        WHERE typname = 'UserActivityType'
    ) THEN
        CREATE TYPE "UserActivityType_new" AS ENUM (
            'login',
            'logout',
            'create',
            'update',
            'delete',
            'view',
            'download',
            'upload',
            'share',
            'comment',
            'like',
            'follow',
            'unfollow',
            'invite',
            'accept',
            'reject',
            'archive',
            'restore',
            'export',
            'import',
            'other'
        );
        
        -- Update any columns using this enum
        -- Note: Add actual table updates here if UserActivityType is used
        
        DROP TYPE IF EXISTS "UserActivityType";
        ALTER TYPE "UserActivityType_new" RENAME TO "UserActivityType";
    END IF;
END $$;

-- ==================== CREATE MISSING ENUMS ====================

-- Entity Status enum (commonly used)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EntityStatus') THEN
        CREATE TYPE "EntityStatus" AS ENUM (
            'draft',
            'pending',
            'active',
            'inactive',
            'suspended',
            'archived',
            'deleted'
        );
    END IF;
END $$;

-- Subscription Status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionStatus') THEN
        CREATE TYPE "SubscriptionStatus" AS ENUM (
            'trialing',
            'active',
            'past_due',
            'canceled',
            'unpaid',
            'incomplete',
            'incomplete_expired',
            'paused'
        );
    END IF;
END $$;

-- Permission Scope
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PermissionScope') THEN
        CREATE TYPE "PermissionScope" AS ENUM (
            'own',
            'team',
            'account',
            'tenant',
            'all'
        );
    END IF;
END $$;

-- Tier Level
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TierLevel') THEN
        CREATE TYPE "TierLevel" AS ENUM (
            'platform',
            'tenant',
            'account',
            'user',
            'public'
        );
    END IF;
END $$;

-- ==================== UPDATE ENUM COLUMNS ====================

-- Add default enum values where missing
UPDATE "User" 
SET profile_type = 'other' 
WHERE profile_type IS NULL;

UPDATE "ChangeSet" 
SET change_level = 'optimistic' 
WHERE change_level IS NULL;

-- ==================== CREATE ENUM MAPPING FUNCTION ====================

-- Helper function to check enum consistency
CREATE OR REPLACE FUNCTION check_enum_consistency()
RETURNS TABLE (
    enum_name TEXT,
    enum_values TEXT[],
    is_snake_case BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.typname::TEXT as enum_name,
        array_agg(e.enumlabel ORDER BY e.enumsortorder)::TEXT[] as enum_values,
        bool_and(e.enumlabel = LOWER(e.enumlabel)) as is_snake_case
    FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE n.nspname = 'public'
    AND t.typtype = 'e'
    GROUP BY t.typname;
END;
$$ LANGUAGE plpgsql;

-- ==================== VALIDATION ====================

-- Check all enums are now snake_case
DO $$
DECLARE
    non_snake_case_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO non_snake_case_count
    FROM check_enum_consistency()
    WHERE NOT is_snake_case;
    
    IF non_snake_case_count > 0 THEN
        RAISE NOTICE 'Warning: % enums still have non-snake_case values', non_snake_case_count;
    ELSE
        RAISE NOTICE 'Success: All enums now use snake_case values';
    END IF;
END $$;

-- List all enums and their values for verification
SELECT * FROM check_enum_consistency() ORDER BY enum_name;

COMMIT;

-- ==================== ROLLBACK SCRIPT ====================
-- Save as rollback-05-revert-enum-mappings.sql

/*
BEGIN;

-- Revert ProfileType
CREATE TYPE "ProfileType_old" AS ENUM ('MODEL', 'PHOTOGRAPHER', 'AGENCY', 'CLIENT');
ALTER TABLE "User" 
ALTER COLUMN profile_type TYPE "ProfileType_old" 
USING (UPPER(profile_type::text)::ProfileType_old);
DROP TYPE "ProfileType";
ALTER TYPE "ProfileType_old" RENAME TO "ProfileType";

-- Revert ChangeLevel
CREATE TYPE "ChangeLevel_old" AS ENUM ('OPTIMISTIC', 'PROCESSING', 'COMMITTED');
ALTER TABLE "ChangeSet" 
ALTER COLUMN change_level TYPE "ChangeLevel_old" 
USING (UPPER(change_level::text)::ChangeLevel_old);
DROP TYPE "ChangeLevel";
ALTER TYPE "ChangeLevel_old" RENAME TO "ChangeLevel";

-- Drop new enums
DROP TYPE IF EXISTS "EntityStatus";
DROP TYPE IF EXISTS "SubscriptionStatus";
DROP TYPE IF EXISTS "PermissionScope";
DROP TYPE IF EXISTS "TierLevel";

DROP FUNCTION IF EXISTS check_enum_consistency();

COMMIT;
*/