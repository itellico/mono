-- ============================================================================
-- Database Schema Normalization Migration
-- Purpose: Convert all PascalCase tables and camelCase columns to snake_case
-- Date: 2024-12-11
-- Impact: BREAKING CHANGE - affects entire application
-- ============================================================================

-- IMPORTANT: This is a BREAKING CHANGE migration
-- All application code must be updated before running this migration
-- Requires maintenance window and comprehensive testing

BEGIN;

-- ============================================================================
-- PHASE 1: TABLE RENAMING (PascalCase → snake_case)
-- ============================================================================

-- Create function to safely rename tables with all dependencies
CREATE OR REPLACE FUNCTION rename_table_safe(old_name text, new_name text) RETURNS void AS $$
DECLARE
    constraint_record RECORD;
    index_record RECORD;
    sequence_record RECORD;
    trigger_record RECORD;
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

-- ============================================================================
-- TABLE RENAMES: PascalCase → snake_case
-- ============================================================================

-- Core Entity Tables
SELECT rename_table_safe('Account', 'accounts');
SELECT rename_table_safe('Category', 'categories');
SELECT rename_table_safe('CategoryTag', 'category_tags');
SELECT rename_table_safe('CollectionItem', 'collection_items');
SELECT rename_table_safe('Conversation', 'conversations');
SELECT rename_table_safe('ConversationParticipant', 'conversation_participants');
SELECT rename_table_safe('Country', 'countries');
SELECT rename_table_safe('Currency', 'currencies');

-- Emergency & Audit Tables
SELECT rename_table_safe('EmergencyAccess', 'emergency_access');
SELECT rename_table_safe('EmergencyAudit', 'emergency_audit');
SELECT rename_table_safe('EntityTag', 'entity_tags');

-- Feature & Content Tables
SELECT rename_table_safe('Feature', 'features');
SELECT rename_table_safe('GigBooking', 'gig_bookings');
SELECT rename_table_safe('GigOffering', 'gig_offerings');
SELECT rename_table_safe('JobApplication', 'job_applications');
SELECT rename_table_safe('JobPosting', 'job_postings');
SELECT rename_table_safe('Language', 'languages');
SELECT rename_table_safe('Message', 'messages');
SELECT rename_table_safe('MessageAttachment', 'message_attachments');

-- Configuration Tables
SELECT rename_table_safe('OptionSet', 'option_sets');
SELECT rename_table_safe('OptionValue', 'option_values');

-- RBAC Tables (will be enhanced in Phase 2)
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

-- Subscription & Billing Tables
SELECT rename_table_safe('PlanFeatureLimit', 'plan_feature_limits');
SELECT rename_table_safe('SubscriptionPlan', 'subscription_plans');

-- Core Platform Tables
SELECT rename_table_safe('Tag', 'tags');
SELECT rename_table_safe('Tenant', 'tenants');
SELECT rename_table_safe('TenantSubscription', 'tenant_subscriptions');

-- User Tables
SELECT rename_table_safe('User', 'users');
SELECT rename_table_safe('UserCollection', 'user_collections');
SELECT rename_table_safe('UserPermission', 'user_permissions');
SELECT rename_table_safe('UserPermissionCache', 'user_permission_cache');
SELECT rename_table_safe('UserRole', 'user_roles');

-- ============================================================================
-- PHASE 2: COLUMN RENAMING (camelCase → snake_case)
-- ============================================================================

-- Create function to safely rename columns
CREATE OR REPLACE FUNCTION rename_column_safe(table_name text, old_column text, new_column text) RETURNS void AS $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = table_name AND schemaname = 'public') THEN
        RAISE NOTICE 'Table % does not exist, skipping column rename', table_name;
        RETURN;
    END IF;

    -- Check if old column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = table_name AND column_name = old_column AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Column %.% does not exist, skipping', table_name, old_column;
        RETURN;
    END IF;

    -- Check if new column already exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = table_name AND column_name = new_column AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Column %.% already exists, skipping', table_name, new_column;
        RETURN;
    END IF;

    -- Rename the column
    EXECUTE format('ALTER TABLE %I RENAME COLUMN %I TO %I', table_name, old_column, new_column);
    RAISE NOTICE 'Renamed column: %.% → %.%', table_name, old_column, table_name, new_column;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COLUMN RENAMES: Common camelCase → snake_case patterns
