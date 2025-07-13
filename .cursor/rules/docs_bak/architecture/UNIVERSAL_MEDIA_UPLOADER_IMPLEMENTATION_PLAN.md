# Universal Media Uploader Implementation Plan

## Overview

This implementation plan outlines the step-by-step approach to build a comprehensive universal media uploader for the itellico Mono with enterprise-grade security, performance, and user experience features.

## Key Requirements

### Security Requirements
- **Multi-layer validation**: Client-side, server-side, and post-upload
- **Malware/virus scanning**: Integration with ClamAV or similar
- **Content Disarm & Reconstruction (CDR)**: For Office docs, PDFs, images
- **Injection prevention**: Path traversal, XSS, SQL injection protection
- **File signature validation**: Magic number checking
- **Metadata sanitization**: EXIF stripping, embedded script removal

### Performance Requirements
- **Chunked uploads**: For files > 5MB with resume capability
- **Concurrent uploads**: Up to 3 simultaneous transfers
- **Client-side optimization**: Image compression, format conversion
- **Progress tracking**: Real-time with speed and time remaining
- **Network resilience**: Auto-retry with exponential backoff

### User Experience Requirements
- **Drag & drop**: With visual feedback and file type indicators
- **Camera integration**: Direct capture for mobile devices
- **Preview & editing**: Crop, rotate, basic filters
- **Accessibility**: WCAG 2.1 AA compliant
- **Internationalization**: Multi-language support

## Implementation Components

### 1. Core Upload Service
```typescript
// src/services/upload/UniversalUploadService.ts
export class UniversalUploadService {
  private securityPipeline: SecurityPipeline;
  private storageAdapter: StorageAdapter;
  private uploadStrategies: Map<UploadStrategy, IUploadStrategy>;
  
  constructor(config: UploadServiceConfig) {
    this.initializeSecurityPipeline(config.security);
    this.initializeStorageAdapter(config.storage);
    this.initializeUploadStrategies();
  }
  
  async upload(files: File[], options: UploadOptions): Promise<UploadResult[]> {
    // Validate files through security pipeline
    const validatedFiles = await this.validateFiles(files);
    
    // Select upload strategy based on file characteristics
    const strategy = this.selectStrategy(validatedFiles, options);
    
    // Execute upload with progress tracking
    return strategy.upload(validatedFiles, {
      ...options,
      onProgress: this.handleProgress.bind(this),
      onError: this.handleError.bind(this)
    });
  }
}
```

### 2. Security Pipeline Components

#### File Validator
```typescript
// src/services/upload/security/FileValidator.ts
export class FileValidator implements SecurityStage {
  async process(file: File, context: SecurityContext): Promise<ValidationResult> {
    const checks = [
      this.validateFileName(file.name),
      this.validateFileSize(file.size, context.maxSize),
      this.validateMimeType(file.type, context.allowedTypes),
      await this.validateMagicNumbers(file),
      await this.validateContent(file)
    ];
    
    const errors = checks.filter(check => !check.valid);
    
    return {
      valid: errors.length === 0,
      errors: errors.map(e => e.error),
      sanitizedFile: this.sanitizeFile(file)
    };
  }
}
```

#### Malware Scanner
```typescript
// src/services/upload/security/MalwareScanner.ts
export class MalwareScanner implements SecurityStage {
  private scanner: ClamAVScanner | WindowsDefenderScanner;
  
  async process(file: File): Promise<ScanResult> {
    // Convert file to buffer for scanning
    const buffer = await file.arrayBuffer();
    
    // Scan with multiple engines if available
    const scanResults = await Promise.all([
      this.scanner.scan(buffer),
      this.performHeuristicScan(buffer),
      this.checkKnownMalwareSignatures(buffer)
    ]);
    
    return {
      clean: scanResults.every(r => r.clean),
      threats: scanResults.flatMap(r => r.threats),
      confidence: this.calculateConfidence(scanResults)
    };
  }
}
```

