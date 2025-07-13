-- ============================================================================
-- Database Schema Normalization Migration (Fixed Version)
-- Purpose: Convert all PascalCase tables and camelCase columns to snake_case
-- Date: 2024-12-11
-- Impact: BREAKING CHANGE - affects entire application
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1: TABLE RENAMING (PascalCase → snake_case)
-- ============================================================================

-- Create function to safely rename tables with all dependencies
CREATE OR REPLACE FUNCTION rename_table_safe(old_name text, new_name text) RETURNS void AS $$
DECLARE
    sequence_record RECORD;
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = old_name AND schemaname = 'public') THEN
        RAISE NOTICE 'Table % does not exist, skipping', old_name;
        RETURN;
    END IF;

    -- Check if target table already exists
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = new_name AND schemaname = 'public') THEN
        RAISE NOTICE 'Target table % already exists, skipping', new_name;
        RETURN;
    END IF;

    -- Rename the table
    EXECUTE format('ALTER TABLE %I RENAME TO %I', old_name, new_name);
    RAISE NOTICE 'Renamed table: % → %', old_name, new_name;

    -- Update sequence names
    FOR sequence_record IN 
        SELECT schemaname, sequencename 
        FROM pg_sequences 
        WHERE sequencename LIKE old_name || '_%'
    LOOP
        EXECUTE format('ALTER SEQUENCE %I RENAME TO %I', 
            sequence_record.sequencename, 
            replace(sequence_record.sequencename, old_name, new_name)
        );
        RAISE NOTICE 'Renamed sequence: % → %', 
            sequence_record.sequencename, 
            replace(sequence_record.sequencename, old_name, new_name);
    END LOOP;

END;
$$ LANGUAGE plpgsql;

-- Execute table renames
SELECT rename_table_safe('Account', 'accounts');
SELECT rename_table_safe('Category', 'categories');
SELECT rename_table_safe('CategoryTag', 'category_tags');
SELECT rename_table_safe('CollectionItem', 'collection_items');
SELECT rename_table_safe('Conversation', 'conversations');
SELECT rename_table_safe('ConversationParticipant', 'conversation_participants');
SELECT rename_table_safe('Country', 'countries');
SELECT rename_table_safe('Currency', 'currencies');
SELECT rename_table_safe('EmergencyAccess', 'emergency_access');
SELECT rename_table_safe('EmergencyAudit', 'emergency_audit');
SELECT rename_table_safe('EntityTag', 'entity_tags');
SELECT rename_table_safe('Feature', 'features');
SELECT rename_table_safe('GigBooking', 'gig_bookings');
SELECT rename_table_safe('GigOffering', 'gig_offerings');
SELECT rename_table_safe('JobApplication', 'job_applications');
SELECT rename_table_safe('JobPosting', 'job_postings');
SELECT rename_table_safe('Language', 'languages');
SELECT rename_table_safe('Message', 'messages');
SELECT rename_table_safe('MessageAttachment', 'message_attachments');
SELECT rename_table_safe('OptionSet', 'option_sets');
SELECT rename_table_safe('OptionValue', 'option_values');
SELECT rename_table_safe('Permission', 'permissions');
SELECT rename_table_safe('PermissionAudit', 'permission_audit');
SELECT rename_table_safe('PermissionExpansion', 'permission_expansions');
SELECT rename_table_safe('PermissionInheritance', 'permission_inheritance');
SELECT rename_table_safe('PermissionSet', 'permission_sets');
SELECT rename_table_safe('PermissionSetItem', 'permission_set_items');
SELECT rename_table_safe('RBACConfig', 'rbac_config');
SELECT rename_table_safe('Role', 'roles');
SELECT rename_table_safe('RolePermission', 'role_permissions');
SELECT rename_table_safe('RolePermissionSet', 'role_permission_sets');
SELECT rename_table_safe('PlanFeatureLimit', 'plan_feature_limits');
SELECT rename_table_safe('SubscriptionPlan', 'subscription_plans');
SELECT rename_table_safe('Tag', 'tags');
SELECT rename_table_safe('Tenant', 'tenants');
SELECT rename_table_safe('TenantSubscription', 'tenant_subscriptions');
SELECT rename_table_safe('User', 'users');
SELECT rename_table_safe('UserCollection', 'user_collections');
SELECT rename_table_safe('UserPermission', 'user_permissions');
SELECT rename_table_safe('UserPermissionCache', 'user_permission_cache');
SELECT rename_table_safe('UserRole', 'user_roles');

