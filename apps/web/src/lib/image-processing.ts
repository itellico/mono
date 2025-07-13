/**
 * Image processing utilities for thumbnail generation and optimization
 * Uses Sharp.js for high-performance image processing
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { generateThumbnailPath, getAllThumbnailUrls, updateMediaAssetWithThumbnails } from './media-utils';
import type { ThumbnailSize } from './media-utils';
import { logger } from '@/lib/logger';

const THUMBNAIL_SIZES = {
  small: 150,
  medium: 300,
  large: 600
} as const;

/**
 * Generate thumbnails for an uploaded image
 */
export async function generateImageThumbnails(filePath: string): Promise<{
  success: boolean;
  thumbnails: Record<ThumbnailSize, { path: string; size: string; fileSize: number }>;
  compressed?: { path: string; format: string; fileSize: number };
  error?: string;
}> {
  try {
    const thumbnails: Record<ThumbnailSize, any> = {} as any;
    const publicPath = path.join(process.cwd(), 'public');
    const fullFilePath = path.join(publicPath, filePath);

    // Check if original file exists
    await fs.access(fullFilePath);

    // Generate thumbnails for each size
    for (const [sizeName, dimension] of Object.entries(THUMBNAIL_SIZES)) {
      const thumbnailPath = generateThumbnailPath(filePath, sizeName as ThumbnailSize);
      const fullThumbnailPath = path.join(publicPath, thumbnailPath);

      // Create thumbnail using Sharp
      await sharp(fullFilePath)
        .resize(dimension, dimension, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toFile(fullThumbnailPath);

      // Get file size
      const stats = await fs.stat(fullThumbnailPath);

      thumbnails[sizeName as ThumbnailSize] = {
        path: thumbnailPath,
        size: `${dimension}x${dimension}`,
        fileSize: stats.size
      };
    }

    // Generate WebP compressed version
    const compressedPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp').replace(/([^/]+)$/, 'compressed_$1');
    const fullCompressedPath = path.join(publicPath, compressedPath);

    await sharp(fullFilePath)
      .webp({ quality: 80 })
      .toFile(fullCompressedPath);

    const compressedStats = await fs.stat(fullCompressedPath);

    return {
      success: true,
      thumbnails,
      compressed: {
        path: compressedPath,
        format: 'webp',
        fileSize: compressedStats.size
      }
    };

  } catch (error: any) {
    return {
      success: false,
      thumbnails: {} as any,
      error: error.message
    };
  }
}

/**
 * Generate video thumbnail (first frame)
 */
export async function generateVideoThumbnail(filePath: string): Promise<{
  success: boolean;
  thumbnail?: { path: string; fileSize: number };
  error?: string;
}> {
  try {
    // For video thumbnails, we'll extract the first frame
    // This would typically use ffmpeg, but for now we'll create a placeholder
    const thumbnailPath = filePath.replace(/\.(mp4|mov|avi)$/i, '_thumb.jpg');
    const publicPath = path.join(process.cwd(), 'public');
    const fullThumbnailPath = path.join(publicPath, thumbnailPath);

    // TODO: Implement actual video thumbnail extraction with ffmpeg
    // For now, create a placeholder thumbnail
    await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 3,
        background: { r: 100, g: 100, b: 100 }
      }
    })
    .jpeg()
    .toFile(fullThumbnailPath);

    const stats = await fs.stat(fullThumbnailPath);

    return {
      success: true,
      thumbnail: {
        path: thumbnailPath,
        fileSize: stats.size
      }
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process image with compression and thumbnail generation
 */
export async function processImageFile(
  filePath: string,
  processingType: 'thumbnail' | 'compression' = 'thumbnail'
): Promise<{
  success: boolean;
  results: any;
  error?: string;
}> {
  try {
    if (processingType === 'thumbnail') {
      const thumbnailResults = await generateImageThumbnails(filePath);

      return {
        success: thumbnailResults.success,
        results: {
          thumbnails: thumbnailResults.thumbnails,
          compressed: thumbnailResults.compressed,
          processingType: 'thumbnail'
        },
        error: thumbnailResults.error
      };
    } else {
      // Compression only
      const publicPath = path.join(process.cwd(), 'public');
      const fullFilePath = path.join(publicPath, filePath);
      const compressedPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp').replace(/([^/]+)$/, 'compressed_$1');
      const fullCompressedPath = path.join(publicPath, compressedPath);

      await sharp(fullFilePath)
        .webp({ quality: 75 })
        .toFile(fullCompressedPath);

      const stats = await fs.stat(fullCompressedPath);

      return {
        success: true,
        results: {
          compressed: {
            path: compressedPath,
            format: 'webp',
            fileSize: stats.size
          },
          processingType: 'compression'
        }
      };
    }

  } catch (error: any) {
    return {
      success: false,
      results: null,
      error: error.message
    };
  }
}

/**
 * Clean up failed processing files
 */
export async function cleanupFailedProcessing(filePath: string): Promise<void> {
  try {
    const publicPath = path.join(process.cwd(), 'public');

    // Clean up any partial thumbnail files
    for (const size of Object.keys(THUMBNAIL_SIZES)) {
      const thumbnailPath = generateThumbnailPath(filePath, size as ThumbnailSize);
      const fullThumbnailPath = path.join(publicPath, thumbnailPath);

      try {
        await fs.unlink(fullThumbnailPath);
      } catch {
        // File might not exist, ignore
      }
    }

    // Clean up compressed file
    const compressedPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp').replace(/([^/]+)$/, 'compressed_$1');
    const fullCompressedPath = path.join(publicPath, compressedPath);

    try {
      await fs.unlink(fullCompressedPath);
    } catch {
      // File might not exist, ignore
    }

  } catch (error) {
          logger.error('Failed to cleanup processing files', { error: error.message });
  }
} 