#### Content Disarm & Reconstruction
```typescript
// src/services/upload/security/ContentDisarmReconstructor.ts
export class ContentDisarmReconstructor implements SecurityStage {
  async process(file: File): Promise<File> {
    const processor = this.getProcessor(file.type);
    if (!processor) return file;
    
    return processor.sanitize(file);
  }
  
  private processors = {
    'image/jpeg': new ImageCDR(),
    'image/png': new ImageCDR(),
    'application/pdf': new PDFCDR(),
    'application/vnd.ms-excel': new ExcelCDR(),
    // ... more processors
  };
}

// Image CDR implementation
class ImageCDR implements CDRProcessor {
  async sanitize(file: File): Promise<File> {
    const img = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    
    // Draw image without metadata
    ctx.drawImage(img, 0, 0);
    
    // Convert back to file
    const blob = await canvas.convertToBlob({
      type: file.type,
      quality: 0.95
    });
    
    return new File([blob], file.name, { type: file.type });
  }
}
```

### 3. Upload Strategies

#### Direct Upload Strategy
```typescript
// src/services/upload/strategies/DirectUploadStrategy.ts
export class DirectUploadStrategy implements IUploadStrategy {
  async upload(files: File[], options: UploadOptions): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (const file of files) {
      try {
        const result = await this.uploadSingleFile(file, options);
        results.push(result);
      } catch (error) {
        if (!options.continueOnError) throw error;
        results.push({ file, error, status: 'failed' });
      }
    }
    
    return results;
  }
  
  private async uploadSingleFile(file: File, options: UploadOptions): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('context', options.context);
    
    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          options.onProgress?.({
            loaded: e.loaded,
            total: e.total,
            percentage: (e.loaded / e.total) * 100
          });
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });
      
      xhr.open('POST', options.endpoint);
      xhr.send(formData);
    });
  }
}
```

#### Chunked Upload Strategy
```typescript
// src/services/upload/strategies/ChunkedUploadStrategy.ts
export class ChunkedUploadStrategy implements IUploadStrategy {
  private chunkSize = 1024 * 1024 * 5; // 5MB chunks
  
  async upload(files: File[], options: UploadOptions): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (const file of files) {
      const uploadId = await this.initializeUpload(file, options);
      const chunks = this.createChunks(file);
      
      try {
        await this.uploadChunks(chunks, uploadId, options);
        const result = await this.finalizeUpload(uploadId, options);
        results.push(result);
      } catch (error) {
        await this.abortUpload(uploadId);
        throw error;
      }
    }
    
    return results;
  }
  
  private createChunks(file: File): FileChunk[] {
    const chunks: FileChunk[] = [];
    let offset = 0;
    let chunkNumber = 0;
    
    while (offset < file.size) {
      const end = Math.min(offset + this.chunkSize, file.size);
      chunks.push({
        number: chunkNumber++,
        start: offset,
        end: end,
        blob: file.slice(offset, end),
        hash: null // Will be calculated during upload
      });
      offset = end;
    }
    
    return chunks;
  }
  
  private async uploadChunks(
    chunks: FileChunk[], 
    uploadId: string, 
    options: UploadOptions
  ): Promise<void> {
    const concurrentLimit = 3;
    const uploadQueue = [...chunks];
    const uploading = new Map<number, Promise<void>>();
    
    while (uploadQueue.length > 0 || uploading.size > 0) {
      // Start new uploads up to the limit
      while (uploading.size < concurrentLimit && uploadQueue.length > 0) {
        const chunk = uploadQueue.shift()!;
        const uploadPromise = this.uploadChunk(chunk, uploadId, options)
          .then(() => uploading.delete(chunk.number));
        
        uploading.set(chunk.number, uploadPromise);
      }
      
      // Wait for at least one upload to complete
      if (uploading.size > 0) {
        await Promise.race(uploading.values());
      }
    }
  }
}
```

### 4. React Components

