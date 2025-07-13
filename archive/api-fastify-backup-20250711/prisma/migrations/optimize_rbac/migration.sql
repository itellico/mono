-- Optimize RBAC Schema Migration
-- This migration transforms the existing RBAC system to support wildcards, inheritance, and caching

-- Step 1: Add new columns to existing Permission table
ALTER TABLE "Permission" 
ADD COLUMN IF NOT EXISTS "pattern" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "resource" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "action" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "scope" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "isWildcard" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "priority" INTEGER DEFAULT 100;

-- Step 2: Migrate existing permission data to new format
UPDATE "Permission" 
SET 
  "pattern" = "name",
  "resource" = SPLIT_PART("name", '.', 1),
  "action" = SPLIT_PART("name", '.', 2),
  "scope" = SPLIT_PART("name", '.', 3),
  "isWildcard" = CASE WHEN "name" LIKE '%*%' THEN true ELSE false END
WHERE "pattern" IS NULL;

-- Step 3: Add indexes for performance
CREATE INDEX IF NOT EXISTS "idx_permission_pattern" ON "Permission"("pattern");
CREATE INDEX IF NOT EXISTS "idx_permission_resource_action_scope" ON "Permission"("resource", "action", "scope");
CREATE INDEX IF NOT EXISTS "idx_permission_wildcard_priority" ON "Permission"("isWildcard", "priority");

-- Step 4: Add new columns to Role table
ALTER TABLE "Role" 
ADD COLUMN IF NOT EXISTS "code" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "level" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "isSystem" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;

-- Update existing roles with codes and levels
UPDATE "Role" SET "code" = LOWER(REPLACE("name", ' ', '_')) WHERE "code" IS NULL;
UPDATE "Role" SET "level" = 
  CASE 
    WHEN "name" = 'super_admin' THEN 5
    WHEN "name" = 'tenant_admin' THEN 4
    WHEN "name" = 'content_moderator' THEN 3
    WHEN "name" = 'user_manager' THEN 2
    WHEN "name" = 'analytics_viewer' THEN 1
    ELSE 0
  END
WHERE "level" = 0;

-- Make code unique
CREATE UNIQUE INDEX IF NOT EXISTS "idx_role_code" ON "Role"("code");
CREATE INDEX IF NOT EXISTS "idx_role_level" ON "Role"("level");
CREATE INDEX IF NOT EXISTS "idx_role_tenant" ON "Role"("tenantId");

-- Step 5: Create Permission Sets table
CREATE TABLE IF NOT EXISTS "PermissionSet" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(50) UNIQUE NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP
);

