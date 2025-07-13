-- Quick RBAC fix for testing
-- This creates basic roles and permissions for the test user

-- Insert basic roles
INSERT INTO "Role" (name, description, code, level, "isSystem", "createdAt", "updatedAt")
VALUES 
  ('Super Admin', 'Full system access', 'SUPER_ADMIN', 100, true, NOW(), NOW()),
  ('Admin', 'Administrative access', 'ADMIN', 80, true, NOW(), NOW()),
  ('User', 'Basic user access', 'USER', 10, false, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert basic permissions
INSERT INTO "Permission" (name, pattern, description, resource, action, scope, "isWildcard", priority, "createdAt", "updatedAt")
VALUES 
  ('admin.*', 'admin.*', 'All admin access', 'admin', '*', 'global', true, 100, NOW(), NOW()),
  ('platform.*', 'platform.*', 'All platform access', 'platform', '*', 'global', true, 100, NOW(), NOW()),
  ('tenant.*', 'tenant.*', 'All tenant access', 'tenant', '*', 'tenant', true, 100, NOW(), NOW()),
  ('user.*', 'user.*', 'All user access', 'user', '*', 'user', true, 100, NOW(), NOW()),
  ('*', '*', 'Full system access', '*', '*', 'global', true, 1000, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Get the role and permission IDs
-- First assign permissions to Super Admin role
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r.id, p.id
FROM "Role" r, "Permission" p
WHERE r.name = 'Super Admin' AND p.name = '*'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Assign permissions to Admin role  
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r.id, p.id
FROM "Role" r, "Permission" p
WHERE r.name = 'Admin' AND p.name IN ('admin.*', 'platform.*', 'tenant.*')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Assign Super Admin role to the test user (ID 2)
INSERT INTO "UserRole" ("userId", "roleId")
SELECT 2, r.id
FROM "Role" r
WHERE r.name = 'Super Admin'
ON CONFLICT ("userId", "roleId") DO NOTHING;

-- Show the results
SELECT 'Roles created:' as action;
SELECT id, name, description FROM "Role";

SELECT 'Permissions created:' as action;
SELECT id, name, pattern, description FROM "Permission";

SELECT 'Role permissions assigned:' as action;
SELECT rp."roleId", r.name as role_name, p.name as permission_name, p.pattern
FROM "RolePermission" rp
JOIN "Role" r ON rp."roleId" = r.id
JOIN "Permission" p ON rp."permissionId" = p.id;

SELECT 'User roles assigned:' as action;
SELECT ur."userId", u.uuid, u."firstName", u."lastName", r.name as role_name
FROM "UserRole" ur
JOIN "User" u ON ur."userId" = u.id
JOIN "Role" r ON ur."roleId" = r.id
WHERE u.uuid = '97562a6a-f06b-4b26-9e5c-d9d14c289fde';