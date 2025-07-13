# API Reorganization - Detailed Implementation Plan

## Phase 1: Directory Structure Creation

### Create New Directory Structure
```bash
apps/api/src/routes/v1/
├── public/
│   ├── auth/
│   │   └── index.ts
│   ├── health/
│   │   └── index.ts
│   └── index.ts
├── user/
│   ├── profile/
│   │   └── index.ts
│   ├── settings/
│   │   ├── preferences/
│   │   │   └── index.ts
│   │   ├── notifications/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── content/
│   │   ├── categories/
│   │   │   └── index.ts
│   │   ├── tags/
│   │   │   └── index.ts
│   │   ├── templates/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── media/
│   │   ├── uploads/
│   │   │   └── index.ts
│   │   ├── artwork/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── marketplace/
│   │   ├── jobs/
│   │   │   └── index.ts
│   │   ├── gigs/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── messaging/
│   │   ├── conversations/
│   │   │   └── index.ts
│   │   ├── emails/
│   │   │   └── index.ts
│   │   ├── notifications/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── activity/
│   │   ├── changes/
│   │   │   └── index.ts
│   │   ├── audit/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── search/
│   │   ├── saved/
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
├── account/
│   ├── users/
│   │   ├── management/
│   │   │   └── index.ts
│   │   ├── invitations/
│   │   │   └── index.ts
│   │   ├── permissions/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── business/
│   │   ├── forms/
│   │   │   └── index.ts
│   │   ├── workflows/
│   │   │   └── index.ts
│   │   ├── integrations/
│   │   │   └── index.ts
│   │   ├── webhooks/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── ai/
│   │   ├── llm/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── billing/
│   │   ├── subscriptions/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── configuration/
│   │   ├── settings/
│   │   │   └── index.ts
│   │   ├── features/
│   │   │   └── index.ts
│   │   ├── templates/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── analytics/
│   │   ├── reports/
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
├── tenant/
│   ├── administration/
│   │   ├── settings/
│   │   │   └── index.ts
│   │   ├── users/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── content/
│   │   ├── categories/
│   │   │   └── index.ts
│   │   ├── tags/
│   │   │   └── index.ts
│   │   ├── moderation/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── data/
│   │   ├── schemas/
│   │   │   └── index.ts
│   │   ├── option-sets/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── monitoring/
│   │   ├── audit/
│   │   │   └── index.ts
│   │   ├── analytics/
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
└── platform/
    ├── system/
    │   ├── tenants/
    │   │   └── index.ts
    │   ├── users/
    │   │   └── index.ts
    │   ├── settings/
    │   │   └── index.ts
    │   └── index.ts
    ├── operations/
    │   ├── emergency/
    │   │   └── index.ts
    │   ├── queue/
    │   │   └── index.ts
    │   ├── monitoring/
    │   │   └── index.ts
    │   └── index.ts
    ├── configuration/
    │   ├── translations/
    │   │   ├── languages/
    │   │   │   └── index.ts
    │   │   └── index.ts
    │   └── index.ts
    └── index.ts
```

## Phase 2: Route Mappings by Tier

### 1. PUBLIC TIER Routes
```typescript
// /api/v1/public/auth/index.ts
- POST /api/v1/public/auth/login
- POST /api/v1/public/auth/register
- POST /api/v1/public/auth/refresh
- POST /api/v1/public/auth/forgot-password
- POST /api/v1/public/auth/reset-password
- POST /api/v1/public/auth/verify-email

// /api/v1/public/health/index.ts
- GET /api/v1/public/health
- GET /api/v1/public/health/ready
- GET /api/v1/public/health/live
```

