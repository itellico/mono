/**
 * Custom hook for accessing upload settings in React components
 * 
 * Provides easy access to hierarchical upload settings with caching and real-time updates.
 */

import { useQuery } from '@tanstack/react-query';
import { useTenantInfo } from '@/lib/platform/tenant-foundation-client';
import { useUser } from '@/hooks/use-user';
import { 
  getUploadSettings, 
  getUploadComponentConfig, 
  validateUploadFile,
  type AllUploadSettings,
  type UploadValidationResult 
} from '@/lib/services/upload-settings.service';
import { useCallback } from 'react';

// ============================================================================
// UPLOAD SETTINGS HOOK
// ============================================================================

export function useUploadSettings(context?: string) {
  const { data: user } = useUser();
  const tenantInfo = useTenantInfo();
  const tenantId = tenantInfo?.id;
  const userId = user?.id;

  // Query for upload settings with caching
  const {
    data: settings,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['upload-settings', context, tenantId, userId],
    queryFn: () => getUploadSettings(context || 'media_assets', tenantId, userId),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  });

  return {
    settings,
    isLoading,
    error,
    refetch,
    tenantId,
    userId
  };
}

// ============================================================================
// COMPONENT CONFIG HOOK
// ============================================================================

export function useUploadComponentConfig(
  context: string, 
  mediaType: 'picture' | 'video' | 'audio' | 'document'
) {
  const { tenantId, userId } = useUploadSettings();

  const {
    data: config,
    isLoading,
    error
  } = useQuery({
    queryKey: ['upload-component-config', context, mediaType, tenantId, userId],
    queryFn: () => getUploadComponentConfig(context, mediaType, tenantId, userId),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    config,
    isLoading,
    error
  };
}

// ============================================================================
// FILE VALIDATION HOOK
// ============================================================================

export function useFileValidation(context: string) {
  const { tenantId, userId } = useUploadSettings();

  const validateFile = useCallback(async (file: File): Promise<UploadValidationResult> => {
    if (!tenantId) {
      return {
        isValid: false,
        errors: ['Tenant information not available'],
        warnings: [],
        effectiveSettings: {}
      };
    }

    return validateUploadFile(file, context, tenantId, userId);
  }, [context, tenantId, userId]);

  const validateFiles = useCallback(async (files: File[]): Promise<{
    valid: File[];
    invalid: Array<{ file: File; errors: string[] }>;
  }> => {
    const results = await Promise.all(
      files.map(async (file) => {
        const validation = await validateFile(file);
        return { file, validation };
      })
    );

    const valid: File[] = [];
    const invalid: Array<{ file: File; errors: string[] }> = [];

    results.forEach(({ file, validation }) => {
      if (validation.isValid) {
        valid.push(file);
      } else {
        invalid.push({ file, errors: validation.errors });
      }
    });

    return { valid, invalid };
  }, [validateFile]);

  return {
    validateFile,
    validateFiles,
    tenantId,
    userId
  };
}

// ============================================================================
// SETTINGS-AWARE UPLOAD PRESETS
// ============================================================================

/**
 * Get predefined upload configurations that respect tenant settings
 */
export function useUploadPresets() {
  const { settings } = useUploadSettings();

  const presets = {
    profilePicture: {
      context: 'profile_picture' as const,
      mediaType: 'picture' as const,
      maxFiles: 1,
      variant: 'avatar' as const,
      enableMultiple: false,
      enablePreview: true,
      enableCompression: settings?.picture.autoOptimize ?? true
    },

    portfolioImages: {
      context: 'portfolio_image' as const,
      mediaType: 'picture' as const,
      maxFiles: 20,
      variant: 'gallery' as const,
      enableMultiple: true,
      enablePreview: true,
      enableCompression: settings?.picture.autoOptimize ?? true
    },

    portfolioVideos: {
      context: 'portfolio_video' as const,
      mediaType: 'video' as const,
      maxFiles: 5,
      variant: 'gallery' as const,
      enableMultiple: true,
      enablePreview: true,
      enableProgress: true
    },

    voicePortfolio: {
      context: 'portfolio_audio' as const,
      mediaType: 'audio' as const,
      maxFiles: 10,
      variant: 'default' as const,
      enableMultiple: true,
      enablePreview: false,
      enableProgress: true
    },

    compCard: {
      context: 'comp_card' as const,
      mediaType: 'document' as const,
      maxFiles: 1,
      variant: 'default' as const,
      enableMultiple: false,
      enablePreview: true
    },

    documents: {
      context: 'documents' as const,
      mediaType: 'document' as const,
      maxFiles: 10,
      variant: 'default' as const,
      enableMultiple: true,
      enablePreview: false
    }
  };

  return presets;
}

// ============================================================================
// UPLOAD CONSTRAINTS HOOK
// ============================================================================

/**
 * Get upload constraints for display in UI
 */
export function useUploadConstraints(mediaType: 'picture' | 'video' | 'audio' | 'document') {
  const { settings, isLoading } = useUploadSettings();

  if (isLoading || !settings) {
    return {
      constraints: null,
      isLoading: true
    };
  }

  const mediaSettings = settings[mediaType];
  
  const constraints = {
    maxFileSize: `${mediaSettings.maxFileSizeMB}MB`,
    allowedFormats: mediaSettings.allowedFormats.map(format => 
      format.split('/')[1].toUpperCase()
    ).join(', '),
    
    // Media-specific constraints
    ...(mediaType === 'picture' && {
      minDimensions: `${settings.picture.minWidth}x${settings.picture.minHeight}px`,
      compression: `${settings.picture.compressionQuality}% quality`,
      exifStripping: settings.picture.stripExif ? 'EXIF data removed' : 'EXIF data preserved'
    }),
    
    ...(mediaType === 'video' && {
      maxDuration: `${settings.video.maxDurationMinutes} minutes`,
      minResolution: `${settings.video.minResolutionWidth}x${settings.video.minResolutionHeight}px`,
      autoTranscode: settings.video.autoTranscode ? 'Auto-convert to MP4' : 'No transcoding'
    }),
    
    ...(mediaType === 'audio' && {
      maxDuration: `${settings.audio.maxDurationMinutes} minutes`,
      minBitrate: `${settings.audio.minBitrateKbps} kbps`
    })
  };

  return {
    constraints,
    isLoading: false
  };
}

// ============================================================================
// UPLOAD QUOTA HOOK
// ============================================================================

/**
 * Track upload usage against tenant limits
 */
export function useUploadQuota() {
  const { settings } = useUploadSettings();
  const { data: user } = useUser();

  // TODO: Implement quota tracking
  // This would require querying the user's current storage usage
  const {
    data: usage,
    isLoading
  } = useQuery({
    queryKey: ['upload-quota', user?.id],
    queryFn: async () => {
      // Placeholder - would query user's storage usage
      return {
        usedMB: 0,
        limitMB: settings?.general.totalSizeLimitMB ?? 1000,
        remainingMB: settings?.general.totalSizeLimitMB ?? 1000,
        percentUsed: 0
      };
    },
    enabled: !!user?.id && !!settings,
    staleTime: 2 * 60 * 1000 // 2 minutes
  });

  return {
    usage,
    isLoading,
    isNearLimit: usage ? usage.percentUsed > 80 : false,
    isOverLimit: usage ? usage.percentUsed >= 100 : false
  };
}