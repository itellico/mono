/**
 * Media Upload Service
 * Centralized service for handling media uploads with tenant isolation
 */

// ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
// ❌ REMOVED: Direct database imports (architectural violation)
// import { db } from '@/lib/database';
// import { mediaAssets, mediaProcessing } from '@/lib/schema';
import { logger } from '@/lib/logger';
import { ApiAuthService } from '@/lib/api-clients/api-auth.service';
import crypto from 'crypto';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mov', 'video/avi'];
const ALLOWED_AUDIO_TYPES = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'text/plain'];

const ALL_ALLOWED_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_AUDIO_TYPES,
  ...ALLOWED_DOCUMENT_TYPES
];

export interface UploadOptions {
  tenantId: number;
  userId: number;
  context: string;
  contextId?: string;
  slotId?: string;
}

export interface UploadResult {
  id: number;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  cdnUrl: string;
  processingStatus: string;
  jobId?: string;
  metadata?: any;
}

class MediaUploadService {

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file exists
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    // Check file type
    if (!ALL_ALLOWED_TYPES.includes(file.type)) {
      return { 
        valid: false, 
        error: `File type ${file.type} not allowed. Allowed types: ${ALL_ALLOWED_TYPES.join(', ')}` 
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `File size ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      };
    }

    return { valid: true };
  }

  /**
   * Get media type from mime type
   */
  getMediaType(mimeType: string): 'photo' | 'video' | 'audio' | 'document' {
    if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'photo';
    if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return 'video';
    if (ALLOWED_AUDIO_TYPES.includes(mimeType)) return 'audio';
    if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) return 'document';
    return 'photo'; // fallback
  }

  /**
   * Get picture type from context
   */
  getPictureType(context: string, slotId?: string): 'profile_picture' | 'model_book' | 'set_card' | 'application_photo' | 'verification_photo' {
    if (context === 'profile_picture') return 'profile_picture';
    if (context === 'compcard' && slotId) return 'set_card';
    if (context === 'portfolio') return 'model_book';
    if (context === 'voice_portfolio') return 'model_book';
    if (context === 'application') return 'application_photo';
    if (context === 'job_submission') return 'application_photo';
    if (context === 'document') return 'verification_photo';
    return 'model_book'; // Default fallback
  }

  /**
   * Generate file hash
   */
  generateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Generate directory hash
   */
  generateDirectoryHash(userId: number, mediaType: string): string {
    const combined = userId.toString() + mediaType + Date.now().toString();
    return crypto.createHash('md5').update(combined).digest('hex').substring(0, 10);
  }

  /**
   * Generate CDN URL for file
   */
  generateCdnUrl(directoryHash: string, fileName: string): string {
    // For local development, use the local media path
    if (process.env.NODE_ENV === 'development') {
      return `/media/${directoryHash}/${fileName}`;
    }
    // For production, this would be the CDN URL
    return `${process.env.CDN_BASE_URL || '/media'}/${directoryHash}/${fileName}`;
  }

  /**
   * Save file to storage
   */
  async saveFile(buffer: Buffer, directoryHash: string, fileName: string): Promise<void> {
    try {
      // Create directory structure
      const uploadDir = `./public/media/${directoryHash}`;
      await mkdir(uploadDir, { recursive: true });

      // Write file
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      logger.info('File saved successfully', { 
        filePath: filePath.replace('./public', ''),
        fileSize: buffer.length 
      });
    } catch (error) {
      logger.error('Failed to save file', { error, directoryHash, fileName });
      throw error;
    }
  }

  /**
   * Upload file with full processing
   */
  async uploadFile(file: File, options: UploadOptions): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Generate hashes and metadata
      const fileHash = this.generateFileHash(buffer);
      const mediaType = this.getMediaType(file.type);
      const directoryHash = this.generateDirectoryHash(options.userId, mediaType);
      const pictureType = this.getPictureType(options.context, options.slotId);

      // Generate file name and CDN URL
      const fileExtension = path.extname(file.name).toLowerCase();
      const fileName = `${directoryHash}_${fileHash}${fileExtension}`;
      const cdnUrl = this.generateCdnUrl(directoryHash, fileName);

      // Save file to storage
      await this.saveFile(buffer, directoryHash, fileName);

      // Save to database via API
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v2/admin/media-assets`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: options.tenantId,
          userId: options.userId,
          fileName,
          originalName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          mediaType,
          directoryHash,
          fileHash,
          pictureType,
          isProcessed: false,
          processingStatus: 'pending',
          metadata: {},
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save media asset: ${response.statusText}`);
      }

      const data = await response.json();
      const mediaAsset = data.data || data;

      logger.info('Media asset created', { 
        id: mediaAsset.id, 
        fileName, 
        userId: options.userId,
        tenantId: options.tenantId
      });

      return {
        id: mediaAsset.id,
        fileName: mediaAsset.fileName,
        originalName: mediaAsset.originalName,
        mimeType: mediaAsset.mimeType,
        fileSize: mediaAsset.fileSize,
        cdnUrl,
        processingStatus: mediaAsset.processingStatus,
        metadata: mediaAsset.metadata
      };

    } catch (error) {
      logger.error('Upload failed', { error, options });
      throw error;
    }
  }
}

// Export singleton instance
export const mediaUploadService = new MediaUploadService(); 