### 2. USER TIER Routes
```typescript
// Profile Management
- GET    /api/v1/user/profile
- PUT    /api/v1/user/profile
- POST   /api/v1/user/profile/avatar
- DELETE /api/v1/user/profile/avatar

// Settings
- GET    /api/v1/user/settings/preferences
- PUT    /api/v1/user/settings/preferences
- GET    /api/v1/user/settings/notifications
- PUT    /api/v1/user/settings/notifications

// Content
- GET    /api/v1/user/content/categories
- GET    /api/v1/user/content/categories/:uuid
- GET    /api/v1/user/content/tags
- GET    /api/v1/user/content/templates
- GET    /api/v1/user/content/templates/:uuid

// Media
- POST   /api/v1/user/media/upload
- GET    /api/v1/user/media
- GET    /api/v1/user/media/:uuid
- DELETE /api/v1/user/media/:uuid
- GET    /api/v1/user/artwork
- POST   /api/v1/user/artwork

// Marketplace
- GET    /api/v1/user/marketplace/jobs
- GET    /api/v1/user/marketplace/jobs/:uuid
- POST   /api/v1/user/marketplace/jobs/:uuid/apply
- GET    /api/v1/user/marketplace/gigs
- GET    /api/v1/user/marketplace/gigs/:uuid
- POST   /api/v1/user/marketplace/gigs/:uuid/book

// Messaging
- GET    /api/v1/user/messaging/conversations
- GET    /api/v1/user/messaging/conversations/:uuid
- POST   /api/v1/user/messaging/conversations
- POST   /api/v1/user/messaging/conversations/:uuid/messages
- GET    /api/v1/user/messaging/notifications
- PUT    /api/v1/user/messaging/notifications/:uuid/read

// Activity
- GET    /api/v1/user/activity/changes
- GET    /api/v1/user/activity/audit

// Search
- POST   /api/v1/user/search
- GET    /api/v1/user/search/saved
- POST   /api/v1/user/search/saved
```

### 3. ACCOUNT TIER Routes
```typescript
// User Management
- GET    /api/v1/account/users
- POST   /api/v1/account/users
- GET    /api/v1/account/users/:uuid
- PUT    /api/v1/account/users/:uuid
- DELETE /api/v1/account/users/:uuid
- GET    /api/v1/account/users/invitations
- POST   /api/v1/account/users/invitations
- GET    /api/v1/account/users/permissions
- PUT    /api/v1/account/users/:uuid/permissions

// Business Features
- GET    /api/v1/account/business/forms
- POST   /api/v1/account/business/forms
- GET    /api/v1/account/business/workflows
- POST   /api/v1/account/business/workflows
- POST   /api/v1/account/business/workflows/:uuid/execute
- GET    /api/v1/account/business/integrations
- POST   /api/v1/account/business/integrations
- GET    /api/v1/account/business/webhooks
- POST   /api/v1/account/business/webhooks

// AI Features
- POST   /api/v1/account/ai/llm/execute
- GET    /api/v1/account/ai/llm/providers
- GET    /api/v1/account/ai/llm/usage

// Billing
- GET    /api/v1/account/billing/subscriptions
- POST   /api/v1/account/billing/subscriptions
- PUT    /api/v1/account/billing/subscriptions/:uuid

// Configuration
- GET    /api/v1/account/configuration/settings
- PUT    /api/v1/account/configuration/settings
- GET    /api/v1/account/configuration/features
- PUT    /api/v1/account/configuration/features
- GET    /api/v1/account/configuration/templates
- POST   /api/v1/account/configuration/templates

// Analytics
- GET    /api/v1/account/analytics
- GET    /api/v1/account/analytics/reports
- POST   /api/v1/account/analytics/reports
```

### 4. TENANT TIER Routes
```typescript
// Administration
- GET    /api/v1/tenant/administration/settings
- PUT    /api/v1/tenant/administration/settings
- GET    /api/v1/tenant/administration/users
- GET    /api/v1/tenant/administration/users/stats

// Content Management
- GET    /api/v1/tenant/content/categories
- POST   /api/v1/tenant/content/categories
- PUT    /api/v1/tenant/content/categories/:uuid
- DELETE /api/v1/tenant/content/categories/:uuid
- GET    /api/v1/tenant/content/tags
- POST   /api/v1/tenant/content/tags
- GET    /api/v1/tenant/content/moderation
- POST   /api/v1/tenant/content/moderation/actions

// Data Configuration
- GET    /api/v1/tenant/data/schemas
- POST   /api/v1/tenant/data/schemas
- PUT    /api/v1/tenant/data/schemas/:uuid
- GET    /api/v1/tenant/data/option-sets
- POST   /api/v1/tenant/data/option-sets

// Monitoring
- GET    /api/v1/tenant/monitoring/audit
- GET    /api/v1/tenant/monitoring/audit/export
- GET    /api/v1/tenant/monitoring/analytics
```

