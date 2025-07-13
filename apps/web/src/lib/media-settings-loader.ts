/**
 * Media Settings Loader
 * 
 * Fetches appropriate media upload settings from the database based on context
 * Supports different contexts like profile_picture, set_card, video_library, voice_portfolio, etc.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { browserLogger } from '@/lib/browser-logger';

export type MediaType = 'picture' | 'video' | 'audio';

export type MediaContext = 
  | 'profile_picture'
  | 'set_card' 
  | 'portfolio'
  | 'video_library'
  | 'voice_portfolio'
  | 'application'
  | 'document'
  | 'job_submission';

export interface MediaUploadLimits {
  maxFileSizeMB: number;
  allowedFormats: string[];
  maxDurationMinutes?: number; // For video/audio
  minWidth?: number; // For images/video
  minHeight?: number; // For images/video
  compressionQuality?: number; // For images
  maxFiles?: number; // Per context limits
}

export interface MediaProcessingSettings {
  autoGenerateThumbnails: boolean;
  requireOptimization?: boolean; // For images
  autoConvert?: boolean; // Convert to universal format
  allowExifData?: boolean; // For images
  requireStereo?: boolean; // For audio
  minQuality?: 'low' | 'medium' | 'high'; // For audio/video
}

export interface ContextualMediaSettings {
  limits: MediaUploadLimits;
  processing: MediaProcessingSettings;
  context: MediaContext;
  mediaType: MediaType;
}

// Default fallback settings
const DEFAULT_PICTURE_SETTINGS: ContextualMediaSettings = {
  limits: {
    maxFileSizeMB: 25,
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    minWidth: 1080,
    minHeight: 1080,
    compressionQuality: 85,
    maxFiles: 1
  },
  processing: {
    autoGenerateThumbnails: true,
    requireOptimization: true,
    allowExifData: false
  },
  context: 'profile_picture',
  mediaType: 'picture'
};

const DEFAULT_VIDEO_SETTINGS: ContextualMediaSettings = {
  limits: {
    maxFileSizeMB: 500,
    allowedFormats: ['video/mp4', 'video/quicktime', 'video/webm'],
    maxDurationMinutes: 15,
    minWidth: 720,
    minHeight: 480,
    maxFiles: 1
  },
  processing: {
    autoGenerateThumbnails: true,
    autoConvert: true,
    minQuality: 'medium'
  },
  context: 'video_library',
  mediaType: 'video'
};

const DEFAULT_AUDIO_SETTINGS: ContextualMediaSettings = {
  limits: {
    maxFileSizeMB: 50,
    allowedFormats: ['audio/mp3', 'audio/wav', 'audio/m4a'],
    maxDurationMinutes: 10,
    maxFiles: 1
  },
  processing: {
    autoGenerateThumbnails: false,
    autoConvert: true,
    requireStereo: false,
    minQuality: 'medium'
  },
  context: 'voice_portfolio',
  mediaType: 'audio'
};

// Context-specific file limits from site settings
const CONTEXT_MAX_FILES_MAP: Record<MediaContext, number> = {
  profile_picture: 1,
  set_card: 6,
  portfolio: 20,
  video_library: 10,
  voice_portfolio: 10,
  application: 5,
  document: 3,
  job_submission: 10
};

/**
 * Determine media type from context
 */
export function getMediaTypeFromContext(context: MediaContext): MediaType {
  switch (context) {
    case 'video_library':
      return 'video';
    case 'voice_portfolio':
      return 'audio';
    case 'profile_picture':
    case 'set_card':
    case 'portfolio':
    case 'application':
    case 'job_submission':
    default:
      return 'picture';
  }
}

/**
 * Client-side function to fetch media settings from API
 */
export async function fetchMediaSettingsFromAPI(): Promise<any> {
  try {
    const response = await fetch('/api/admin/settings/media');
    if (!response.ok) {
      throw new Error('Failed to fetch media settings from API');
    }
    return await response.json();
  } catch (error) {
    browserLogger.error('Failed to fetch media settings from API', { error });
    return null;
  }
}

