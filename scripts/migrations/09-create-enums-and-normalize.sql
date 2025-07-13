-- Database Normalization: Create Enums and Fix String Fields
-- Addresses issues from KB tasks 29 and 30
-- Created: 2025-01-12

-- ============================================================================
-- STEP 1: CREATE ENUMS FOR STRING FIELDS
-- ============================================================================

-- Gender enum (Task 30 - Subtask 123)
DO $$ BEGIN
    CREATE TYPE gender_enum AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User type enum
DO $$ BEGIN
    CREATE TYPE user_type_enum AS ENUM ('INDIVIDUAL', 'COMPANY', 'ORGANIZATION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Application status enum
DO $$ BEGIN
    CREATE TYPE application_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DRAFT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Account type enum
DO $$ BEGIN
    CREATE TYPE account_type_enum AS ENUM ('PERSONAL', 'BUSINESS', 'ORGANIZATION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Marketplace side enum
DO $$ BEGIN
    CREATE TYPE marketplace_side_enum AS ENUM ('BUYER', 'SELLER', 'BOTH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Cache status enum
DO $$ BEGIN
    CREATE TYPE cache_status_enum AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Theme preference enum
DO $$ BEGIN
    CREATE TYPE theme_enum AS ENUM ('LIGHT', 'DARK', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Time format enum
DO $$ BEGIN
    CREATE TYPE time_format_enum AS ENUM ('12H', '24H');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Currency position enum
DO $$ BEGIN
    CREATE TYPE currency_position_enum AS ENUM ('BEFORE', 'AFTER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Date format enum
DO $$ BEGIN
    CREATE TYPE date_format_enum AS ENUM ('YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD.MM.YYYY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 2: CONVERT USERS TABLE FIELDS TO ENUMS (Task 30 - Subtasks 123, 124)
-- ============================================================================

-- Convert gender field
ALTER TABLE users ADD COLUMN gender_new gender_enum;

UPDATE users SET gender_new = 
  CASE 
    WHEN UPPER(TRIM(gender)) = 'MALE' THEN 'MALE'::gender_enum
    WHEN UPPER(TRIM(gender)) = 'FEMALE' THEN 'FEMALE'::gender_enum
    WHEN UPPER(TRIM(gender)) = 'OTHER' THEN 'OTHER'::gender_enum
    WHEN gender IS NOT NULL THEN 'PREFER_NOT_TO_SAY'::gender_enum
    ELSE NULL
  END;

ALTER TABLE users DROP COLUMN IF EXISTS gender;
ALTER TABLE users RENAME COLUMN gender_new TO gender;

-- Convert user_type field
ALTER TABLE users ADD COLUMN user_type_new user_type_enum;

UPDATE users SET user_type_new = 
  CASE 
    WHEN UPPER(TRIM(user_type)) = 'INDIVIDUAL' THEN 'INDIVIDUAL'::user_type_enum
    WHEN UPPER(TRIM(user_type)) = 'COMPANY' THEN 'COMPANY'::user_type_enum
    WHEN UPPER(TRIM(user_type)) = 'ORGANIZATION' THEN 'ORGANIZATION'::user_type_enum
    ELSE 'INDIVIDUAL'::user_type_enum
  END;

ALTER TABLE users DROP COLUMN user_type;
ALTER TABLE users RENAME COLUMN user_type_new TO user_type;
ALTER TABLE users ALTER COLUMN user_type SET DEFAULT 'INDIVIDUAL'::user_type_enum;

-- Convert profile_application_status field
ALTER TABLE users ADD COLUMN profile_application_status_new application_status_enum;

UPDATE users SET profile_application_status_new = 
  CASE 
    WHEN UPPER(TRIM(profile_application_status)) = 'PENDING' THEN 'PENDING'::application_status_enum
    WHEN UPPER(TRIM(profile_application_status)) = 'APPROVED' THEN 'APPROVED'::application_status_enum
    WHEN UPPER(TRIM(profile_application_status)) = 'REJECTED' THEN 'REJECTED'::application_status_enum
    WHEN UPPER(TRIM(profile_application_status)) = 'DRAFT' THEN 'DRAFT'::application_status_enum
    ELSE NULL
  END;

ALTER TABLE users DROP COLUMN IF EXISTS profile_application_status;
ALTER TABLE users RENAME COLUMN profile_application_status_new TO profile_application_status;

-- ============================================================================
-- STEP 3: CONVERT ACCOUNTS TABLE FIELDS TO ENUMS
-- ============================================================================

-- Convert account_type field
ALTER TABLE accounts ADD COLUMN account_type_new account_type_enum;

UPDATE accounts SET account_type_new = 
  CASE 
    WHEN UPPER(TRIM(account_type)) = 'PERSONAL' THEN 'PERSONAL'::account_type_enum
    WHEN UPPER(TRIM(account_type)) = 'BUSINESS' THEN 'BUSINESS'::account_type_enum
    WHEN UPPER(TRIM(account_type)) = 'ORGANIZATION' THEN 'ORGANIZATION'::account_type_enum
    ELSE 'PERSONAL'::account_type_enum
  END;

ALTER TABLE accounts DROP COLUMN account_type;
ALTER TABLE accounts RENAME COLUMN account_type_new TO account_type;
ALTER TABLE accounts ALTER COLUMN account_type SET DEFAULT 'PERSONAL'::account_type_enum;

-- Convert primary_marketplace_side field
ALTER TABLE accounts ADD COLUMN primary_marketplace_side_new marketplace_side_enum;

UPDATE accounts SET primary_marketplace_side_new = 
  CASE 
    WHEN UPPER(TRIM(primary_marketplace_side)) = 'BUYER' THEN 'BUYER'::marketplace_side_enum
    WHEN UPPER(TRIM(primary_marketplace_side)) = 'SELLER' THEN 'SELLER'::marketplace_side_enum
    WHEN UPPER(TRIM(primary_marketplace_side)) = 'BOTH' THEN 'BOTH'::marketplace_side_enum
    ELSE NULL
  END;

ALTER TABLE accounts DROP COLUMN IF EXISTS primary_marketplace_side;
ALTER TABLE accounts RENAME COLUMN primary_marketplace_side_new TO primary_marketplace_side;

-- ============================================================================
-- STEP 4: CONVERT USER PREFERENCES FIELDS TO ENUMS (Task 30 - Subtask 130)
-- ============================================================================

-- Convert theme_preference field
ALTER TABLE user_preferences ADD COLUMN theme_preference_new theme_enum;

UPDATE user_preferences SET theme_preference_new = 
  CASE 
    WHEN UPPER(TRIM(theme_preference)) = 'LIGHT' THEN 'LIGHT'::theme_enum
    WHEN UPPER(TRIM(theme_preference)) = 'DARK' THEN 'DARK'::theme_enum
    WHEN UPPER(TRIM(theme_preference)) = 'SYSTEM' THEN 'SYSTEM'::theme_enum
    ELSE 'SYSTEM'::theme_enum
  END;

ALTER TABLE user_preferences DROP COLUMN theme_preference;
ALTER TABLE user_preferences RENAME COLUMN theme_preference_new TO theme_preference;
ALTER TABLE user_preferences ALTER COLUMN theme_preference SET DEFAULT 'SYSTEM'::theme_enum;

-- Convert time_format field
ALTER TABLE user_preferences ADD COLUMN time_format_new time_format_enum;

UPDATE user_preferences SET time_format_new = 
  CASE 
    WHEN TRIM(time_format) = '12h' THEN '12H'::time_format_enum
    WHEN TRIM(time_format) = '24h' THEN '24H'::time_format_enum
    ELSE '24H'::time_format_enum
  END;

ALTER TABLE user_preferences DROP COLUMN time_format;
ALTER TABLE user_preferences RENAME COLUMN time_format_new TO time_format;
ALTER TABLE user_preferences ALTER COLUMN time_format SET DEFAULT '24H'::time_format_enum;

-- Convert currency_position field
ALTER TABLE user_preferences ADD COLUMN currency_position_new currency_position_enum;

UPDATE user_preferences SET currency_position_new = 
  CASE 
    WHEN UPPER(TRIM(currency_position)) = 'BEFORE' THEN 'BEFORE'::currency_position_enum
    WHEN UPPER(TRIM(currency_position)) = 'AFTER' THEN 'AFTER'::currency_position_enum
    ELSE 'BEFORE'::currency_position_enum
  END;

ALTER TABLE user_preferences DROP COLUMN currency_position;
ALTER TABLE user_preferences RENAME COLUMN currency_position_new TO currency_position;
ALTER TABLE user_preferences ALTER COLUMN currency_position SET DEFAULT 'BEFORE'::currency_position_enum;

-- Convert date_format field
ALTER TABLE user_preferences ADD COLUMN date_format_new date_format_enum;

UPDATE user_preferences SET date_format_new = 
  CASE 
    WHEN TRIM(date_format) = 'YYYY-MM-DD' THEN 'YYYY-MM-DD'::date_format_enum
    WHEN TRIM(date_format) = 'DD/MM/YYYY' THEN 'DD/MM/YYYY'::date_format_enum
    WHEN TRIM(date_format) = 'MM/DD/YYYY' THEN 'MM/DD/YYYY'::date_format_enum
    WHEN TRIM(date_format) = 'DD.MM.YYYY' THEN 'DD.MM.YYYY'::date_format_enum
    ELSE 'YYYY-MM-DD'::date_format_enum
  END;

ALTER TABLE user_preferences DROP COLUMN date_format;
ALTER TABLE user_preferences RENAME COLUMN date_format_new TO date_format;
ALTER TABLE user_preferences ALTER COLUMN date_format SET DEFAULT 'YYYY-MM-DD'::date_format_enum;

-- ============================================================================
-- STEP 5: FIX CACHE TABLES (Task 30 - Subtask 124)
-- ============================================================================

-- Convert CacheWarmupQueue.status
ALTER TABLE cache_warmup_queue ADD COLUMN status_new cache_status_enum;

UPDATE cache_warmup_queue SET status_new = 
  CASE 
    WHEN UPPER(TRIM(status)) = 'PENDING' THEN 'PENDING'::cache_status_enum
    WHEN UPPER(TRIM(status)) = 'PROCESSING' THEN 'PROCESSING'::cache_status_enum
    WHEN UPPER(TRIM(status)) = 'COMPLETED' THEN 'COMPLETED'::cache_status_enum
    WHEN UPPER(TRIM(status)) = 'FAILED' THEN 'FAILED'::cache_status_enum
    ELSE 'PENDING'::cache_status_enum
  END;

ALTER TABLE cache_warmup_queue DROP COLUMN status;
ALTER TABLE cache_warmup_queue RENAME COLUMN status_new TO status;
ALTER TABLE cache_warmup_queue ALTER COLUMN status SET DEFAULT 'PENDING'::cache_status_enum;

-- ============================================================================
-- STEP 6: REPORT MIGRATION RESULTS
-- ============================================================================

DO $$
DECLARE
    enum_count INTEGER;
BEGIN
    -- Count enums created
    SELECT COUNT(*) INTO enum_count 
    FROM pg_type 
    WHERE typname LIKE '%_enum';
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Enum Migration Complete ===';
    RAISE NOTICE 'Created % enum types', enum_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Converted fields:';
    RAISE NOTICE '  - users.gender → gender_enum';
    RAISE NOTICE '  - users.user_type → user_type_enum';
    RAISE NOTICE '  - users.profile_application_status → application_status_enum';
    RAISE NOTICE '  - accounts.account_type → account_type_enum';
    RAISE NOTICE '  - accounts.primary_marketplace_side → marketplace_side_enum';
    RAISE NOTICE '  - user_preferences.theme_preference → theme_enum';
    RAISE NOTICE '  - user_preferences.time_format → time_format_enum';
    RAISE NOTICE '  - user_preferences.currency_position → currency_position_enum';
    RAISE NOTICE '  - user_preferences.date_format → date_format_enum';
    RAISE NOTICE '  - cache_warmup_queue.status → cache_status_enum';
    RAISE NOTICE '';
    RAISE NOTICE 'Benefits:';
    RAISE NOTICE '  ✅ Database-level validation';
    RAISE NOTICE '  ✅ Data integrity enforced';
    RAISE NOTICE '  ✅ No invalid values possible';
    RAISE NOTICE '  ✅ Better query performance';
    RAISE NOTICE '  ✅ Clear API contracts';
END $$;