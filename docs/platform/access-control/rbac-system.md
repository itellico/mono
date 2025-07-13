---
title: RBAC and Permissions System
category: features
tags:
  - rbac
  - permissions
  - security
  - authentication
  - authorization
  - multi-tenant
priority: high
lastUpdated: '2025-07-06'
---

# RBAC and Permissions System

## Overview

The Mono platform implements an advanced Role-Based Access Control (RBAC) system with pattern-based permissions, wildcard support, and multi-tenant isolation.

## Permission Architecture

### Permission Format
```
{tier}.{resource}.{action}
```

**Examples:**
- `user.profile.read` - Read own profile
- `account.users.create` - Create users in account
- `tenant.settings.update` - Update tenant settings
- `platform.monitoring.view` - View platform metrics

### Wildcard Support
- `tenant.*.read` - Read all tenant resources
- `account.users.*` - All actions on account users
- `*.*.delete` - Delete any resource (super admin only)

## Core Features

### 1. Hierarchical Roles
```
Super Admin
    └── Platform Admin
            └── Tenant Admin
                    └── Account Admin
                            └── User
```

### 2. Permission Inheritance
- Higher roles inherit all permissions from lower roles
- Tenant-specific permissions isolated per tenant
- Account permissions scoped to specific accounts

### 3. Optimized Permission Checking
```typescript
// Fast Redis-cached permission checks
const hasPermission = await checkPermission(userId, 'tenant.users.create', tenantId);

// Bulk permission checking
const permissions = await getUserPermissions(userId, tenantId);
```

### 4. Dynamic Permission Assignment
- Permissions can be granted/revoked in real-time
- Changes reflected immediately (Redis cache invalidation)
- Audit trail for all permission changes

## Implementation Details

### Database Schema

The RBAC system uses 5 core tables:

```sql
-- 1. permissions: All system permissions
permissions (id, name, resource, action, module)

-- 2. roles: System roles  
roles (id, code, name, description, tenant_id)

-- 3. role_permissions: Role → Permission mapping
role_permissions (role_id, permission_id)

-- 4. user_roles: User → Role mapping (PRIMARY METHOD)
user_roles (user_id, role_id, expires_at, is_active)

-- 5. user_permissions: Direct permissions (EXCEPTIONS ONLY)
user_permissions (user_id, permission_id, is_denied, expires_at)
```

### Permission Assignment Methods

#### 1. Role-Based Permissions (Primary) ✅
```
User → user_roles → Role → role_permissions → Permission
```
- **Currently used for all 19 users**
- Best practice for permission management
- Example: `admin` → `super_admin` role → 125 permissions

#### 2. Direct User Permissions (Exceptions) ⚠️
```
User → user_permissions → Permission  
```
- **Currently empty** (as it should be)
- Only for special cases:
  - Temporary access (time-limited)
  - Permission overrides (grant extra)
  - Permission denials (remove specific)
  - Conditional access (with conditions)

### Why user_permissions Table is Empty

An empty `user_permissions` table is **correct and expected**:
- ✅ Indicates clean RBAC implementation
- ✅ All permissions managed through roles
- ✅ No special exceptions needed
- ✅ Easier to maintain and audit

### Permission Checking Flow
1. Check user's direct permissions (if any)
2. Check user's role permissions (primary)
3. Apply permission denials
4. Check expiration dates
5. Apply tenant/account context
6. Return allow/deny decision

### Performance Optimizations
- **80% reduction** in permission entries using wildcards
- Redis caching with 5-minute TTL
- Bulk permission loading
- Optimized pattern matching algorithms

## Security Best Practices

### 1. Principle of Least Privilege
- Users start with minimal permissions
- Permissions explicitly granted as needed
- Regular permission audits

### 2. Tenant Isolation
- Permissions always scoped to tenant context
- Cross-tenant access requires platform-level permissions
- Separate permission sets per tenant

### 3. Action Logging
- All permission checks logged
- Failed authorization attempts tracked
- Audit reports available

## Common Permission Sets

### Platform Administrator
```
platform.*.*
tenant.*.*
account.*.*
user.*.*
```

### Tenant Administrator
```
tenant.{tenantId}.settings.*
tenant.{tenantId}.users.*
tenant.{tenantId}.accounts.*
tenant.{tenantId}.audit.read
```

### Account Manager
```
account.{accountId}.users.*
account.{accountId}.projects.*
account.{accountId}.settings.read
user.profile.*
```

### Regular User
```
user.profile.*
user.preferences.*
account.{accountId}.projects.read
```

## API Integration

### Check Permissions
```typescript
// Fastify route with permission check
fastify.get('/api/v1/tenant/users', {
  preHandler: [
    fastify.authenticate,
    fastify.requirePermission('tenant.users.read')
  ],
  handler: async (request, reply) => {
    // Route logic
  }
});
```

### Frontend Permission Gates
```typescript
// React component protection
<PermissionGate permissions={['account.billing.manage']}>
  <BillingSettings />
</PermissionGate>
```

## Current System Status

### Active Configuration
- **125 Total Permissions**: Distributed across 5 tiers
- **8 System Roles**: From super_admin to guest
- **19 Users**: All with proper role assignments
- **20 User-Role Links**: Complete coverage
- **238 Role-Permission Links**: Full permission mapping
- **0 Direct User Permissions**: Clean implementation

### Role Distribution
| Role | Users | Permissions |
|------|-------|-------------|
| super_admin | 1 | 125 |
| tenant_admin | 4 | 25 |
| account_admin | 5 | 17 |
| account_manager | 3 | 14 |
| user | 6 | 11 |

## Monitoring & Compliance

### Permission Analytics
- Most used permissions
- Permission denial patterns
- Role utilization statistics
- Direct permission usage (exceptions)

### Compliance Features
- Permission change history
- Access audit trails
- Compliance report generation
- GDPR data access tracking

### Troubleshooting Queries
```sql
-- Check user permissions
SELECT u.username, r.code, COUNT(p.id) as permissions
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.username = 'username_here'
GROUP BY u.username, r.code;

-- Verify system health
SELECT 
  (SELECT COUNT(*) FROM user_permissions) as direct_permissions,
  (SELECT COUNT(*) FROM user_roles) as role_assignments,
  (SELECT COUNT(*) FROM users WHERE id NOT IN (SELECT user_id FROM user_roles)) as users_without_roles;
```

This RBAC system provides fine-grained access control while maintaining excellent performance and security for the multi-tenant Mono platform.