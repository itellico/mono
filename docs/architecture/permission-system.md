# itellico Mono Permission System Architecture

## Overview

The itellico Mono platform implements a comprehensive Role-Based Access Control (RBAC) system with a 5-tier hierarchy. This document details the complete permission system implementation using Next.js API routes with service-based architecture and three-layer caching.

## 🏗️ Architecture Components

### 1. Database Schema

```prisma
// Permission Model
model Permission {
  uuid        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  id          Int       @unique @default(autoincrement())
  name        String    @unique  // Format: module.resource.action
  module      String?   // platform, tenant, account, user, public
  resource    String?   // users, settings, billing, etc.
  action      String?   // read, create, update, delete, manage
  scope       String?   // global, tenant, account, own
  description String?
  is_system   Boolean   @default(false)
  priority    Int       @default(100)
}

// Role Model
model Role {
  id          Int      @id @default(autoincrement())
  name        String   // Display name
  code        String   @unique // System identifier (super_admin, tenant_admin, etc.)
  description String?
  tenant_id   Int?
}

// Junction Tables
model UserRole {
  user_id Int
  role_id Int
}

model RolePermission {
  role_id       Int
  permission_id Int
}
```

### 2. Role Hierarchy

```
super_admin (130 permissions)
    ├── platform_admin (27 permissions)
    ├── tenant_admin (25 permissions)
    │   └── tenant_manager (16 permissions)
    ├── account_admin (17 permissions)
    │   └── account_manager (14 permissions)
    └── user (11 permissions)
        └── guest (3 permissions)
```

### 3. Permission Naming Convention

All permissions follow the pattern: `module.resource.action`

Examples:
- `platform.users.read`
- `tenant.billing.manage`
- `account.settings.update`
- `user.profile.delete`

## 🔐 Next.js API Implementation

### Permission Service

```typescript
// @/lib/services/permissions.service.ts
import { db as prisma } from '@/lib/db'
import { cache, CacheKeyBuilder } from '@/lib/cache/cache-middleware'
import { logger } from '@/lib/logger'

export class PermissionsService {
  /**
   * Get user permissions with three-layer caching
   * 1. TanStack Query (client-side)
   * 2. Redis (server-side cache)
   * 3. Database (source of truth)
   */
  async getUserPermissions(userId: string): Promise<UserPermissionData | null> {
    const cacheKey = CacheKeyBuilder.user(tenantId, userId, 'permissions');
    
    return await cache.get<UserPermissionData>(cacheKey, {
      ttl: 300, // 5 minutes
      tags: ['permissions', `tenant:${tenantId}`, `user:${userId}`],
      fallback: async () => {
        // Load permissions from database with roles
        const user = await prisma.user.findFirst({
          where: userId.includes('-') ? { uuid: userId } : { id: parseInt(userId) },
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: { permission: true }
                    }
                  }
                }
              }
            }
          }
        });

        // Build permission data with role-based permissions
        return {
          userId,
          tenantId: user.account.tenantId,
          roles: user.userRoles.map(ur => ur.role),
          permissions: user.userRoles.flatMap(ur => 
            ur.role.permissions.map(rp => rp.permission.name)
          ),
          lastUpdated: Date.now()
        };
      }
    });
  }

  /**
   * Check if user has specific permission
   * SUPER ADMIN BYPASS: Super admin always returns true
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const permissionData = await this.getUserPermissions(userId);
    
    if (!permissionData) return false;

    // Super admin bypass
    const isSuperAdmin = permissionData.roles.some(role => role.name === 'super_admin');
    if (isSuperAdmin) return true;

    return this.checkPermissionWithWildcards(permissionData.permissions, permission);
  }
}

export const permissionsService = PermissionsService.getInstance();
```

### API Route Implementation

```typescript
// /app/api/v1/platform/tenants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { permissionsService } from '@/lib/services/permissions.service';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Permission check
    const hasPermission = await permissionsService.hasPermission(
      session.user.id,
      'platform.tenants.read'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Required: platform.tenants.read' },
        { status: 403 }
      );
    }

    // Implementation
    const tenants = await getTenants();
    
    return NextResponse.json({
      success: true,
      data: tenants
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const hasPermission = await permissionsService.hasPermission(
      session.user.id,
      'platform.tenants.create'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Required: platform.tenants.create' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = await createTenant(body);
    
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Permission Middleware Helper

```typescript
// @/lib/api-permissions-wrapper.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { permissionsService } from '@/lib/services/permissions.service';

