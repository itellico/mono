/**
 * Limits API Client Service
 * 
 * Handles platform limit management through authenticated NestJS API calls
 * Replaces direct database access with proper middleware flow
 */

import { ApiAuthService } from './api-auth.service';

interface Limit {
  id: string;
  name: string;
  description?: string;
  value: number;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export class LimitsApiService {
  /**
   * Get all limits (requires platform.limits.view permission)
   */
  static async getLimits(): Promise<Limit[]> {
    try {
      // For now, use the billing limits endpoint as fallback
      // TODO: Create dedicated /platform/system/limits endpoints
      const result = await ApiAuthService.makeAuthenticatedRequest<Limit[]>('/account/billing/limits');
      
      if (!result) {
        console.warn('Failed to fetch limits from API, returning empty array');
        return [];
      }
      
      // If result is an object with data property, extract it
      if (typeof result === 'object' && 'data' in result) {
        return (result as any).data || [];
      }
      
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching limits:', error);
      return [];
    }
  }

  /**
   * Get limit by ID (requires platform.limits.view permission)
   */
  static async getLimit(id: string): Promise<Limit | null> {
    try {
      // TODO: Implement dedicated endpoint when available
      const limits = await this.getLimits();
      return limits.find(limit => limit.id === id) || null;
    } catch (error) {
      console.error('Error fetching limit:', error);
      return null;
    }
  }

  /**
   * Create new limit (requires platform.limits.create permission)
   */
  static async createLimit(limitData: {
    name: string;
    description?: string;
    value: number;
    type: string;
  }): Promise<Limit | null> {
    try {
      // TODO: Implement when dedicated endpoint is available
      console.warn('createLimit not yet implemented in API');
      return null;
    } catch (error) {
      console.error('Error creating limit:', error);
      return null;
    }
  }

  /**
   * Update limit (requires platform.limits.update permission)
   */
  static async updateLimit(id: string, limitData: {
    name?: string;
    description?: string;
    value?: number;
    type?: string;
  }): Promise<Limit | null> {
    try {
      // TODO: Implement when dedicated endpoint is available
      console.warn('updateLimit not yet implemented in API');
      return null;
    } catch (error) {
      console.error('Error updating limit:', error);
      return null;
    }
  }

  /**
   * Delete limit (requires platform.limits.delete permission)
   */
  static async deleteLimit(id: string): Promise<boolean> {
    try {
      // TODO: Implement when dedicated endpoint is available
      console.warn('deleteLimit not yet implemented in API');
      return false;
    } catch (error) {
      console.error('Error deleting limit:', error);
      return false;
    }
  }
}