### 5. PLATFORM TIER Routes
```typescript
// System Management
- GET    /api/v1/platform/system/tenants
- POST   /api/v1/platform/system/tenants
- PUT    /api/v1/platform/system/tenants/:uuid
- DELETE /api/v1/platform/system/tenants/:uuid
- GET    /api/v1/platform/system/users
- POST   /api/v1/platform/system/users
- GET    /api/v1/platform/system/settings
- PUT    /api/v1/platform/system/settings

// Operations
- POST   /api/v1/platform/operations/emergency/shutdown
- POST   /api/v1/platform/operations/emergency/recovery
- GET    /api/v1/platform/operations/queue
- POST   /api/v1/platform/operations/queue/:jobId/retry
- GET    /api/v1/platform/operations/monitoring
- GET    /api/v1/platform/operations/monitoring/metrics

// Configuration
- GET    /api/v1/platform/configuration/translations
- POST   /api/v1/platform/configuration/translations
- GET    /api/v1/platform/configuration/translations/languages
- POST   /api/v1/platform/configuration/translations/languages
```

## Phase 3: Permission Updates

### Permission Naming Convention
```typescript
// Format: tier.resource.action
// Examples:
user.profile.read
user.profile.update
account.users.create
account.users.delete
tenant.categories.manage
platform.tenants.create
```

### Permission Hierarchy
```typescript
// Higher tiers include lower tier permissions
platform.* > tenant.* > account.* > user.*

// Example: platform.users.read includes:
// - tenant.users.read
// - account.users.read
// - user.profile.read
```

## Phase 4: Swagger Documentation Update

### Tag Organization
```typescript
export const swaggerTags = [
  // Public
  { name: 'public.auth', description: '🌐 Authentication - Login, registration, password reset' },
  { name: 'public.health', description: '🌐 Health Checks - System status' },
  
  // User
  { name: 'user.profile', description: '👤 Profile - Personal profile management' },
  { name: 'user.settings', description: '👤 Settings - User preferences' },
  { name: 'user.content', description: '👤 Content - Categories, tags, templates' },
  { name: 'user.media', description: '👤 Media - File uploads and management' },
  { name: 'user.marketplace', description: '👤 Marketplace - Jobs and gigs' },
  { name: 'user.messaging', description: '👤 Messaging - Conversations and notifications' },
  { name: 'user.activity', description: '👤 Activity - Changes and audit logs' },
  { name: 'user.search', description: '👤 Search - Search and saved searches' },
  
  // Account
  { name: 'account.users', description: '🏪 Users - Account user management' },
  { name: 'account.business', description: '🏪 Business - Forms, workflows, integrations' },
  { name: 'account.ai', description: '🏪 AI - Language models and AI features' },
  { name: 'account.billing', description: '🏪 Billing - Subscriptions and payments' },
  { name: 'account.configuration', description: '🏪 Configuration - Account settings' },
  { name: 'account.analytics', description: '🏪 Analytics - Account reports' },
  
  // Tenant
  { name: 'tenant.administration', description: '🏢 Administration - Tenant management' },
  { name: 'tenant.content', description: '🏢 Content - Cross-account content management' },
  { name: 'tenant.data', description: '🏢 Data - Schemas and option sets' },
  { name: 'tenant.monitoring', description: '🏢 Monitoring - Audit and analytics' },
  
  // Platform
  { name: 'platform.system', description: '🌍 System - Tenants and global users' },
  { name: 'platform.operations', description: '🌍 Operations - Emergency and queue' },
  { name: 'platform.configuration', description: '🌍 Configuration - Global settings' },
];
```

## Phase 5: Frontend Updates

### API Client Update
```typescript
// Update base URLs by tier
const API_TIERS = {
  public: '/api/v1/public',
  user: '/api/v1/user',
  account: '/api/v1/account',
  tenant: '/api/v1/tenant',
  platform: '/api/v1/platform',
};

// Helper function to build URLs
function apiUrl(tier: keyof typeof API_TIERS, path: string) {
  return `${API_TIERS[tier]}${path}`;
}
```

### Migration Script
```typescript
// Script to update all API calls in the frontend
const urlMappings = {
  '/api/v1/auth/login': apiUrl('public', '/auth/login'),
  '/api/v1/categories': apiUrl('user', '/content/categories'),
  '/api/v1/admin/users': apiUrl('account', '/users'),
  // ... etc
};
```

## Implementation Order

1. **Week 1**: Create directory structure and public tier
2. **Week 2**: Implement user tier endpoints
3. **Week 3**: Implement account tier endpoints
4. **Week 4**: Implement tenant tier endpoints
5. **Week 5**: Implement platform tier endpoints
6. **Week 6**: Update frontend and testing
7. **Week 7**: Documentation and migration guides
8. **Week 8**: Deprecation notices and cleanup