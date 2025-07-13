/**
 * Upload Settings Service
 * 
 * Provides type-safe access to hierarchical upload settings with validation.
 * Integrates with the universal media uploader components.
 */

import { HierarchicalSettingsService } from '@/lib/hierarchical-settings';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PictureSettings {
  maxFileSizeMB: number;
  allowedFormats: string[];
  minWidth: number;
  minHeight: number;
  compressionQuality: number;
  autoOptimize: boolean;
  stripExif: boolean;
  generateThumbnails: boolean;
}

export interface VideoSettings {
  maxFileSizeMB: number;
  allowedFormats: string[];
  maxDurationMinutes: number;
  minResolutionWidth: number;
  minResolutionHeight: number;
  autoTranscode: boolean;
  generateThumbnails: boolean;
}

export interface AudioSettings {
  maxFileSizeMB: number;
  allowedFormats: string[];
  maxDurationMinutes: number;
  minBitrateKbps: number;
}

export interface DocumentSettings {
  maxFileSizeMB: number;
  allowedFormats: string[];
}

export interface GeneralUploadSettings {
  totalSizeLimitMB: number;
  concurrentLimit: number;
  chunkSizeMB: number;
  requireVirusScan: boolean;
  allowedContexts: string[];
}

export interface AllUploadSettings {
  picture: PictureSettings;
  video: VideoSettings;
  audio: AudioSettings;
  document: DocumentSettings;
  general: GeneralUploadSettings;
}

export interface UploadValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  effectiveSettings: Partial<AllUploadSettings>;
}

// ============================================================================
// UPLOAD SETTINGS SERVICE
// ============================================================================

export class UploadSettingsService {
  private settingsService: HierarchicalSettingsService;

  constructor(tenantId?: number, userId?: number) {
    this.settingsService = new HierarchicalSettingsService(tenantId, userId);
  }

  // ============================================================================
  // GETTERS - Retrieve effective settings with inheritance
  // ============================================================================

  /**
   * Get all upload settings for a context (profile picture, portfolio, etc.)
   */
  async getUploadSettings(context: string): Promise<AllUploadSettings> {
    try {
      const [picture, video, audio, document, general] = await Promise.all([
        this.getPictureSettings(),
        this.getVideoSettings(),
        this.getAudioSettings(),
        this.getDocumentSettings(),
        this.getGeneralSettings()
      ]);

      return { picture, video, audio, document, general };
    } catch (error) {
      logger.error('Failed to get upload settings', { context, error: error.message });
      throw error;
    }
  }

  /**
   * Get picture/image upload settings
   */
  async getPictureSettings(): Promise<PictureSettings> {
    const category = 'media';
    
    const [
      maxFileSizeMB,
      allowedFormats,
      minWidth,
      minHeight,
      compressionQuality,
      autoOptimize,
      stripExif,
      generateThumbnails
    ] = await Promise.all([
      this.settingsService.getSetting('picture_max_file_size_mb', category),
      this.settingsService.getSetting('picture_allowed_formats', category),
      this.settingsService.getSetting('picture_min_width', category),
      this.settingsService.getSetting('picture_min_height', category),
      this.settingsService.getSetting('picture_compression_quality', category),
      this.settingsService.getSetting('picture_auto_optimize', category),
      this.settingsService.getSetting('picture_strip_exif', category),
      this.settingsService.getSetting('picture_generate_thumbnails', category)
    ]);

    return {
      maxFileSizeMB: maxFileSizeMB ?? 25,
      allowedFormats: allowedFormats ?? ['image/jpeg', 'image/png', 'image/webp'],
      minWidth: minWidth ?? 200,
      minHeight: minHeight ?? 200,
      compressionQuality: compressionQuality ?? 85,
      autoOptimize: autoOptimize ?? true,
      stripExif: stripExif ?? true,
      generateThumbnails: generateThumbnails ?? true
    };
  }

  /**
   * Get video upload settings
   */
  async getVideoSettings(): Promise<VideoSettings> {
    const category = 'media';
    
    const [
      maxFileSizeMB,
      allowedFormats,
      maxDurationMinutes,
      minResolutionWidth,
      minResolutionHeight,
      autoTranscode,
      generateThumbnails
    ] = await Promise.all([
      this.settingsService.getSetting('video_max_file_size_mb', category),
      this.settingsService.getSetting('video_allowed_formats', category),
      this.settingsService.getSetting('video_max_duration_minutes', category),
      this.settingsService.getSetting('video_min_resolution_width', category),
      this.settingsService.getSetting('video_min_resolution_height', category),
      this.settingsService.getSetting('video_auto_transcode', category),
      this.settingsService.getSetting('video_generate_thumbnails', category)
    ]);

    return {
      maxFileSizeMB: maxFileSizeMB ?? 500,
      allowedFormats: allowedFormats ?? ['video/mp4', 'video/quicktime', 'video/webm'],
      maxDurationMinutes: maxDurationMinutes ?? 15,
      minResolutionWidth: minResolutionWidth ?? 640,
      minResolutionHeight: minResolutionHeight ?? 360,
      autoTranscode: autoTranscode ?? true,
      generateThumbnails: generateThumbnails ?? true
    };
  }

