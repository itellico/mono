# Media Components

Comprehensive media management components for the mono platform, handling all aspects of file upload, processing, and display.

## Components

### UniversalMediaUploader
**Main upload component with drag & drop interface and real-time progress tracking**

- **Purpose**: Handle all media uploads across different contexts (profiles, portfolios, applications)
- **Features**: Drag & drop, progress tracking, optimization status, error handling
- **Contexts**: Profile pictures, comp cards, portfolios, video libraries, documents
- **Optimization**: Automatic image/video optimization with PG Boss integration

### MediaGallery  
**Grid-based gallery for displaying media collections**

- **Purpose**: Display uploaded media in organized, filterable galleries
- **Features**: Grid layouts, filtering, sorting, bulk actions
- **Use Cases**: Portfolio galleries, media libraries, admin media management

### UniversalMediaViewer
**Modal viewer for individual media assets**

- **Purpose**: Full-screen viewing of individual media files
- **Features**: Modal interface, navigation between assets, metadata display
- **Support**: Images, videos, documents with appropriate viewers

## Usage Patterns

### Basic Upload
```tsx
import { UniversalMediaUploader } from '@/components/media';

// Profile picture upload
<UniversalMediaUploader
  context="profile_picture"
  onUploadComplete={(assets) => updateProfile(assets[0])}
/>
```

### Portfolio Upload
```tsx
// Portfolio with custom configuration
<UniversalMediaUploader
  context="portfolio"
  maxFiles={20}
  maxFileSize={25 * 1024 * 1024}
  acceptedFormats={['image/jpeg', 'image/png', 'video/mp4']}
  onUploadComplete={(assets) => addToPortfolio(assets)}
  onOptimizationComplete={(asset) => updateOptimizationStatus(asset)}
/>
```

### Application Documents
```tsx
// Job application document upload
<UniversalMediaUploader
  context="application"
  contextId={jobId}
  acceptedFormats={['application/pdf', 'image/jpeg']}
  showOptimizationStatus={false}
  onUploadComplete={(assets) => attachToApplication(assets)}
/>
```

### Gallery Display
```tsx
import { MediaGallery } from '@/components/media';

<MediaGallery
  mediaAssets={portfolioAssets}
  onAssetSelect={(asset) => openViewer(asset)}
  allowDelete={isOwner}
  showOptimizationStatus={true}
/>
```

## Common Props

### All Media Components
- **Tenant Awareness**: All components respect tenant-specific configurations
- **Error Handling**: Comprehensive error handling with user feedback
- **Accessibility**: Full ARIA support and keyboard navigation
- **Responsive**: Mobile-friendly interfaces

### UniversalMediaUploader Specific
- `context`: Upload context defining validation rules
- `maxFiles`: Maximum number of files allowed
- `maxFileSize`: Maximum file size in bytes
- `acceptedFormats`: Allowed MIME types
- `onUploadComplete`: Callback for successful uploads

## Tenant Considerations

### Context-Based Limits
Different upload contexts have different default limits:

- **Profile Picture**: 1 file, 10MB, images only
- **Portfolio**: 20 files, 25MB, images + videos
- **Video Library**: 10 files, 500MB, videos only
- **Documents**: 10 files, 25MB, PDFs + images

### Admin Configuration
Tenant administrators can override default limits:

- File size limits per context
- Allowed file formats
- Maximum files per upload
- Optimization settings

### Subscription Enforcement
Upload limits are enforced based on account subscription:

- Free accounts: Basic limits
- Premium accounts: Higher limits
- Enterprise accounts: Custom limits

## API Integration

### Upload Endpoint
- **POST** `/api/media/upload` - Main upload endpoint
- **Features**: Multi-part upload, validation, optimization queuing
- **Security**: Tenant isolation, permission validation

### Configuration Endpoint  
- **GET** `/api/admin/settings/media` - Tenant media settings
- **Purpose**: Dynamic configuration loading
- **Caching**: Settings cached for performance

### Processing Status
- **WebSocket**: Real-time optimization status updates
- **Polling**: Fallback for optimization tracking
- **Jobs**: PG Boss integration for background processing

## File Processing Pipeline

### 1. Upload
- Client-side validation
- Server-side validation
- File hash generation
- Tenant-isolated storage

### 2. Optimization
- Automatic optimization queuing
- Image resizing and format conversion
- Video transcoding and compression
- Thumbnail generation

### 3. CDN Distribution
- Optimized files served via CDN
- Multiple format support
- Responsive image delivery

## Security Features

### Tenant Isolation
- All uploads isolated by tenant
- Account-based file organization
- No cross-tenant access

### Validation
- MIME type validation
- File size limits
- Content scanning
- Malware detection

### Access Control
- User-based permissions
- Context-based restrictions
- Admin override capabilities

## Performance Optimizations

### Client-Side
- File chunking for large uploads
- Progress tracking and cancellation
- Drag & drop performance
- Preview generation

### Server-Side
- Async processing with PG Boss
- CDN integration
- Thumbnail caching
- Database optimization

## Error Handling

### Upload Errors
- Network failures with retry logic
- File validation errors with clear messages
- Server errors with fallback options
- User-friendly error display

### Processing Errors
- Optimization failure handling
- Format conversion errors
- Storage failures
- Recovery mechanisms

## Testing

### Component Testing
- Upload flow testing
- Error scenario testing
- Progress tracking validation
- Accessibility testing

### Integration Testing
- API endpoint testing
- File processing pipeline
- Tenant isolation validation
- Performance testing

## Accessibility

### Screen Reader Support
- ARIA labels for all interactive elements
- Progress announcements
- Error message accessibility
- Keyboard navigation

### Visual Accessibility  
- High contrast support
- Focus indicators
- Responsive design
- Touch target sizing

## Future Enhancements

### Planned Features
- Batch upload optimization
- Resume interrupted uploads
- Advanced image editing
- Video preview generation

### Performance Improvements
- WebRTC for peer uploads
- Progressive upload streaming
- Enhanced caching strategies
- Mobile optimization 