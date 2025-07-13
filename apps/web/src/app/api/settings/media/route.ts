/**
 * @openapi
 * /api/settings/media:
 *   get:
 *     tags:
 *       - Settings
 *     summary: Media Settings
     tags:
       - Settings
 *     description: Media Settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Operation successful
 *       '401':
 *         description: Authentication required
 *       '500':
 *         description: Internal server error
 */
import { NextRequest, NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

const client = postgres({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'mono',
  username: process.env.DB_USER || 'developer',
  password: process.env.DB_PASSWORD || 'developer',
  ssl: false
});

const db = drizzle(client, { schema });

// GET /api/settings/media - Fetch media settings from database
export async function GET(request: NextRequest) {
  try {
    // Load media-related settings from siteSettings table
    const mediaSettings = await db.query.siteSettings.findMany({
      where: (siteSettings, { eq }) => eq(siteSettings.category, 'media')
    });

    if (mediaSettings.length === 0) {
      logger.warn('No media settings found in database, using defaults');
      // Return default settings if none exist
      return NextResponse.json({
        uploadSettings: {
          maxFileSizeMB: 10,
          allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
          allowedDocumentTypes: ['application/pdf'],
          allowedVideoTypes: ['video/mp4', 'video/mov'],
          allowedAudioTypes: ['audio/mp3', 'audio/wav'],
          minImageWidth: 100,
          minImageHeight: 100,
          autoGenerateThumbnails: true,
          requireImageOptimization: true,
          allowExifData: false,
          compressionQuality: 85
        }
      });
    }

    // Convert database settings to structured format
    const uploadSettings: any = {};

    mediaSettings.forEach(setting => {
      const value = setting.value as string;
      switch (setting.key) {
        case 'max_file_size_mb':
          uploadSettings.maxFileSizeMB = Number(value);
          break;
        case 'allowed_image_types':
          uploadSettings.allowedImageTypes = JSON.parse(value);
          break;
        case 'allowed_document_types':
          uploadSettings.allowedDocumentTypes = JSON.parse(value);
          break;
        case 'allowed_video_types':
          uploadSettings.allowedVideoTypes = JSON.parse(value);
          break;
        case 'allowed_audio_types':
          uploadSettings.allowedAudioTypes = JSON.parse(value);
          break;
        case 'min_image_width':
          uploadSettings.minImageWidth = Number(value);
          break;
        case 'min_image_height':
          uploadSettings.minImageHeight = Number(value);
          break;
        case 'auto_generate_thumbnails':
          uploadSettings.autoGenerateThumbnails = value === 'true';
          break;
        case 'require_image_optimization':
          uploadSettings.requireImageOptimization = value === 'true';
          break;
        case 'allow_exif_data':
          uploadSettings.allowExifData = value === 'true';
          break;
        case 'compression_quality':
          uploadSettings.compressionQuality = Number(value);
          break;
      }
    });

    // Fill in defaults for missing settings
    const completeSettings = {
      maxFileSizeMB: uploadSettings.maxFileSizeMB || 10,
      allowedImageTypes: uploadSettings.allowedImageTypes || ['image/jpeg', 'image/png', 'image/webp'],
      allowedDocumentTypes: uploadSettings.allowedDocumentTypes || ['application/pdf'],
      allowedVideoTypes: uploadSettings.allowedVideoTypes || ['video/mp4', 'video/mov'],
      allowedAudioTypes: uploadSettings.allowedAudioTypes || ['audio/mp3', 'audio/wav'],
      minImageWidth: uploadSettings.minImageWidth || 100,
      minImageHeight: uploadSettings.minImageHeight || 100,
      autoGenerateThumbnails: uploadSettings.autoGenerateThumbnails !== undefined ? uploadSettings.autoGenerateThumbnails : true,
      requireImageOptimization: uploadSettings.requireImageOptimization !== undefined ? uploadSettings.requireImageOptimization : true,
      allowExifData: uploadSettings.allowExifData !== undefined ? uploadSettings.allowExifData : false,
      compressionQuality: uploadSettings.compressionQuality || 85
    };

    logger.info('Media settings loaded from database', {
      settingsCount: mediaSettings.length,
      maxFileSizeMB: completeSettings.maxFileSizeMB,
      imageTypesCount: completeSettings.allowedImageTypes.length
    });

    return NextResponse.json({
      uploadSettings: completeSettings
    });

  } catch (error) {
    logger.error('Failed to load media settings from database', { 
      error: error.message,
      stack: error.stack 
    });

    // Return fallback settings on database error
    return NextResponse.json({
      uploadSettings: {
        maxFileSizeMB: 10,
        allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
        allowedDocumentTypes: ['application/pdf'],
        allowedVideoTypes: ['video/mp4', 'video/mov'],
        allowedAudioTypes: ['audio/mp3', 'audio/wav'],
        minImageWidth: 100,
        minImageHeight: 100,
        autoGenerateThumbnails: true,
        requireImageOptimization: true,
        allowExifData: false,
        compressionQuality: 85
      }
    });
  } finally {
    await client.end();
  }
} 