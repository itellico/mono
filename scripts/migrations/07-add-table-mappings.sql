-- Migration: Add Table Mappings for Snake Case
-- This script renames tables from PascalCase to snake_case
-- to follow PostgreSQL naming conventions

BEGIN;

-- ==================== RENAME TABLES TO SNAKE_CASE ====================

-- Core tables
ALTER TABLE IF EXISTS "User" RENAME TO users;
ALTER TABLE IF EXISTS "Account" RENAME TO accounts;
ALTER TABLE IF EXISTS "Tenant" RENAME TO tenants;

-- Auth/Permission tables
ALTER TABLE IF EXISTS "Role" RENAME TO roles;
ALTER TABLE IF EXISTS "Permission" RENAME TO permissions;
ALTER TABLE IF EXISTS "UserRole" RENAME TO user_roles;
ALTER TABLE IF EXISTS "RolePermission" RENAME TO role_permissions;
ALTER TABLE IF EXISTS "UserPermission" RENAME TO user_permissions;

-- Business entity tables
ALTER TABLE IF EXISTS "Tag" RENAME TO tags;
ALTER TABLE IF EXISTS "Category" RENAME TO categories;
ALTER TABLE IF EXISTS "EntityTag" RENAME TO entity_tags;
ALTER TABLE IF EXISTS "CategoryTag" RENAME TO category_tags;

-- Profile/Collection tables
ALTER TABLE IF EXISTS "Profile" RENAME TO profiles;
ALTER TABLE IF EXISTS "ProfileSkill" RENAME TO profile_skills;
ALTER TABLE IF EXISTS "ProfileMedia" RENAME TO profile_media;
ALTER TABLE IF EXISTS "UserCollection" RENAME TO user_collections;
ALTER TABLE IF EXISTS "UserCollectionItem" RENAME TO user_collection_items;

-- Job/Gig tables
ALTER TABLE IF EXISTS "JobPosting" RENAME TO job_postings;
ALTER TABLE IF EXISTS "JobApplication" RENAME TO job_applications;
ALTER TABLE IF EXISTS "JobBooking" RENAME TO job_bookings;
ALTER TABLE IF EXISTS "GigOffering" RENAME TO gig_offerings;
ALTER TABLE IF EXISTS "GigOfferingSkill" RENAME TO gig_offering_skills;

-- Conversation tables
ALTER TABLE IF EXISTS "Conversation" RENAME TO conversations;
ALTER TABLE IF EXISTS "ConversationMessage" RENAME TO conversation_messages;
ALTER TABLE IF EXISTS "ConversationUser" RENAME TO conversation_users;

-- Review/Rating tables
ALTER TABLE IF EXISTS "Review" RENAME TO reviews;
ALTER TABLE IF EXISTS "ReviewResponse" RENAME TO review_responses;

-- System tables
ALTER TABLE IF EXISTS "OptionSet" RENAME TO option_sets;
ALTER TABLE IF EXISTS "OptionSetItem" RENAME TO option_set_items;
ALTER TABLE IF EXISTS "Feature" RENAME TO features;
ALTER TABLE IF EXISTS "Skill" RENAME TO skills;
ALTER TABLE IF EXISTS "Currency" RENAME TO currencies;
ALTER TABLE IF EXISTS "Country" RENAME TO countries;
ALTER TABLE IF EXISTS "Language" RENAME TO languages;

-- Subscription tables
ALTER TABLE IF EXISTS "SubscriptionPlan" RENAME TO subscription_plans;
ALTER TABLE IF EXISTS "PlanFeature" RENAME TO plan_features;
ALTER TABLE IF EXISTS "PlanFeatureLimit" RENAME TO plan_feature_limits;
ALTER TABLE IF EXISTS "TenantSubscription" RENAME TO tenant_subscriptions;

-- Audit/Activity tables
ALTER TABLE IF EXISTS "UserActivityLog" RENAME TO user_activity_logs;
ALTER TABLE IF EXISTS "AuditLog" RENAME TO audit_logs;
ALTER TABLE IF EXISTS "PermissionAudit" RENAME TO permission_audits;
ALTER TABLE IF EXISTS "PermissionChangeLog" RENAME TO permission_change_logs;
ALTER TABLE IF EXISTS "UserPermissionCache" RENAME TO user_permission_caches;

