'use client';
/**
 * Media Gallery Component
 * 
 * Displays collections of media assets in organized layouts:
 * - Grid layouts with responsive columns
 * - Media type filtering
 * - Lightbox for full-size viewing
 * - Optimization status indicators
 * - Bulk actions support
 */
import React, { useState, useCallback } from 'react';
// import { UniversalMediaViewer } from './UniversalMediaViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle } from '@/components/ui/dialog';
import { useBrowserLogger } from '@/lib/browser-logger';
import { 
  Grid3X3, 
  Grid2X2, 
  List, 
  Filter, 
  Download, 
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Video,
  Music,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
// Types
interface MediaAsset {
  id: number;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  cdnUrl: string;
  isOptimized?: boolean;
  isGenerated?: boolean;
  thumbnailFormats?: Record<string, string>;
  optimizationStatus?: string;
  width?: number;
  height?: number;
  duration?: number;
  createdAt?: string;
}
interface MediaGalleryProps {
  mediaAssets: MediaAsset[];
  title?: string;
  isLoading?: boolean;
  layout?: 'grid' | 'list' | 'masonry';
  columns?: 2 | 3 | 4 | 6;
  showFilter?: boolean;
  showBulkActions?: boolean;
  showOptimizationStatus?: boolean;
  enableLightbox?: boolean;
  enableSelection?: boolean;
  maxItems?: number;
  className?: string;
  onMediaClick?: (mediaAsset: MediaAsset, index: number) => void;
  onSelectionChange?: (selectedIds: number[]) => void;
  onDownload?: (mediaAsset: MediaAsset) => void;
  onDelete?: (mediaAsset: MediaAsset) => void;
  onBulkDownload?: (mediaAssets: MediaAsset[]) => void;
  onBulkDelete?: (mediaAssets: MediaAsset[]) => void;
}
// Media type filters
type MediaTypeFilter = 'all' | 'images' | 'videos' | 'audio' | 'documents';
const getMediaTypeIcon = (type: MediaTypeFilter) => {
  switch (type) {
    case 'images': return <ImageIcon className="h-4 w-4" />;
    case 'videos': return <Video className="h-4 w-4" />;
    case 'audio': return <Music className="h-4 w-4" />;
    case 'documents': return <FileText className="h-4 w-4" />;
    default: return <Filter className="h-4 w-4" />;
  }
};
const getMediaType = (mimeType: string): MediaTypeFilter => {
  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.startsWith('video/')) return 'videos';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'documents';
};
// Loading skeleton component
const GallerySkeleton: React.FC<{ columns: number; count: number }> = ({ columns, count }) => (
  <div className={cn(
    'grid gap-4',
    columns === 2 && 'grid-cols-2',
    columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    columns === 6 && 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
  )}>
    {Array.from({ length: count }).map((_, index) => (
      <Card key={index}>
        <CardContent className="p-0">
          <Skeleton className="aspect-square w-full" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);
// Lightbox component
const MediaLightbox: React.FC<{
  mediaAssets: MediaAsset[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}> = ({ mediaAssets, currentIndex, isOpen, onClose, onNext, onPrevious }) => {
  const currentMedia = mediaAssets[currentIndex];
  if (!currentMedia) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span>{currentMedia.originalName}</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {currentIndex + 1} of {mediaAssets.length}
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="relative">
          <div className="p-6 pt-0">
            {/* UniversalMediaViewer component is commented out */}
            {/* <UniversalMediaViewer
              mediaAsset={currentMedia}
              size="original"
              showControls={true}
              showInfo={true}
              showOptimizationStatus={true}
              className="max-h-[70vh]"
            /> */}
          </div>
          {/* Navigation buttons */}
          {mediaAssets.length > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="absolute left-2 top-1/2 -translate-y-1/2"
                onClick={onPrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={onNext}
                disabled={currentIndex === mediaAssets.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
export const MediaGallery: React.FC<MediaGalleryProps> = ({
  mediaAssets,
  title,
  isLoading = false,
  layout = 'grid',
  columns = 3,
  showFilter = true,
  showBulkActions = false,
  showOptimizationStatus = true,
  enableLightbox = true,
  enableSelection = false,
  maxItems,
  className,
  onMediaClick,
  onSelectionChange,
  onDownload,
  onDelete,
  onBulkDownload,
  onBulkDelete
}) => {
  const logger = useBrowserLogger('MediaGallery');
  
  // State
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaTypeFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  
  // Filter media assets
  const filteredAssets = mediaAssets.filter(asset => {
    if (mediaTypeFilter === 'all') return true;
    return getMediaType(asset.mimeType) === mediaTypeFilter;
  }).slice(0, maxItems);
  
  // Media type counts
  const mediaTypeCounts = {
    all: mediaAssets.length,
    images: mediaAssets.filter(asset => getMediaType(asset.mimeType) === 'images').length,
    videos: mediaAssets.filter(asset => getMediaType(asset.mimeType) === 'videos').length,
    audio: mediaAssets.filter(asset => getMediaType(asset.mimeType) === 'audio').length,
    documents: mediaAssets.filter(asset => getMediaType(asset.mimeType) === 'documents').length,
  };
  // Handle media click
  const handleMediaClick = useCallback((mediaAsset: MediaAsset, index: number) => {
    if (enableLightbox) {
      setLightboxIndex(index);
    }
    onMediaClick?.(mediaAsset, index);
  }, [enableLightbox, onMediaClick]);
  // Handle selection
  const handleSelection = useCallback((mediaAssetId: number, selected: boolean) => {
    const newSelected = new Set(selectedIds);
    if (selected) {
      newSelected.add(mediaAssetId);
    } else {
      newSelected.delete(mediaAssetId);
    }
    setSelectedIds(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  }, [selectedIds, onSelectionChange]);
  // Handle select all
  const handleSelectAll = useCallback(() => {
    const allIds = new Set(filteredAssets.map(asset => asset.id));
    setSelectedIds(allIds);
    onSelectionChange?.(Array.from(allIds));
  }, [filteredAssets, onSelectionChange]);
  // Handle clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
    onSelectionChange?.([]);
  }, [onSelectionChange]);
  // Handle bulk actions
  const handleBulkDownload = useCallback(() => {
    const selectedAssets = filteredAssets;
    onBulkDownload?.(selectedAssets);
  }, [filteredAssets, selectedIds, onBulkDownload]);
  const handleBulkDelete = useCallback(() => {
    const selectedAssets = filteredAssets;
    onBulkDelete?.(selectedAssets);
  }, [filteredAssets, selectedIds, onBulkDelete]);
  // Lightbox navigation
  const handleLightboxNext = useCallback(() => {
    setLightboxIndex(prev => Math.min(prev + 1, filteredAssets.length - 1));
  }, [filteredAssets.length]);
  const handleLightboxPrevious = useCallback(() => {
    setLightboxIndex(prev => Math.max(prev - 1, 0));
  }, []);
  const handleLightboxClose = useCallback(() => {
    setLightboxIndex(-1);
  }, []);
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          <p className="text-sm text-muted-foreground">
            {filteredAssets.length} item{filteredAssets.length !== 1 ? 's' : ''}
            {mediaTypeFilter !== 'all' && ` (${mediaTypeFilter})`}
          </p>
        </div>
        {/* Layout and filter controls */}
        <div className="flex items-center gap-2">
          {showFilter && (
            <Select value={mediaTypeFilter} onValueChange={(value: MediaTypeFilter) => setMediaTypeFilter(value)}>
              <SelectTrigger className="w-40">
                <div className="flex items-center gap-2">
                  {getMediaTypeIcon(mediaTypeFilter)}
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    All ({mediaTypeCounts.all})
                  </div>
                </SelectItem>
                <SelectItem value="images">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Images ({mediaTypeCounts.images})
                  </div>
                </SelectItem>
                <SelectItem value="videos">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Videos ({mediaTypeCounts.videos})
                  </div>
                </SelectItem>
                <SelectItem value="audio">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Audio ({mediaTypeCounts.audio})
                  </div>
                </SelectItem>
                <SelectItem value="documents">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documents ({mediaTypeCounts.documents})
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      {/* Bulk actions */}
      {showBulkActions && enableSelection && selectedIds.size > 0 && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
              >
                Clear
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {onBulkDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
              {onBulkDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Selection controls */}
      {enableSelection && filteredAssets.length > 0 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={selectedIds.size === filteredAssets.length}
          >
            Select All
          </Button>
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSelection}
            >
              Clear Selection
            </Button>
          )}
        </div>
      )}
      {/* Gallery content */}
      {isLoading ? (
        <GallerySkeleton columns={columns} count={12} />
      ) : filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Filter className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No media found</h4>
            <p className="text-muted-foreground">
              {mediaTypeFilter === 'all' 
                ? 'No media assets to display'
                : `No ${mediaTypeFilter} found`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={cn(
          'grid gap-4',
          layout === 'grid' && columns === 2 && 'grid-cols-2',
          layout === 'grid' && columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          layout === 'grid' && columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          layout === 'grid' && columns === 6 && 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
          layout === 'list' && 'grid-cols-1'
        )}>
          {filteredAssets.map((mediaAsset, index) => (
            <Card key={mediaAsset.id} className="group relative overflow-hidden">
              {enableSelection && (
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(mediaAsset.id)}
                    onChange={(e) => handleSelection(mediaAsset.id, e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
              )}
              <CardContent className="p-0">
                <div className={cn(
                  'relative',
                  layout === 'grid' ? 'aspect-square' : 'aspect-video'
                )}>
                  
                </div>
                {/* Media info */}
                <div className="p-3 space-y-2">
                  <p className="text-sm font-medium truncate">{mediaAsset.originalName}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {(mediaAsset.fileSize / (1024 * 1024)).toFixed(1)} MB
                    </p>
                    {showOptimizationStatus && (
                      <Badge 
                        variant={mediaAsset.isOptimized ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {mediaAsset.isOptimized ? 'Optimized' : 'Original'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Lightbox */}
      {enableLightbox && lightboxIndex >= 0 && (
        <MediaLightbox
          mediaAssets={filteredAssets}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex >= 0}
          onClose={handleLightboxClose}
          onNext={handleLightboxNext}
          onPrevious={handleLightboxPrevious}
        />
      )}
    </div>
  );
};
