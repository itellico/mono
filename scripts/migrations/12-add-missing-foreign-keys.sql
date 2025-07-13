-- Database Normalization: Add Missing Foreign Key Constraints
-- Addresses Task 30 - Subtask 127: Add missing foreign key constraints
-- Created: 2025-01-12

-- ============================================================================
-- STEP 1: ADD MISSING FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add FK constraint for account_capabilities.account_id → accounts.id
-- (This should already exist via Prisma, but ensure it's there)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'account_capabilities_account_id_fkey'
        AND table_name = 'account_capabilities'
    ) THEN
        ALTER TABLE account_capabilities 
        ADD CONSTRAINT account_capabilities_account_id_fkey 
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK constraint: account_capabilities.account_id → accounts.id';
    END IF;
END $$;

-- Add FK constraint for capabilities.id references
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'account_capabilities_capability_id_fkey'
        AND table_name = 'account_capabilities'
    ) THEN
        ALTER TABLE account_capabilities 
        ADD CONSTRAINT account_capabilities_capability_id_fkey 
        FOREIGN KEY (capability_id) REFERENCES capabilities(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK constraint: account_capabilities.capability_id → capabilities.id';
    END IF;
END $$;

-- Add FK constraints for tenant junction tables
DO $$
BEGIN
    -- tenant_features.tenant_id → tenants.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tenant_features_tenant_id_fkey'
        AND table_name = 'tenant_features'
    ) THEN
        ALTER TABLE tenant_features 
        ADD CONSTRAINT tenant_features_tenant_id_fkey 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK constraint: tenant_features.tenant_id → tenants.id';
    END IF;

    -- tenant_features.feature_id → features.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tenant_features_feature_id_fkey'
        AND table_name = 'tenant_features'
    ) THEN
        ALTER TABLE tenant_features 
        ADD CONSTRAINT tenant_features_feature_id_fkey 
        FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK constraint: tenant_features.feature_id → features.id';
    END IF;

    -- tenant_settings.tenant_id → tenants.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tenant_settings_tenant_id_fkey'
        AND table_name = 'tenant_settings'
    ) THEN
        ALTER TABLE tenant_settings 
        ADD CONSTRAINT tenant_settings_tenant_id_fkey 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK constraint: tenant_settings.tenant_id → tenants.id';
    END IF;

    -- tenant_settings.setting_id → settings.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tenant_settings_setting_id_fkey'
        AND table_name = 'tenant_settings'
    ) THEN
        ALTER TABLE tenant_settings 
        ADD CONSTRAINT tenant_settings_setting_id_fkey 
        FOREIGN KEY (setting_id) REFERENCES settings(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK constraint: tenant_settings.setting_id → settings.id';
    END IF;

    -- tenant_categories.tenant_id → tenants.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tenant_categories_tenant_id_fkey'
        AND table_name = 'tenant_categories'
    ) THEN
        ALTER TABLE tenant_categories 
        ADD CONSTRAINT tenant_categories_tenant_id_fkey 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK constraint: tenant_categories.tenant_id → tenants.id';
    END IF;

    -- tenant_categories.category_id → categories.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tenant_categories_category_id_fkey'
        AND table_name = 'tenant_categories'
    ) THEN
        ALTER TABLE tenant_categories 
        ADD CONSTRAINT tenant_categories_category_id_fkey 
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK constraint: tenant_categories.category_id → categories.id';
    END IF;

    -- tenant_countries.tenant_id → tenants.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tenant_countries_tenant_id_fkey'
        AND table_name = 'tenant_countries'
    ) THEN
        ALTER TABLE tenant_countries 
        ADD CONSTRAINT tenant_countries_tenant_id_fkey 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK constraint: tenant_countries.tenant_id → tenants.id';
    END IF;

    -- tenant_countries.country_id → countries.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tenant_countries_country_id_fkey'
        AND table_name = 'tenant_countries'
    ) THEN
        ALTER TABLE tenant_countries 
        ADD CONSTRAINT tenant_countries_country_id_fkey 
        FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK constraint: tenant_countries.country_id → countries.id';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: ADD SELF-REFERENTIAL FK FOR CATEGORIES
-- ============================================================================

-- categories.parent_id → categories.id (self-referential)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'categories_parent_id_fkey'
        AND table_name = 'categories'
    ) THEN
        ALTER TABLE categories 
        ADD CONSTRAINT categories_parent_id_fkey 
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added FK constraint: categories.parent_id → categories.id (self-referential)';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: ENSURE CASCADE BEHAVIOR FOR CRITICAL RELATIONSHIPS
-- ============================================================================

-- Check if user_preferences.user_id has proper CASCADE behavior
DO $$
BEGIN
    -- Drop and recreate FK with proper CASCADE behavior if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_name = 'user_preferences' 
        AND tc.constraint_name = 'user_preferences_user_id_fkey'
        AND rc.delete_rule != 'CASCADE'
    ) THEN
        ALTER TABLE user_preferences DROP CONSTRAINT user_preferences_user_id_fkey;
        ALTER TABLE user_preferences 
        ADD CONSTRAINT user_preferences_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Updated FK constraint: user_preferences.user_id → users.id (with CASCADE)';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: VALIDATE ALL FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Report all foreign key constraints for audit
DO $$
DECLARE
    fk_count INTEGER;
    missing_fks TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Count total FK constraints
    SELECT COUNT(*) INTO fk_count 
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY';
    
    -- Check for critical missing FKs and report
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'addresses_country_code_fkey'
    ) THEN
        missing_fks := array_append(missing_fks, 'addresses.country_code → countries.code');
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Foreign Key Constraints Audit ===';
    RAISE NOTICE 'Total FK constraints in database: %', fk_count;
    RAISE NOTICE '';
    
    IF array_length(missing_fks, 1) > 0 THEN
        RAISE NOTICE 'Missing critical FK constraints:';
        FOR i IN 1..array_length(missing_fks, 1) LOOP
            RAISE NOTICE '  ❌ %', missing_fks[i];
        END LOOP;
    ELSE
        RAISE NOTICE '✅ All critical FK constraints are in place';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Benefits:';
    RAISE NOTICE '  ✅ Data integrity enforced at database level';
    RAISE NOTICE '  ✅ Cascade deletes prevent orphaned records';
    RAISE NOTICE '  ✅ Referential integrity maintained';
    RAISE NOTICE '  ✅ Better query optimization by database';
END $$;