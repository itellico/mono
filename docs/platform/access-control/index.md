---
title: Access Control
sidebar_label: Access Control
---

# Platform Access Control

The Access Control Center is the central hub for managing roles, permissions, and access policies across the entire platform. This system implements a sophisticated 5-tier hierarchical permission model that enables fine-grained control over every aspect of the platform.

## Overview

The platform's access control system provides:

- **Role-Based Access Control (RBAC)**: Define roles with specific permission sets
- **Pattern-Based Permissions**: Use wildcards and patterns for flexible permission assignment
- **Hierarchical Inheritance**: Permissions cascade through the 5-tier architecture
- **Dynamic Permission Resolution**: Real-time permission checking with caching
- **Audit Trail**: Complete tracking of all permission changes

## Key Components

### 🔐 Permission Matrix

The [Permission Matrix](./permission-matrix) provides a comprehensive view of all permissions across all roles in a grid format. This allows administrators to:

- View all role-permission assignments at a glance
- Bulk edit permissions across multiple roles
- Identify permission gaps or overlaps
- Export permission configurations

### 👥 Role Management

The [Role Management](./roles) system allows you to:

- Create custom roles for any tier (Platform, Tenant, Account, User)
- Define role hierarchies and inheritance
- Set role-specific limits and quotas
- Assign roles to users with activation rules

### 🔑 Permission Management

The [Permission Management](./permissions) interface enables:

- Definition of granular permissions following the `tier.resource.action` pattern
- Creation of permission groups and categories
- Setting permission dependencies and conflicts
- Managing permission templates

### 🛡️ Access Policies

Access Policies define security rules and constraints:

- IP-based access restrictions
- Time-based access windows
- Device and location policies
- Multi-factor authentication requirements
- Session management rules

## Permission Model

### Permission Format

All permissions follow a strict naming convention:

```
{tier}.{resource}.{action}
```

Examples:
- `platform.tenants.create` - Create new tenants
- `tenant.users.read` - View users within a tenant
- `account.billing.manage` - Manage account billing
- `user.profile.update` - Update own profile

### Permission Patterns

The system supports pattern-based permissions using wildcards:

- `platform.*` - All platform permissions
- `tenant.users.*` - All user-related permissions in tenant
- `*.*.read` - All read permissions across tiers

### Permission Resolution

Permissions are resolved in order:

1. **Explicit Permissions**: Direct role assignments
2. **Pattern Permissions**: Wildcard matches
3. **Inherited Permissions**: From parent roles
4. **Default Permissions**: System defaults

## Implementation Details

### Caching Strategy

Permissions are cached at multiple levels:

- **Redis Cache**: 5-minute TTL for active permissions
- **In-Memory Cache**: Request-level caching
- **Database Cache**: Materialized permission views

### Security Features

- **Audit Logging**: Every permission check is logged
- **Anomaly Detection**: Unusual permission patterns trigger alerts
- **Regular Reviews**: Automated permission review workflows
- **Least Privilege**: Default deny with explicit grants

## Best Practices

1. **Use Role Templates**: Start with predefined role templates
2. **Regular Audits**: Review permissions quarterly
3. **Document Custom Roles**: Maintain clear documentation
4. **Test Permission Changes**: Use staging environment first
5. **Monitor Usage**: Track which permissions are actually used

## API Integration

Access control is deeply integrated with the API layer:

```typescript
// Route protection example
fastify.get('/api/v1/platform/tenants', {
  preHandler: [
    fastify.authenticate,
    fastify.requirePermission('platform.tenants.read')
  ],
  handler: async (request, reply) => {
    // Route logic
  }
})
```

## Related Documentation

- [RBAC System Architecture](./rbac-system)
- [API Security](/architecture/security/authentication)
- [Audit System](/platform/system-management/audit-system)
- [Permission Patterns Best Practices](/development/guides/permissions)