  /**
   * Get audio upload settings
   */
  async getAudioSettings(): Promise<AudioSettings> {
    const category = 'media';
    
    const [
      maxFileSizeMB,
      allowedFormats,
      maxDurationMinutes,
      minBitrateKbps
    ] = await Promise.all([
      this.settingsService.getSetting('audio_max_file_size_mb', category),
      this.settingsService.getSetting('audio_allowed_formats', category),
      this.settingsService.getSetting('audio_max_duration_minutes', category),
      this.settingsService.getSetting('audio_min_bitrate_kbps', category)
    ]);

    return {
      maxFileSizeMB: maxFileSizeMB ?? 50,
      allowedFormats: allowedFormats ?? ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/m4a'],
      maxDurationMinutes: maxDurationMinutes ?? 10,
      minBitrateKbps: minBitrateKbps ?? 128
    };
  }

  /**
   * Get document upload settings
   */
  async getDocumentSettings(): Promise<DocumentSettings> {
    const category = 'media';
    
    const [maxFileSizeMB, allowedFormats] = await Promise.all([
      this.settingsService.getSetting('document_max_file_size_mb', category),
      this.settingsService.getSetting('document_allowed_formats', category)
    ]);

    return {
      maxFileSizeMB: maxFileSizeMB ?? 25,
      allowedFormats: allowedFormats ?? ['application/pdf']
    };
  }

  /**
   * Get general upload settings
   */
  async getGeneralSettings(): Promise<GeneralUploadSettings> {
    const category = 'media';
    
    const [
      totalSizeLimitMB,
      concurrentLimit,
      chunkSizeMB,
      requireVirusScan,
      allowedContexts
    ] = await Promise.all([
      this.settingsService.getSetting('upload_total_size_limit_mb', category),
      this.settingsService.getSetting('upload_concurrent_limit', category),
      this.settingsService.getSetting('upload_chunk_size_mb', category),
      this.settingsService.getSetting('upload_require_virus_scan', category),
      this.settingsService.getSetting('upload_allowed_contexts', category)
    ]);

    return {
      totalSizeLimitMB: totalSizeLimitMB ?? 1000,
      concurrentLimit: concurrentLimit ?? 3,
      chunkSizeMB: chunkSizeMB ?? 5,
      requireVirusScan: requireVirusScan ?? false,
      allowedContexts: allowedContexts ?? ['profile_picture', 'portfolio_image', 'portfolio_video', 'comp_card', 'documents', 'media_assets']
    };
  }

  // ============================================================================
  // VALIDATION - Validate files against effective settings
  // ============================================================================

  /**
   * Validate a file against current upload settings
   */
  async validateFile(
    file: File, 
    context: string,
    mediaType: 'picture' | 'video' | 'audio' | 'document'
  ): Promise<UploadValidationResult> {
    try {
      const settings = await this.getUploadSettings(context);
      const result: UploadValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        effectiveSettings: settings
      };

      // Get media type settings
      const mediaSettings = settings[mediaType];
      if (!mediaSettings) {
        result.errors.push(`Media type '${mediaType}' not supported`);
        result.isValid = false;
        return result;
      }

      // Validate file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > mediaSettings.maxFileSizeMB) {
        result.errors.push(
          `File size ${fileSizeMB.toFixed(1)}MB exceeds maximum ${mediaSettings.maxFileSizeMB}MB`
        );
        result.isValid = false;
      }

      // Validate file type
      if (!mediaSettings.allowedFormats.includes(file.type)) {
        result.errors.push(
          `File type '${file.type}' not allowed. Allowed types: ${mediaSettings.allowedFormats.join(', ')}`
        );
        result.isValid = false;
      }

      // Context-specific validation
      if (!settings.general.allowedContexts.includes(context)) {
        result.errors.push(`Upload context '${context}' not allowed`);
        result.isValid = false;
      }

      // Additional validation based on media type
      if (mediaType === 'picture') {
        await this.validateImageFile(file, settings.picture, result);
      } else if (mediaType === 'video') {
        await this.validateVideoFile(file, settings.video, result);
      } else if (mediaType === 'audio') {
        await this.validateAudioFile(file, settings.audio, result);
      }

