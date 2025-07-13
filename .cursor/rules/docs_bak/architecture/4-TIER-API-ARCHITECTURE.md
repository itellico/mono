# 4-Tier API Architecture

## Overview

The itellico Mono API follows a strict 4-tier hierarchical architecture that mirrors the business structure:

```
Platform → Tenant → Account → User
```

## API URL Structure

All API endpoints follow this pattern:
```
/api/v1/{tier}/{resource}/{action}
```

Where `tier` is one of:
- `public` - No authentication required
- `user` - Individual user operations
- `account` - Account/business unit management
- `tenant` - Tenant administration
- `platform` - System-wide operations

## Tier Definitions

### 1. Public Tier (`/api/v1/public/*`)
**Authentication**: None required
**Purpose**: Public-facing endpoints accessible to anyone

**Endpoints**:
- `/api/v1/public/auth/*` - Authentication (login, register, forgot password)
- `/api/v1/public/health/*` - Health checks and system status

### 2. User Tier (`/api/v1/user/*`)
**Authentication**: Required (any authenticated user)
**Purpose**: Individual user operations on their own data

**Endpoints**:
- `/api/v1/user/profile` - User's own profile management
- `/api/v1/user/settings` - Personal preferences and settings
- `/api/v1/user/content` - User's own content
- `/api/v1/user/media` - User's media uploads
- `/api/v1/user/marketplace` - User's marketplace activities
- `/api/v1/user/messaging` - User's messages
- `/api/v1/user/activity` - User's activity history
- `/api/v1/user/search` - User-scoped search

### 3. Account Tier (`/api/v1/account/*`)
**Authentication**: Account admin role required
**Purpose**: Manage resources within a business unit/account

**Endpoints**:
- `/api/v1/account/users` - Manage users in the account
- `/api/v1/account/business` - Business settings and features
- `/api/v1/account/billing` - Billing and subscriptions
- `/api/v1/account/configuration` - Account-wide settings
- `/api/v1/account/analytics` - Account-level analytics

### 4. Tenant Tier (`/api/v1/tenant/*`)
**Authentication**: Tenant admin role required
**Purpose**: Administer all resources within a tenant

**Endpoints**:
- `/api/v1/tenant/accounts` - Manage all accounts
- `/api/v1/tenant/users` - Administer all users
- `/api/v1/tenant/permissions` - Role and permission management
- `/api/v1/tenant/content` - Content templates and types
- `/api/v1/tenant/data` - Schemas and option sets
- `/api/v1/tenant/monitoring` - Tenant-wide monitoring

### 5. Platform Tier (`/api/v1/platform/*`)
**Authentication**: Super admin role required
**Purpose**: System-wide operations across all tenants

**Endpoints**:
- `/api/v1/platform/tenants` - Manage all tenants
- `/api/v1/platform/operations` - System maintenance

## Swagger/OpenAPI Tags

Each endpoint uses a tag following the pattern `{tier}.{resource}`:

```typescript
fastify.get('/profile', {
  schema: {
    tags: ['user.profile'], // Note the dot notation
    summary: 'Get user profile',
    // ...
  }
})
```

### Tag Naming Convention

| Tag | Display Name | Description |
|-----|--------------|-------------|
| `public.auth` | 🔓 Authentication | Login, register, and manage authentication |
| `public.health` | 🏥 Health Check | System health and status monitoring |
| `user.profile` | 👤 User Profile | Manage your profile information |
| `user.settings` | ⚙️ User Settings | Personal preferences and account settings |
| `user.content` | 📝 My Content | Create and manage your content |
| `user.media` | 🖼️ My Media | Upload and manage media files |
| `user.marketplace` | 🛍️ Marketplace | Browse, buy, and sell in the marketplace |
| `user.messaging` | 💬 Messages | Send and receive messages |
| `user.activity` | 📊 Activity Feed | Track your activities and history |
| `user.search` | 🔍 Search | Search across the platform |
| `account.users` | 👥 Team Management | Manage users in your account |
| `account.business` | 🏢 Business Features | Configure business settings |
| `account.billing` | 💳 Billing & Subscriptions | Manage payments |
| `account.configuration` | 🔧 Account Configuration | Account-wide settings |
| `account.analytics` | 📈 Account Analytics | View metrics and insights |
| `tenant.accounts` | 🏢 Tenant Accounts | Manage all accounts |
| `tenant.users` | 👥 Tenant Users | Administer all users |
| `tenant.permissions` | 🔐 Access Control | Manage roles and permissions |
| `tenant.content` | 📚 Content Administration | Manage templates |
| `tenant.data` | 🗄️ Data Configuration | Configure schemas |
| `tenant.monitoring` | 📊 Tenant Monitoring | Monitor health and usage |
| `platform.tenants` | 🌐 Platform Tenants | Manage all tenants |
| `platform.operations` | 🔧 Platform Operations | System maintenance |

## Permission Naming

Permissions follow the same tier structure:
```
{tier}.{resource}.{action}
```

Examples:
- `user.profile.read` - Read own profile
- `account.users.create` - Create users in account
- `tenant.permissions.manage` - Manage all permissions in tenant
- `platform.tenants.delete` - Delete any tenant

## Response Format

All endpoints return consistent response formats:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "ErrorType",
  "message": "Human readable message",
  "details": {
    // Optional error details
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

## Implementation Example

Here's how to implement a new endpoint following the 4-tier structure:

```typescript
// File: /apps/api/src/routes/v1/account/analytics/revenue/index.ts

import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';

export const accountRevenueRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/summary', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('account.analytics.read')
    ],
    schema: {
      tags: ['account.analytics'], // Use dot notation
      summary: 'Get revenue summary',
      description: 'Get revenue summary for the account',
      querystring: Type.Object({
        startDate: Type.String({ format: 'date' }),
        endDate: Type.String({ format: 'date' })
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            totalRevenue: Type.Number(),
            periodGrowth: Type.Number(),
            topProducts: Type.Array(Type.Object({
              id: Type.String(),
              name: Type.String(),
              revenue: Type.Number()
            }))
          })
        })
      }
    },
    async handler(request, reply) {
      const { accountId } = request.user!;
      const { startDate, endDate } = request.query;
      
      // Implementation here
      
      return {
        success: true,
        data: {
          totalRevenue: 50000,
          periodGrowth: 15.5,
          topProducts: []
        }
      };
    }
  });
};
```

## Benefits of 4-Tier Architecture

1. **Clear Access Control**: Each tier has specific permission requirements
2. **Scalability**: Different tiers can be scaled independently
3. **Maintainability**: Clear separation of concerns
4. **Self-Documenting**: URLs indicate the scope of operation
5. **Security**: Natural security boundaries between tiers
6. **Consistency**: Predictable patterns across the entire API

## Migration from Legacy Endpoints

Legacy endpoints like `/api/v1/auth/*` are maintained for backward compatibility but should be migrated to the new structure:

| Legacy Endpoint | New 4-Tier Endpoint |
|----------------|---------------------|
| `/api/v1/auth/login` | `/api/v1/public/auth/login` |
| `/api/v1/users/me` | `/api/v1/user/profile` |
| `/api/v1/admin/users` | `/api/v1/tenant/users` |

## Testing

Use the test script to verify endpoints:
```bash
cd apps/api && tsx test-4tier-endpoints.ts
```

## Documentation

API documentation is automatically generated and available at:
- Development: http://localhost:3001/docs
- Production: https://api.monoplatform.com/docs