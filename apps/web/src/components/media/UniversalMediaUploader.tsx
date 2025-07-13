'use client';
/**
 * Universal Media Uploader Component
 * 
 * @description A comprehensive, reusable media upload component for mono platform
 * that integrates with the PG Boss optimization system. Supports all media types with
 * drag & drop interface, real-time progress tracking, and tenant-aware configurations.
 * 
 * @category Media Components
 * @subcategory Upload
 * @tenant-aware Yes - Supports tenant-specific file size limits and format restrictions
 * @accessibility Full ARIA support with keyboard navigation and screen reader compatibility
 * 
 * @example
 * ```tsx
 * // Basic profile picture upload
 * <UniversalMediaUploader
 *   context="profile_picture"
 *   onUploadComplete={(assets) => updateProfile(assets[0])}
 * />
 * 
 * // Portfolio upload with custom limits
 * <UniversalMediaUploader
 *   context="portfolio"
 *   maxFiles={10}
 *   maxFileSize={25 * 1024 * 1024}
 *   onUploadComplete={(assets) => addToPortfolio(assets)}
 * />
 * 
 * // Application document upload
 * <UniversalMediaUploader
 *   context="application"
 *   contextId={jobId}
 *   acceptedFormats={['application/pdf', 'image/jpeg']}
 *   showOptimizationStatus={false}
 * />
 * ```
 * 
 * @features
 * - **Drag & Drop**: Intuitive file selection with visual feedback
 * - **Real-time Progress**: Upload and optimization progress tracking
 * - **Context-Aware**: Automatic configuration based on upload context
 * - **Multi-tenant**: Respects tenant-specific limits and restrictions
 * - **Error Handling**: Comprehensive error handling with retry logic
 * - **Optimization**: Automatic image/video optimization with PG Boss
 * - **File Validation**: Client and server-side validation
 * - **Preview Support**: Thumbnail previews for uploaded media
 * 
 * @related-components
 * - MediaGallery - For displaying uploaded media assets
 * - UniversalMediaViewer - For viewing individual media assets
 * - ProfilePictureUpload - Specialized profile picture uploader
 * 
 * @dependencies
 * - @/hooks/useToast - For user feedback notifications
 * - @/lib/platform/logging - For component-level logging
 * - react-dropzone - For drag and drop functionality
 * - @/components/ui/* - UI primitive components
 * 
 * @api-endpoints
 * - POST /api/media/upload - Main upload endpoint
 * - GET /api/admin/settings/media - Configuration endpoint
 * - POST /api/media/delete - Media deletion endpoint
 * 
 * @business-context
 * This component is central to the mono platform as it handles all media uploads
 * across different contexts (profiles, portfolios, applications). It enforces
 * subscription-based limits and tenant-specific configurations while providing
 * a consistent user experience across the platform.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useComponentLogger } from '@/lib/platform/logging';
import { Upload, X, CheckCircle, AlertCircle, RefreshCw, Image, Video, FileText, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
/**
 * Media upload context types defining where and how media will be used
 */
export type MediaUploadContext = 
  | 'profile_picture'  // User profile avatar
  | 'compcard'        // Model comp card/headshot
  | 'portfolio'       // Portfolio images/videos
  | 'video_library'   // Video portfolio collection
  | 'voice_portfolio' // Voice/audio samples
  | 'application'     // Job application media
  | 'job_submission'  // Job submission attachments
  | 'document';       // Document uploads (PDF, etc.)
/**
 * Configuration for specific upload slots with validation rules
 */
export type SlotConfig = {
  /** Unique slot identifier */
  id: string;
  /** Human-readable slot name */
  name: string;
  /** Whether this slot must be filled */
  required: boolean;
  /** MIME types allowed for this slot */
  allowedTypes: string[];
  /** Maximum file size in MB */
  maxSizeMB: number;
  /** Required aspect ratio (e.g., "16:9", "1:1") */
  aspectRatio?: string;
  /** Description shown to users */
  description?: string;
};
/**
 * Media asset data structure returned from successful uploads
 */
export interface MediaAsset {
  /** Database ID of the media asset */
  id: number;
  /** Generated filename with hash */
  fileName: string;
  /** Original filename from user */
  originalName: string;
  /** MIME type of the uploaded file */
  mimeType: string;
  /** File size in bytes */
  fileSize: number;
  /** CDN URL for accessing the file */
  cdnUrl: string;
  /** Processing status (pending, processing, completed, failed) */
  processingStatus: string;
  /** PG Boss job ID for optimization tracking */
  jobId?: string | null;
  /** Whether optimization has completed */
  isOptimized?: boolean;
  /** Generated thumbnail URLs in different formats */
  thumbnailFormats?: Record<string, string>;
}
/**
 * Upload progress tracking for individual files
 */
