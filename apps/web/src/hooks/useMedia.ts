'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

// Types
interface MediaAsset {
  id: number;
  fileName: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  fileSize: number;
  mimeType: string;
  mediaType: string;
  pictureType: string;
  isProcessed: boolean;
  processingStatus: string;
  uploadedAt: string;
  updatedAt: string;
}

interface MediaStats {
  totalSize: number;
  photoCount: number;
  videoCount: number;
  audioCount: number;
  documentCount: number;
}

interface MediaFilters {
  page?: number;
  limit?: number;
  mediaType?: string;
  pictureType?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  isProcessed?: boolean;
  includeDeleted?: boolean;
}

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

// Hook for listing media assets
export function useMediaAssets(filters: MediaFilters = {}) {
  return useQuery({
    queryKey: ['media-assets', filters],
    queryFn: async () => {
      const response = await apiClient.getMediaAssets(filters);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch media assets');
      }
      return response.data;
    },
    staleTime: 30000, // 30 seconds
  });
}

// Hook for getting a single media asset
export function useMediaAsset(id: number, enabled = true) {
  return useQuery({
    queryKey: ['media-asset', id],
    queryFn: async () => {
      const response = await apiClient.getMediaAsset(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch media asset');
      }
      return response.data;
    },
    enabled: enabled && !!id,
  });
}

// Hook for uploading media files
export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      files,
      context,
      metadata,
      onProgress,
    }: {
      files: File[];
      context: string;
      metadata?: any;
      onProgress?: (progress: UploadProgress[]) => void;
    }) => {
      // Simulate progress tracking
      const progressList: UploadProgress[] = files.map((file, index) => ({
        fileId: `${file.name}_${index}_${Date.now()}`,
        fileName: file.name,
        progress: 0,
        status: 'pending',
      }));

      onProgress?.(progressList);

      // Update progress to uploading
      progressList.forEach((p) => {
        p.status = 'uploading';
        p.progress = 10;
      });
      onProgress?.(progressList);

      try {
        const response = await apiClient.uploadMedia(files, context, metadata);
        
        if (!response.success) {
          // Mark all as error
          progressList.forEach((p) => {
            p.status = 'error';
            p.error = response.error || 'Upload failed';
          });
          onProgress?.(progressList);
          throw new Error(response.error || 'Upload failed');
        }

        // Update progress to processing
        progressList.forEach((p, index) => {
          p.status = 'processing';
          p.progress = 80;
        });
        onProgress?.(progressList);

        // Simulate processing completion
        setTimeout(() => {
          progressList.forEach((p) => {
            p.status = 'completed';
            p.progress = 100;
          });
          onProgress?.(progressList);
        }, 1000);

        return response.data;
      } catch (error) {
        progressList.forEach((p) => {
          p.status = 'error';
          p.error = error instanceof Error ? error.message : 'Upload failed';
        });
        onProgress?.(progressList);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success(`Successfully uploaded ${data.processedCount} file(s)`);
      
      // Invalidate media queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });
}

// Hook for deleting media asset immediately
export function useDeleteMediaAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.deleteMediaAsset(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete media asset');
      }
      return response.data;
    },
    onSuccess: (data, id) => {
      toast.success('Media asset deleted successfully');
      
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['media-asset', id] });
      
      // Invalidate media list to refresh
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });
}

// Hook for deleting media asset with grace period
export function useDeleteMediaAssetWithGracePeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mediaAssetId,
      gracePeriodHours = 24,
    }: {
      mediaAssetId: number;
      gracePeriodHours?: number;
    }) => {
      const response = await apiClient.deleteMediaAssetWithGracePeriod({
        mediaAssetId,
        gracePeriodHours,
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to schedule deletion');
      }
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Media asset scheduled for deletion in ${data.data.gracePeriodHours} hours`);
      
      // Invalidate media list to refresh status
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
    },
    onError: (error) => {
      toast.error(`Schedule deletion failed: ${error.message}`);
    },
  });
}

// Hook for running garbage collection
export function useGarbageCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dryRun = false,
      olderThanDays = 30,
    }: {
      dryRun?: boolean;
      olderThanDays?: number;
    }) => {
      const response = await apiClient.runGarbageCollection({
        dryRun,
        olderThanDays,
      });
      if (!response.success) {
        throw new Error(response.error || 'Garbage collection failed');
      }
      return response.data;
    },
    onSuccess: (data) => {
      if (data.dryRun) {
        toast.info(
          `Dry run completed: ${data.deletedCount} assets would be deleted, ` +
          `freeing ${(data.freedSpaceBytes / (1024 * 1024)).toFixed(1)}MB`
        );
      } else {
        toast.success(
          `Garbage collection completed: ${data.deletedCount} assets deleted, ` +
          `freed ${(data.freedSpaceBytes / (1024 * 1024)).toFixed(1)}MB`
        );
        
        // Invalidate media list to refresh
        queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      }
    },
    onError: (error) => {
      toast.error(`Garbage collection failed: ${error.message}`);
    },
  });
}

// Hook for getting processing status
export function useProcessingStatus(mediaAssetIds: number[], enabled = true) {
  return useQuery({
    queryKey: ['media-processing-status', mediaAssetIds],
    queryFn: async () => {
      if (!mediaAssetIds.length) return [];
      
      const response = await apiClient.getProcessingStatus(mediaAssetIds);
      if (!response.success) {
        throw new Error(response.error || 'Failed to get processing status');
      }
      return response.data;
    },
    enabled: enabled && mediaAssetIds.length > 0,
    refetchInterval: (data) => {
      // Auto-refresh if any assets are still processing
      const hasProcessing = data?.some(
        (asset) => asset.processingStatus === 'pending' || asset.processingStatus === 'processing'
      );
      return hasProcessing ? 3000 : false; // 3 seconds if processing, don't refetch if all done
    },
  });
}

// Utility functions for media types
export const MediaUtils = {
  isImage: (mimeType: string) => mimeType.startsWith('image/'),
  isVideo: (mimeType: string) => mimeType.startsWith('video/'),
  isAudio: (mimeType: string) => mimeType.startsWith('audio/'),
  isDocument: (mimeType: string) => mimeType.startsWith('application/') || mimeType.startsWith('text/'),
  
  formatFileSize: (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },
  
  getFileIcon: (mimeType: string) => {
    if (MediaUtils.isImage(mimeType)) return '🖼️';
    if (MediaUtils.isVideo(mimeType)) return '🎥';
    if (MediaUtils.isAudio(mimeType)) return '🎵';
    if (mimeType === 'application/pdf') return '📄';
    return '📄';
  },
  
  validateFileType: (file: File, allowedTypes: string[]) => {
    return allowedTypes.includes(file.type);
  },
  
  validateFileSize: (file: File, maxSizeBytes: number) => {
    return file.size <= maxSizeBytes;
  },
};

// Pre-configured filter presets
export const MediaFilters = {
  all: {},
  photos: { mediaType: 'photo' },
  videos: { mediaType: 'video' },
  audio: { mediaType: 'audio' },
  documents: { mediaType: 'document' },
  profilePictures: { pictureType: 'profile_picture' },
  portfolio: { pictureType: 'model_book' },
  compCards: { pictureType: 'set_card' },
  unprocessed: { isProcessed: false },
  recent: { sortBy: 'createdAt', sortOrder: 'desc', limit: 20 },
};