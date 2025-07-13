# Universal Media Uploader Architecture Design

## Executive Summary

This document outlines the architecture for a comprehensive universal media uploader component for the itellico Mono. The design focuses on security, performance, flexibility, and user experience while supporting multiple file formats (images, videos, audio, documents) with advanced validation and processing capabilities.

## Current State Analysis

### Existing Components
- **UniversalFileUpload**: Tenant-aware component with basic upload functionality
- **Fastify API**: Comprehensive media upload endpoint with file validation and processing
- **Security Features**: File hashing, directory structure, tenant isolation
- **Storage**: Local file system with CDN URL generation

### Gaps to Address
1. No virus/malware scanning implementation
2. Missing cloud storage integration (S3, Cloudinary)
3. No real-time optimization queue processing
4. Limited client-side file validation
5. No chunked/resumable uploads for large files

## Proposed Architecture

### Core Features

#### 1. Enhanced Security Layer
```typescript
interface SecurityConfig {
  // File validation
  virusScan: boolean;
  contentValidation: boolean;
  exifStripping: boolean;
  
  // Injection prevention
  fileNameSanitization: boolean;
  mimeTypeVerification: boolean;
  magicNumberValidation: boolean;
  
  // Upload restrictions
  maxFileSize: number;
  maxTotalSize: number;
  allowedMimeTypes: string[];
  blockedExtensions: string[];
  
  // Advanced security
  sandboxProcessing: boolean;
  contentDisarmReconstruction: boolean;
}
```

#### 2. Multi-Layer Validation
- **Client-side**: Immediate feedback, format/size checks
- **Server-side**: Deep validation, security scanning
- **Post-upload**: Async processing, optimization

#### 3. Upload Strategies
```typescript
type UploadStrategy = 
  | 'direct'           // Small files < 5MB
  | 'chunked'          // Large files with resumable support
  | 'multipart'        // Batch uploads
  | 'background'       // Progressive enhancement
  | 'streaming';       // Real-time media
```

#### 4. Storage Adapters
```typescript
interface StorageAdapter {
  upload(file: File, options: UploadOptions): Promise<StorageResult>;
  delete(fileId: string): Promise<void>;
  getUrl(fileId: string, variant?: string): string;
  generateSignedUrl(fileId: string, expires: number): string;
}

// Implementations
class LocalStorageAdapter implements StorageAdapter {}
class S3StorageAdapter implements StorageAdapter {}
class CloudinaryAdapter implements StorageAdapter {}
class AzureBlobAdapter implements StorageAdapter {}
```

### Component Architecture

#### 1. Universal Media Uploader Component
```typescript
interface UniversalMediaUploaderProps {
  // Core configuration
  uploadStrategy: UploadStrategy;
  storageAdapter: StorageAdapter;
  securityConfig: SecurityConfig;
  
  // UI configuration
  variant: 'default' | 'minimal' | 'advanced' | 'drag-drop';
  theme: 'light' | 'dark' | 'auto';
  
  // Features
  features: {
    preview: boolean;
    editing: boolean;
    compression: boolean;
    metadata: boolean;
    progress: ProgressConfig;
    batch: boolean;
    camera: boolean;
    recording: boolean;
  };
  
  // Validation
  validation: ValidationConfig;
  
  // Callbacks
  onUploadStart?: (files: MediaFile[]) => void;
  onUploadProgress?: (progress: UploadProgress) => void;
  onUploadComplete?: (results: UploadResult[]) => void;
  onError?: (error: UploadError) => void;
  onValidationError?: (errors: ValidationError[]) => void;
}
```

#### 2. Progress Management
```typescript
interface ProgressConfig {
  showOverall: boolean;
  showIndividual: boolean;
  showSpeed: boolean;
  showTimeRemaining: boolean;
  updateInterval: number;
  smoothing: boolean;
}

interface UploadProgress {
  fileId: string;
  fileName: string;
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
  speed: number; // bytes/second
  timeRemaining: number; // seconds
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
}
```

