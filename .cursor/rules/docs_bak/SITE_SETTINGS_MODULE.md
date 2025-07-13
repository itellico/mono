# Site Settings Module Documentation

## Overview

The Site Settings Module provides a comprehensive hierarchical configuration system for the itellico Mono, supporting global, tenant, and user-level settings with a modern administrative interface. This module enables fine-grained control over platform behavior, appearance, and functionality.

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Frontend Components](#frontend-components)
- [State Management](#state-management)
- [Permission System](#permission-system)
- [Usage Examples](#usage-examples)
- [Configuration](#configuration)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## Architecture

The Site Settings Module follows a three-tier hierarchical architecture:

```
Global Settings (Platform-wide defaults)
    ↓
Tenant Settings (Organization overrides)
    ↓
User Settings (Individual preferences)
```

### Core Components

1. **Database Layer** - PostgreSQL with Prisma ORM
2. **API Layer** - Fastify endpoints with comprehensive validation
3. **State Management** - Zustand + TanStack Query
4. **UI Layer** - React components with shadcn/ui
5. **Permission Layer** - RBAC with role-based access control

## Features

### ✅ Implemented Features

- **Hierarchical Settings Management** - Global → Tenant → User inheritance
- **Administrative Interface** - Full CRUD operations with modern UI
- **Import/Export Functionality** - CSV and JSON support with progress tracking
- **Bulk Operations** - Multi-select delete, export, and management
- **Real-time Updates** - Optimistic UI with automatic synchronization
- **Permission-based Access** - Role-based visibility and editing controls
- **Type Safety** - Full TypeScript implementation with validation
- **Caching Strategy** - Multi-level caching for optimal performance
- **Audit Trail** - Comprehensive logging of all changes

### Settings Categories

The module supports various setting categories:

- **Media Settings** - Upload limits, file types, compression
- **Upload Settings** - File handling, storage configuration
- **Security Settings** - Authentication, authorization policies
- **UI/UX Settings** - Theme, layout, user experience
- **Integration Settings** - Third-party service configurations
- **Performance Settings** - Caching, optimization parameters

## Database Schema

### SiteSettings Table

```sql
CREATE TABLE "SiteSettings" (
    "id" SERIAL PRIMARY KEY,
    "uuid" TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" "settings_category" NOT NULL,
    "scope" "settings_scope" NOT NULL DEFAULT 'global',
    "tenantId" INTEGER REFERENCES "Tenant"("id"),
    "userId" INTEGER REFERENCES "User"("id"),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER REFERENCES "User"("id"),
    "updatedBy" INTEGER REFERENCES "User"("id"),
    
    CONSTRAINT "SiteSettings_key_scope_tenant_user_unique" 
    UNIQUE("key", "scope", "tenantId", "userId")
);
```

### Enums

```sql
CREATE TYPE "settings_category" AS ENUM (
    'media', 'upload', 'security', 'ui', 'integration', 'performance'
);

CREATE TYPE "settings_scope" AS ENUM (
    'global', 'tenant', 'user'
);
```

### Indexes

```sql
CREATE INDEX "SiteSettings_key_idx" ON "SiteSettings"("key");
CREATE INDEX "SiteSettings_category_idx" ON "SiteSettings"("category");
CREATE INDEX "SiteSettings_scope_idx" ON "SiteSettings"("scope");
CREATE INDEX "SiteSettings_tenantId_idx" ON "SiteSettings"("tenantId");
CREATE INDEX "SiteSettings_active_idx" ON "SiteSettings"("isActive");
```

## API Endpoints

### Base URL: `/api/v1/admin/settings`

#### GET `/api/v1/admin/settings`
**Description**: Retrieve all settings with filtering and pagination

**Query Parameters**:
- `category` - Filter by category (`media`, `upload`, etc.)
- `scope` - Filter by scope (`global`, `tenant`, `user`)
- `search` - Search in key or description
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `isActive` - Filter by active status

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "key": "upload.max_file_size",
      "value": 52428800,
      "category": "upload",
      "scope": "global",
      "description": "Maximum file upload size in bytes",
      "isActive": true,
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 26,
    "totalPages": 2
  }
}
```

#### GET `/api/v1/admin/settings/:key`
**Description**: Retrieve a specific setting by key

**Response**:
```json
{
  "data": {
    "id": 1,
    "key": "upload.max_file_size",
    "value": 52428800,
    "category": "upload",
    "scope": "global",
    "description": "Maximum file upload size in bytes",
    "effectiveValue": 52428800,
    "inheritanceChain": ["global"]
  }
}
```

#### PUT `/api/v1/admin/settings/:key`
**Description**: Create or update a setting

**Request Body**:
```json
{
  "value": 104857600,
  "category": "upload",
  "scope": "tenant",
  "description": "Updated max file size for tenant",
  "isActive": true
}
```

#### DELETE `/api/v1/admin/settings/:key`
**Description**: Delete a setting (soft delete)

#### POST `/api/v1/admin/settings/import`
**Description**: Import settings from CSV or JSON

**Request**: Multipart form with file upload

#### GET `/api/v1/admin/settings/export`
**Description**: Export settings in CSV or JSON format

**Query Parameters**:
- `format` - Export format (`csv` or `json`)
- `category` - Filter by category
- `scope` - Filter by scope

### Permission Requirements

All endpoints require authentication and appropriate permissions:

- **Read Operations**: `admin.settings.read` or `settings.read.tenant`
- **Write Operations**: `admin.settings.write` or `settings.write.tenant`
- **Delete Operations**: `admin.settings.delete` or `settings.delete.tenant`
- **Import/Export**: `admin.settings.import` / `admin.settings.export`

## Frontend Components

### Main Components

#### 1. AllSettingsListPanel (`/src/components/admin/settings/AllSettingsListPanel.tsx`)

The primary interface for settings management, built on the AdminListPage pattern.

**Features**:
- Comprehensive data table with sorting and filtering
- Create/Edit dialogs with form validation
- Bulk operations (delete, export)
- Import functionality with progress tracking
- Real-time search and filtering

**Usage**:
```jsx
import { AllSettingsListPanel } from '@/components/admin/settings/AllSettingsListPanel';

<AllSettingsListPanel />
```

#### 2. AdminSettingsOverview (`/src/components/admin/settings/AdminSettingsOverview.tsx`)

Dashboard overview with quick actions and statistics.

#### 3. PermissionGate (`/src/components/reusable/PermissionGate.tsx`)

Security component for role-based access control.

**Usage**:
```jsx
<PermissionGate permissions={['admin.settings.read']}>
  <SettingsComponent />
</PermissionGate>
```

### Integration Points

The settings interface is accessible via:

1. **Admin Settings Tab**: `/admin/settings` → "All Settings" tab
2. **Quick Actions**: Settings overview dashboard
3. **Navigation**: Admin sidebar → Settings

## State Management

### Zustand Store (`/src/stores/admin-settings.store.ts`)

Centralized state management for settings data and UI state.

**Key Features**:
- Settings data caching
- Filter and pagination state
- Bulk operation state
- Import/export progress tracking

**Usage**:
```typescript
import { useAdminSettingsStore } from '@/stores/admin-settings.store';

const {
  settings,
  filters,
  selectedSettings,
  setFilters,
  setSelectedSettings
} = useAdminSettingsStore();
```

### TanStack Query Integration (`/src/hooks/admin/useAdminSettings.ts`)

API data fetching with caching and optimistic updates.

**Available Hooks**:
- `useAdminSettingsList` - Fetch settings with filters
- `useCreateOrUpdateSetting` - Create/update with optimistic UI
- `useDeleteSetting` - Delete with rollback on error
- `useBulkDeleteSettings` - Bulk operations
- `useImportSettings` - Import with progress tracking
- `useExportSettings` - Export functionality

**Usage**:
```typescript
import { useAdminSettingsList, useCreateOrUpdateSetting } from '@/hooks/admin/useAdminSettings';

const { data: settings, isLoading } = useAdminSettingsList(filters);
const createMutation = useCreateOrUpdateSetting();
```

## Permission System

### Role-Based Access Control

The module implements comprehensive permission checking:

#### Admin Roles
- **Super Admin**: Full access to all settings
- **Tenant Admin**: Access to tenant and user scope settings
- **Content Moderator**: Read-only access to specific categories

#### Permission Patterns

**API Permissions** (enforced by backend):
```typescript
'admin.settings.read'
'admin.settings.write'
'admin.settings.delete'
'admin.settings.import'
'admin.settings.export'
```

**Frontend Permissions** (UI visibility):
```typescript
action="read" resource="settings" context={{ scope: 'tenant' }}
action="write" resource="settings" context={{ scope: 'tenant' }}
action="manage" resource="settings" context={{ scope: 'global' }}
```

### PermissionGate Implementation

The enhanced PermissionGate component supports both permission patterns:

```jsx
// API pattern
<PermissionGate permissions={['admin.settings.read']}>
  <SettingsTable />
</PermissionGate>

// Legacy pattern
<PermissionGate action="read" resource="settings" context={{ scope: 'tenant' }}>
  <SettingsTable />
</PermissionGate>
```

## Usage Examples

### 1. Retrieving Settings in Code

```typescript
import { getSettingValue } from '@/lib/hierarchical-settings';

// Get effective value with inheritance
const maxFileSize = await getSettingValue('upload.max_file_size', {
  tenantId: 1,
  userId: 123
});

// Returns: tenant override → global default → hardcoded fallback
```

### 2. Creating a New Setting

```typescript
import { useCreateOrUpdateSetting } from '@/hooks/admin/useAdminSettings';

const createSetting = useCreateOrUpdateSetting();

const handleCreate = async () => {
  await createSetting.mutateAsync({
    key: 'ui.theme_color',
    value: '#3b82f6',
    category: 'ui',
    scope: 'global',
    description: 'Primary theme color for the platform'
  });
};
```

### 3. Bulk Operations

```typescript
import { useBulkDeleteSettings } from '@/hooks/admin/useAdminSettings';

const bulkDelete = useBulkDeleteSettings();

const handleBulkDelete = async (settingIds: number[]) => {
  await bulkDelete.mutateAsync(settingIds);
};
```

### 4. Import/Export

```typescript
import { useImportSettings, useExportSettings } from '@/hooks/admin/useAdminSettings';

// Import
const importSettings = useImportSettings();
const handleImport = (file: File) => {
  importSettings.mutate(file);
};

// Export
const exportSettings = useExportSettings();
const handleExport = () => {
  exportSettings.mutate({ format: 'csv', category: 'upload' });
};
```

## Configuration

### Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mono_platform"

# Caching
REDIS_URL="redis://localhost:6379"
```

### Upload Settings Seeder

Pre-populated settings are created via the seeder:

```bash
npx tsx prisma/seeds/upload-settings.ts
```

This creates 26 essential settings including:
- File upload limits
- Allowed file types
- Image processing settings
- Storage configurations

## Security

### Data Protection

1. **Input Validation**: All API endpoints validate input using Zod schemas
2. **SQL Injection Prevention**: Prisma ORM provides built-in protection
3. **XSS Protection**: JSON values are sanitized before rendering
4. **CSRF Protection**: API includes CSRF token validation

### Access Control

1. **Authentication Required**: All endpoints require valid JWT tokens
2. **Permission Validation**: Role-based access control enforced
3. **Tenant Isolation**: Settings respect multi-tenant boundaries
4. **Audit Logging**: All changes are logged with user attribution

### Best Practices

```typescript
// ✅ Good - Use hierarchical resolution
const setting = await getSettingValue('upload.max_size', { tenantId, userId });

// ❌ Bad - Direct database access
const setting = await prisma.siteSettings.findFirst({ where: { key: 'upload.max_size' } });

// ✅ Good - Use permission gates
<PermissionGate permissions={['admin.settings.write']}>
  <EditButton />
</PermissionGate>

// ❌ Bad - No permission checking
<EditButton />
```

## Troubleshooting

### Common Issues

#### 1. Settings Not Loading

**Symptoms**: Empty settings list or loading errors

**Solutions**:
- Check API server is running on port 3001
- Verify database connection
- Ensure user has proper permissions
- Check browser console for network errors

```bash
# Test API endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/v1/admin/settings
```

#### 2. Permission Denied

**Symptoms**: 403 errors or hidden UI elements

**Solutions**:
- Verify user roles in database
- Check permission assignments
- Confirm PermissionGate configuration

```sql
-- Check user permissions
SELECT u.email, r.name as role, p.name as permission
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.email = 'user@example.com';
```

#### 3. Import/Export Failures

**Symptoms**: File upload errors or malformed exports

**Solutions**:
- Verify file format (CSV headers must match schema)
- Check file size limits
- Ensure proper encoding (UTF-8)

**CSV Format Example**:
```csv
key,value,category,scope,description,isActive
upload.max_file_size,52428800,upload,global,Maximum file upload size in bytes,true
```

#### 4. Cache Issues

**Symptoms**: Stale data or inconsistent values

**Solutions**:
```typescript
// Force refresh TanStack Query cache
queryClient.invalidateQueries(['admin-settings']);

// Clear Zustand store
useAdminSettingsStore.getState().reset();
```

### Debug Mode

Enable debug logging for detailed permission checks:

```jsx
<PermissionGate 
  permissions={['admin.settings.read']} 
  debug={process.env.NODE_ENV === 'development'}
>
  <SettingsComponent />
</PermissionGate>
```

### Performance Monitoring

Check query performance and caching effectiveness:

```typescript
// Monitor TanStack Query cache
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
console.log('Cache state:', queryClient.getQueryCache().getAll());
```

## Best Practices

### 1. Setting Naming Convention

```typescript
// ✅ Good - Hierarchical naming
'upload.image.max_size'
'ui.theme.primary_color'
'security.auth.session_timeout'

// ❌ Bad - Flat naming
'imageMaxSize'
'primaryColor'
'sessionTimeout'
```

### 2. Value Types

```typescript
// ✅ Good - Appropriate JSON types
{ maxSize: 52428800, allowedTypes: ['jpg', 'png'] }

// ❌ Bad - String representations
"52428800,jpg,png"
```

### 3. Error Handling

```typescript
// ✅ Good - Graceful degradation
const maxSize = await getSettingValue('upload.max_size', context) ?? DEFAULT_MAX_SIZE;

// ❌ Bad - Unhandled errors
const maxSize = await getSettingValue('upload.max_size', context);
```

## Migration Guide

### From Legacy Settings

If migrating from an older settings system:

1. **Data Migration**: Use the import functionality to transfer existing settings
2. **Permission Updates**: Ensure users have appropriate `admin.settings.*` permissions
3. **Code Updates**: Replace direct database calls with hierarchical resolution
4. **Testing**: Verify inheritance behavior works as expected

### Version Compatibility

- **Database**: PostgreSQL 12+
- **Node.js**: 18+
- **React**: 18+
- **TypeScript**: 5+

## Contributing

### Adding New Setting Categories

1. Update the `settings_category` enum in the database
2. Add to the category options in the frontend forms
3. Update validation schemas
4. Add appropriate permissions
5. Create migration script if needed

### Extending Functionality

Follow the established patterns:
- Use TanStack Query for API calls
- Implement optimistic updates
- Add comprehensive error handling
- Include permission checks
- Write tests for new features

## Support

For issues and questions:

1. Check this documentation first
2. Review the troubleshooting section
3. Check existing GitHub issues
4. Create a new issue with detailed information

---

**Last Updated**: January 2025  
**Version**: 2.0.0  
**Maintainer**: itellico Mono Development Team