/**
 * Get contextual media settings for upload component
 * This is the main function used by upload components
 */
export async function getContextualMediaSettings(
  context: MediaContext,
  mediaTypeOverride?: MediaType
): Promise<ContextualMediaSettings> {
  try {
    // Determine media type
    const mediaType = mediaTypeOverride || getMediaTypeFromContext(context);

    // Fetch settings from API
    const apiSettings = await fetchMediaSettingsFromAPI();

    // Get context-specific max files
    const maxFiles = CONTEXT_MAX_FILES_MAP[context] || 1;

    // Build contextual settings based on media type
    let settings: ContextualMediaSettings;

    if (mediaType === 'picture') {
      settings = {
        limits: {
          maxFileSizeMB: apiSettings?.pictureMaxFileSizeMB || DEFAULT_PICTURE_SETTINGS.limits.maxFileSizeMB,
          allowedFormats: apiSettings?.pictureAllowedFormats || DEFAULT_PICTURE_SETTINGS.limits.allowedFormats,
          minWidth: apiSettings?.pictureMinWidth || DEFAULT_PICTURE_SETTINGS.limits.minWidth,
          minHeight: apiSettings?.pictureMinHeight || DEFAULT_PICTURE_SETTINGS.limits.minHeight,
          compressionQuality: apiSettings?.pictureCompressionQuality || DEFAULT_PICTURE_SETTINGS.limits.compressionQuality,
          maxFiles
        },
        processing: {
          autoGenerateThumbnails: apiSettings?.pictureAutoGenerateThumbnails ?? DEFAULT_PICTURE_SETTINGS.processing.autoGenerateThumbnails,
          requireOptimization: apiSettings?.pictureRequireOptimization ?? DEFAULT_PICTURE_SETTINGS.processing.requireOptimization,
          allowExifData: apiSettings?.pictureAllowExifData ?? DEFAULT_PICTURE_SETTINGS.processing.allowExifData
        },
        context,
        mediaType
      };
    } else if (mediaType === 'video') {
      settings = {
        limits: {
          maxFileSizeMB: apiSettings?.videoMaxFileSizeMB || DEFAULT_VIDEO_SETTINGS.limits.maxFileSizeMB,
          allowedFormats: apiSettings?.videoAllowedFormats || DEFAULT_VIDEO_SETTINGS.limits.allowedFormats,
          maxDurationMinutes: apiSettings?.videoMaxDurationMinutes || DEFAULT_VIDEO_SETTINGS.limits.maxDurationMinutes,
          minWidth: apiSettings?.videoMinResolutionWidth || DEFAULT_VIDEO_SETTINGS.limits.minWidth,
          minHeight: apiSettings?.videoMinResolutionHeight || DEFAULT_VIDEO_SETTINGS.limits.minHeight,
          maxFiles
        },
        processing: {
          autoGenerateThumbnails: apiSettings?.videoAutoGenerateThumbnails ?? DEFAULT_VIDEO_SETTINGS.processing.autoGenerateThumbnails,
          autoConvert: apiSettings?.videoAutoConvertToMp4 ?? DEFAULT_VIDEO_SETTINGS.processing.autoConvert,
          minQuality: apiSettings?.videoCompressionQuality || DEFAULT_VIDEO_SETTINGS.processing.minQuality
        },
        context,
        mediaType
      };
    } else { // audio
      settings = {
        limits: {
          maxFileSizeMB: apiSettings?.audioMaxFileSizeMB || DEFAULT_AUDIO_SETTINGS.limits.maxFileSizeMB,
          allowedFormats: apiSettings?.audioAllowedFormats || DEFAULT_AUDIO_SETTINGS.limits.allowedFormats,
          maxDurationMinutes: apiSettings?.audioMaxDurationMinutes || DEFAULT_AUDIO_SETTINGS.limits.maxDurationMinutes,
          maxFiles
        },
        processing: {
          autoGenerateThumbnails: false,
          autoConvert: apiSettings?.audioAutoConvertToMp3 ?? DEFAULT_AUDIO_SETTINGS.processing.autoConvert,
          requireStereo: apiSettings?.audioRequireStereo ?? DEFAULT_AUDIO_SETTINGS.processing.requireStereo,
          minQuality: apiSettings?.audioMinQuality || DEFAULT_AUDIO_SETTINGS.processing.minQuality
        },
        context,
        mediaType
      };
    }

    // Apply context-specific overrides
    settings = applyContextSpecificOverrides(settings);

    browserLogger.info('Loaded contextual media settings', { 
      context, 
      mediaType, 
      maxFiles: settings.limits.maxFiles,
      maxSizeMB: settings.limits.maxFileSizeMB
    });

    return settings;

  } catch (error) {
    browserLogger.error('Failed to load contextual media settings, using defaults', { error, context });

    // Return appropriate default based on media type
    const mediaType = mediaTypeOverride || getMediaTypeFromContext(context);
    const defaultSettings = mediaType === 'video' ? DEFAULT_VIDEO_SETTINGS : 
                           mediaType === 'audio' ? DEFAULT_AUDIO_SETTINGS : 
                           DEFAULT_PICTURE_SETTINGS;

    return {
      ...defaultSettings,
      context,
      mediaType,
      limits: {
        ...defaultSettings.limits,
        maxFiles: CONTEXT_MAX_FILES_MAP[context] || 1
      }
    };
  }
}

