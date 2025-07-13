/**
 * Features API Client Service
 * 
 * Handles platform feature management through authenticated NestJS API calls
 * Replaces direct database access with proper middleware flow
 */

import { ApiAuthService } from './api-auth.service';

interface Feature {
  id: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export class FeaturesApiService {
  /**
   * Get all features (requires platform.features.view permission)
   */
  static async getFeatures(query?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ items: Feature[]; pagination: any } | null> {
    const queryString = query ? new URLSearchParams(
      Object.entries(query).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';

    const endpoint = `/platform/system/features${queryString ? `?${queryString}` : ''}`;
    return await ApiAuthService.makeAuthenticatedRequest<{ items: Feature[]; pagination: any }>(endpoint);
  }

  /**
   * Get feature by ID (requires platform.features.view permission)
   */
  static async getFeature(featureId: string): Promise<Feature | null> {
    return await ApiAuthService.makeAuthenticatedRequest<Feature>(`/platform/system/features/${featureId}`);
  }

  /**
   * Create new feature (requires platform.features.create permission)
   */
  static async createFeature(featureData: {
    name: string;
    description?: string;
    isEnabled?: boolean;
  }): Promise<Feature | null> {
    return await ApiAuthService.makeAuthenticatedRequest<Feature>('/platform/system/features', {
      method: 'POST',
      body: JSON.stringify(featureData)
    });
  }

  /**
   * Update feature (requires platform.features.update permission)
   */
  static async updateFeature(featureId: string, featureData: {
    name?: string;
    description?: string;
    isEnabled?: boolean;
  }): Promise<Feature | null> {
    return await ApiAuthService.makeAuthenticatedRequest<Feature>(`/platform/system/features/${featureId}`, {
      method: 'PUT',
      body: JSON.stringify(featureData)
    });
  }

  /**
   * Delete feature (requires platform.features.delete permission)
   */
  static async deleteFeature(featureId: string): Promise<boolean> {
    const result = await ApiAuthService.makeAuthenticatedRequest<any>(`/platform/system/features/${featureId}`, {
      method: 'DELETE'
    });
    return result !== null;
  }
}