-- ============================================================================
-- PHASE 2: COLUMN RENAMING (camelCase → snake_case)
-- ============================================================================

-- Fixed function to safely rename columns
CREATE OR REPLACE FUNCTION rename_column_safe(p_table_name text, old_column text, new_column text) RETURNS void AS $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = p_table_name AND schemaname = 'public') THEN
        RAISE NOTICE 'Table % does not exist, skipping column rename', p_table_name;
        RETURN;
    END IF;

    -- Check if old column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = p_table_name AND column_name = old_column AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Column %.% does not exist, skipping', p_table_name, old_column;
        RETURN;
    END IF;

    -- Check if new column already exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = p_table_name AND column_name = new_column AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Column %.% already exists, skipping', p_table_name, new_column;
        RETURN;
    END IF;

    -- Rename the column
    EXECUTE format('ALTER TABLE %I RENAME COLUMN %I TO %I', p_table_name, old_column, new_column);
    RAISE NOTICE 'Renamed column: %.% → %.%', p_table_name, old_column, p_table_name, new_column;
END;
$$ LANGUAGE plpgsql;

-- Rename critical columns in key tables
-- Accounts table
SELECT rename_column_safe('accounts', 'tenantId', 'tenant_id');
SELECT rename_column_safe('accounts', 'emailVerified', 'email_verified');
SELECT rename_column_safe('accounts', 'passwordHash', 'password_hash');
SELECT rename_column_safe('accounts', 'accountType', 'account_type');
SELECT rename_column_safe('accounts', 'countryCode', 'country_code');
SELECT rename_column_safe('accounts', 'languageLocale', 'language_locale');
SELECT rename_column_safe('accounts', 'currencyCode', 'currency_code');
SELECT rename_column_safe('accounts', 'dateFormat', 'date_format');
SELECT rename_column_safe('accounts', 'timeFormat', 'time_format');
SELECT rename_column_safe('accounts', 'numberFormat', 'number_format');
SELECT rename_column_safe('accounts', 'emailNotifications', 'email_notifications');
SELECT rename_column_safe('accounts', 'smsNotifications', 'sms_notifications');
SELECT rename_column_safe('accounts', 'themePreference', 'theme_preference');
SELECT rename_column_safe('accounts', 'accountCapabilities', 'account_capabilities');
SELECT rename_column_safe('accounts', 'primaryMarketplaceSide', 'primary_marketplace_side');
SELECT rename_column_safe('accounts', 'allowDualSide', 'allow_dual_side');
SELECT rename_column_safe('accounts', 'isActive', 'is_active');
SELECT rename_column_safe('accounts', 'isVerified', 'is_verified');
SELECT rename_column_safe('accounts', 'lastLoginAt', 'last_login_at');
SELECT rename_column_safe('accounts', 'createdAt', 'created_at');
SELECT rename_column_safe('accounts', 'updatedAt', 'updated_at');
SELECT rename_column_safe('accounts', 'firstDayOfWeek', 'first_day_of_week');
SELECT rename_column_safe('accounts', 'decimalSeparator', 'decimal_separator');
SELECT rename_column_safe('accounts', 'thousandsSeparator', 'thousands_separator');
SELECT rename_column_safe('accounts', 'currencyPosition', 'currency_position');
SELECT rename_column_safe('accounts', 'currencySpace', 'currency_space');
SELECT rename_column_safe('accounts', 'useRelativeTime', 'use_relative_time');
SELECT rename_column_safe('accounts', 'relativeTimeThreshold', 'relative_time_threshold');
SELECT rename_column_safe('accounts', 'relativeTimeStyle', 'relative_time_style');
SELECT rename_column_safe('accounts', 'compactMode', 'compact_mode');
SELECT rename_column_safe('accounts', 'showSeconds', 'show_seconds');
SELECT rename_column_safe('accounts', 'showTimezone', 'show_timezone');
SELECT rename_column_safe('accounts', 'notificationTimeFormat', 'notification_time_format');