/**
 * Apply context-specific overrides to base settings
 */
function applyContextSpecificOverrides(settings: ContextualMediaSettings): ContextualMediaSettings {
  switch (settings.context) {
    case 'profile_picture':
      // Profile pictures should be smaller and single file
      return {
        ...settings,
        limits: {
          ...settings.limits,
          maxFileSizeMB: Math.min(settings.limits.maxFileSizeMB, 10), // Max 10MB for profile pics
          maxFiles: 1
        }
      };

    case 'set_card':
      // Set cards can be larger and multiple files
      return {
        ...settings,
        limits: {
          ...settings.limits,
          maxFiles: 6 // Exactly 6 photos for set cards
        }
      };

    case 'video_library':
      // Video library can have higher quality settings
      return {
        ...settings,
        limits: {
          ...settings.limits,
          maxFiles: 20 // Multiple videos in library
        }
      };

    case 'voice_portfolio':
      // Voice portfolio should have good audio quality
      return {
        ...settings,
        processing: {
          ...settings.processing,
          minQuality: 'high', // Require high quality for voice work
          requireStereo: true // Professional voice work should be stereo
        }
      };

    case 'application':
      // Model applications have specific requirements
      return {
        ...settings,
        limits: {
          ...settings.limits,
          maxFiles: 5, // Limited number for applications
          minWidth: 1920, // Higher resolution for applications
          minHeight: 1080
        }
      };

    default:
      return settings;
  }
}

/**
 * Helper function to validate uploaded file against settings
 */
export function validateFileAgainstSettings(
  file: File, 
  settings: ContextualMediaSettings
): { valid: boolean; error?: string } {
  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > settings.limits.maxFileSizeMB) {
    return {
      valid: false,
      error: `File size (${fileSizeMB.toFixed(1)}MB) exceeds maximum allowed size of ${settings.limits.maxFileSizeMB}MB`
    };
  }

  // Check file type
  if (!settings.limits.allowedFormats.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${settings.limits.allowedFormats.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Get human-readable settings summary for UI display
 */
export function getSettingsSummary(settings: ContextualMediaSettings): string {
  const formats = settings.limits.allowedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ');
  let summary = `Max ${settings.limits.maxFileSizeMB}MB, Formats: ${formats}`;

  if (settings.limits.maxDurationMinutes) {
    summary += `, Max ${settings.limits.maxDurationMinutes} min`;
  }

  if (settings.limits.minWidth && settings.limits.minHeight) {
    summary += `, Min ${settings.limits.minWidth}×${settings.limits.minHeight}px`;
  }

  if (settings.limits.maxFiles && settings.limits.maxFiles > 1) {
    summary += `, Max ${settings.limits.maxFiles} files`;
  }

  return summary;
} 