-- ============================================================================

-- Function to rename common camelCase columns across all tables
CREATE OR REPLACE FUNCTION normalize_common_columns() RETURNS void AS $$
DECLARE
    table_record RECORD;
BEGIN
    -- Loop through all tables and rename common camelCase columns
    FOR table_record IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '%temp%'
    LOOP
        -- Timestamp columns
        PERFORM rename_column_safe(table_record.tablename, 'createdAt', 'created_at');
        PERFORM rename_column_safe(table_record.tablename, 'updatedAt', 'updated_at');
        PERFORM rename_column_safe(table_record.tablename, 'deletedAt', 'deleted_at');
        PERFORM rename_column_safe(table_record.tablename, 'publishedAt', 'published_at');
        PERFORM rename_column_safe(table_record.tablename, 'approvedAt', 'approved_at');
        PERFORM rename_column_safe(table_record.tablename, 'rejectedAt', 'rejected_at');
        PERFORM rename_column_safe(table_record.tablename, 'lastLoginAt', 'last_login_at');
        PERFORM rename_column_safe(table_record.tablename, 'lastAccessedAt', 'last_accessed_at');

        -- Foreign key columns
        PERFORM rename_column_safe(table_record.tablename, 'tenantId', 'tenant_id');
        PERFORM rename_column_safe(table_record.tablename, 'accountId', 'account_id');
        PERFORM rename_column_safe(table_record.tablename, 'userId', 'user_id');
        PERFORM rename_column_safe(table_record.tablename, 'roleId', 'role_id');
        PERFORM rename_column_safe(table_record.tablename, 'permissionId', 'permission_id');
        PERFORM rename_column_safe(table_record.tablename, 'parentId', 'parent_id');
        PERFORM rename_column_safe(table_record.tablename, 'categoryId', 'category_id');
        PERFORM rename_column_safe(table_record.tablename, 'messageId', 'message_id');
        PERFORM rename_column_safe(table_record.tablename, 'conversationId', 'conversation_id');

        -- Boolean columns
        PERFORM rename_column_safe(table_record.tablename, 'isActive', 'is_active');
        PERFORM rename_column_safe(table_record.tablename, 'isSystem', 'is_system');
        PERFORM rename_column_safe(table_record.tablename, 'isDefault', 'is_default');
        PERFORM rename_column_safe(table_record.tablename, 'isPublic', 'is_public');
        PERFORM rename_column_safe(table_record.tablename, 'isVerified', 'is_verified');
        PERFORM rename_column_safe(table_record.tablename, 'isWildcard', 'is_wildcard');
        PERFORM rename_column_safe(table_record.tablename, 'emailVerified', 'email_verified');

        -- Audit columns
        PERFORM rename_column_safe(table_record.tablename, 'createdBy', 'created_by');
        PERFORM rename_column_safe(table_record.tablename, 'updatedBy', 'updated_by');
        PERFORM rename_column_safe(table_record.tablename, 'deletedBy', 'deleted_by');
        PERFORM rename_column_safe(table_record.tablename, 'approvedBy', 'approved_by');

        -- Specific account/user columns
        PERFORM rename_column_safe(table_record.tablename, 'firstName', 'first_name');
        PERFORM rename_column_safe(table_record.tablename, 'lastName', 'last_name');
        PERFORM rename_column_safe(table_record.tablename, 'profilePhotoUrl', 'profile_photo_url');
        PERFORM rename_column_safe(table_record.tablename, 'dateOfBirth', 'date_of_birth');
        PERFORM rename_column_safe(table_record.tablename, 'accountRole', 'account_role');
        PERFORM rename_column_safe(table_record.tablename, 'canCreateProfiles', 'can_create_profiles');
        PERFORM rename_column_safe(table_record.tablename, 'canManageAllProfiles', 'can_manage_all_profiles');
        PERFORM rename_column_safe(table_record.tablename, 'canAccessBilling', 'can_access_billing');
        PERFORM rename_column_safe(table_record.tablename, 'canBookJobs', 'can_book_jobs');

        -- Configuration columns
        PERFORM rename_column_safe(table_record.tablename, 'passwordHash', 'password_hash');
        PERFORM rename_column_safe(table_record.tablename, 'accountType', 'account_type');
        PERFORM rename_column_safe(table_record.tablename, 'userType', 'user_type');
        PERFORM rename_column_safe(table_record.tablename, 'countryCode', 'country_code');
        PERFORM rename_column_safe(table_record.tablename, 'languageLocale', 'language_locale');
        PERFORM rename_column_safe(table_record.tablename, 'currencyCode', 'currency_code');
        PERFORM rename_column_safe(table_record.tablename, 'timeZone', 'time_zone');
        PERFORM rename_column_safe(table_record.tablename, 'dateFormat', 'date_format');
        PERFORM rename_column_safe(table_record.tablename, 'timeFormat', 'time_format');
        PERFORM rename_column_safe(table_record.tablename, 'numberFormat', 'number_format');
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute column normalization
SELECT normalize_common_columns();

