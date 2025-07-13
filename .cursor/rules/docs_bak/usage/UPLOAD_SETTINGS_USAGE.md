# Upload Settings Usage Guide

## Overview

The itellico Mono now includes a comprehensive hierarchical upload settings system that allows super admins to set platform-wide constraints while giving tenant admins flexibility to customize within those bounds.

## Quick Start

### 1. Seed the Database

First, run the upload settings seeder to create the default global settings:

```bash
# Run the seeder
npx tsx prisma/seeds/upload-settings.ts

# Or include in your main seed script
npm run seed
```

### 2. Use Settings-Aware Components

Replace your existing upload components with the new settings-aware versions:

```tsx
import { ProfilePictureUploader, PortfolioImageUploader } from '@/components/upload/SettingsAwareUploader';

// Instead of manually configuring UniversalFileUpload
<ProfilePictureUploader 
  onUploadSuccess={(results) => console.log('Uploaded:', results)}
  onUploadError={(error) => console.error('Error:', error)}
/>

// For portfolio images
<PortfolioImageUploader 
  showConstraints={true}
  className="my-4"
/>
```

### 3. Access Settings in Code

```tsx
import { useUploadSettings, useUploadConstraints } from '@/hooks/useUploadSettings';

function MyComponent() {
  const { settings, isLoading } = useUploadSettings('portfolio_image');
  const { constraints } = useUploadConstraints('picture');
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <p>Max file size: {settings.picture.maxFileSizeMB}MB</p>
      <p>Allowed formats: {constraints.allowedFormats}</p>
    </div>
  );
}
```

## Settings Architecture

### Hierarchical Structure

```
Global Settings (Super Admin)
├── Set maximum constraints (e.g., max 200MB)
├── Define allowed formats list
└── Control security features

Tenant Settings (Tenant Admin)
├── Override within global limits (e.g., set 50MB)
├── Restrict formats further (subset only)
└── Customize processing options
```

### Setting Categories

The system organizes settings by media type:

- **Picture Settings**: JPEG, PNG, WebP handling
- **Video Settings**: MP4, MOV, duration limits
- **Audio Settings**: MP3, WAV, bitrate requirements
- **Document Settings**: PDF, size limits
- **General Settings**: Concurrent uploads, chunk sizes

## Admin Interface Integration

### Super Admin Settings

```tsx
import { UploadSettingsPanel } from '@/components/admin/settings/UploadSettingsPanel';

// In admin dashboard
<UploadSettingsPanel />
```

### Tenant Admin Overrides

```tsx
import { HierarchicalSettingsPanel } from '@/components/admin/HierarchicalSettingsPanel';

// In tenant settings
<HierarchicalSettingsPanel 
  category="media"
  title="Upload Settings"
  description="Customize upload limits and formats for your organization"
/>
```

## API Usage

### Get Effective Settings

```typescript
import { getUploadSettings } from '@/lib/services/upload-settings.service';

// Get settings for a tenant
const settings = await getUploadSettings('portfolio_image', tenantId, userId);

console.log('Max file size:', settings.picture.maxFileSizeMB);
console.log('Allowed formats:', settings.picture.allowedFormats);
```

### Validate Files

```typescript
import { validateUploadFile } from '@/lib/services/upload-settings.service';

const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
const validation = await validateUploadFile(file, 'profile_picture', tenantId);

if (!validation.isValid) {
  console.log('Validation errors:', validation.errors);
}
```

### Update Tenant Settings

```typescript
import { UploadSettingsService } from '@/lib/services/upload-settings.service';

const service = new UploadSettingsService(tenantId, userId);

// Update picture settings within super admin constraints
const result = await service.updatePictureSettings({
  maxFileSizeMB: 10,  // Must be <= global maximum
  allowedFormats: ['image/jpeg', 'image/png']  // Must be subset of global
}, tenantId, modifiedBy);

if (!result.success) {
  console.log('Update failed:', result.errors);
}
```

## Configuration Examples

### Example 1: E-commerce Platform

```sql
-- Super admin sets conservative defaults
UPDATE site_settings 
SET value = 10, max_value = 50 
WHERE key = 'picture_max_file_size_mb' AND tenant_id IS NULL;

-- Fashion tenant needs larger images
UPDATE site_settings 
SET value = 25 
WHERE key = 'picture_max_file_size_mb' AND tenant_id = 123;

-- Electronics tenant keeps defaults
-- (No override needed, inherits global 10MB)
```

### Example 2: Education Platform