-- Version/Change tracking tables
ALTER TABLE IF EXISTS "ChangeSet" RENAME TO change_sets;
ALTER TABLE IF EXISTS "ChangeSetItem" RENAME TO change_set_items;
ALTER TABLE IF EXISTS "VersionHistory" RENAME TO version_histories;

-- Settings table
ALTER TABLE IF EXISTS "SiteSettings" RENAME TO site_settings;

-- ==================== UPDATE SEQUENCES ====================
-- PostgreSQL sequences need to be renamed to match new table names

-- Core sequences
ALTER SEQUENCE IF EXISTS "User_id_seq" RENAME TO users_id_seq;
ALTER SEQUENCE IF EXISTS "Account_id_seq" RENAME TO accounts_id_seq;
ALTER SEQUENCE IF EXISTS "Tenant_id_seq" RENAME TO tenants_id_seq;

-- Auth/Permission sequences
ALTER SEQUENCE IF EXISTS "Role_id_seq" RENAME TO roles_id_seq;
ALTER SEQUENCE IF EXISTS "Permission_id_seq" RENAME TO permissions_id_seq;
ALTER SEQUENCE IF EXISTS "UserRole_id_seq" RENAME TO user_roles_id_seq;
ALTER SEQUENCE IF EXISTS "RolePermission_id_seq" RENAME TO role_permissions_id_seq;
ALTER SEQUENCE IF EXISTS "UserPermission_id_seq" RENAME TO user_permissions_id_seq;

-- Continue for all sequences...
DO $$
DECLARE
    seq RECORD;
    new_name TEXT;
BEGIN
    -- Automatically rename any remaining sequences
    FOR seq IN 
        SELECT sequencename 
        FROM pg_sequences 
        WHERE schemaname = 'public' 
        AND sequencename ~ '^[A-Z]'
    LOOP
        -- Convert PascalCase to snake_case
        new_name := regexp_replace(
            regexp_replace(seq.sequencename, '([A-Z]+)([A-Z][a-z])', '\1_\2', 'g'),
            '([a-z\d])([A-Z])', '\1_\2', 'g'
        );
        new_name := lower(new_name);
        
        EXECUTE format('ALTER SEQUENCE IF EXISTS %I RENAME TO %I', 
            seq.sequencename, new_name);
    END LOOP;
END $$;

-- ==================== UPDATE CONSTRAINTS ====================
-- Foreign key constraints need to reference new table names

-- This is handled automatically by PostgreSQL when tables are renamed
-- But we should rename constraints to match new naming convention

DO $$
DECLARE
    con RECORD;
    new_name TEXT;
BEGIN
    -- Rename foreign key constraints
    FOR con IN 
        SELECT 
            conname,
            conrelid::regclass::text as table_name
        FROM pg_constraint 
        WHERE contype = 'f' 
        AND connamespace = 'public'::regnamespace
        AND conname ~ '^[A-Z]'
    LOOP
        -- Convert to snake_case
        new_name := regexp_replace(
            regexp_replace(con.conname, '([A-Z]+)([A-Z][a-z])', '\1_\2', 'g'),
            '([a-z\d])([A-Z])', '\1_\2', 'g'
        );
        new_name := lower(new_name);
        
        BEGIN
            EXECUTE format('ALTER TABLE %s RENAME CONSTRAINT %I TO %I', 
                con.table_name, con.conname, new_name);
        EXCEPTION WHEN OTHERS THEN
            -- Ignore if constraint doesn't exist or already renamed
            NULL;
        END;
    END LOOP;
END $$;

-- ==================== UPDATE INDEXES ====================
-- Rename indexes to match new table names

DO $$
DECLARE
    idx RECORD;
    new_name TEXT;
