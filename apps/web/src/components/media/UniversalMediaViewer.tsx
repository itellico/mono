'use client';

import React from 'react';
import { cn } from '@/lib/utils';

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

interface UniversalMediaViewerProps {
  mediaAsset: MediaAsset;
  size?: 'thumbnail' | 'medium' | 'original';
  showControls?: boolean;
  showInfo?: boolean;
  showOptimizationStatus?: boolean;
  className?: string;
}

export const UniversalMediaViewer: React.FC<UniversalMediaViewerProps> = ({
  mediaAsset,
  size = 'medium',
  showControls = false,
  showInfo = false,
  showOptimizationStatus = false,
  className
}) => {
  const { mimeType, cdnUrl, originalName } = mediaAsset;

  // Basic media rendering based on type
  if (mimeType.startsWith('image/')) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <img 
          src={cdnUrl} 
          alt={originalName}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    );
  }

  if (mimeType.startsWith('video/')) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <video 
          src={cdnUrl}
          controls={showControls}
          className="max-w-full max-h-full"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  if (mimeType.startsWith('audio/')) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <audio 
          src={cdnUrl}
          controls={showControls}
          className="w-full max-w-md"
        >
          Your browser does not support the audio tag.
        </audio>
      </div>
    );
  }

  // Fallback for documents/other types
  return (
    <div className={cn('flex items-center justify-center p-8 text-center', className)}>
      <div>
        <p className="text-muted-foreground mb-2">Document Preview</p>
        <p className="font-medium">{originalName}</p>
        <p className="text-sm text-muted-foreground">{mimeType}</p>
      </div>
    </div>
  );
};