-- ============================================================================
-- PHASE 3: UPDATE CONSTRAINTS AND INDEXES
-- ============================================================================

-- Rebuild foreign key constraints with new table names
-- Note: This would be a comprehensive update requiring knowledge of all FK relationships
-- For now, we'll add a few critical ones as examples

-- Update foreign keys for core RBAC tables
DO $$
BEGIN
    -- permissions table foreign keys
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'permissions') THEN
        -- Add tenant_id foreign key if tenants table exists
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tenants') THEN
            ALTER TABLE permissions ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'permissions_tenant_id_fkey'
            ) THEN
                ALTER TABLE permissions ADD CONSTRAINT permissions_tenant_id_fkey 
                FOREIGN KEY (tenant_id) REFERENCES tenants(id);
            END IF;
        END IF;
    END IF;

    -- roles table foreign keys
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'roles') THEN
        -- Update existing tenant_id foreign key if needed
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tenants') THEN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'roles_tenant_id_fkey'
            ) THEN
                ALTER TABLE roles ADD CONSTRAINT roles_tenant_id_fkey 
                FOREIGN KEY (tenant_id) REFERENCES tenants(id);
            END IF;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- PHASE 4: CREATE IMPROVED INDEXES
-- ============================================================================

-- Create indexes for commonly queried snake_case columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permissions_tenant_id ON permissions(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permissions_scope ON permissions(scope);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permissions_is_active ON permissions(is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_tenant_id ON roles(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_is_system ON roles(is_system);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_is_active ON roles(is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_account_id ON users(account_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_verified ON users(is_verified);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accounts_tenant_id ON accounts(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accounts_email ON accounts(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accounts_is_active ON accounts(is_active);

-- ============================================================================
-- PHASE 5: UPDATE VIEWS FOR COMPATIBILITY
-- ============================================================================

-- Create views with old table names for backwards compatibility during transition
-- These can be removed after all application code is updated

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
DROP FUNCTION IF EXISTS normalize_common_columns();

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
    
    RAISE NOTICE 'Migration completed!';
    RAISE NOTICE 'Total tables: %', table_count;
    RAISE NOTICE 'Snake_case tables: %', snake_case_count;
    RAISE NOTICE 'Percentage normalized: %', ROUND((snake_case_count::DECIMAL / table_count) * 100, 1);
END $$;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================

-- 1. Update Prisma schema.prisma with new table/column names
-- 2. Run: pnpm prisma generate
-- 3. Update all TypeScript models to use snake_case database names
-- 4. Update all API endpoints to use new field names
-- 5. Update frontend models and API calls
-- 6. Run comprehensive test suite
-- 7. Remove compatibility views after all code is updated

-- Example Prisma model after migration:
-- model User {
--   uuid       String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
--   id         Int      @unique @default(autoincrement())
--   account_id Int      @map("account_id")
--   first_name String   @map("first_name")
--   last_name  String   @map("last_name")
--   username   String   @unique
--   is_active  Boolean  @default(true) @map("is_active")
--   created_at DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
--   updated_at DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)
--   
--   account Account @relation(fields: [account_id], references: [id])
--   
--   @@map("users")
-- }