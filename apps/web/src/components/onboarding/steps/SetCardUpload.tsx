'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { OnboardingData } from '../OnboardingFlow';
interface SetCardUploadProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}
type PhotoType = 'bodyShot' | 'portrait' | 'actionShot' | 'lifestyle' | 'professional';
const requiredPhotos = [
  {
    type: 'bodyShot' as PhotoType,
    title: 'Body Shot',
    description: 'Full-body professional photograph with clear lighting',
    requirements: ['Full body visible', 'Professional lighting', 'Appropriate attire', 'Min 1080x1080px']
  },
  {
    type: 'portrait' as PhotoType,
    title: 'Portrait',
    description: 'Head and shoulders professional shot with sharp focus',
    requirements: ['Head & shoulders', 'Sharp focus on face', 'Professional lighting', 'Min 1080x1080px']
  },
  {
    type: 'actionShot' as PhotoType,
    title: 'Action Shot',
    description: 'Dynamic movement photograph showing physical capability',
    requirements: ['Dynamic movement', 'Physical capability', 'Professional context', 'Min 1080x1080px']
  },
  {
    type: 'lifestyle' as PhotoType,
    title: 'Lifestyle',
    description: 'Casual/lifestyle context in natural environment',
    requirements: ['Natural environment', 'Lifestyle context', 'Authentic representation', 'Min 1080x1080px']
  },
  {
    type: 'professional' as PhotoType,
    title: 'Professional',
    description: 'Formal/business context with professional attire',
    requirements: ['Business attire', 'Professional setting', 'Formal presentation', 'Min 1080x1080px']
  }
];
export default function SetCardUpload({ data, onUpdate }: SetCardUploadProps) {
  const [photos, setPhotos] = useState(data.setCardPhotos || {
    bodyShot: null,
    portrait: null,
    actionShot: null,
    lifestyle: null,
    professional: null,
  });
  useEffect(() => {
    onUpdate({ setCardPhotos: photos });
  }, [photos, onUpdate]);
  const isModelType = data.userType?.includes('model');
  if (!isModelType) {
    return (
      <div className="text-center">
        <p className="text-gray-600">Set card photos are only required for model accounts.</p>
      </div>
    );
  }
  const handleFileSelect = (photoType: PhotoType, file: File | null) => {
    setPhotos(prev => ({
      ...prev,
      [photoType]: file
    }));
  };
  const uploadedCount = Object.values(photos).filter(photo => photo !== null).length;
  const allPhotosUploaded = uploadedCount === 5;
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Set Card Photos
        </h2>
        <p className="text-gray-600">
          Upload 5 professional photos to complete your modeling portfolio
        </p>
        <div className="mt-4">
          <Badge variant={allPhotosUploaded ? "default" : "secondary"} className="px-4 py-2">
            {uploadedCount}/5 Photos Uploaded
          </Badge>
        </div>
      </div>
      <Alert className="border-blue-200 bg-blue-50">
        <Camera className="h-4 w-4" />
        <AlertDescription className="text-blue-800">
          <strong>Important:</strong> All photos must be professional quality, minimum 1080x1080 pixels, 
          and between 2-10MB in size. These photos will be reviewed by our team.
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {requiredPhotos.map((photoReq) => {
          const isUploaded = photos[photoReq.type] !== null;
          return (
            <Card key={photoReq.type} className={`
              transition-all duration-200 
              ${isUploaded ? 'border-green-200 bg-green-50' : 'border-gray-200'}
            `}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      ${isUploaded ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}
                    `}>
                      {isUploaded ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </div>
                    {photoReq.title}
                  </CardTitle>
                  {isUploaded && (
                    <Badge variant="default" className="bg-green-500">
                      Uploaded
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {photoReq.description}
                </p>
              </CardHeader>
              <CardContent>
                {/* Upload Area */}
                <div className={`
                  border-2 border-dashed rounded-lg p-6 text-center transition-colors
                  ${isUploaded 
                    ? 'border-green-300 bg-green-25' 
                    : 'border-gray-300 hover:border-gray-400'
                  }
                `}>
                  <input
                    type="file"
                    id={`upload-${photoReq.type}`}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleFileSelect(photoReq.type, file);
                    }}
                    className="hidden"
                  />
                  {isUploaded ? (
                    <div className="space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
                      <p className="text-sm font-medium text-green-700">
                        {photos[photoReq.type]?.name}
                      </p>
                      <p className="text-xs text-green-600">
                        {Math.round((photos[photoReq.type]?.size || 0) / 1024 / 1024 * 100) / 100} MB
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`upload-${photoReq.type}`)?.click()}
                        className="mt-2"
                      >
                        Replace Photo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                      <div>
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById(`upload-${photoReq.type}`)?.click()}
                          className="mb-2"
                        >
                          Upload Photo
                        </Button>
                        <p className="text-xs text-gray-500">
                          JPG, PNG up to 10MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {/* Requirements */}
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Requirements:</p>
                  <div className="space-y-1">
                    {photoReq.requirements.map((req, index) => (
                      <div key={index} className="flex items-center text-xs text-gray-600">
                        <div className="w-1 h-1 bg-gray-400 rounded-full mr-2" />
                        {req}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Progress Summary */}
      {uploadedCount > 0 && !allPhotosUploaded && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-amber-800">
            Great progress! You&apos;ve uploaded {uploadedCount} of 5 required photos. 
            Upload {5 - uploadedCount} more to complete your set card.
          </AlertDescription>
        </Alert>
      )}
      {allPhotosUploaded && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription className="text-green-800">
            <strong>Excellent!</strong> You&apos;ve uploaded all 5 required photos. 
            Your set card is complete and ready for review.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 