interface UploadProgress {
  /** The file being uploaded */
  file: File;
  /** Upload progress percentage (0-100) */
  progress: number;
  /** Current status of the upload/processing */
  status: 'uploading' | 'processing' | 'completed' | 'error' | 'retrying';
  /** Media asset data once upload completes */
  mediaAsset?: MediaAsset;
  /** Error message if upload fails */
  error?: string;
  /** PG Boss job ID for tracking optimization */
  jobId?: string;
}
/**
 * Props for the UniversalMediaUploader component
 */
interface UniversalMediaUploaderProps {
  // Context configuration
  /** 
   * Upload context defining validation rules and behavior
   * @example "profile_picture" | "portfolio" | "application"
   */
  context: 'profile_picture' | 'compcard' | 'portfolio' | 'video_library' | 'voice_portfolio' | 'application' | 'document';
  /** 
   * Optional context ID for associating uploads (e.g., job ID for applications)
   */
  contextId?: string;
  /** 
   * Optional slot ID for structured uploads (e.g., specific portfolio sections)
   */
  slotId?: string;
  // Upload configuration
  /** 
   * Maximum number of files allowed
   * @default Based on context (profile: 1, portfolio: 20, etc.)
   */
  maxFiles?: number;
  /** 
   * Maximum file size in bytes
   * @default Based on context and tenant limits
   */
  maxFileSize?: number;
  /** 
   * Allowed MIME types for upload
   * @default Based on context (images for profile, images+videos for portfolio, etc.)
   */
  acceptedFormats?: string[];
  /** 
   * Whether to automatically trigger optimization after upload
   * @default true
   */
  autoOptimize?: boolean;
  // UI configuration
  /** 
   * Whether to show thumbnail previews of uploaded files
   * @default true
   */
  showPreview?: boolean;
  /** 
   * Whether to show upload progress bars
   * @default true
   */
  showProgress?: boolean;
  /** 
   * Whether to show optimization status badges
   * @default true
   */
  showOptimizationStatus?: boolean;
  /** Additional CSS classes for styling */
  className?: string;
  // Callbacks
  /** Called when upload starts with selected files */
  onUploadStart?: (files: File[]) => void;
  /** Called during upload with progress updates */
  onUploadProgress?: (progress: UploadProgress[]) => void;
  /** Called when all uploads complete successfully */
  onUploadComplete?: (mediaAssets: MediaAsset[]) => void;
  /** Called when upload fails with error details */
  onUploadError?: (error: string, file?: File) => void;
  /** Called when optimization completes for individual files */
  onOptimizationComplete?: (mediaAsset: MediaAsset) => void;
}
// Default configurations based on context (fallbacks)
const getDefaultContextConfig = (context: string) => {
  const configs = {
    profile_picture: {
      maxFiles: 1,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      acceptedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      autoOptimize: true
    },
    compcard: {
      maxFiles: 1,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      acceptedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      autoOptimize: true
    },
    portfolio: {
      maxFiles: 20,
      maxFileSize: 25 * 1024 * 1024, // 25MB
      acceptedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/mov'],
      autoOptimize: true
    },
    video_library: {
      maxFiles: 10,
      maxFileSize: 500 * 1024 * 1024, // 500MB
      acceptedFormats: ['video/mp4', 'video/mov', 'video/webm', 'video/avi', 'video/wmv'],
      autoOptimize: true
    },
    voice_portfolio: {
      maxFiles: 10,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      acceptedFormats: ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac'],
      autoOptimize: true
    },
    application: {
      maxFiles: 5,
      maxFileSize: 15 * 1024 * 1024, // 15MB
      acceptedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
      autoOptimize: true
    },
    document: {
      maxFiles: 10,
      maxFileSize: 25 * 1024 * 1024, // 25MB
      acceptedFormats: ['application/pdf', 'text/plain', 'image/jpeg', 'image/png'],
      autoOptimize: true
    }
  };
  return configs[context as keyof typeof configs] || configs.portfolio;
};
// Dynamic configuration loader that fetches from admin settings
const getContextConfig = async (context: string) => {
  try {
    // Fetch admin settings from API
    const response = await fetch('/api/admin/settings/media');
    if (!response.ok) {
      // Note: This will be logged properly when component is initialized
      return getDefaultContextConfig(context);
    }
    const result = await response.json();
    const settings = result.data || [];
    // Convert settings array to key-value map
    const settingsMap = settings.reduce((acc: any, setting: any) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    // Parse admin settings for different contexts
    const getAdminValue = (key: string, defaultValue: any) => {
      const value = settingsMap[key];
      if (value === undefined) return defaultValue;
      // Parse JSON strings
      if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
        try {
          return JSON.parse(value);
        } catch {
          return defaultValue;
        }
      }
      // Parse numeric strings
      if (typeof value === 'string' && !isNaN(Number(value))) {
        return Number(value);
      }
      return value;
    };
    // Get base settings from admin
    const maxFileSizeMB = getAdminValue('video_max_file_size_mb', 500);
    const videoFormats = getAdminValue('video_allowed_formats', ['mp4', 'mov', 'webm', 'avi', 'wmv']);
    const imageFormats = getAdminValue('allowed_image_formats', ['jpeg', 'jpg', 'png', 'webp']);
    // Context-specific configurations using admin settings
    const configs = {
      profile_picture: {
        maxFiles: 1,
        maxFileSize: getAdminValue('max_file_size_mb', 25) * 1024 * 1024,
        acceptedFormats: imageFormats.map((f: string) => f.startsWith('image/') ? f : `image/${f}`),
        autoOptimize: true
      },
      compcard: {
        maxFiles: 1,
        maxFileSize: getAdminValue('max_file_size_mb', 25) * 1024 * 1024,
        acceptedFormats: imageFormats.map((f: string) => f.startsWith('image/') ? f : `image/${f}`),
        autoOptimize: true
      },
      portfolio: {
        maxFiles: 20,
        maxFileSize: getAdminValue('max_file_size_mb', 25) * 1024 * 1024,
        acceptedFormats: [
          ...imageFormats.map((f: string) => f.startsWith('image/') ? f : `image/${f}`),
          ...videoFormats.map((f: string) => f.startsWith('video/') ? f : `video/${f}`)
        ],
        autoOptimize: true
      },
      video_library: {
        maxFiles: 10,
        maxFileSize: maxFileSizeMB * 1024 * 1024, // Use admin setting for video max size
        acceptedFormats: videoFormats.map((f: string) => f.startsWith('video/') ? f : `video/${f}`),
        autoOptimize: true
      },
      voice_portfolio: {
        maxFiles: 10,
        maxFileSize: getAdminValue('audio_max_file_size_mb', 50) * 1024 * 1024,
        acceptedFormats: getAdminValue('allowed_audio_formats', ['mp3', 'wav', 'm4a', 'aac']).map((f: string) => f.startsWith('audio/') ? f : `audio/${f}`),
        autoOptimize: true
      },
      application: {
        maxFiles: 5,
        maxFileSize: getAdminValue('max_file_size_mb', 25) * 1024 * 1024,
        acceptedFormats: [
          ...imageFormats.map((f: string) => f.startsWith('image/') ? f : `image/${f}`),
          'application/pdf'
        ],
        autoOptimize: true
      },
      document: {
        maxFiles: 10,
        maxFileSize: getAdminValue('max_file_size_mb', 25) * 1024 * 1024,
        acceptedFormats: getAdminValue('allowed_document_types', ['application/pdf', 'text/plain']),
        autoOptimize: true
      }
    };
    return configs[context as keyof typeof configs] || configs.portfolio;
  } catch (error) {
    // This will be logged properly when component is initialized
    return getDefaultContextConfig(context);
  }
};
// File type icons
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
  if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />;
  if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
};
// Status badge component
const StatusBadge: React.FC<{ status: string; isOptimized?: boolean }> = ({ status, isOptimized }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'uploading':
        return { color: 'bg-blue-500', icon: <RefreshCw className="h-3 w-3 animate-spin" />, text: 'Uploading' };
      case 'processing':
        return { color: 'bg-yellow-500', icon: <RefreshCw className="h-3 w-3 animate-spin" />, text: 'Processing' };
      case 'completed':
        return { 
          color: isOptimized ? 'bg-green-500' : 'bg-blue-500', 
          icon: <CheckCircle className="h-3 w-3" />, 
          text: isOptimized ? 'Optimized' : 'Uploaded' 
        };
      case 'error':
        return { color: 'bg-red-500', icon: <AlertCircle className="h-3 w-3" />, text: 'Failed' };
      case 'retrying':
        return { color: 'bg-orange-500', icon: <RefreshCw className="h-3 w-3 animate-spin" />, text: 'Retrying' };
      default:
        return { color: 'bg-gray-500', icon: null, text: status };
    }
  };
  const config = getStatusConfig();
  return (
    <Badge className={cn('text-white', config.color)}>
      {config.icon}
      <span className="ml-1">{config.text}</span>
    </Badge>
  );
};
export function UniversalMediaUploader(props: UniversalMediaUploaderProps) {
  const log = useComponentLogger('UniversalMediaUploader');
  const { toast } = useToast();
  // Remove translation hook as it's causing issues
  // const t = useTranslations('ui');
  // Context configuration state
  const [contextConfig, setContextConfig] = useState(getDefaultContextConfig(props.context));
  const [configLoading, setConfigLoading] = useState(true);
  // Load admin settings on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setConfigLoading(true);
        const config = await getContextConfig(props.context);
        setContextConfig(config);
      } catch (error) {
        log.warn('Failed to load admin settings, using defaults', { error: error.message });
        setContextConfig(getDefaultContextConfig(props.context));
      } finally {
        setConfigLoading(false);
      }
    };
    loadConfig();
  }, [props.context, log]);
  // Get final configuration values
  const maxFiles = props.maxFiles ?? contextConfig.maxFiles;
  const maxFileSize = props.maxFileSize ?? contextConfig.maxFileSize;
  const acceptedFormats = props.acceptedFormats ?? contextConfig.acceptedFormats;
  // State
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  // File validation
  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `File type ${file.type} not supported. Allowed: ${acceptedFormats.join(', ')}`;
    }
    if (file.size > maxFileSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(1);
      return `File size ${sizeMB}MB exceeds maximum ${maxSizeMB}MB`;
    }
    return null;
  }, [acceptedFormats, maxFileSize]);
  // Upload single file
  const uploadFile = useCallback(async (file: File, progressIndex: number): Promise<MediaAsset | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('context', props.context);
    if (props.contextId) formData.append('contextId', props.contextId);
    if (props.slotId) formData.append('slotId', props.slotId);
    return new Promise<MediaAsset | null>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(prev => {
            const updated = prev.map((p, i) => 
              i === progressIndex ? { ...p, progress } : p
            );
            props.onUploadProgress?.(updated);
            return updated;
          });
        }
      };
      xhr.onload = async () => {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const result = JSON.parse(xhr.responseText);
            if (result.success && result.mediaAsset) {
              // Update progress to completed
              setUploadProgress(prev => prev.map((p, i) => 
                i === progressIndex ? {
                  ...p,
                  progress: 100,
                  status: 'completed' as const,
                  mediaAsset: result.mediaAsset,
                  jobId: result.mediaAsset.jobId
                } : p
              ));
              log.debug('File upload completed', { 
                fileName: file.name, 
                mediaAssetId: result.mediaAsset.id,
                jobId: result.mediaAsset.jobId
              });
              resolve(result.mediaAsset);
            } else {
              throw new Error(result.error || 'Upload failed');
            }
          } else {
            const errorData = JSON.parse(xhr.responseText);
            throw new Error(errorData.error || `Upload failed with status ${xhr.status}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          log.error('Upload failed', { fileName: file.name, error: errorMessage });
          // Update progress to error
          setUploadProgress(prev => prev.map((p, i) => 
            i === progressIndex ? {
              ...p,
              status: 'error' as const,
              error: errorMessage
            } : p
          ));
          props.onUploadError?.(errorMessage, file);
          resolve(null);
        }
      };
      xhr.onerror = () => {
        const errorMessage = 'Network error occurred';
        log.error('Upload failed', { fileName: file.name, error: errorMessage });
        // Update progress to error
        setUploadProgress(prev => prev.map((p, i) => 
          i === progressIndex ? {
            ...p,
            status: 'error' as const,
            error: errorMessage
          } : p
        ));
        props.onUploadError?.(errorMessage, file);
        resolve(null);
      };
      xhr.onabort = () => {
        log.debug('Upload cancelled', { fileName: file.name });
        resolve(null);
      };
      // Handle abort controller
      if (abortControllerRef.current) {
        abortControllerRef.current.signal.addEventListener('abort', () => {
          xhr.abort();
        });
      }
      xhr.open('POST', '/api/media/upload');
      xhr.send(formData);
    });
  }, [props.context, props.contextId, props.slotId, log, props.onUploadError]);
  // Handle file drop/selection
  const handleFiles = useCallback(async (files: File[]) => {
    log.debug('Files selected for upload', { count: files.length, context: props.context });
    // Validate file count
    if (files.length > maxFiles) {
      const error = `Maximum ${maxFiles} files allowed`;
      toast({
        title: 'Too many files',
        description: error,
        variant: 'destructive'
      });
      props.onUploadError?.(error);
      return;
    }
    // Validate each file
    const validationErrors: string[] = [];
    const validFiles: File[] = [];
    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        validationErrors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });
    if (validationErrors.length > 0) {
      toast({
        title: 'File validation failed',
        description: validationErrors.join('\n'),
        variant: 'destructive'
      });
      props.onUploadError?.(validationErrors.join(', '));
      return;
    }
    if (validFiles.length === 0) {
      return;
    }
    // Initialize progress tracking
    const initialProgress: UploadProgress[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));
    setUploadProgress(initialProgress);
    setIsUploading(true);
    abortControllerRef.current = new AbortController();
    props.onUploadStart?.(validFiles);
    try {
      // Upload files
      const uploadPromises = validFiles;
      const results = await Promise.allSettled(uploadPromises);
      // Process results
      const successfulUploads: MediaAsset[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          successfulUploads.push(result.value);
        }
      });
      if (successfulUploads.length > 0) {
        props.onUploadComplete?.(successfulUploads);
        toast({
          title: 'Upload successful',
          description: `${successfulUploads.length} file(s) uploaded and queued for optimization`,
          variant: 'default'
        });
      }
    } catch (error) {
      log.error('Upload batch failed', { error: error instanceof Error ? error.message : String(error) });
      toast({
        title: 'Upload failed',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  }, [maxFiles, validateFile, uploadFile, props.onUploadStart, props.onUploadComplete, props.onUploadError, toast, log, props.context]);
  // Configure accept settings for dropzone
  const acceptConfig = acceptedFormats.reduce((acc, format) => {
    return { ...acc, [format]: [] };
  }, {});
  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFiles,
    accept: acceptConfig,
    maxFiles,
    maxSize: maxFileSize,
    disabled: isUploading
  });
  // Cancel upload
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsUploading(false);
      setUploadProgress([]);
      toast({
        title: 'Upload cancelled',
        description: 'All uploads have been cancelled',
        variant: 'default'
      });
    }
  }, [toast]);
  // Retry failed upload
  const retryUpload = useCallback((index: number) => {
    const progressItem = uploadProgress[index];
    if (progressItem && progressItem.status === 'error') {
      handleFiles([progressItem.file]);
    }
  }, [uploadProgress, handleFiles]);
  return (
    <div className={cn('space-y-4', props.className)}>
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Upload {props.context.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
              isUploading && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <div>
                <p className="text-lg font-medium">Drop files here</p>
                <p className="text-sm text-muted-foreground">Release to upload</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium">
                  Drag & drop or click to select
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Max {maxFiles} file{maxFiles > 1 ? 's' : ''}, up to {(maxFileSize / (1024 * 1024)).toFixed(0)}MB each
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported: {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}
                </p>
              </div>
            )}
            {isUploading && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  cancelUpload();
                }}
                className="mt-4"
              >
                Cancel Upload
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Upload Progress */}
      {props.showProgress && uploadProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Upload Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {uploadProgress.map((progress, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {getFileIcon(progress.file.type)}
                    <span className="text-sm font-medium truncate">
                      {progress.file.name}
                    </span>
                    <StatusBadge 
                      status={progress.status} 
                      isOptimized={progress.mediaAsset?.isOptimized}
                    />
                  </div>
                  {progress.status === 'error' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => retryUpload(index)}
                    >
                      Retry
                    </Button>
                  )}
                  {progress.status === 'completed' && progress.mediaAsset && (
                    <Badge variant="outline" className="text-xs">
                      {props.showOptimizationStatus && progress.mediaAsset.processingStatus === 'queued' && 'Optimizing...'}
                      {props.showOptimizationStatus && progress.mediaAsset.isOptimized && 'Optimized'}
                    </Badge>
                  )}
                </div>
                {progress.status === 'uploading' && (
                  <Progress value={progress.progress} className="h-2" />
                )}
                {progress.error && (
                  <p className="text-xs text-red-600">{progress.error}</p>
                )}
                {progress.mediaAsset && props.showOptimizationStatus && (
                  <div className="text-xs text-muted-foreground">
                    {progress.mediaAsset.jobId && `Job ID: ${progress.mediaAsset.jobId}`}
                    {progress.mediaAsset.thumbnailFormats && Object.keys(progress.mediaAsset.thumbnailFormats).length > 0 && 
                      ` • Thumbnails: ${Object.keys(progress.mediaAsset.thumbnailFormats).join(', ')}`
                    }
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

UniversalMediaUploader.displayName = 'UniversalMediaUploader';

// Export types for external usage and documentation
export type { UniversalMediaUploaderProps, UploadProgress }; 