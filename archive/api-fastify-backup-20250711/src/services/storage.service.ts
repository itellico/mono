import { join } from 'path';
import { mkdir, access, stat, readdir, unlink } from 'fs/promises';
import { createHash } from 'crypto';
import { config } from '../config/index';

export interface StorageConfig {
  tenantUuid: string;
  category: 'media' | 'artwork' | 'documents' | 'temp';
  context?: string; // profile_picture, model_book, logos, banners, etc.
}

export interface ArtworkUpload {
  tenantUuid: string;
  artworkType: 'logos' | 'banners' | 'backgrounds' | 'themes';
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
}

export interface StorageMetadata {
  path: string;
  relativePath: string;
  url: string;
  size: number;
  mimeType: string;
  hash: string;
  tenantUuid: string;
  category: string;
  context?: string;
}

/**
 * Comprehensive tenant-aware storage service
 * Implements secure, isolated file storage with proper directory structure
 */
export class StorageService {
  private readonly uploadDir: string;
  
  constructor() {
    this.uploadDir = config.UPLOAD_DIR;
  }

  /**
   * Generate secure file path with tenant isolation
   */
  generateStoragePath(storageConfig: StorageConfig, fileName: string, fileHash?: string): string {
    const { tenantUuid, category, context } = storageConfig;
    
    // Base category path
    let basePath: string;
    switch (category) {
      case 'media':
        basePath = config.MEDIA_PATH;
        break;
      case 'artwork':
        basePath = config.ARTWORK_PATH;
        break;
      case 'documents':
        basePath = config.DOCUMENTS_PATH;
        break;
      case 'temp':
        basePath = config.TEMP_PATH;
        break;
      default:
        throw new Error(`Invalid storage category: ${category}`);
    }

    // Build path segments
    const pathSegments = [this.uploadDir, basePath, tenantUuid];
    
    // Add context if provided (e.g., logos, banners, profile_picture)
    if (context) {
      pathSegments.push(context);
    }

    // Add hash-based subdirectories for better performance and organization
    if (fileHash) {
      const hashSegments = this.createHashPath(fileHash);
      pathSegments.push(...hashSegments);
    }

    pathSegments.push(fileName);
    
    return join(...pathSegments);
  }

  /**
   * Create hash-based subdirectory structure for performance
   * e.g., "abcdef123456" -> ["ab", "cd", "ef"]
   */
  private createHashPath(hash: string): string[] {
    const segments: string[] = [];
    for (let i = 0; i < Math.min(6, hash.length); i += 2) {
      segments.push(hash.substring(i, i + 2));
    }
    return segments;
  }

  /**
   * Calculate file hash for content deduplication
   */
  calculateFileHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Ensure directory structure exists
   */
  async ensureDirectoryExists(filePath: string): Promise<void> {
    const directory = join(filePath, '..');
    
    try {
      await access(directory);
    } catch {
      await mkdir(directory, { recursive: true });
    }
  }

  /**
   * Store file with tenant isolation and security checks
   */
  async storeFile(
    storageConfig: StorageConfig,
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<StorageMetadata> {
    // Calculate file hash for deduplication and security
    const fileHash = this.calculateFileHash(fileBuffer);
    
    // Generate secure storage path
    const fullPath = this.generateStoragePath(storageConfig, fileName, fileHash);
    
    // Ensure directory structure exists
    await this.ensureDirectoryExists(fullPath);
    
    // Write file to storage
    const fs = await import('fs/promises');
    await fs.writeFile(fullPath, fileBuffer);
    
    // Calculate relative path for URL generation
    const relativePath = fullPath.replace(this.uploadDir, '').replace(/^\//, '');
    
    // Generate metadata
    const metadata: StorageMetadata = {
      path: fullPath,
      relativePath,
      url: `/uploads/${relativePath}`, // Will be served by static file middleware
      size: fileBuffer.length,
      mimeType,
      hash: fileHash,
      tenantUuid: storageConfig.tenantUuid,
      category: storageConfig.category,
      context: storageConfig.context
    };

    return metadata;
  }

  /**
   * Store artwork with category-specific validation
   */
  async storeArtwork(upload: ArtworkUpload): Promise<StorageMetadata> {
    const { tenantUuid, artworkType, fileName, fileBuffer, mimeType } = upload;

    // Load platform config for artwork validation
    const platformConfig = await this.loadPlatformConfig();
    const artworkConfig = platformConfig?.storage?.artworkCategories?.[artworkType];

    if (artworkConfig) {
      // Validate file size
      if (fileBuffer.length > artworkConfig.maxSize) {
        throw new Error(`File too large. Maximum size for ${artworkType}: ${artworkConfig.maxSize} bytes`);
      }

      // Validate MIME type
      if (!artworkConfig.allowedTypes.includes(mimeType)) {
        throw new Error(`Invalid file type for ${artworkType}. Allowed: ${artworkConfig.allowedTypes.join(', ')}`);
      }
    }

    const storageConfig: StorageConfig = {
      tenantUuid,
      category: 'artwork',
      context: artworkType
    };

    return this.storeFile(storageConfig, fileName, fileBuffer, mimeType);
  }

  /**
   * List files for a tenant and category
   */
  async listTenantFiles(
    tenantUuid: string,
    category: 'media' | 'artwork' | 'documents' | 'temp',
    context?: string
  ): Promise<string[]> {
    const storageConfig: StorageConfig = { tenantUuid, category, context };
    const basePath = this.generateStoragePath(storageConfig, '').replace(/\/$/, '');
    
    try {
      const files = await this.getFilesRecursively(basePath);
      return files;
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return []; // Directory doesn't exist yet
      }
      throw error;
    }
  }

  /**
   * Recursively get all files in a directory
   */
  private async getFilesRecursively(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.getFilesRecursively(fullPath);
          files.push(...subFiles);
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Handle permission errors gracefully
      console.warn(`Cannot read directory ${dir}:`, error);
    }
    
    return files;
  }