```sql
-- Global: Allow educational video content
UPDATE site_settings 
SET value = 30, max_value = 60 
WHERE key = 'video_max_duration_minutes' AND tenant_id IS NULL;

-- University tenant: Full length lectures
UPDATE site_settings 
SET value = 60 
WHERE key = 'video_max_duration_minutes' AND tenant_id = 456;

-- K-12 tenant: Shorter videos only
UPDATE site_settings 
SET value = 10 
WHERE key = 'video_max_duration_minutes' AND tenant_id = 789;
```

## Component Variants

### Profile Picture Upload

```tsx
<ProfilePictureUploader 
  variant="avatar"           // Circular preview
  showConstraints={false}    // Hide technical details
  onUploadSuccess={(results) => {
    updateUserProfile(results[0].url);
  }}
/>
```

### Portfolio Gallery

```tsx
<PortfolioImageUploader
  variant="gallery"          // Grid layout
  showConstraints={true}     // Show file limits
  className="portfolio-section"
  onUploadSuccess={(results) => {
    addToPortfolio(results);
  }}
/>
```

### Document Upload

```tsx
<DocumentUploader
  variant="default"          // List view
  showConstraints={true}     // Show PDF requirements
  onUploadSuccess={(results) => {
    saveDocuments(results);
  }}
/>
```

## Validation & Error Handling

### Client-Side Validation

```tsx
import { useFileValidation } from '@/hooks/useUploadSettings';

function UploadComponent() {
  const { validateFile } = useFileValidation('portfolio_image');
  
  const handleFileSelect = async (file: File) => {
    const validation = await validateFile(file);
    
    if (!validation.isValid) {
      // Show user-friendly errors
      setErrors(validation.errors);
      return;
    }
    
    // Proceed with upload
    uploadFile(file);
  };
}
```

### Server-Side Integration

The Fastify API automatically uses these settings:

```typescript
// In your upload endpoint
import { UploadSettingsService } from '@/lib/services/upload-settings.service';

const settingsService = new UploadSettingsService(tenantId, userId);
const validation = await settingsService.validateFile(file, context, mediaType);

if (!validation.isValid) {
  return reply.code(400).send({
    errors: validation.errors
  });
}
```

## Monitoring & Analytics

### Track Setting Usage

```typescript
// Log when tenants override settings
logger.info('Tenant setting override', {
  tenantId,
  setting: 'picture_max_file_size_mb',
  oldValue: 25,
  newValue: 10,
  reason: 'cost_optimization'
});
```

### Monitor Constraint Violations

```typescript
// Track failed uploads due to settings
analytics.track('upload_failed', {
  reason: 'file_too_large',
  fileSize: file.size,
  limit: settings.picture.maxFileSizeMB,
  tenantId,
  context
});
```

## Best Practices

### 1. Progressive Constraints

Start with generous global limits and let tenants restrict as needed:

```typescript
// Good: Allow up to 100MB globally, tenants can go lower
globalMaxSize: 100,
defaultValue: 25

// Avoid: Too restrictive globally
globalMaxSize: 10  // Tenants can't increase even if they need to
```

### 2. Sensible Defaults

Choose defaults that work for 80% of tenants:

```typescript
// Most tenants will be happy with these
pictureMaxFileSizeMB: 25,
videoMaxDurationMinutes: 15,
allowedFormats: ['image/jpeg', 'image/png', 'image/webp']
```

### 3. Clear Error Messages

Provide actionable feedback:

```typescript
// Good
"File size 45MB exceeds your limit of 25MB. Please compress the image or contact support to increase your limit."

// Poor
"File too large"
```

### 4. Approval Workflows

Require approval for settings that impact costs:

```sql
UPDATE site_settings 
SET requires_approval = true 
WHERE key IN ('video_max_file_size_mb', 'upload_total_size_limit_mb');
```

## Troubleshooting

### Common Issues

1. **Settings not loading**: Check tenant ID is passed correctly
2. **Validation failing**: Verify global constraints aren't violated  
3. **Upload errors**: Check Fastify API integration
4. **Permission denied**: Verify RBAC permissions for settings

### Debug Commands

```bash
# Check current settings for a tenant
npx tsx -e "
import { getUploadSettings } from '@/lib/services/upload-settings.service';
const settings = await getUploadSettings('portfolio_image', 123);
console.log(JSON.stringify(settings, null, 2));
"

# Validate a setting change
npx tsx -e "
import { validateTenantSetting } from '@/lib/hierarchical-settings';
const result = await validateTenantSetting('media', 'picture_max_file_size_mb', 50, 123);
console.log(result);
"
```

This hierarchical upload settings system provides the perfect balance of control and flexibility for your multi-tenant platform.