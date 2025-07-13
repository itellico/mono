-- Check Duplicate Permissions in Detail
SELECT '=== DUPLICATE PERMISSIONS DETAIL ===' AS section;
SELECT 
    p1.id,
    p1.name,
    p1.resource,
    p1.action,
    p1.pattern,
    p1.description
FROM "Permission" p1
INNER JOIN (
    SELECT resource, action
    FROM "Permission"
    GROUP BY resource, action
    HAVING COUNT(*) > 1
) dups ON p1.resource = dups.resource AND p1.action = dups.action
ORDER BY p1.resource, p1.action, p1.id;

-- Check User's Effective Permissions through Roles
SELECT '=== USER 1@1.com EFFECTIVE PERMISSIONS ===' AS section;
WITH user_permissions AS (
    SELECT DISTINCT
        p.id,
        p.name,
        p.resource,
        p.action,
        p.pattern,
        r.name as from_role
    FROM "Account" a
    JOIN "User" u ON u."accountId" = a.id
    JOIN "UserRole" ur ON u.id = ur."userId"
    JOIN "Role" r ON ur."roleId" = r.id
    JOIN "RolePermission" rp ON r.id = rp."roleId"
    JOIN "Permission" p ON rp."permissionId" = p.id
    WHERE a.email = '1@1.com'
)
SELECT 
    COUNT(DISTINCT id) as total_unique_permissions,
    COUNT(*) as total_assignments,
    STRING_AGG(DISTINCT from_role, ', ' ORDER BY from_role) as from_roles
FROM user_permissions;

-- Show sample of permissions for user 1@1.com
SELECT '=== SAMPLE PERMISSIONS FOR USER 1@1.com ===' AS section;
WITH user_permissions AS (
    SELECT DISTINCT
        p.id,
        p.name,
        p.resource,
        p.action,
        p.pattern,
        r.name as from_role
    FROM "Account" a
    JOIN "User" u ON u."accountId" = a.id
    JOIN "UserRole" ur ON u.id = ur."userId"
    JOIN "Role" r ON ur."roleId" = r.id
    JOIN "RolePermission" rp ON r.id = rp."roleId"
    JOIN "Permission" p ON rp."permissionId" = p.id
    WHERE a.email = '1@1.com'
)
SELECT resource, action, name, from_role
FROM user_permissions
ORDER BY resource, action
LIMIT 20;

-- Check if there are any orphaned permissions (not assigned to any role)
SELECT '=== ORPHANED PERMISSIONS ===' AS section;
SELECT p.id, p.name, p.resource, p.action, p.description
FROM "Permission" p
LEFT JOIN "RolePermission" rp ON p.id = rp."permissionId"
WHERE rp."permissionId" IS NULL
ORDER BY p.resource, p.action;

-- Verify permissions per resource for Super Admin
SELECT '=== SUPER ADMIN PERMISSIONS BY RESOURCE ===' AS section;
SELECT 
    p.resource,
    COUNT(*) as permission_count,
    STRING_AGG(p.action, ', ' ORDER BY p.action) as actions
FROM "Role" r
JOIN "RolePermission" rp ON r.id = rp."roleId"
JOIN "Permission" p ON rp."permissionId" = p.id
WHERE r.name = 'Super Admin'
GROUP BY p.resource
ORDER BY p.resource;

-- Check tenant isolation
SELECT '=== TENANT ISOLATION CHECK ===' AS section;
WITH tenant_data AS (
    SELECT 
        t.id as tenant_id,
        t.name as tenant_name,
        (SELECT COUNT(*) FROM "Account" WHERE "tenantId" = t.id) as accounts,
        (SELECT COUNT(*) FROM "User" u JOIN "Account" a ON u."accountId" = a.id WHERE a."tenantId" = t.id) as users,
        (SELECT COUNT(*) FROM "Role" WHERE "tenantId" = t.id AND "isSystem" = false) as custom_roles
    FROM "Tenant" t
)
SELECT * FROM tenant_data;

-- Check if we need to run any permission seeding
SELECT '=== MISSING STANDARD PERMISSIONS CHECK ===' AS section;
WITH expected_permissions AS (
    -- Based on CLAUDE.md, we should have 159 permissions
    SELECT 159 as expected_count
)
SELECT 
    (SELECT COUNT(*) FROM "Permission") as current_count,
    expected_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM "Permission") < expected_count 
        THEN 'Missing ' || (expected_count - (SELECT COUNT(*) FROM "Permission"))::text || ' permissions'
        WHEN (SELECT COUNT(*) FROM "Permission") > expected_count 
        THEN 'Extra ' || ((SELECT COUNT(*) FROM "Permission") - expected_count)::text || ' permissions (possible duplicates)'
        ELSE 'Permission count matches expected'
    END as status
FROM expected_permissions;

-- List all users with their roles
SELECT '=== ALL USERS AND ROLES ===' AS section;
SELECT 
    a.email,
    u.username,
    u."firstName" || ' ' || u."lastName" as full_name,
    STRING_AGG(r.name || ' (Level: ' || r.level || ')', ', ' ORDER BY r.level DESC) as roles,
    a."tenantId",
    t.name as tenant_name
FROM "Account" a
JOIN "User" u ON u."accountId" = a.id
LEFT JOIN "UserRole" ur ON u.id = ur."userId"
LEFT JOIN "Role" r ON ur."roleId" = r.id
LEFT JOIN "Tenant" t ON a."tenantId" = t.id
GROUP BY a.id, a.email, u.id, u.username, u."firstName", u."lastName", a."tenantId", t.name
ORDER BY a.email;