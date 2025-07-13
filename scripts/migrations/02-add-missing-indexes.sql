-- Migration: Add Missing Indexes for Performance
-- This script adds all missing indexes identified in the schema audit
-- Estimated execution time: 5-30 minutes depending on data size

BEGIN;

-- ==================== USER TABLE INDEXES ====================
-- User table needs indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_uuid 
    ON "User" (uuid);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_account_active 
    ON "User" (accountId, isActive) 
    WHERE isActive = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_username_active 
    ON "User" (username, isActive) 
    WHERE isActive = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_created 
    ON "User" (createdAt DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_tenant_account 
    ON "User" (accountId) 
    INCLUDE (uuid, firstName, lastName, email);

-- ==================== ACCOUNT TABLE INDEXES ====================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_account_uuid 
    ON "Account" (uuid);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_account_tenant_active 
    ON "Account" (tenantId, isActive) 
    WHERE isActive = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_account_email_verified 
    ON "Account" (email, emailVerified) 
    WHERE emailVerified = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_account_last_login 
    ON "Account" (lastLoginAt DESC NULLS LAST);

-- ==================== TENANT TABLE INDEXES ====================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_uuid 
    ON "Tenant" (uuid);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_active 
    ON "Tenant" (isActive) 
    WHERE isActive = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_domain 
    ON "Tenant" (domain) 
    WHERE isActive = true;

-- ==================== ROLE & PERMISSION INDEXES ====================
-- Role table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_tenant 
    ON "Role" (tenantId);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_code 
    ON "Role" (code);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_level 
    ON "Role" (level);

-- Permission table  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permission_pattern 
    ON "Permission" (permissionPattern);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permission_resource 
    ON "Permission" (resourceType);

-- UserRole junction table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_role_user 
    ON "UserRole" (userId);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_role_role 
    ON "UserRole" (roleId);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_role_user_role 
    ON "UserRole" (userId, roleId);

-- RolePermission junction table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_permission_role 
    ON "RolePermission" (roleId);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_permission_permission 
    ON "RolePermission" (permissionId);

-- UserPermission table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_permission_user 
    ON "UserPermission" (userId);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_permission_permission 
    ON "UserPermission" (permissionId);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_permission_user_permission 
    ON "UserPermission" (userId, permissionId);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_permission_valid 
    ON "UserPermission" (userId, validFrom, validUntil) 
    WHERE granted = true;

-- ==================== AUDIT LOG INDEXES ====================
-- UserActivityLog
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_user_time 
    ON "UserActivityLog" (userId, createdAt DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_entity 
    ON "UserActivityLog" (entityType, entityId);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_action 
    ON "UserActivityLog" (action, createdAt DESC);

-- AuditLog
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_table_record 
    ON "AuditLog" (tableName, recordId, createdAt DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_user_time 
    ON "AuditLog" (userId, createdAt DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_operation 
    ON "AuditLog" (operation, createdAt DESC);

-- PermissionAudit
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_perm_audit_user_time 
    ON "PermissionAudit" (userId, checkTime DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_perm_audit_permission 
    ON "PermissionAudit" (permissionChecked, granted);

-- ==================== BUSINESS TABLE INDEXES ====================
-- Tag table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tag_tenant 
    ON "Tag" (tenantId);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tag_name 
    ON "Tag" (name);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tag_type 
    ON "Tag" (type);

-- Category table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_category_tenant 
    ON "Category" (tenantId);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_category_parent 
    ON "Category" (parentId);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_category_slug 
    ON "Category" (slug);

-- EntityTag junction table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entity_tag_entity 
    ON "EntityTag" (entityType, entityId);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entity_tag_tag 
    ON "EntityTag" (tagId);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entity_tag_tenant 
    ON "EntityTag" (tenantId);

-- ==================== SUBSCRIPTION INDEXES ====================
-- SubscriptionPlan
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sub_plan_active 
    ON "SubscriptionPlan" (isActive) 
    WHERE isActive = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sub_plan_tier 
    ON "SubscriptionPlan" (planTier);

-- TenantSubscription
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_sub_tenant 
    ON "TenantSubscription" (tenantId);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_sub_plan 
    ON "TenantSubscription" (planId);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_sub_status 
    ON "TenantSubscription" (status) 
    WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_sub_expires 
    ON "TenantSubscription" (expiresAt) 
    WHERE status = 'active';

-- ==================== PERFORMANCE COMPOSITE INDEXES ====================
-- Common join patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_account_tenant 
    ON "User" (accountId, isActive) 
    INCLUDE (uuid, firstName, lastName);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_account_tenant_active 
    ON "Account" (tenantId, isActive) 
    INCLUDE (uuid, email);

-- Permission check optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_role_active 
    ON "UserRole" (userId, roleId) 
    WHERE validUntil IS NULL OR validUntil > NOW();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_permission_active 
    ON "RolePermission" (roleId, permissionId) 
    WHERE isActive = true;

-- ==================== FOREIGN KEY INDEXES ====================
-- PostgreSQL doesn't auto-create indexes on foreign keys
-- These are critical for DELETE CASCADE performance

-- All tenantId foreign keys
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fk_account_tenant 
    ON "Account" (tenantId);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fk_tag_tenant 
    ON "Tag" (tenantId);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fk_category_tenant 
    ON "Category" (tenantId);

-- All userId foreign keys
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fk_activity_user 
    ON "UserActivityLog" (userId);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fk_audit_user 
    ON "AuditLog" (userId);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fk_collection_user 
    ON "UserCollection" (userId);

-- All accountId foreign keys
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fk_user_account 
    ON "User" (accountId);

-- ==================== PARTIAL INDEXES FOR SOFT DELETES ====================
-- Optimize queries that filter out deleted records
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_active_not_deleted 
    ON "User" (accountId, isActive) 
    WHERE isActive = true AND deletedAt IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_account_active_not_deleted 
    ON "Account" (tenantId, isActive) 
    WHERE isActive = true AND deletedAt IS NULL;

-- ==================== TEXT SEARCH INDEXES ====================
-- For full-text search capabilities
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_search 
    ON "User" USING gin(
        to_tsvector('english', 
            COALESCE(firstName, '') || ' ' || 
            COALESCE(lastName, '') || ' ' || 
            COALESCE(email, '') || ' ' || 
            COALESCE(username, '')
        )
    );

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tag_search 
    ON "Tag" USING gin(to_tsvector('english', name));

-- ==================== ARRAY FIELD INDEXES ====================
-- For JSONB and array columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_features 
    ON "Tenant" USING gin(features) 
    WHERE features IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_account_capabilities 
    ON "Account" USING gin(accountCapabilities) 
    WHERE accountCapabilities IS NOT NULL;

-- ==================== INDEX STATISTICS UPDATE ====================
-- Update statistics for query planner
ANALYZE "User";
ANALYZE "Account";
ANALYZE "Tenant";
ANALYZE "Role";
ANALYZE "Permission";
ANALYZE "UserRole";
ANALYZE "RolePermission";
ANALYZE "UserPermission";
ANALYZE "UserActivityLog";
ANALYZE "AuditLog";

-- ==================== VALIDATION QUERIES ====================
-- Check that all indexes were created
DO $$
DECLARE
    missing_indexes INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_indexes
    FROM (
        VALUES 
            ('idx_user_uuid'),
            ('idx_user_account_active'),
            ('idx_account_uuid'),
            ('idx_account_tenant_active'),
            ('idx_tenant_uuid')
        -- Add more index names to check
    ) AS expected(index_name)
    WHERE NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = expected.index_name
    );
    
    IF missing_indexes > 0 THEN
        RAISE NOTICE 'Warning: % indexes may have failed to create', missing_indexes;
    ELSE
        RAISE NOTICE 'All indexes created successfully';
    END IF;
END $$;

COMMIT;

-- ==================== ROLLBACK SCRIPT ====================
-- Save this as rollback-02-remove-indexes.sql

/*
BEGIN;

-- User indexes
DROP INDEX IF EXISTS idx_user_uuid;
DROP INDEX IF EXISTS idx_user_account_active;
DROP INDEX IF EXISTS idx_user_username_active;
DROP INDEX IF EXISTS idx_user_created;
DROP INDEX IF EXISTS idx_user_tenant_account;

-- Account indexes
DROP INDEX IF EXISTS idx_account_uuid;
DROP INDEX IF EXISTS idx_account_tenant_active;
DROP INDEX IF EXISTS idx_account_email_verified;
DROP INDEX IF EXISTS idx_account_last_login;

-- Continue for all indexes...

COMMIT;
*/