export function withPermissions(permissions: string[]) {
  return function (handler: Function) {
    return async function (request: NextRequest, ...args: any[]) {
      try {
        const session = await auth();
        if (!session?.user) {
          return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { status: 401 }
          );
        }

        // Check if user has any of the required permissions
        const hasPermission = await permissionsService.hasAnyPermission(
          session.user.id,
          permissions
        );

        if (!hasPermission) {
          return NextResponse.json(
            { success: false, error: `Access denied. Required: ${permissions.join(', ')}` },
            { status: 403 }
          );
        }

        return handler(request, ...args);
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Internal server error' },
          { status: 500 }
        );
      }
    };
  };
}

// Usage in API routes
export const GET = withPermissions(['platform.tenants.read'])(
  async (request: NextRequest) => {
    // Your handler implementation
  }
);
```

## 📊 Permission Matrix

### Platform Tier
| Resource | Read | Create | Update | Delete | Manage |
|----------|------|--------|--------|--------|---------|
| tenants | ✅ | ✅ | ✅ | ✅ | ✅ |
| plans | ✅ | ✅ | ✅ | ✅ | - |
| features | ✅ | ✅ | ✅ | ✅ | - |
| monitoring | ✅ | - | - | - | ✅ |
| analytics | ✅ | - | - | - | - |
| support | ✅ | - | - | - | ✅ |
| system | ✅ | - | - | - | ✅ |

### Tenant Tier
| Resource | Read | Create | Update | Delete | Manage |
|----------|------|--------|--------|--------|---------|
| accounts | ✅ | ✅ | ✅ | ✅ | - |
| users | ✅ | ✅ | ✅ | ✅ | - |
| billing | ✅ | - | - | - | ✅ |
| reports | ✅ | ✅ | - | - | - |
| settings | ✅ | - | ✅ | - | - |

### Account Tier
| Resource | Read | Create | Update | Delete | Manage |
|----------|------|--------|--------|--------|---------|
| users | ✅ | ✅ | ✅ | ✅ | - |
| teams | ✅ | ✅ | ✅ | ✅ | - |
| projects | ✅ | ✅ | ✅ | ✅ | - |
| billing | ✅ | - | - | - | ✅ |
| settings | ✅ | - | ✅ | - | - |

### User Tier
| Resource | Read | Create | Update | Delete | Manage |
|----------|------|--------|--------|--------|---------|
| profile | ✅ | - | ✅ | ✅ | - |
| preferences | ✅ | - | ✅ | - | - |
| content | ✅ | ✅ | ✅ | ✅ | - |
| notifications | ✅ | - | - | - | ✅ |

## 🛡️ Security Features

### 1. Three-Layer Caching
- **Layer 1**: TanStack Query (client-side cache)
- **Layer 2**: Redis (server-side cache, 5-minute TTL)
- **Layer 3**: Database (source of truth)
- Cache invalidated on role/permission changes
- Graceful degradation if Redis fails

### 2. Super Admin Bypass
```typescript
// Super admin bypasses all permission checks
const isSuperAdmin = permissionData.roles.some(role => role.name === 'super_admin');
if (isSuperAdmin) {
  logger.debug('✅ Super admin bypass - full access granted');
  return true;
}

// Regular permission checking with wildcard support
return this.checkPermissionWithWildcards(userPermissions, requiredPermission);
```

### 3. Wildcard Permission Support
```typescript
// Supports wildcard patterns like 'tenant.*' or 'user.profile.*'
private checkPermissionWithWildcards(userPermissions: string[], required: string): boolean {
  for (const userPerm of userPermissions) {
    const userParts = userPerm.split('.');
    const requiredParts = required.split('.');
    
    const matches = userParts.every((part, index) => 
      part === '*' || part === requiredParts[index]
    );
    
    if (matches) return true;
  }
  return false;
}
```

### 4. Audit Logging
- All permission checks are logged with context
- Metrics tracked for granted/denied access
- Integration with monitoring system
- Performance metrics for cache hits/misses

## 🎯 Frontend Integration

### Permission Guard Component
```typescript
export const AdminGuard: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  
  if (!user) return <Redirect to="/auth/signin" />;
  
  const userContext = extractUserContext({ user });
  
  if (!hasAdminAccess(userContext)) {
    return fallback || <AccessDenied />;
  }
  
  return <>{children}</>;
};
```

### Role Constants
```typescript
export const ENHANCED_ADMIN_ROLES = [
  'super_admin',
  'tenant_admin', 
  'content_moderator'
] as const;
```

## 📝 Best Practices

### 1. Always Use Permission Service
```typescript
// ✅ Good - using service
const hasPermission = await permissionsService.hasPermission(
  session.user.id,
  'platform.users.read'
);

