# API Migration Guide: 4-Tier Structure

This guide helps developers migrate from the old API structure to the new 4-tier API architecture.

## Overview

The itellico Mono API has been refactored from a flat structure to a hierarchical 4-tier architecture that better reflects the platform's access model and improves organization.

### Old Structure
```
/api/v1/auth/*
/api/v1/users/*
/api/v1/admin/*
/api/v1/categories/*
/api/v1/media/*
etc...
```

### New Structure
```
/api/v1/public/*     - No authentication required
/api/v1/user/*       - Individual user context
/api/v1/account/*    - Account/organization context
/api/v1/tenant/*     - Tenant administration
/api/v1/platform/*   - Platform-wide management
```

## Migration Mapping

### Authentication Endpoints

| Old Endpoint | New Endpoint | Notes |
|-------------|--------------|-------|
| `POST /api/v1/auth/login` | `POST /api/v1/public/auth/login` | No auth required |
| `POST /api/v1/auth/register` | `POST /api/v1/public/auth/register` | No auth required |
| `POST /api/v1/auth/refresh` | `POST /api/v1/public/auth/refresh` | Uses refresh token |
| `POST /api/v1/auth/logout` | `POST /api/v1/user/auth/logout` | Requires auth |
| `POST /api/v1/auth/forgot-password` | `POST /api/v1/public/auth/forgot-password` | No auth required |
| `POST /api/v1/auth/reset-password` | `POST /api/v1/public/auth/reset-password` | No auth required |

### User Management

| Old Endpoint | New Endpoint | Notes |
|-------------|--------------|-------|
| `GET /api/v1/users/me` | `GET /api/v1/user/profile` | Current user profile |
| `PUT /api/v1/users/me` | `PUT /api/v1/user/profile` | Update own profile |
| `GET /api/v1/users` | `GET /api/v1/account/users` | List account users |
| `POST /api/v1/users` | `POST /api/v1/account/users` | Create account user |
| `GET /api/v1/users/:id` | `GET /api/v1/account/users/:uuid` | Get user details |
| `PUT /api/v1/users/:id` | `PUT /api/v1/account/users/:uuid` | Update user |
| `DELETE /api/v1/users/:id` | `DELETE /api/v1/account/users/:uuid` | Delete user |

### Content Management

| Old Endpoint | New Endpoint | Notes |
|-------------|--------------|-------|
| `GET /api/v1/categories` | `GET /api/v1/user/content/categories` | User's categories |
| `POST /api/v1/categories` | `POST /api/v1/user/content/categories` | Create category |
| `GET /api/v1/tags` | `GET /api/v1/user/content/tags` | User's tags |
| `POST /api/v1/tags` | `POST /api/v1/user/content/tags` | Create tag |
| `GET /api/v1/templates` | `GET /api/v1/account/configuration/templates` | Account templates |
| `GET /api/v1/admin/templates` | `GET /api/v1/tenant/content/templates` | Global templates |

### Media Management

| Old Endpoint | New Endpoint | Notes |
|-------------|--------------|-------|
| `GET /api/v1/media` | `GET /api/v1/user/media` | User's media files |
| `POST /api/v1/media/upload` | `POST /api/v1/user/media/upload` | Upload media |
| `GET /api/v1/media/:id` | `GET /api/v1/user/media/:uuid` | Get media details |
| `DELETE /api/v1/media/:id` | `DELETE /api/v1/user/media/:uuid` | Delete media |

### Marketplace Features

| Old Endpoint | New Endpoint | Notes |
|-------------|--------------|-------|
| `GET /api/v1/gigs` | `GET /api/v1/user/marketplace/gigs` | User's gigs |
| `POST /api/v1/gigs` | `POST /api/v1/user/marketplace/gigs` | Create gig |
| `GET /api/v1/jobs` | `GET /api/v1/user/marketplace/jobs` | User's jobs |
| `POST /api/v1/jobs` | `POST /api/v1/user/marketplace/jobs` | Post job |
| `GET /api/v1/conversations` | `GET /api/v1/user/messaging/conversations` | User conversations |
| `POST /api/v1/conversations` | `POST /api/v1/user/messaging/conversations` | Start conversation |

### Business Features

| Old Endpoint | New Endpoint | Notes |
|-------------|--------------|-------|
| `GET /api/v1/workflows` | `GET /api/v1/account/business/workflows` | Account workflows |
| `POST /api/v1/workflows` | `POST /api/v1/account/business/workflows` | Create workflow |
| `GET /api/v1/forms` | `GET /api/v1/account/business/forms` | Account forms |
| `POST /api/v1/forms` | `POST /api/v1/account/business/forms` | Create form |
| `GET /api/v1/integrations` | `GET /api/v1/account/business/integrations` | Account integrations |

### Billing & Subscriptions

| Old Endpoint | New Endpoint | Notes |
|-------------|--------------|-------|
| `GET /api/v1/subscriptions` | `GET /api/v1/account/billing/subscription` | Current subscription |
| `POST /api/v1/subscriptions` | `POST /api/v1/account/billing/subscription` | Create subscription |
| `PUT /api/v1/subscriptions/:id` | `PUT /api/v1/account/billing/subscription` | Update subscription |
| `GET /api/v1/subscriptions/plans` | `GET /api/v1/account/billing/plans` | Available plans |
| `GET /api/v1/subscriptions/invoices` | `GET /api/v1/account/billing/invoices` | Account invoices |