      return result;
    } catch (error) {
      logger.error('File validation failed', { 
        fileName: file.name, 
        context, 
        mediaType, 
        error: error.message 
      });
      
      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`],
        warnings: [],
        effectiveSettings: {}
      };
    }
  }

  /**
   * Validate multiple files for batch upload
   */
  async validateFiles(
    files: File[], 
    context: string
  ): Promise<{ valid: File[]; invalid: Array<{ file: File; errors: string[] }> }> {
    const valid: File[] = [];
    const invalid: Array<{ file: File; errors: string[] }> = [];

    for (const file of files) {
      // Determine media type from file
      const mediaType = this.getMediaTypeFromFile(file);
      const validation = await this.validateFile(file, context, mediaType);
      
      if (validation.isValid) {
        valid.push(file);
      } else {
        invalid.push({ file, errors: validation.errors });
      }
    }

    return { valid, invalid };
  }

  // ============================================================================
  // SETTINGS UPDATES - Update tenant settings within constraints
  // ============================================================================

  /**
   * Update tenant picture settings
   */
  async updatePictureSettings(
    settings: Partial<PictureSettings>,
    tenantId: number,
    modifiedBy: number
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    const successes: string[] = [];

    for (const [key, value] of Object.entries(settings)) {
      if (value === undefined) continue;

      const settingKey = `picture_${this.camelToSnake(key)}`;
      const result = await this.settingsService.updateTenantSetting(
        'media',
        settingKey,
        value,
        tenantId,
        modifiedBy
      );

      if (result.success) {
        successes.push(settingKey);
      } else {
        errors.push(...result.errors);
      }
    }

    return {
      success: errors.length === 0,
      errors
    };
  }

  /**
   * Update tenant video settings
   */
  async updateVideoSettings(
    settings: Partial<VideoSettings>,
    tenantId: number,
    modifiedBy: number
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const [key, value] of Object.entries(settings)) {
      if (value === undefined) continue;

      const settingKey = `video_${this.camelToSnake(key)}`;
      const result = await this.settingsService.updateTenantSetting(
        'media',
        settingKey,
        value,
        tenantId,
        modifiedBy
      );

      if (!result.success) {
        errors.push(...result.errors);
      }
    }

    return {
      success: errors.length === 0,
      errors
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private getMediaTypeFromFile(file: File): 'picture' | 'video' | 'audio' | 'document' {
    if (file.type.startsWith('image/')) return 'picture';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  private async validateImageFile(
    file: File, 
    settings: PictureSettings, 
    result: UploadValidationResult
  ): Promise<void> {
    // Create image to check dimensions
    try {
      const image = await this.createImageFromFile(file);
      
      if (image.naturalWidth < settings.minWidth) {
        result.errors.push(
          `Image width ${image.naturalWidth}px is below minimum ${settings.minWidth}px`
        );
        result.isValid = false;
      }

      if (image.naturalHeight < settings.minHeight) {
        result.errors.push(
          `Image height ${image.naturalHeight}px is below minimum ${settings.minHeight}px`
        );
        result.isValid = false;
      }

      // Warning for large images that will be compressed
      if (image.naturalWidth > 4000 || image.naturalHeight > 4000) {
        result.warnings.push('Large image will be automatically optimized');
      }
    } catch (error) {
      result.warnings.push('Could not verify image dimensions');
    }
  }

  private async validateVideoFile(
    file: File, 
    settings: VideoSettings, 
    result: UploadValidationResult
  ): Promise<void> {
    // For video validation, we'd need to load metadata
    // For now, just add warnings about processing
    result.warnings.push('Video will be processed and may take time to appear');
    
    if (settings.autoTranscode) {
      result.warnings.push('Video will be automatically converted to MP4');
    }
  }

  private async validateAudioFile(
    file: File, 
    settings: AudioSettings, 
    result: UploadValidationResult
  ): Promise<void> {
    // For audio validation, we'd need to load metadata
    // For now, just add processing warnings
    result.warnings.push('Audio file will be processed for optimal delivery');
  }

  private createImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get upload settings for a specific tenant/user context
 */
export async function getUploadSettings(
  context: string,
  tenantId?: number,
  userId?: number
): Promise<AllUploadSettings> {
  const service = new UploadSettingsService(tenantId, userId);
  return service.getUploadSettings(context);
}

/**
 * Validate a file against current settings
 */
export async function validateUploadFile(
  file: File,
  context: string,
  tenantId?: number,
  userId?: number
): Promise<UploadValidationResult> {
  const service = new UploadSettingsService(tenantId, userId);
  const mediaType = file.type.startsWith('image/') ? 'picture' :
                   file.type.startsWith('video/') ? 'video' :
                   file.type.startsWith('audio/') ? 'audio' : 'document';
  
  return service.validateFile(file, context, mediaType);
}

/**
 * Get configuration for UniversalFileUpload component
 */
export async function getUploadComponentConfig(
  context: string,
  mediaType: 'picture' | 'video' | 'audio' | 'document',
  tenantId?: number,
  userId?: number
) {
  const service = new UploadSettingsService(tenantId, userId);
  const settings = await service.getUploadSettings(context);
  const mediaSettings = settings[mediaType];

  return {
    context: context as any,
    resource: 'media',
    tenantId,
    accept: mediaSettings.allowedFormats,
    maxFiles: context === 'profile_picture' ? 1 : 10,
    maxSizeMB: mediaSettings.maxFileSizeMB,
    allowedTypes: mediaSettings.allowedFormats,
    enableMultiple: context !== 'profile_picture',
    enablePreview: true,
    enableProgress: true,
    enableTenantLimits: true
  };
}