BEGIN
    FOR idx IN 
        SELECT 
            indexname,
            tablename
        FROM pg_indexes 
        WHERE schemaname = 'public'
        AND indexname ~ '^[A-Z]'
    LOOP
        -- Convert to snake_case
        new_name := regexp_replace(
            regexp_replace(idx.indexname, '([A-Z]+)([A-Z][a-z])', '\1_\2', 'g'),
            '([a-z\d])([A-Z])', '\1_\2', 'g'
        );
        new_name := lower(new_name);
        
        BEGIN
            EXECUTE format('ALTER INDEX IF EXISTS %I RENAME TO %I', 
                idx.indexname, new_name);
        EXCEPTION WHEN OTHERS THEN
            -- Ignore if index doesn't exist or already renamed
            NULL;
        END;
    END LOOP;
END $$;

-- ==================== CREATE VIEWS FOR BACKWARD COMPATIBILITY ====================
-- Optional: Create views with old names for backward compatibility during migration

CREATE OR REPLACE VIEW "User" AS SELECT * FROM users;
CREATE OR REPLACE VIEW "Account" AS SELECT * FROM accounts;
CREATE OR REPLACE VIEW "Tenant" AS SELECT * FROM tenants;
CREATE OR REPLACE VIEW "Role" AS SELECT * FROM roles;
CREATE OR REPLACE VIEW "Permission" AS SELECT * FROM permissions;

-- Add rules to make views updatable
CREATE OR REPLACE RULE "User_insert" AS ON INSERT TO "User"
DO INSTEAD INSERT INTO users VALUES (NEW.*);

CREATE OR REPLACE RULE "User_update" AS ON UPDATE TO "User"
DO INSTEAD UPDATE users SET (id, uuid, accountId, firstName, lastName) = 
    (NEW.id, NEW.uuid, NEW.accountId, NEW.firstName, NEW.lastName)
WHERE id = OLD.id;

CREATE OR REPLACE RULE "User_delete" AS ON DELETE TO "User"
DO INSTEAD DELETE FROM users WHERE id = OLD.id;

-- ==================== UPDATE COMMENTS ====================
-- Add comments to document the migration

COMMENT ON TABLE users IS 'Users table - renamed from User for PostgreSQL conventions';
COMMENT ON TABLE accounts IS 'Accounts table - renamed from Account for PostgreSQL conventions';
COMMENT ON TABLE tenants IS 'Tenants table - renamed from Tenant for PostgreSQL conventions';

-- ==================== VALIDATION ====================

-- Check that all tables are now snake_case
DO $$
DECLARE
    pascal_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO pascal_count
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename ~ '^[A-Z]'
    AND tablename NOT IN (
        -- Exclude backward compatibility views
        'User', 'Account', 'Tenant', 'Role', 'Permission'
    );
    
    IF pascal_count > 0 THEN
        RAISE NOTICE 'Warning: % tables still use PascalCase naming', pascal_count;
    ELSE
        RAISE NOTICE 'Success: All tables now use snake_case naming';
    END IF;
END $$;

-- List all tables for verification
SELECT 
    tablename,
    CASE 
        WHEN tablename ~ '^[A-Z]' THEN 'PascalCase'
        ELSE 'snake_case'
    END as naming_style
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

COMMIT;

-- ==================== ROLLBACK SCRIPT ====================
-- Save as rollback-07-revert-table-mappings.sql

/*
BEGIN;

-- Drop backward compatibility views
DROP VIEW IF EXISTS "User" CASCADE;
DROP VIEW IF EXISTS "Account" CASCADE;
DROP VIEW IF EXISTS "Tenant" CASCADE;
DROP VIEW IF EXISTS "Role" CASCADE;
DROP VIEW IF EXISTS "Permission" CASCADE;

-- Rename tables back to PascalCase
ALTER TABLE IF EXISTS users RENAME TO "User";
ALTER TABLE IF EXISTS accounts RENAME TO "Account";
ALTER TABLE IF EXISTS tenants RENAME TO "Tenant";
ALTER TABLE IF EXISTS roles RENAME TO "Role";
ALTER TABLE IF EXISTS permissions RENAME TO "Permission";
-- Continue for all tables...

-- Rename sequences back
ALTER SEQUENCE IF EXISTS users_id_seq RENAME TO "User_id_seq";
ALTER SEQUENCE IF EXISTS accounts_id_seq RENAME TO "Account_id_seq";
-- Continue for all sequences...

COMMIT;
*/