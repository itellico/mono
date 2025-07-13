/**
 * Media utilities for thumbnail generation and URL handling
 * Uses prefix-based naming convention for thumbnails
 */

import { logger } from '@/lib/logger';

export type ThumbnailSize = 'small' | 'medium' | 'large';
export type CompressionFormat = 'webp' | 'jpeg' | 'png';

/**
 * Compute CDN URL from media asset data
 * Based on new schema where CDN URLs are computed from directoryHash + fileName
 * Matches the serving route structure: /media/[accountUuid]/xx/xx/xx/xx/[fileName]
 */
export function getMediaCdnUrl(mediaAsset: any, accountUuid?: string): string {
  if (!mediaAsset?.directoryHash || !mediaAsset?.fileName) {
    logger.warn('Missing directoryHash or fileName for media asset', { mediaAsset });
    return '';
  }

  if (!accountUuid) {
    logger.warn('Cannot generate CDN URL without accountUuid', { mediaAsset });
    return '';
  }

  const { directoryHash, fileName } = mediaAsset;

  // Build the CDN URL path matching the serving route structure
  const cdnUrl = `/media/${accountUuid}/${directoryHash.substring(0, 2)}/${directoryHash.substring(2, 4)}/${directoryHash.substring(4, 6)}/${directoryHash.substring(6, 8)}/${fileName}`;

  return cdnUrl;
}

/**
 * Generate thumbnail URL from original media asset
 */
export function getThumbnailUrl(originalUrl: string, size: ThumbnailSize): string {
  const sizeMap = {
    small: '150',
    medium: '300', 
    large: '600'
  };

  // Extract path and filename
  const lastSlash = originalUrl.lastIndexOf('/');
  const path = originalUrl.substring(0, lastSlash);
  const filename = originalUrl.substring(lastSlash + 1);

  // Add thumbnail prefix
  const thumbnailFilename = `thumb_${sizeMap[size]}_${filename}`;

  return `${path}/${thumbnailFilename}`;
}

/**
 * Generate compressed image URL from original
 */
export function getCompressedUrl(originalUrl: string, format: CompressionFormat = 'webp'): string {
  const lastSlash = originalUrl.lastIndexOf('/');
  const path = originalUrl.substring(0, lastSlash);
  const filename = originalUrl.substring(lastSlash + 1);

  // Change extension to compressed format
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
  const compressedFilename = `compressed_${nameWithoutExt}.${format}`;

  return `${path}/${compressedFilename}`;
}

/**
 * Check if thumbnail exists (for UI loading states)
 */
export async function thumbnailExists(thumbnailUrl: string): Promise<boolean> {
  try {
    const response = await fetch(thumbnailUrl, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get thumbnail metadata from media asset variants
 */
export function getThumbnailInfo(mediaAsset: any, size: ThumbnailSize) {
  return mediaAsset.variants?.thumbnails?.[size] || null;
}

/**
 * Generate all thumbnail URLs for a media asset
 */
export function getAllThumbnailUrls(originalUrl: string) {
  return {
    small: getThumbnailUrl(originalUrl, 'small'),
    medium: getThumbnailUrl(originalUrl, 'medium'), 
    large: getThumbnailUrl(originalUrl, 'large'),
    compressed: getCompressedUrl(originalUrl, 'webp')
  };
}

/**
 * Update media asset with thumbnail information
 */
export function updateMediaAssetWithThumbnails(mediaAsset: any, thumbnailResults: any) {
  return {
    ...mediaAsset,
    variants: {
      ...mediaAsset.variants,
      thumbnails: thumbnailResults
    },
    hasVariants: true,
    isProcessed: true,
    processingStatus: 'completed',
    processedAt: new Date()
  };
}

/**
 * Get optimal thumbnail for display based on container size
 */
export function getOptimalThumbnail(originalUrl: string, containerWidth: number): string {
  if (containerWidth <= 200) return getThumbnailUrl(originalUrl, 'small');
  if (containerWidth <= 400) return getThumbnailUrl(originalUrl, 'medium');
  return getThumbnailUrl(originalUrl, 'large');
}

/**
 * Generate thumbnail file path for processing
 */
export function generateThumbnailPath(originalPath: string, size: ThumbnailSize): string {
  const sizeMap = {
    small: '150',
    medium: '300',
    large: '600'
  };

  const lastSlash = originalPath.lastIndexOf('/');
  const directory = originalPath.substring(0, lastSlash);
  const filename = originalPath.substring(lastSlash + 1);

  const thumbnailFilename = `thumb_${sizeMap[size]}_${filename}`;
  return `${directory}/${thumbnailFilename}`;
} 