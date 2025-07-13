-- Grid Platform Database State Check Script
-- ==========================================

-- 1. Check all roles exist and are properly configured
SELECT '=== CHECKING ROLES ===' AS section;
SELECT 
    r.id,
    r.name,
    r.description,
    r."createdAt",
    r."updatedAt",
    r."tenantId",
    r."parentRoleId",
    t.name as tenant_name,
    pr.name as parent_role_name,
    (SELECT COUNT(*) FROM "RolePermission" WHERE "roleId" = r.id) as permission_count
FROM "Role" r
LEFT JOIN "Tenant" t ON r."tenantId" = t.id
LEFT JOIN "Role" pr ON r."parentRoleId" = pr.id
ORDER BY r."createdAt";

-- 2. Check all permissions (should be 159 total)
SELECT '=== CHECKING PERMISSIONS ===' AS section;
SELECT COUNT(*) as total_permissions FROM "Permission";

SELECT 
    resource,
    COUNT(*) as action_count,
    STRING_AGG(action, ', ' ORDER BY action) as actions
FROM "Permission"
GROUP BY resource
ORDER BY resource;

-- 3. Check Super Admin role has all permissions assigned
SELECT '=== CHECKING SUPER ADMIN PERMISSIONS ===' AS section;
SELECT 
    r.name as role_name,
    COUNT(DISTINCT p.id) as assigned_permissions,
    (SELECT COUNT(*) FROM "Permission") as total_permissions,
    CASE 
        WHEN COUNT(DISTINCT p.id) = (SELECT COUNT(*) FROM "Permission") 
        THEN 'YES - Has all permissions'
        ELSE 'NO - Missing ' || ((SELECT COUNT(*) FROM "Permission") - COUNT(DISTINCT p.id))::text || ' permissions'
    END as has_all_permissions
FROM "Role" r
LEFT JOIN "RolePermission" rp ON r.id = rp."roleId"
LEFT JOIN "Permission" p ON rp."permissionId" = p.id
WHERE r.name = 'Super Admin'
GROUP BY r.id, r.name;

-- List missing permissions for Super Admin (if any)
SELECT '=== MISSING SUPER ADMIN PERMISSIONS ===' AS section;
SELECT p.id, p.resource, p.action, p.description
FROM "Permission" p
WHERE p.id NOT IN (
    SELECT rp."permissionId" 
    FROM "RolePermission" rp
    JOIN "Role" r ON rp."roleId" = r.id
    WHERE r.name = 'Super Admin'
)
ORDER BY p.resource, p.action;

-- 4. Check user 1@1.com has Super Admin role
SELECT '=== CHECKING USER 1@1.com ===' AS section;
SELECT 
    u.id,
    u.email,
    u.name,
    u."tenantId",
    t.name as tenant_name,
    r.name as role_name,
    ur."createdAt" as role_assigned_at
FROM "User" u
LEFT JOIN "Tenant" t ON u."tenantId" = t.id
LEFT JOIN "UserRole" ur ON u.id = ur."userId"
LEFT JOIN "Role" r ON ur."roleId" = r.id
WHERE u.email = '1@1.com';

-- 5. Check for UUID vs Integer ID usage in all tables
SELECT '=== CHECKING ID TYPES ===' AS section;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND column_name = 'id'
AND table_name NOT LIKE '\_%' ESCAPE '\'
ORDER BY table_name;

-- Check for any UUID columns
SELECT '=== CHECKING UUID COLUMNS ===' AS section;
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND data_type = 'uuid'
ORDER BY table_name, column_name;

-- 6. Verify tenant structure and relationships
SELECT '=== CHECKING TENANT STRUCTURE ===' AS section;
SELECT 
    t.id,
    t.name,
    t.subdomain,
    t.status,
    t."createdAt",
    t."updatedAt",
    (SELECT COUNT(*) FROM "User" WHERE "tenantId" = t.id) as user_count,
    (SELECT COUNT(*) FROM "Role" WHERE "tenantId" = t.id) as role_count,
    (SELECT COUNT(*) FROM "FeatureTenant" WHERE "tenantId" = t.id) as feature_count
FROM "Tenant" t
ORDER BY t."createdAt";

