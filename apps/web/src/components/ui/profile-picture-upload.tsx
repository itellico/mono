'use client';
import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, Crop as CropIcon, Save, X, AlertCircle, Image as ImageIcon } from 'lucide-react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { cn } from '@/lib/utils';
import 'react-image-crop/dist/ReactCrop.css';
import { useAuth } from '@/contexts/auth-context';
import { browserLogger } from '@/lib/browser-logger';
import { useTranslations } from 'next-intl';
interface ProfilePictureUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (imageUrl: string) => void;
  onUploadError: (error: string) => void;
  uploadUrl?: string;
  currentImageUrl?: string;
}
export const ProfilePictureUpload = function ProfilePictureUpload({
  isOpen,
  onClose,
  onUploadComplete,
  onUploadError,
  uploadUrl = '/api/media/upload',
  currentImageUrl
}: ProfilePictureUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [croppedImageUrl, setCroppedImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string>('');
  const [step, setStep] = useState<'select' | 'crop' | 'preview'>('select');
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { refreshUser } = useAuth();
  const t = useTranslations('ui');
  // Reset state when dialog opens/closes
  const resetState = useCallback(() => {
    setSelectedFile(null);
    setImageSrc('');
    setCrop(undefined);
    setCroppedImageUrl('');
    setUploadError('');
    setStep('select');
    setIsUploading(false);
    setUploadProgress(0);
  }, []);
  // Handle dialog close
  const handleClose = () => {
    resetState();
    onClose();
  };
  // Validate file
  const validateFile = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a JPEG, PNG, or WebP image';
    }
    if (file.size > maxSize) {
      return 'Image must be less than 5MB';
    }
    return null;
  };
  // Handle file selection
  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }
    setSelectedFile(file);
    setUploadError('');
    // Create image URL for cropping
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setStep('crop');
    };
    reader.readAsDataURL(file);
  };
  // File input change handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };
  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  // Image load handler for setting initial crop
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    // Create a square crop in the center
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90 },
        1, // 1:1 aspect ratio for square profile pictures
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  };
  // Generate cropped image
  const getCroppedImg = useCallback(() => {
    if (!imgRef.current || !crop || !canvasRef.current) return;
    const image = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Calculate the scale between displayed image and natural image
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    // Convert percentage-based crop to pixel values on the natural image
    const cropX = (crop.x / 100) * image.naturalWidth;
    const cropY = (crop.y / 100) * image.naturalHeight;
    const cropWidth = (crop.width / 100) * image.naturalWidth;
    const cropHeight = (crop.height / 100) * image.naturalHeight;
    // Set canvas size to the crop size
    const outputSize = 400; // Fixed output size for profile pictures
    canvas.width = outputSize;
    canvas.height = outputSize;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // Draw the cropped portion of the image
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputSize,
      outputSize
    );
    return new Promise<string>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve(url);
        }
      }, 'image/jpeg', 0.95);
    });
  }, [crop]);
  // Handle crop completion
  const handleCropComplete = async () => {
    try {
      const croppedUrl = await getCroppedImg();
      if (croppedUrl) {
        setCroppedImageUrl(croppedUrl);
        setStep('preview');
      }
    } catch (error) {
      setUploadError('Failed to crop image. Please try again.');
    }
  };
  // Convert canvas to file for upload
  const canvasToFile = (): Promise<File> => {
    return new Promise((resolve) => {
      canvasRef.current?.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `profile-${Date.now()}.jpg`, { type: 'image/jpeg' });
          resolve(file);
        }
      }, 'image/jpeg', 0.95);
    });
  };
  // Handle final upload
  const handleUpload = async () => {
    if (!canvasRef.current) return;
    setIsUploading(true);
    setUploadError('');
    setUploadProgress(0);
    try {
      const croppedFile = await canvasToFile();
      const formData = new FormData();
      formData.append('file', croppedFile);
      formData.append('context', 'profile_picture');
      // Use XMLHttpRequest for upload progress tracking
      return new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        };
        xhr.onload = async () => {
          try {
            if (xhr.status >= 200 && xhr.status < 300) {
              const result = JSON.parse(xhr.responseText);
              browserLogger.info('Upload response received', { result });
              const imageUrl = result.mediaAsset?.cdnUrl || result.cdnUrl || result.url;
              browserLogger.info('Extracted image URL', { imageUrl });
              if (imageUrl) {
                onUploadComplete(imageUrl);
                handleClose();
                refreshUser();
                resolve();
              } else {
                throw new Error('No image URL returned from server');
              }
            } else {
              const errorText = xhr.responseText;
              throw new Error(`Upload failed: ${xhr.status} ${xhr.statusText} - ${errorText}`);
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Upload failed';
            setUploadError(errorMessage);
            onUploadError(errorMessage);
            reject(error);
          }
        };
        xhr.onerror = () => {
          const errorMessage = 'Network error occurred';
          setUploadError(errorMessage);
          onUploadError(errorMessage);
          reject(new Error(errorMessage));
        };
        xhr.onabort = () => {
          const errorMessage = 'Upload cancelled';
          setUploadError(errorMessage);
          reject(new Error(errorMessage));
        };
        xhr.open('POST', uploadUrl);
        xhr.send(formData);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
      onUploadError(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  // Render different steps
  const renderContent = () => {
    switch (step) {
      case 'select':
        return (
          <div className="space-y-4">
            {/* Current picture preview */}
            {currentImageUrl && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Current Picture</p>
                <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-emerald-200">
                  <img 
                    src={currentImageUrl} 
                    alt="Current profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            {/* Upload area */}
            <Card 
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 cursor-pointer hover:border-emerald-400 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Upload className="h-10 w-10 mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Upload Profile Picture</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose a photo that represents you well
                </p>
                <Button 
                  type="button" 
                  variant="outline"
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Choose Photo
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Accepted: JPEG, PNG, WebP • Max size: 5MB
                </p>
              </CardContent>
            </Card>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        );
      case 'crop':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Crop Your Picture</h3>
              <p className="text-sm text-muted-foreground">
                Adjust the crop area to frame your picture perfectly
              </p>
            </div>
            <div className="max-h-96 overflow-hidden rounded-lg border">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                aspect={1}
                circularCrop
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  className="max-w-full h-auto"
                />
              </ReactCrop>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setStep('select')}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleCropComplete} className="bg-emerald-500 hover:bg-emerald-600">
                <CropIcon className="h-4 w-4 mr-2" />
                Apply Crop
              </Button>
            </div>
          </div>
        );
      case 'preview':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t('previewUpload')}</h3>
              <p className="text-sm text-muted-foreground">
                This is how your profile picture will look
              </p>
            </div>
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-200">
                <img 
                  src={croppedImageUrl} 
                  alt="Cropped preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setStep('crop')}
                disabled={isUploading}
              >
                <CropIcon className="h-4 w-4 mr-2" />
                Re-crop
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={isUploading}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Picture
                  </>
                )}
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-emerald-500" />
              Update Profile Picture
            </DialogTitle>
          </DialogHeader>
          {uploadError && (
            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                {uploadError}
              </AlertDescription>
            </Alert>
          )}
          {renderContent()}
          <div className="text-xs text-muted-foreground text-center">
            Your profile picture will be visible to other users on the platform.
            <br />
            Make sure it&apos;s appropriate and represents you well.
          </div>
        </DialogContent>
      </Dialog>
      {/* Hidden canvas for cropping */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
    </>
  );
} 