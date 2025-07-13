# Complete RBAC System Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Permission Flow](#permission-flow)
5. [Why user_permissions is Empty](#why-user_permissions-is-empty)
6. [Role Assignments](#role-assignments)
7. [Permission Checking](#permission-checking)
8. [Troubleshooting](#troubleshooting)

## Overview

The itellico Mono platform uses a sophisticated Role-Based Access Control (RBAC) system that provides:

- **5-Tier Hierarchy**: Platform → Tenant → Account → User → Public
- **125 Permissions**: Distributed across all tiers
- **8 System Roles**: From super_admin to guest
- **Two Permission Methods**: Role-based (primary) and Direct (exceptional)

## Architecture

### Permission Format
```
{tier}.{resource}.{action}
```

Examples:
- `platform.tenants.create` - Create new tenants
- `tenant.accounts.read` - Read tenant accounts
- `account.users.update` - Update account users
- `user.profile.read` - Read own profile
- `public.docs.read` - Read public documentation

### 5-Tier Permission Hierarchy

```
Platform Level (25 permissions)
├── platform.system.*      - System configuration
├── platform.tenants.*     - Tenant management
├── platform.monitoring.*  - Platform monitoring
└── platform.features.*    - Feature management

Tenant Level (25 permissions)
├── tenant.settings.*      - Tenant configuration
├── tenant.accounts.*      - Account management
├── tenant.users.*         - User management
└── tenant.billing.*       - Billing management

Account Level (25 permissions)
├── account.teams.*        - Team management
├── account.projects.*     - Project management
├── account.billing.*      - Account billing
└── account.users.*        - Account users

User Level (25 permissions)
├── user.profile.*         - Profile management
├── user.content.*         - Content management
├── user.notifications.*   - Notifications
└── user.preferences.*     - User preferences

Public Level (25 permissions)
├── public.login          - Public login
├── public.register       - Registration
├── public.docs.*         - Documentation
└── public.api.docs       - API documentation
```

## Database Schema

### Core RBAC Tables

```sql
-- 1. permissions table
CREATE TABLE permissions (
  id INT PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,  -- e.g., "platform.tenants.create"
  description TEXT,
  resource VARCHAR(50),                -- e.g., "tenants"
  action VARCHAR(50),                  -- e.g., "create"
  module VARCHAR(50),                  -- e.g., "platform"
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. roles table
CREATE TABLE roles (
  id INT PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,          -- e.g., "Full system access"
  code VARCHAR(50) UNIQUE NOT NULL,    -- e.g., "super_admin"
  description TEXT,
  tenant_id INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. role_permissions table (Role → Permission mapping)
CREATE TABLE role_permissions (
  id INT PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid(),
  role_id INT REFERENCES roles(id),
  permission_id INT REFERENCES permissions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- 4. user_roles table (User → Role mapping)
CREATE TABLE user_roles (
  id INT PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid(),
  user_id INT REFERENCES users(id),
  role_id INT REFERENCES roles(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,                 -- Optional expiration
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP NOT NULL,
  UNIQUE(user_id, role_id)
);

-- 5. user_permissions table (Direct permission overrides)
CREATE TABLE user_permissions (
  id INT PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid(),
  user_id INT REFERENCES users(id),
  permission_id INT REFERENCES permissions(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,                 -- For temporary permissions
  is_denied BOOLEAN DEFAULT false,      -- Can deny a permission
  condition JSONB DEFAULT '{}',         -- Conditional permissions
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, permission_id)
);
```

## Permission Flow

### Primary Flow: Role-Based Permissions ✅

```
User → user_roles → Role → role_permissions → Permission
```

This is how 100% of users currently get permissions:

1. User is assigned one or more roles via `user_roles`
2. Each role has permissions assigned via `role_permissions`
3. User inherits all permissions from their assigned roles

Example:
```sql
-- Admin user permissions flow
admin (user) 
  → user_roles (user_id=1, role_id=1)
  → super_admin (role)
  → role_permissions (125 entries)
  → All 125 permissions
```

### Secondary Flow: Direct Permissions ⚠️

```
User → user_permissions → Permission
```

**Currently EMPTY** - Used only for exceptions:

## Why user_permissions is Empty

The `user_permissions` table being **empty is correct and expected**. Here's why:

### 1. It's for Exceptional Cases Only

The `user_permissions` table is designed for special overrides that can't be handled by role-based permissions:

| Use Case | Example | When to Use |
|----------|---------|-------------|
| **Temporary Access** | Grant developer production access for 24 hours | Emergency debugging |
| **Permission Override** | Give accountant billing access their role lacks | Special project needs |
| **Permission Denial** | Block specific user from deleting despite role | Security restriction |
| **Conditional Access** | Allow access only from specific IP | Extra security layer |
| **Time-Limited Grant** | Give intern limited access for 3 months | Temporary staff |

### 2. Best Practice: Use Roles

An empty `user_permissions` table indicates:
- ✅ Clean RBAC implementation
- ✅ All permissions managed through roles
- ✅ No special exceptions needed
- ✅ Easier to audit and maintain
- ✅ Consistent permission model

### 3. Current System Status

All 19 users have proper permissions through roles:

```sql
-- Verification query
SELECT r.code, COUNT(ur.user_id) as users, COUNT(DISTINCT rp.permission_id) as permissions
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.code
ORDER BY permissions DESC;

-- Results:
-- super_admin:     1 user,  125 permissions
-- tenant_admin:    4 users,  25 permissions  
-- account_admin:   5 users,  17 permissions
-- account_manager: 3 users,  14 permissions
-- user:            6 users,  11 permissions
```

## Role Assignments

### System Roles

| Role Code | Description | Permissions | Typical Users |
|-----------|-------------|-------------|---------------|
| `super_admin` | Full system access | 125 | Platform owner |
| `platform_admin` | Platform management | 27 | Platform staff |
| `tenant_admin` | Tenant management | 25 | Tenant admins |
| `tenant_manager` | Limited tenant access | 16 | Tenant staff |
| `account_admin` | Account management | 17 | Account owners |
| `account_manager` | Limited account access | 14 | Account staff |
| `user` | Standard user access | 11 | Regular users |
| `guest` | Public access only | 3 | Unauthenticated |

### Current User Assignments

```sql
-- Platform Level
admin           → super_admin + platform_admin
gomodels_admin  → tenant_admin
casting_director → tenant_admin
support_team    → tenant_admin
talent_manager  → tenant_admin

-- Account Level  
elite_director     → account_admin (agency)
stefan_berger      → account_admin (photographer)
sabine_mueller     → account_admin (guardian)
collective_founder → account_admin (creative)
sophie_laurent     → account_admin (model)

-- User Level
elite_booking    → account_manager
thomas_mueller   → account_manager
sophie_manager   → account_manager
elite_scout      → user
emma_mueller     → user
max_mueller      → user
anna_makeup      → user
peter_stylist    → user
photo_assistant  → user
```

## Permission Checking

### How to Check User Permissions

```sql
-- 1. Get all permissions for a user (through roles)
SELECT DISTINCT p.name, p.resource, p.action
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.username = 'admin'
ORDER BY p.name;

-- 2. Check if user has specific permission
SELECT EXISTS (
  SELECT 1
  FROM users u
  JOIN user_roles ur ON u.id = ur.user_id
  JOIN roles r ON ur.role_id = r.id
  JOIN role_permissions rp ON r.id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE u.username = 'elite_director'
    AND p.name = 'account.users.create'
) as has_permission;

-- 3. Get permission summary by role
SELECT 
  r.code as role,
  array_agg(DISTINCT p.name ORDER BY p.name) as permissions
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.code;
```

### API Permission Checking

```typescript
// In Fastify routes
fastify.get('/api/v1/accounts/:id/users', {
  preHandler: [
    fastify.authenticate,
    fastify.requirePermission('account.users.read')
  ],
  handler: async (request, reply) => {
    // Route logic
  }
});

// Custom permission check
const hasPermission = await checkUserPermission(
  userId, 
  'tenant.settings.update',
  { tenantId: request.params.tenantId }
);
```

## Troubleshooting

### Common Issues

1. **User can't access feature**
   - Check user has role: `SELECT * FROM user_roles WHERE user_id = ?`
   - Check role has permission: `SELECT * FROM role_permissions WHERE role_id = ?`
   - Verify permission exists: `SELECT * FROM permissions WHERE name = ?`

2. **Permission denied errors**
   ```sql
   -- Debug user permissions
   SELECT u.username, r.code, p.name
   FROM users u
   LEFT JOIN user_roles ur ON u.id = ur.user_id
   LEFT JOIN roles r ON ur.role_id = r.id
   LEFT JOIN role_permissions rp ON r.id = rp.role_id
   LEFT JOIN permissions p ON rp.permission_id = p.id
   WHERE u.username = 'username_here';
   ```

3. **Adding direct permissions (exceptional cases only)**
   ```sql
   -- Grant temporary permission
   INSERT INTO user_permissions (user_id, permission_id, expires_at)
   VALUES (
     (SELECT id FROM users WHERE username = 'developer'),
     (SELECT id FROM permissions WHERE name = 'platform.system.debug'),
     NOW() + INTERVAL '24 hours'
   );
   
   -- Deny specific permission
   INSERT INTO user_permissions (user_id, permission_id, is_denied)
   VALUES (
     (SELECT id FROM users WHERE username = 'intern'),
     (SELECT id FROM permissions WHERE name = 'account.users.delete'),
     true
   );
   ```

### Verification Queries

```sql
-- 1. System health check
SELECT 
  (SELECT COUNT(*) FROM permissions) as total_permissions,
  (SELECT COUNT(*) FROM roles) as total_roles,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM user_roles) as role_assignments,
  (SELECT COUNT(*) FROM role_permissions) as permission_assignments,
  (SELECT COUNT(*) FROM user_permissions) as direct_permissions;

-- 2. Users without roles (should be 0)
SELECT u.username
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL;

-- 3. Roles without permissions (only guest should appear)
SELECT r.code
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE rp.role_id IS NULL
GROUP BY r.code;
```

## Summary

The RBAC system is designed with security and maintainability in mind:

1. **Role-based by default**: All permissions flow through roles
2. **Direct permissions for exceptions**: The `user_permissions` table handles special cases
3. **Empty is good**: An empty `user_permissions` table means clean implementation
4. **Fully functional**: All 19 users have appropriate access through their roles

This architecture provides flexibility for future needs while maintaining a clean, auditable permission system.