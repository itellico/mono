'use client';
import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, X, File, Image, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
export interface FileUploadConfig {
  // Upload behavior
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in bytes
  // File validation
  acceptedTypes?: string[]; // e.g., ['image/jpeg', 'image/png', 'application/pdf']
  acceptedExtensions?: string[]; // e.g., ['.jpg', '.png', '.pdf']
  // Upload endpoint
  uploadUrl: string;
  uploadMethod?: 'POST' | 'PUT';
  // UI customization
  title?: string;
  description?: string;
  dragText?: string;
  buttonText?: string;
  // Validation messages
  messages?: {
    invalidType?: string;
    invalidSize?: string;
    maxFilesExceeded?: string;
    uploadFailed?: string;
  };
}
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  thumbnailUrl?: string;
  uploadProgress?: number;
  error?: string;
  status: 'uploading' | 'success' | 'error';
}
interface FileUploadProps {
  config: FileUploadConfig;
  onFilesUploaded?: (files: UploadedFile[]) => void;
  onFileRemoved?: (fileId: string) => void;
  onUploadProgress?: (fileId: string, progress: number) => void;
  onError?: (error: string) => void;
  initialFiles?: UploadedFile[];
  disabled?: boolean;
  className?: string;
}
export const FileUpload = function FileUpload({
  config,
  onFilesUploaded,
  onFileRemoved,
  onUploadProgress,
  onError,
  initialFiles = [],
  disabled = false,
  className
}: FileUploadProps) {
  const t = useTranslations('ui');
  const [files, setFiles] = useState<UploadedFile[]>(initialFiles);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    multiple = false,
    maxFiles = multiple ? 10 : 1,
    maxSize = 5 * 1024 * 1024, // 5MB default
    acceptedTypes = [],
    acceptedExtensions = [],
    uploadUrl,
    uploadMethod = 'POST',
    title = 'Upload Files',
    description = t('dragDropSelect'),
    dragText = 'Drop files here',
    buttonText = 'Select Files',
    messages = {}
  } = config;
  const defaultMessages = {
    invalidType: 'File type not allowed',
    invalidSize: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
    maxFilesExceeded: `Maximum ${maxFiles} files allowed`,
    uploadFailed: 'Upload failed. Please try again.',
    ...messages
  };
  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file type
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
      return defaultMessages.invalidType;
    }
    // Check file extension
    if (acceptedExtensions.length > 0) {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedExtensions.includes(extension)) {
        return defaultMessages.invalidType;
      }
    }
    // Check file size
    if (file.size > maxSize) {
      return defaultMessages.invalidSize;
    }
    return null;
  };
  // Handle file selection
  const handleFiles = useCallback(async (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);
    // Check max files limit
    if (!multiple && files.length + fileArray.length > 1) {
      onError?.(defaultMessages.maxFilesExceeded);
      return;
    }
    if (files.length + fileArray.length > maxFiles) {
      onError?.(defaultMessages.maxFilesExceeded);
      return;
    }
    // Validate and prepare files
    const newFiles: UploadedFile[] = [];
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        onError?.(validationError);
        continue;
      }
      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      newFiles.push({
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        uploadProgress: 0
      });
    }
    if (newFiles.length === 0) return;
    // Add files to state
    setFiles(prev => multiple ? [...prev, ...newFiles] : newFiles);
    setIsUploading(true);
    // Upload files
    const uploadPromises = newFiles.map(async (fileInfo, index) => {
      const file = fileArray[index];
      try {
        const formData = new FormData();
        formData.append('file', file);
        // Add any additional metadata
        formData.append('fileId', fileInfo.id);
        formData.append('fileName', fileInfo.name);
        const response = await fetch(uploadUrl, {
          method: uploadMethod,
          body: formData });
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        const result = await response.json();
        // Update file with success data
        setFiles(prev => prev.map(f => 
          f.id === fileInfo.id 
            ? {
                ...f,
                status: 'success' as const,
                uploadProgress: 100,
                url: result.data?.cdnUrl || result.data?.url,
                thumbnailUrl: result.data?.thumbnailCdnUrl || result.data?.thumbnailUrl
              }
            : f
        ));
        return {
          ...fileInfo,
          status: 'success' as const,
          url: result.data?.cdnUrl || result.data?.url,
          thumbnailUrl: result.data?.thumbnailCdnUrl || result.data?.thumbnailUrl
        };
      } catch (error) {
        // Update file with error
        setFiles(prev => prev.map(f => 
          f.id === fileInfo.id 
            ? {
                ...f,
                status: 'error' as const,
                error: error instanceof Error ? error.message : defaultMessages.uploadFailed
              }
            : f
        ));
        onError?.(error instanceof Error ? error.message : defaultMessages.uploadFailed);
        return null;
      }
    });
    const uploadResults = await Promise.all(uploadPromises);
    const successfulUploads = uploadResults;
    setIsUploading(false);
    if (successfulUploads.length > 0) {
      onFilesUploaded?.(successfulUploads);
    }
  }, [files, multiple, maxFiles, uploadUrl, uploadMethod, onFilesUploaded, onError, maxSize, acceptedTypes, acceptedExtensions, defaultMessages]);
  // Remove file
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    onFileRemoved?.(fileId);
  };
  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };
  // File input handler
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  // Click to select files
  const selectFiles = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };
  // Get file icon
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <Card 
        className={cn(
          'border-2 border-dashed transition-colors cursor-pointer',
          isDragging ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950' : 'border-gray-300 dark:border-gray-700',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={selectFiles}
      >
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <Upload className={cn(
            'h-10 w-10 mb-4',
            isDragging ? 'text-emerald-500' : 'text-gray-400'
          )} />
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {isDragging ? dragText : description}
          </p>
          <Button
            type="button"
            variant="outline"
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950"
            disabled={disabled}
          >
            {buttonText}
          </Button>
          {/* File type information */}
          {(acceptedTypes.length > 0 || acceptedExtensions.length > 0) && (
            <p className="text-xs text-muted-foreground mt-2">
              Accepted: {acceptedTypes.length > 0 
                ? acceptedTypes.map(type => type.split('/')[1]).join(', ')
                : acceptedExtensions.join(', ')
              }
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Max size: {Math.round(maxSize / 1024 / 1024)}MB
            {multiple && ` • Max files: ${maxFiles}`}
          </p>
        </CardContent>
      </Card>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedTypes.length > 0 ? acceptedTypes.join(',') : undefined}
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />
      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            {multiple ? `Files (${files.length}/${maxFiles})` : 'File'}
          </h4>
          <div className="space-y-2">
            {files.map((file) => (
              <Card key={file.id} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      {file.status === 'uploading' && (
                        <>
                          <span>•</span>
                          <span>Uploading...</span>
                        </>
                      )}
                      {file.status === 'success' && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1 text-emerald-600">
                            <Check className="h-3 w-3" />
                            <span>Complete</span>
                          </div>
                        </>
                      )}
                      {file.status === 'error' && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertCircle className="h-3 w-3" />
                            <span>Failed</span>
                          </div>
                        </>
                      )}
                    </div>
                    {file.status === 'uploading' && (
                      <Progress 
                        value={file.uploadProgress || 0} 
                        className="h-1 mt-2"
                      />
                    )}
                    {file.error && (
                      <Alert className="mt-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                        <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                        <AlertDescription className="text-xs text-red-800 dark:text-red-200">
                          {file.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 