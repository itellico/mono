'use client';
/**
 * Universal Tenant-Aware File Upload Component
 * 
 * Replaces 3+ different upload implementations with a single, configurable component.
 * Handles profile pictures, portfolios, documents, comp cards with tenant safety.
 */
import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useDropzone } from 'react-dropzone';
import { useTenantMutation } from '@/lib/platform/tenant-query';
import { useComponentLogger } from '@/lib/platform/logging';
import { useTenantService } from '@/lib/platform/tenant-foundation-client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  File, 
  Image, 
  Video, 
  FileText, 
  X, 
  Check, 
  AlertTriangle,
  Camera,
  Folder
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getUploadComponentConfig } from '@/lib/services/upload-settings.service';
// ============================================================================
// TYPES & INTERFACES
// ============================================================================
export type FileUploadContext = 
  | 'profile_picture'
  | 'portfolio_image'
  | 'portfolio_video'
  | 'comp_card'
  | 'documents'
  | 'media_assets'
  | 'custom';
export interface FileUploadConfig {
  // Context & Permissions
  context: FileUploadContext;
  resource: string;
  tenantId?: number;
  // File Restrictions
  accept?: string[];
  maxFiles?: number;
  maxSizeMB?: number;
  allowedTypes?: string[];
  // Upload Configuration
  endpoint?: string;
  uploadPath?: string;
  // UI Labels (translation keys)
  labels?: {
    title?: string;
    description?: string;
    dragActiveText?: string;
    browseText?: string;
    successText?: string;
    errorText?: string;
  };
  // Features
  enablePreview?: boolean;
  enableProgress?: boolean;
  enableMultiple?: boolean;
  enableDragDrop?: boolean;
  enableTenantLimits?: boolean;
  enableCompression?: boolean;
  // Handlers
  onUploadStart?: (files: File[]) => void;
  onUploadProgress?: (progress: number, file: File) => void;
  onUploadSuccess?: (results: UploadResult[]) => void;
  onUploadError?: (error: Error, file?: File) => void;
  onFilesChange?: (files: File[]) => void;
  // Styling
  className?: string;
  variant?: 'default' | 'compact' | 'gallery' | 'avatar';
}
export interface UploadResult {
  file: File;
  url: string;
  path: string;
  thumbnails?: {
    small?: string;
    medium?: string;
    large?: string;
  };
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    size: number;
  };
}
// ============================================================================
// PREDEFINED CONFIGURATIONS
// ============================================================================
export const UploadConfigs = {
  profilePicture: (): Partial<FileUploadConfig> => ({
    context: 'profile_picture',
    resource: 'media',
    accept: ['image/*'],
    maxFiles: 1,
    maxSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    enablePreview: true,
    enableCompression: true,
    variant: 'avatar',
    labels: {
      title: 'uploads.profilePicture.title',
      description: 'uploads.profilePicture.description',
      dragActiveText: 'uploads.profilePicture.dragActive',
      browseText: 'uploads.profilePicture.browse' }
  }),
  portfolioImages: (): Partial<FileUploadConfig> => ({
    context: 'portfolio_image',
    resource: 'media',
    accept: ['image/*'],
    maxFiles: 20,
    maxSizeMB: 10,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    enablePreview: true,
    enableMultiple: true,
    variant: 'gallery',
    labels: {
      title: 'uploads.portfolio.title',
      description: 'uploads.portfolio.description' }
  }),
  portfolioVideos: (): Partial<FileUploadConfig> => ({
    context: 'portfolio_video',
    resource: 'media',
    accept: ['video/*'],
    maxFiles: 5,
    maxSizeMB: 100,
    allowedTypes: ['video/mp4', 'video/quicktime', 'video/avi'],
    enablePreview: true,
    enableMultiple: true,
    variant: 'gallery',
    labels: {
      title: 'uploads.videos.title',
      description: 'uploads.videos.description' }
  }),
  compCard: (): Partial<FileUploadConfig> => ({
    context: 'comp_card',
    resource: 'media',
    accept: ['image/*', 'application/pdf'],
    maxFiles: 1,
    maxSizeMB: 20,
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    enablePreview: true,
    variant: 'default',
    labels: {
      title: 'uploads.compCard.title',
      description: 'uploads.compCard.description'
    }
  }),
  documents: (): Partial<FileUploadConfig> => ({
    context: 'documents',
    resource: 'media',
    accept: ['.pdf', '.doc', '.docx', '.txt'],
    maxFiles: 10,
    maxSizeMB: 25,
    allowedTypes: ['application/pdf', 'application/msword', 'text/plain'],
    enablePreview: false,
    enableMultiple: true,
    variant: 'default',
    labels: {
      title: 'uploads.documents.title',
      description: 'uploads.documents.description'
    }
  })
};
// ============================================================================
// FILE VALIDATION UTILITIES
// ============================================================================
function validateFile(file: File, config: FileUploadConfig): string | null {
  // Size validation
  if (config.maxSizeMB && file.size > config.maxSizeMB * 1024 * 1024) {
    return `File size exceeds ${config.maxSizeMB}MB limit`;
  }
  // Type validation
  if (config.allowedTypes && !config.allowedTypes.includes(file.type)) {
    return `File type ${file.type} is not allowed`;
  }
  // Context-specific validations
  switch (config.context) {
    case 'profile_picture':
      if (!file.type.startsWith('image/')) {
        return 'Profile picture must be an image';
      }
      break;
    case 'portfolio_image':
      if (!file.type.startsWith('image/')) {
        return 'Portfolio items must be images';
      }
      break;
    case 'portfolio_video':
      if (!file.type.startsWith('video/')) {
        return 'Portfolio videos must be video files';
      }
      break;
  }
  return null;
}
function getFileIcon(file: File) {
  if (file.type.startsWith('image/')) return Image;
  if (file.type.startsWith('video/')) return Video;
  if (file.type === 'application/pdf' || file.type.includes('document')) return FileText;
  return File;
}
// ============================================================================
// FILE PREVIEW COMPONENT
// ============================================================================
function FilePreview({ 
  file, 
  onRemove, 
  enablePreview 
}: { 
  file: File; 
  onRemove: () => void;
  enablePreview: boolean;
}) {
  const [preview, setPreview] = React.useState<string | null>(null);
  const IconComponent = getFileIcon(file);
  React.useEffect(() => {
    if (enablePreview && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, enablePreview]);
  return (
    <div className="relative group">
      <Card className="overflow-hidden">
        <CardContent className="p-2">
          {preview ? (
            <img
              src={preview}
              alt={file.name}
              className="w-full h-20 object-cover rounded"
            />
          ) : (
            <div className="w-full h-20 flex items-center justify-center bg-muted rounded">
              <IconComponent className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="mt-2 space-y-1">
            <p className="text-xs font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
        </CardContent>
      </Card>
      <Button
        variant="destructive"
        size="sm"
        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
// ============================================================================
// MAIN UPLOAD COMPONENT
// ============================================================================
export function UniversalFileUpload({
  context,
  resource,
  tenantId,
  accept = [],
  maxFiles = 1,
  maxSizeMB = 10,
  allowedTypes = [],
  endpoint,
  uploadPath,
  labels = {},
  enablePreview = true,
  enableProgress = true,
  enableMultiple = false,
  enableDragDrop = true,
  enableTenantLimits = true,
  enableCompression = false,
  onUploadStart,
  onUploadProgress,
  onUploadSuccess,
  onUploadError,
  onFilesChange,
  className,
  variant = 'default' }: FileUploadConfig) {
  const t = useTranslations();
  const log = useComponentLogger(`UniversalFileUpload:${context}`);
  const { toast } = useToast();
  const tenantService = useTenantService();
  // State management
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = React.useState<Record<string, number>>({});
  const [uploading, setUploading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  // Upload mutation
  const uploadMutation = useTenantMutation(
    endpoint || `/api/v1/upload/${context}`,
    {
      resource,
      action: 'upload',
      tenantId,
      requirePermission: true,
      showToasts: false, // We handle toasts manually
      invalidateQueries: [`tenant-query`, `admin-query`] }
  );
  // File drop configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles: enableMultiple ? maxFiles : 1,
    maxSize: maxSizeMB * 1024 * 1024,
    disabled: uploading,
    onDrop: handleFilesDrop,
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(({ file, errors }) => {
        const errorMessages = errors.map(e => e.message).join(', ');
        log.warn('File rejected', { fileName: file.name, errors: errorMessages });
        toast({
          title: 'File Rejected',
          description: `${file.name}: ${errorMessages}`,
          variant: 'destructive' });
      });
    } });
  // Handle file selection
  async function handleFilesDrop(acceptedFiles: File[]) {
    log.debug('Files dropped', { count: acceptedFiles.length, context });
    // Validate files
    const validatedFiles: File[] = [];
    const validationErrors: Record<string, string> = {};
    for (const file of acceptedFiles) {
      const error = validateFile(file, {
        context,
        resource,
        maxSizeMB,
        allowedTypes,
        maxFiles } as FileUploadConfig);
      if (error) {
        validationErrors[file.name] = error;
        log.warn('File validation failed', { fileName: file.name, error });
      } else {
        validatedFiles.push(file);
      }
    }
    setErrors(validationErrors);
    // TODO: Check tenant limits if enabled
    // Note: enforceLimit method needs to be implemented on ClientTenantService
    if (enableTenantLimits && validatedFiles.length > 0) {
      log.debug('Tenant upload limits check skipped - enforceLimit not implemented', { 
        context, 
        fileCount: validatedFiles.length 
      });
      // TODO: Implement tenant upload limits check
      // try {
      //   await tenantService?.enforceLimit('upload_media', validatedFiles.length);
      // } catch (error) {
      //   log.error('Tenant upload limit exceeded', { context, fileCount: validatedFiles.length });
      //   toast({
      //     title: 'Upload Limit Exceeded',
      //     description: 'Your current plan doesn&apos;t allow uploading more files.',
      //     variant: 'destructive',
      //   });
      //   return;
      // }
    }
    // Update file list
    const newFiles = enableMultiple ? [...files, ...validatedFiles] : validatedFiles;
    setFiles(newFiles);
    onFilesChange?.(newFiles);
    // Auto-upload if single file mode
    if (!enableMultiple && validatedFiles.length > 0) {
      await handleUpload(validatedFiles);
    }
  }
  // Remove file
  const removeFile = React.useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange?.(newFiles);
    // Clear any errors for removed file
    const removedFile = files[index];
    if (removedFile && errors[removedFile.name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[removedFile.name];
        return newErrors;
      });
    }
  }, [files, onFilesChange, errors]);
  // Upload files
  const handleUpload = React.useCallback(async (filesToUpload?: File[]) => {
    const uploadFiles = filesToUpload || files;
    if (uploadFiles.length === 0) return;
    log.debug('Starting file upload', { count: uploadFiles.length, context });
    setUploading(true);
    onUploadStart?.(uploadFiles);
    try {
      const results: UploadResult[] = [];
      for (const file of uploadFiles) {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        try {
          // Create form data
          const formData = new FormData();
          formData.append('file', file);
          formData.append('context', context);
          formData.append('resource', resource);
          if (tenantId) formData.append('tenantId', tenantId.toString());
          if (uploadPath) formData.append('uploadPath', uploadPath);
          // Upload with progress tracking
          const result = await uploadMutation.mutateAsync(formData);
          results.push({
            file,
            url: result.url,
            path: result.path,
            thumbnails: result.thumbnails,
            metadata: {
              size: file.size,
              width: result.metadata?.width,
              height: result.metadata?.height,
              duration: result.metadata?.duration } });
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          log.info('File uploaded successfully', { 
            fileName: file.name, 
            url: result.url, 
            context 
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          log.error('File upload failed', { fileName: file.name, error: errorMessage });
          onUploadError?.(error as Error, file);
          toast({
            title: 'Upload Failed',
            description: `${file.name}: ${errorMessage}`,
            variant: 'destructive' });
        }
      }
      if (results.length > 0) {
        onUploadSuccess?.(results);
        toast({
          title: 'Upload Successful',
          description: `${results.length} file(s) uploaded successfully` });
        // Clear files after successful upload
        setFiles([]);
        setUploadProgress({});
      }
    } finally {
      setUploading(false);
    }
  }, [files, context, resource, tenantId, uploadPath, uploadMutation, onUploadStart, onUploadSuccess, onUploadError, log, toast]);
  // Render based on variant
  const renderUploadArea = () => {
    const baseProps = {
      ...getRootProps(),
      className: `
        border-2 border-dashed rounded-lg transition-colors cursor-pointer
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
        ${uploading ? 'pointer-events-none opacity-50' : 'hover:border-primary'}
        ${className || ''}
      ` };
    switch (variant) {
      case 'avatar':
        return (
          <div {...baseProps} className={`w-24 h-24 rounded-full ${baseProps.className}`}>
            <input {...getInputProps()} />
            <div className="w-full h-full flex items-center justify-center">
              {files.length > 0 && enablePreview ? (
                <img
                  src={URL.createObjectURL(files[0])}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <Camera className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
          </div>
        );
      case 'compact':
        return (
          <div {...baseProps} className={`p-4 ${baseProps.className}`}>
            <input {...getInputProps()} />
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {labels.browseText ? t(labels.browseText) : t('uploads.browse')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {labels.description ? t(labels.description) : ''}
                </p>
              </div>
            </div>
          </div>
        );
      case 'gallery':
        return (
          <div className="space-y-4">
            <div {...baseProps} className={`p-8 text-center ${baseProps.className}`}>
              <input {...getInputProps()} />
              <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <div className="space-y-2">
                <h3 className="font-medium">
                  {isDragActive
                    ? (labels.dragActiveText ? t(labels.dragActiveText) : t('uploads.dropHere'))
                    : (labels.title ? t(labels.title) : t('uploads.selectFiles'))
                  }
                </h3>
                <p className="text-sm text-muted-foreground">
                  {labels.description ? t(labels.description) : ''}
                </p>
              </div>
            </div>
            {files.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {files.map((file, index) => (
                  <FilePreview
                    key={`${file.name}-${index}`}
                    file={file}
                    onRemove={() => removeFile(index)}
                    enablePreview={enablePreview}
                  />
                ))}
              </div>
            )}
          </div>
        );
      default:
        return (
          <div {...baseProps} className={`p-8 text-center ${baseProps.className}`}>
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <div className="space-y-2">
              <h3 className="font-medium">
                {isDragActive
                  ? (labels.dragActiveText ? t(labels.dragActiveText) : t('uploads.dropHere'))
                  : (labels.title ? t(labels.title) : t('uploads.selectFiles'))
                }
              </h3>
              <p className="text-sm text-muted-foreground">
                {labels.description ? t(labels.description) : ''}
              </p>
              <Button variant="outline" size="sm" disabled={uploading}>
                {labels.browseText ? t(labels.browseText) : t('uploads.browse')}
              </Button>
            </div>
          </div>
        );
    }
  };
  return (
    <div className="space-y-4">
      {renderUploadArea()}
      {/* File List for non-gallery variants */}
      {variant !== 'gallery' && files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center gap-3 p-3 border rounded">
              <div className="flex-1">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
                {errors[file.name] && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    {errors[file.name]}
                  </p>
                )}
              </div>
              {enableProgress && uploadProgress[file.name] !== undefined && (
                <div className="w-20">
                  <Progress value={uploadProgress[file.name]} className="h-2" />
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      {/* Upload Button for multiple files */}
      {enableMultiple && files.length > 0 && !uploading && (
        <Button onClick={() => handleUpload()} className="w-full">
          Upload {files.length} File{files.length > 1 ? 's' : ''}
        </Button>
      )}
      {/* Upload Progress */}
      {uploading && enableProgress && (
        <Alert>
          <Upload className="h-4 w-4" />
          <AlertDescription>
            Uploading files... Please don&apos;t close this window.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
// ============================================================================
// SPECIALIZED UPLOAD COMPONENTS
// ============================================================================
export function ProfilePictureUpload(props: Partial<FileUploadConfig>) {
  return <UniversalFileUpload {...UploadConfigs.profilePicture() as FileUploadConfig} {...props} />;
}
export function PortfolioImageUpload(props: Partial<FileUploadConfig>) {
  return <UniversalFileUpload {...UploadConfigs.portfolioImages() as FileUploadConfig} {...props} />;
}
export function PortfolioVideoUpload(props: Partial<FileUploadConfig>) {
  return <UniversalFileUpload {...UploadConfigs.portfolioVideos() as FileUploadConfig} {...props} />;
}
export function CompCardUpload(props: Partial<FileUploadConfig>) {
  return <UniversalFileUpload {...UploadConfigs.compCard() as FileUploadConfig} {...props} />;
}
export function DocumentUpload(props: Partial<FileUploadConfig>) {
  return <UniversalFileUpload {...UploadConfigs.documents() as FileUploadConfig} {...props} />;
}
export default UniversalFileUpload; 