#### Main Upload Component
```tsx
// src/components/upload/UniversalMediaUploader.tsx
export const UniversalMediaUploader: React.FC<UniversalMediaUploaderProps> = ({
  variant = 'default',
  securityConfig,
  onUpload,
  onError,
  ...props
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const uploadService = useUploadService(securityConfig);
  
  const handleDrop = useCallback(async (acceptedFiles: File[]) => {
    // Validate files client-side
    const validationResults = await validateFiles(acceptedFiles, props.validation);
    
    if (validationResults.errors.length > 0) {
      onError?.(validationResults.errors);
      return;
    }
    
    // Add files to upload queue
    const uploadFiles = acceptedFiles.map(file => ({
      id: generateId(),
      file,
      progress: 0,
      status: 'pending' as const,
      preview: null
    }));
    
    setFiles(prev => [...prev, ...uploadFiles]);
    
    // Generate previews
    generatePreviews(uploadFiles);
  }, [props.validation, onError]);
  
  const startUpload = useCallback(async () => {
    setUploading(true);
    
    try {
      const results = await uploadService.upload(
        files.map(f => f.file),
        {
          context: props.context,
          onProgress: (progress) => updateProgress(progress),
          onFileComplete: (result) => updateFileStatus(result)
        }
      );
      
      onUpload?.(results);
    } catch (error) {
      onError?.(error);
    } finally {
      setUploading(false);
    }
  }, [files, uploadService, props.context, onUpload, onError]);
  
  return (
    <UploadProvider value={{ files, uploading, uploadService }}>
      <div className={cn('universal-media-uploader', variant)}>
        {variant === 'default' && <DefaultUploadUI {...props} />}
        {variant === 'minimal' && <MinimalUploadUI {...props} />}
        {variant === 'advanced' && <AdvancedUploadUI {...props} />}
        {variant === 'drag-drop' && <DragDropUploadUI {...props} />}
      </div>
    </UploadProvider>
  );
};
```

#### Upload Progress Component
```tsx
// src/components/upload/UploadProgress.tsx
export const UploadProgress: React.FC<UploadProgressProps> = ({
  file,
  progress,
  showDetails = true
}) => {
  const { bytesPerSecond, timeRemaining } = useUploadMetrics(file, progress);
  
  return (
    <div className="upload-progress">
      <div className="progress-header">
        <FileIcon type={file.type} />
        <span className="file-name">{file.name}</span>
        <span className="progress-percentage">{Math.round(progress)}%</span>
      </div>
      
      <Progress value={progress} className="progress-bar" />
      
      {showDetails && (
        <div className="progress-details">
          <span className="upload-speed">
            {formatBytes(bytesPerSecond)}/s
          </span>
          <span className="time-remaining">
            {formatDuration(timeRemaining)} remaining
          </span>
        </div>
      )}
    </div>
  );
};
```

### 5. API Integration

