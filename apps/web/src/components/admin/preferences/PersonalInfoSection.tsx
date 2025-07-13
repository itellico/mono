'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCurrentUserProfile, useUpdateUserProfile, useUpdateUserAvatar } from '@/hooks/useUserProfile';
import { UniversalMediaUploader, MediaAsset } from '@/components/media/UniversalMediaUploader';
import { useComponentLogger } from '@/lib/platform/logging';
import { Save, Check, AlertCircle, User, Calendar, Phone, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhoneInputPremium } from '@/components/ui/phone-input-premium';

export function PersonalInfoSection() {
  const log = useComponentLogger('PersonalInfoSection');
  const { data: profileData, isLoading } = useCurrentUserProfile();
  const updateProfile = useUpdateUserProfile();
  const updateAvatar = useUpdateUserAvatar();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    bio: '',
    location: '',
    website: '',
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);


  // Initialize form data when profile loads
  useEffect(() => {
    if (profileData?.profile) {
      const profile = profileData.profile;
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
      });
      setHasChanges(false);
      log.debug('Profile data loaded', { userId: profile.id });
    }
  }, [profileData, log]);


  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

  const handleAvatarUpload = useCallback(async (mediaAssets: MediaAsset[]) => {
    if (mediaAssets.length > 0) {
      const asset = mediaAssets[0];
      try {
        await updateAvatar.mutateAsync({ avatar: asset.cdnUrl });
        log.debug('Avatar updated successfully', { mediaAssetId: asset.id });
      } catch (error) {
        log.error('Avatar update failed', { error });
      }
    }
  }, [updateAvatar, log]);

  const getSaveStatus = () => {
    if (updateProfile.isPending) {
      return { icon: Save, text: 'Saving...', color: 'bg-blue-500' };
    }
    if (hasChanges) {
      return { icon: AlertCircle, text: 'Unsaved changes', color: 'bg-orange-500' };
    }
    if (lastSaved) {
      return { icon: Check, text: `Saved ${lastSaved.toLocaleTimeString()}`, color: 'bg-green-500' };
    }
    return { icon: Check, text: 'All saved', color: 'bg-green-500' };
  };

  const status = getSaveStatus();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <Badge className={cn('text-white', status.color)}>
            <status.icon className="h-3 w-3 mr-1" />
            {status.text}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Update your personal details. Click "Save Changes" to apply your updates.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Upload Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Profile Picture</Label>
          <div className="flex items-start gap-4">
            {profileData?.profile?.avatar && (
              <div className="flex-shrink-0">
                <img
                  src={profileData.profile.avatar}
                  alt="Current avatar"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                />
              </div>
            )}
            <div className="flex-1">
              <UniversalMediaUploader
                context="profile_picture"
                maxFiles={1}
                showPreview={false}
                showOptimizationStatus={false}
                onUploadComplete={handleAvatarUpload}
                className="max-w-md"
              />
            </div>
          </div>
        </div>

        {/* Personal Details Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="Enter your first name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Enter your last name"
              required
            />
          </div>

          <div className="space-y-2">
            <PhoneInputPremium
              value={formData.phone}
              onChange={(value) => handleInputChange('phone', value || '')}
              label="Phone Number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date of Birth
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Location
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="City, Country"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>

        {/* Bio Section */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            placeholder="Tell us about yourself..."
            className="min-h-[100px]"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {formData.bio.length}/500 characters
          </p>
        </div>

        {/* Manual Save Button */}
        <div className="flex justify-end pt-4">
          <Button 
            onClick={async () => {
              try {
                await updateProfile.mutateAsync({
                  firstName: formData.firstName || undefined,
                  lastName: formData.lastName || undefined,
                  phone: formData.phone || null,
                  dateOfBirth: formData.dateOfBirth || null,
                  bio: formData.bio || null,
                  location: formData.location || null,
                  website: formData.website || null,
                });
                setHasChanges(false);
                setLastSaved(new Date());
                log.debug('Profile saved successfully');
              } catch (error) {
                log.error('Profile save failed', { error });
              }
            }}
            disabled={updateProfile.isPending || !hasChanges}
            variant={hasChanges ? "default" : "outline"}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 