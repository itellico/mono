'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

// Get current user's profile
export function useCurrentUserProfile() {
  return useQuery({
    queryKey: ['user-profile', 'me'],
    queryFn: async () => {
      const response = await apiClient.getCurrentUserProfile();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch user profile');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Update current user's profile
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      firstName?: string;
      lastName?: string;
      phone?: string | null;
      dateOfBirth?: string | null;
      bio?: string | null;
      location?: string | null;
      website?: string | null;
      socialLinks?: any;
      preferences?: any;
    }) => {
      const response = await apiClient.updateCurrentUserProfile(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update profile');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
}

// Update user avatar
export function useUpdateUserAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { avatar: string | null }) => {
      const response = await apiClient.updateUserAvatar(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update avatar');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Avatar updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update avatar');
    },
  });
}

// Change user password
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) => {
      const response = await apiClient.changeUserPassword(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to change password');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to change password');
    },
  });
}

// Get user activity history
export function useUserActivity(params?: {
  page?: number;
  limit?: number;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: ['user-activity', params],
    queryFn: async () => {
      const response = await apiClient.getUserActivity(params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch user activity');
      }
      return response.data;
    },
  });
}

// Get user security settings
export function useUserSecurity() {
  return useQuery({
    queryKey: ['user-security'],
    queryFn: async () => {
      const response = await apiClient.getUserSecurity();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch security settings');
      }
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

// Delete user account
export function useDeleteUserAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      password: string;
      reason?: string;
      feedback?: string;
    }) => {
      const response = await apiClient.deleteUserAccount(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete account');
      }
      return response.data;
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      // Clear tokens
      apiClient.clearTokens();
      toast.success('Account deleted successfully');
      // Redirect to home page or login
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete account');
    },
  });
}

// Request email verification
export function useRequestEmailVerification() {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.requestEmailVerification();
      if (!response.success) {
        throw new Error(response.error || 'Failed to send verification email');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Verification email sent successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send verification email');
    },
  });
}

// Hook for profile completeness calculation
export function useProfileCompleteness() {
  const { data: profileData } = useCurrentUserProfile();

  if (!profileData?.profile) {
    return { completeness: 0, missingFields: [], suggestions: [] };
  }

  const profile = profileData.profile;
  
  const requiredFields = [
    { field: 'firstName', label: 'First Name', value: profile.firstName },
    { field: 'lastName', label: 'Last Name', value: profile.lastName },
    { field: 'email', label: 'Email', value: profile.email },
  ];

  const optionalFields = [
    { field: 'phone', label: 'Phone Number', value: profile.phone },
    { field: 'dateOfBirth', label: 'Date of Birth', value: profile.dateOfBirth },
    { field: 'bio', label: 'Bio', value: profile.bio },
    { field: 'location', label: 'Location', value: profile.location },
    { field: 'website', label: 'Website', value: profile.website },
    { field: 'avatar', label: 'Profile Picture', value: profile.avatar },
  ];

  const completedRequired = requiredFields.filter(f => f.value).length;
  const completedOptional = optionalFields.filter(f => f.value).length;
  const totalFields = requiredFields.length + optionalFields.length;
  const completedFields = completedRequired + completedOptional;

  const completeness = Math.round((completedFields / totalFields) * 100);
  
  const missingFields = [
    ...requiredFields.filter(f => !f.value),
    ...optionalFields.filter(f => !f.value),
  ];

  const suggestions = [];
  if (!profile.avatar) suggestions.push('Add a profile picture to help others recognize you');
  if (!profile.bio) suggestions.push('Add a bio to tell others about yourself');
  if (!profile.location) suggestions.push('Add your location to connect with people nearby');
  if (!profile.phone && !profile.isPhoneVerified) suggestions.push('Add and verify your phone number for better security');

  return {
    completeness,
    missingFields,
    suggestions,
    isComplete: completeness >= 80,
    requiredComplete: completedRequired === requiredFields.length,
  };
}

// Hook for user preferences management
export function useUserPreferences() {
  const { data: profileData } = useCurrentUserProfile();
  const updateProfile = useUpdateUserProfile();

  const preferences = profileData?.profile?.preferences || {};

  const updatePreferences = (newPreferences: any) => {
    updateProfile.mutate({
      preferences: {
        ...preferences,
        ...newPreferences,
      },
    });
  };

  return {
    preferences,
    updatePreferences,
    isLoading: updateProfile.isPending,
  };
}

// Hook for social links management
export function useSocialLinks() {
  const { data: profileData } = useCurrentUserProfile();
  const updateProfile = useUpdateUserProfile();

  const socialLinks = profileData?.profile?.socialLinks || {};

  const updateSocialLinks = (newSocialLinks: any) => {
    updateProfile.mutate({
      socialLinks: {
        ...socialLinks,
        ...newSocialLinks,
      },
    });
  };

  const supportedPlatforms = [
    { key: 'twitter', label: 'Twitter', icon: '🐦', baseUrl: 'https://twitter.com/' },
    { key: 'linkedin', label: 'LinkedIn', icon: '💼', baseUrl: 'https://linkedin.com/in/' },
    { key: 'github', label: 'GitHub', icon: '🐱', baseUrl: 'https://github.com/' },
    { key: 'instagram', label: 'Instagram', icon: '📷', baseUrl: 'https://instagram.com/' },
    { key: 'facebook', label: 'Facebook', icon: '📘', baseUrl: 'https://facebook.com/' },
  ];

  return {
    socialLinks,
    updateSocialLinks,
    supportedPlatforms,
    isLoading: updateProfile.isPending,
  };
}