-- Step 6: Create Permission Set Items table
CREATE TABLE IF NOT EXISTS "PermissionSetItem" (
  "setId" INTEGER NOT NULL,
  "permissionId" INTEGER NOT NULL,
  PRIMARY KEY ("setId", "permissionId"),
  FOREIGN KEY ("setId") REFERENCES "PermissionSet"("id") ON DELETE CASCADE,
  FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_permission_set_item_permission" ON "PermissionSetItem"("permissionId");

-- Step 7: Create Role Permission Sets table
CREATE TABLE IF NOT EXISTS "RolePermissionSet" (
  "roleId" INTEGER NOT NULL,
  "setId" INTEGER NOT NULL,
  PRIMARY KEY ("roleId", "setId"),
  FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE,
  FOREIGN KEY ("setId") REFERENCES "PermissionSet"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_role_permission_set_set" ON "RolePermissionSet"("setId");

-- Step 8: Create Permission Inheritance table
CREATE TABLE IF NOT EXISTS "PermissionInheritance" (
  "parentId" INTEGER NOT NULL,
  "childId" INTEGER NOT NULL,
  PRIMARY KEY ("parentId", "childId"),
  FOREIGN KEY ("parentId") REFERENCES "Permission"("id") ON DELETE CASCADE,
  FOREIGN KEY ("childId") REFERENCES "Permission"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_permission_inheritance_child" ON "PermissionInheritance"("childId");

-- Step 9: Create User Permission table for direct assignments
CREATE TABLE IF NOT EXISTS "UserPermission" (
  "userId" INTEGER NOT NULL,
  "permissionId" INTEGER NOT NULL,
  "granted" BOOLEAN DEFAULT true,
  "validFrom" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "validUntil" TIMESTAMPTZ(6),
  "grantedBy" INTEGER,
  "grantReason" TEXT,
  "resourceType" VARCHAR(50),
  "resourceId" VARCHAR(255),
  "conditions" JSONB,
  "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("userId", "permissionId"),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE,
  FOREIGN KEY ("grantedBy") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "idx_user_permission_permission" ON "UserPermission"("permissionId");
CREATE INDEX IF NOT EXISTS "idx_user_permission_granted" ON "UserPermission"("granted");
CREATE INDEX IF NOT EXISTS "idx_user_permission_valid_until" ON "UserPermission"("validUntil");
CREATE INDEX IF NOT EXISTS "idx_user_permission_resource" ON "UserPermission"("resourceType", "resourceId");

-- Step 10: Create simplified Permission Audit table
CREATE TABLE IF NOT EXISTS "PermissionAudit" (
  "id" BIGSERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "permissionPattern" VARCHAR(100) NOT NULL,
  "resource" VARCHAR(255),
  "action" VARCHAR(50) NOT NULL,
  "granted" BOOLEAN NOT NULL,
  "ipAddress" VARCHAR(45),
  "userAgent" TEXT,
  "requestId" VARCHAR(36),
  "checkDurationMs" INTEGER,
  "tenantId" INTEGER,
  "timestamp" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_permission_audit_user_time" ON "PermissionAudit"("userId", "timestamp");
CREATE INDEX IF NOT EXISTS "idx_permission_audit_pattern" ON "PermissionAudit"("permissionPattern");
CREATE INDEX IF NOT EXISTS "idx_permission_audit_granted" ON "PermissionAudit"("granted");
CREATE INDEX IF NOT EXISTS "idx_permission_audit_tenant_time" ON "PermissionAudit"("tenantId", "timestamp");
CREATE INDEX IF NOT EXISTS "idx_permission_audit_timestamp" ON "PermissionAudit"("timestamp");

-- Step 11: Create Emergency Access table
CREATE TABLE IF NOT EXISTS "EmergencyAccess" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "targetType" VARCHAR(50) NOT NULL,
  "targetId" VARCHAR(255) NOT NULL,
  "justification" TEXT NOT NULL,
  "grantedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMPTZ(6) NOT NULL,
  "revokedAt" TIMESTAMPTZ(6),
  "approvedBy" INTEGER,
  "approvedAt" TIMESTAMPTZ(6),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "idx_emergency_access_user" ON "EmergencyAccess"("userId");
CREATE INDEX IF NOT EXISTS "idx_emergency_access_expires" ON "EmergencyAccess"("expiresAt");
CREATE INDEX IF NOT EXISTS "idx_emergency_access_target" ON "EmergencyAccess"("targetType", "targetId");

-- Step 12: Create Performance Optimization tables
CREATE TABLE IF NOT EXISTS "UserPermissionCache" (
  "userId" INTEGER PRIMARY KEY,
  "permissions" JSONB NOT NULL,
  "computedAt" TIMESTAMPTZ(6) NOT NULL,
  "expiresAt" TIMESTAMPTZ(6) NOT NULL,
  "cacheVersion" INTEGER DEFAULT 1,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_user_permission_cache_expires" ON "UserPermissionCache"("expiresAt");

CREATE TABLE IF NOT EXISTS "PermissionExpansion" (
  "pattern" VARCHAR(100) PRIMARY KEY,
  "expandedPatterns" JSONB NOT NULL,
  "computedAt" TIMESTAMPTZ(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_permission_expansion_computed" ON "PermissionExpansion"("computedAt");

-- Step 13: Create RBAC Configuration table
CREATE TABLE IF NOT EXISTS "RBACConfig" (
  "id" INTEGER PRIMARY KEY DEFAULT 1,
  "enableWildcards" BOOLEAN DEFAULT true,
  "enableInheritance" BOOLEAN DEFAULT true,
  "enableCaching" BOOLEAN DEFAULT true,
  "cacheExpirationMinutes" INTEGER DEFAULT 15,
  "maxPermissionsPerUser" INTEGER DEFAULT 1000,
  "enableAuditLog" BOOLEAN DEFAULT true,
  "auditRetentionDays" INTEGER DEFAULT 90,
  "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rbac_config_singleton" CHECK ("id" = 1)
);

-- Step 14: Add constraints to UserRole for time-based permissions
ALTER TABLE "UserRole" 
ADD COLUMN IF NOT EXISTS "validFrom" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "validUntil" TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS "grantedBy" INTEGER,
ADD COLUMN IF NOT EXISTS "grantReason" TEXT,
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "UserRole"
ADD FOREIGN KEY ("grantedBy") REFERENCES "User"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_user_role_valid_until" ON "UserRole"("validUntil");

-- Step 15: Create a view for effective user permissions (performance optimization)
CREATE OR REPLACE VIEW "user_effective_permissions" AS
SELECT DISTINCT
  u."id" as "userId",
  p."pattern",
  p."resource",
  p."action",
  p."scope",
  'role' as "source"
FROM "User" u
JOIN "UserRole" ur ON u."id" = ur."userId"
JOIN "RolePermission" rp ON ur."roleId" = rp."roleId"
JOIN "Permission" p ON rp."permissionId" = p."id"
WHERE ur."validUntil" IS NULL OR ur."validUntil" > NOW()

UNION

SELECT DISTINCT
  u."id" as "userId",
  p."pattern",
  p."resource",
  p."action",
  p."scope",
  'direct' as "source"
FROM "User" u
JOIN "UserPermission" up ON u."id" = up."userId"
JOIN "Permission" p ON up."permissionId" = p."id"
WHERE up."granted" = true
  AND (up."validUntil" IS NULL OR up."validUntil" > NOW());

-- Step 16: Update triggers for timestamp management
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_permission_updated_at BEFORE UPDATE ON "Permission"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_updated_at BEFORE UPDATE ON "Role"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permission_set_updated_at BEFORE UPDATE ON "PermissionSet"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_permission_updated_at BEFORE UPDATE ON "UserPermission"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_role_updated_at BEFORE UPDATE ON "UserRole"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rbac_config_updated_at BEFORE UPDATE ON "RBACConfig"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 17: Insert default RBAC configuration
INSERT INTO "RBACConfig" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING;