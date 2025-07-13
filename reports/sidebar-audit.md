# Admin Sidebar Audit Report

## Summary
This report identifies outdated, duplicate, or non-existent links in the AdminSidebar component.

## Links to Remove or Update

### 1. Duplicate/Redundant Links
- **`/admin/schemas`** (line 132) - REMOVE
  - Duplicate of `/admin/model-schemas` on line 133
  - The actual route is `/admin/model-schemas`

### 2. Non-Existent Routes
- **`/admin/test-template`** (line 144) - REMOVE
  - Route in sidebar points to non-existent page
  - No corresponding page.tsx file exists
  - Should be removed from navigation

### 3. Potentially Consolidated Routes
- **Platform Settings** (line 156) - KEEP
  - Points to `/admin/settings` which exists
  - Consolidated platform configuration functionality

## Links That Are Correctly Configured

All other links in the sidebar point to existing routes:
- ✅ `/admin` - Dashboard
- ✅ `/admin/users` - User Management
- ✅ `/admin/tenants` - Tenant Management
- ✅ `/messages` - Messages (NEW)
- ✅ `/admin/jobs` - Job Management (NEW)
- ✅ `/admin/workflows/manage` - Workflows
- ✅ `/admin/integrations` - Integrations
- ✅ `/admin/llm-integrations` - LLM Integrations
- ✅ `/admin/subscriptions` - Subscriptions
- ✅ `/admin/categories` - Categories
- ✅ `/admin/tags` - Tags
- ✅ `/admin/model-schemas` - Model Schemas
- ✅ `/admin/option-sets` - Option Sets
- ✅ `/admin/entity-metadata` - Entity Metadata
- ✅ `/admin/form-builder` - Form Builder
- ✅ `/admin/zone-editor` - Zone Editor
- ✅ `/admin/zones` - Saved Zones
- ✅ `/admin/industry-templates` - Industry Templates (ENHANCED)
- ✅ `/admin/industry-content` - Industry Content (NEW)
- ✅ `/admin/build-system` - Build System (NEW)
- ✅ `/admin/search` - Search Management (NEW)
- ✅ `/admin/saved-searches` - Saved Searches (NEW)
- ✅ `/admin/translations` - Translations
- ✅ `/admin/email` - Email System
- ✅ `/admin/modules` - Modules
- ✅ `/admin/backup` - Backup Management
- ✅ `/admin/import-export` - Import/Export (NEW)
- ✅ `/admin/audit` - Audit System
- ✅ `/admin/monitoring` - Monitoring (NEW)
- ✅ `/admin/permissions` - Permissions
- ✅ `/admin/dev` - Dev Tools
- ✅ `/docs` - Documentation
- ✅ `/admin/preferences` - Preferences
- ✅ `/admin/settings` - Platform Settings

## Routes That Exist But Are Not in Sidebar

The following admin routes exist but are not linked in the sidebar:
- `/admin/applications` - Application management
- `/admin/platform-users` - Platform user management (separate from regular users)
- `/admin/email-templates` - Email template management
- `/admin/queue` - Queue management
- `/admin/maintenance` - Maintenance tools
- `/admin/media-review` - Media review system
- `/admin/tenant-data-management` - Tenant data management
- `/admin/schema-seeder` - Schema seeding tools
- `/admin/platform-integrations` - Platform-level integrations
- `/admin/platform-settings` - Platform settings (might be duplicate of /admin/settings)
- `/admin/platform-config` - Platform configuration (commented out in sidebar)

## Recommendations

1. **Immediate Action Required:**
   - Remove duplicate `/admin/schemas` link (line 132)

2. **Consider Adding to Sidebar:**
   - `/admin/platform-users` - Important for platform user management
   - `/admin/email-templates` - Useful for email template configuration
   - `/admin/queue` - Queue monitoring and management
   - `/admin/tenant-data-management` - Data management tools

3. **Clarify Purpose:**
   - Determine if `/admin/platform-settings` and `/admin/settings` serve different purposes
   - If they're the same, remove one route and consolidate

## Code Changes Required

In `/apps/web/src/components/admin/AdminSidebar.tsx`:

```typescript
// Remove line 132 (duplicate schemas link):
{ name: t('navigation.schemas'), href: '/admin/schemas', icon: 'Layers', requiresPath: '/admin/model-schemas' },

// Remove line 144 (non-existent test-template):
{ name: t('navigation.templateTester'), href: '/admin/test-template', icon: 'Code', requiresPath: '/admin/test-template' },
```

These are the required changes to remove outdated links.