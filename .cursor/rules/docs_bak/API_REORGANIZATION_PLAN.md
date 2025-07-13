# API Reorganization Plan - 4-Tier Architecture

## Overview
Complete restructuring of API endpoints to follow the 4-tier hierarchy with proper separation and clear access boundaries.

## 1. Public Tier (`/api/v1/public/*`)
**No authentication required**

### Current → New Mapping
```
/api/v1/auth/login           → /api/v1/public/auth/login
/api/v1/auth/register        → /api/v1/public/auth/register
/api/v1/auth/forgot-password → /api/v1/public/auth/forgot-password
/api/v1/health               → /api/v1/public/health
/api/v1/health/ready         → /api/v1/public/health/ready
```

## 2. User Tier (`/api/v1/user/*`)
**Any authenticated user within their account**

### Current → New Mapping
```
# Profile & Settings
/api/v1/user-profiles/me     → /api/v1/user/profile
/api/v1/user-profiles/:uuid  → /api/v1/user/profile/:uuid
/api/v1/users/preferences    → /api/v1/user/settings/preferences
/api/v1/users/notifications  → /api/v1/user/settings/notifications

# Content & Discovery
/api/v1/categories           → /api/v1/user/categories
/api/v1/tags                 → /api/v1/user/tags
/api/v1/search               → /api/v1/user/search
/api/v1/saved-searches       → /api/v1/user/saved-searches
/api/v1/templates            → /api/v1/user/templates

# Media & Files
/api/v1/media                → /api/v1/user/media
/api/v1/artwork              → /api/v1/user/artwork

# Marketplace
/api/v1/jobs                 → /api/v1/user/jobs
/api/v1/gigs                 → /api/v1/user/gigs

# Communication
/api/v1/conversations        → /api/v1/user/messages/conversations
/api/v1/emails               → /api/v1/user/messages/emails
/api/v1/notifications        → /api/v1/user/notifications

# Activity & History
/api/v1/changes              → /api/v1/user/activity/changes
/api/v1/audit/my-activity    → /api/v1/user/activity/audit
```

## 3. Account Tier (`/api/v1/account/*`)
**Account owners and administrators**

### Current → New Mapping
```
# Account Management
/api/v1/admin/users          → /api/v1/account/users (account-scoped)
/api/v1/invitations          → /api/v1/account/invitations
/api/v1/admin/permissions    → /api/v1/account/permissions

# Business Features
/api/v1/forms                → /api/v1/account/forms
/api/v1/workflows            → /api/v1/account/workflows
/api/v1/integrations         → /api/v1/account/integrations
/api/v1/webhooks             → /api/v1/account/webhooks
/api/v1/llm                  → /api/v1/account/ai/llm

# Account Configuration
/api/v1/subscriptions        → /api/v1/account/billing/subscriptions
/api/v1/industry-templates   → /api/v1/account/templates
/api/v1/feature-sets         → /api/v1/account/features

# Analytics & Reporting
/api/v1/admin/analytics      → /api/v1/account/analytics
/api/v1/admin/reports        → /api/v1/account/reports
```

## 4. Tenant Tier (`/api/v1/tenant/*`)
**Tenant administrators managing across accounts**

### Current → New Mapping
```
# Tenant Administration
/api/v1/admin/tenants/:id/settings → /api/v1/tenant/settings
/api/v1/admin/tenants/:id/users    → /api/v1/tenant/users
/api/v1/admin/categories           → /api/v1/tenant/categories
/api/v1/admin/tags                 → /api/v1/tenant/tags

# Content & Data Management
/api/v1/model-schemas              → /api/v1/tenant/schemas
/api/v1/option-sets                → /api/v1/tenant/option-sets
/api/v1/admin/moderation           → /api/v1/tenant/moderation

# Tenant Analytics & Audit
/api/v1/audit                      → /api/v1/tenant/audit
/api/v1/admin/audit                → /api/v1/tenant/audit/detailed
/api/v1/monitoring                 → /api/v1/tenant/monitoring
```

## 5. Platform Tier (`/api/v1/platform/*`)
**Super administrators only**

### Current → New Mapping
```
# Platform Management
/api/v1/admin/tenants              → /api/v1/platform/tenants
/api/v1/admin/platform-users       → /api/v1/platform/users
/api/v1/admin/settings             → /api/v1/platform/settings

# System Administration
/api/v1/admin/emergency            → /api/v1/platform/emergency
/api/v1/admin/queue                → /api/v1/platform/queue
/api/v1/monitoring/system          → /api/v1/platform/monitoring

# Global Configuration
/api/v1/admin/translations         → /api/v1/platform/translations
/api/v1/admin/translations/languages → /api/v1/platform/translations/languages
```

## Implementation Strategy

### Phase 1: Create New Route Structure
1. Create new directory structure:
   ```
   apps/api/src/routes/v1/
   ├── public/
   │   ├── auth/
   │   └── health/
   ├── user/
   │   ├── profile/
   │   ├── settings/
   │   ├── messages/
   │   ├── activity/
   │   └── marketplace/
   ├── account/
   │   ├── users/
   │   ├── billing/
   │   ├── ai/
   │   └── analytics/
   ├── tenant/
   │   ├── settings/
   │   ├── users/
   │   ├── audit/
   │   └── schemas/
   └── platform/
       ├── tenants/
       ├── users/
       ├── monitoring/
       └── settings/
   ```

2. Copy and adapt existing routes to new structure
3. Update all permission checks to match tier requirements
4. Remove old routes after verification

### Phase 2: Update Frontend API Calls
1. Create migration utility to update all API endpoints
2. Update API client configuration
3. Test all frontend features

### Phase 3: Update Documentation
1. Update Swagger tags and descriptions
2. Update API documentation
3. Create migration guide for API consumers

## Code Duplication Strategy

### Expected Duplications:
1. **User Management** - Different scopes at each tier:
   - `/api/v1/user/profile` - Individual user's own profile
   - `/api/v1/account/users` - Users within an account
   - `/api/v1/tenant/users` - Users across all accounts in tenant
   - `/api/v1/platform/users` - All users in the platform

2. **Settings** - Different configuration levels:
   - `/api/v1/user/settings` - Personal preferences
   - `/api/v1/account/settings` - Account configuration
   - `/api/v1/tenant/settings` - Tenant-wide settings
   - `/api/v1/platform/settings` - Global platform settings

3. **Analytics** - Different data scopes:
   - `/api/v1/user/activity` - Personal activity
   - `/api/v1/account/analytics` - Account metrics
   - `/api/v1/tenant/analytics` - Tenant-wide analytics
   - `/api/v1/platform/monitoring` - System metrics

### Benefits of Duplication:
- Clear separation of concerns
- Tier-specific optimizations
- Independent evolution
- Better security boundaries
- Easier permission management

## Migration Checklist

- [ ] Create new route structure
- [ ] Implement public tier endpoints
- [ ] Implement user tier endpoints
- [ ] Implement account tier endpoints
- [ ] Implement tenant tier endpoints
- [ ] Implement platform tier endpoints
- [ ] Update all frontend API calls
- [ ] Update Swagger documentation
- [ ] Update permission checks
- [ ] Test all endpoints
- [ ] Create deprecation notices for old endpoints
- [ ] Remove old endpoints after migration period