-- Users table
SELECT rename_column_safe('users', 'accountId', 'account_id');
SELECT rename_column_safe('users', 'firstName', 'first_name');
SELECT rename_column_safe('users', 'lastName', 'last_name');
SELECT rename_column_safe('users', 'userType', 'user_type');
SELECT rename_column_safe('users', 'profilePhotoUrl', 'profile_photo_url');
SELECT rename_column_safe('users', 'dateOfBirth', 'date_of_birth');
SELECT rename_column_safe('users', 'accountRole', 'account_role');
SELECT rename_column_safe('users', 'canCreateProfiles', 'can_create_profiles');
SELECT rename_column_safe('users', 'canManageAllProfiles', 'can_manage_all_profiles');
SELECT rename_column_safe('users', 'canAccessBilling', 'can_access_billing');
SELECT rename_column_safe('users', 'canBookJobs', 'can_book_jobs');
SELECT rename_column_safe('users', 'profileApplicationStatus', 'profile_application_status');
SELECT rename_column_safe('users', 'profileApprovedAt', 'profile_approved_at');
SELECT rename_column_safe('users', 'profileRejectedAt', 'profile_rejected_at');
SELECT rename_column_safe('users', 'totalApplications', 'total_applications');
SELECT rename_column_safe('users', 'lastApplicationAt', 'last_application_at');
SELECT rename_column_safe('users', 'userHash', 'user_hash');
SELECT rename_column_safe('users', 'isActive', 'is_active');
SELECT rename_column_safe('users', 'isVerified', 'is_verified');
SELECT rename_column_safe('users', 'createdAt', 'created_at');
SELECT rename_column_safe('users', 'updatedAt', 'updated_at');
SELECT rename_column_safe('users', 'emergencyUntil', 'emergency_until');

-- Permissions table
SELECT rename_column_safe('permissions', 'isWildcard', 'is_wildcard');
SELECT rename_column_safe('permissions', 'createdAt', 'created_at');
SELECT rename_column_safe('permissions', 'updatedAt', 'updated_at');

-- Roles table
SELECT rename_column_safe('roles', 'tenantId', 'tenant_id');
SELECT rename_column_safe('roles', 'isSystem', 'is_system');
SELECT rename_column_safe('roles', 'createdAt', 'created_at');
SELECT rename_column_safe('roles', 'updatedAt', 'updated_at');

-- Tenants table
SELECT rename_column_safe('tenants', 'isActive', 'is_active');
SELECT rename_column_safe('tenants', 'createdAt', 'created_at');
SELECT rename_column_safe('tenants', 'updatedAt', 'updated_at');
SELECT rename_column_safe('tenants', 'allowedCountries', 'allowed_countries');
SELECT rename_column_safe('tenants', 'defaultCurrency', 'default_currency');

-- ============================================================================
-- PHASE 3: CREATE COMPATIBILITY VIEWS
-- ============================================================================

-- Create views with old table names for backwards compatibility
CREATE OR REPLACE VIEW "Account" AS SELECT * FROM accounts;
CREATE OR REPLACE VIEW "User" AS SELECT * FROM users;
CREATE OR REPLACE VIEW "Permission" AS SELECT * FROM permissions;
CREATE OR REPLACE VIEW "Role" AS SELECT * FROM roles;
CREATE OR REPLACE VIEW "Tenant" AS SELECT * FROM tenants;

-- Add comments to indicate these are compatibility views
COMMENT ON VIEW "Account" IS 'Compatibility view - use accounts table directly';
COMMENT ON VIEW "User" IS 'Compatibility view - use users table directly';
COMMENT ON VIEW "Permission" IS 'Compatibility view - use permissions table directly';
COMMENT ON VIEW "Role" IS 'Compatibility view - use roles table directly';
COMMENT ON VIEW "Tenant" IS 'Compatibility view - use tenants table directly';

-- ============================================================================
-- CLEANUP
-- ============================================================================

-- Drop the helper functions
DROP FUNCTION IF EXISTS rename_table_safe(text, text);
DROP FUNCTION IF EXISTS rename_column_safe(text, text, text);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show final table list
DO $$
DECLARE
    table_count INTEGER;
    snake_case_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM pg_tables WHERE schemaname = 'public';
    
    SELECT COUNT(*) INTO snake_case_count 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename ~ '^[a-z][a-z0-9_]*$';
    
    RAISE NOTICE 'Phase 1 Migration completed!';
    RAISE NOTICE 'Total tables: %', table_count;
    RAISE NOTICE 'Snake_case tables: %', snake_case_count;
    RAISE NOTICE 'Percentage normalized: %', ROUND((snake_case_count::DECIMAL / table_count) * 100, 1);
END $$;

COMMIT;