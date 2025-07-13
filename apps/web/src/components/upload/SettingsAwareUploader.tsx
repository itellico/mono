/**
 * Settings-Aware Universal Uploader
 * 
 * Automatically configures upload settings based on hierarchical tenant settings.
 * Replaces manual configuration with automatic settings resolution.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { UniversalFileUpload, type FileUploadConfig } from '@/components/reusable/UniversalFileUpload';
import { useUploadSettings, useUploadComponentConfig, useFileValidation, useUploadConstraints } from '@/hooks/useUploadSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoIcon, AlertTriangleIcon } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface SettingsAwareUploaderProps {
  context: string;
  mediaType: 'picture' | 'video' | 'audio' | 'document';
  variant?: 'default' | 'compact' | 'gallery' | 'avatar';
  showConstraints?: boolean;
  onUploadSuccess?: (results: any[]) => void;
  onUploadError?: (error: Error) => void;
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SettingsAwareUploader({
  context,
  mediaType,
  variant = 'default',
  showConstraints = true,
  onUploadSuccess,
  onUploadError,
  className
}: SettingsAwareUploaderProps) {
  const [uploadConfig, setUploadConfig] = useState<Partial<FileUploadConfig> | null>(null);
  
  // Get settings and configuration
  const { settings, isLoading: settingsLoading } = useUploadSettings(context);
  const { config, isLoading: configLoading } = useUploadComponentConfig(context, mediaType);
  const { validateFiles } = useFileValidation(context);
  const { constraints, isLoading: constraintsLoading } = useUploadConstraints(mediaType);

  // Set up upload configuration when settings are loaded
  useEffect(() => {
    if (config && settings) {
      const mediaSettings = settings[mediaType];
      
      setUploadConfig({
        ...config,
        variant,
        maxSizeMB: mediaSettings.maxFileSizeMB,
        allowedTypes: mediaSettings.allowedFormats,
        accept: mediaSettings.allowedFormats,
        enableCompression: mediaType === 'picture' ? settings.picture.autoOptimize : false,
        
        // Enhanced validation with settings
        onFilesChange: async (files: File[]) => {
          if (files.length > 0) {
            const validation = await validateFiles(files);
            if (validation.invalid.length > 0) {
              // Handle invalid files
              validation.invalid.forEach(({ file, errors }) => {
                console.warn(`Invalid file ${file.name}:`, errors);
              });
            }
          }
        }
      });
    }
  }, [config, settings, mediaType, variant, validateFiles]);

  // Loading state
  if (settingsLoading || configLoading || constraintsLoading) {
    return <UploaderSkeleton />;
  }

  // Error state
  if (!uploadConfig || !settings || !constraints) {
    return (
      <Alert variant="destructive">
        <AlertTriangleIcon className="h-4 w-4" />
        <AlertDescription>
          Failed to load upload settings. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={className}>
      {/* Upload Constraints Display */}
      {showConstraints && (
        <UploadConstraintsCard 
          mediaType={mediaType} 
          constraints={constraints} 
        />
      )}

      {/* Main Upload Component */}
      <UniversalFileUpload
        {...uploadConfig}
        onUploadSuccess={onUploadSuccess}
        onUploadError={onUploadError}
      />
    </div>
  );
}

// ============================================================================
// CONSTRAINT DISPLAY COMPONENT
// ============================================================================

interface UploadConstraintsCardProps {
  mediaType: 'picture' | 'video' | 'audio' | 'document';
  constraints: any;
}

function UploadConstraintsCard({ mediaType, constraints }: UploadConstraintsCardProps) {
  const getMediaIcon = () => {
    switch (mediaType) {
      case 'picture': return '🖼️';
      case 'video': return '🎥';
      case 'audio': return '🎵';
      case 'document': return '📄';
    }
  };

  const getMediaTitle = () => {
    switch (mediaType) {
      case 'picture': return 'Image Upload Settings';
      case 'video': return 'Video Upload Settings';
      case 'audio': return 'Audio Upload Settings';
      case 'document': return 'Document Upload Settings';
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span>{getMediaIcon()}</span>
          {getMediaTitle()}
          <InfoIcon className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            Max: {constraints.maxFileSize}
          </Badge>
          <Badge variant="outline">
            Formats: {constraints.allowedFormats}
          </Badge>
          
          {constraints.minDimensions && (
            <Badge variant="outline">
              Min: {constraints.minDimensions}
            </Badge>
          )}
          
          {constraints.maxDuration && (
            <Badge variant="outline">
              Duration: {constraints.maxDuration}
            </Badge>
          )}
          
          {constraints.minResolution && (
            <Badge variant="outline">
              Resolution: {constraints.minResolution}
            </Badge>
          )}
          
          {constraints.minBitrate && (
            <Badge variant="outline">
              Quality: {constraints.minBitrate}
            </Badge>
          )}
          
          {constraints.compression && (
            <Badge variant="outline">
              {constraints.compression}
            </Badge>
          )}
          
          {constraints.autoTranscode && (
            <Badge variant="outline">
              {constraints.autoTranscode}
            </Badge>
          )}
          
          {constraints.exifStripping && (
            <Badge variant="outline" className="text-green-600">
              {constraints.exifStripping}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function UploaderSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-24" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <Skeleton className="h-12 w-12 mx-auto rounded" />
            <Skeleton className="h-6 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
            <Skeleton className="h-10 w-32 mx-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// PRESET COMPONENTS
// ============================================================================

export function ProfilePictureUploader(props: Omit<SettingsAwareUploaderProps, 'context' | 'mediaType'>) {
  return (
    <SettingsAwareUploader
      context="profile_picture"
      mediaType="picture"
      variant="avatar"
      {...props}
    />
  );
}

export function PortfolioImageUploader(props: Omit<SettingsAwareUploaderProps, 'context' | 'mediaType'>) {
  return (
    <SettingsAwareUploader
      context="portfolio_image"
      mediaType="picture"
      variant="gallery"
      {...props}
    />
  );
}

export function PortfolioVideoUploader(props: Omit<SettingsAwareUploaderProps, 'context' | 'mediaType'>) {
  return (
    <SettingsAwareUploader
      context="portfolio_video"
      mediaType="video"
      variant="gallery"
      {...props}
    />
  );
}

export function VoicePortfolioUploader(props: Omit<SettingsAwareUploaderProps, 'context' | 'mediaType'>) {
  return (
    <SettingsAwareUploader
      context="portfolio_audio"
      mediaType="audio"
      variant="default"
      {...props}
    />
  );
}

export function CompCardUploader(props: Omit<SettingsAwareUploaderProps, 'context' | 'mediaType'>) {
  return (
    <SettingsAwareUploader
      context="comp_card"
      mediaType="document"
      variant="default"
      {...props}
    />
  );
}

export function DocumentUploader(props: Omit<SettingsAwareUploaderProps, 'context' | 'mediaType'>) {
  return (
    <SettingsAwareUploader
      context="documents"
      mediaType="document"
      variant="default"
      {...props}
    />
  );
}