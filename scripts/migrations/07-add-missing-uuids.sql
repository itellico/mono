-- Migration: Add UUID fields to models missing them
-- This adds PostgreSQL UUID fields to Permission, Role, and related models

BEGIN;

-- Add UUID to Permission model
ALTER TABLE "Permission" 
ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid() UNIQUE;

-- Add UUID to Role model
ALTER TABLE "Role" 
ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid() UNIQUE;

-- Add UUID to RolePermission model
ALTER TABLE "RolePermission" 
ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid() UNIQUE;

-- Add UUID to UserRole model
ALTER TABLE "UserRole" 
ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid() UNIQUE;

-- Add UUID to UserPermission model
ALTER TABLE "UserPermission" 
ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid() UNIQUE;

-- Add UUID to PermissionAudit model
ALTER TABLE "PermissionAudit" 
ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid() UNIQUE;

-- Add UUID to PermissionSet model
ALTER TABLE "PermissionSet" 
ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid() UNIQUE;

-- Add UUID to PermissionSetItem model
ALTER TABLE "PermissionSetItem" 
ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid() UNIQUE;

-- Add UUID to audit_logs (it's using BigInt, should have UUID)
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid() UNIQUE;

-- Add UUID to user_activity_logs
ALTER TABLE user_activity_logs 
ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid() UNIQUE;

-- Add indexes on the new UUID columns
CREATE INDEX IF NOT EXISTS idx_permission_uuid ON "Permission"(uuid);
CREATE INDEX IF NOT EXISTS idx_role_uuid ON "Role"(uuid);
CREATE INDEX IF NOT EXISTS idx_role_permission_uuid ON "RolePermission"(uuid);
CREATE INDEX IF NOT EXISTS idx_user_role_uuid ON "UserRole"(uuid);
CREATE INDEX IF NOT EXISTS idx_user_permission_uuid ON "UserPermission"(uuid);
CREATE INDEX IF NOT EXISTS idx_permission_audit_uuid ON "PermissionAudit"(uuid);
CREATE INDEX IF NOT EXISTS idx_audit_logs_uuid ON audit_logs(uuid);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_uuid ON user_activity_logs(uuid);

-- Add comments
COMMENT ON COLUMN "Permission".uuid IS 'Unique identifier for external references';
COMMENT ON COLUMN "Role".uuid IS 'Unique identifier for external references';
COMMENT ON COLUMN "RolePermission".uuid IS 'Unique identifier for external references';
COMMENT ON COLUMN "UserRole".uuid IS 'Unique identifier for external references';
COMMENT ON COLUMN "UserPermission".uuid IS 'Unique identifier for external references';

COMMIT;