### Admin Routes (Tenant Level)

| Old Endpoint | New Endpoint | Notes |
|-------------|--------------|-------|
| `GET /api/v1/admin/users` | `GET /api/v1/tenant/administration/users` | All tenant users |
| `GET /api/v1/admin/accounts` | `GET /api/v1/tenant/administration/accounts` | All tenant accounts |
| `GET /api/v1/admin/permissions` | `GET /api/v1/tenant/administration/permissions` | Permission management |
| `GET /api/v1/admin/categories` | `GET /api/v1/tenant/content/templates` | Global templates |
| `GET /api/v1/admin/media` | `GET /api/v1/tenant/content/media` | All tenant media |
| `GET /api/v1/admin/monitoring` | `GET /api/v1/tenant/monitoring/health` | Tenant health |

### Platform Routes (Super Admin)

| Old Endpoint | New Endpoint | Notes |
|-------------|--------------|-------|
| N/A | `GET /api/v1/platform/system/tenants` | Manage all tenants |
| N/A | `GET /api/v1/platform/operations/health` | Platform health |
| N/A | `POST /api/v1/platform/operations/maintenance` | Maintenance tasks |

## Code Migration Examples

### Frontend API Client Update

#### Old Implementation
```typescript
// api/users.ts
export const usersAPI = {
  getMe: () => apiClient.get('/api/v1/users/me'),
  updateMe: (data) => apiClient.put('/api/v1/users/me', data),
  getUsers: () => apiClient.get('/api/v1/users'),
  createUser: (data) => apiClient.post('/api/v1/users', data),
}
```

#### New Implementation
```typescript
// api/user.ts
export const userAPI = {
  // User tier - personal context
  profile: {
    get: () => apiClient.get('/api/v1/user/profile'),
    update: (data) => apiClient.put('/api/v1/user/profile', data),
    uploadAvatar: (file) => apiClient.post('/api/v1/user/profile/avatar', file),
  },
  settings: {
    get: () => apiClient.get('/api/v1/user/settings'),
    update: (data) => apiClient.put('/api/v1/user/settings', data),
  },
  content: {
    list: (params) => apiClient.get('/api/v1/user/content', { params }),
    create: (data) => apiClient.post('/api/v1/user/content', data),
  },
}

// api/account.ts
export const accountAPI = {
  // Account tier - organization context
  users: {
    list: (params) => apiClient.get('/api/v1/account/users', { params }),
    create: (data) => apiClient.post('/api/v1/account/users', data),
    get: (uuid) => apiClient.get(`/api/v1/account/users/${uuid}`),
    update: (uuid, data) => apiClient.put(`/api/v1/account/users/${uuid}`, data),
    delete: (uuid) => apiClient.delete(`/api/v1/account/users/${uuid}`),
  },
  billing: {
    getSubscription: () => apiClient.get('/api/v1/account/billing/subscription'),
    updatePayment: (data) => apiClient.put('/api/v1/account/billing/payment-method', data),
  },
}
```

### React Hook Updates

#### Old Hook
```typescript
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiClient.get('/api/v1/users/me'),
  });
}
```

#### New Hook
```typescript
export function useUserProfile() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => apiClient.get('/api/v1/user/profile'),
  });
}

export function useAccountUsers() {
  return useQuery({
    queryKey: ['account', 'users'],
    queryFn: () => apiClient.get('/api/v1/account/users'),
  });
}
```

## Permission Updates

### Old Permission Pattern
```typescript
const canManageUsers = hasPermission('users:manage');
const canViewAdmin = hasPermission('admin:view');
```

### New Permission Pattern
```typescript
// Tier-based permissions
const canManageAccountUsers = hasPermission('account.users.manage');
const canManageTenantUsers = hasPermission('tenant.users.manage');
const canAccessPlatform = hasPermission('platform.system.read');
```

## Best Practices

1. **Use Tier-Appropriate Endpoints**
   - Don't use account endpoints for personal user actions
   - Don't use tenant endpoints for account-specific operations

2. **Update Permission Checks**
   - Replace old permission strings with new tier-based format
   - Ensure UI reflects proper access levels

3. **Handle New Response Formats**
   - All responses now consistently include `success` field
   - Pagination is standardized across all list endpoints

4. **Update Error Handling**
   - Error responses now include tier context
   - Rate limiting varies by tier

## Testing Checklist

- [ ] Authentication flow works with new public endpoints
- [ ] User profile management uses new user tier endpoints
- [ ] Account user management uses account tier endpoints
- [ ] Media uploads work with new endpoints
- [ ] Marketplace features (gigs/jobs) use user tier
- [ ] Business features use account tier
- [ ] Admin panels use tenant tier endpoints
- [ ] Permission checks reflect new structure
- [ ] Error handling works with new format
- [ ] Rate limiting is properly handled

## Rollback Plan

If issues arise during migration:

1. The old endpoints can be temporarily re-enabled by adding legacy route handlers
2. Use API versioning to run both structures in parallel
3. Implement a feature flag to switch between old/new API calls

## Support

For questions or issues during migration:
- Check the Swagger documentation at `/docs`
- Review the detailed API documentation
- Contact the platform team for assistance