#### Fastify Upload Enhancement
```typescript
// apps/api/src/routes/v1/media/upload-enhanced.ts
export const enhancedUploadRoute: FastifyPluginAsync = async (fastify) => {
  // Initialize multipart upload
  fastify.post('/upload/initialize', {
    schema: {
      body: Type.Object({
        fileName: Type.String(),
        fileSize: Type.Number(),
        mimeType: Type.String(),
        context: Type.String(),
        metadata: Type.Optional(Type.Object({}))
      })
    }
  }, async (request, reply) => {
    const uploadId = generateUploadId();
    const { fileName, fileSize, mimeType, context } = request.body;
    
    // Validate upload request
    const validation = await validateUploadRequest({
      fileName,
      fileSize,
      mimeType,
      context,
      userId: request.user.id,
      tenantId: request.user.tenantId
    });
    
    if (!validation.valid) {
      return reply.code(400).send({
        success: false,
        errors: validation.errors
      });
    }
    
    // Initialize upload session
    await fastify.redis.setex(
      `upload:${uploadId}`,
      3600, // 1 hour TTL
      JSON.stringify({
        fileName,
        fileSize,
        mimeType,
        context,
        userId: request.user.id,
        tenantId: request.user.tenantId,
        chunks: [],
        createdAt: new Date()
      })
    );
    
    return {
      success: true,
      uploadId,
      chunkSize: 5 * 1024 * 1024, // 5MB
      expires: new Date(Date.now() + 3600000)
    };
  });
  
  // Upload chunk
  fastify.post('/upload/chunk/:uploadId', {
    schema: {
      params: Type.Object({
        uploadId: Type.String()
      }),
      headers: Type.Object({
        'content-range': Type.String(),
        'x-chunk-hash': Type.String()
      })
    }
  }, async (request, reply) => {
    const { uploadId } = request.params;
    const contentRange = request.headers['content-range'];
    const chunkHash = request.headers['x-chunk-hash'];
    
    // Parse content range
    const [start, end, total] = parseContentRange(contentRange);
    
    // Get upload session
    const session = await getUploadSession(uploadId);
    if (!session) {
      return reply.code(404).send({
        success: false,
        error: 'Upload session not found'
      });
    }
    
    // Validate chunk
    const chunkData = await request.file();
    const actualHash = calculateHash(chunkData.buffer);
    
    if (actualHash !== chunkHash) {
      return reply.code(400).send({
        success: false,
        error: 'Chunk hash mismatch'
      });
    }
    
    // Store chunk
    await storeChunk(uploadId, {
      index: Math.floor(start / session.chunkSize),
      start,
      end,
      hash: chunkHash,
      data: chunkData.buffer
    });
    
    // Update session
    session.chunks.push({ start, end, hash: chunkHash });
    await updateUploadSession(uploadId, session);
    
    return {
      success: true,
      received: end - start,
      total: session.fileSize
    };
  });
  
  // Finalize upload
  fastify.post('/upload/finalize/:uploadId', {
    schema: {
      params: Type.Object({
        uploadId: Type.String()
      })
    }
  }, async (request, reply) => {
    const { uploadId } = request.params;
    
    // Get upload session
    const session = await getUploadSession(uploadId);
    if (!session) {
      return reply.code(404).send({
        success: false,
        error: 'Upload session not found'
      });
    }
    
    // Verify all chunks are present
    const assembled = await assembleChunks(uploadId, session);
    
    // Run security pipeline
    const securityResult = await runSecurityPipeline(assembled, {
      fileName: session.fileName,
      mimeType: session.mimeType,
      context: session.context
    });
    
    if (!securityResult.passed) {
      await cleanupUpload(uploadId);
      return reply.code(400).send({
        success: false,
        error: 'Security validation failed',
        details: securityResult.errors
      });
    }
    
    // Store file
    const storedFile = await storeFile(securityResult.file, session);
    
    // Create media asset record
    const mediaAsset = await createMediaAsset({
      ...storedFile,
      userId: session.userId,
      tenantId: session.tenantId
    });
    
    // Queue processing jobs
    await queueProcessingJobs(mediaAsset);
    
    // Cleanup upload session
    await cleanupUpload(uploadId);
    
    return {
      success: true,
      mediaAsset: {
        id: mediaAsset.id,
        url: mediaAsset.url,
        thumbnailUrl: mediaAsset.thumbnailUrl
      }
    };
  });
};
```

### 6. Testing Implementation

#### Security Testing Suite
```typescript
// src/services/upload/__tests__/security.test.ts
describe('Upload Security Pipeline', () => {
  describe('File Validation', () => {
    it('should reject files with path traversal attempts', async () => {
      const file = new File(['content'], '../../../etc/passwd');
      const result = await validator.process(file);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid file name');
    });
    
    it('should detect mime type mismatches', async () => {
      const file = new File(['<script>alert(1)</script>'], 'image.jpg', {
        type: 'image/jpeg'
      });
      const result = await validator.process(file);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File type mismatch');
    });
    
    it('should validate magic numbers', async () => {
      const file = createFileWithHeader('GIF89a', 'test.exe');
      const result = await validator.process(file);
      expect(result.valid).toBe(false);
    });
  });
  
  describe('Malware Scanning', () => {
    it('should detect EICAR test virus', async () => {
      const eicar = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
      const file = new File([eicar], 'test.txt');
      const result = await scanner.process(file);
      expect(result.clean).toBe(false);
      expect(result.threats).toContain('EICAR-Test-File');
    });
  });
  
  describe('Content Disarm & Reconstruction', () => {
    it('should strip EXIF data from images', async () => {
      const imageWithExif = await loadTestImage('with-exif.jpg');
      const cleaned = await cdr.process(imageWithExif);
      const exifData = await extractExif(cleaned);
      expect(exifData).toBeNull();
    });
    
    it('should remove embedded scripts from PDFs', async () => {
      const pdfWithScript = await loadTestPdf('with-javascript.pdf');
      const cleaned = await cdr.process(pdfWithScript);
      const hasScripts = await detectPdfScripts(cleaned);
      expect(hasScripts).toBe(false);
    });
  });
});
```