  /**
   * Delete file with tenant isolation checks
   */
  async deleteFile(filePath: string, tenantUuid: string): Promise<boolean> {
    // Security check: ensure file belongs to tenant
    if (!filePath.includes(tenantUuid)) {
      throw new Error('Access denied: File does not belong to tenant');
    }

    // Security check: ensure file is within upload directory
    const absolutePath = join(this.uploadDir, filePath);
    if (!absolutePath.startsWith(this.uploadDir)) {
      throw new Error('Access denied: Invalid file path');
    }

    try {
      await unlink(absolutePath);
      return true;
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return false; // File doesn't exist
      }
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string): Promise<StorageMetadata | null> {
    try {
      const stats = await stat(filePath);
      const relativePath = filePath.replace(this.uploadDir, '').replace(/^\//, '');
      
      // Extract tenant UUID from path
      const pathParts = relativePath.split('/');
      const tenantUuid = pathParts[1]; // Assuming structure: category/tenantUuid/...
      const category = pathParts[0] as 'media' | 'artwork' | 'documents' | 'temp';
      const context = pathParts[2];

      return {
        path: filePath,
        relativePath,
        url: `/uploads/${relativePath}`,
        size: stats.size,
        mimeType: 'application/octet-stream', // Would need better detection
        hash: '', // Would need to calculate from file
        tenantUuid,
        category,
        context
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Clean up temporary files older than specified age
   */
  async cleanupTempFiles(maxAgeHours = 24): Promise<number> {
    const tempPath = join(this.uploadDir, config.TEMP_PATH);
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    let deletedCount = 0;
    
    try {
      const files = await this.getFilesRecursively(tempPath);
      
      for (const file of files) {
        try {
          const stats = await stat(file);
          if (stats.mtime < cutoffTime) {
            await unlink(file);
            deletedCount++;
          }
        } catch (error) {
          console.warn(`Failed to process temp file ${file}:`, error);
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup temp files:', error);
    }
    
    return deletedCount;
  }

  /**
   * Load platform configuration for validation
   */
  private async loadPlatformConfig(): Promise<any> {
    try {
      // Dynamic import to avoid circular dependencies
      const platformConfigPath = join(process.cwd(), '../../../platform.config.js');
      const { default: platformConfig } = await import(platformConfigPath);
      return platformConfig;
    } catch (error) {
      console.warn('Could not load platform config for storage validation:', error);
      return null;
    }
  }

  /**
   * Initialize storage directories for a new tenant
   */
  async initializeTenantStorage(tenantUuid: string): Promise<void> {
    const categories = ['media', 'artwork', 'documents', 'temp'] as const;
    
    for (const category of categories) {
      const storageConfig: StorageConfig = { tenantUuid, category };
      const basePath = this.generateStoragePath(storageConfig, '');
      await this.ensureDirectoryExists(basePath);
    }

    // Create artwork subdirectories
    const artworkTypes = ['logos', 'banners', 'backgrounds', 'themes'];
    for (const artworkType of artworkTypes) {
      const storageConfig: StorageConfig = { 
        tenantUuid, 
        category: 'artwork', 
        context: artworkType 
      };
      const artworkPath = this.generateStoragePath(storageConfig, '');
      await this.ensureDirectoryExists(artworkPath);
    }
  }

  /**
   * Get storage statistics for a tenant
   */
  async getTenantStorageStats(tenantUuid: string): Promise<{
    totalSize: number;
    fileCount: number;
    breakdown: Record<string, { size: number; count: number }>;
  }> {
    const categories = ['media', 'artwork', 'documents', 'temp'] as const;
    const breakdown: Record<string, { size: number; count: number }> = {};
    
    let totalSize = 0;
    let fileCount = 0;

    for (const category of categories) {
      const files = await this.listTenantFiles(tenantUuid, category);
      let categorySize = 0;
      
      for (const file of files) {
        try {
          const stats = await stat(file);
          categorySize += stats.size;
        } catch (error) {
          // Skip files that can't be accessed
        }
      }
      
      breakdown[category] = {
        size: categorySize,
        count: files.length
      };
      
      totalSize += categorySize;
      fileCount += files.length;
    }

    return { totalSize, fileCount, breakdown };
  }
}

export const storageService = new StorageService();