#### 3. Advanced Validation
```typescript
interface ValidationConfig {
  // File validation
  maxFileSize: number;
  minFileSize?: number;
  allowedTypes: string[];
  allowedExtensions: string[];
  
  // Content validation
  image: {
    maxWidth: number;
    maxHeight: number;
    minWidth?: number;
    minHeight?: number;
    aspectRatio?: { min: number; max: number };
    maxMegapixels?: number;
  };
  
  video: {
    maxDuration: number; // seconds
    minDuration?: number;
    maxBitrate?: number;
    allowedCodecs?: string[];
    maxResolution?: { width: number; height: number };
  };
  
  audio: {
    maxDuration: number;
    minDuration?: number;
    maxBitrate?: number;
    allowedCodecs?: string[];
    sampleRate?: { min: number; max: number };
  };
  
  document: {
    maxPages?: number;
    allowedFormats: string[];
    maxFileSize: number;
  };
  
  // Security validation
  security: {
    scanForVirus: boolean;
    scanForMalware: boolean;
    checkFileSignature: boolean;
    validateMimeType: boolean;
    sanitizeMetadata: boolean;
  };
}
```

### Security Implementation

#### 1. Multi-Stage Security Pipeline
```typescript
class SecurityPipeline {
  private stages: SecurityStage[] = [
    new FileNameSanitizer(),
    new MimeTypeValidator(),
    new MagicNumberValidator(),
    new FileSizeValidator(),
    new ContentScanner(),
    new MetadataSanitizer(),
    new MalwareScanner(),
    new ContentDisarmReconstructor()
  ];
  
  async process(file: File): Promise<SecurityResult> {
    for (const stage of this.stages) {
      const result = await stage.process(file);
      if (!result.passed) {
        return result;
      }
    }
    return { passed: true, file };
  }
}
```

#### 2. Content Disarm & Reconstruction (CDR)
```typescript
class ContentDisarmReconstructor {
  async process(file: File): Promise<ProcessedFile> {
    switch (file.type) {
      case 'application/pdf':
        return this.processPDF(file);
      case 'image/jpeg':
      case 'image/png':
        return this.processImage(file);
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return this.processSpreadsheet(file);
      default:
        return file;
    }
  }
  
  private async processImage(file: File): Promise<File> {
    // Remove EXIF data
    // Strip embedded scripts
    // Rebuild image from pixels
    return sanitizedFile;
  }
}
```

#### 3. Injection Prevention
```typescript
class InjectionPrevention {
  sanitizeFileName(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')  // Remove special characters
      .replace(/\.{2,}/g, '_')           // Prevent directory traversal
      .replace(/^\.+/, '')               // Remove leading dots
      .substring(0, 255);                // Limit length
  }
  
  validateMimeType(file: File): boolean {
    const declaredType = file.type;
    const detectedType = this.detectMimeType(file);
    return declaredType === detectedType;
  }
  
  checkMagicNumbers(file: File): boolean {
    const signatures = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'application/pdf': [0x25, 0x50, 0x44, 0x46],
      // ... more signatures
    };
    
    const header = await this.readFileHeader(file, 8);
    return this.matchesSignature(header, signatures[file.type]);
  }
}
```

### Performance Optimization

#### 1. Chunked Upload Implementation
```typescript
class ChunkedUploader {
  private chunkSize = 1024 * 1024; // 1MB chunks
  private maxConcurrent = 3;
  
  async upload(file: File, options: ChunkedUploadOptions): Promise<void> {
    const chunks = this.createChunks(file);
    const uploadId = await this.initializeUpload(file);
    
    try {
      await this.uploadChunks(chunks, uploadId, {
        concurrent: this.maxConcurrent,
        retryAttempts: 3,
        onProgress: options.onProgress
      });
      
      await this.completeUpload(uploadId);
    } catch (error) {
      await this.abortUpload(uploadId);
      throw error;
    }
  }
  
  private createChunks(file: File): Chunk[] {
    const chunks: Chunk[] = [];
    let offset = 0;
    
    while (offset < file.size) {
      const end = Math.min(offset + this.chunkSize, file.size);
      chunks.push({
        index: chunks.length,
        start: offset,
        end: end,
        blob: file.slice(offset, end)
      });
      offset = end;
    }
    
    return chunks;
  }
}
```

#### 2. Client-Side Optimization
```typescript
class ClientOptimizer {
  async optimizeImage(file: File, options: ImageOptimizationOptions): Promise<File> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = await this.loadImage(file);
    
    // Resize if needed
    const { width, height } = this.calculateDimensions(img, options);
    canvas.width = width;
    canvas.height = height;
    
    // Draw and compress
    ctx.drawImage(img, 0, 0, width, height);
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob!),
        options.format || file.type,
        options.quality || 0.85
      );
    });
    
    return new File([blob], file.name, { type: blob.type });
  }
}
```

