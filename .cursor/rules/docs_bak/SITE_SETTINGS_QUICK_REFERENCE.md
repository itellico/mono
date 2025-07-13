# Site Settings Quick Reference

## 🚀 Quick Start

### Access the Settings Interface
```bash
# 1. Navigate to Admin Settings
http://localhost:3000/admin/settings

# 2. Click "All Settings" tab
# 3. Use create/edit/delete operations
```

### Common API Calls
```bash
# Get all settings
curl -H "Authorization: Bearer TOKEN" http://localhost:3001/api/v1/admin/settings

# Create a setting
curl -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN" \
  -d '{"value": 50000000, "category": "upload", "scope": "global"}' \
  http://localhost:3001/api/v1/admin/settings/upload.max_file_size
```

## 📋 Essential Code Patterns

### 1. Get Setting Value (with inheritance)
```typescript
import { getSettingValue } from '@/lib/hierarchical-settings';

const maxSize = await getSettingValue('upload.max_file_size', {
  tenantId: 1,
  userId: 123
}) ?? 52428800; // fallback
```

### 2. Use Settings in React Components
```typescript
import { useAdminSettingsList } from '@/hooks/admin/useAdminSettings';

function MyComponent() {
  const { data: settings, isLoading } = useAdminSettingsList({
    category: 'upload'
  });
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {settings?.map(setting => (
        <div key={setting.id}>{setting.key}: {setting.value}</div>
      ))}
    </div>
  );
}
```

### 3. Create/Update Settings
```typescript
import { useCreateOrUpdateSetting } from '@/hooks/admin/useAdminSettings';

function SettingsForm() {
  const createSetting = useCreateOrUpdateSetting();
  
  const handleSubmit = async (data) => {
    await createSetting.mutateAsync({
      key: 'ui.theme_color',
      value: '#3b82f6',
      category: 'ui',
      scope: 'global',
      description: 'Primary theme color'
    });
  };
}
```

### 4. Permission-Protected UI
```tsx
import { PermissionGate } from '@/components/reusable/PermissionGate';

<PermissionGate permissions={['admin.settings.write']}>
  <CreateSettingButton />
</PermissionGate>

{/* Or legacy pattern */}
<PermissionGate action="write" resource="settings" context={{ scope: 'global' }}>
  <EditSettingForm />
</PermissionGate>
```

## 🗄️ Database Schema Quick Reference

### Settings Table Structure
```sql
key              TEXT        -- 'upload.max_file_size'
value            JSONB       -- 52428800 or {"max": 50, "types": ["jpg"]}
category         ENUM        -- 'media', 'upload', 'security', 'ui', 'integration', 'performance'
scope            ENUM        -- 'global', 'tenant', 'user'
tenantId         INTEGER     -- NULL for global, tenant ID for tenant scope
userId           INTEGER     -- NULL unless user scope
isActive         BOOLEAN     -- TRUE/FALSE
description      TEXT        -- Human-readable description
```

### Common Queries
```sql
-- Get all upload settings
SELECT * FROM "SiteSettings" WHERE category = 'upload' AND "isActive" = true;

-- Get effective value for a tenant (with inheritance)
SELECT * FROM "SiteSettings" 
WHERE key = 'upload.max_file_size' 
  AND (scope = 'global' OR (scope = 'tenant' AND "tenantId" = 1))
  AND "isActive" = true
ORDER BY scope DESC;
```

## 🔐 Permission Matrix

| Action | Required Permission | Scope | Description |
|--------|-------------------|--------|-------------|
| Read | `admin.settings.read` | Any | View settings |
| Create | `admin.settings.write` | Global/Tenant | Create new settings |
| Update | `admin.settings.write` | Global/Tenant | Modify existing settings |
| Delete | `admin.settings.delete` | Global/Tenant | Remove settings |
| Import | `admin.settings.import` | Global | Import from file |
| Export | `admin.settings.export` | Any | Export to file |

### Role Access Levels
- **Super Admin**: All settings (global, tenant, user)
- **Tenant Admin**: Tenant and user settings only
- **Content Moderator**: Read-only access to specific categories

## 📂 File Structure

```
src/
├── components/admin/settings/
│   ├── AllSettingsListPanel.tsx      # Main settings interface
│   └── AdminSettingsOverview.tsx     # Dashboard overview
├── hooks/admin/
│   └── useAdminSettings.ts           # TanStack Query hooks
├── stores/
│   └── admin-settings.store.ts       # Zustand state management
├── lib/
│   └── hierarchical-settings.ts      # Setting resolution logic
└── app/admin/settings/
    └── page.tsx                      # Settings page with tabs

apps/api/src/routes/v1/admin-settings/
├── index.ts                          # Route definitions
├── handlers.ts                       # Request handlers
├── schemas.ts                        # Validation schemas
└── service.ts                        # Business logic
```

## 🚀 Common Operations

### Add New Setting Category
1. Update enum in Prisma schema: `enum settings_category`
2. Run migration: `npx prisma db push`
3. Update frontend category options
4. Add to validation schemas

### Import Settings from CSV
```csv
key,value,category,scope,description,isActive
upload.max_file_size,52428800,upload,global,Maximum file upload size in bytes,true
ui.theme_color,#3b82f6,ui,global,Primary theme color,true
```

### Export Settings
```typescript
import { useExportSettings } from '@/hooks/admin/useAdminSettings';

const exportSettings = useExportSettings();

// Export all settings as CSV
exportSettings.mutate({ format: 'csv' });

// Export specific category as JSON
exportSettings.mutate({ 
  format: 'json', 
  category: 'upload' 
});
```

## 🐛 Debugging

### Enable Debug Mode
```tsx
<PermissionGate 
  permissions={['admin.settings.read']} 
  debug={true}  // Shows permission check details
>
  <SettingsComponent />
</PermissionGate>
```

### Check Permission Issues
```sql
-- Verify user has correct permissions
SELECT u.email, p.name as permission
FROM users u
JOIN user_permissions up ON u.id = up.user_id
JOIN permissions p ON up.permission_id = p.id
WHERE u.email = 'admin@example.com'
  AND p.name LIKE 'admin.settings.%';
```

### Clear Cache
```typescript
// Clear TanStack Query cache
queryClient.invalidateQueries(['admin-settings']);

// Reset Zustand store
useAdminSettingsStore.getState().reset();
```

## 📊 Performance Tips

### Caching Strategy
- **TanStack Query**: 5-minute cache with background refresh
- **Zustand Store**: Client-side state persistence
- **Database**: Indexed queries on key, category, tenant

### Optimization
```typescript
// ✅ Good - Specific queries
const { data } = useAdminSettingsList({ category: 'upload' });

// ❌ Bad - Fetch all settings
const { data } = useAdminSettingsList();
```

## 🔧 Environment Setup

### Required Environment Variables
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
DATABASE_URL="postgresql://user:pass@localhost:5432/mono_platform"
REDIS_URL="redis://localhost:6379"
```

### Development Commands
```bash
# Start API server
cd apps/api && npm run dev

# Start frontend
npm run dev

# Run database migrations
npx prisma migrate dev

# Seed upload settings
npx tsx prisma/seeds/upload-settings.ts
```

---

**Need help?** Check the [full documentation](./SITE_SETTINGS_MODULE.md) or create an issue.