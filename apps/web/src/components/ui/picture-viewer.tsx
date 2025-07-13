'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Info,
  ImageIcon,
  Move,
  RotateCcw,
  Maximize,
  Minimize,
  Square
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { browserLogger } from '@/lib/browser-logger';
interface MediaAsset {
  id: number;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  directoryHash: string;
  isOptimized: boolean;
  isGenerated: boolean;
  createdAt?: string;
  cdnUrl?: string;
}
interface PictureViewerProps {
  isOpen: boolean;
  onClose: () => void;
  images: MediaAsset[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onDelete: (image: MediaAsset) => Promise<void>;
  accountHash: string; // Contains account UUID (post account-hash migration)
  showControls?: boolean;
  showInfo?: boolean;
  enableDownload?: boolean;
  enableDelete?: boolean;
  className?: string;
}
export function PictureViewer({
  isOpen,
  onClose,
  images,
  currentIndex,
  onIndexChange,
  onDelete,
  accountHash,
  showControls = true,
  showInfo = true,
  enableDownload = true,
  enableDelete = false,
  className
}: PictureViewerProps) {
  const { toast } = useToast();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [fitToScreen, setFitToScreen] = useState(true);
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentImage = images[currentIndex];
  // Build image URL
  const getImageUrl = useCallback((image: MediaAsset, optimized = true) => {
    if (!accountHash || !image.directoryHash) return null;
    const hash = image.directoryHash;
    const path = `${hash.substring(0, 2)}/${hash.substring(2, 4)}/${hash.substring(4, 6)}/${hash.substring(6, 8)}`;
    if (optimized && image.isOptimized) {
      const baseFileName = image.fileName.split('.')[0];
      return `/media/${accountHash}/${path}/${baseFileName}_optimized.webp`;
    }
    return `/media/${accountHash}/${path}/${image.fileName}`;
  }, [accountHash]);
  // Reset view state when image changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setIsLoading(true);
    setShowInfoPanel(false);
    setFitToScreen(true);
    setImageNaturalSize({ width: 0, height: 0 });
  }, [currentIndex]);
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          handleResetView();
          break;
        case '1':
          handleActualSize();
          break;
        case 'f':
        case 'F':
          handleToggleFitToScreen();
          break;
        case 'r':
        case 'R':
          handleRotate();
          break;
        case 'i':
        case 'I':
          setShowInfoPanel(!showInfoPanel);
          break;
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, showInfoPanel, onClose, onIndexChange]);
  // Navigation handlers
  const handlePrevious = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };
  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  };
  // View manipulation handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1));
  const handleResetView = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setFitToScreen(true);
  };
  const handleActualSize = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setFitToScreen(false);
  };
  const handleToggleFitToScreen = () => {
    const newFitToScreen = !fitToScreen;
    setFitToScreen(newFitToScreen);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleRotateCounterClockwise = () => setRotation(prev => (prev - 90 + 360) % 360);
  // Double tap to zoom - improved logic
  const handleDoubleClick = () => {
    if (zoom === 1 && fitToScreen) {
      // Zoom in to 2x when in fit mode
      setZoom(2);
    } else if (zoom > 1) {
      // Reset to fit mode when zoomed
      handleResetView();
    } else {
      // If in actual size mode, toggle to fit mode
      handleResetView();
    }
  };
  // Touch handling for mobile
  const handleTouchEnd = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      handleDoubleClick();
    }
    setLastTap(now);
  };
  // Mouse drag handling
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging if zoomed or in actual size mode
    if (zoom <= 1 && fitToScreen) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || (zoom <= 1 && fitToScreen)) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };
  const handleMouseUp = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsDragging(false);
  };
  // Handle image load to get natural dimensions
  const handleImageLoad = () => {
    setIsLoading(false);
    if (imageRef.current) {
      setImageNaturalSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      });
    }
  };
  // Download function
  const handleDownload = async () => {
    if (!currentImage) return;
    try {
      const imageUrl = getImageUrl(currentImage, false); // Get original, not optimized
      if (!imageUrl) return;
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = currentImage.originalName || currentImage.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: "Download started",
        description: `${currentImage.originalName} is being downloaded.`
      });
    } catch (error) {
      browserLogger.error('Download failed', { error: error.message });
      toast({
        title: "Download failed",
        description: "There was an error downloading the image.",
        variant: "destructive"
      });
    }
  };
  // Delete function
  const handleDelete = async () => {
    if (!currentImage || !onDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(currentImage);
      // Move to next image or close viewer if no images left
      if (images.length > 1) {
        const nextIndex = currentIndex < images.length - 1 ? currentIndex : currentIndex - 1;
        onIndexChange(nextIndex);
      } else {
        onClose();
      }
      toast({
        title: "Image deleted",
        description: `${currentImage.originalName} has been deleted successfully.`
      });
    } catch (error) {
      browserLogger.error('Delete failed', { error: error.message });
      toast({
        title: "Delete failed",
        description: "There was an error deleting the image.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  // Get zoom display text
  const getZoomDisplay = () => {
    if (!fitToScreen && zoom === 1) {
      return 'Actual';
    }
    return Math.round(zoom * 100) + '%';
  };
  if (!currentImage) return null;
  const imageUrl = getImageUrl(currentImage);
  // Simple portal-based full-screen viewer without Dialog component
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 w-screen h-screen p-0 m-0 bg-black/95 border-0 rounded-none overflow-hidden z-50"
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        width: '100vw',
        height: '100vh',
        zIndex: 9999
      }}
    >
      {/* Top Controls Bar */}
      {showControls && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-2">
          <div className="flex items-center justify-between">
            {/* Left side - Navigation */}
            <div className="flex items-center gap-2">
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="text-white hover:bg-white/20 border-white/30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-white text-sm font-medium px-2">
                    {currentIndex + 1} / {images.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNext}
                    disabled={currentIndex === images.length - 1}
                    className="text-white hover:bg-white/20 border-white/30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
            {/* Center - Image Name & View Mode */}
            <div className="text-center">
              <h2 className="text-white font-medium text-lg truncate max-w-md">
                {currentImage.originalName || currentImage.fileName}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs text-white border-white/30">
                  {getZoomDisplay()}
                </Badge>
                <Badge variant="outline" className="text-xs text-white border-white/30">
                  {fitToScreen ? 'Optimized View' : 'Actual Size'}
                </Badge>
              </div>
            </div>
            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleFitToScreen}
                className="text-white hover:bg-white/20"
                title={fitToScreen ? 'Show Actual Size' : 'Optimized View'}
              >
                {fitToScreen ? <Maximize className="w-4 h-4" /> : <Minimize className="w-4 h-4" />}
              </Button>
              {showInfo && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInfoPanel(!showInfoPanel)}
                  className="text-white hover:bg-white/20"
                >
                  <Info className="w-4 h-4" />
                </Button>
              )}
              {enableDownload && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="text-white hover:bg-white/20"
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}
              {enableDelete && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Main Image Container */}
      <div 
        ref={containerRef}
        className="absolute inset-0 top-16 bottom-16 bg-black/95"
        style={{
          position: 'absolute',
          top: '64px',
          left: '0',
          right: '0',
          bottom: '64px',
          width: '100%',
          height: 'calc(100vh - 128px)',
          overflow: fitToScreen ? 'hidden' : 'auto'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onTouchEnd={handleTouchEnd}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white">
              <ImageIcon className="w-12 h-12 animate-pulse" />
            </div>
          </div>
        )}
        {imageUrl && (
          <img
            ref={imageRef}
            src={imageUrl}
            alt={currentImage.originalName || currentImage.fileName}
            className={cn(
              "block transition-transform duration-200",
              fitToScreen && "max-w-[90vw] max-h-[80vh] w-auto h-auto object-contain",
              !fitToScreen && "max-w-none max-h-none",
              isDragging ? "cursor-grabbing" : 
                (zoom > 1 || !fitToScreen) ? "cursor-grab" : "cursor-zoom-in"
            )}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
            draggable={false}
            onLoad={handleImageLoad}
            onError={() => {
              toast({
                title: "Image failed to load",
                description: "The image could not be displayed",
                variant: "destructive"
              });
            }}
          />
        )}
      </div>
      {/* Bottom Controls Bar */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent p-2">
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.1}
              className="text-white hover:bg-white/20"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-white text-sm min-w-16 text-center font-mono">
              {getZoomDisplay()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 5}
              className="text-white hover:bg-white/20"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-white/30 mx-2" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleActualSize}
              className="text-white hover:bg-white/20"
              title="Actual Size (1:1)"
            >
              <Square className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetView}
              className="text-white hover:bg-white/20"
              title="Fit to Screen"
            >
              <Move className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-white/30 mx-2" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRotateCounterClockwise}
              className="text-white hover:bg-white/20"
              title="Rotate Left"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRotate}
              className="text-white hover:bg-white/20"
              title="Rotate Right"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      {/* Info Panel */}
      {showInfo && showInfoPanel && currentImage && (
        <div className="absolute top-16 right-2 bg-black/90 backdrop-blur-sm rounded-lg p-3 text-white max-w-xs z-40">
          <h3 className="font-semibold mb-3">Image Information</h3>
          <div className="space-y-2 text-sm">
            <div className="break-all">
              <div className="text-gray-300 mb-1">Filename:</div>
              <div className="font-mono text-xs bg-black/50 rounded px-2 py-1 break-all">
                {currentImage.fileName}
              </div>
            </div>
            <div className="break-all">
              <div className="text-gray-300 mb-1">Original:</div>
              <div className="bg-black/50 rounded px-2 py-1 break-all">
                {currentImage.originalName}
              </div>
            </div>
            <div>
              <span className="text-gray-300">Type:</span>
              <span className="ml-2">{currentImage.mimeType}</span>
            </div>
            <div>
              <span className="text-gray-300">Size:</span>
              <span className="ml-2">{formatFileSize(currentImage.fileSize)}</span>
            </div>
            {imageNaturalSize.width > 0 && (
              <div>
                <span className="text-gray-300">Dimensions:</span>
                <span className="ml-2">{imageNaturalSize.width} × {imageNaturalSize.height}px</span>
              </div>
            )}
            <div>
              <span className="text-gray-300">Optimized:</span>
              <span className="ml-2">{currentImage.isOptimized ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-gray-300">Status:</span>
              <span className="ml-2">
                {currentImage.isGenerated ? 'Processed' : 'Processing...'}
              </span>
            </div>
            <div>
              <span className="text-gray-300">View Mode:</span>
              <span className="ml-2">{fitToScreen ? 'Optimized View' : 'Actual Size'}</span>
            </div>
          </div>
        </div>
      )}
      {/* Help text for first time users */}
      <div className="absolute bottom-16 left-2 text-white/70 text-xs space-y-1 z-30 pointer-events-none">
        <div>• Double-click to zoom • Drag to pan when zoomed</div>
        <div>• F to toggle view mode • 1 for actual size • R to rotate</div>
        <div>• ESC to close • Arrow keys to navigate</div>
      </div>
    </div>
  );
} 