### User Experience Features

#### 1. Real-time Preview
```typescript
interface PreviewConfig {
  showThumbnail: boolean;
  showMetadata: boolean;
  allowEditing: boolean;
  allowCropping: boolean;
  allowRotation: boolean;
  allowFilters: boolean;
}
```

#### 2. Drag & Drop Enhancement
```typescript
class EnhancedDropZone {
  private dropZone: HTMLElement;
  private overlay: HTMLElement;
  
  constructor(element: HTMLElement, options: DropZoneOptions) {
    this.setupDropZone(element);
    this.setupVisualFeedback();
    this.setupAccessibility();
  }
  
  private setupVisualFeedback() {
    // Highlight valid drop areas
    // Show file type indicators
    // Display size restrictions
    // Animate drop feedback
  }
}
```

#### 3. Accessibility
```typescript
interface AccessibilityConfig {
  announceProgress: boolean;
  keyboardNavigation: boolean;
  screenReaderDescriptions: boolean;
  highContrastMode: boolean;
  reducedMotion: boolean;
}
```

### Integration Examples

#### 1. Profile Picture Upload
```tsx
<UniversalMediaUploader
  uploadStrategy="direct"
  storageAdapter={s3Adapter}
  securityConfig={{
    virusScan: true,
    exifStripping: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  }}
  variant="minimal"
  features={{
    preview: true,
    editing: true,
    compression: true,
    camera: true
  }}
  validation={{
    image: {
      minWidth: 200,
      minHeight: 200,
      maxWidth: 4000,
      maxHeight: 4000,
      aspectRatio: { min: 0.5, max: 2 }
    }
  }}
/>
```

#### 2. Video Portfolio Upload
```tsx
<UniversalMediaUploader
  uploadStrategy="chunked"
  storageAdapter={cloudinaryAdapter}
  securityConfig={{
    virusScan: true,
    contentValidation: true,
    maxFileSize: 500 * 1024 * 1024, // 500MB
    allowedMimeTypes: ['video/mp4', 'video/quicktime']
  }}
  variant="advanced"
  features={{
    preview: true,
    progress: {
      showOverall: true,
      showSpeed: true,
      showTimeRemaining: true
    },
    batch: true
  }}
  validation={{
    video: {
      maxDuration: 300, // 5 minutes
      maxBitrate: 10000000, // 10 Mbps
      maxResolution: { width: 1920, height: 1080 }
    }
  }}
/>
```

### Testing Strategy

#### 1. Security Testing
- File type spoofing tests
- Malicious file upload attempts
- Path traversal attacks
- Script injection tests
- Large file DoS attempts

#### 2. Performance Testing
- Large file uploads (1GB+)
- Concurrent uploads
- Network interruption recovery
- Browser memory usage
- Upload speed optimization

#### 3. Compatibility Testing
- Cross-browser support
- Mobile device testing
- Network condition simulation
- Accessibility compliance
- Internationalization

### Implementation Roadmap

#### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Security pipeline implementation
- [ ] Storage adapter interface
- [ ] Basic upload strategies
- [ ] Progress tracking system

#### Phase 2: Advanced Features (Week 3-4)
- [ ] Chunked upload support
- [ ] Client-side optimization
- [ ] CDR implementation
- [ ] Virus scanning integration

#### Phase 3: UI Components (Week 5-6)
- [ ] Component variants
- [ ] Preview system
- [ ] Accessibility features
- [ ] Theme support

#### Phase 4: Integration & Testing (Week 7-8)
- [ ] API integration
- [ ] Security testing
- [ ] Performance optimization
- [ ] Documentation

### Best Practices Summary

1. **Security First**: Never trust client-side validation alone
2. **Progressive Enhancement**: Basic functionality works everywhere
3. **Performance**: Optimize for common use cases
4. **Accessibility**: WCAG 2.1 AA compliance minimum
5. **Error Handling**: Clear, actionable error messages
6. **Monitoring**: Track upload success rates and performance
7. **Documentation**: Comprehensive examples and API docs

### Conclusion

This universal media uploader design provides a secure, performant, and flexible solution for all file upload needs across the itellico Mono. The modular architecture allows for easy extension and customization while maintaining high security standards and excellent user experience.