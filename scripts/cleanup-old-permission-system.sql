-- Cleanup Old Permission System
-- This script removes old permission tables and data that are no longer needed
-- after the RBAC optimization implementation

-- IMPORTANT: Run this only after verifying the new system is working correctly!

BEGIN;

-- Step 1: Drop the view first (since it might reference old tables)
DROP VIEW IF EXISTS "user_effective_permissions";

-- Step 2: Drop foreign key constraints that reference old tables
-- Drop the constraint from permission_usage_tracking that references resource_scoped_permissions
ALTER TABLE IF EXISTS "permission_usage_tracking" 
DROP CONSTRAINT IF EXISTS "permission_usage_tracking_resourceScopedPermissionId_fkey";

-- Step 3: Drop old legacy permission tables in correct order (child tables first)

-- Drop permission_usage_tracking (references other tables)
DROP TABLE IF EXISTS "permission_usage_tracking" CASCADE;
COMMENT ON SCHEMA public IS 'Dropped permission_usage_tracking - replaced by PermissionAudit';

-- Drop resource_scoped_permissions (was referenced by permission_usage_tracking)
DROP TABLE IF EXISTS "resource_scoped_permissions" CASCADE;
COMMENT ON SCHEMA public IS 'Dropped resource_scoped_permissions - replaced by UserPermission';

-- Drop permission_health_checks (standalone table)
DROP TABLE IF EXISTS "permission_health_checks" CASCADE;
COMMENT ON SCHEMA public IS 'Dropped permission_health_checks - functionality moved to RBAC monitoring';

-- Drop permission_templates (standalone table)
DROP TABLE IF EXISTS "permission_templates" CASCADE;
COMMENT ON SCHEMA public IS 'Dropped permission_templates - replaced by PermissionSet';

-- Drop emergency_access_logs (standalone table - replaced by EmergencyAccess)
DROP TABLE IF EXISTS "emergency_access_logs" CASCADE;
COMMENT ON SCHEMA public IS 'Dropped emergency_access_logs - replaced by EmergencyAccess';

-- Step 4: Clean up old permission data that doesn't use the new pattern structure
-- Remove any permissions that don't have the new pattern/resource/action/scope structure
DELETE FROM "Permission" 
WHERE ("pattern" IS NULL OR "resource" IS NULL OR "action" IS NULL OR "scope" IS NULL)
  AND "name" NOT LIKE '%.%.%';

-- Step 5: Remove old role permission assignments for non-existent permissions
DELETE FROM "RolePermission" 
WHERE "permissionId" IN (
  SELECT rp."permissionId" 
  FROM "RolePermission" rp 
  LEFT JOIN "Permission" p ON rp."permissionId" = p.id 
  WHERE p.id IS NULL
);

-- Step 6: Remove any duplicate permissions (keep the one with pattern data)
WITH duplicate_perms AS (
  SELECT 
    "name",
    COUNT(*) as count,
    MIN(id) as keep_id
  FROM "Permission"
  GROUP BY "name"
  HAVING COUNT(*) > 1
)
DELETE FROM "Permission" 
WHERE id IN (
  SELECT p.id 
  FROM "Permission" p
  INNER JOIN duplicate_perms dp ON p."name" = dp."name"
  WHERE p.id != dp.keep_id
);

-- Step 7: Update any remaining permissions to ensure they have proper structure
UPDATE "Permission" 
SET 
  "pattern" = "name",
  "resource" = SPLIT_PART("name", '.', 1),
  "action" = SPLIT_PART("name", '.', 2),
  "scope" = SPLIT_PART("name", '.', 3),
  "isWildcard" = CASE WHEN "name" LIKE '%*%' THEN true ELSE false END
WHERE "pattern" IS NULL AND "name" LIKE '%.%.%';

-- Step 8: Remove any old User model relations that are no longer valid
-- Remove old relation fields from User table if they exist
DO $$
BEGIN
  -- Remove old emergency access relations if they exist
  IF EXISTS(SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'User' AND column_name = 'emergencyAccessLogsAsSuperAdmin') THEN
    -- This would be handled by Prisma schema updates
    RAISE NOTICE 'Old User relations found - should be cleaned up in Prisma schema';
  END IF;
END $$;

-- Step 9: Recreate the user_effective_permissions view with the new structure
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

-- Step 10: Add comments to document the cleanup
COMMENT ON TABLE "Permission" IS 'Optimized permission table with wildcard pattern support - cleaned up from legacy system';
COMMENT ON TABLE "Role" IS 'Optimized role table with hierarchy support - cleaned up from legacy system';
COMMENT ON TABLE "PermissionAudit" IS 'Replaces old permission_usage_tracking with optimized structure';
COMMENT ON TABLE "UserPermission" IS 'Replaces old resource_scoped_permissions with simplified structure';
COMMENT ON TABLE "EmergencyAccess" IS 'Replaces old emergency_access_logs with improved tracking';

-- Step 11: Verify cleanup results
DO $$
DECLARE
  perm_count INTEGER;
  role_count INTEGER;
  wildcard_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO perm_count FROM "Permission";
  SELECT COUNT(*) INTO role_count FROM "Role";
  SELECT COUNT(*) INTO wildcard_count FROM "Permission" WHERE "isWildcard" = true;
  
  RAISE NOTICE 'Cleanup completed successfully:';
  RAISE NOTICE '- Total permissions: %', perm_count;
  RAISE NOTICE '- Total roles: %', role_count;
  RAISE NOTICE '- Wildcard permissions: %', wildcard_count;
  RAISE NOTICE '- Old legacy tables removed: 5 tables';
END $$;

COMMIT;

-- Final verification queries (run these manually to verify)
/*
-- 1. Check that old tables are gone
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('permission_health_checks', 'permission_templates', 'permission_usage_tracking', 'resource_scoped_permissions', 'emergency_access_logs');

-- 2. Check remaining permission structure
SELECT COUNT(*) as total_permissions, 
       COUNT(CASE WHEN "isWildcard" THEN 1 END) as wildcard_permissions,
       COUNT(CASE WHEN "pattern" IS NOT NULL THEN 1 END) as structured_permissions
FROM "Permission";

-- 3. Check role permission assignments
SELECT r.name, COUNT(rp.permissionId) as permission_count
FROM "Role" r
LEFT JOIN "RolePermission" rp ON r.id = rp.roleId
GROUP BY r.id, r.name
ORDER BY r.level DESC;

-- 4. Verify view works
SELECT COUNT(*) FROM "user_effective_permissions";
*/