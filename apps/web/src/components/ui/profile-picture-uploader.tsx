'use client';

import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ProfilePictureUpload } from '@/components/ui/profile-picture-upload';
import { Camera, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfilePictureUploaderProps {
  currentImageUrl?: string;
  userName?: string;
  onUploadComplete?: (imageUrl: string) => void;
  onUploadError?: (error: string) => void;
  size?: 'sm' | 'md' | 'lg';
  uploadUrl?: string;
  className?: string;
}

export const ProfilePictureUploader = function ProfilePictureUploader({
  currentImageUrl,
  userName = '',
  onUploadComplete,
  onUploadError,
  size = 'md',
  uploadUrl = '/api/media/upload',
  className
}: ProfilePictureUploaderProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: {
      avatar: 'h-16 w-16',
      camera: 'h-4 w-4',
      cameraButton: 'h-6 w-6'
    },
    md: {
      avatar: 'h-24 w-24',
      camera: 'h-5 w-5',
      cameraButton: 'h-8 w-8'
    },
    lg: {
      avatar: 'h-32 w-32',
      camera: 'h-6 w-6',
      cameraButton: 'h-10 w-10'
    }
  };

  const config = sizeConfig[size];

  // Get user initials for fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  const handleUploadComplete = (imageUrl: string) => {
    setImageError(false); // Reset error state on new upload
    onUploadComplete?.(imageUrl);
    setIsUploadOpen(false);
  };

  const handleUploadError = (error: string) => {
    onUploadError?.(error);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Reset error state when currentImageUrl changes
  React.useEffect(() => {
    setImageError(false);
  }, [currentImageUrl]);

  return (
    <>
      <div className={cn('relative inline-block', className)}>
        {/* Avatar with Camera Overlay */}
        <div className="relative group">
          <Avatar className={cn(config.avatar, 'border-2 border-emerald-200 dark:border-emerald-700')}>
            {currentImageUrl && !imageError ? (
              <AvatarImage 
                src={currentImageUrl} 
                alt={`${userName} profile picture`}
                className="object-cover"
                onError={handleImageError}
              />
            ) : null}
            <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 font-semibold">
              {userName ? getInitials(userName) : <User className="h-6 w-6" />}
            </AvatarFallback>
          </Avatar>

          {/* Camera Icon Overlay */}
          <Button
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className={cn(
              'absolute -bottom-1 -right-1 rounded-full shadow-lg',
              'bg-emerald-500 hover:bg-emerald-600 text-white',
              'border-2 border-white dark:border-gray-800',
              'transition-all duration-200 hover:scale-105',
              config.cameraButton
            )}
          >
            <Camera className={config.camera} />
            <span className="sr-only">Change profile picture</span>
          </Button>
        </div>

        {/* Hover Effect Overlay */}
        <div className={cn(
          'absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100',
          'transition-opacity duration-200 flex items-center justify-center',
          'cursor-pointer',
          config.avatar
        )}
        onClick={() => setIsUploadOpen(true)}
        >
          <Camera className={cn('text-white', config.camera)} />
        </div>
      </div>

      {/* Profile Picture Upload Dialog */}
      <ProfilePictureUpload
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        uploadUrl={uploadUrl}
        currentImageUrl={currentImageUrl}
      />
    </>
  );
} 