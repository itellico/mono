'use client';
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  User, 
  Users, 
  Briefcase, 
  Heart, 
  Sparkles, 
  Upload, 
  Eye, 
  Trash2, 
  Save,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { PictureViewer } from '@/components/ui/picture-viewer';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();
import { browserLogger } from '@/lib/browser-logger';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// UPLOADER COMPONENT
interface CompactUploaderProps {
  onUploadComplete: (mediaAsset: any) => void;
  onUploadError: (error: string) => void;
  className?: string;
  slotName: string;
}
const CompactUploader: React.FC<CompactUploaderProps> = ({ 
  onUploadComplete, 
  onUploadError, 
  className,
  slotName
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', 'compcard');
      formData.append('slotId', slotName);
      // Start progress simulation
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 200);
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      });
      clearInterval(progressInterval);
      setUploadProgress(100);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Upload failed');
      }
      const result = await response.json();
      if (result.success && result.mediaAsset) {
        return { file, mediaAsset: result.mediaAsset };
      } else {
        throw new Error('Invalid upload response');
      }
    },
    onSuccess: ({ file, mediaAsset }) => {
      onUploadComplete(mediaAsset);
      browserLogger.info('File uploaded successfully', { 
        fileName: file.name,
        mediaAssetId: mediaAsset.id 
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError(errorMessage);
      browserLogger.error('File upload failed', { error: errorMessage });
    },
    onSettled: () => {
      setIsUploading(false);
      setUploadProgress(0);
    }
  });
  const handleFiles = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setIsUploading(true);
      uploadMutation.mutate(acceptedFiles[0]);
    }
  }, [uploadMutation]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFiles,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    disabled: isUploading
  });
  return (
    <div className={cn('w-full', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors h-full flex flex-col items-center justify-center',
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          isUploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
        {isUploading ? (
          <div className="w-full max-w-xs">
            <p className="text-sm font-medium mb-2">Uploading...</p>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        ) : isDragActive ? (
          <div>
            <p className="text-sm font-medium">Drop file here</p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium mb-1">
              Drag & drop files here, or click to select
            </p>
            <p className="text-xs text-muted-foreground">
              Max 1 file, up to 5MB each
            </p>
            <p className="text-xs text-muted-foreground">
              Supported: JPEG, PNG, WebP
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
// COMPCARD slot definitions
const COMPCARD_SLOTS = {
  portrait: {
    id: 'portrait',
    name: 'Portrait',
    description: 'Professional headshot or portrait photo',
    icon: User,
    required: true,
    aspectRatio: '3:4'
  },
  fullBody: {
    id: 'fullBody',
    name: 'Full Body',
    description: 'Full body shot showing complete figure',
    icon: Users,
    required: true,
    aspectRatio: '3:4'
  },
  halfBody: {
    id: 'halfBody',
    name: 'Half Body',
    description: 'Waist-up or three-quarter length photo',
    icon: User,
    required: false,
    aspectRatio: '3:4'
  },
  commercial: {
    id: 'commercial',
    name: 'Commercial',
    description: 'Commercial or lifestyle photography',
    icon: Briefcase,
    required: false,
    aspectRatio: '4:3'
  },
  nude: {
    id: 'nude',
    name: 'Artistic Nude',
    description: 'Artistic nude or implied nude photography',
    icon: Heart,
    required: false,
    aspectRatio: '3:4'
  },
  free: {
    id: 'free',
    name: 'Free Choice',
    description: 'Any style or concept of your choice',
    icon: Sparkles,
    required: false,
    aspectRatio: '3:4'
  }
};
interface CompcardData {
  portrait_media_id: number | null;
  full_body_media_id: number | null;
  half_body_media_id: number | null;
  commercial_media_id: number | null;
  nude_media_id: number | null;
  free_media_id: number | null;
  completion_status: 'incomplete' | 'draft' | 'complete';
  media?: {
    portrait?: any;
    fullBody?: any;
    halfBody?: any;
    commercial?: any;
    nude?: any;
    free?: any;
  };
  account_hash: string;
}
// API functions
const fetchCompcardData = async (): Promise<CompcardData> => {
  const response = await fetch('/api/user/compcard');
  if (!response.ok) throw new Error('Failed to fetch compcard data');
  const result = await response.json();
  return result; // API returns data directly, not wrapped in .data
};
const saveCompcardData = async (data: Partial<CompcardData>): Promise<{ success: boolean; message: string }> => {
  const response = await fetch('/api/user/compcard', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to save compcard data');
  return response.json();
};
const deleteMediaAsset = async (mediaId: number): Promise<void> => {
  const response = await fetch(`/api/media/${mediaId}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete media asset');
};
// Helper function to compute CDN URL
const computeCdnUrl = (mediaAsset: any, accountHash?: string): string => {
  if (!accountHash || !mediaAsset?.directoryHash || !mediaAsset?.fileName) {
    return mediaAsset?.cdnUrl || '';
  }
  const hash = mediaAsset.directoryHash;
  const path = `${hash.substring(0, 2)}/${hash.substring(2, 4)}/${hash.substring(4, 6)}/${hash.substring(6, 8)}`;
  // Use optimized version if available
  if (mediaAsset.isOptimized) {
    const baseFileName = mediaAsset.fileName.split('.')[0];
    return `/media/${accountHash}/${path}/${baseFileName}_optimized.webp`;
  }
  return `/media/${accountHash}/${path}/${mediaAsset.fileName}`;
};
export default function CompcardEditorPage() {
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File | null }>({});
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<any[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<any>(null);
  const queryClient = useQueryClient();
  // Query for compcard data
  const { data: compcardData, isLoading, error } = useQuery({
    queryKey: ['user', 'compcard'],
    queryFn: fetchCompcardData,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
  // Mutation for saving compcard
  const saveMutation = useMutation({
    mutationFn: saveCompcardData,
    onSuccess: (result) => {
      toast({
        title: 'Comp Card Saved',
        description: result.message || 'Your comp card has been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['user', 'compcard'] });
      browserLogger.info('Comp card saved successfully');
    },
    onError: (error) => {
      toast({
        title: 'Save Failed',
        description: `Failed to save comp card: ${error.message}`,
        variant: 'destructive',
      });
      browserLogger.error('Failed to save comp card', { error: error.message });
    }
  });
  // Mutation for deleting media
  const deleteMutation = useMutation({
    mutationFn: deleteMediaAsset,
    onSuccess: () => {
      toast({
        title: 'Image Deleted',
        description: 'The image has been removed from your comp card.',
      });
      queryClient.invalidateQueries({ queryKey: ['user', 'compcard'] });
      browserLogger.info('Media asset deleted successfully');
    },
    onError: (error) => {
      toast({
        title: 'Delete Failed',
        description: `Failed to delete image: ${error.message}`,
        variant: 'destructive',
      });
      browserLogger.error('Failed to delete media asset', { error: error.message });
    }
  });
  const getCompletionStatus = () => {
    if (!compcardData) return { status: 'incomplete', label: 'Incomplete', color: 'secondary' };
    const requiredSlots = ['portrait', 'fullBody'];
    const hasRequired = requiredSlots.every(slot => {
      const mediaKey = `${slot === 'fullBody' ? 'full_body' : slot}_media_id` as keyof CompcardData;
      return compcardData[mediaKey] !== null;
    });
    if (!hasRequired) {
      return { status: 'incomplete', label: 'Incomplete', color: 'secondary' };
    }
    const totalSlots = Object.keys(COMPCARD_SLOTS).length;
    const filledSlots = Object.keys(COMPCARD_SLOTS).filter(slot => {
      const mediaKey = `${slot === 'fullBody' ? 'full_body' : slot}_media_id` as keyof CompcardData;
      return compcardData[mediaKey] !== null;
    }).length;
    if (filledSlots === totalSlots) {
      return { status: 'complete', label: 'Complete', color: 'default' };
    } else {
      return { status: 'draft', label: 'Draft', color: 'outline' };
    }
  };
  const handleUploadComplete = (slotId: string) => (mediaAsset: any) => {
    // Map frontend slot names to backend field names
    const slotMapping: { [key: string]: string } = {
      'portrait': 'portrait_media_id',
      'fullBody': 'full_body_media_id', 
      'halfBody': 'half_body_media_id',
      'commercial': 'commercial_media_id',
      'nude': 'nude_media_id',
      'free': 'free_media_id'
    };
    const fieldName = slotMapping[slotId];
    if (!fieldName || !mediaAsset?.id) {
      browserLogger.error('Invalid slot or media asset', { slotId, mediaAssetId: mediaAsset?.id });
      return;
    }
    // Save the media asset ID to the compcard slot
    const updateData = {
      [fieldName]: mediaAsset.id,
      completion_status: 'draft' as const
    };
    browserLogger.info('Saving uploaded media to compcard slot', { 
      slotId, 
      fieldName, 
      mediaAssetId: mediaAsset.id 
    });
    saveMutation.mutate(updateData);
  };
  const handleViewImage = (mediaAsset: any) => {
    if (!mediaAsset || !compcardData?.account_hash) return;
    // Collect all available images from compcard slots
    const allImages = Object.entries(compcardData.media || {})
      .filter(([_, media]) => media && media.id)
      .map(([_, media]) => ({
        ...media,
        directoryHash: media.directoryHash,
        isOptimized: media.isOptimized || false,
        isGenerated: media.isGenerated || false
      }));
    // Find the index of the clicked image
    const currentIndex = allImages.findIndex(img => img.id === mediaAsset.id);
    if (currentIndex >= 0) {
      setViewerImages(allImages);
      setViewerIndex(currentIndex);
      setViewerOpen(true);
    }
  };
  const handleDeleteImage = async (mediaAsset: any) => {
    if (!mediaAsset?.id) return;
    setMediaToDelete(mediaAsset);
    setDeleteModalOpen(true);
  };
  const confirmDelete = () => {
    if (mediaToDelete?.id) {
      deleteMutation.mutate(mediaToDelete.id);
    }
    setDeleteModalOpen(false);
    setMediaToDelete(null);
  };
  const handleUploadError = (slotId: string, error: string) => {
    toast({
      title: 'Upload Failed',
      description: `Failed to upload ${COMPCARD_SLOTS[slotId as keyof typeof COMPCARD_SLOTS]?.name}: ${error}`,
      variant: 'destructive',
    });
    setSelectedFiles(prev => ({ ...prev, [slotId]: null }));
  };
  const handleSave = () => {
    if (!compcardData) return;
    const { status } = getCompletionStatus();
    const updateData = {
      completion_status: status as 'incomplete' | 'draft' | 'complete'
    };
    saveMutation.mutate(updateData);
  };
  // Loading state
  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-6 space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  // Error state
  if (error) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">Failed to load comp card data</p>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Please try refreshing the page. If the problem persists, contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  const completionInfo = getCompletionStatus();
  return (
    <>
      <div className="container max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Comp Card Editor</h1>
              <p className="text-muted-foreground">
                Build your professional modeling portfolio with high-quality images
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={completionInfo.color as any} className="text-sm">
                <Clock className="w-4 h-4 mr-1" />
                {completionInfo.label}
              </Badge>
              <Button 
                onClick={handleSave}
                disabled={saveMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? 'Saving...' : 'Save Progress'}
              </Button>
            </div>
          </div>
          <Separator />
        </div>
        {/* Grid of comp card slots */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(COMPCARD_SLOTS).map(([slotId, slot]) => {
            const mediaKey = `${slotId === 'fullBody' ? 'full_body' : slotId}_media_id` as keyof CompcardData;
            const mediaAsset = compcardData?.media?.[slotId as keyof typeof compcardData.media];
            const hasImage = compcardData?.[mediaKey] !== null;
            const IconComponent = slot.icon;
            return (
              <Card key={slotId} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <IconComponent className="w-5 h-5" />
                    <span>{slot.name}</span>
                    {slot.required && (
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{slot.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasImage && mediaAsset ? (
                    <div className="space-y-3">
                      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted group">
                        <img
                          src={computeCdnUrl(mediaAsset, compcardData?.account_hash)}
                          alt={slot.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Overlay controls inside the image */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200">
                          <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleViewImage(mediaAsset)}
                              className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-black"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleDeleteImage(mediaAsset)}
                              disabled={deleteMutation.isPending}
                              className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[3/4]">
                      <CompactUploader
                        slotName={slotId}
                        onUploadComplete={handleUploadComplete(slotId)}
                        onUploadError={(error) => handleUploadError(slotId, error)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        {/* Progress Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Progress Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Completion Status:</span>
                <Badge variant={completionInfo.color as any}>{completionInfo.label}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Required Slots:</span>
                  <span>
                    {Object.entries(COMPCARD_SLOTS).filter(([_, slot]) => slot.required).every(([slotId]) => {
                      const mediaKey = `${slotId === 'fullBody' ? 'full_body' : slotId}_media_id` as keyof CompcardData;
                      return compcardData?.[mediaKey] !== null;
                    }) ? '✅ Complete' : '❌ Incomplete'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Slots Filled:</span>
                  <span>
                    {Object.keys(COMPCARD_SLOTS).filter(slotId => {
                      const mediaKey = `${slotId === 'fullBody' ? 'full_body' : slotId}_media_id` as keyof CompcardData;
                      return compcardData?.[mediaKey] !== null;
                    }).length} / {Object.keys(COMPCARD_SLOTS).length}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Full-Featured Picture Viewer */}
      {viewerOpen && viewerImages.length > 0 && compcardData?.account_hash && (
        <PictureViewer
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          images={viewerImages}
          currentIndex={viewerIndex}
          onIndexChange={setViewerIndex}
          onDelete={handleDeleteImage}
          accountHash={compcardData.account_hash}
          showControls={true}
          showInfo={true}
          enableDownload={true}
          enableDelete={true}
        />
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setMediaToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Image"
        description="Are you sure you want to delete this image? This action cannot be undone and will remove it from your comp card."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}