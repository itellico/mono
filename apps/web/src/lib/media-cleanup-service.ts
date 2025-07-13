import { db } from '@/lib/db';
import { mediaAssets } from '@/lib/schema';
import { eq, and, lt, isNotNull, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export interface CleanupOptions {
  retentionPeriod?: 'immediate' | '24h' | 'custom';
  customRetentionHours?: number;
  batchSize?: number;
  includeVariants?: boolean;
}

export interface CleanupResult {
  success: boolean;
  markedForDeletion: number;
  filesScheduledForCleanup: number;
  errors: string[];
}

/**
 * Two-Phase Media Cleanup Service
 * 
 * Phase 1: Mark as pending_deletion (immediate, hides from UI)
 * Phase 2: Background cleanup of files, then remove DB record
 * 
 * This prevents broken images during cleanup window
 */
export class MediaCleanupService {

  /**
   * Phase 1: Mark media assets for deletion (immediate)
   * This hides them from UI immediately but keeps files intact
   */
  async markForDeletion(
    mediaIds: number[],
    requestedBy: number,
    options: CleanupOptions = {}
  ): Promise<CleanupResult> {
    const result: CleanupResult = {
      success: true,
      markedForDeletion: 0,
      filesScheduledForCleanup: 0,
      errors: []
    };

    try {
      logger.info('Starting Phase 1: Marking media assets for deletion', {
        mediaIds,
        requestedBy,
        options
      });

      // Phase 1: Mark as pending_deletion in database
      const updateResult = await db
        .update(mediaAssets)
        .set({
          deletionStatus: 'pending_deletion',
          deletionRequestedAt: new Date(),
          deletionRequestedBy: requestedBy,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(mediaAssets.deletionStatus, 'active'),
            // Use IN clause for multiple IDs
            mediaIds.length === 1 
              ? eq(mediaAssets.id, mediaIds[0])
              : sql`${mediaAssets.id} = ANY(${mediaIds})`
          )
        )
        .returning({
          id: mediaAssets.id,
          fileName: mediaAssets.fileName,
          directoryHash: mediaAssets.directoryHash,
          fileHash: mediaAssets.fileHash,
          pictureType: mediaAssets.pictureType
        });

      result.markedForDeletion = updateResult.length;

      logger.info('Phase 1 completed: Media assets marked for deletion', {
        markedCount: result.markedForDeletion,
        mediaIds: updateResult.map(m => m.id)
      });

      // Phase 2: Schedule background file cleanup
      if (updateResult.length > 0) {
        const retentionHours = this.getRetentionHours(options);

        // For now, we'll implement immediate cleanup
        // TODO: Integrate with PG Boss for proper background processing
        if (retentionHours === 0) {
          const cleanupResult = await this.executeCleanup({
            mediaAssets: updateResult,
            requestedBy,
            options,
            markedAt: new Date().toISOString()
          });

          result.filesScheduledForCleanup = cleanupResult.filesScheduledForCleanup;
          if (!cleanupResult.success) {
            result.errors.push(...cleanupResult.errors);
          }
        } else {
          // For delayed cleanup, we would schedule a job here
          logger.info('Delayed cleanup scheduled', {
            retentionHours,
            scheduledCount: updateResult.length
          });
          result.filesScheduledForCleanup = updateResult.length;
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Failed to mark media for deletion: ${error instanceof Error ? error.message : 'Unknown error'}`);

      logger.error('Phase 1 failed: Error marking media for deletion', {
        error: error instanceof Error ? error.message : 'Unknown error',
        mediaIds,
        requestedBy
      });
    }

    return result;
  }

  /**
   * Phase 2: Background cleanup of files and database records
   * Called by PG Boss job handler or immediately for instant cleanup
   */
  async executeCleanup(jobData: {
    mediaAssets: Array<{
      id: number;
      fileName: string;
      directoryHash: string;
      fileHash: string;
      pictureType: string | null;
    }>;
    requestedBy: number;
    options: CleanupOptions;
    markedAt: string;
  }): Promise<CleanupResult> {
    const result: CleanupResult = {
      success: true,
      markedForDeletion: 0,
      filesScheduledForCleanup: 0,
      errors: []
    };

    const { mediaAssets: assets, requestedBy, options } = jobData;

    try {
      logger.info('Starting Phase 2: Background file cleanup', {
        assetCount: assets.length,
        requestedBy,
        markedAt: jobData.markedAt
      });

      // Step 1: Delete files from storage
      const fileCleanupResults = await Promise.allSettled(
        assets.map(asset => this.deleteFileVariants(asset, options))
      );

      // Step 2: Process cleanup results
      const successfulCleanups: number[] = [];
      const failedCleanups: Array<{ id: number; error: string }> = [];

      fileCleanupResults.forEach((promiseResult, index) => {
        const asset = assets[index];
        if (promiseResult.status === 'fulfilled' && promiseResult.value.success) {
          successfulCleanups.push(asset.id);
        } else {
          const error = promiseResult.status === 'rejected' 
            ? promiseResult.reason 
            : promiseResult.value.errors.join(', ');
          failedCleanups.push({ id: asset.id, error });
          result.errors.push(`Asset ${asset.id}: ${error}`);
        }
      });

      // Step 3: Update database for successful cleanups
      if (successfulCleanups.length > 0) {
        await db
          .update(mediaAssets)
          .set({
            deletionStatus: 'deleted',
            deletionCompletedAt: new Date(),
            updatedAt: new Date()
          })
          .where(
            and(
              eq(mediaAssets.deletionStatus, 'pending_deletion'),
              successfulCleanups.length === 1
                ? eq(mediaAssets.id, successfulCleanups[0])
                : sql`${mediaAssets.id} = ANY(${successfulCleanups})`
            )
          );

        logger.info('Phase 2 completed: Files cleaned and database updated', {
          successfulCleanups: successfulCleanups.length,
          failedCleanups: failedCleanups.length
        });
      }

      // Step 4: Handle failed cleanups (retry or alert)
      if (failedCleanups.length > 0) {
        logger.warn('Phase 2 partial failure: Some files could not be cleaned', {
          failedCleanups,
          willRetry: true
        });

        // Failed cleanups remain in pending_deletion status for retry
        result.success = false;
        result.errors.push(`Failed to clean ${failedCleanups.length} files`);
      }

      result.filesScheduledForCleanup = successfulCleanups.length;

    } catch (error) {
      result.success = false;
      result.errors.push(`Background cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      logger.error('Phase 2 failed: Background cleanup error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        assetCount: assets.length
      });
    }

    return result;
  }

  /**
   * Delete file and all its variants from storage
   */
  private async deleteFileVariants(
    asset: {
      fileName: string;
      directoryHash: string;
      fileHash: string;
      pictureType: string | null;
    },
    options: CleanupOptions
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Construct file paths based on current system
      const basePath = this.constructFilePath(asset);
      const filesToDelete = options.includeVariants !== false 
        ? this.getFileVariants(basePath, asset.fileName)
        : [basePath];

      logger.debug('Deleting file variants', {
        basePath,
        variantCount: filesToDelete.length,
        includeVariants: options.includeVariants
      });

      // Delete each file variant
      const deleteResults = await Promise.allSettled(
        filesToDelete.map(filePath => this.deleteFile(filePath))
      );

      // Process results
      deleteResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          errors.push(`Failed to delete ${filesToDelete[index]}: ${result.reason}`);
        }
      });

      return {
        success: errors.length === 0,
        errors
      };

    } catch (error) {
      errors.push(`Variant deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  /**
   * Get all file variants for a given base path
   */
  private getFileVariants(basePath: string, fileName: string): string[] {
    const variants: string[] = [basePath]; // Original file

    // Add common variants based on file structure seen in logs
    const baseDir = basePath.substring(0, basePath.lastIndexOf('/'));
    const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const ext = fileName.substring(fileName.lastIndexOf('.'));

    // Compressed versions
    variants.push(`${baseDir}/compressed_${fileNameWithoutExt}.webp`);

    // Thumbnails
    variants.push(`${baseDir}/thumb_150_${fileNameWithoutExt}${ext}`);
    variants.push(`${baseDir}/thumb_300_${fileNameWithoutExt}${ext}`);
    variants.push(`${baseDir}/thumb_600_${fileNameWithoutExt}${ext}`);

    return variants;
  }

  /**
   * Construct file path from asset data
   */
  private constructFilePath(asset: {
    directoryHash: string;
    fileHash: string;
    fileName: string;
  }): string {
    // Parse directory hash to get date components
    const dirHash = asset.directoryHash;
    const year = dirHash.substring(0, 3);
    const month = dirHash.substring(3, 5);
    const day = dirHash.substring(5, 7);
    const hour = dirHash.substring(7, 9);

    return `/media/path/${year}/${month}/${day}/${hour}/${dirHash}_${asset.fileHash}.${asset.fileName.split('.').pop()}`;
  }

  /**
   * Delete a single file from storage
   */
  private async deleteFile(filePath: string): Promise<void> {
    // Implementation depends on storage system (S3, local filesystem, etc.)
    // For now, this is a placeholder that logs the deletion
    logger.debug('Deleting file', { filePath });

    // TODO: Implement actual file deletion based on storage system
    // Example for S3:
    // await s3Client.deleteObject({ Bucket: 'your-bucket', Key: filePath });

    // Example for local filesystem:
    // await fs.unlink(filePath);

    // For now, simulate successful deletion
    return Promise.resolve();
  }

  /**
   * Get retention period in hours
   */
  private getRetentionHours(options: CleanupOptions): number {
    switch (options.retentionPeriod) {
      case 'immediate':
        return 0;
      case '24h':
        return 24;
      case 'custom':
        return options.customRetentionHours || 24;
      default:
        return 24; // Default to 24 hours
    }
  }

  /**
   * Clean up orphaned pending deletions (maintenance task)
   */
  async cleanupOrphanedDeletions(olderThanHours: number = 48): Promise<CleanupResult> {
    const result: CleanupResult = {
      success: true,
      markedForDeletion: 0,
      filesScheduledForCleanup: 0,
      errors: []
    };

    try {
      const cutoffDate = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));

      // Find orphaned pending deletions
      const orphanedAssets = await db
        .select({
          id: mediaAssets.id,
          fileName: mediaAssets.fileName,
          directoryHash: mediaAssets.directoryHash,
          fileHash: mediaAssets.fileHash,
          pictureType: mediaAssets.pictureType
        })
        .from(mediaAssets)
        .where(
          and(
            eq(mediaAssets.deletionStatus, 'pending_deletion'),
            lt(mediaAssets.deletionRequestedAt, cutoffDate),
            isNotNull(mediaAssets.deletionRequestedAt)
          )
        );

      if (orphanedAssets.length > 0) {
        logger.info('Found orphaned pending deletions', {
          count: orphanedAssets.length,
          olderThanHours
        });

        // Force cleanup of orphaned assets
        const cleanupResult = await this.executeCleanup({
          mediaAssets: orphanedAssets,
          requestedBy: 0, // System cleanup
          options: { retentionPeriod: 'immediate' },
          markedAt: new Date().toISOString()
        });

        result.filesScheduledForCleanup = cleanupResult.filesScheduledForCleanup;
        result.errors = cleanupResult.errors;
        result.success = cleanupResult.success;
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Orphaned cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      logger.error('Orphaned cleanup failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        olderThanHours
      });
    }

    return result;
  }
}

// Export singleton instance
export const mediaCleanupService = new MediaCleanupService(); 