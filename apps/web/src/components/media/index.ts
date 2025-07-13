/**
 * Media Components
 * 
 * @description Collection of components for media upload, processing, and display
 * in the mono platform. These components handle all media-related functionality
 * including file uploads, optimization tracking, gallery displays, and media viewing.
 * 
 * @category Media Components
 * @tenant-aware All components support tenant-specific configurations and limits
 * 
 * @components
 * - UniversalMediaUploader: Comprehensive file upload component with drag & drop
 * - MediaGallery: Grid-based media gallery with filtering and sorting
 * - UniversalMediaViewer: Modal viewer for individual media assets
 * 
 * @business-context
 * Media management is central to the mono platform as it handles profile pictures,
 * portfolio images/videos, application documents, and other media assets. All components
 * enforce tenant-specific limits and integrate with the optimization pipeline.
 */

// Main components
export { UniversalMediaUploader } from './UniversalMediaUploader';
export { MediaGallery } from './MediaGallery';
export { UniversalMediaViewer } from './UniversalMediaViewer';

// Types
export type { 
  MediaUploadContext,
  SlotConfig,
  MediaAsset,
  UniversalMediaUploaderProps,
  UploadProgress
} from './UniversalMediaUploader'; 