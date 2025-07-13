'use client';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, X, Image, Video, FileText, Music, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { browserLogger } from '@/lib/browser-logger';
import { useTranslations } from 'next-intl';
export interface MediaUploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error' | 'pending';
  cdnUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  mediaAssetId?: number;
}
export interface MediaUploadConfig {
  // File restrictions
  maxFiles: number;
  maxFileSize: number; // in bytes
  acceptedTypes: readonly string[] | string[]; // MIME types
  // Visual config
  variant?: 'default' | 'compact' | 'grid' | 'profile';
  showProgress?: boolean;
  showPreview?: boolean;
  // Upload config
  uploadEndpoint?: string;
  onUploadComplete?: (files: MediaUploadFile[]) => void;
  onUploadStart?: (files: File[]) => void;
  onUploadError?: (error: string) => void;
  onFilesChange?: (files: MediaUploadFile[]) => void;
  // Existing files
  existingFiles?: MediaUploadFile[];
  // Picture type for media storage
  pictureType?: 'profile_picture' | 'model_book' | 'set_card' | 'application_photo' | 'verification_photo';
  // Garbage collection
  enableGarbageCollection?: boolean;
  garbageCollectionDelay?: number; // in milliseconds
}
const defaultConfig: Partial<MediaUploadConfig> = {
  maxFiles: 1,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  variant: 'default',
  showProgress: true,
  showPreview: true,
  uploadEndpoint: '/api/media/upload',
  enableGarbageCollection: true,
  garbageCollectionDelay: 30000, // 30 seconds
};
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType.startsWith('audio/')) return Music;
  return FileText;
};
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
const generateFileId = () => crypto.randomUUID();
interface MediaUploadProps {
  config: MediaUploadConfig;
  className?: string;
}
export function MediaUpload({ config, className }: MediaUploadProps) {
  const t = useTranslations('ui');
  const mergedConfig = { ...defaultConfig, ...config };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<MediaUploadFile[]>(mergedConfig.existingFiles || []);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const garbageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Garbage collection for cancelled uploads
  const scheduleGarbageCollection = useCallback((fileIds: string[]) => {
    if (!mergedConfig.enableGarbageCollection) return;
    if (garbageTimeoutRef.current) {
      clearTimeout(garbageTimeoutRef.current);
    }
    garbageTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/media/garbage-collect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileIds }) });
      } catch (error) {
        browserLogger.warn('Garbage collection failed', { error: error.message });
      }
    }, mergedConfig.garbageCollectionDelay);
  }, [mergedConfig.enableGarbageCollection, mergedConfig.garbageCollectionDelay]);
  const uploadFile = async (file: File): Promise<MediaUploadFile> => {
    const fileId = generateFileId();
    const mediaFile: MediaUploadFile = {
      file,
      id: fileId,
      progress: 0,
      status: 'uploading' };
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileId', fileId);
    if (mergedConfig.pictureType) {
      formData.append('pictureType', mergedConfig.pictureType);
    }
    try {
      const response = await fetch(mergedConfig.uploadEndpoint!, {
        method: 'POST',
        body: formData });
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      const result = await response.json();
      return {
        ...mediaFile,
        status: 'completed',
        progress: 100,
        cdnUrl: result.cdnUrl,
        thumbnailUrl: result.thumbnailUrl,
        mediaAssetId: result.id };
    } catch (error) {
      // Schedule garbage collection for failed uploads
      scheduleGarbageCollection([fileId]);
      return {
        ...mediaFile,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed' };
    }
  };
  const handleFiles = useCallback(async (newFiles: File[]) => {
    const currentFileCount = files.length;
    const availableSlots = mergedConfig.maxFiles! - currentFileCount;
    const filesToProcess = newFiles.slice(0, availableSlots);
    // Validate files
    const invalidFiles: string[] = [];
    const validFiles: File[] = [];
    filesToProcess.forEach(file => {
      if (file.size > mergedConfig.maxFileSize!) {
        invalidFiles.push(`${file.name}: File size exceeds ${formatFileSize(mergedConfig.maxFileSize!)}`);
        return;
      }
      if (!mergedConfig.acceptedTypes!.includes(file.type)) {
        invalidFiles.push(`${file.name}: File type not supported`);
        return;
      }
      validFiles.push(file);
    });
    if (invalidFiles.length > 0) {
      mergedConfig.onUploadError?.(invalidFiles.join(', '));
      return;
    }
    if (validFiles.length === 0) return;
    mergedConfig.onUploadStart?.(validFiles);
    setIsUploading(true);
    // Create pending file entries
    const pendingFiles: MediaUploadFile[] = validFiles.map(file => ({
      file,
      id: generateFileId(),
      progress: 0,
      status: 'pending' }));
    setFiles(prev => [...prev, ...pendingFiles]);
    // Upload files
    try {
      const uploadPromises = validFiles;
      const results = await Promise.all(uploadPromises);
      setFiles(prev => {
        const updated = [...prev];
        results.forEach((result, index) => {
          const pendingIndex = updated.findIndex(f => f.file === validFiles[index]);
          if (pendingIndex !== -1) {
            updated[pendingIndex] = result;
          }
        });
        return updated;
      });
      const completedFiles = results.filter(f => f.status === 'completed');
      if (completedFiles.length > 0) {
        mergedConfig.onUploadComplete?.(completedFiles);
      }
      const errorFiles = results.filter(f => f.status === 'error');
      if (errorFiles.length > 0) {
        mergedConfig.onUploadError?.(errorFiles.map(f => f.error!).join(', '));
      }
    } finally {
      setIsUploading(false);
    }
  }, [files.length, mergedConfig, scheduleGarbageCollection]);
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove && fileToRemove.mediaAssetId) {
        // Schedule garbage collection for uploaded files
        scheduleGarbageCollection([fileId]);
      }
      return prev.filter(f => f.id !== fileId);
    });
  }, [scheduleGarbageCollection]);
  const retryUpload = useCallback(async (fileId: string) => {
    const fileToRetry = files.find(f => f.id === fileId);
    if (!fileToRetry || fileToRetry.status !== 'error') return;
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'uploading', progress: 0, error: undefined } : f
    ));
    try {
      const result = await uploadFile(fileToRetry.file);
      setFiles(prev => prev.map(f => f.id === fileId ? result : f));
      if (result.status === 'completed') {
        mergedConfig.onUploadComplete?.([ result]);
      } else {
        mergedConfig.onUploadError?.(result.error!);
      }
    } catch (error) {
              browserLogger.error('Retry upload failed', { error: error.message });
    }
  }, [files, mergedConfig, uploadFile, scheduleGarbageCollection]);

  // Event handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, [handleFiles]);
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFiles(selectedFiles);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  // Calculate stats
  const uploadedCount = files.filter(f => f.status === 'completed').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const canUploadMore = files.length < mergedConfig.maxFiles!;
  // Notify parent of changes
  React.useEffect(() => {
    mergedConfig.onFilesChange?.(files);
  }, [files, mergedConfig]);
  // Profile variant for single image upload
  if (mergedConfig.variant === 'profile') {
    const currentFile = files[0];
    return (
      <div className={cn("relative", className)}>
        <div 
          className={cn(
            "relative w-32 h-32 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center cursor-pointer transition-all",
            isDragOver && "border-emerald-400 bg-emerald-50",
            currentFile?.status === 'completed' && "border-emerald-400"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          {currentFile?.status === 'completed' && currentFile.cdnUrl ? (
            <img 
              src={currentFile.thumbnailUrl || currentFile.cdnUrl} 
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
            />
          ) : currentFile?.status === 'uploading' ? (
            <div className="text-center">
              <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
              <Progress value={currentFile.progress} className="w-16" />
            </div>
          ) : currentFile?.status === 'error' ? (
            <div className="text-center">
              <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  retryUpload(currentFile.id);
                }}
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
              <span className="text-xs text-gray-500">Upload</span>
            </div>
          )}
          {currentFile && (
            <Button
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
              onClick={(e) => {
                e.stopPropagation();
                removeFile(currentFile.id);
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple={false}
          accept={mergedConfig.acceptedTypes!.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>
    );
  }
  // Default variant
  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      {canUploadMore && (
        <Card 
          className={cn(
            "border-2 border-dashed transition-all cursor-pointer",
            isDragOver ? "border-emerald-400 bg-emerald-50" : "border-gray-300 hover:border-gray-400"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <CardContent className="p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">
                {files.length === 0 ? 'Upload Files' : `Upload More Files`}
              </h3>
              <p className="text-sm text-gray-600">
                {t('dragDropBrowse')}
              </p>
              <p className="text-xs text-gray-500">
                {mergedConfig.acceptedTypes!.map(type => type.split('/')[1]).join(', ')} up to {formatFileSize(mergedConfig.maxFileSize!)}
              </p>
              <p className="text-xs text-gray-500">
                {uploadedCount}/{mergedConfig.maxFiles} files uploaded
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Stats */}
      {files.length > 0 && (
        <div className="flex gap-2">
          <Badge variant="default" className="bg-emerald-500">
            {uploadedCount} uploaded
          </Badge>
          {errorCount > 0 && (
            <Badge variant="destructive">
              {errorCount} failed
            </Badge>
          )}
          {isUploading && (
            <Badge variant="secondary">
              Uploading...
            </Badge>
          )}
        </div>
      )}
      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((mediaFile) => {
            const Icon = getFileIcon(mediaFile.file.type);
            return (
              <Card key={mediaFile.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {mergedConfig.showPreview && mediaFile.file.type.startsWith('image/') && mediaFile.cdnUrl ? (
                      <img 
                        src={mediaFile.thumbnailUrl || mediaFile.cdnUrl} 
                        alt={mediaFile.file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        <Icon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {mediaFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(mediaFile.file.size)}
                    </p>
                    {mergedConfig.showProgress && mediaFile.status === 'uploading' && (
                      <Progress value={mediaFile.progress} className="mt-2" />
                    )}
                    {mediaFile.status === 'error' && (
                      <Alert className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {mediaFile.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {mediaFile.status === 'completed' && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    )}
                    {mediaFile.status === 'error' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retryUpload(mediaFile.id)}
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(mediaFile.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        multiple={mergedConfig.maxFiles! > 1}
        accept={mergedConfig.acceptedTypes!.join(',')}
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
}
// Predefined configurations for common use cases
export const MediaUploadPresets = {
  profilePicture: {
    maxFiles: 1,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    variant: 'profile' as const,
    pictureType: 'profile_picture' as const },
  portfolioPhotos: {
    maxFiles: 20,
    maxFileSize: 25 * 1024 * 1024, // 25MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    variant: 'grid' as const,
    pictureType: 'model_book' as const },
  setCard: {
    maxFiles: 5,
    maxFileSize: 15 * 1024 * 1024, // 15MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    variant: 'default' as const,
    pictureType: 'set_card' as const },
  documents: {
    maxFiles: 10,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    variant: 'default' as const,
    showPreview: false },
  videos: {
    maxFiles: 5,
    maxFileSize: 500 * 1024 * 1024, // 500MB
    acceptedTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    variant: 'default' as const,
    showPreview: false },
}; 