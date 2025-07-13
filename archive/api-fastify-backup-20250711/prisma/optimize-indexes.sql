-- Prisma Schema Optimization - Index Creation Script
-- This script adds performance indexes without modifying the schema structure
-- Run this after your migrations are complete

-- ============================================
-- Core Entity Indexes
-- ============================================

-- Tenant indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_slug ON "Tenant" ("slug") WHERE "slug" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_is_active ON "Tenant" ("isActive");

-- Account indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_account_tenant_id ON "Account" ("tenantId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_account_is_active ON "Account" ("isActive");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_account_uuid ON "Account" ("uuid");

-- User indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_account_id ON "User" ("accountId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_is_active ON "User" ("isActive");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_uuid ON "User" ("uuid");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_hash ON "User" ("userHash");

-- ============================================
-- Permission System Indexes
-- ============================================

-- RolePermission junction table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_permission_permission_id ON "RolePermission" ("permissionId");

-- UserRole junction table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_role_role_id ON "UserRole" ("roleId");

-- ============================================
-- Option System Indexes
-- ============================================

-- OptionSet indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_option_set_uuid ON "OptionSet" ("uuid");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_option_set_tenant_id ON "OptionSet" ("tenantId") WHERE "tenantId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_option_set_is_active ON "OptionSet" ("isActive");

-- OptionValue indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_option_value_uuid ON "OptionValue" ("uuid");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_option_value_is_active ON "OptionValue" ("isActive");

-- ============================================
-- Category & Tag Indexes
-- ============================================

-- Category indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_category_parent_id ON "Category" ("parentId") WHERE "parentId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_category_is_active ON "Category" ("isActive");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_category_uuid ON "Category" ("uuid");

-- Tag indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tag_is_active ON "Tag" ("isActive");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tag_uuid ON "Tag" ("uuid");

-- CategoryTag junction table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_category_tag_tag_id ON "CategoryTag" ("tagId");

-- ============================================
-- Reference Data Indexes
-- ============================================

-- Currency, Country, Language indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_currency_is_active ON "Currency" ("isActive");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_country_is_active ON "Country" ("isActive");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_language_is_active ON "Language" ("isActive");

-- ============================================
-- Subscription System Indexes
-- ============================================

-- SubscriptionPlan indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_plan_public_active ON "SubscriptionPlan" ("isPublic", "isActive");

-- Feature indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feature_is_active ON "Feature" ("isActive");

-- PlanFeatureLimit indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_plan_feature_limit_feature_id ON "PlanFeatureLimit" ("featureId");

-- TenantSubscription indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_subscription_plan_id ON "TenantSubscription" ("planId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_subscription_status ON "TenantSubscription" ("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_subscription_end_date ON "TenantSubscription" ("endDate") WHERE "endDate" IS NOT NULL;

-- ============================================
-- Audit & Activity Log Indexes
-- ============================================

-- AuditLog indexes (high-volume table)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_tenant_created ON "audit_logs" ("tenantId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_user_created ON "audit_logs" ("userId", "createdAt" DESC) WHERE "userId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_entity ON "audit_logs" ("entityType", "entityId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_action ON "audit_logs" ("action");

-- UserActivityLog indexes (high-volume table)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_log_tenant_created ON "user_activity_logs" ("tenantId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_log_user_created ON "user_activity_logs" ("userId", "createdAt" DESC) WHERE "userId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_log_action ON "user_activity_logs" ("action");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_log_session ON "user_activity_logs" ("sessionId") WHERE "sessionId" IS NOT NULL;

-- ============================================
-- Permission Tracking Indexes
-- ============================================

-- RecordLock indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_record_lock_expires_at ON "record_locks" ("expiresAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_record_lock_locked_by ON "record_locks" ("lockedBy");

-- SavedSearch indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_search_is_active ON "saved_searches" ("isActive");

-- EmergencyAccessLog indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emergency_access_log_expires_at ON "emergency_access_logs" ("expiresAt") WHERE "expiresAt" IS NOT NULL;

-- PermissionTemplate indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permission_template_is_active ON "permission_templates" ("isActive");

-- ResourceScopedPermission indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resource_scoped_permission_tenant_id ON "resource_scoped_permissions" ("tenantId") WHERE "tenantId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resource_scoped_permission_expires_at ON "resource_scoped_permissions" ("expiresAt") WHERE "expiresAt" IS NOT NULL;

-- PermissionUsageTracking indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permission_usage_tracking_tenant_id ON "permission_usage_tracking" ("tenantId") WHERE "tenantId" IS NOT NULL;

-- ============================================
-- Analysis Queries
-- ============================================

-- After running the indexes, analyze the tables to update statistics
ANALYZE "Tenant";
ANALYZE "Account";
ANALYZE "User";
ANALYZE "Role";
ANALYZE "Permission";
ANALYZE "RolePermission";
ANALYZE "UserRole";
ANALYZE "OptionSet";
ANALYZE "OptionValue";
ANALYZE "Category";
ANALYZE "Tag";
ANALYZE "CategoryTag";
ANALYZE "Currency";
ANALYZE "Country";
ANALYZE "Language";
ANALYZE "SubscriptionPlan";
ANALYZE "Feature";
ANALYZE "PlanFeatureLimit";
ANALYZE "TenantSubscription";
ANALYZE "audit_logs";
ANALYZE "user_activity_logs";
ANALYZE "record_locks";
ANALYZE "saved_searches";
ANALYZE "emergency_access_logs";
ANALYZE "permission_templates";
ANALYZE "permission_health_checks";
ANALYZE "resource_scoped_permissions";
ANALYZE "permission_usage_tracking";