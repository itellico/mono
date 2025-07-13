/**
 * Professional Profiles Service
 * 
 * Frontend service layer for managing professional profiles (Models, Photographers, Agencies, Clients)
 * Communicates with Fastify API server following the five-tier architecture
 */

import { apiClient } from '@/lib/api-client';
import { ProfileType, ProfileStatus } from '@prisma/client';
import { 
  ModelProfileSchema, 
  PhotographerProfileSchema,
  CreateModelProfileSchema,
  UpdateModelProfileSchema,
  validateProfileCompletion,
  ModelSearchFiltersSchema,
  PhotographerSearchFiltersSchema,
  type ModelProfile,
  type PhotographerProfile,
  type CreateModelProfile,
  type UpdateModelProfile,
  type ModelSearchFilters,
  type PhotographerSearchFilters
} from '@/lib/schemas/professional-profiles';
export class ProfessionalProfilesService {
  
  /**
   * Create a new professional profile
   */
  async createProfile(data: CreateModelProfile & { profileType: ProfileType }): Promise<any> {
    try {
      const response = await apiClient.post('/v1/user/professional-profiles', data);
      return response.data.profile;
    } catch (error) {
      console.error('Error creating professional profile:', error);
      throw error;
    }
  }
  
  /**
   * Get professional profile by ID
   */
  async getProfile(id: number): Promise<any | null> {
    try {
      const response = await apiClient.get(`/v1/user/professional-profiles/${id}`);
      return response.data.profile;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error getting professional profile:', error);
      throw error;
    }
  }
  
  /**
   * Get professional profile by slug (public)
   */
  async getProfileBySlug(slug: string): Promise<any | null> {
    try {
      const response = await apiClient.get(`/v1/public/professional-profiles/${slug}`);
      return response.data.profile;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error getting profile by slug:', error);
      throw error;
    }
  }
  
  /**
   * Get all profiles for current user
   */
  async getUserProfiles(): Promise<any[]> {
    try {
      const response = await apiClient.get('/v1/user/professional-profiles');
      return response.data.profiles;
    } catch (error) {
      console.error('Error getting user profiles:', error);
      throw error;
    }
  }
  
  /**
   * Update professional profile
   */
  async updateProfile(
    id: number, 
    data: UpdateModelProfile,
    section?: string
  ): Promise<any> {
    try {
      const params = section ? `?section=${section}` : '';
      const response = await apiClient.put(`/v1/user/professional-profiles/${id}${params}`, data);
      return response.data.profile;
    } catch (error) {
      console.error('Error updating professional profile:', error);
      throw error;
    }
  }
  
  /**
   * Search profiles with filters (public)
   */
  async searchProfiles(
    filters: ModelSearchFilters | PhotographerSearchFilters,
    profileType: ProfileType,
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const params = new URLSearchParams({
        profileType,
        page: page.toString(),
        limit: limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined)
        ),
      });
      
      const response = await apiClient.get(`/v1/public/professional-profiles?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error searching profiles:', error);
      throw error;
    }
  }
  
  /**
   * Delete professional profile
   */
  async deleteProfile(id: number): Promise<void> {
    try {
      await apiClient.delete(`/v1/user/professional-profiles/${id}`);
    } catch (error) {
      console.error('Error deleting professional profile:', error);
      throw error;
    }
  }
  
  /**
   * Update profile view count
   */
  async incrementProfileViews(id: number): Promise<void> {
    try {
      await apiClient.post(`/v1/user/professional-profiles/${id}/views`);
    } catch (error) {
      console.error('Error incrementing profile views:', error);
      // Don't throw error for view counting
    }
  }
  
  /**
   * Validate profile data based on type
   */
  validateProfileData(data: any) {
    switch (data.profileType) {
      case ProfileType.MODEL:
        return ModelProfileSchema.parse(data);
      case ProfileType.PHOTOGRAPHER:
        return PhotographerProfileSchema.parse(data);
      default:
        throw new Error(`Unsupported profile type: ${data.profileType}`);
    }
  }
}

// Export singleton instance
export const professionalProfilesService = new ProfessionalProfilesService();