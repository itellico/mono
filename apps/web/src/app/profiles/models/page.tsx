'use client';

/**
 * Model Profiles Page
 * 
 * Main page for viewing and managing Model professional profiles
 * Includes list view, profile creation, and profile management
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProfessionalProfile } from '@prisma/client';
import { useRouter } from 'next/navigation';
import ModelProfileList from '@/components/profiles/ModelProfileList';
import ModelProfileForm from '@/components/profiles/ModelProfileForm';
import ModelProfileView from '@/components/profiles/ModelProfileView';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { professionalProfilesService } from '@/lib/services/professional-profiles.service';
import { CreateModelProfile, UpdateModelProfile } from '@/lib/schemas/professional-profiles';

// This would normally come from auth context or session
const MOCK_TENANT_ID = 1;
const MOCK_USER_ID = 1;

type PageMode = 'list' | 'create' | 'view' | 'edit';

export default function ModelProfilesPage() {
  const router = useRouter();
  const [currentMode, setCurrentMode] = useState<PageMode>('list');
  const [selectedProfile, setSelectedProfile] = useState<ProfessionalProfile | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  // Get current user's profiles
  const { data: userProfiles, refetch: refetchUserProfiles } = useQuery({
    queryKey: ['user-profiles', MOCK_TENANT_ID, MOCK_USER_ID],
    queryFn: async () => {
      return await professionalProfilesService.getUserProfiles(MOCK_USER_ID, MOCK_TENANT_ID);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleCreateProfile = async (data: CreateModelProfile) => {
    try {
      const newProfile = await professionalProfilesService.createProfile({
        ...data,
        userId: MOCK_USER_ID,
        tenantId: MOCK_TENANT_ID,
      });
      
      toast({
        title: "Success",
        description: "Model profile created successfully!",
      });
      
      setShowDialog(false);
      setCurrentMode('list');
      refetchUserProfiles();
      
      // Navigate to the new profile
      setSelectedProfile(newProfile);
      setCurrentMode('view');
      
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProfile = async (data: UpdateModelProfile) => {
    if (!selectedProfile) return;
    
    try {
      const updatedProfile = await professionalProfilesService.updateProfile(
        selectedProfile.id,
        data,
        MOCK_TENANT_ID
      );
      
      toast({
        title: "Success",
        description: "Model profile updated successfully!",
      });
      
      setSelectedProfile(updatedProfile);
      setCurrentMode('view');
      refetchUserProfiles();
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProfileClick = async (profile: ProfessionalProfile) => {
    try {
      // Fetch full profile details
      const fullProfile = await professionalProfilesService.getProfile(profile.id, MOCK_TENANT_ID);
      if (fullProfile) {
        setSelectedProfile(fullProfile);
        setCurrentMode('view');
        
        // Increment view count
        await professionalProfilesService.incrementProfileViews(profile.id, MOCK_TENANT_ID);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile details.",
        variant: "destructive",
      });
    }
  };

  const handleStartCreate = () => {
    setCurrentMode('create');
    setShowDialog(true);
  };

  const handleStartEdit = () => {
    setCurrentMode('edit');
    setShowDialog(true);
  };

  const handleCancelDialog = () => {
    setShowDialog(false);
    setCurrentMode(selectedProfile ? 'view' : 'list');
  };

  const handleBackToList = () => {
    setSelectedProfile(null);
    setCurrentMode('list');
  };

  const handleContact = () => {
    // This would typically open a contact modal or navigate to messaging
    toast({
      title: "Contact Feature",
      description: "Contact functionality would be implemented here.",
    });
  };

  // Check if user already has a model profile
  const hasModelProfile = userProfiles?.some(p => p.profileType === 'MODEL');

  return (
    <div className="container mx-auto py-6">
      {currentMode === 'list' && (
        <ModelProfileList
          tenantId={MOCK_TENANT_ID}
          onProfileClick={handleProfileClick}
          showCreateButton={!hasModelProfile} // Only show if user doesn't have a model profile
          onCreateProfile={handleStartCreate}
        />
      )}

      {currentMode === 'view' && selectedProfile && (
        <div>
          <div className="mb-4">
            <Button variant="outline" onClick={handleBackToList}>
              ← Back to Models
            </Button>
          </div>
          <ModelProfileView
            profile={selectedProfile as any}
            isOwner={selectedProfile.userId === MOCK_USER_ID}
            onEdit={handleStartEdit}
            onContact={handleContact}
          />
        </div>
      )}

      {/* Create/Edit Profile Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentMode === 'create' ? 'Create Model Profile' : 'Edit Model Profile'}
            </DialogTitle>
          </DialogHeader>
          
          <ModelProfileForm
            initialData={currentMode === 'edit' ? selectedProfile as UpdateModelProfile : undefined}
            isEditing={currentMode === 'edit'}
            onSubmit={currentMode === 'create' ? handleCreateProfile : handleUpdateProfile}
            onCancel={handleCancelDialog}
            tenantId={MOCK_TENANT_ID}
            userId={MOCK_USER_ID}
          />
        </DialogContent>
      </Dialog>

      {/* Profile Management Notice */}
      {hasModelProfile && currentMode === 'list' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-blue-900">You have a Model Profile</h3>
              <p className="text-sm text-blue-700">
                You can view and edit your existing model profile from the list below.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                const myProfile = userProfiles?.find(p => p.profileType === 'MODEL');
                if (myProfile) {
                  handleProfileClick(myProfile);
                }
              }}
            >
              View My Profile
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}