// ❌ Bad - manual checking
if (!user.permissions.includes('platform.users.read')) {
  throw new Error('Access denied');
}
```

### 2. Use Middleware Wrapper
```typescript
// ✅ Good - using middleware wrapper
export const GET = withPermissions(['platform.tenants.read'])(
  async (request: NextRequest) => {
    // Your handler implementation
  }
);

// ✅ Also good - manual implementation with consistent error handling
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const hasPermission = await permissionsService.hasPermission(
    session.user.id,
    'platform.users.read'
  );

  if (!hasPermission) {
    return NextResponse.json(
      { success: false, error: 'Access denied. Required: platform.users.read' },
      { status: 403 }
    );
  }

  // Implementation
}
```

### 3. Use Proper Naming
```typescript
// ✅ Good - follows convention
'platform.monitoring.read'
'tenant.billing.manage'

// ❌ Bad - inconsistent
'readPlatformMonitoring'
'TENANT_BILLING_MANAGE'
```

### 4. Leverage Super Admin Bypass
```typescript
// Super admin bypass is automatically handled by the service
// No need to check manually in your API routes
const hasPermission = await permissionsService.hasPermission(
  session.user.id,
  'some.specific.permission'
);
// Returns true automatically for super_admin role
```

### 5. Consistent API Response Format
```typescript
// ✅ Good - consistent success response
return NextResponse.json({
  success: true,
  data: result
});

// ✅ Good - consistent error response
return NextResponse.json(
  { 
    success: false, 
    error: 'Access denied. Required: platform.users.read',
    code: 'PERMISSION_DENIED' // Optional error code
  },
  { status: 403 }
);

// ❌ Bad - inconsistent format
return NextResponse.json(result); // Missing success wrapper
return NextResponse.json({ message: 'Error' }); // Wrong error format
```

## 🔄 Current Implementation Status

### API Endpoints (v1)
- Current: `/api/v1/` endpoints
- All endpoints use permissionsService for authorization
- Standardized response format with `{ success: boolean, data?: any, error?: string }`

### Permission System Evolution
- **Phase 1** (Complete): Basic role-based access control
- **Phase 2** (Current): Advanced RBAC with granular permissions
- **Phase 3** (Planned): Dynamic permissions and delegation

### Migration from Legacy Systems
- **From**: Simple role checking
- **To**: Service-based permission validation with caching
- **Benefits**: 
  - Three-layer caching for performance
  - Super admin bypass for operational efficiency
  - Wildcard permission support for flexibility
  - Graceful Redis degradation for reliability

## 🚀 Future Enhancements

1. **Dynamic Permissions**: Allow creating custom permissions via admin UI
2. **Permission Templates**: Pre-defined permission sets for common roles
3. **Delegation**: Allow users to delegate specific permissions
4. **Time-based Permissions**: Temporary permission grants
5. **Context-aware Permissions**: Permissions based on resource ownership

## 📊 Monitoring & Analytics

The permission system integrates with the monitoring stack:
- Permission check metrics in Prometheus
- Grafana dashboards for access patterns
- Audit logs in centralized logging

## 🔍 Troubleshooting

### Common Issues

1. **"Access Denied" despite having role**
   - Check if role has the specific permission assigned in database
   - Verify permission cache is not stale (try clearing Redis)
   - Ensure user's role is active and properly assigned
   - Check if permission pattern matches exactly (case-sensitive)

2. **Permission service not working**
   - Verify `auth()` session is properly configured
   - Check permissionsService is imported correctly
   - Ensure database connection is working
   - Verify user ID format (UUID vs integer)

3. **Performance issues**
   - Check Redis connection and health
   - Monitor cache hit rate in logs
   - Review permission query complexity
   - Check if three-layer caching is working properly

4. **Cache-related issues**
   - Redis connection failures (service degrades gracefully)
   - Stale permissions after role changes
   - Use cache invalidation: `permissionsService.invalidateUserPermissions(userId)`

### Debug Mode
The permission service includes extensive logging:
```typescript
// Check logs for permission debugging
logger.debug('🔍 Permission check', { 
  userId, 
  permission, 
  hasPermission,
  userPermissions 
});

// Super admin bypass logging
logger.debug('✅ Super admin bypass - full access granted', { userId });

// Cache performance logging
logger.info('✅ Permissions loaded from database', { 
  userId, 
  tenantId,
  rolesCount,
  permissionsCount
});
```

### Testing Permissions
```typescript
// Test permission directly
const result = await permissionsService.hasPermission('user-id', 'platform.users.read');
console.log('Has permission:', result);

// Test admin access
const adminAccess = await permissionsService.canAccessAdmin('user-id');
console.log('Can access admin:', adminAccess);

// Check specific capability
const capability = await permissionsService.hasAdminCapability('user-id', 'canManageUsers');
console.log('Has capability:', capability);
```