#### Performance Testing
```typescript
// src/services/upload/__tests__/performance.test.ts
describe('Upload Performance', () => {
  it('should handle large file uploads efficiently', async () => {
    const largeFile = createLargeFile(100 * 1024 * 1024); // 100MB
    const startTime = Date.now();
    
    const result = await uploader.upload([largeFile], {
      strategy: 'chunked'
    });
    
    const duration = Date.now() - startTime;
    expect(result[0].status).toBe('success');
    expect(duration).toBeLessThan(30000); // 30 seconds
  });
  
  it('should handle concurrent uploads', async () => {
    const files = Array.from({ length: 5 }, (_, i) => 
      createFile(`file-${i}.jpg`, 10 * 1024 * 1024) // 10MB each
    );
    
    const results = await Promise.all(
      files.map(file => uploader.upload([file]))
    );
    
    expect(results.every(r => r[0].status === 'success')).toBe(true);
  });
  
  it('should resume interrupted uploads', async () => {
    const file = createLargeFile(50 * 1024 * 1024); // 50MB
    const uploadId = await uploader.initializeUpload(file);
    
    // Upload first 20MB
    await uploadPartialFile(uploadId, file, 0, 20 * 1024 * 1024);
    
    // Simulate interruption
    await wait(1000);
    
    // Resume upload
    const result = await uploader.resumeUpload(uploadId);
    expect(result.status).toBe('success');
    expect(result.bytesResumedFrom).toBe(20 * 1024 * 1024);
  });
});
```

### 7. Monitoring & Analytics

#### Upload Metrics Collection
```typescript
// src/services/upload/metrics/UploadMetrics.ts
export class UploadMetrics {
  async recordUpload(event: UploadEvent): Promise<void> {
    // Record to Prometheus
    uploadCounter.inc({
      status: event.status,
      fileType: event.fileType,
      strategy: event.strategy
    });
    
    uploadDuration.observe({
      fileType: event.fileType,
      size: event.fileSize
    }, event.duration);
    
    uploadSize.observe(event.fileSize);
    
    // Record to analytics
    await analytics.track('file_uploaded', {
      userId: event.userId,
      tenantId: event.tenantId,
      fileType: event.fileType,
      fileSize: event.fileSize,
      duration: event.duration,
      strategy: event.strategy,
      errors: event.errors
    });
  }
  
  async getUploadStats(timeRange: TimeRange): Promise<UploadStats> {
    const stats = await prometheus.query({
      metric: 'upload_total',
      timeRange,
      groupBy: ['status', 'fileType']
    });
    
    return {
      totalUploads: stats.total,
      successRate: stats.success / stats.total,
      averageDuration: stats.avgDuration,
      totalBytes: stats.totalBytes,
      byFileType: stats.groupedResults
    };
  }
}
```

## Deployment Plan

### Phase 1: Foundation (Week 1-2)
1. Implement core upload service architecture
2. Set up security pipeline with basic validation
3. Create direct upload strategy
4. Build minimal UI component

### Phase 2: Security (Week 3-4)
1. Integrate malware scanning (ClamAV)
2. Implement CDR for images and PDFs
3. Add advanced validation rules
4. Security testing suite

### Phase 3: Performance (Week 5-6)
1. Implement chunked upload strategy
2. Add client-side optimization
3. Build progress tracking system
4. Performance testing

### Phase 4: User Experience (Week 7-8)
1. Create all UI variants
2. Add preview and editing features
3. Implement accessibility features
4. Integration testing

### Phase 5: Production (Week 9-10)
1. Deploy to staging environment
2. Load testing and optimization
3. Security audit
4. Production deployment

## Success Metrics

1. **Security**: 0% malware/injection bypass rate
2. **Performance**: <30s for 100MB uploads on 10Mbps connection
3. **Reliability**: 99.9% upload success rate
4. **User Experience**: <3 clicks to complete upload
5. **Accessibility**: WCAG 2.1 AA compliance

## Conclusion

This implementation plan provides a comprehensive roadmap for building a secure, performant, and user-friendly universal media uploader. The modular architecture ensures flexibility while maintaining high security standards throughout the upload pipeline.