-- Check tenant relationships
SELECT '=== CHECKING TENANT RELATIONSHIPS ===' AS section;
WITH tenant_stats AS (
    SELECT 
        'User' as entity,
        COUNT(DISTINCT "tenantId") as tenant_count,
        COUNT(*) as total_records,
        COUNT(CASE WHEN "tenantId" IS NULL THEN 1 END) as null_tenant_count
    FROM "User"
    UNION ALL
    SELECT 'Role', COUNT(DISTINCT "tenantId"), COUNT(*), COUNT(CASE WHEN "tenantId" IS NULL THEN 1 END) FROM "Role"
    UNION ALL
    SELECT 'Product', COUNT(DISTINCT "tenantId"), COUNT(*), COUNT(CASE WHEN "tenantId" IS NULL THEN 1 END) FROM "Product"
    UNION ALL
    SELECT 'Category', COUNT(DISTINCT "tenantId"), COUNT(*), COUNT(CASE WHEN "tenantId" IS NULL THEN 1 END) FROM "Category"
    UNION ALL
    SELECT 'Notification', COUNT(DISTINCT "tenantId"), COUNT(*), COUNT(CASE WHEN "tenantId" IS NULL THEN 1 END) FROM "Notification"
)
SELECT * FROM tenant_stats ORDER BY entity;

-- 7. Check for any data integrity issues
SELECT '=== CHECKING DATA INTEGRITY ===' AS section;

-- Check for orphaned UserRoles
SELECT 'Orphaned UserRoles' as issue_type, COUNT(*) as count
FROM "UserRole" ur
WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = ur."userId")
   OR NOT EXISTS (SELECT 1 FROM "Role" r WHERE r.id = ur."roleId")
UNION ALL
-- Check for orphaned RolePermissions
SELECT 'Orphaned RolePermissions', COUNT(*)
FROM "RolePermission" rp
WHERE NOT EXISTS (SELECT 1 FROM "Role" r WHERE r.id = rp."roleId")
   OR NOT EXISTS (SELECT 1 FROM "Permission" p WHERE p.id = rp."permissionId")
UNION ALL
-- Check for Users without tenants
SELECT 'Users without tenants', COUNT(*)
FROM "User" u
WHERE u."tenantId" IS NULL
UNION ALL
-- Check for Roles without tenants
SELECT 'Roles without tenants', COUNT(*)
FROM "Role" r
WHERE r."tenantId" IS NULL;

-- Additional checks for foreign key violations
SELECT '=== CHECKING FOREIGN KEY VIOLATIONS ===' AS section;
SELECT 
    'User.tenantId -> Tenant.id' as relationship,
    COUNT(*) as violations
FROM "User" u
WHERE u."tenantId" IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM "Tenant" t WHERE t.id = u."tenantId")
UNION ALL
SELECT 
    'Role.tenantId -> Tenant.id',
    COUNT(*)
FROM "Role" r
WHERE r."tenantId" IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM "Tenant" t WHERE t.id = r."tenantId")
UNION ALL
SELECT 
    'Role.parentRoleId -> Role.id',
    COUNT(*)
FROM "Role" r
WHERE r."parentRoleId" IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM "Role" pr WHERE pr.id = r."parentRoleId");

-- Database statistics
SELECT '=== DATABASE STATISTICS ===' AS section;
SELECT 
    'Total Tenants' as metric,
    COUNT(*)::text as value
FROM "Tenant"
UNION ALL
SELECT 'Total Users', COUNT(*)::text FROM "User"
UNION ALL
SELECT 'Total Roles', COUNT(*)::text FROM "Role"
UNION ALL
SELECT 'Total Permissions', COUNT(*)::text FROM "Permission"
UNION ALL
SELECT 'Total UserRole assignments', COUNT(*)::text FROM "UserRole"
UNION ALL
SELECT 'Total RolePermission assignments', COUNT(*)::text FROM "RolePermission"
UNION ALL
SELECT 'Total Products', COUNT(*)::text FROM "Product"
UNION ALL
SELECT 'Total Categories', COUNT(*)::text FROM "Category"
ORDER BY metric;

-- Check RBACConfig
SELECT '=== CHECKING RBAC CONFIG ===' AS section;
SELECT * FROM "RBACConfig";

-- Check for any duplicate permissions
SELECT '=== CHECKING DUPLICATE PERMISSIONS ===' AS section;
SELECT resource, action, COUNT(*) as count
FROM "Permission"
GROUP BY resource, action
HAVING COUNT(*) > 1;

-- Check role hierarchy
SELECT '=== CHECKING ROLE HIERARCHY ===' AS section;
WITH RECURSIVE role_tree AS (
    -- Base case: roles without parents
    SELECT 
        id,
        name,
        "parentRoleId",
        "tenantId",
        0 as level,
        name::text as path
    FROM "Role"
    WHERE "parentRoleId" IS NULL
    
    UNION ALL
    
    -- Recursive case
    SELECT 
        r.id,
        r.name,
        r."parentRoleId",
        r."tenantId",
        rt.level + 1,
        rt.path || ' -> ' || r.name
    FROM "Role" r
    INNER JOIN role_tree rt ON r."parentRoleId" = rt.id
)
SELECT 
    level,
    path,
    "tenantId",
    (SELECT name FROM "Tenant" WHERE id = role_tree."tenantId") as tenant_name
FROM role_tree
ORDER BY level, path;